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
                    <form className="flex flex-col gap-2 sm:flex-row">
                        <input
                            className="flex-1 rounded-xl border-0 px-4 py-3 text-sm text-text-main outline-none ring-0"
                            placeholder="Enter your email"
                            required
                            type="email"
                        />
                        <button
                            className="rounded-xl bg-surface-dark px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-900"
                            type="submit"
                        >
                            Subscribe
                        </button>
                    </form>
                    <p className="mt-2 text-center text-xs text-cyan-50/90 md:text-left">
                        No spam, unsubscribe anytime.
                    </p>
                </div>
            </div>
        </section>
    );
}
