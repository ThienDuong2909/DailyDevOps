'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/hooks/use-auth';

function downloadJsonFile(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
}

export function DataRightsPanel() {
    const { isAuthenticated, user, initializeAuth, isInitialized } = useAuthStore();
    const [isExporting, setIsExporting] = useState(false);
    const [isSubmittingDeleteRequest, setIsSubmittingDeleteRequest] = useState(false);

    useEffect(() => {
        void initializeAuth();
    }, [initializeAuth]);

    const handleExport = async () => {
        try {
            setIsExporting(true);
            const response = await fetch('/api/v1/users/me/export', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}`,
                },
            });

            if (!response.ok) {
                throw new Error('Khong the export du lieu luc nay');
            }

            const blob = await response.blob();
            downloadJsonFile(blob, `devops-daily-export-${user?.id || 'me'}.json`);
            toast.success('Da tai xuong ban sao du lieu cua ban');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Khong the export du lieu');
        } finally {
            setIsExporting(false);
        }
    };

    const handleDeleteRequest = async () => {
        const reason = window.prompt('Nhap ly do neu ban muon xoa tai khoan') || '';

        try {
            setIsSubmittingDeleteRequest(true);
            const result = await apiClient.post<{ message?: string }>(
                '/api/v1/users/me/delete-request',
                { reason }
            );
            toast.success(result?.message || 'Da gui yeu cau xoa tai khoan');
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'Khong the gui yeu cau xoa tai khoan');
        } finally {
            setIsSubmittingDeleteRequest(false);
        }
    };

    return (
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-surface-dark">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-500">
                Data Rights
            </p>
            <h2 className="mt-3 text-2xl font-bold text-text-main dark:text-white">
                Export your data or request account deletion
            </h2>
            <p className="mt-3 text-sm leading-7 text-text-sub dark:text-gray-400">
                Signed-in account holders can download a JSON export of profile, article, comment,
                and newsletter data. You can also submit an account deletion request for manual
                review.
            </p>

            {!isInitialized ? (
                <p className="mt-4 text-sm text-text-sub dark:text-gray-400">Checking account session...</p>
            ) : !isAuthenticated ? (
                <p className="mt-4 text-sm text-text-sub dark:text-gray-400">
                    Sign in to access self-service privacy controls.
                </p>
            ) : (
                <div className="mt-6 flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={() => void handleExport()}
                        disabled={isExporting}
                        className="inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
                    >
                        {isExporting ? 'Dang export...' : 'Download My Data'}
                    </button>
                    <button
                        type="button"
                        onClick={() => void handleDeleteRequest()}
                        disabled={isSubmittingDeleteRequest}
                        className="inline-flex h-11 items-center rounded-lg border border-red-500/30 bg-red-500/10 px-5 text-sm font-semibold text-red-200 transition-colors hover:border-red-400 disabled:opacity-60"
                    >
                        {isSubmittingDeleteRequest ? 'Dang gui...' : 'Request Account Deletion'}
                    </button>
                </div>
            )}
        </section>
    );
}
