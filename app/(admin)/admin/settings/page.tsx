'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface SettingSection {
    id: string;
    icon: string;
    title: string;
    desc: string;
}

const sections: SettingSection[] = [
    { id: 'general', icon: 'language', title: 'General', desc: 'Site name, URL, description' },
    { id: 'appearance', icon: 'palette', title: 'Appearance', desc: 'Theme, logo, branding' },
    { id: 'email', icon: 'email', title: 'Email', desc: 'SMTP, notification templates' },
    { id: 'maintenance', icon: 'engineering', title: 'Maintenance', desc: 'Maintenance mode, backups' },
];

export default function SettingsPage() {
    const [activeSection, setActiveSection] = useState('general');
    const [settings, setSettings] = useState({
        siteName: 'DevOps Blog',
        siteUrl: 'https://blog.thienduong.info',
        siteDescription: 'Expert articles on Kubernetes, CI/CD, Cloud Architecture, and DevOps best practices.',
        language: 'en',
        timezone: 'Asia/Ho_Chi_Minh',
        postsPerPage: 10,
        allowComments: true,
        moderateComments: true,
        maintenanceMode: false,
        smtpHost: '',
        smtpPort: '587',
        smtpUser: '',
        notifyNewComment: true,
        notifyNewUser: true,
    });

    const handleSave = () => {
        toast.success('Settings saved successfully');
    };

    const handleChange = (key: string, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-6">
            {/* Sidebar Navigation */}
            <div className="lg:w-64 shrink-0">
                <div className="bg-surface-dark border border-border-dark rounded-xl overflow-hidden sticky top-6">
                    <div className="p-4 border-b border-border-dark bg-[#111418]">
                        <h3 className="text-white font-bold text-sm">Settings</h3>
                    </div>
                    <div className="p-2">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                                    activeSection === section.id
                                        ? 'bg-primary/10 text-white'
                                        : 'text-[#9dabb9] hover:bg-[#283039] hover:text-white'
                                }`}
                            >
                                <span className={`material-symbols-outlined text-lg ${activeSection === section.id ? 'text-primary' : ''}`}>
                                    {section.icon}
                                </span>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">{section.title}</span>
                                    <span className="text-[10px] text-[#586069]">{section.desc}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1">
                <div className="bg-surface-dark border border-border-dark rounded-xl overflow-hidden">
                    {/* General */}
                    {activeSection === 'general' && (
                        <>
                            <div className="bg-[#111418] border-b border-border-dark p-5">
                                <h3 className="text-white font-bold text-lg">General Settings</h3>
                                <p className="text-[#9dabb9] text-sm mt-1">Configure your site's basic information</p>
                            </div>
                            <div className="p-5 flex flex-col gap-5">
                                <div className="flex flex-col gap-2">
                                    <label className="text-white text-sm font-medium">Site Name</label>
                                    <input className="bg-[#111418] border border-[#283039] rounded-lg px-4 py-2.5 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary" value={settings.siteName} onChange={(e) => handleChange('siteName', e.target.value)} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-white text-sm font-medium">Site URL</label>
                                    <input className="bg-[#111418] border border-[#283039] rounded-lg px-4 py-2.5 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary font-mono" value={settings.siteUrl} onChange={(e) => handleChange('siteUrl', e.target.value)} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-white text-sm font-medium">Site Description</label>
                                    <textarea className="bg-[#111418] border border-[#283039] rounded-lg px-4 py-2.5 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary resize-none h-24" value={settings.siteDescription} onChange={(e) => handleChange('siteDescription', e.target.value)} />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-white text-sm font-medium">Language</label>
                                        <select className="bg-[#111418] border border-[#283039] rounded-lg px-4 py-2.5 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer" value={settings.language} onChange={(e) => handleChange('language', e.target.value)}>
                                            <option value="en">English</option>
                                            <option value="vi">Tiếng Việt</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-white text-sm font-medium">Timezone</label>
                                        <select className="bg-[#111418] border border-[#283039] rounded-lg px-4 py-2.5 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer" value={settings.timezone} onChange={(e) => handleChange('timezone', e.target.value)}>
                                            <option value="Asia/Ho_Chi_Minh">Asia/Ho Chi Minh (UTC+7)</option>
                                            <option value="UTC">UTC</option>
                                            <option value="America/New_York">America/New York (EST)</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-white text-sm font-medium">Posts Per Page</label>
                                    <input type="number" className="bg-[#111418] border border-[#283039] rounded-lg px-4 py-2.5 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary w-32" value={settings.postsPerPage} onChange={(e) => handleChange('postsPerPage', parseInt(e.target.value))} />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Appearance */}
                    {activeSection === 'appearance' && (
                        <>
                            <div className="bg-[#111418] border-b border-border-dark p-5">
                                <h3 className="text-white font-bold text-lg">Appearance</h3>
                                <p className="text-[#9dabb9] text-sm mt-1">Customize your site's look and feel</p>
                            </div>
                            <div className="p-5 flex flex-col gap-5">
                                <div className="flex items-center justify-between p-4 bg-[#111418] rounded-lg border border-[#283039]">
                                    <div>
                                        <p className="text-white text-sm font-medium">Dark Mode Default</p>
                                        <p className="text-[#9dabb9] text-xs">Show dark mode by default to visitors</p>
                                    </div>
                                    <div className="relative">
                                        <input type="checkbox" defaultChecked className="sr-only peer" id="darkMode" />
                                        <label htmlFor="darkMode" className="block w-11 h-6 rounded-full bg-[#283039] peer-checked:bg-primary cursor-pointer transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                                    </div>
                                </div>
                                <div className="p-4 bg-[#111418] rounded-lg border border-[#283039]">
                                    <p className="text-white text-sm font-medium mb-3">Primary Color</p>
                                    <div className="flex gap-3">
                                        {['#137fec', '#00bcd4', '#7c3aed', '#0bda5b', '#fa6238'].map((color) => (
                                            <button key={color} className="size-8 rounded-full border-2 border-transparent hover:border-white transition-colors ring-2 ring-[#283039]" style={{ backgroundColor: color }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Email */}
                    {activeSection === 'email' && (
                        <>
                            <div className="bg-[#111418] border-b border-border-dark p-5">
                                <h3 className="text-white font-bold text-lg">Email Settings</h3>
                                <p className="text-[#9dabb9] text-sm mt-1">Configure email notifications</p>
                            </div>
                            <div className="p-5 flex flex-col gap-5">
                                <div className="flex items-center justify-between p-4 bg-[#111418] rounded-lg border border-[#283039]">
                                    <div>
                                        <p className="text-white text-sm font-medium">Notify on New Comments</p>
                                        <p className="text-[#9dabb9] text-xs">Receive email when someone comments</p>
                                    </div>
                                    <div className="relative">
                                        <input type="checkbox" checked={settings.notifyNewComment} onChange={(e) => handleChange('notifyNewComment', e.target.checked)} className="sr-only peer" id="notifyComment" />
                                        <label htmlFor="notifyComment" className="block w-11 h-6 rounded-full bg-[#283039] peer-checked:bg-primary cursor-pointer transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-[#111418] rounded-lg border border-[#283039]">
                                    <div>
                                        <p className="text-white text-sm font-medium">Notify on New Users</p>
                                        <p className="text-[#9dabb9] text-xs">Receive email when a new user registers</p>
                                    </div>
                                    <div className="relative">
                                        <input type="checkbox" checked={settings.notifyNewUser} onChange={(e) => handleChange('notifyNewUser', e.target.checked)} className="sr-only peer" id="notifyUser" />
                                        <label htmlFor="notifyUser" className="block w-11 h-6 rounded-full bg-[#283039] peer-checked:bg-primary cursor-pointer transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Maintenance */}
                    {activeSection === 'maintenance' && (
                        <>
                            <div className="bg-[#111418] border-b border-border-dark p-5">
                                <h3 className="text-white font-bold text-lg">Maintenance</h3>
                                <p className="text-[#9dabb9] text-sm mt-1">System maintenance and backups</p>
                            </div>
                            <div className="p-5 flex flex-col gap-5">
                                <div className="flex items-center justify-between p-4 bg-[#111418] rounded-lg border border-[#283039]">
                                    <div>
                                        <p className="text-white text-sm font-medium">Maintenance Mode</p>
                                        <p className="text-[#9dabb9] text-xs">Show a maintenance page to visitors</p>
                                    </div>
                                    <div className="relative">
                                        <input type="checkbox" checked={settings.maintenanceMode} onChange={(e) => handleChange('maintenanceMode', e.target.checked)} className="sr-only peer" id="maintenance" />
                                        <label htmlFor="maintenance" className="block w-11 h-6 rounded-full bg-[#283039] peer-checked:bg-[#fa6238] cursor-pointer transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                                    </div>
                                </div>
                                {settings.maintenanceMode && (
                                    <div className="p-4 bg-[#fa6238]/10 border border-[#fa6238]/20 rounded-lg">
                                        <div className="flex items-center gap-2 text-[#fa6238]">
                                            <span className="material-symbols-outlined">warning</span>
                                            <p className="text-sm font-bold">Maintenance mode is ON</p>
                                        </div>
                                        <p className="text-[#9dabb9] text-xs mt-1">Your site is currently showing a maintenance page to all visitors.</p>
                                    </div>
                                )}
                                <div className="flex items-center justify-between p-4 bg-[#111418] rounded-lg border border-[#283039]">
                                    <div>
                                        <p className="text-white text-sm font-medium">Comment Moderation</p>
                                        <p className="text-[#9dabb9] text-xs">Require approval before comments are published</p>
                                    </div>
                                    <div className="relative">
                                        <input type="checkbox" checked={settings.moderateComments} onChange={(e) => handleChange('moderateComments', e.target.checked)} className="sr-only peer" id="moderate" />
                                        <label htmlFor="moderate" className="block w-11 h-6 rounded-full bg-[#283039] peer-checked:bg-primary cursor-pointer transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Save Button */}
                    <div className="border-t border-border-dark p-5 flex justify-end bg-[#111418]">
                        <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold text-sm rounded-lg transition-colors shadow-lg shadow-primary/20">
                            <span className="material-symbols-outlined text-[18px]">save</span>
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
