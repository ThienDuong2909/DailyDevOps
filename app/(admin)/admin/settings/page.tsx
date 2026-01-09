'use client';

import { useState } from 'react';

// ==============================================
// TYPE DEFINITIONS
// ==============================================

interface GeneralSettings {
    siteName: string;
    tagline: string;
    siteLanguage: string;
    timezone: string;
    logoUrl: string | null;
}

interface EmailSettings {
    systemAlerts: boolean;
    newUserRegistration: boolean;
    senderEmail: string;
}

interface BackupSettings {
    maintenanceMode: boolean;
    backupFrequency: string;
    storageDestination: string;
    lastBackup: string;
    backupSize: string;
}

interface Integration {
    id: string;
    name: string;
    description: string;
    icon: string;
    iconColor: string;
    iconBg: string;
    iconBorder: string;
    status: 'ACTIVE' | 'INACTIVE';
    lastSync?: string;
    buttonLabel: string;
    buttonVariant: 'primary' | 'secondary';
}

// ==============================================
// SAMPLE DATA - Replace with API data
// ==============================================

const defaultGeneralSettings: GeneralSettings = {
    siteName: 'DevOps Blog',
    tagline: 'Automate Everything, Deploy Anywhere',
    siteLanguage: 'English (US)',
    timezone: '(UTC+00:00) Coordinated Universal Time',
    logoUrl: null,
};

const defaultEmailSettings: EmailSettings = {
    systemAlerts: true,
    newUserRegistration: false,
    senderEmail: 'system@devops-blog.com',
};

const defaultBackupSettings: BackupSettings = {
    maintenanceMode: false,
    backupFrequency: 'Daily at 00:00 UTC',
    storageDestination: 's3://devops-blog-backups',
    lastBackup: 'Today, 04:00 AM',
    backupSize: '1.2 GB',
};

const sampleIntegrations: Integration[] = [
    {
        id: '1',
        name: 'Slack Notifications',
        description: 'Post new articles and comment alerts to a Slack channel.',
        icon: 'forum',
        iconColor: 'text-[#36C5F0]',
        iconBg: 'bg-[#36C5F0]/10',
        iconBorder: 'border-[#36C5F0]/20',
        status: 'ACTIVE',
        buttonLabel: 'Configure',
        buttonVariant: 'secondary',
    },
    {
        id: '2',
        name: 'Google Analytics 4',
        description: 'Track traffic, user behavior, and site performance.',
        icon: 'analytics',
        iconColor: 'text-[#F9AB00]',
        iconBg: 'bg-[#F9AB00]/10',
        iconBorder: 'border-[#F9AB00]/20',
        status: 'INACTIVE',
        buttonLabel: 'Connect',
        buttonVariant: 'primary',
    },
    {
        id: '3',
        name: 'GitHub Sync',
        description: 'Automatically backup content markdown files to a private repository.',
        icon: 'terminal',
        iconColor: 'text-white',
        iconBg: 'bg-white/10',
        iconBorder: 'border-white/20',
        status: 'ACTIVE',
        lastSync: '5m ago',
        buttonLabel: 'Manage',
        buttonVariant: 'secondary',
    },
];

const languages = ['English (US)', 'Spanish (ES)', 'French (FR)', 'German (DE)'];
const timezones = [
    '(UTC-08:00) Pacific Time',
    '(UTC+00:00) Coordinated Universal Time',
    '(UTC+01:00) Central European Time',
    '(UTC+07:00) Indochina Time',
];
const backupFrequencies = ['Daily at 00:00 UTC', 'Weekly on Sundays', 'Monthly', 'Disabled'];

// ==============================================
// TOGGLE COMPONENT
// ==============================================

function Toggle({ checked, onChange, id }: { checked: boolean; onChange: () => void; id: string }) {
    return (
        <label className="relative inline-flex items-center cursor-pointer">
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className="sr-only peer"
                id={id}
            />
            <div className="w-10 h-5 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
        </label>
    );
}

// ==============================================
// MAIN COMPONENT
// ==============================================

export default function SettingsPage() {
    // State
    const [generalSettings, setGeneralSettings] = useState<GeneralSettings>(defaultGeneralSettings);
    const [emailSettings, setEmailSettings] = useState<EmailSettings>(defaultEmailSettings);
    const [backupSettings, setBackupSettings] = useState<BackupSettings>(defaultBackupSettings);
    const [integrations] = useState<Integration[]>(sampleIntegrations);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Handlers
    const handleSaveGeneral = async () => {
        setIsSaving(true);
        await new Promise((r) => setTimeout(r, 1000));
        setIsSaving(false);
        // TODO: API call
    };

    const handleTestEmail = () => {
        // TODO: Send test email
        console.log('Sending test email...');
    };

    const handleBackupNow = () => {
        // TODO: Trigger backup
        console.log('Starting backup...');
    };

    const handleSaveAll = async () => {
        setIsSaving(true);
        await new Promise((r) => setTimeout(r, 1500));
        setIsSaving(false);
        // TODO: Save all settings
    };

    return (
        <div className="max-w-5xl mx-auto flex flex-col gap-8">
            {/* General Information Section */}
            <section className="bg-surface-dark border border-border-dark rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-border-dark flex justify-between items-center">
                    <div>
                        <h3 className="text-white text-lg font-bold">General Information</h3>
                        <p className="text-[#9dabb9] text-sm mt-1">
                            Configure basic site details, localization, and branding.
                        </p>
                    </div>
                    <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-lg">
                        tune
                    </span>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[#9dabb9] mb-1">Site Name</label>
                            <input
                                type="text"
                                value={generalSettings.siteName}
                                onChange={(e) => setGeneralSettings({ ...generalSettings, siteName: e.target.value })}
                                className="w-full bg-[#283039] border border-border-dark rounded-lg px-3 py-2 text-white focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#9dabb9] mb-1">Tagline</label>
                            <input
                                type="text"
                                value={generalSettings.tagline}
                                onChange={(e) => setGeneralSettings({ ...generalSettings, tagline: e.target.value })}
                                className="w-full bg-[#283039] border border-border-dark rounded-lg px-3 py-2 text-white focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#9dabb9] mb-1">Site Language</label>
                            <select
                                value={generalSettings.siteLanguage}
                                onChange={(e) => setGeneralSettings({ ...generalSettings, siteLanguage: e.target.value })}
                                className="w-full bg-[#283039] border border-border-dark rounded-lg px-3 py-2 text-white focus:border-primary focus:ring-1 focus:ring-primary text-sm appearance-none cursor-pointer"
                            >
                                {languages.map((lang) => (
                                    <option key={lang}>{lang}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#9dabb9] mb-1">Timezone</label>
                            <select
                                value={generalSettings.timezone}
                                onChange={(e) => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
                                className="w-full bg-[#283039] border border-border-dark rounded-lg px-3 py-2 text-white focus:border-primary focus:ring-1 focus:ring-primary text-sm appearance-none cursor-pointer"
                            >
                                {timezones.map((tz) => (
                                    <option key={tz}>{tz}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4">
                        <label className="block text-sm font-medium text-[#9dabb9]">Site Logo</label>
                        <div className="flex-1 bg-[#283039] border-2 border-dashed border-[#3b4754] rounded-lg flex flex-col items-center justify-center p-6 text-center hover:border-primary/50 transition-colors cursor-pointer group">
                            <div className="size-16 bg-[#111418] rounded-full flex items-center justify-center mb-3 border border-border-dark shadow-lg">
                                <span className="material-symbols-outlined text-[#9dabb9] text-3xl group-hover:text-primary transition-colors">
                                    cloud_upload
                                </span>
                            </div>
                            <p className="text-white text-sm font-medium">Click to upload or drag & drop</p>
                            <p className="text-[#9dabb9] text-xs mt-1">SVG, PNG, JPG (max. 2MB)</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#111418] px-6 py-4 border-t border-border-dark flex justify-end">
                    <button
                        onClick={handleSaveGeneral}
                        disabled={isSaving}
                        className="bg-primary hover:bg-primary/90 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-[18px]">save</span>
                        Save Changes
                    </button>
                </div>
            </section>

            {/* Email & Backup Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Email Notifications Section */}
                <section className="bg-surface-dark border border-border-dark rounded-xl overflow-hidden shadow-sm flex flex-col">
                    <div className="p-6 border-b border-border-dark">
                        <h3 className="text-white text-lg font-bold">Email Notifications</h3>
                        <p className="text-[#9dabb9] text-sm mt-1">Manage system alerts and newsletter settings.</p>
                    </div>
                    <div className="p-6 space-y-6 flex-1">
                        {/* System Alerts Toggle */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white text-sm font-medium">System Alerts</p>
                                <p className="text-[#9dabb9] text-xs">Receive emails about critical system errors</p>
                            </div>
                            <Toggle
                                checked={emailSettings.systemAlerts}
                                onChange={() => setEmailSettings({ ...emailSettings, systemAlerts: !emailSettings.systemAlerts })}
                                id="toggle-sys"
                            />
                        </div>

                        <div className="border-t border-border-dark" />

                        {/* New User Registration Toggle */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white text-sm font-medium">New User Registration</p>
                                <p className="text-[#9dabb9] text-xs">Notify when a new admin user is created</p>
                            </div>
                            <Toggle
                                checked={emailSettings.newUserRegistration}
                                onChange={() => setEmailSettings({ ...emailSettings, newUserRegistration: !emailSettings.newUserRegistration })}
                                id="toggle-user"
                            />
                        </div>

                        <div className="border-t border-border-dark" />

                        {/* SMTP Configuration */}
                        <div className="space-y-4">
                            <h4 className="text-white text-sm font-bold">SMTP Configuration</h4>
                            <div>
                                <label className="block text-sm font-medium text-[#9dabb9] mb-1">Sender Email</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9dabb9]">
                                        <span className="material-symbols-outlined text-lg">mail</span>
                                    </span>
                                    <input
                                        type="email"
                                        value={emailSettings.senderEmail}
                                        onChange={(e) => setEmailSettings({ ...emailSettings, senderEmail: e.target.value })}
                                        placeholder="noreply@devopsblog.com"
                                        className="w-full bg-[#283039] border border-border-dark rounded-lg pl-10 pr-3 py-2 text-white focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-[#111418] px-6 py-4 border-t border-border-dark flex justify-end">
                        <button
                            onClick={handleTestEmail}
                            className="text-[#9dabb9] hover:text-white text-sm font-medium mr-4"
                        >
                            Test Email
                        </button>
                        <button className="bg-[#283039] hover:bg-[#3b4754] text-white text-sm font-medium px-4 py-2 rounded-lg border border-border-dark transition-colors">
                            Save Settings
                        </button>
                    </div>
                </section>

                {/* Backup & Maintenance Section */}
                <section className="bg-surface-dark border border-border-dark rounded-xl overflow-hidden shadow-sm flex flex-col">
                    <div className="p-6 border-b border-border-dark">
                        <h3 className="text-white text-lg font-bold">Backup & Maintenance</h3>
                        <p className="text-[#9dabb9] text-sm mt-1">Configure automated backups and maintenance mode.</p>
                    </div>
                    <div className="p-6 space-y-6 flex-1">
                        {/* Maintenance Mode Banner */}
                        <div className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-yellow-500">construction</span>
                                <div>
                                    <p className="text-white text-sm font-medium">Maintenance Mode</p>
                                    <p className="text-yellow-500/80 text-xs">
                                        {backupSettings.maintenanceMode ? 'Site is currently under maintenance' : 'Site is currently live'}
                                    </p>
                                </div>
                            </div>
                            <Toggle
                                checked={backupSettings.maintenanceMode}
                                onChange={() => setBackupSettings({ ...backupSettings, maintenanceMode: !backupSettings.maintenanceMode })}
                                id="toggle-maint"
                            />
                        </div>

                        {/* Backup Settings */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#9dabb9] mb-1">Backup Frequency</label>
                                <select
                                    value={backupSettings.backupFrequency}
                                    onChange={(e) => setBackupSettings({ ...backupSettings, backupFrequency: e.target.value })}
                                    className="w-full bg-[#283039] border border-border-dark rounded-lg px-3 py-2 text-white focus:border-primary focus:ring-1 focus:ring-primary text-sm cursor-pointer"
                                >
                                    {backupFrequencies.map((freq) => (
                                        <option key={freq}>{freq}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#9dabb9] mb-1">Storage Destination</label>
                                <div className="flex items-center gap-2 bg-[#283039] border border-border-dark rounded-lg px-3 py-2">
                                    <span className="material-symbols-outlined text-[#9dabb9] text-lg">cloud</span>
                                    <input
                                        type="text"
                                        value={backupSettings.storageDestination}
                                        onChange={(e) => setBackupSettings({ ...backupSettings, storageDestination: e.target.value })}
                                        className="w-full bg-transparent border-none p-0 text-white focus:ring-0 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Backup Info */}
                        <div className="flex items-center justify-between pt-2">
                            <div className="text-xs text-[#9dabb9]">
                                Last backup: <span className="text-white">{backupSettings.lastBackup}</span>
                            </div>
                            <div className="text-xs text-[#9dabb9]">
                                Size: <span className="text-white">{backupSettings.backupSize}</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-[#111418] px-6 py-4 border-t border-border-dark flex justify-end">
                        <button
                            onClick={handleBackupNow}
                            className="bg-[#283039] hover:bg-[#3b4754] text-white text-sm font-medium px-4 py-2 rounded-lg border border-border-dark transition-colors flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[18px]">backup</span>
                            Backup Now
                        </button>
                    </div>
                </section>
            </div>

            {/* Third-Party Integrations Section */}
            <section className="bg-surface-dark border border-border-dark rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-border-dark">
                    <h3 className="text-white text-lg font-bold">Third-Party Integrations</h3>
                    <p className="text-[#9dabb9] text-sm mt-1">Connect your blog with external services and tools.</p>
                </div>
                <div className="divide-y divide-border-dark">
                    {integrations.map((integration) => (
                        <div
                            key={integration.id}
                            className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:bg-[#283039]/30 transition-colors"
                        >
                            <div className={`size-12 rounded-lg ${integration.iconBg} flex items-center justify-center border ${integration.iconBorder} shrink-0`}>
                                <span className={`material-symbols-outlined ${integration.iconColor} text-2xl`}>
                                    {integration.icon}
                                </span>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-white font-medium flex items-center gap-2">
                                    {integration.name}
                                    {integration.status === 'ACTIVE' && (
                                        <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full border border-green-500/20">
                                            Active
                                        </span>
                                    )}
                                </h4>
                                <p className="text-[#9dabb9] text-sm mt-1">{integration.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {integration.lastSync && (
                                    <span className="text-[#9dabb9] text-xs font-mono">last sync: {integration.lastSync}</span>
                                )}
                                <button
                                    className={
                                        integration.buttonVariant === 'primary'
                                            ? 'text-white px-3 py-2 rounded-lg bg-primary hover:bg-primary/90 text-sm font-medium transition-colors'
                                            : 'text-[#9dabb9] hover:text-white px-3 py-2 rounded-lg border border-border-dark bg-[#111418] text-sm font-medium transition-colors'
                                    }
                                >
                                    {integration.buttonLabel}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Save All Footer */}
            <div className="flex justify-end gap-3 pb-8">
                <button className="px-6 py-2.5 rounded-lg border border-border-dark text-[#9dabb9] hover:text-white hover:bg-[#283039] transition-colors text-sm font-medium">
                    Discard Changes
                </button>
                <button
                    onClick={handleSaveAll}
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all text-sm font-bold flex items-center gap-2 disabled:opacity-50"
                >
                    <span className="material-symbols-outlined text-[20px]">
                        {isSaving ? 'sync' : 'check'}
                    </span>
                    {isSaving ? 'Saving...' : 'Save All Settings'}
                </button>
            </div>
        </div>
    );
}
