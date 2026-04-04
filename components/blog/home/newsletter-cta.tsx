import Link from 'next/link';
import { NewsletterSignupForm } from '@/components/blog/newsletter-signup-form';

export function NewsletterCta() {
    return (
        <section className="relative mt-8 w-full overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-500 shadow-lg">
            <div
                className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage:
                        'radial-gradient(circle at 20% 20%, white, transparent 35%), radial-gradient(circle at 80% 0%, white, transparent 30%)',
                }}
            />
            <div className="relative flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between md:p-12">
                <div className="max-w-2xl space-y-2 text-center md:text-left">
                    <h2 className="text-2xl font-black tracking-tight text-white md:text-3xl">
                        Stay in the loop
                    </h2>
                    <p className="text-sm leading-6 text-cyan-50 md:text-base">
                        Join DevOps engineers receiving weekly updates on CI/CD,
                        Kubernetes, automation and production operations.
                    </p>
                </div>
                <div className="w-full max-w-md">
                    <NewsletterSignupForm
                        buttonClassName="bg-surface-dark hover:bg-gray-900"
                        buttonLabel="Subscribe"
                        helperText="Weekly DevOps notes, zero noise."
                        inputClassName="flex-1"
                    />
                    <div className="mt-3 text-center text-xs text-cyan-50/90 md:text-left">
                        Want the full archive?{' '}
                        <Link className="font-semibold underline underline-offset-4" href="/newsletter">
                            Visit the newsletter page
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
