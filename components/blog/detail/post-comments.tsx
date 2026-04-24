"use client";

import { formatDate, getInitials } from "@/lib/utils";

/**
 * Post comments section: displays the comment form and existing approved comments.
 */
export function PostComments({
  post,
  isAuthenticated,
  user,
  form,
  setForm,
  submitting,
  handleCommentSubmit,
  handleShare,
}: any) {
  return (
    <section className="mt-14">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-[22px] font-bold text-[color:var(--text-main-theme)]">
            <span className="material-symbols-outlined !text-[22px] text-primary">
              forum
            </span>
            <span>Discussion</span>
          </h3>
          <p className="theme-muted mt-1 text-sm">
            {post.comments?.length || 0} approved comment
            {post.comments?.length === 1 ? "" : "s"} on this article.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            handleShare(
              typeof navigator.share === "function" ? "native" : "copy",
            );
          }}
          className="inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-[color:var(--text-main-theme)] transition-colors hover:text-primary"
          style={{ border: "1px solid var(--border-soft-theme)" }}
        >
          <span className="material-symbols-outlined !text-[18px]">share</span>
          <span>Share</span>
        </button>
      </div>
      <div className="theme-surface mb-8 rounded-2xl p-6">
        {isAuthenticated ? (
          <div className="mb-4 flex items-center gap-2 text-sm">
            <span className="material-symbols-outlined !text-[18px] text-primary">
              account_circle
            </span>
            <span className="theme-muted">Commenting as</span>
            <span className="font-semibold text-[color:var(--text-main-theme)]">
              {user?.firstName} {user?.lastName}
            </span>
          </div>
        ) : (
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              className="theme-input w-full rounded-2xl px-4 py-3 text-sm"
              placeholder="Your name"
              value={form.authorName}
              onChange={(e) =>
                setForm((p: any) => ({ ...p, authorName: e.target.value }))
              }
            />
            <input
              className="theme-input w-full rounded-2xl px-4 py-3 text-sm"
              placeholder="Your email"
              type="email"
              value={form.authorEmail}
              onChange={(e) =>
                setForm((p: any) => ({ ...p, authorEmail: e.target.value }))
              }
            />
          </div>
        )}
        <textarea
          className="theme-input w-full rounded-2xl p-4 text-sm leading-relaxed"
          placeholder="Leave a comment..."
          rows={4}
          value={form.content}
          onChange={(e) =>
            setForm((p: any) => ({ ...p, content: e.target.value }))
          }
        />
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => {
              handleCommentSubmit();
            }}
            disabled={submitting}
            className="theme-glow-button inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <span className="material-symbols-outlined !text-[18px]">send</span>
            {submitting ? "Sending..." : "Post Comment"}
          </button>
          <p className="theme-muted hidden text-xs sm:block">
            Comments are moderated before publishing.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {post.comments?.length ? (
          post.comments.map((comment: any) => (
            <div
              key={comment.id}
              className="flex gap-4 rounded-2xl p-4 transition-colors"
              style={{ background: "var(--surface-muted)" }}
            >
              <div
                className="flex size-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ background: "var(--primary-glow-theme)" }}
              >
                {comment.user
                  ? getInitials(
                      `${comment.user.firstName} ${comment.user.lastName}`,
                    )
                  : getInitials(comment.authorName || "Anonymous")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-[color:var(--text-main-theme)]">
                    {comment.user
                      ? `${comment.user.firstName} ${comment.user.lastName}`
                      : comment.authorName || "Anonymous"}
                  </span>
                  <span className="theme-soft text-xs">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                <p className="theme-muted text-sm leading-7">
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div
            className="flex flex-col items-center rounded-2xl py-10"
            style={{ background: "var(--surface-muted)" }}
          >
            <span className="material-symbols-outlined mb-3 !text-[36px] theme-soft">
              chat_bubble_outline
            </span>
            <p className="theme-muted text-sm">
              No comments yet. Be the first to share your thoughts.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
