"use client";

import React from "react";
import {
  CheckCircle2,
  Loader2,
  WifiOff,
  AlertCircle,
  Cloud,
} from "lucide-react";

export type AutosaveStatus = "idle" | "saving" | "saved" | "offline" | "error";

interface AutosaveStatusBadgeProps {
  status: AutosaveStatus;
  lastSavedAt?: Date | null;
  className?: string;
}

export function AutosaveStatusBadge({
  status,
  lastSavedAt,
  className = "",
}: AutosaveStatusBadgeProps) {
  const formattedTime = lastSavedAt
    ? lastSavedAt.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  switch (status) {
    case "saving":
      return (
        <div
          className={`inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 ${className}`}
        >
          <Loader2 className="size-3.5 animate-spin text-cyan-500" />
          <span>Đang lưu ngầm...</span>
        </div>
      );

    case "saved":
      return (
        <div
          className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 ${className}`}
        >
          <CheckCircle2 className="size-3.5 text-emerald-500" />
          <span>
            {formattedTime ? `Đã lưu lúc ${formattedTime}` : "Đã lưu bản nháp"}
          </span>
        </div>
      );

    case "offline":
      return (
        <div
          className={`inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300 ${className}`}
          title="Không có kết nối mạng tới máy chủ. Dữ liệu đã được lưu an toàn vào bộ nhớ tạm trình duyệt."
        >
          <WifiOff className="size-3.5 text-amber-500" />
          <span>Đã lưu offline (mất mạng)</span>
        </div>
      );

    case "error":
      return (
        <div
          className={`inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 ${className}`}
        >
          <AlertCircle className="size-3.5 text-rose-500" />
          <span>Lưu thất bại - Hãy lưu tay</span>
        </div>
      );

    case "idle":
    default:
      return (
        <div
          className={`inline-flex items-center gap-1.5 rounded-full border border-gray-200/80 bg-gray-100/60 px-2.5 py-1 text-xs font-medium text-gray-500 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-400 ${className}`}
        >
          <span className="size-1.5 rounded-full bg-cyan-500" />
          <span>
            {formattedTime
              ? `Đã lưu lúc ${formattedTime}`
              : "Tự động lưu sau 3s"}
          </span>
        </div>
      );
  }
}
