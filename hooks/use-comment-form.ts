"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/api";
import { trackCommentSubmit } from "@/lib/analytics";
import type { PostWithComments } from "@/types";

function unwrap<T>(payload: unknown, fallback: T): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return ((payload as { data?: T }).data ?? fallback) as T;
  }
  return (payload as T) ?? fallback;
}

/**
 * Manages the comment submission form state and API call.
 */
export function useCommentForm(
  post: PostWithComments | null,
  setPost: React.Dispatch<React.SetStateAction<PostWithComments | null>>,
  isAuthenticated: boolean,
) {
  const [form, setForm] = useState({
    authorName: "",
    authorEmail: "",
    content: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleCommentSubmit = async () => {
    if (!post) return;
    if (!form.content.trim())
      return toast.error("Noi dung comment khong duoc de trong");
    if (
      !isAuthenticated &&
      (!form.authorName.trim() || !form.authorEmail.trim())
    ) {
      return toast.error("Vui long nhap ten va email de gui comment");
    }
    try {
      setSubmitting(true);
      await apiClient.post("/api/v1/comments", {
        postId: post.id,
        content: form.content.trim(),
        authorName: isAuthenticated ? undefined : form.authorName.trim(),
        authorEmail: isAuthenticated ? undefined : form.authorEmail.trim(),
      });
      const commentsRes = await apiClient.get(
        `/api/v1/comments/post/${post.id}`,
      );
      setPost((prev) =>
        prev ? { ...prev, comments: unwrap<any[]>(commentsRes, []) } : prev,
      );
      setForm({ authorName: "", authorEmail: "", content: "" });
      trackCommentSubmit(post.slug);
      toast.success("Comment da duoc gui va dang cho duyet");
    } catch {
      toast.error("Khong the gui comment luc nay");
    } finally {
      setSubmitting(false);
    }
  };

  return { form, setForm, submitting, handleCommentSubmit };
}
