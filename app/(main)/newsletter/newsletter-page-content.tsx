import Link from "next/link";
import { NewsletterSignupForm } from "@/components/blog/newsletter-signup-form";
import type { SiteLocale } from "@/lib/i18n/config";
import { withLocale } from "@/lib/i18n/config";

export type NewsletterPageContentProps = {
  locale?: SiteLocale;
};

const englishCopy = {
  eyebrow: "Newsletter",
  title: "Weekly notes for engineers shipping real infrastructure",
  intro:
    "DevOps Daily curates practical lessons on Kubernetes, CI/CD, observability, platform engineering, and production operations. Every issue is built to be skim-friendly and useful on the same day you read it.",
  pills: ["Weekly delivery", "Practical links", "Unsubscribe anytime"],
  joinTitle: "Join the list",
  joinBody:
    "Subscribe for new articles, curated tooling, and operator-grade workflows.",
  buttonLabel: "Join newsletter",
  helperText: "We only send useful updates and product-worthy writeups.",
  whatYouGet: "What you get",
  conciseTitle: "Concise operator updates",
  conciseBody:
    "Shipping notes on pipelines, reliability, incident learnings, deployment patterns, and tooling decisions worth copying.",
  readingModes: "Reading modes",
  rssTitle: "Email and RSS together",
  rssBody:
    "Prefer feed readers? Use the site RSS feed for every published post and keep the newsletter for weekly highlights.",
  rssCta: "Open RSS feed",
  subscriberControl: "Subscriber control",
  leaveTitle: "Leave anytime",
  leaveBody:
    "Every subscriber gets an unsubscribe token in the backend model, so the flow is already ready for a one-click opt-out experience.",
};

const vietnameseCopy = {
  eyebrow: "Bản tin",
  title: "Ghi chú hàng tuần cho kỹ sư đang vận hành hạ tầng thực tế",
  intro:
    "Daily DevOps chọn lọc những bài học thực dụng về Kubernetes, CI/CD, observability, platform engineering và vận hành production. Mỗi số đều được viết ngắn gọn, dễ lướt và có thể áp dụng ngay trong ngày bạn đọc.",
  pills: ["Gửi hàng tuần", "Liên kết thực dụng", "Hủy đăng ký bất cứ lúc nào"],
  joinTitle: "Tham gia danh sách",
  joinBody:
    "Đăng ký để nhận bài mới, công cụ đáng chú ý và workflow dành cho người vận hành hệ thống.",
  buttonLabel: "Nhận bản tin",
  helperText:
    "Chúng mình chỉ gửi các cập nhật hữu ích và các bài viết đủ chất lượng để đọc thật.",
  whatYouGet: "Bạn nhận được gì",
  conciseTitle: "Cập nhật ngắn gọn cho operator",
  conciseBody:
    "Các ghi chú về pipeline, độ tin cậy, bài học từ sự cố, mẫu triển khai và những quyết định công cụ đáng để học theo.",
  readingModes: "Cách theo dõi",
  rssTitle: "Email và RSS cùng lúc",
  rssBody:
    "Nếu bạn thích feed reader, hãy dùng RSS của site để theo dõi mọi bài viết mới và giữ newsletter cho phần tổng hợp hàng tuần.",
  rssCta: "Mở RSS feed",
  subscriberControl: "Quyền chủ động của người đăng ký",
  leaveTitle: "Rời đi bất cứ lúc nào",
  leaveBody:
    "Mỗi subscriber đều có unsubscribe token trong backend, nên luồng hủy đăng ký một chạm đã sẵn sàng khi bạn cần.",
};

export function NewsletterPageContent({
  locale = "vi",
}: Readonly<NewsletterPageContentProps>) {
  const copy = locale === "en" ? englishCopy : vietnameseCopy;

  return (
    <div className="flex w-full max-w-[1280px] flex-col gap-8">
      <section className="relative overflow-hidden rounded-[32px] bg-slate-950 px-6 py-10 text-white shadow-xl md:px-10 md:py-14">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(circle at top left, rgba(34,211,238,0.35), transparent 35%), radial-gradient(circle at 85% 10%, rgba(59,130,246,0.28), transparent 30%)",
          }}
        />
        <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
              {copy.eyebrow}
            </p>
            <h1 className="max-w-3xl text-3xl font-black tracking-tight md:text-5xl">
              {copy.title}
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
              {copy.intro}
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-slate-200">
              {copy.pills.map((pill) => (
                <span
                  key={pill}
                  className="rounded-full border border-white/15 bg-white/10 px-4 py-2"
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/10 p-6 backdrop-blur">
            <h2 className="text-xl font-bold">{copy.joinTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {copy.joinBody}
            </p>
            <NewsletterSignupForm
              buttonClassName="bg-cyan-500 hover:bg-cyan-400"
              buttonLabel={copy.buttonLabel}
              className="mt-5"
              helperText={copy.helperText}
              inputClassName="bg-white"
              stacked
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-surface-dark">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {copy.whatYouGet}
          </p>
          <h2 className="mt-3 text-xl font-bold text-text-main dark:text-white">
            {copy.conciseTitle}
          </h2>
          <p className="mt-3 text-sm leading-7 text-text-sub dark:text-gray-400">
            {copy.conciseBody}
          </p>
        </article>
        <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-surface-dark">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {copy.readingModes}
          </p>
          <h2 className="mt-3 text-xl font-bold text-text-main dark:text-white">
            {copy.rssTitle}
          </h2>
          <p className="mt-3 text-sm leading-7 text-text-sub dark:text-gray-400">
            {copy.rssBody}
          </p>
          <Link
            className="mt-4 inline-flex text-sm font-semibold text-primary hover:text-blue-600"
            href={withLocale("/rss.xml", locale)}
          >
            {copy.rssCta}
          </Link>
        </article>
        <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-surface-dark">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {copy.subscriberControl}
          </p>
          <h2 className="mt-3 text-xl font-bold text-text-main dark:text-white">
            {copy.leaveTitle}
          </h2>
          <p className="mt-3 text-sm leading-7 text-text-sub dark:text-gray-400">
            {copy.leaveBody}
          </p>
        </article>
      </section>
    </div>
  );
}
