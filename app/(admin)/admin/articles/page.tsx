"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import type { PaginatedResponse, Post } from "@/types";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

type PostsPayload =
  | PaginatedResponse<Post>
  | { data?: PaginatedResponse<Post> | Post[] }
  | Post[];

function resolvePostsPayload(payload: any): PaginatedResponse<Post> {
  if (payload?.meta && Array.isArray(payload?.data)) {
    return payload;
  }
  if (payload?.data?.meta && Array.isArray(payload?.data?.data)) {
    return payload.data;
  }

  let data: Post[] = [];
  if (Array.isArray(payload?.data)) {
    data = payload.data;
  } else if (Array.isArray(payload)) {
    data = payload;
  }

  return {
    data,
    meta: {
      total: data.length,
      page: 1,
      limit: Math.max(data.length, 10),
      totalPages: 1,
    },
  };
}

function getStatusBadge(status: string) {
  switch (status) {
    case "PUBLISHED":
      return {
        bg: "bg-green-500/10",
        text: "text-green-400",
        border: "border-green-500/20",
        dot: "bg-green-400",
        label: "Published",
      };
    case "DRAFT":
      return {
        bg: "bg-yellow-500/10",
        text: "text-yellow-400",
        border: "border-yellow-500/20",
        dot: "bg-yellow-400",
        label: "Draft",
      };
    case "REVIEW":
      return {
        bg: "bg-violet-500/10",
        text: "text-violet-300",
        border: "border-violet-500/20",
        dot: "bg-violet-300",
        label: "In Review",
      };
    case "ARCHIVED":
      return {
        bg: "bg-gray-500/10",
        text: "text-gray-400",
        border: "border-gray-500/20",
        dot: "bg-gray-400",
        label: "Archived",
      };
    case "SCHEDULED":
      return {
        bg: "bg-cyan-500/10",
        text: "text-cyan-400",
        border: "border-cyan-500/20",
        dot: "bg-cyan-400",
        label: "Scheduled",
      };
    default:
      return {
        bg: "bg-gray-500/10",
        text: "text-gray-400",
        border: "border-gray-500/20",
        dot: "bg-gray-400",
        label: status,
      };
  }
}

function getAuthorInitials(post: Post) {
  return (
    `${post.author?.firstName?.[0] || ""}${post.author?.lastName?.[0] || ""}` ||
    "AU"
  );
}

export default function ArticlesPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStage, setImportStage] = useState("");
  const [isBatchTranslating, setIsBatchTranslating] = useState(false);
  const [batchResult, setBatchResult] = useState<{
    total: number;
    results: { id: string; slug: string; status: string; error?: string }[];
  } | null>(null);

  const fetchPosts = useCallback(
    async (showRefreshing = false) => {
      try {
        if (showRefreshing) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setErrorMessage("");

        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: "10",
          ...(searchQuery && { search: searchQuery }),
          ...(statusFilter !== "all" && { status: statusFilter }),
        });

        const response = await apiClient.get<PostsPayload>(
          `/api/v1/posts?${params}`,
        );
        const resolved = resolvePostsPayload(response);

        setPosts(resolved?.data || []);
        setTotalPages(resolved?.meta?.totalPages || 1);
        setTotalPosts(resolved?.meta?.total || 0);
      } catch {
        setPosts([]);
        setTotalPages(1);
        setTotalPosts(0);
        setErrorMessage("Khong the tai danh sach bai viet luc nay.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentPage, searchQuery, statusFilter],
  );

  useEffect(() => {
    void fetchPosts();
  }, [fetchPosts]);

  const handleSearch = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCurrentPage(1);
    setSearchQuery(searchInput.trim());
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Ban co chac muon xoa bai viet nay khong?")) {
      return;
    }

    try {
      await apiClient.delete(`/api/v1/posts/${id}`);
      toast.success("Da xoa bai viet");
      void fetchPosts(true);
    } catch {
      toast.error("Khong the xoa bai viet");
    }
  };

  const handleStatusChange = async (post: Post, status: Post["status"]) => {
    try {
      await apiClient.put(`/api/v1/posts/${post.id}`, { status });
      toast.success(`Da chuyen bai viet sang ${status.toLowerCase()}`);
      void fetchPosts(true);
    } catch {
      toast.error("Khong the cap nhat trang thai bai viet");
    }
  };

  const summaryText = useMemo(() => {
    if (loading) return "Dang tai du lieu bai viet...";
    if (errorMessage) return errorMessage;
    if (totalPosts === 0)
      return "Chua co bai viet nao phu hop bo loc hien tai.";
    return `Trang ${currentPage}/${totalPages} - ${totalPosts} bai viet`;
  }, [currentPage, errorMessage, loading, totalPages, totalPosts]);

  const handleNotionImport = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsImporting(true);
    setImportProgress(4);
    setImportStage("Dang tai file Notion len he thong...");

    try {
      const response = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "";

        xhr.open("POST", `${apiBase}/api/v1/posts/import/notion`);
        xhr.withCredentials = true;

        const accessToken = getAccessToken();
        if (accessToken) {
          xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
        }

        xhr.upload.onprogress = (progressEvent) => {
          if (!progressEvent.lengthComputable) {
            return;
          }

          const percent = Math.min(
            72,
            Math.max(
              8,
              Math.round((progressEvent.loaded / progressEvent.total) * 72),
            ),
          );
          setImportProgress(percent);
          setImportStage("Dang upload Notion export...");
        };

        xhr.onload = () => {
          try {
            const payload = JSON.parse(xhr.responseText || "{}");
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(payload);
              return;
            }

            reject(
              new Error(payload?.error || "Khong the import bai viet Notion"),
            );
          } catch {
            reject(new Error("Khong the doc phan hoi import tu server"));
          }
        };

        xhr.onerror = () => reject(new Error("Import Notion that bai"));
        xhr.send(formData);
      });

      setImportProgress(88);
      setImportStage("Dang xu ly noi dung, asset va tao draft...");

      const post = response?.data;
      if (!post?.id) {
        throw new Error("Khong nhan duoc bai viet sau khi import");
      }

      setImportProgress(100);
      setImportStage("Import hoan tat, dang mo editor...");
      toast.success("Da import bai viet tu Notion");
      router.push(`/admin/articles/${post.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Khong the import bai viet tu Notion",
      );
      setImportStage("Import that bai");
      setImportProgress(0);
    } finally {
      setTimeout(() => {
        setIsImporting(false);
        setImportProgress(0);
        setImportStage("");
      }, 900);
    }
  };

  const handleBatchTranslate = async () => {
    const limitInput = globalThis.window.prompt(
      "So luong bai viet muon dich (1-20). He thong se tu dong dich cac bai PUBLISHED chua co ban tieng Anh:",
      "5",
    );

    if (!limitInput) return;
    const limit = Math.min(20, Math.max(1, parseInt(limitInput, 10) || 5));

    try {
      setIsBatchTranslating(true);
      setBatchResult(null);
      const response = await apiClient.post<any>(
        "/api/v1/posts/batch-translate",
        { limit },
      );
      const result = response?.data || response;
      setBatchResult(result);

      const successCount =
        result?.results?.filter((r: any) => r.status === "success").length || 0;
      toast.success(`Da dich ${successCount}/${result?.total || 0} bai viet`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Loi khi dich hang loat",
      );
    } finally {
      setIsBatchTranslating(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--text-main-theme)]">
            Quan ly bai viet
          </h1>
          <p className="theme-muted mt-1 text-sm">
            Tao, cap nhat va dieu phoi luong xuat ban cho blog.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void handleBatchTranslate()}
            disabled={isBatchTranslating}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-emerald-700 bg-emerald-900/30 px-4 text-sm font-bold text-emerald-400 transition-colors hover:bg-emerald-900/60 disabled:opacity-50"
          >
            <span
              className={`material-symbols-outlined text-[18px] ${isBatchTranslating ? "animate-spin" : ""}`}
            >
              {isBatchTranslating ? "sync" : "translate"}
            </span>
            {isBatchTranslating ? "Dang dich..." : "Batch Translate EN"}
          </button>
          <label className="theme-panel-muted theme-border inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-bold text-[color:var(--text-main-theme)] transition hover:border-primary hover:text-primary">
            <span className="material-symbols-outlined text-[18px]">
              upload_file
            </span>
            Import tu Notion
            <input
              type="file"
              accept=".zip,application/zip,application/x-zip-compressed"
              className="hidden"
              onChange={(event) => void handleNotionImport(event)}
              disabled={isImporting}
            />
          </label>
          <Link
            href="/admin/articles/new"
            className="theme-glow-button inline-flex h-10 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold transition-opacity hover:opacity-95"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Bai viet moi
          </Link>
        </div>
      </div>

      {isImporting ? (
        <div className="theme-panel rounded-2xl p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[color:var(--text-main-theme)]">
                Importing Notion export
              </p>
              <p className="theme-muted mt-1 text-xs">{importStage}</p>
            </div>
            <span className="text-sm font-semibold text-primary">
              {importProgress}%
            </span>
          </div>
          <div className="theme-panel-muted mt-4 h-3 overflow-hidden rounded-full">
            <div
              className="h-full rounded-full bg-[image:var(--primary-glow-theme)] transition-all duration-300"
              style={{ width: `${importProgress}%` }}
            />
          </div>
        </div>
      ) : null}

      {batchResult ? (
        <div className="theme-panel rounded-2xl p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[color:var(--text-main-theme)]">
                Ket qua dich hang loat:{" "}
                {
                  batchResult.results.filter((r) => r.status === "success")
                    .length
                }
                /{batchResult.total} thanh cong
              </p>
            </div>
            <button
              type="button"
              onClick={() => setBatchResult(null)}
              className="theme-muted rounded-lg p-1 transition-colors hover:text-[color:var(--text-main-theme)]"
            >
              <span className="material-symbols-outlined text-[18px]">
                close
              </span>
            </button>
          </div>
          <div className="mt-3 space-y-1">
            {batchResult.results.map((r) => (
              <div key={r.id} className="flex items-center gap-2 text-xs">
                <span
                  className={`size-2 rounded-full ${r.status === "success" ? "bg-green-400" : r.status === "skipped" ? "bg-yellow-400" : "bg-red-400"}`}
                />
                <span className="font-mono theme-muted">/{r.slug}</span>
                <span
                  className={
                    r.status === "success"
                      ? "text-green-400"
                      : r.status === "skipped"
                        ? "text-yellow-400"
                        : "text-red-400"
                  }
                >
                  {r.status}
                  {r.error ? `: ${r.error}` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="theme-panel flex flex-col gap-4 rounded-2xl p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-4 sm:flex-row">
          <form
            onSubmit={handleSearch}
            className="group relative w-full sm:max-w-sm"
          >
            <span className="material-symbols-outlined theme-muted absolute left-3 top-2.5 transition-colors group-focus-within:text-primary">
              search
            </span>
            <input
              className="theme-input w-full rounded-2xl py-2 pl-10 pr-4 text-sm"
              placeholder="Tim theo tieu de hoac slug..."
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </form>
          <select
            className="theme-input w-full cursor-pointer rounded-2xl px-4 py-2 text-sm sm:w-44"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">Tat ca trang thai</option>
            <option value="PUBLISHED">Published</option>
            <option value="REVIEW">In Review</option>
            <option value="DRAFT">Draft</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
        <div className="flex items-center justify-between gap-3 md:justify-end">
          <span className="theme-muted text-xs font-mono">{summaryText}</span>
          <button
            onClick={() => void fetchPosts(true)}
            className="theme-muted rounded-lg p-2 transition-colors hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--text-main-theme)]"
            title="Lam moi danh sach"
          >
            <span
              className={`material-symbols-outlined ${refreshing ? "animate-spin" : ""}`}
            >
              refresh
            </span>
          </button>
        </div>
      </div>

      <div className="theme-panel overflow-hidden rounded-2xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead className="theme-border theme-muted border-b bg-[color:var(--surface-muted)] text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Article Details</th>
                <th className="px-6 py-4">Author</th>
                <th className="px-6 py-4">Published</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y theme-border text-sm text-[color:var(--text-main-theme)]">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="theme-muted px-6 py-16 text-center"
                  >
                    Dang tai danh sach bai viet...
                  </td>
                </tr>
              ) : errorMessage ? (
                <tr>
                  <td
                    colSpan={5}
                    className="theme-muted px-6 py-16 text-center"
                  >
                    <span className="material-symbols-outlined mb-2 block text-4xl text-[#fa6238]">
                      warning
                    </span>
                    {errorMessage}
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="theme-muted px-6 py-16 text-center"
                  >
                    <span className="material-symbols-outlined mb-2 block text-4xl">
                      article
                    </span>
                    Chua co bai viet nao. Hay tao bai viet dau tien.
                  </td>
                </tr>
              ) : (
                posts.map((post) => {
                  const badge = getStatusBadge(post.status);

                  return (
                    <tr
                      key={post.id}
                      className="group transition-colors hover:bg-[color:var(--surface-muted)]"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <Link
                            href={`/admin/articles/${post.id}`}
                            className="line-clamp-1 text-base font-bold transition-colors hover:text-primary"
                          >
                            {post.title}
                          </Link>
                          <span className="theme-muted text-xs font-mono">
                            /{post.slug}
                          </span>
                          {post.excerpt ? (
                            <p className="theme-muted line-clamp-2 max-w-xl text-xs">
                              {post.excerpt}
                            </p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary ring-2 ring-[#283039]">
                            {getAuthorInitials(post)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {post.author?.firstName} {post.author?.lastName}
                            </span>
                            <span className="theme-muted text-xs">
                              {post._count?.comments || 0} comments
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {post.publishedAt ? (
                          <span className="font-medium">
                            {formatDate(post.publishedAt)}
                          </span>
                        ) : (
                          <span className="theme-soft italic">--</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${badge.dot}`}
                          />
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 opacity-100 transition-opacity sm:opacity-60 group-hover:opacity-100">
                          <Link
                            href={`/admin/articles/${post.id}`}
                            className="theme-muted rounded-lg p-2 transition-colors hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--text-main-theme)]"
                            title="Edit article"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              edit_square
                            </span>
                          </Link>
                          {post.status === "REVIEW" ? (
                            <>
                              <button
                                onClick={() =>
                                  void apiClient
                                    .post(`/api/v1/posts/${post.id}/approve`)
                                    .then(() => {
                                      toast.success(
                                        "Da duyet va publish bai viet",
                                      );
                                      void fetchPosts(true);
                                    })
                                    .catch(() => {
                                      toast.error("Khong the duyet bai viet");
                                    })
                                }
                                className="theme-muted rounded-lg p-2 transition-colors hover:bg-[color:var(--surface-muted)] hover:text-green-400"
                                title="Approve and publish"
                              >
                                <span className="material-symbols-outlined text-[20px]">
                                  task_alt
                                </span>
                              </button>
                              <button
                                onClick={() => {
                                  const rejectionReason =
                                    globalThis.window.prompt(
                                      "Nhap ly do tu choi bai viet",
                                    );
                                  if (!rejectionReason) return;
                                  void apiClient
                                    .post(`/api/v1/posts/${post.id}/reject`, {
                                      rejectionReason,
                                    })
                                    .then(() => {
                                      toast.success("Da tra bai viet ve draft");
                                      void fetchPosts(true);
                                    })
                                    .catch(() => {
                                      toast.error("Khong the tu choi bai viet");
                                    });
                                }}
                                className="theme-muted rounded-lg p-2 transition-colors hover:bg-[color:var(--surface-muted)] hover:text-[#fa6238]"
                                title="Reject review"
                              >
                                <span className="material-symbols-outlined text-[20px]">
                                  cancel
                                </span>
                              </button>
                            </>
                          ) : post.status === "PUBLISHED" ? (
                            <button
                              onClick={() =>
                                void handleStatusChange(post, "DRAFT")
                              }
                              className="theme-muted rounded-lg p-2 transition-colors hover:bg-[color:var(--surface-muted)] hover:text-yellow-400"
                              title="Unpublish"
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                unpublished
                              </span>
                            </button>
                          ) : post.status === "DRAFT" ? (
                            <button
                              onClick={() =>
                                void apiClient
                                  .post(
                                    `/api/v1/posts/${post.id}/submit-review`,
                                  )
                                  .then(() => {
                                    toast.success("Da gui bai viet di review");
                                    void fetchPosts(true);
                                  })
                                  .catch(() => {
                                    toast.error("Khong the gui review");
                                  })
                              }
                              className="theme-muted rounded-lg p-2 transition-colors hover:bg-[color:var(--surface-muted)] hover:text-violet-300"
                              title="Submit for review"
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                rate_review
                              </span>
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                void handleStatusChange(post, "PUBLISHED")
                              }
                              className="theme-muted rounded-lg p-2 transition-colors hover:bg-[color:var(--surface-muted)] hover:text-green-400"
                              title="Publish"
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                publish
                              </span>
                            </button>
                          )}
                          <button
                            onClick={() => void handleDelete(post.id)}
                            className="theme-muted rounded-lg p-2 transition-colors hover:bg-[color:var(--surface-muted)] hover:text-[#fa6238]"
                            title="Delete article"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              delete
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 ? (
          <div className="theme-border flex items-center justify-between border-t px-6 py-4">
            <div className="theme-muted text-sm">
              Page{" "}
              <span className="font-medium text-[color:var(--text-main-theme)]">
                {currentPage}
              </span>{" "}
              of{" "}
              <span className="font-medium text-[color:var(--text-main-theme)]">
                {totalPages}
              </span>{" "}
              ({totalPosts} total)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="theme-panel-muted theme-border rounded-lg border px-3 py-1.5 text-sm font-medium theme-muted transition-colors hover:text-[color:var(--text-main-theme)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              {(() => {
                let startPage = Math.max(1, currentPage - 2);
                let endPage = Math.min(totalPages, startPage + 4);
                if (endPage - startPage < 4) {
                  startPage = Math.max(1, endPage - 4);
                }

                const pages = [];
                for (let page = startPage; page <= endPage; page++) {
                  pages.push(
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${currentPage === page ? "border-primary bg-primary text-white" : "theme-panel-muted theme-border theme-muted hover:text-[color:var(--text-main-theme)]"}`}
                    >
                      {page}
                    </button>,
                  );
                }
                return pages;
              })()}
              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="theme-panel-muted theme-border rounded-lg border px-3 py-1.5 text-sm font-medium theme-muted transition-colors hover:text-[color:var(--text-main-theme)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
