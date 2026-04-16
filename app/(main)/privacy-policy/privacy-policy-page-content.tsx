import { DataRightsPanel } from '@/components/privacy/data-rights-panel';
import type { SiteLocale } from '@/lib/i18n/config';

export type PrivacyPolicyPageContentProps = {
    locale?: SiteLocale;
};

const englishCopy = {
    eyebrow: 'Privacy Policy',
    title: 'How DevOps Daily handles personal data',
    intro:
        'This policy explains what information we collect, why we process it, and the controls available to readers, subscribers, and account holders using DevOps Daily.',
    sections: [
        {
            title: 'Information we collect',
            body: 'We collect the information you submit directly, including account details, newsletter subscriptions, comments, and contact requests. We also store essential technical data needed for security, authentication, and performance monitoring.',
        },
        {
            title: 'How we use it',
            body: 'We use your information to operate the site, manage accounts, send requested emails, secure the platform, moderate community features, and improve editorial and product quality.',
        },
        {
            title: 'Sharing and processors',
            body: 'We only share information with service providers necessary to run DevOps Daily, such as hosting, email delivery, database infrastructure, and observability tooling. We do not sell personal information.',
        },
        {
            title: 'Retention and deletion',
            body: 'We retain account, editorial, and subscriber records for as long as needed to provide the service, meet legal obligations, and preserve security logs. You can request data review or deletion through the contact page.',
        },
    ],
};

const vietnameseCopy = {
    eyebrow: 'Chính sách quyền riêng tư',
    title: 'Daily DevOps xử lý dữ liệu cá nhân như thế nào',
    intro:
        'Chính sách này giải thích chúng mình thu thập loại dữ liệu nào, vì sao cần xử lý và những quyền kiểm soát dành cho độc giả, subscriber và người dùng có tài khoản trên Daily DevOps.',
    sections: [
        {
            title: 'Thông tin chúng mình thu thập',
            body: 'Chúng mình thu thập thông tin bạn chủ động cung cấp, bao gồm dữ liệu tài khoản, đăng ký bản tin, bình luận và yêu cầu liên hệ. Ngoài ra hệ thống cũng lưu một số dữ liệu kỹ thuật cần thiết cho bảo mật, xác thực và giám sát hiệu năng.',
        },
        {
            title: 'Chúng mình sử dụng dữ liệu ra sao',
            body: 'Dữ liệu được dùng để vận hành website, quản lý tài khoản, gửi email bạn yêu cầu, bảo vệ nền tảng, kiểm duyệt tính năng cộng đồng và cải thiện chất lượng sản phẩm cũng như nội dung.',
        },
        {
            title: 'Chia sẻ dữ liệu và bên xử lý',
            body: 'Chúng mình chỉ chia sẻ thông tin với các nhà cung cấp dịch vụ cần thiết để vận hành Daily DevOps như hosting, email delivery, database infrastructure và công cụ observability. Chúng mình không bán dữ liệu cá nhân.',
        },
        {
            title: 'Lưu trữ và xóa dữ liệu',
            body: 'Chúng mình lưu dữ liệu tài khoản, biên tập và subscriber trong thời gian cần thiết để cung cấp dịch vụ, đáp ứng nghĩa vụ pháp lý và bảo toàn log bảo mật. Bạn có thể yêu cầu xem lại hoặc xóa dữ liệu qua trang liên hệ.',
        },
    ],
};

export function PrivacyPolicyPageContent({ locale = 'vi' }: PrivacyPolicyPageContentProps) {
    const copy = locale === 'en' ? englishCopy : vietnameseCopy;

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

            <DataRightsPanel />
        </div>
    );
}
