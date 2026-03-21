'use client';

import { useState, useEffect } from 'react';

const trafficData = {
    visits: '24,821',
    visitsChange: '+12.3%',
    bounceRate: '38.2%',
    bounceChange: '-2.1%',
    avgSession: '4m 32s',
    sessionChange: '+8.5%',
    pageViews: '142.5k',
    pageViewsChange: '+15.7%',
};

const serverMetrics = [
    { label: 'CPU Usage', value: 42, max: 100, unit: '%', icon: 'memory', color: '#137fec', status: 'Normal' },
    { label: 'Memory', value: 6.2, max: 16, unit: 'GB', icon: 'storage', color: '#0bda5b', status: 'Normal' },
    { label: 'Disk I/O', value: 23, max: 100, unit: '%', icon: 'hard_drive', color: '#eab308', status: 'Normal' },
    { label: 'Network', value: 145, max: 1000, unit: 'Mbps', icon: 'network_check', color: '#137fec', status: 'Normal' },
];

const topPages = [
    { path: '/blog/mastering-kubernetes', views: '12,405', avgTime: '5m 12s' },
    { path: '/blog/cicd-best-practices', views: '8,920', avgTime: '4m 35s' },
    { path: '/blog/docker-security', views: '5,420', avgTime: '3m 48s' },
    { path: '/blog/terraform-vs-pulumi', views: '3,210', avgTime: '6m 15s' },
    { path: '/', views: '2,890', avgTime: '1m 22s' },
];

export default function PerformancePage() {
    const [uptime, setUptime] = useState('99.98%');

    return (
        <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
            {/* Traffic Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Visits', value: trafficData.visits, change: trafficData.visitsChange, icon: 'groups', positive: true },
                    { label: 'Bounce Rate', value: trafficData.bounceRate, change: trafficData.bounceChange, icon: 'trending_down', positive: true },
                    { label: 'Avg. Session', value: trafficData.avgSession, change: trafficData.sessionChange, icon: 'timer', positive: true },
                    { label: 'Page Views', value: trafficData.pageViews, change: trafficData.pageViewsChange, icon: 'visibility', positive: true },
                ].map((stat, i) => (
                    <div key={i} className="bg-surface-dark border border-border-dark rounded-xl p-5 flex flex-col gap-3 hover:border-primary/30 transition-colors">
                        <div className="flex justify-between items-start">
                            <p className="text-[#9dabb9] text-sm font-medium">{stat.label}</p>
                            <span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-lg text-lg">{stat.icon}</span>
                        </div>
                        <div className="flex items-end gap-2">
                            <p className="text-white text-2xl font-bold font-mono">{stat.value}</p>
                            <span className={`text-xs font-medium mb-1 flex items-center ${stat.positive ? 'text-[#0bda5b]' : 'text-[#fa6238]'}`}>
                                <span className="material-symbols-outlined text-[14px]">{stat.positive ? 'arrow_upward' : 'arrow_downward'}</span>
                                {stat.change}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Server Metrics + Top Pages */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Server Resource Metrics */}
                <div className="bg-surface-dark border border-border-dark rounded-xl overflow-hidden">
                    <div className="bg-[#111418] border-b border-border-dark p-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-white font-bold text-base">Server Resources</h3>
                            <p className="text-[#9dabb9] text-xs mt-1">Real-time resource utilization</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-[#0bda5b] animate-pulse" />
                            <span className="text-[#0bda5b] text-xs font-medium">Uptime {uptime}</span>
                        </div>
                    </div>
                    <div className="p-5 flex flex-col gap-5">
                        {serverMetrics.map((metric, i) => (
                            <div key={i} className="flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px]" style={{ color: metric.color }}>{metric.icon}</span>
                                        <span className="text-[#9dabb9] text-sm">{metric.label}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-bold font-mono text-sm">{metric.value}{metric.unit}</span>
                                        <span className="text-[#586069] text-xs">/ {metric.max}{metric.unit}</span>
                                    </div>
                                </div>
                                <div className="h-2.5 bg-[#283039] rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-1000"
                                        style={{ width: `${(metric.value / metric.max) * 100}%`, backgroundColor: metric.color }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Pages */}
                <div className="bg-surface-dark border border-border-dark rounded-xl overflow-hidden">
                    <div className="bg-[#111418] border-b border-border-dark p-4">
                        <h3 className="text-white font-bold text-base">Top Pages</h3>
                        <p className="text-[#9dabb9] text-xs mt-1">Most visited pages (last 30 days)</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#18202a] border-b border-border-dark text-xs uppercase text-[#9dabb9] font-medium">
                                    <th className="p-4">#</th>
                                    <th className="p-4">Page Path</th>
                                    <th className="p-4 text-right">Views</th>
                                    <th className="p-4 text-right">Avg. Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-dark">
                                {topPages.map((page, i) => (
                                    <tr key={i} className="hover:bg-[#1f2937] transition-colors">
                                        <td className="p-4 text-[#586069] text-sm font-mono">{i + 1}</td>
                                        <td className="p-4 text-primary text-sm font-mono hover:underline cursor-pointer">{page.path}</td>
                                        <td className="p-4 text-white text-sm font-mono text-right">{page.views}</td>
                                        <td className="p-4 text-[#9dabb9] text-sm font-mono text-right">{page.avgTime}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
