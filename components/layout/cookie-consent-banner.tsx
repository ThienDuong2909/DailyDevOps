'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
    createConsentRecord,
    defaultConsentPreferences,
    readConsent,
    saveConsent,
    type ConsentPreferences,
} from '@/lib/consent';

export function CookieConsentBanner() {
    const [isVisible, setIsVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isCustomizing, setIsCustomizing] = useState(false);
    const [preferences, setPreferences] = useState<ConsentPreferences>(defaultConsentPreferences);

    useEffect(() => {
        const currentConsent = readConsent();
        setIsVisible(!currentConsent);

        if (currentConsent?.preferences) {
            setPreferences(currentConsent.preferences);
        }
    }, []);

    const persistConsent = async (
        status: 'accepted' | 'essential-only' | 'customized',
        nextPreferences: ConsentPreferences
    ) => {
        try {
            setIsSaving(true);
            await saveConsent(
                createConsentRecord(status, {
                    analytics: nextPreferences.analytics,
                    marketing: nextPreferences.marketing,
                })
            );
            setPreferences(nextPreferences);
            setIsVisible(false);
            setIsCustomizing(false);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div className="sticky bottom-4 z-40 mx-auto mt-4 w-full max-w-[1280px] px-4 md:px-10">
            <div className="rounded-[28px] border border-slate-800 bg-slate-950 p-5 text-white shadow-2xl">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-3xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                            Cookie consent
                        </p>
                        <h2 className="mt-2 text-xl font-black tracking-tight">
                            Choose how DevOps Daily stores preferences and measurement data
                        </h2>
                        <p className="mt-2 text-sm leading-7 text-slate-300">
                            Essential cookies keep sign-in and site preferences working. Optional
                            analytics cookies help us understand product usage only when you allow
                            them. Details live in our{' '}
                            <Link className="font-semibold text-cyan-300 hover:text-cyan-200" href="/cookie-policy">
                                Cookie Policy
                            </Link>{' '}
                            and{' '}
                            <Link className="font-semibold text-cyan-300 hover:text-cyan-200" href="/privacy-policy">
                                Privacy Policy
                            </Link>
                            .
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                            className="inline-flex h-11 items-center justify-center rounded-xl border border-white/15 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/5"
                            onClick={() =>
                                void persistConsent('essential-only', {
                                    essential: true,
                                    analytics: false,
                                    marketing: false,
                                })
                            }
                            type="button"
                            disabled={isSaving}
                        >
                            Essential only
                        </button>
                        <button
                            className="inline-flex h-11 items-center justify-center rounded-xl border border-cyan-400/30 px-5 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/10"
                            onClick={() => setIsCustomizing((value) => !value)}
                            type="button"
                            disabled={isSaving}
                        >
                            {isCustomizing ? 'Hide preferences' : 'Customize'}
                        </button>
                        <button
                            className="inline-flex h-11 items-center justify-center rounded-xl bg-cyan-500 px-5 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400"
                            onClick={() =>
                                void persistConsent('accepted', {
                                    essential: true,
                                    analytics: true,
                                    marketing: false,
                                })
                            }
                            type="button"
                            disabled={isSaving}
                        >
                            Accept analytics
                        </button>
                    </div>
                </div>

                {isCustomizing ? (
                    <div className="mt-5 grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 lg:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                            <p className="text-sm font-semibold text-white">Essential</p>
                            <p className="mt-2 text-sm leading-6 text-slate-300">
                                Required for sign-in, security, and saved preferences.
                            </p>
                            <span className="mt-4 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                                Always active
                            </span>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-white">Analytics</p>
                                    <p className="mt-2 text-sm leading-6 text-slate-300">
                                        Allows GA4 and internal product analytics to measure traffic,
                                        search usage, newsletter signups, and comment events.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setPreferences((current) => ({
                                            ...current,
                                            analytics: !current.analytics,
                                        }))
                                    }
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                                        preferences.analytics ? 'bg-cyan-500' : 'bg-slate-700'
                                    }`}
                                >
                                    <span
                                        className={`inline-block size-5 rounded-full bg-white transition-transform ${
                                            preferences.analytics ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-white">Marketing</p>
                                    <p className="mt-2 text-sm leading-6 text-slate-300">
                                        Reserved for future campaign preferences. Currently off by
                                        default.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setPreferences((current) => ({
                                            ...current,
                                            marketing: !current.marketing,
                                        }))
                                    }
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                                        preferences.marketing ? 'bg-cyan-500' : 'bg-slate-700'
                                    }`}
                                >
                                    <span
                                        className={`inline-block size-5 rounded-full bg-white transition-transform ${
                                            preferences.marketing ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>

                        <div className="lg:col-span-3 flex flex-wrap gap-3">
                            <button
                                type="button"
                                disabled={isSaving}
                                onClick={() =>
                                    void persistConsent(
                                        'customized',
                                        preferences
                                    )
                                }
                                className="inline-flex h-11 items-center justify-center rounded-xl bg-cyan-500 px-5 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400 disabled:opacity-60"
                            >
                                Save preferences
                            </button>
                            <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => setIsCustomizing(false)}
                                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/15 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/5 disabled:opacity-60"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
