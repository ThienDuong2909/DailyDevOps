"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  RotateCcw,
  Columns,
  List,
  Calendar,
  User,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  FileText,
  Code2,
  ChevronRight,
  Loader2,
} from "lucide-react";
import type { PostVersion } from "@/types";
import {
  computeLineDiff,
  computeSideBySideDiff,
  stripHtmlToReadableText,
} from "@/lib/diff/text-diff";
import { apiClient } from "@/lib/api";
import { formatRelativeTime, formatDate, getImageUrl } from "@/lib/utils";

export interface CurrentArticleComparisonState {
  title: string;
  subtitle: string;
  slug: string;
  content: string;
  featuredImage: string;
  status: string;
}

interface VisualDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  articleId: string;
  versions: PostVersion[];
  selectedVersionId: string | null;
  onSelectVersionId: (id: string) => void;
  currentArticle: CurrentArticleComparisonState;
  onRollback: (versionId: string, reason: string) => Promise<void>;
}

export function VisualDiffModal({
  isOpen,
  onClose,
  articleId,
  versions,
  selectedVersionId,
  onSelectVersionId,
  currentArticle,
  onRollback,
}: VisualDiffModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [viewMode, setViewMode] = useState<"side-by-side" | "unified">(
    "unified",
  );
  const [diffFormat, setDiffFormat] = useState<"readable" | "html">("readable");
  const [fullVersion, setFullVersion] = useState<PostVersion | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [rollbackReason, setRollbackReason] = useState("");
  const [isRollingBack, setIsRollingBack] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch full details of the selected version (contentHtml, content) if not already loaded
  useEffect(() => {
    if (!isOpen || !selectedVersionId || !articleId) return;

    let isCancelled = false;
    const fetchDetail = async () => {
      try {
        setIsLoadingDetail(true);
        const res = await apiClient.get<{ data?: PostVersion } | PostVersion>(
          `/api/v1/posts/${articleId}/versions/${selectedVersionId}`,
        );
        const data =
          (res as { data?: PostVersion }).data || (res as PostVersion);
        if (!isCancelled && data) {
          setFullVersion(data);
        }
      } catch {
        // Fall back to version in list if endpoint unavailable
        if (!isCancelled) {
          const fallback =
            versions.find((v) => v.id === selectedVersionId) || null;
          setFullVersion(fallback);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingDetail(false);
        }
      }
    };

    void fetchDetail();

    return () => {
      isCancelled = true;
    };
  }, [articleId, isOpen, selectedVersionId, versions]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prepare text comparison targets
  const oldContentRaw = fullVersion?.contentHtml || fullVersion?.content || "";
  const newContentRaw = currentArticle.content || "";

  const oldText = useMemo(() => {
    return diffFormat === "readable"
      ? stripHtmlToReadableText(oldContentRaw)
      : oldContentRaw;
  }, [diffFormat, oldContentRaw]);

  const newText = useMemo(() => {
    return diffFormat === "readable"
      ? stripHtmlToReadableText(newContentRaw)
      : newContentRaw;
  }, [diffFormat, newContentRaw]);

  // Compute diffs
  const lineDiff = useMemo(
    () => computeLineDiff(oldText, newText),
    [oldText, newText],
  );

  const sideBySideDiff = useMemo(
    () => computeSideBySideDiff(oldText, newText),
    [oldText, newText],
  );

  // Metadata comparisons
  const titleChanged =
    fullVersion && fullVersion.title !== currentArticle.title;
  const slugChanged = fullVersion && fullVersion.slug !== currentArticle.slug;
  const subtitleChanged =
    fullVersion &&
    (fullVersion.subtitle || fullVersion.excerpt || "") !==
      currentArticle.subtitle;
  const imageChanged =
    fullVersion &&
    (fullVersion.featuredImage || "") !== (currentArticle.featuredImage || "");

  const handleConfirmRollback = async () => {
    if (!selectedVersionId) return;
    try {
      setIsRollingBack(true);
      await onRollback(selectedVersionId, rollbackReason.trim());
      onClose();
    } finally {
      setIsRollingBack(false);
    }
  };

  if (!isMounted || !isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9998] flex items-center justify-center p-3 sm:p-6"
    >
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Window */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-[9999] flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-cyan-500/20 bg-[var(--surface-elevated)] shadow-2xl transition-all"
      >
        {/* Top Header Bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-cyan-500/15 px-6 py-4 dark:border-cyan-500/20">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
              <RotateCcw className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-main-theme)] sm:text-lg">
                So sánh Lịch sử Phiên bản bài viết
              </h3>
              <p className="text-xs text-[var(--text-muted-theme)]">
                Đối chiếu thay đổi giữa phiên bản lưu trữ và bản thảo hiện tại
                trước khi khôi phục
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[var(--text-muted-theme)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-main-theme)]"
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Toolbar & Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-500/10 bg-[var(--surface-muted)] px-6 py-3 text-xs">
          {/* Version Selector Dropdown */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--text-muted-theme)]">
              Phiên bản đối chiếu:
            </span>
            <select
              value={selectedVersionId || ""}
              onChange={(e) => onSelectVersionId(e.target.value)}
              className="rounded-xl border border-cyan-500/25 bg-[var(--surface-elevated)] px-3 py-1.5 font-medium text-[var(--text-main-theme)] shadow-xs focus:border-cyan-500 focus:outline-none"
            >
              {versions.map((v, idx) => (
                <option key={v.id} value={v.id}>
                  {idx === 0 ? "★ [Bản mới nhất] " : ""}
                  {formatDate(v.createdAt)} ({formatRelativeTime(v.createdAt)})
                  {v.reason ? ` — ${v.reason}` : ""}
                </option>
              ))}
            </select>

            <span className="text-[var(--text-muted-theme)]">vs.</span>
            <span className="rounded-lg bg-cyan-500/10 px-2 py-1 font-bold text-cyan-600 dark:text-cyan-400">
              Bản thảo hiện tại (Draft)
            </span>
          </div>

          {/* View Toggles & Stats */}
          <div className="flex items-center gap-4">
            {/* Diff Stats Badge */}
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-bold text-emerald-600 dark:text-emerald-400">
                +{lineDiff.stats.added} dòng
              </span>
              <span className="rounded bg-rose-500/15 px-1.5 py-0.5 font-bold text-rose-600 dark:text-rose-400">
                -{lineDiff.stats.removed} dòng
              </span>
            </div>

            {/* Format toggle (Readable Text vs Raw HTML) */}
            <div className="flex rounded-xl border border-cyan-500/20 bg-[var(--surface-elevated)] p-0.5">
              <button
                type="button"
                onClick={() => setDiffFormat("readable")}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  diffFormat === "readable"
                    ? "bg-cyan-500 text-white shadow-xs"
                    : "text-[var(--text-muted-theme)] hover:text-[var(--text-main-theme)]"
                }`}
              >
                <FileText className="size-3.5" />
                <span>Chữ thuần túy</span>
              </button>
              <button
                type="button"
                onClick={() => setDiffFormat("html")}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  diffFormat === "html"
                    ? "bg-cyan-500 text-white shadow-xs"
                    : "text-[var(--text-muted-theme)] hover:text-[var(--text-main-theme)]"
                }`}
              >
                <Code2 className="size-3.5" />
                <span>Mã HTML</span>
              </button>
            </div>

            {/* View Mode toggle (Side-by-Side vs Unified) */}
            <div className="flex rounded-xl border border-cyan-500/20 bg-[var(--surface-elevated)] p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("unified")}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  viewMode === "unified"
                    ? "bg-primary text-white shadow-xs"
                    : "text-[var(--text-muted-theme)] hover:text-[var(--text-main-theme)]"
                }`}
                title="Xem dạng gộp dòng tuần tự"
              >
                <List className="size-3.5" />
                <span>Unified</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("side-by-side")}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  viewMode === "side-by-side"
                    ? "bg-primary text-white shadow-xs"
                    : "text-[var(--text-muted-theme)] hover:text-[var(--text-main-theme)]"
                }`}
                title="Xem dạng 2 cột song song"
              >
                <Columns className="size-3.5" />
                <span>Side-by-Side</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Comparison Body */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-[var(--border-soft-theme)] space-y-6">
          {isLoadingDetail && (
            <div className="flex items-center justify-center gap-2 py-4 text-xs font-semibold text-cyan-600">
              <Loader2 className="size-4 animate-spin" />
              <span>Đang nạp chi tiết phiên bản đã chọn...</span>
            </div>
          )}

          {/* Metadata Comparison Card */}
          <div className="rounded-2xl border border-cyan-500/15 bg-[var(--surface-muted)] p-5">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted-theme)]">
              So sánh Thông tin Cơ bản (Metadata)
            </h4>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Title Comparison */}
              <div
                className={`rounded-xl border p-3 ${
                  titleChanged
                    ? "border-amber-500/40 bg-amber-500/5 dark:border-amber-400/30"
                    : "border-cyan-500/10 bg-[var(--surface-elevated)]"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted-theme)]">
                  <span>Tiêu đề bài viết</span>
                  {titleChanged && (
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      Có thay đổi
                    </span>
                  )}
                </div>
                <div className="mt-2 space-y-1.5 text-xs">
                  <div className="flex items-start gap-1.5 text-rose-600 dark:text-rose-400">
                    <span className="font-bold shrink-0">[Cũ]:</span>
                    <span className="line-through">
                      {fullVersion?.title || "(Trống)"}
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <span className="font-bold shrink-0">[Hiện tại]:</span>
                    <span>{currentArticle.title || "(Trống)"}</span>
                  </div>
                </div>
              </div>

              {/* Slug Comparison */}
              <div
                className={`rounded-xl border p-3 ${
                  slugChanged
                    ? "border-amber-500/40 bg-amber-500/5 dark:border-amber-400/30"
                    : "border-cyan-500/10 bg-[var(--surface-elevated)]"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted-theme)]">
                  <span>Đường dẫn (Slug)</span>
                  {slugChanged && (
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      Có thay đổi
                    </span>
                  )}
                </div>
                <div className="mt-2 space-y-1.5 font-mono text-xs">
                  <div className="flex items-start gap-1.5 text-rose-600 dark:text-rose-400">
                    <span className="font-bold shrink-0">[Cũ]:</span>
                    <span className="line-through">
                      /{fullVersion?.slug || ""}
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <span className="font-bold shrink-0">[Hiện tại]:</span>
                    <span>/{currentArticle.slug || ""}</span>
                  </div>
                </div>
              </div>

              {/* Subtitle / Excerpt Comparison */}
              <div
                className={`rounded-xl border p-3 md:col-span-2 ${
                  subtitleChanged
                    ? "border-amber-500/40 bg-amber-500/5 dark:border-amber-400/30"
                    : "border-cyan-500/10 bg-[var(--surface-elevated)]"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted-theme)]">
                  <span>Tóm tắt / Phụ đề bài viết</span>
                  {subtitleChanged && (
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      Có thay đổi
                    </span>
                  )}
                </div>
                <div className="mt-2 space-y-1.5 text-xs">
                  <div className="flex items-start gap-1.5 text-rose-600 dark:text-rose-400">
                    <span className="font-bold shrink-0">[Cũ]:</span>
                    <span className="line-through">
                      {fullVersion?.subtitle ||
                        fullVersion?.excerpt ||
                        "(Trống)"}
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <span className="font-bold shrink-0">[Hiện tại]:</span>
                    <span>{currentArticle.subtitle || "(Trống)"}</span>
                  </div>
                </div>
              </div>

              {/* Featured Image Comparison */}
              {imageChanged && (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 md:col-span-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                    <ImageIcon className="size-4" />
                    <span>Ảnh đại diện (Featured Image) đã thay đổi</span>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <span className="text-[11px] font-semibold text-rose-500">
                        Phiên bản cũ:
                      </span>
                      {fullVersion?.featuredImage ? (
                        <img
                          src={getImageUrl(fullVersion.featuredImage)}
                          alt="Old thumbnail"
                          className="mt-1 h-32 w-full rounded-lg object-cover opacity-80"
                        />
                      ) : (
                        <div className="mt-1 flex h-32 items-center justify-center rounded-lg border border-dashed border-rose-300 text-xs text-rose-400">
                          Không có ảnh
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-emerald-500">
                        Bản thảo hiện tại:
                      </span>
                      {currentArticle.featuredImage ? (
                        <img
                          src={getImageUrl(currentArticle.featuredImage)}
                          alt="Current thumbnail"
                          className="mt-1 h-32 w-full rounded-lg object-cover shadow-sm"
                        />
                      ) : (
                        <div className="mt-1 flex h-32 items-center justify-center rounded-lg border border-dashed border-emerald-300 text-xs text-emerald-400">
                          Không có ảnh
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content Diff Container */}
          <div className="rounded-2xl border border-cyan-500/15 bg-[var(--surface-elevated)] overflow-hidden shadow-xs">
            <div className="flex items-center justify-between border-b border-cyan-500/10 bg-[var(--surface-muted)] px-5 py-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted-theme)]">
                So sánh Nội dung Bài viết (
                {diffFormat === "readable" ? "Văn bản thuần túy" : "Mã HTML"})
              </span>
              <span className="text-[11px] text-[var(--text-muted-theme)]">
                Đỏ gạch ngang: Xóa bỏ | Xanh lá: Thêm mới
              </span>
            </div>

            {/* UNIFIED VIEW */}
            {viewMode === "unified" && (
              <div className="overflow-x-auto p-4 font-mono text-xs leading-relaxed">
                {lineDiff.lines.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[var(--text-muted-theme)]">
                    Nội dung hai phiên bản hoàn toàn giống nhau.
                  </div>
                ) : (
                  <div className="divide-y divide-cyan-500/5">
                    {lineDiff.lines.map((line, idx) => {
                      if (line.type === "added") {
                        return (
                          <div
                            key={idx}
                            className="flex items-start gap-3 border-l-4 border-emerald-500 bg-emerald-500/10 px-3 py-1 text-emerald-900 dark:text-emerald-200"
                          >
                            <span className="w-8 shrink-0 select-none text-[10px] text-emerald-600/70">
                              +{line.newLineNumber}
                            </span>
                            <span className="w-4 shrink-0 font-bold text-emerald-600">
                              +
                            </span>
                            <span className="flex-1 whitespace-pre-wrap break-words">
                              {line.content || " "}
                            </span>
                          </div>
                        );
                      }

                      if (line.type === "removed") {
                        return (
                          <div
                            key={idx}
                            className="flex items-start gap-3 border-l-4 border-rose-500 bg-rose-500/10 px-3 py-1 text-rose-900 line-through opacity-75 dark:text-rose-200"
                          >
                            <span className="w-8 shrink-0 select-none text-[10px] text-rose-600/70">
                              -{line.oldLineNumber}
                            </span>
                            <span className="w-4 shrink-0 font-bold text-rose-600">
                              -
                            </span>
                            <span className="flex-1 whitespace-pre-wrap break-words">
                              {line.content || " "}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={idx}
                          className="flex items-start gap-3 border-l-4 border-transparent px-3 py-1 text-[var(--text-main-theme)] hover:bg-[var(--surface-muted)]"
                        >
                          <span className="w-8 shrink-0 select-none text-[10px] text-[var(--text-muted-theme)]">
                            {line.newLineNumber}
                          </span>
                          <span className="w-4 shrink-0 select-none text-transparent">
                            {" "}
                          </span>
                          <span className="flex-1 whitespace-pre-wrap break-words">
                            {line.content || " "}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SIDE-BY-SIDE VIEW */}
            {viewMode === "side-by-side" && (
              <div className="overflow-x-auto p-4 font-mono text-xs leading-relaxed">
                <div className="grid grid-cols-2 gap-4 border-b border-cyan-500/10 pb-2 mb-2 font-bold text-[11px] uppercase tracking-wider text-[var(--text-muted-theme)]">
                  <div>
                    Phiên bản cũ (
                    {fullVersion?.createdAt
                      ? formatDate(fullVersion.createdAt)
                      : "---"}
                    )
                  </div>
                  <div>Bản thảo hiện tại</div>
                </div>

                {sideBySideDiff.rows.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[var(--text-muted-theme)]">
                    Nội dung hai phiên bản hoàn toàn giống nhau.
                  </div>
                ) : (
                  <div className="divide-y divide-cyan-500/5">
                    {sideBySideDiff.rows.map((row, idx) => (
                      <div key={idx} className="grid grid-cols-2 gap-4 py-1">
                        {/* Left Column (Old) */}
                        <div
                          className={`flex items-start gap-2 rounded px-2 py-0.5 ${
                            row.left?.type === "removed"
                              ? "bg-rose-500/10 text-rose-900 line-through dark:text-rose-200"
                              : "text-[var(--text-main-theme)]"
                          }`}
                        >
                          <span className="w-6 shrink-0 select-none text-[10px] text-[var(--text-muted-theme)]">
                            {row.left?.lineNumber || ""}
                          </span>
                          <span className="flex-1 whitespace-pre-wrap break-words">
                            {row.left?.content || ""}
                          </span>
                        </div>

                        {/* Right Column (Current) */}
                        <div
                          className={`flex items-start gap-2 rounded px-2 py-0.5 ${
                            row.right?.type === "added"
                              ? "bg-emerald-500/10 text-emerald-900 font-medium dark:text-emerald-200"
                              : "text-[var(--text-main-theme)]"
                          }`}
                        >
                          <span className="w-6 shrink-0 select-none text-[10px] text-[var(--text-muted-theme)]">
                            {row.right?.lineNumber || ""}
                          </span>
                          <span className="flex-1 whitespace-pre-wrap break-words">
                            {row.right?.content || ""}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Safe Rollback Bottom Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-cyan-500/15 bg-[var(--surface-muted)] px-6 py-4">
          <div className="flex flex-1 items-center gap-3 min-w-[280px] max-w-xl">
            <span className="text-xs font-semibold text-[var(--text-muted-theme)] shrink-0">
              Ghi chú Rollback:
            </span>
            <input
              type="text"
              value={rollbackReason}
              onChange={(e) => setRollbackReason(e.target.value)}
              placeholder="Nhập lý do hoàn tác (tùy chọn, vd: Khôi phục trước sự cố sửa nhầm)..."
              className="flex-1 rounded-xl border border-cyan-500/20 bg-[var(--surface-elevated)] px-3.5 py-2 text-xs text-[var(--text-main-theme)] placeholder:text-[var(--text-muted-theme)] focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isRollingBack}
              className="rounded-xl border border-cyan-500/25 bg-[var(--surface-elevated)] px-4 py-2 text-xs font-semibold text-[var(--text-main-theme)] transition-colors hover:bg-cyan-500/10"
            >
              Hủy bỏ
            </button>

            <button
              type="button"
              onClick={handleConfirmRollback}
              disabled={isRollingBack || !selectedVersionId}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            >
              {isRollingBack ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Đang hoàn tác...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="size-4" />
                  <span>Khôi phục về phiên bản này</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
