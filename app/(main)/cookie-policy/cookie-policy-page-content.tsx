import type { SiteLocale } from '@/lib/i18n/config';

export type CookiePolicyPageContentProps = {
    locale?: SiteLocale;
};

const englishCopy = {
    eyebrow: 'Cookie Policy',
    title: 'The storage and preference controls used on this site',
    intro:
        'This page explains what cookies or local storage entries DevOps Daily uses, why they exist, and how consent is handled across the public experience.',
    sections: [
        {
            title: 'Essential cookies',
            body: 'These support login sessions, security protections, and core interface preferences such as theme state. They are required for the site to function properly.',
        },
        {
            title: 'Measurement preferences',
            body: 'Where enabled, these help us understand traffic patterns, content performance, and product issues so we can improve the platform without over-collecting personal data.',
        },
        {
            title: 'Your choices',
            body: 'You can accept broader measurement cookies or continue with essential-only storage through the site banner. Browser-level controls can also clear or block stored data.',
        },
    ],
};

const vietnameseCopy = {
    eyebrow: 'Chính sách cookie',
    title: 'Các cơ chế lưu trữ và quyền tùy chọn được dùng trên website này',
    intro:
        'Trang này giải thích Daily DevOps đang dùng những cookie hoặc local storage nào, vì sao chúng tồn tại và việc xin consent được xử lý ra sao trong trải nghiệm công khai của website.',
    sections: [
        {
            title: 'Cookie thiết yếu',
            body: 'Những mục này hỗ trợ phiên đăng nhập, bảo vệ bảo mật và các tùy chọn giao diện cốt lõi như trạng thái theme. Chúng là bắt buộc để website hoạt động đúng.',
        },
        {
            title: 'Tùy chọn đo lường',
            body: 'Khi được bật, chúng giúp chúng mình hiểu xu hướng truy cập, hiệu quả nội dung và lỗi sản phẩm để cải thiện nền tảng mà không thu thập dữ liệu cá nhân quá mức.',
        },
        {
            title: 'Lựa chọn của bạn',
            body: 'Bạn có thể chấp nhận thêm cookie đo lường hoặc tiếp tục chỉ dùng các mục thiết yếu qua banner của website. Các công cụ của trình duyệt cũng có thể xóa hoặc chặn dữ liệu đã lưu.',
        },
    ],
};

export function CookiePolicyPageContent({ locale = 'vi' }: CookiePolicyPageContentProps) {
    const copy = locale === 'en' ? englishCopy : vietnameseCopy;

    return (
        <div className="flex w-full max-w-[1040px] flex-col gap-8">
            <section className="rounded-[32px] bg-gradient-to-r from-cyan-50 via-white to-blue-50 px-6 py-10 shadow-sm dark:bg-surface-dark md:px-10 md:py-14">
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
                {copy.sections.map((category) => (
                    <article
                        key={category.title}
                        className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-surface-dark"
                    >
                        <h2 className="text-xl font-bold text-text-main dark:text-white">
                            {category.title}
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-text-sub dark:text-gray-400">
                            {category.body}
                        </p>
                    </article>
                ))}
            </section>
        </div>
    );
}
