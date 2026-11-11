"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";
import { useLocale } from "@/components/i18n/locale-provider";
import {
  createConsentRecord,
  defaultConsentPreferences,
  readConsent,
  saveConsent,
  type ConsentPreferences,
} from "@/lib/consent";

export function CookieConsentBanner() {
  const locale = useLocale();
  const isVi = locale === "vi";

  const [isVisible, setIsVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>(
    defaultConsentPreferences,
  );

  useEffect(() => {
    const currentConsent = readConsent();
    setIsVisible(!currentConsent);

    if (currentConsent?.preferences) {
      setPreferences(currentConsent.preferences);
    }
  }, []);

  const persistConsent = async (
    status: "accepted" | "essential-only" | "customized",
    nextPreferences: ConsentPreferences,
  ) => {
    try {
      setIsSaving(true);
      await saveConsent(
        createConsentRecord(status, {
          analytics: nextPreferences.analytics,
          marketing: nextPreferences.marketing,
        }),
      );
      setPreferences(nextPreferences);
      setIsVisible(false);
      setIsCustomizing(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <aside
      aria-label={isVi ? "Tùy chọn Cookie" : "Cookie Consent"}
      className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm sm:max-w-md animate-in fade-in slide-in-from-bottom-3 duration-300"
    >
      <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 bg-surface-light/80 p-5 shadow-2xl backdrop-blur-md dark:border-gray-800/80 dark:bg-surface-dark/80">
        {/* Ambient Linear Glow matching website theme */}
        <div
          className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full opacity-30 blur-2xl"
          style={{ background: "var(--primary-glow-theme)" }}
        />

        <div className="relative z-10 flex flex-col gap-3">
          {/* Header pill & dismiss */}
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-700 dark:text-cyan-300">
              <Cookie className="size-3.5" />
              <span>{isVi ? "Tùy chọn Cookie" : "Cookie Consent"}</span>
            </span>

            <button
              type="button"
              onClick={() =>
                void persistConsent("essential-only", {
                  essential: true,
                  analytics: false,
                  marketing: false,
                })
              }
              className="rounded-lg p-1 text-[var(--text-muted-theme)] transition-colors hover:bg-black/5 hover:text-[var(--text-main-theme)] dark:hover:bg-white/10 dark:hover:text-white"
              aria-label={isVi ? "Đóng" : "Dismiss"}
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Title & Description */}
          <div>
            <h3 className="text-sm font-bold tracking-tight text-[var(--text-main-theme)]">
              {isVi
                ? "Bảo vệ quyền riêng tư & dữ liệu trải nghiệm"
                : "Choose how we store preferences & metrics"}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted-theme)]">
              {isVi ? (
                <>
                  Cookie thiết yếu duy trì đăng nhập và bảo mật. Cookie phân
                  tích giúp chúng tôi đo lường và cải thiện bài viết. Xem thêm
                  tại{" "}
                  <Link
                    href="/cookie-policy"
                    className="font-semibold text-primary underline underline-offset-2 hover:text-primary-dark"
                  >
                    Chính sách Cookie
                  </Link>{" "}
                  và{" "}
                  <Link
                    href="/privacy-policy"
                    className="font-semibold text-primary underline underline-offset-2 hover:text-primary-dark"
                  >
                    Bảo mật
                  </Link>
                  .
                </>
              ) : (
                <>
                  Essential cookies keep sign-in and security active. Optional
                  analytics measure readership to improve guides. See our{" "}
                  <Link
                    href="/cookie-policy"
                    className="font-semibold text-primary underline underline-offset-2 hover:text-primary-dark"
                  >
                    Cookie Policy
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy-policy"
                    className="font-semibold text-primary underline underline-offset-2 hover:text-primary-dark"
                  >
                    Privacy
                  </Link>
                  .
                </>
              )}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => setIsCustomizing((prev) => !prev)}
              className="rounded-xl border border-gray-200/80 bg-white/40 px-3 py-1.5 text-xs font-semibold text-[var(--text-muted-theme)] transition-colors hover:border-primary/40 hover:bg-white/80 hover:text-[var(--text-main-theme)] dark:border-gray-700/80 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:text-white"
            >
              {isCustomizing
                ? isVi
                  ? "Ẩn bớt"
                  : "Hide"
                : isVi
                  ? "Tùy chỉnh"
                  : "Customize"}
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() =>
                void persistConsent("essential-only", {
                  essential: true,
                  analytics: false,
                  marketing: false,
                })
              }
              className="rounded-xl border border-gray-200/80 bg-white/40 px-3 py-1.5 text-xs font-semibold text-[var(--text-main-theme)] transition-colors hover:border-gray-400 hover:bg-white/80 dark:border-gray-700/80 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10 dark:hover:text-white"
            >
              {isVi ? "Chỉ thiết yếu" : "Essential only"}
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() =>
                void persistConsent("accepted", {
                  essential: true,
                  analytics: true,
                  marketing: false,
                })
              }
              className="theme-glow-button rounded-xl px-4 py-1.5 text-xs font-bold text-white shadow-sm shadow-primary/25 transition-all hover:opacity-95"
            >
              {isVi ? "Đồng ý tất cả" : "Accept all"}
            </button>
          </div>

          {/* Compact customization drawer */}
          {isCustomizing && (
            <div className="mt-2 space-y-2.5 rounded-xl border border-gray-200/70 bg-white/50 p-3 text-xs dark:border-gray-700/70 dark:bg-black/20">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-[var(--text-main-theme)]">
                    {isVi ? "Cookie thiết yếu" : "Essential cookies"}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted-theme)]">
                    {isVi
                      ? "Cần cho xác thực & lưu cấu hình"
                      : "Required for auth & preferences"}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {isVi ? "Luôn bật" : "Always active"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-gray-200/60 pt-2 dark:border-gray-700/60">
                <div>
                  <p className="font-semibold text-[var(--text-main-theme)]">
                    {isVi ? "Cookie phân tích" : "Analytics cookies"}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted-theme)]">
                    {isVi
                      ? "Đo lường ẩn danh & hiệu suất đọc"
                      : "Anonymous traffic & search telemetry"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPreferences((curr) => ({
                      ...curr,
                      analytics: !curr.analytics,
                    }))
                  }
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                    preferences.analytics
                      ? "bg-cyan-500"
                      : "bg-gray-300 dark:bg-gray-700"
                  }`}
                  aria-label={
                    isVi
                      ? "Bật tắt cookie phân tích"
                      : "Toggle analytics cookies"
                  }
                >
                  <span
                    className={`inline-block size-3.5 rounded-full bg-white shadow-sm transition-transform ${
                      preferences.analytics
                        ? "translate-x-4.5"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <button
                type="button"
                disabled={isSaving}
                onClick={() => void persistConsent("customized", preferences)}
                className="mt-1 w-full rounded-lg bg-primary py-1.5 text-center text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {isVi ? "Lưu cài đặt tùy chọn" : "Save preferences"}
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
