import type { SiteLocale } from "@/lib/i18n/config";

export type TermsOfServicePageContentProps = {
  locale?: SiteLocale;
};

const englishCopy = {
  eyebrow: "Terms Of Service",
  title: "The operational rules for using DevOps Daily",
  intro:
    "These terms describe the basic responsibilities, restrictions, and service boundaries for readers, subscribers, and registered users interacting with the platform.",
  sections: [
    {
      title: "Acceptable use",
      body: "You agree to use DevOps Daily in a lawful way, avoid abusive automation, and not interfere with the security, availability, or integrity of the platform.",
    },
    {
      title: "Accounts and content",
      body: "You are responsible for credentials tied to your account and for the material you submit. Editorial or community content may be moderated, unpublished, or removed when it violates policy or creates operational risk.",
    },
    {
      title: "Intellectual property",
      body: "DevOps Daily content, branding, and site materials remain protected by applicable intellectual property laws unless otherwise stated. Community submissions grant us the right to display and manage that content on the service.",
    },
    {
      title: "Warranty and liability",
      body: "The service is provided on an as-is basis. We work to keep information useful and systems available, but we cannot guarantee uninterrupted service or error-free content for every use case.",
    },
  ],
};

const vietnameseCopy = {
  eyebrow: "Điều khoản sử dụng",
  title: "Các nguyên tắc vận hành khi sử dụng Daily DevOps",
  intro:
    "Các điều khoản này mô tả trách nhiệm cơ bản, các giới hạn và phạm vi dịch vụ dành cho độc giả, subscriber và người dùng đã đăng ký khi tương tác với nền tảng.",
  sections: [
    {
      title: "Sử dụng hợp lệ",
      body: "Bạn đồng ý sử dụng Daily DevOps một cách hợp pháp, tránh các hình thức tự động hóa gây lạm dụng và không can thiệp vào tính bảo mật, khả dụng hay toàn vẹn của nền tảng.",
    },
    {
      title: "Tài khoản và nội dung",
      body: "Bạn chịu trách nhiệm với thông tin đăng nhập gắn với tài khoản của mình và với nội dung bạn gửi lên. Nội dung biên tập hoặc cộng đồng có thể bị kiểm duyệt, gỡ xuất bản hoặc xóa nếu vi phạm chính sách hoặc tạo rủi ro vận hành.",
    },
    {
      title: "Sở hữu trí tuệ",
      body: "Nội dung, thương hiệu và tài nguyên của Daily DevOps được bảo vệ theo quy định sở hữu trí tuệ hiện hành trừ khi có ghi chú khác. Các nội dung cộng đồng gửi lên cho phép chúng mình hiển thị và quản lý nội dung đó trên dịch vụ.",
    },
    {
      title: "Bảo đảm và trách nhiệm",
      body: "Dịch vụ được cung cấp theo hiện trạng. Chúng mình nỗ lực giữ cho thông tin hữu ích và hệ thống luôn sẵn sàng, nhưng không thể bảo đảm dịch vụ không gián đoạn hoặc hoàn toàn không có lỗi cho mọi trường hợp sử dụng.",
    },
  ],
};

export function TermsOfServicePageContent({
  locale = "vi",
}: Readonly<TermsOfServicePageContentProps>) {
  const copy = locale === "en" ? englishCopy : vietnameseCopy;

  return (
    <div className="flex w-full max-w-[1040px] flex-col gap-8">
      <section className="rounded-[32px] border border-cyan-500/15 bg-white px-6 py-10 shadow-sm dark:border-cyan-400/10 dark:bg-surface-dark md:px-10 md:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          {copy.eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-text-main dark:text-white md:text-5xl">
          {copy.title}
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-text-sub dark:text-gray-400 md:text-base">
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
