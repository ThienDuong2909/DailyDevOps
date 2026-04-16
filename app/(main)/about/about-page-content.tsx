import Link from 'next/link';
import type { SiteLocale } from '@/lib/i18n/config';
import { withLocale } from '@/lib/i18n/config';

export type AboutPageContentProps = {
    locale?: SiteLocale;
};

const englishCopy = {
    eyebrow: 'About DevOps Daily',
    title: 'A publication for teams running production systems with intent',
    intro:
        'DevOps Daily exists to turn infrastructure experience into readable, practical guidance. We cover the systems work behind reliable delivery: build pipelines, cluster operations, observability, automation, and the engineering habits that keep teams shipping.',
    readArticles: 'Read articles',
    joinNewsletter: 'Join newsletter',
    focusAreas: 'Focus areas',
    editorialValue: 'Editorial value',
    workWithUs: 'Work with us',
    workTitle: 'Have an idea, pitch, or partnership conversation?',
    workBody:
        'Use the contact page as the front door for guest posts, collaboration, and feedback from the DevOps community.',
    contactCta: 'Contact DevOps Daily',
    editorialValues: [
        {
            title: 'Operational clarity',
            description:
                'We prefer concrete examples, real tradeoffs, and writeups that help teams ship with less ambiguity.',
        },
        {
            title: 'Hands-on systems thinking',
            description:
                'Every topic is grounded in the day-to-day work of pipelines, incidents, Kubernetes clusters, and platform engineering.',
        },
        {
            title: 'Useful over performative',
            description:
                'The goal is not noise or trend-chasing. The goal is practical guidance that saves engineering time.',
        },
    ],
    coverageAreas: [
        'CI/CD pipelines and release automation',
        'Kubernetes operations and platform tooling',
        'Observability, alerting, and incident response',
        'Cloud infrastructure, IaC, and reliability patterns',
    ],
};

const vietnameseCopy = {
    eyebrow: 'Giới thiệu Daily DevOps',
    title: 'Ấn phẩm dành cho các đội ngũ đang vận hành hệ thống production một cách có chủ đích',
    intro:
        'Daily DevOps ra đời để chuyển hóa kinh nghiệm hạ tầng thành các hướng dẫn dễ đọc và hữu ích ngay trong công việc thực tế. Chúng mình tập trung vào những thứ giúp hệ thống vận hành bền vững hơn: pipeline build, vận hành cluster, quan sát hệ thống, tự động hóa và các thói quen kỹ thuật giúp đội ngũ ship ổn định.',
    readArticles: 'Đọc bài viết',
    joinNewsletter: 'Nhận bản tin',
    focusAreas: 'Phạm vi nội dung',
    editorialValue: 'Giá trị biên tập',
    workWithUs: 'Kết nối cùng chúng tôi',
    workTitle: 'Bạn có ý tưởng bài viết, proposal hay cơ hội hợp tác?',
    workBody:
        'Trang liên hệ là nơi bắt đầu cho guest post, hợp tác nội dung và phản hồi từ cộng đồng DevOps.',
    contactCta: 'Liên hệ Daily DevOps',
    editorialValues: [
        {
            title: 'Sáng rõ trong vận hành',
            description:
                'Chúng mình ưu tiên ví dụ cụ thể, trade-off thật và các bài viết giúp team triển khai bớt mơ hồ hơn.',
        },
        {
            title: 'Tư duy hệ thống thực chiến',
            description:
                'Mọi chủ đề đều bám vào công việc hằng ngày của pipeline, sự cố, Kubernetes cluster và platform engineering.',
        },
        {
            title: 'Hữu ích hơn là phô diễn',
            description:
                'Mục tiêu không phải tạo tiếng ồn hay chạy theo xu hướng. Mục tiêu là chia sẻ thực dụng để tiết kiệm thời gian kỹ sư.',
        },
    ],
    coverageAreas: [
        'Pipeline CI/CD và tự động hóa phát hành',
        'Vận hành Kubernetes và công cụ platform',
        'Quan sát hệ thống, cảnh báo và xử lý sự cố',
        'Hạ tầng cloud, IaC và các mẫu độ tin cậy',
    ],
};

export function AboutPageContent({ locale = 'vi' }: AboutPageContentProps) {
    const copy = locale === 'en' ? englishCopy : vietnameseCopy;

    return (
        <div className="flex w-full max-w-[1280px] flex-col gap-8">
            <section className="relative overflow-hidden rounded-[32px] border border-cyan-500/15 bg-white px-6 py-10 shadow-sm dark:border-cyan-400/10 dark:bg-surface-dark md:px-10 md:py-14">
                <div
                    className="absolute inset-0 opacity-50"
                    style={{
                        background:
                            'radial-gradient(circle at 10% 10%, rgba(34,211,238,0.12), transparent 28%), radial-gradient(circle at 85% 0%, rgba(59,130,246,0.1), transparent 28%)',
                    }}
                />
                <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="space-y-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                            {copy.eyebrow}
                        </p>
                        <h1 className="max-w-3xl text-3xl font-black tracking-tight text-text-main dark:text-white md:text-5xl">
                            {copy.title}
                        </h1>
                        <p className="max-w-2xl text-sm leading-7 text-text-sub dark:text-gray-400 md:text-base">
                            {copy.intro}
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                href={withLocale('/blog', locale)}
                                className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
                            >
                                {copy.readArticles}
                            </Link>
                            <Link
                                href={withLocale('/newsletter', locale)}
                                className="inline-flex h-11 items-center rounded-xl border border-gray-200 px-5 text-sm font-semibold text-text-main transition-colors hover:border-primary hover:text-primary dark:border-gray-700 dark:text-white"
                            >
                                {copy.joinNewsletter}
                            </Link>
                        </div>
                    </div>

                    <div className="grid gap-4 rounded-[28px] bg-slate-950 p-6 text-white shadow-lg">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                                {copy.focusAreas}
                            </p>
                            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
                                {copy.coverageAreas.map((item) => (
                                    <li key={item} className="flex items-start gap-3">
                                        <span className="mt-2 size-2 rounded-full bg-cyan-400" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-3">
                {copy.editorialValues.map((value) => (
                    <article
                        key={value.title}
                        className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-surface-dark"
                    >
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                            {copy.editorialValue}
                        </p>
                        <h2 className="mt-3 text-xl font-bold text-text-main dark:text-white">
                            {value.title}
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-text-sub dark:text-gray-400">
                            {value.description}
                        </p>
                    </article>
                ))}
            </section>

            <section className="rounded-[32px] border border-gray-200 bg-gradient-to-r from-cyan-50 via-white to-blue-50 px-6 py-8 shadow-sm dark:border-gray-800 dark:bg-surface-dark md:px-10">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                            {copy.workWithUs}
                        </p>
                        <h2 className="mt-2 text-2xl font-black tracking-tight text-text-main dark:text-white">
                            {copy.workTitle}
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-text-sub dark:text-gray-400">
                            {copy.workBody}
                        </p>
                    </div>
                    <Link
                        href={withLocale('/contact', locale)}
                        className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                    >
                        {copy.contactCta}
                    </Link>
                </div>
            </section>
        </div>
    );
}
