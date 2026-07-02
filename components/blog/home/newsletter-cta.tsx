import Link from "next/link";
import { NewsletterSignupForm } from "@/components/blog/newsletter-signup-form";
import { useDictionary, useLocale } from "@/components/i18n/locale-provider";
import { withLocale } from "@/lib/i18n/config";
import { authStore } from "@/stores/auth-store";

export function NewsletterCta() {
  const locale = useLocale();
  const dictionary = useDictionary();
  const isAuthenticated = authStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return null;
  }

  return (
    <section
      className="relative mt-8 w-full overflow-hidden rounded-[28px] px-6 py-8 sm:px-8"
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
      <div
        className="pointer-events-none absolute -bottom-24 left-10 size-56 rounded-full opacity-15 blur-3xl"
        style={{ background: "var(--primary-glow-theme)" }}
      />
      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(420px,540px)] lg:items-center">
        <div className="max-w-2xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            <span className="material-symbols-outlined mr-1.5 !text-[16px] align-middle">
              mail
            </span>
            <span>{dictionary.blog.newsletterCtaTitle}</span>
          </p>
          <h2 className="text-2xl font-black tracking-tight text-[color:var(--text-main-theme)] md:text-3xl">
            {dictionary.blog.stayInLoopTitle}
          </h2>
          <p className="theme-muted text-sm leading-7 md:text-base">
            {dictionary.blog.stayInLoopBody}
          </p>
        </div>
        <div className="min-w-0">
          <NewsletterSignupForm
            buttonClassName="h-12 rounded-xl px-5 sm:col-span-2 xl:col-span-1"
            buttonLabel={dictionary.blog.subscribe}
            formClassName="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
            helperText={dictionary.blog.weeklyNotes}
            inputClassName="theme-input h-12 w-full"
            tone="surface"
          />
          <div className="theme-muted mt-3 text-xs">
            {dictionary.blog.fullArchivePrompt}{" "}
            <Link
              className="font-semibold text-primary underline underline-offset-4"
              href={withLocale("/newsletter", locale)}
            >
              {dictionary.blog.visitNewsletterPage}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
