"use client";

import React from "react";
import { AlertTriangle, RotateCcw, Trash2, Clock } from "lucide-react";
import type { ArticleRescueSnapshot } from "@/lib/rescue/offline-rescue";

interface OfflineRescueBannerProps {
  rescueSnapshot: ArticleRescueSnapshot | null;
  onRestore: (snapshot: ArticleRescueSnapshot) => void;
  onDismiss: () => void;
}

export function OfflineRescueBanner({
  rescueSnapshot,
  onRestore,
  onDismiss,
}: OfflineRescueBannerProps) {
  if (!rescueSnapshot) return null;

  const formattedTime = new Date(rescueSnapshot.timestamp).toLocaleTimeString(
    "vi-VN",
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
  );

  return (
    <div
      role="alert"
      className="mb-6 flex flex-col gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100"
    >
      <div className="flex items-start gap-3.5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="size-5" />
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-bold">
              Phát hiện bản thảo lưu tạm trên trình duyệt chưa đồng bộ
            </h4>
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:text-amber-200">
              <Clock className="size-3" />
              {formattedTime}
            </span>
          </div>
          <p className="text-xs text-amber-800/80 dark:text-amber-200/80">
            Trình duyệt phát hiện một bản sao lưu cứu hộ có chứa dữ liệu mới hơn
            dữ liệu trên máy chủ (có thể do bạn mất kết nối hoặc tắt tab chưa
            kịp lưu). Bạn có muốn khôi phục lại không?
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:self-center">
        <button
          type="button"
          onClick={() => onRestore(rescueSnapshot)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-amber-700 active:scale-95"
        >
          <RotateCcw className="size-3.5" />
          <span>Khôi phục bản thảo</span>
        </button>

        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-transparent px-3 py-2 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-500/15 dark:text-amber-100"
          title="Bỏ qua và xóa bản thảo tạm này"
        >
          <Trash2 className="size-3.5" />
          <span>Bỏ qua</span>
        </button>
      </div>
    </div>
  );
}
