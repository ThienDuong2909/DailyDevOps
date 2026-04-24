import type { SiteLocale } from "@/lib/i18n/config";

export type DmcaPolicyPageContentProps = {
  locale?: SiteLocale;
};

const englishCopy = {
  eyebrow: "DMCA Policy",
  title: "Copyright complaints and takedown process",
  intro:
    "This policy explains how DevOps Daily handles copyright complaints, removal requests, counter notices, and repeat infringement across editorial and community content.",
  sections: [
    {
      title: "Reporting copyrighted material",
      body: "If you believe content on DevOps Daily infringes your copyright, send a notice through the contact page with your legal name, contact details, the original work, the infringing URL, and a good-faith statement confirming your claim.",
    },
    {
      title: "What happens after a notice",
      body: "We review properly submitted notices, investigate the affected material, and may temporarily remove or limit access while we verify the claim. We may contact both the reporting party and the content owner for clarification.",
    },
    {
      title: "Counter notices",
      body: "If your content was removed in error, you may submit a counter notice with enough information for us to evaluate ownership, authorization, or fair use. We will restore content when appropriate and legally permitted.",
    },
    {
      title: "Repeat infringement and editorial action",
      body: "DevOps Daily may suspend accounts, reject submissions, or remove published content from contributors who repeatedly violate intellectual property rules or ignore editorial takedown requests.",
    },
  ],
};

const vietnameseCopy = {
  eyebrow: "Chính sách DMCA",
  title: "Quy trình tiếp nhận khiếu nại bản quyền và gỡ nội dung",
  intro:
    "Chính sách này mô tả cách Daily DevOps xử lý khiếu nại bản quyền, yêu cầu gỡ bỏ, phản hồi phản đối và các trường hợp tái phạm đối với nội dung biên tập cũng như nội dung cộng đồng.",
  sections: [
    {
      title: "Báo cáo nội dung vi phạm bản quyền",
      body: "Nếu bạn cho rằng nội dung trên Daily DevOps xâm phạm bản quyền của mình, hãy gửi thông báo qua trang liên hệ kèm tên pháp lý, thông tin liên hệ, tác phẩm gốc, URL vi phạm và tuyên bố thiện chí xác nhận khiếu nại.",
    },
    {
      title: "Điều gì xảy ra sau khi nhận thông báo",
      body: "Chúng mình xem xét các thông báo hợp lệ, điều tra nội dung bị ảnh hưởng và có thể tạm thời gỡ hoặc hạn chế truy cập trong khi xác minh. Chúng mình cũng có thể liên hệ cả bên báo cáo và chủ sở hữu nội dung để làm rõ.",
    },
    {
      title: "Thông báo phản đối",
      body: "Nếu nội dung của bạn bị gỡ nhầm, bạn có thể gửi phản hồi phản đối với đủ thông tin để chúng mình đánh giá quyền sở hữu, sự cho phép hoặc căn cứ sử dụng hợp lý. Nội dung sẽ được khôi phục khi phù hợp và được pháp luật cho phép.",
    },
    {
      title: "Tái phạm và hành động biên tập",
      body: "Daily DevOps có thể tạm ngưng tài khoản, từ chối bài gửi hoặc gỡ nội dung đã xuất bản đối với những cộng tác viên liên tục vi phạm quy định sở hữu trí tuệ hoặc phớt lờ yêu cầu gỡ bỏ từ biên tập.",
    },
  ],
};

export function DmcaPolicyPageContent({
  locale = "vi",
}: Readonly<DmcaPolicyPageContentProps>) {
  const copy = locale === "en" ? englishCopy : vietnameseCopy;

  return (
    <div className="flex w-full max-w-[1040px] flex-col gap-8">
      <section className="rounded-[32px] bg-slate-950 px-6 py-10 text-white shadow-xl md:px-10 md:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
          {copy.eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
          {copy.title}
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
          {copy.intro}
        </p>
      </section>

      <section className="grid gap-6">
        {copy.sections.map((section) => (
          <article
            key={section.title}
            className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-surface-dark"
          >
            <h2 className="text-xl font-bold text-text-main dark:text-white">
              {section.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-text-sub dark:text-gray-400">
              {section.body}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
