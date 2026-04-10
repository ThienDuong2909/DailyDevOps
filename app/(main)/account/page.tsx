'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { useAuthStore } from '@/hooks/use-auth';
import { formatDate, formatNumber, getImageUrl } from '@/lib/utils';
import { DataRightsPanel } from '@/components/privacy/data-rights-panel';
import type { Comment, Post } from '@/types';

interface ProfileFormState {
    firstName: string;
    lastName: string;
    avatar: string;
    bio: string;
}

interface MfaSetupState {
    secret: string;
    qrCodeDataUrl: string;
}

type PostsPayload = {
    data?: Post[];
    meta?: {
        total?: number;
    };
};

type CommentsPayload = {
    data?: Comment[];
    meta?: {
        total?: number;
    };
};

function buildPublicUsername(firstName?: string, lastName?: string, email?: string) {
    const fullName = `${firstName || ''} ${lastName || ''}`
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    if (fullName) {
        return fullName;
    }

    return String(email || '')
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

export default function AccountPage() {
    const router = useRouter();
    const {
        user,
        isAuthenticated,
        isInitialized,
        initializeAuth,
        fetchProfile,
        logout,
    } = useAuthStore();

    const [profileForm, setProfileForm] = useState<ProfileFormState>({
        firstName: '',
        lastName: '',
        avatar: '',
        bio: '',
    });
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [mfaSetup, setMfaSetup] = useState<MfaSetupState | null>(null);
    const [mfaEnablePassword, setMfaEnablePassword] = useState('');
    const [mfaEnableCode, setMfaEnableCode] = useState('');
    const [mfaDisablePassword, setMfaDisablePassword] = useState('');
    const [mfaDisableCode, setMfaDisableCode] = useState('');
    const [isLoadingMfaSetup, setIsLoadingMfaSetup] = useState(false);
    const [isEnablingMfa, setIsEnablingMfa] = useState(false);
    const [isDisablingMfa, setIsDisablingMfa] = useState(false);
    const [myPosts, setMyPosts] = useState<Post[]>([]);
    const [myPostsTotal, setMyPostsTotal] = useState(0);
    const [isLoadingPosts, setIsLoadingPosts] = useState(false);
    const [commentInbox, setCommentInbox] = useState<Comment[]>([]);
    const [commentInboxTotal, setCommentInboxTotal] = useState(0);
    const [isLoadingComments, setIsLoadingComments] = useState(false);

    useEffect(() => {
        void initializeAuth();
    }, [initializeAuth]);

    useEffect(() => {
        if (isInitialized && !isAuthenticated) {
            router.replace('/login');
        }
    }, [isAuthenticated, isInitialized, router]);

    useEffect(() => {
        if (!user) {
            return;
        }

        setProfileForm({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            avatar: user.avatar || '',
            bio: user.bio || '',
        });
    }, [user]);

    useEffect(() => {
        const fetchMyPosts = async () => {
            if (!user) {
                return;
            }

            try {
                setIsLoadingPosts(true);
                const response = await apiClient.get<PostsPayload>(
                    `/api/v1/posts?authorId=${encodeURIComponent(user.id)}&limit=6&sortBy=updatedAt&sortOrder=desc`
                );
                setMyPosts(response?.data || []);
                setMyPostsTotal(response?.meta?.total || 0);
            } catch {
                toast.error('Khong the tai danh sach bai viet cua ban');
            } finally {
                setIsLoadingPosts(false);
            }
        };

        void fetchMyPosts();
    }, [user]);

    useEffect(() => {
        const fetchCommentInbox = async () => {
            if (!user) {
                return;
            }

            try {
                setIsLoadingComments(true);
                const response = await apiClient.get<CommentsPayload>(
                    '/api/v1/comments/me/inbox?limit=6'
                );
                setCommentInbox(response?.data || []);
                setCommentInboxTotal(response?.meta?.total || 0);
            } catch {
                toast.error('Khong the tai comment inbox cua ban');
            } finally {
                setIsLoadingComments(false);
            }
        };

        void fetchCommentInbox();
    }, [user]);

    const profileStats = useMemo(
        () => [
            { label: 'Role', value: user?.role || '--' },
            {
                label: 'Email verified',
                value: user?.emailVerifiedAt ? 'Verified' : 'Pending',
            },
            {
                label: 'Joined',
                value: user?.createdAt ? formatDate(user.createdAt) : '--',
            },
        ],
        [user]
    );

    const publicProfilePath = useMemo(() => {
        const username = buildPublicUsername(
            profileForm.firstName || user?.firstName,
            profileForm.lastName || user?.lastName,
            user?.email
        );

        return username ? `/author/${username}` : '';
    }, [profileForm.firstName, profileForm.lastName, user?.email, user?.firstName, user?.lastName]);

    const postStatusCounts = useMemo(
        () =>
            myPosts.reduce<Record<string, number>>((acc, post) => {
                acc[post.status] = (acc[post.status] || 0) + 1;
                return acc;
            }, {}),
        [myPosts]
    );

    const statusBadgeClass = (status: string) => {
        switch (status) {
            case 'PUBLISHED':
                return 'border-green-500/30 bg-green-500/10 text-green-300';
            case 'REVIEW':
                return 'border-violet-500/30 bg-violet-500/10 text-violet-200';
            case 'SCHEDULED':
                return 'border-blue-500/30 bg-blue-500/10 text-blue-200';
            case 'ARCHIVED':
                return 'border-gray-500/30 bg-gray-500/10 text-gray-300';
            default:
                return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-200';
        }
    };

    const commentStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return 'border-green-500/30 bg-green-500/10 text-green-300';
            case 'SPAM':
                return 'border-red-500/30 bg-red-500/10 text-red-300';
            case 'TRASH':
                return 'border-gray-500/30 bg-gray-500/10 text-gray-300';
            default:
                return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-200';
        }
    };

    const handleProfileSave = async (event: React.SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!user) {
            return;
        }

        try {
            setIsSavingProfile(true);
            await apiClient.put(`/api/v1/users/${user.id}`, {
                firstName: profileForm.firstName.trim(),
                lastName: profileForm.lastName.trim(),
                avatar: profileForm.avatar.trim() || null,
                bio: profileForm.bio.trim() || null,
            });
            await fetchProfile();
            toast.success('Da cap nhat ho so');
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'Khong the cap nhat ho so');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handlePasswordChange = async (event: React.SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error('Mat khau xac nhan khong khop');
            return;
        }

        try {
            setIsChangingPassword(true);
            const response = await apiClient.post<{ message?: string }>(
                '/api/v1/auth/change-password',
                {
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword,
                }
            );
            await logout();
            toast.success(response?.message || 'Da doi mat khau, vui long dang nhap lai');
            router.push('/login');
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'Khong the doi mat khau');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleAvatarUpload = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) {
            return;
        }

        try {
            setIsUploadingAvatar(true);
            const formData = new FormData();
            formData.append('file', file);

            const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
            const response = await fetch(`${apiBase}/api/v1/media/upload`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${getAccessToken() || ''}`,
                },
                credentials: 'include',
                body: formData,
            });

            const payload = await response.json();

            if (!response.ok || !payload?.data?.url) {
                throw new Error(payload?.message || 'Khong the upload avatar');
            }

            setProfileForm((previous) => ({
                ...previous,
                avatar: payload.data.url,
            }));
            toast.success('Da upload avatar');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Khong the upload avatar');
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const handleCopyProfileLink = async () => {
        if (!publicProfilePath || typeof window === 'undefined') {
            return;
        }

        try {
            await navigator.clipboard.writeText(`${window.location.origin}${publicProfilePath}`);
            toast.success('Da copy link public profile');
        } catch {
            toast.error('Khong the copy link');
        }
    };

    const handleSetupMfa = async () => {
        try {
            setIsLoadingMfaSetup(true);
            const response = await apiClient.post<{
                data?: MfaSetupState;
            }>('/api/v1/auth/mfa/setup');

            if (!response?.data?.secret || !response?.data?.qrCodeDataUrl) {
                throw new Error('Khong the khoi tao MFA');
            }

            setMfaSetup(response.data);
            setMfaEnableCode('');
            setMfaEnablePassword('');
            toast.success('Da tao ma QR MFA. Hay scan bang ung dung authenticator.');
        } catch (error: any) {
            toast.error(error?.response?.data?.error || error?.message || 'Khong the khoi tao MFA');
        } finally {
            setIsLoadingMfaSetup(false);
        }
    };

    const handleEnableMfa = async (event: React.SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();

        try {
            setIsEnablingMfa(true);
            const response = await apiClient.post<{ message?: string }>('/api/v1/auth/mfa/enable', {
                password: mfaEnablePassword,
                token: mfaEnableCode,
            });

            await fetchProfile();
            setMfaSetup(null);
            setMfaEnableCode('');
            setMfaEnablePassword('');
            toast.success(response?.message || 'Da bat MFA');
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'Khong the bat MFA');
        } finally {
            setIsEnablingMfa(false);
        }
    };

    const handleDisableMfa = async (event: React.SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();

        try {
            setIsDisablingMfa(true);
            const response = await apiClient.post<{ message?: string }>('/api/v1/auth/mfa/disable', {
                password: mfaDisablePassword,
                token: mfaDisableCode,
            });

            await fetchProfile();
            setMfaDisableCode('');
            setMfaDisablePassword('');
            toast.success(response?.message || 'Da tat MFA');
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'Khong the tat MFA');
        } finally {
            setIsDisablingMfa(false);
        }
    };

    if (!isInitialized || !user) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <span className="size-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            </div>
        );
    }

    return (
        <div className="flex w-full max-w-[1120px] flex-col gap-8">
            <section className="rounded-[32px] bg-slate-950 px-6 py-10 text-white shadow-xl md:px-10 md:py-14">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                    My Account
                </p>
                <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
                    Manage your profile and account security
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
                    Update your public author profile, rotate your password, and access privacy
                    controls from one place.
                </p>
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-surface-dark">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-500">
                            Editorial Workflow
                        </p>
                        <h2 className="mt-2 text-2xl font-bold text-text-main dark:text-white">
                            My Articles
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-text-sub dark:text-gray-400">
                            Theo doi cac bai viet gan day cua ban qua cac trang thai draft, review,
                            schedule va publish.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link
                            href="/admin/articles/new"
                            className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-bold text-white transition-colors hover:bg-primary/90"
                        >
                            New Article
                        </Link>
                        <Link
                            href="/admin/articles"
                            className="inline-flex h-10 items-center rounded-lg border border-border-dark bg-[#1e293b] px-4 text-sm font-semibold text-white transition-colors hover:border-primary hover:text-primary"
                        >
                            Open Editorial Workspace
                        </Link>
                    </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-5">
                    <div className="rounded-2xl border border-gray-200 px-4 py-4 dark:border-gray-800">
                        <p className="text-xs uppercase tracking-wide text-text-sub dark:text-gray-400">Total</p>
                        <p className="mt-2 text-2xl font-bold text-text-main dark:text-white">
                            {formatNumber(myPostsTotal)}
                        </p>
                    </div>
                    {['DRAFT', 'REVIEW', 'SCHEDULED', 'PUBLISHED'].map((status) => (
                        <div
                            key={status}
                            className="rounded-2xl border border-gray-200 px-4 py-4 dark:border-gray-800"
                        >
                            <p className="text-xs uppercase tracking-wide text-text-sub dark:text-gray-400">
                                {status}
                            </p>
                            <p className="mt-2 text-2xl font-bold text-text-main dark:text-white">
                                {formatNumber(postStatusCounts[status] || 0)}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
                    {isLoadingPosts ? (
                        <div className="p-6 text-sm text-text-sub dark:text-gray-400">
                            Dang tai bai viet cua ban...
                        </div>
                    ) : myPosts.length === 0 ? (
                        <div className="p-6 text-sm text-text-sub dark:text-gray-400">
                            Ban chua co bai viet nao. Hay bat dau bang mot draft moi.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left">
                                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-text-sub dark:bg-[#111418] dark:text-gray-400">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Article</th>
                                        <th className="px-4 py-3 font-semibold">Status</th>
                                        <th className="px-4 py-3 font-semibold">Updated</th>
                                        <th className="px-4 py-3 font-semibold">Views</th>
                                        <th className="px-4 py-3 font-semibold">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                    {myPosts.map((post) => (
                                        <tr key={post.id}>
                                            <td className="px-4 py-4">
                                                <div>
                                                    <p className="font-semibold text-text-main dark:text-white">
                                                        {post.title}
                                                    </p>
                                                    <p className="mt-1 text-xs text-text-sub dark:text-gray-400">
                                                        /{post.slug}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span
                                                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(
                                                        post.status
                                                    )}`}
                                                >
                                                    {post.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-text-sub dark:text-gray-400">
                                                {formatDate(post.updatedAt)}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-text-sub dark:text-gray-400">
                                                {formatNumber(post.viewCount || 0)}
                                            </td>
                                            <td className="px-4 py-4">
                                                <Link
                                                    href={`/admin/articles/${post.id}`}
                                                    className="text-sm font-semibold text-primary hover:text-blue-600"
                                                >
                                                    Open
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-surface-dark">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-500">
                            Reader Feedback
                        </p>
                        <h2 className="mt-2 text-2xl font-bold text-text-main dark:text-white">
                            Comment Inbox
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-text-sub dark:text-gray-400">
                            Theo doi comment moi tren bai viet cua ban va xem trang thai moderation
                            hien tai.
                        </p>
                    </div>
                    <Link
                        href="/admin/comments"
                        className="inline-flex h-10 items-center rounded-lg border border-border-dark bg-[#1e293b] px-4 text-sm font-semibold text-white transition-colors hover:border-primary hover:text-primary"
                    >
                        Open Comment Workspace
                    </Link>
                </div>

                <div className="mt-6 rounded-2xl border border-gray-200 px-4 py-4 dark:border-gray-800">
                    <p className="text-xs uppercase tracking-wide text-text-sub dark:text-gray-400">
                        Total feedback items
                    </p>
                    <p className="mt-2 text-2xl font-bold text-text-main dark:text-white">
                        {formatNumber(commentInboxTotal)}
                    </p>
                </div>

                <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
                    {isLoadingComments ? (
                        <div className="p-6 text-sm text-text-sub dark:text-gray-400">
                            Dang tai comment inbox...
                        </div>
                    ) : commentInbox.length === 0 ? (
                        <div className="p-6 text-sm text-text-sub dark:text-gray-400">
                            Chua co comment nao tren bai viet cua ban.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left">
                                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-text-sub dark:bg-[#111418] dark:text-gray-400">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Comment</th>
                                        <th className="px-4 py-3 font-semibold">Post</th>
                                        <th className="px-4 py-3 font-semibold">Status</th>
                                        <th className="px-4 py-3 font-semibold">Created</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                    {commentInbox.map((comment) => (
                                        <tr key={comment.id}>
                                            <td className="px-4 py-4">
                                                <div>
                                                    <p className="text-sm font-semibold text-text-main dark:text-white">
                                                        {comment.user
                                                            ? `${comment.user.firstName} ${comment.user.lastName}`
                                                            : comment.authorName || 'Anonymous'}
                                                    </p>
                                                    <p className="mt-1 line-clamp-2 max-w-xl text-xs text-text-sub dark:text-gray-400">
                                                        {comment.content}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-text-sub dark:text-gray-400">
                                                {comment.post?.title || '--'}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span
                                                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${commentStatusBadgeClass(
                                                        comment.status
                                                    )}`}
                                                >
                                                    {comment.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-text-sub dark:text-gray-400">
                                                {formatDate(comment.createdAt)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <form
                    onSubmit={handleProfileSave}
                    className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-surface-dark"
                >
                    <h2 className="text-xl font-bold text-text-main dark:text-white">
                        Profile Details
                    </h2>
                    <div className="mt-6 grid gap-5 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-text-main dark:text-white">
                                First Name
                            </label>
                            <input
                                value={profileForm.firstName}
                                onChange={(event) =>
                                    setProfileForm((previous) => ({
                                        ...previous,
                                        firstName: event.target.value,
                                    }))
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-text-main focus:border-primary focus:outline-none dark:border-gray-700 dark:bg-[#111418] dark:text-white"
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-text-main dark:text-white">
                                Last Name
                            </label>
                            <input
                                value={profileForm.lastName}
                                onChange={(event) =>
                                    setProfileForm((previous) => ({
                                        ...previous,
                                        lastName: event.target.value,
                                    }))
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-text-main focus:border-primary focus:outline-none dark:border-gray-700 dark:bg-[#111418] dark:text-white"
                                required
                            />
                        </div>
                    </div>
                    <div className="mt-5">
                        <label className="mb-2 block text-sm font-medium text-text-main dark:text-white">
                            Avatar URL
                        </label>
                        <div className="mb-3 flex items-center gap-4">
                            <div className="flex size-16 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-lg font-bold text-primary">
                                {profileForm.avatar ? (
                                    <img
                                        src={getImageUrl(profileForm.avatar)}
                                        alt={`${profileForm.firstName} ${profileForm.lastName}`}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    `${profileForm.firstName?.[0] || ''}${profileForm.lastName?.[0] || ''}` || 'U'
                                )}
                            </div>
                            <label className="inline-flex cursor-pointer items-center rounded-lg border border-border-dark bg-[#1e293b] px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-primary hover:text-primary">
                                {isUploadingAvatar ? 'Dang upload...' : 'Upload avatar'}
                                <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/gif"
                                    className="hidden"
                                    onChange={(event) => void handleAvatarUpload(event)}
                                    disabled={isUploadingAvatar}
                                />
                            </label>
                        </div>
                        <input
                            value={profileForm.avatar}
                            onChange={(event) =>
                                setProfileForm((previous) => ({
                                    ...previous,
                                    avatar: event.target.value,
                                }))
                            }
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-text-main focus:border-primary focus:outline-none dark:border-gray-700 dark:bg-[#111418] dark:text-white"
                            placeholder="https://..."
                        />
                    </div>
                    <div className="mt-5">
                        <label className="mb-2 block text-sm font-medium text-text-main dark:text-white">
                            Bio
                        </label>
                        <textarea
                            value={profileForm.bio}
                            onChange={(event) =>
                                setProfileForm((previous) => ({
                                    ...previous,
                                    bio: event.target.value,
                                }))
                            }
                            rows={5}
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-text-main focus:border-primary focus:outline-none dark:border-gray-700 dark:bg-[#111418] dark:text-white"
                            placeholder="Share your DevOps background and focus areas..."
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isSavingProfile}
                        className="mt-6 inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
                    >
                        {isSavingProfile ? 'Dang luu...' : 'Save Profile'}
                    </button>
                    {publicProfilePath ? (
                        <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-[#111418]">
                            <p className="text-xs font-semibold uppercase tracking-wide text-text-sub dark:text-gray-400">
                                Public Profile
                            </p>
                            <p className="mt-2 text-sm text-text-main dark:text-white">
                                {publicProfilePath}
                            </p>
                            <div className="mt-4 flex flex-wrap gap-3">
                                <a
                                    href={publicProfilePath}
                                    className="inline-flex h-10 items-center rounded-lg border border-border-dark bg-[#1e293b] px-4 text-sm font-semibold text-white transition-colors hover:border-primary hover:text-primary"
                                >
                                    View public profile
                                </a>
                                <button
                                    type="button"
                                    onClick={() => void handleCopyProfileLink()}
                                    className="inline-flex h-10 items-center rounded-lg border border-border-dark bg-[#1e293b] px-4 text-sm font-semibold text-white transition-colors hover:border-primary hover:text-primary"
                                >
                                    Copy profile link
                                </button>
                            </div>
                        </div>
                    ) : null}
                </form>

                <div className="space-y-6">
                    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-surface-dark">
                        <h2 className="text-xl font-bold text-text-main dark:text-white">
                            Account Summary
                        </h2>
                        <div className="mt-5 space-y-4">
                            <div className="mb-3 flex items-center gap-3">
                                <div className="flex size-12 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-bold text-primary">
                                    {user.avatar ? (
                                        <img
                                            src={getImageUrl(user.avatar)}
                                            alt={`${user.firstName} ${user.lastName}`}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}` || 'U'
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-text-main dark:text-white">
                                        {user.firstName} {user.lastName}
                                    </p>
                                    <p className="text-sm text-text-sub dark:text-gray-400">{user.email}</p>
                                </div>
                            </div>
                            <div className="grid gap-3">
                                {profileStats.map((item) => (
                                    <div
                                        key={item.label}
                                        className="rounded-2xl border border-gray-200 px-4 py-3 dark:border-gray-800"
                                    >
                                        <p className="text-xs uppercase tracking-wide text-text-sub dark:text-gray-400">
                                            {item.label}
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-text-main dark:text-white">
                                            {item.value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-surface-dark">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-text-main dark:text-white">
                                    Multi-Factor Authentication
                                </h2>
                                <p className="mt-2 text-sm leading-6 text-text-sub dark:text-gray-400">
                                    Bao ve tai khoan bang ma TOTP 6 so tu Google Authenticator,
                                    1Password, Authy hoac ung dung tuong tu.
                                </p>
                            </div>
                            <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                                    user.mfaEnabled
                                        ? 'border-green-500/30 bg-green-500/10 text-green-300'
                                        : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-200'
                                }`}
                            >
                                {user.mfaEnabled ? 'Enabled' : 'Not enabled'}
                            </span>
                        </div>

                        {['ADMIN', 'MODERATOR', 'EDITOR'].includes(user.role) ? (
                            <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-text-main dark:text-white">
                                MFA duoc khuyen nghi rat cao cho tai khoan co quyen quan tri va bien tap.
                            </div>
                        ) : null}

                        {!user.mfaEnabled ? (
                            <div className="mt-5 space-y-5">
                                {!mfaSetup ? (
                                    <button
                                        type="button"
                                        onClick={() => void handleSetupMfa()}
                                        disabled={isLoadingMfaSetup}
                                        className="inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
                                    >
                                        {isLoadingMfaSetup ? 'Dang tao QR...' : 'Set Up MFA'}
                                    </button>
                                ) : (
                                    <form onSubmit={handleEnableMfa} className="space-y-4">
                                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-[#111418]">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-text-sub dark:text-gray-400">
                                                Step 1
                                            </p>
                                            <p className="mt-2 text-sm text-text-main dark:text-white">
                                                Scan ma QR nay bang authenticator app cua ban.
                                            </p>
                                            <img
                                                src={mfaSetup.qrCodeDataUrl}
                                                alt="MFA QR code"
                                                className="mt-4 h-56 w-56 rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-700"
                                            />
                                            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-text-sub dark:text-gray-400">
                                                Manual entry key
                                            </p>
                                            <p className="mt-2 break-all rounded-xl border border-dashed border-gray-300 px-3 py-3 font-mono text-sm text-text-main dark:border-gray-700 dark:text-white">
                                                {mfaSetup.secret}
                                            </p>
                                        </div>

                                        <div className="grid gap-4">
                                            <input
                                                type="password"
                                                value={mfaEnablePassword}
                                                onChange={(event) => setMfaEnablePassword(event.target.value)}
                                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-text-main focus:border-primary focus:outline-none dark:border-gray-700 dark:bg-[#111418] dark:text-white"
                                                placeholder="Current password"
                                                required
                                            />
                                            <input
                                                value={mfaEnableCode}
                                                onChange={(event) =>
                                                    setMfaEnableCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                                                }
                                                inputMode="numeric"
                                                maxLength={6}
                                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 font-mono text-sm tracking-[0.3em] text-text-main focus:border-primary focus:outline-none dark:border-gray-700 dark:bg-[#111418] dark:text-white"
                                                placeholder="123456"
                                                required
                                            />
                                        </div>

                                        <div className="flex flex-wrap gap-3">
                                            <button
                                                type="submit"
                                                disabled={isEnablingMfa}
                                                className="inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
                                            >
                                                {isEnablingMfa ? 'Dang bat MFA...' : 'Enable MFA'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setMfaSetup(null)}
                                                className="inline-flex h-11 items-center rounded-lg border border-gray-300 px-5 text-sm font-semibold text-text-main transition-colors hover:border-primary hover:text-primary dark:border-gray-700 dark:text-white"
                                            >
                                                Cancel setup
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        ) : (
                            <form onSubmit={handleDisableMfa} className="mt-5 space-y-4">
                                <p className="text-sm leading-6 text-text-sub dark:text-gray-400">
                                    De tat MFA, xac nhan lai mat khau hien tai va nhap ma 6 so moi
                                    nhat tu authenticator app.
                                </p>
                                <input
                                    type="password"
                                    value={mfaDisablePassword}
                                    onChange={(event) => setMfaDisablePassword(event.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-text-main focus:border-primary focus:outline-none dark:border-gray-700 dark:bg-[#111418] dark:text-white"
                                    placeholder="Current password"
                                    required
                                />
                                <input
                                    value={mfaDisableCode}
                                    onChange={(event) =>
                                        setMfaDisableCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                                    }
                                    inputMode="numeric"
                                    maxLength={6}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 font-mono text-sm tracking-[0.3em] text-text-main focus:border-primary focus:outline-none dark:border-gray-700 dark:bg-[#111418] dark:text-white"
                                    placeholder="123456"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={isDisablingMfa}
                                    className="inline-flex h-11 items-center rounded-lg border border-red-500/30 bg-red-500/10 px-5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/15 disabled:opacity-60"
                                >
                                    {isDisablingMfa ? 'Dang tat MFA...' : 'Disable MFA'}
                                </button>
                            </form>
                        )}
                    </div>

                    <form
                        onSubmit={handlePasswordChange}
                        className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-surface-dark"
                    >
                        <h2 className="text-xl font-bold text-text-main dark:text-white">
                            Change Password
                        </h2>
                        <div className="mt-5 space-y-4">
                            <input
                                type="password"
                                value={passwordForm.currentPassword}
                                onChange={(event) =>
                                    setPasswordForm((previous) => ({
                                        ...previous,
                                        currentPassword: event.target.value,
                                    }))
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-text-main focus:border-primary focus:outline-none dark:border-gray-700 dark:bg-[#111418] dark:text-white"
                                placeholder="Current password"
                                required
                            />
                            <input
                                type="password"
                                value={passwordForm.newPassword}
                                onChange={(event) =>
                                    setPasswordForm((previous) => ({
                                        ...previous,
                                        newPassword: event.target.value,
                                    }))
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-text-main focus:border-primary focus:outline-none dark:border-gray-700 dark:bg-[#111418] dark:text-white"
                                placeholder="New password"
                                minLength={6}
                                required
                            />
                            <input
                                type="password"
                                value={passwordForm.confirmPassword}
                                onChange={(event) =>
                                    setPasswordForm((previous) => ({
                                        ...previous,
                                        confirmPassword: event.target.value,
                                    }))
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-text-main focus:border-primary focus:outline-none dark:border-gray-700 dark:bg-[#111418] dark:text-white"
                                placeholder="Confirm new password"
                                minLength={6}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isChangingPassword}
                            className="mt-6 inline-flex h-11 items-center rounded-lg border border-border-dark bg-[#1e293b] px-5 text-sm font-semibold text-white transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
                        >
                            {isChangingPassword ? 'Dang doi mat khau...' : 'Change Password'}
                        </button>
                    </form>
                </div>
            </section>

            <DataRightsPanel />
        </div>
    );
}
