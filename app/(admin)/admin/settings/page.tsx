'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Skeleton } from '@/components/shared/skeleton';
import { defaultSiteSettings, type SiteSettingsPayload } from '@/hooks/use-site-settings';
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
    { id: 'content', icon: 'view_compact', title: 'Content UI', desc: 'Header, footer, homepage blocks' },
    { id: 'maintenance', icon: 'engineering', title: 'Maintenance', desc: 'Maintenance mode, backups' },
];

function resolveData<T>(payload: unknown, fallback: T): T {
    if (payload && typeof payload === 'object' && 'data' in payload) {
        return ((payload as { data?: T }).data ?? fallback) as T;
    }

    return (payload as T) ?? fallback;
}

function serializeLinks(items: Array<{ label: string; href: string }>) {
    return items.map((item) => `${item.label}|${item.href}`).join('\n');
}

function parseLinks(value: string) {
    return value
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const [label, href] = line.split('|').map((part) => part.trim());
            return { label: label || '', href: href || '' };
        })
        .filter((item) => item.label && item.href);
}

function serializeTrendingTools(items: Array<{ name: string; shortName: string; description: string; href: string }>) {
    return items.map((item) => `${item.name}|${item.shortName}|${item.description}|${item.href}`).join('\n');
}

function parseTrendingTools(value: string) {
    return value
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const [name, shortName, description, href] = line.split('|').map((part) => part.trim());
            return {
                name: name || '',
                shortName: shortName || '',
                description: description || '',
                href: href || '',
            };
        })
        .filter((item) => item.name && item.shortName && item.href);
}

function SettingsSkeleton() {
    return (
        <div className="max-w-[1200px] mx-auto flex flex-col gap-6 lg:flex-row">
            <div className="lg:w-64 shrink-0">
                <div className="theme-panel rounded-2xl p-4">
                    <Skeleton className="mb-4 h-4 w-28" />
                    <div className="space-y-3">
                        {Array.from({ length: 4 }, (_, index) => (
                            <Skeleton key={index} className="h-14 w-full rounded-lg" />
                        ))}
                    </div>
                </div>
            </div>
            <div className="theme-panel flex-1 rounded-2xl p-5">
                <Skeleton className="mb-3 h-6 w-48" />
                <Skeleton className="mb-8 h-4 w-72" />
                <div className="space-y-5">
                    {Array.from({ length: 5 }, (_, index) => (
                        <Skeleton key={index} className="h-20 w-full rounded-xl" />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function SettingsPage() {
    const [activeSection, setActiveSection] = useState('general');
    const [settings, setSettings] = useState<SiteSettingsPayload>(defaultSiteSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        let isMounted = true;

        const fetchSettings = async () => {
            try {
                setLoading(true);
                setErrorMessage('');
                const payload = await apiClient.get<unknown>('/api/v1/settings');
                const resolved = resolveData<SiteSettingsPayload>(payload, defaultSiteSettings);

                if (!isMounted) {
                    return;
                }

                setSettings(resolved);
            } catch {
                if (!isMounted) {
                    return;
                }

                setSettings(defaultSiteSettings);
                setErrorMessage('Khong the tai system settings, dang hien thi gia tri mac dinh.');
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        void fetchSettings();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleSave = async () => {
        try {
            setSaving(true);
            const payload = await apiClient.put<unknown>('/api/v1/settings', settings);
            const resolved = resolveData<SiteSettingsPayload>(payload, settings);
            setSettings(resolved);
            toast.success('Da luu system settings');
        } catch {
            toast.error('Khong the luu settings luc nay');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = <
        TSection extends keyof SiteSettingsPayload,
        TField extends keyof SiteSettingsPayload[TSection]
    >(
        section: TSection,
        field: TField,
        value: SiteSettingsPayload[TSection][TField]
    ) => {
        setSettings((previous) => ({
            ...previous,
            [section]: {
                ...previous[section],
                [field]: value,
            },
        }));
    };

    if (loading) {
        return <SettingsSkeleton />;
    }

    return (
        <div className="max-w-[1200px] mx-auto flex flex-col gap-6 lg:flex-row">
            <div className="lg:w-64 shrink-0">
                <div className="theme-panel sticky top-6 overflow-hidden rounded-2xl">
                    <div className="theme-border border-b p-4">
                        <h3 className="text-sm font-bold text-[color:var(--text-main-theme)]">Settings</h3>
                    </div>
                    <div className="p-2">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`w-full rounded-lg px-3 py-2.5 text-left transition-all ${
                                    activeSection === section.id
                                        ? 'bg-primary/10 text-white'
                                        : 'theme-muted hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--text-main-theme)]'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`material-symbols-outlined text-lg ${activeSection === section.id ? 'text-primary' : ''}`}>
                                        {section.icon}
                                    </span>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{section.title}</span>
                                        <span className="theme-soft text-[10px]">{section.desc}</span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="theme-panel flex-1 overflow-hidden rounded-2xl">
                {errorMessage ? (
                    <div className="theme-border border-b bg-yellow-500/10 px-5 py-3 text-xs text-yellow-300">
                        {errorMessage}
                    </div>
                ) : null}

                {activeSection === 'general' ? (
                    <>
                        <div className="theme-border border-b p-5">
                            <h3 className="text-lg font-bold text-[color:var(--text-main-theme)]">General Settings</h3>
                            <p className="theme-muted mt-1 text-sm">Configure your site&apos;s basic information</p>
                        </div>
                        <div className="flex flex-col gap-5 p-5">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-[color:var(--text-main-theme)]">Site Name</label>
                                <input className="theme-input rounded-2xl px-4 py-2.5 text-sm" value={settings.general.siteName} onChange={(e) => handleChange('general', 'siteName', e.target.value)} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-[color:var(--text-main-theme)]">Site URL</label>
                                <input className="theme-input rounded-2xl px-4 py-2.5 font-mono text-sm" value={settings.general.siteUrl} onChange={(e) => handleChange('general', 'siteUrl', e.target.value)} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-[color:var(--text-main-theme)]">Site Description</label>
                                <textarea className="theme-input h-24 resize-none rounded-2xl px-4 py-2.5 text-sm" value={settings.general.siteDescription} onChange={(e) => handleChange('general', 'siteDescription', e.target.value)} />
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-[color:var(--text-main-theme)]">Language</label>
                                    <select className="theme-input cursor-pointer rounded-2xl px-4 py-2.5 text-sm" value={settings.general.language} onChange={(e) => handleChange('general', 'language', e.target.value)}>
                                        <option value="en">English</option>
                                        <option value="vi">Tieng Viet</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-[color:var(--text-main-theme)]">Timezone</label>
                                    <select className="theme-input cursor-pointer rounded-2xl px-4 py-2.5 text-sm" value={settings.general.timezone} onChange={(e) => handleChange('general', 'timezone', e.target.value)}>
                                        <option value="Asia/Ho_Chi_Minh">Asia/Ho Chi Minh (UTC+7)</option>
                                        <option value="UTC">UTC</option>
                                        <option value="America/New_York">America/New York (EST)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-[color:var(--text-main-theme)]">Posts Per Page</label>
                                <input type="number" className="theme-input w-32 rounded-2xl px-4 py-2.5 text-sm" value={settings.general.postsPerPage} onChange={(e) => handleChange('general', 'postsPerPage', Number(e.target.value))} />
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <ToggleCard
                                    title="Allow Comments"
                                    description="Cho phep doc gia gui binh luan moi."
                                    checked={settings.general.allowComments}
                                    onChange={(checked) => handleChange('general', 'allowComments', checked)}
                                />
                                <ToggleCard
                                    title="Moderate Comments"
                                    description="Yeu cau duyet truoc khi comments hien cong khai."
                                    checked={settings.general.moderateComments}
                                    onChange={(checked) => handleChange('general', 'moderateComments', checked)}
                                />
                            </div>
                        </div>
                    </>
                ) : null}

                {activeSection === 'appearance' ? (
                    <>
                        <div className="theme-border border-b p-5">
                            <h3 className="text-lg font-bold text-[color:var(--text-main-theme)]">Appearance</h3>
                            <p className="theme-muted mt-1 text-sm">Customize your site&apos;s look and feel</p>
                        </div>
                        <div className="flex flex-col gap-5 p-5">
                            <ToggleCard
                                title="Dark Mode Default"
                                description="Su dung giao dien toi lam mac dinh cho nguoi truy cap."
                                checked={settings.appearance.darkModeDefault}
                                onChange={(checked) => handleChange('appearance', 'darkModeDefault', checked)}
                            />
                            <div className="theme-panel-muted theme-border rounded-2xl border p-4">
                                <p className="mb-3 text-sm font-medium text-[color:var(--text-main-theme)]">Primary Color</p>
                                <div className="flex gap-3">
                                    {['#137fec', '#00bcd4', '#7c3aed', '#0bda5b', '#fa6238'].map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => handleChange('appearance', 'primaryColor', color)}
                                            className={`size-8 rounded-full border-2 transition-colors ${settings.appearance.primaryColor === color ? 'border-[color:var(--text-main-theme)]' : 'border-transparent'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                ) : null}

                {activeSection === 'email' ? (
                    <>
                        <div className="theme-border border-b p-5">
                            <h3 className="text-lg font-bold text-[color:var(--text-main-theme)]">Email Settings</h3>
                            <p className="theme-muted mt-1 text-sm">Configure SMTP and notification preferences</p>
                        </div>
                        <div className="flex flex-col gap-5 p-5">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <Field label="SMTP Host" value={settings.email.smtpHost} onChange={(value) => handleChange('email', 'smtpHost', value)} />
                                <Field label="SMTP Port" value={settings.email.smtpPort} onChange={(value) => handleChange('email', 'smtpPort', value)} />
                                <Field label="SMTP User" value={settings.email.smtpUser} onChange={(value) => handleChange('email', 'smtpUser', value)} />
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <ToggleCard
                                    title="Notify on New Comments"
                                    description="Gui email khi co comment moi can xu ly."
                                    checked={settings.email.notifyNewComment}
                                    onChange={(checked) => handleChange('email', 'notifyNewComment', checked)}
                                />
                                <ToggleCard
                                    title="Notify on New Users"
                                    description="Gui email khi co user moi dang ky."
                                    checked={settings.email.notifyNewUser}
                                    onChange={(checked) => handleChange('email', 'notifyNewUser', checked)}
                                />
                            </div>
                        </div>
                    </>
                ) : null}

                {activeSection === 'content' ? (
                    <>
                        <div className="theme-border border-b p-5">
                            <h3 className="text-lg font-bold text-[color:var(--text-main-theme)]">Content UI</h3>
                            <p className="theme-muted mt-1 text-sm">Quan ly menu header, footer va trending tools o homepage</p>
                        </div>
                        <div className="flex flex-col gap-5 p-5">
                            <TextAreaField
                                label="Header Navigation"
                                description="Moi dong theo dinh dang: label|href"
                                rows={6}
                                value={serializeLinks(settings.content.headerNavigation)}
                                onChange={(value) => handleChange('content', 'headerNavigation', parseLinks(value))}
                            />
                            <TextAreaField
                                label="Footer Description"
                                description="Doan mo ta ngan o chan trang blog"
                                rows={4}
                                value={settings.content.footerDescription}
                                onChange={(value) => handleChange('content', 'footerDescription', value)}
                            />
                            <TextAreaField
                                label="Footer Content Links"
                                description="Moi dong theo dinh dang: label|href"
                                rows={6}
                                value={serializeLinks(settings.content.footerContentLinks)}
                                onChange={(value) => handleChange('content', 'footerContentLinks', parseLinks(value))}
                            />
                            <TextAreaField
                                label="Footer Company Links"
                                description="Moi dong theo dinh dang: label|href"
                                rows={6}
                                value={serializeLinks(settings.content.footerCompanyLinks)}
                                onChange={(value) => handleChange('content', 'footerCompanyLinks', parseLinks(value))}
                            />
                            <TextAreaField
                                label="Trending Tools"
                                description="Moi dong theo dinh dang: name|shortName|description|href"
                                rows={7}
                                value={serializeTrendingTools(settings.content.trendingTools)}
                                onChange={(value) => handleChange('content', 'trendingTools', parseTrendingTools(value))}
                            />
                        </div>
                    </>
                ) : null}

                {activeSection === 'maintenance' ? (
                    <>
                        <div className="theme-border border-b p-5">
                            <h3 className="text-lg font-bold text-[color:var(--text-main-theme)]">Maintenance</h3>
                            <p className="theme-muted mt-1 text-sm">System maintenance and operational safety toggles</p>
                        </div>
                        <div className="flex flex-col gap-5 p-5">
                            <ToggleCard
                                title="Maintenance Mode"
                                description="Hien trang bao tri cho khach truy cap ben ngoai."
                                checked={settings.maintenance.maintenanceMode}
                                onChange={(checked) => handleChange('maintenance', 'maintenanceMode', checked)}
                                destructive={settings.maintenance.maintenanceMode}
                            />
                            {settings.maintenance.maintenanceMode ? (
                                <div className="rounded-lg border border-[#fa6238]/20 bg-[#fa6238]/10 p-4">
                                    <div className="flex items-center gap-2 text-[#fa6238]">
                                        <span className="material-symbols-outlined">warning</span>
                                        <p className="text-sm font-bold">Maintenance mode is ON</p>
                                    </div>
                                    <p className="theme-muted mt-1 text-xs">
                                        Hay dam bao ban da thong bao cho nguoi dung truoc khi bat che do nay tren production.
                                    </p>
                                </div>
                            ) : null}
                        </div>
                    </>
                ) : null}

                <div className="theme-border flex justify-end border-t p-5">
                    <button
                        onClick={() => void handleSave()}
                        disabled={saving}
                        className="theme-glow-button flex items-center gap-2 rounded-2xl px-6 py-2.5 text-sm font-bold transition-opacity hover:opacity-95 disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-[18px]">{saving ? 'sync' : 'save'}</span>
                        {saving ? 'Dang luu...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function Field({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[color:var(--text-main-theme)]">{label}</label>
            <input
                className="theme-input rounded-2xl px-4 py-2.5 text-sm"
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
        </div>
    );
}

function TextAreaField({
    label,
    description,
    rows,
    value,
    onChange,
}: {
    label: string;
    description: string;
    rows: number;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[color:var(--text-main-theme)]">{label}</label>
            <p className="theme-muted text-xs">{description}</p>
            <textarea
                rows={rows}
                className="theme-input resize-none rounded-2xl px-4 py-2.5 text-sm font-mono"
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
        </div>
    );
}

function ToggleCard({
    title,
    description,
    checked,
    onChange,
    destructive = false,
}: {
    title: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    destructive?: boolean;
}) {
    return (
        <div className="theme-panel-muted theme-border flex items-center justify-between rounded-2xl border p-4">
            <div>
                <p className="text-sm font-medium text-[color:var(--text-main-theme)]">{title}</p>
                <p className="theme-muted text-xs">{description}</p>
            </div>
            <div className="relative">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => onChange(event.target.checked)}
                    className="peer sr-only"
                    id={title}
                />
                <label
                    htmlFor={title}
                    className={`block h-6 w-11 cursor-pointer rounded-full transition-colors after:absolute after:left-[2px] after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full ${destructive ? 'bg-[color:var(--surface-strong)] peer-checked:bg-[#fa6238]' : 'bg-[color:var(--surface-strong)] peer-checked:bg-primary'}`}
                />
            </div>
        </div>
    );
}
