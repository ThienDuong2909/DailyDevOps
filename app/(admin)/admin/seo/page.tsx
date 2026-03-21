'use client';

import { useState } from 'react';

const seoData = {
    healthScore: 92,
    scores: [
        { label: 'Meta Descriptions', value: 92, issues: '5 Missing descriptions', icon: 'description', color: '#0bda5b' },
        { label: 'Page Speed', value: 98, issues: 'Mobile score 95/100', icon: 'speed', color: '#137fec' },
        { label: 'Structured Data', value: 85, issues: '3 pages need JSON-LD', icon: 'code', color: '#eab308' },
        { label: 'Sitemap Health', value: 100, issues: 'Updated 2h ago', icon: 'map', color: '#0bda5b' },
    ],
    pages: [
        { url: '/', title: 'DevOps Daily — Engineering Blog', desc: 'Expert articles on Kubernetes, CI/CD, Cloud Architecture and more.', score: 96 },
        { url: '/blog/mastering-kubernetes', title: 'Mastering Kubernetes: A Guide for 2024', desc: 'Learn the orchestration secrets that will scale your infrastructure efficiently.', score: 92 },
        { url: '/blog/terraform-vs-pulumi', title: 'Terraform vs. Pulumi: What to choose?', desc: 'An unbiased look at the two giants of IaC.', score: 88 },
        { url: '/blog/docker-security', title: 'Docker Security Hardening', desc: 'Best practices for image scanning, runtime security.', score: 74 },
    ],
    keywords: [
        { term: 'kubernetes tutorial', position: 3, change: '+2' },
        { term: 'devops best practices', position: 7, change: '-1' },
        { term: 'ci/cd pipeline github actions', position: 5, change: '+4' },
        { term: 'terraform vs pulumi', position: 2, change: '0' },
        { term: 'docker security', position: 12, change: '+3' },
    ],
};

export default function SeoPage() {
    const [selectedPage, setSelectedPage] = useState(0);

    return (
        <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {seoData.scores.map((score, i) => (
                    <div key={i} className="bg-surface-dark border border-border-dark rounded-xl p-5 flex flex-col gap-3 hover:border-primary/30 transition-colors">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">{score.icon}</span>
                                <p className="text-[#9dabb9] text-sm font-medium">{score.label}</p>
                            </div>
                            <span className="text-white font-bold font-mono text-lg" style={{ color: score.color }}>
                                {score.value}%
                            </span>
                        </div>
                        <div className="h-2 bg-[#283039] rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score.value}%`, backgroundColor: score.color }} />
                        </div>
                        <p className="text-[#586069] text-xs">{score.issues}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* SEO Preview */}
                <div className="xl:col-span-2 bg-surface-dark border border-border-dark rounded-xl overflow-hidden">
                    <div className="bg-[#111418] border-b border-border-dark p-4">
                        <h3 className="text-white font-bold text-base">SEO Preview & Audit</h3>
                        <p className="text-[#9dabb9] text-xs mt-1">Review how pages appear in search results</p>
                    </div>
                    <div className="p-4 divide-y divide-border-dark">
                        {seoData.pages.map((page, i) => (
                            <div key={i} className={`py-4 first:pt-0 last:pb-0 cursor-pointer transition-colors rounded-lg px-3 -mx-3 ${selectedPage === i ? 'bg-primary/5' : 'hover:bg-[#283039]/30'}`} onClick={() => setSelectedPage(i)}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-[#0bda5b] font-mono mb-1 truncate">{`https://blog.thienduong.info${page.url}`}</p>
                                        <h4 className="text-[#8ab4f8] text-base font-medium mb-1 hover:underline cursor-pointer line-clamp-1">{page.title}</h4>
                                        <p className="text-[#bdc1c6] text-sm line-clamp-2">{page.desc}</p>
                                    </div>
                                    <div className="shrink-0 flex items-center gap-2">
                                        <span className={`text-sm font-bold font-mono ${page.score >= 90 ? 'text-green-400' : page.score >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                                            {page.score}
                                        </span>
                                        <span className="material-symbols-outlined text-[#9dabb9] text-lg">chevron_right</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Keywords */}
                <div className="bg-surface-dark border border-border-dark rounded-xl overflow-hidden">
                    <div className="bg-[#111418] border-b border-border-dark p-4">
                        <h3 className="text-white font-bold text-base">Keyword Rankings</h3>
                        <p className="text-[#9dabb9] text-xs mt-1">Organic search positions</p>
                    </div>
                    <div className="p-4">
                        <div className="flex flex-col gap-3">
                            {seoData.keywords.map((kw, i) => (
                                <div key={i} className="flex items-center justify-between py-2 border-b border-border-dark last:border-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[#9dabb9] text-xs font-mono w-5">#{kw.position}</span>
                                        <span className="text-white text-sm font-medium">{kw.term}</span>
                                    </div>
                                    <span className={`text-xs font-bold font-mono ${
                                        kw.change.startsWith('+') ? 'text-green-400' : kw.change.startsWith('-') ? 'text-red-400' : 'text-[#9dabb9]'
                                    }`}>
                                        {kw.change === '0' ? '—' : kw.change}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
