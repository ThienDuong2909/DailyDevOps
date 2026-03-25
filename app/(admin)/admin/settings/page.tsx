'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Skeleton } from '@/components/shared/skeleton';
import toast from 'react-hot-toast';

interface SettingSection {
    id: string;
    icon: string;
    title: string;
    desc: string;
}

interface SettingsPayload {
    general: {
        siteName: string;
        siteUrl: string;
        siteDescription: string;
        language: string;
        timezone: string;
        postsPerPage: number;
        allowComments: boolean;
        moderateComments: boolean;
    };
    appearance: {
        darkModeDefault: boolean;
        primaryColor: string;
    };
    email: {
        smtpHost: string;
        smtpPort: string;
        smtpUser: string;
        notifyNewComment: boolean;
        notifyNewUser: boolean;
    };
    maintenance: {
        maintenanceMode: boolean;
    };
}

const sections: SettingSection[] = [
    { id: 'general', icon: 'language', title: 'General', desc: 'Site name, URL, description' },
    { id: 'appearance', icon: 'palette', title: 'Appearance', desc: 'Theme, logo, branding' },
    { id: 'email', icon: 'email', title: 'Email', desc: 'SMTP, notification templates' },
    { id: 'maintenance', icon: 'engineering', title: 'Maintenance', desc: 'Maintenance mode, backups' },
];

const defaultSettings: SettingsPayload = {
    general: {
        siteName: 'DevOps Blog',
        siteUrl: 'https://blog.thienduong.info',
        siteDescription: 'Expert articles on Kubernetes, CI/CD, Cloud Architecture, and DevOps best practices.',
        language: 'en',
        timezone: 'Asia/Ho_Chi_Minh',
        postsPerPage: 10,
        allowComments: true,
        moderateComments: true,
    },
    appearance: {
        darkModeDefault: true,
        primaryColor: '#00bcd4',
    },
    email: {
        smtpHost: '',
        smtpPort: '587',
        smtpUser: '',
        notifyNewComment: true,
        notifyNewUser: true,
    },
    maintenance: {
        maintenanceMode: false,
    },
};

function resolveData<T>(payload: unknown, fallback: T): T {
    if (payload && typeof payload === 'object' && 'data' in payload) {
        return ((payload as { data?: T }).data ?? fallback) as T;
    }

    return (payload as T) ?? fallback;
}

function SettingsSkeleton() {
    return (
        <div className="max-w-[1200px] mx-auto flex flex-col gap-6 lg:flex-row">
            <div className="lg:w-64 shrink-0">
                <div className="rounded-xl border border-border-dark bg-surface-dark p-4">
                    <Skeleton className="mb-4 h-4 w-28" />
                    <div className="space-y-3">
                        {Array.from({ length: 4 }, (_, index) => (
                            <Skeleton key={index} className="h-14 w-full rounded-lg" />
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex-1 rounded-xl border border-border-dark bg-surface-dark p-5">
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
    const [settings, setSettings] = useState<SettingsPayload>(defaultSettings);
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
                const resolved = resolveData<SettingsPayload>(payload, defaultSettings);

                if (!isMounted) {
                    return;
                }

                setSettings(resolved);
            } catch {
                if (!isMounted) {
                    return;
                }

                setSettings(defaultSettings);
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
            const resolved = resolveData<SettingsPayload>(payload, settings);
            setSettings(resolved);
            toast.success('Da luu system settings');
        } catch {
            toast.error('Khong the luu settings luc nay');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = <
        TSection extends keyof SettingsPayload,
        TField extends keyof SettingsPayload[TSection]
    >(
        section: TSection,
        field: TField,
        value: SettingsPayload[TSection][TField]
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
                <div className="sticky top-6 overflow-hidden rounded-xl border border-border-dark bg-surface-dark">
                    <div className="border-b border-border-dark bg-[#111418] p-4">
                        <h3 className="text-sm font-bold text-white">Settings</h3>
                    </div>
                    <div className="p-2">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`w-full rounded-lg px-3 py-2.5 text-left transition-all ${
                                    activeSection === section.id
                                        ? 'bg-primary/10 text-white'
                                        : 'text-[#9dabb9] hover:bg-[#283039] hover:text-white'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`material-symbols-outlined text-lg ${activeSection === section.id ? 'text-primary' : ''}`}>
                                        {section.icon}
                                    </span>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{section.title}</span>
                                        <span className="text-[10px] text-[#586069]">{section.desc}</span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden rounded-xl border border-border-dark bg-surface-dark">
                {errorMessage ? (
                    <div className="border-b border-border-dark bg-yellow-500/10 px-5 py-3 text-xs text-yellow-300">
                        {errorMessage}
                    </div>
                ) : null}

                {activeSection === 'general' ? (
                    <>
                        <div className="border-b border-border-dark bg-[#111418] p-5">
                            <h3 className="text-lg font-bold text-white">General Settings</h3>
                            <p className="mt-1 text-sm text-[#9dabb9]">Configure your site&apos;s basic information</p>
                        </div>
                        <div className="flex flex-col gap-5 p-5">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-white">Site Name</label>
                                <input className="rounded-lg border border-[#283039] bg-[#111418] px-4 py-2.5 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary" value={settings.general.siteName} onChange={(e) => handleChange('general', 'siteName', e.target.value)} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-white">Site URL</label>
                                <input className="rounded-lg border border-[#283039] bg-[#111418] px-4 py-2.5 font-mono text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary" value={settings.general.siteUrl} onChange={(e) => handleChange('general', 'siteUrl', e.target.value)} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-white">Site Description</label>
                                <textarea className="h-24 resize-none rounded-lg border border-[#283039] bg-[#111418] px-4 py-2.5 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary" value={settings.general.siteDescription} onChange={(e) => handleChange('general', 'siteDescription', e.target.value)} />
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-white">Language</label>
                                    <select className="cursor-pointer rounded-lg border border-[#283039] bg-[#111418] px-4 py-2.5 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary" value={settings.general.language} onChange={(e) => handleChange('general', 'language', e.target.value)}>
                                        <option value="en">English</option>
                                        <option value="vi">Tieng Viet</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-white">Timezone</label>
                                    <select className="cursor-pointer rounded-lg border border-[#283039] bg-[#111418] px-4 py-2.5 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary" value={settings.general.timezone} onChange={(e) => handleChange('general', 'timezone', e.target.value)}>
                                        <option value="Asia/Ho_Chi_Minh">Asia/Ho Chi Minh (UTC+7)</option>
                                        <option value="UTC">UTC</option>
                                        <option value="America/New_York">America/New York (EST)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-white">Posts Per Page</label>
                                <input type="number" className="w-32 rounded-lg border border-[#283039] bg-[#111418] px-4 py-2.5 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary" value={settings.general.postsPerPage} onChange={(e) => handleChange('general', 'postsPerPage', Number(e.target.value))} />
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
                        <div className="border-b border-border-dark bg-[#111418] p-5">
                            <h3 className="text-lg font-bold text-white">Appearance</h3>
                            <p className="mt-1 text-sm text-[#9dabb9]">Customize your site&apos;s look and feel</p>
                        </div>
                        <div className="flex flex-col gap-5 p-5">
                            <ToggleCard
                                title="Dark Mode Default"
                                description="Su dung giao dien toi lam mac dinh cho nguoi truy cap."
                                checked={settings.appearance.darkModeDefault}
                                onChange={(checked) => handleChange('appearance', 'darkModeDefault', checked)}
                            />
                            <div className="rounded-lg border border-[#283039] bg-[#111418] p-4">
                                <p className="mb-3 text-sm font-medium text-white">Primary Color</p>
                                <div className="flex gap-3">
                                    {['#137fec', '#00bcd4', '#7c3aed', '#0bda5b', '#fa6238'].map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => handleChange('appearance', 'primaryColor', color)}
                                            className={`size-8 rounded-full border-2 transition-colors ${settings.appearance.primaryColor === color ? 'border-white' : 'border-transparent'}`}
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
                        <div className="border-b border-border-dark bg-[#111418] p-5">
                            <h3 className="text-lg font-bold text-white">Email Settings</h3>
                            <p className="mt-1 text-sm text-[#9dabb9]">Configure SMTP and notification preferences</p>
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

                {activeSection === 'maintenance' ? (
                    <>
                        <div className="border-b border-border-dark bg-[#111418] p-5">
                            <h3 className="text-lg font-bold text-white">Maintenance</h3>
                            <p className="mt-1 text-sm text-[#9dabb9]">System maintenance and operational safety toggles</p>
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
                                    <p className="mt-1 text-xs text-[#9dabb9]">
                                        Hay dam bao ban da thong bao cho nguoi dung truoc khi bat che do nay tren production.
                                    </p>
                                </div>
                            ) : null}
                        </div>
                    </>
                ) : null}

                <div className="flex justify-end border-t border-border-dark bg-[#111418] p-5">
                    <button
                        onClick={() => void handleSave()}
                        disabled={saving}
                        className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
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
            <label className="text-sm font-medium text-white">{label}</label>
            <input
                className="rounded-lg border border-[#283039] bg-[#111418] px-4 py-2.5 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary"
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
        <div className="flex items-center justify-between rounded-lg border border-[#283039] bg-[#111418] p-4">
            <div>
                <p className="text-sm font-medium text-white">{title}</p>
                <p className="text-xs text-[#9dabb9]">{description}</p>
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
                    className={`block h-6 w-11 cursor-pointer rounded-full transition-colors after:absolute after:left-[2px] after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full ${destructive ? 'bg-[#283039] peer-checked:bg-[#fa6238]' : 'bg-[#283039] peer-checked:bg-primary'}`}
                />
            </div>
        </div>
    );
}
