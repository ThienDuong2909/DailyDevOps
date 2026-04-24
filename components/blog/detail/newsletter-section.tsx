"use client";

import Link from "next/link";
import { useLocale } from "@/components/i18n/locale-provider";
import { withLocale } from "@/lib/i18n/config";

/**
 * Newsletter CTA section displayed at the bottom of blog posts.
 */
export function NewsletterSection() {
  const locale = useLocale();

  return (
    <section
      className="relative mt-12 overflow-hidden rounded-[28px] px-6 py-8 sm:px-8"
      style={{
        background: "var(--surface-base)",
        border: "1px solid var(--border-soft-theme)",
        boxShadow: "var(--shadow-theme)",
      }}
    >
      <div
        className="pointer-events-none absolute -right-20 -top-20 size-60 rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--primary-glow-theme)" }}
      />
      <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        <span className="material-symbols-outlined mr-1.5 !text-[16px] align-middle">
          mail
        </span>
        Continue learning
      </p>
      <h2 className="relative mt-3 text-xl font-bold text-[color:var(--text-main-theme)] sm:text-2xl">
        Get the next production-ready note in your inbox
      </h2>
      <p className="theme-muted relative mt-3 max-w-2xl text-sm leading-7">
        Subscribe to DevOps Daily for practical writeups on Kubernetes, CI/CD,
        observability, and operating real systems without the fluff.
      </p>
      <div className="relative mt-5 flex flex-wrap gap-3">
        <Link
          href={withLocale("/newsletter", locale)}
          className="theme-glow-button inline-flex h-11 items-center rounded-xl px-5 text-sm font-semibold transition-opacity hover:opacity-90"
        >
          Join the newsletter
        </Link>
        <Link
          href={withLocale("/blog", locale)}
          className="inline-flex h-11 items-center rounded-xl px-5 text-sm font-semibold text-[color:var(--text-main-theme)] transition-colors hover:text-primary"
          style={{ border: "1px solid var(--border-soft-theme)" }}
        >
          Browse all articles
        </Link>
      </div>
    </section>
  );
}
