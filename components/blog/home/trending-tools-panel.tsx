import Link from 'next/link';
import { BarChart3, Rocket } from 'lucide-react';
import { SectionHeading } from '@/components/shared/section-heading';
import { trendingTools } from '@/lib/constants/blog';

export function TrendingToolsPanel() {
    return (
        <aside className="hidden w-80 shrink-0 flex-col gap-8 lg:flex">
            <div className="sticky top-24 space-y-6">
                <div className="rounded-2xl border border-gray-100 bg-surface-light p-6 shadow-sm dark:border-gray-800 dark:bg-surface-dark">
                    <SectionHeading
                        title="Trending Tools"
                        description="Bo cong cu dang xuat hien nhieu trong cac bai viet va luong van hanh."
                    />
                    <div className="mt-6 flex flex-col gap-4">
                        {trendingTools.map((tool, index) => (
                            <div key={tool.name}>
                                {index > 0 ? (
                                    <div className="mb-4 h-px bg-gray-100 dark:bg-gray-800" />
                                ) : null}
                                <Link
                                    href="/"
                                    className="flex items-center gap-3 transition-colors hover:text-primary"
                                >
                                    <div
                                        className={`flex size-11 items-center justify-center rounded-xl text-sm font-bold ${tool.accentClassName}`}
                                    >
                                        {tool.shortName}
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-semibold text-text-main dark:text-white">
                                            {tool.name}
                                        </p>
                                        <p className="text-xs text-text-sub dark:text-gray-400">
                                            {tool.description}
                                        </p>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="rounded-2xl border border-cyan-500/10 bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-transparent p-6">
                    <div className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-500">
                        <Rocket className="size-6" />
                    </div>
                    <h3 className="text-lg font-bold text-text-main dark:text-white">
                        Deploy Faster
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-text-sub dark:text-gray-400">
                        Ban benchmark cloud va theo doi hieu nang he thong tren mot dashboard gon.
                    </p>
                    <button
                        className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-text-main transition-colors hover:border-cyan-500 hover:text-cyan-500 dark:border-gray-700 dark:text-white"
                        type="button"
                    >
                        <BarChart3 className="size-4" />
                        Start Now
                    </button>
                </div>
            </div>
        </aside>
    );
}
