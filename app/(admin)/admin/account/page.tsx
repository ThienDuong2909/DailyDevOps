"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { useAuthStore } from "@/hooks/use-auth";
import { formatDate, getImageUrl } from "@/lib/utils";

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

export default function AdminAccountPage() {
  const {
    user,
    isAuthenticated,
    isInitialized,
    initializeAuth,
    fetchProfile,
    logout,
  } = useAuthStore();

  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    firstName: "",
    lastName: "",
    avatar: "",
    bio: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [mfaSetup, setMfaSetup] = useState<MfaSetupState | null>(null);
  const [mfaEnablePassword, setMfaEnablePassword] = useState("");
  const [mfaEnableCode, setMfaEnableCode] = useState("");
  const [mfaDisablePassword, setMfaDisablePassword] = useState("");
  const [mfaDisableCode, setMfaDisableCode] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [pendingAvatarPreview, setPendingAvatarPreview] = useState<string>("");
  const [isLoadingMfaSetup, setIsLoadingMfaSetup] = useState(false);
  const [isEnablingMfa, setIsEnablingMfa] = useState(false);
  const [isDisablingMfa, setIsDisablingMfa] = useState(false);

  useEffect(() => {
    void initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    return () => {
      if (pendingAvatarPreview) {
        URL.revokeObjectURL(pendingAvatarPreview);
      }
    };
  }, [pendingAvatarPreview]);

  useEffect(() => {
    if (!user) {
      return;
    }

    setProfileForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      avatar: user.avatar || "",
      bio: user.bio || "",
    });
  }, [user]);

  const handleProfileSave = async (
    event: React.SyntheticEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!user) {
      return;
    }

    try {
      setIsSavingProfile(true);
      let avatarUrl = profileForm.avatar.trim() || null;

      if (pendingAvatarFile) {
        setIsUploadingAvatar(true);
        const formData = new FormData();
        formData.append("file", pendingAvatarFile);
        formData.append("purpose", "avatar");

        const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
        const uploadResponse = await fetch(`${apiBase}/api/v1/media/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getAccessToken() || ""}`,
          },
          credentials: "include",
          body: formData,
        });

        const uploadPayload = await uploadResponse.json();

        if (!uploadResponse.ok || !uploadPayload?.data?.url) {
          throw new Error(
            uploadPayload?.error ||
              uploadPayload?.message ||
              "Khong the upload avatar",
          );
        }

        avatarUrl = uploadPayload.data.url;
      }

      await apiClient.put(`/api/v1/users/${user.id}`, {
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        avatar: avatarUrl,
        bio: profileForm.bio.trim() || null,
      });
      await fetchProfile();
      setPendingAvatarFile(null);
      setPendingAvatarPreview("");
      setProfileForm((previous) => ({
        ...previous,
        avatar: avatarUrl || "",
      }));
      toast.success("Da cap nhat ho so admin");
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Khong the cap nhat ho so");
    } finally {
      setIsUploadingAvatar(false);
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChange = async (
    event: React.SyntheticEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Mat khau xac nhan khong khop");
      return;
    }

    try {
      setIsChangingPassword(true);
      const response = await apiClient.post<{ message?: string }>(
        "/api/v1/auth/change-password",
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
      );
      await logout();
      toast.success(
        response?.message || "Da doi mat khau, vui long dang nhap lai",
      );
      globalThis.window.location.href = "/login";
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Khong the doi mat khau");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPendingAvatarFile(file);
    setPendingAvatarPreview((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous);
      }

      return previewUrl;
    });
    toast.success("Avatar da san sang. Bam Save Profile de luu len storage.");
  };

  const handleSetupMfa = async () => {
    try {
      setIsLoadingMfaSetup(true);
      const response = await apiClient.post<{ data?: MfaSetupState }>(
        "/api/v1/auth/mfa/setup",
      );

      if (!response?.data?.secret || !response?.data?.qrCodeDataUrl) {
        throw new Error("Khong the khoi tao MFA");
      }

      setMfaSetup(response.data);
      setMfaEnableCode("");
      setMfaEnablePassword("");
      toast.success("Da tao QR MFA. Hay scan bang ung dung authenticator.");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error ||
          error?.message ||
          "Khong the khoi tao MFA",
      );
    } finally {
      setIsLoadingMfaSetup(false);
    }
  };

  const handleEnableMfa = async (
    event: React.SyntheticEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    try {
      setIsEnablingMfa(true);
      const response = await apiClient.post<{ message?: string }>(
        "/api/v1/auth/mfa/enable",
        {
          password: mfaEnablePassword,
          token: mfaEnableCode,
        },
      );

      await fetchProfile();
      setMfaSetup(null);
      setMfaEnableCode("");
      setMfaEnablePassword("");
      toast.success(response?.message || "Da bat MFA");
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Khong the bat MFA");
    } finally {
      setIsEnablingMfa(false);
    }
  };

  const handleDisableMfa = async (
    event: React.SyntheticEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    try {
      setIsDisablingMfa(true);
      const response = await apiClient.post<{ message?: string }>(
        "/api/v1/auth/mfa/disable",
        {
          password: mfaDisablePassword,
          token: mfaDisableCode,
        },
      );

      await fetchProfile();
      setMfaDisableCode("");
      setMfaDisablePassword("");
      toast.success(response?.message || "Da tat MFA");
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Khong the tat MFA");
    } finally {
      setIsDisablingMfa(false);
    }
  };

  if (!isInitialized || !isAuthenticated || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="size-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6">
      <section className="theme-panel overflow-hidden rounded-[28px]">
        <div className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between lg:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              Admin Account
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-[color:var(--text-main-theme)]">
              Profile, password and multi-factor security
            </h1>
            <p className="theme-muted mt-3 max-w-3xl text-sm leading-7">
              Quan ly tai khoan quan tri ngay trong dashboard de cap nhat ho so,
              doi mat khau va bat tat MFA ma khong can roi khoi giao dien admin.
            </p>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-primary">
              Current admin
            </p>
            <p className="mt-2 text-lg font-bold text-[color:var(--text-main-theme)]">
              {user.firstName} {user.lastName}
            </p>
            <p className="theme-muted mt-1 text-sm">{user.email}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <form
          onSubmit={handleProfileSave}
          className="theme-panel rounded-3xl p-6"
        >
          <h2 className="text-xl font-bold text-[color:var(--text-main-theme)]">
            Profile Details
          </h2>
          <p className="theme-muted mt-2 text-sm">
            Cap nhat ten hien thi, avatar va bio cua tai khoan admin.
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-[color:var(--text-main-theme)]">
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
                className="theme-input w-full rounded-2xl px-4 py-3 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[color:var(--text-main-theme)]">
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
                className="theme-input w-full rounded-2xl px-4 py-3 text-sm"
                required
              />
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-[color:var(--text-main-theme)]">
              Avatar
            </label>
            <div className="mb-3 flex items-center gap-4">
              <div className="flex size-16 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-lg font-bold text-primary">
                {pendingAvatarPreview ? (
                  <img
                    src={pendingAvatarPreview}
                    alt={`${profileForm.firstName} ${profileForm.lastName}`}
                    className="h-full w-full object-cover"
                  />
                ) : profileForm.avatar ? (
                  <img
                    src={getImageUrl(profileForm.avatar)}
                    alt={`${profileForm.firstName} ${profileForm.lastName}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  `${profileForm.firstName?.[0] || ""}${profileForm.lastName?.[0] || ""}` ||
                  "A"
                )}
              </div>
              <label className="inline-flex cursor-pointer items-center rounded-xl border border-border-dark bg-[color:var(--surface-muted)] px-4 py-2 text-sm font-semibold text-[color:var(--text-main-theme)] transition-colors hover:border-primary hover:text-primary">
                {isUploadingAvatar ? "Dang upload..." : "Upload avatar"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(event) => void handleAvatarUpload(event)}
                  disabled={isUploadingAvatar}
                />
              </label>
            </div>
            <p className="theme-muted text-xs leading-6">
              URL anh khong hien thi tren giao dien admin. Anh moi chi duoc
              upload len storage khi ban bam{" "}
              <span className="font-semibold text-[color:var(--text-main-theme)]">
                Save Profile
              </span>{" "}
              .
            </p>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-[color:var(--text-main-theme)]">
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
              className="theme-input w-full rounded-2xl px-4 py-3 text-sm"
              placeholder="Admin bio, operational focus, ownership areas..."
            />
          </div>

          <button
            type="submit"
            disabled={isSavingProfile}
            className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {isSavingProfile && isUploadingAvatar
              ? "Dang upload avatar va luu..."
              : isSavingProfile
                ? "Dang luu..."
                : "Save Profile"}
          </button>
        </form>

        <div className="space-y-6">
          <div className="theme-panel rounded-3xl p-6">
            <h2 className="text-xl font-bold text-[color:var(--text-main-theme)]">
              Account Summary
            </h2>
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-[color:var(--border-theme)] px-4 py-3">
                <p className="theme-muted text-xs uppercase tracking-wide">
                  Role
                </p>
                <p className="mt-1 text-sm font-semibold text-[color:var(--text-main-theme)]">
                  {user.role}
                </p>
              </div>
              <div className="rounded-2xl border border-[color:var(--border-theme)] px-4 py-3">
                <p className="theme-muted text-xs uppercase tracking-wide">
                  Email verified
                </p>
                <p className="mt-1 text-sm font-semibold text-[color:var(--text-main-theme)]">
                  {user.emailVerifiedAt ? "Verified" : "Pending"}
                </p>
              </div>
              <div className="rounded-2xl border border-[color:var(--border-theme)] px-4 py-3">
                <p className="theme-muted text-xs uppercase tracking-wide">
                  Joined
                </p>
                <p className="mt-1 text-sm font-semibold text-[color:var(--text-main-theme)]">
                  {formatDate(user.createdAt)}
                </p>
              </div>
              <div className="rounded-2xl border border-[color:var(--border-theme)] px-4 py-3">
                <p className="theme-muted text-xs uppercase tracking-wide">
                  MFA status
                </p>
                <p className="mt-1 text-sm font-semibold text-[color:var(--text-main-theme)]">
                  {user.mfaEnabled ? "Enabled" : "Not enabled"}
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handlePasswordChange}
            className="theme-panel rounded-3xl p-6"
          >
            <h2 className="text-xl font-bold text-[color:var(--text-main-theme)]">
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
                className="theme-input w-full rounded-2xl px-4 py-3 text-sm"
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
                className="theme-input w-full rounded-2xl px-4 py-3 text-sm"
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
                className="theme-input w-full rounded-2xl px-4 py-3 text-sm"
                placeholder="Confirm new password"
                minLength={6}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isChangingPassword}
              className="mt-6 inline-flex h-11 items-center rounded-xl border border-border-dark bg-[color:var(--surface-muted)] px-5 text-sm font-semibold text-[color:var(--text-main-theme)] transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
            >
              {isChangingPassword ? "Dang doi mat khau..." : "Change Password"}
            </button>
          </form>
        </div>
      </section>

      <section className="theme-panel rounded-3xl p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[color:var(--text-main-theme)]">
              Multi-Factor Authentication
            </h2>
            <p className="theme-muted mt-2 max-w-3xl text-sm leading-7">
              Bao ve tai khoan quan tri bang ma TOTP 6 so tu Google
              Authenticator, 1Password, Authy hoac ung dung tuong tu.
            </p>
          </div>
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
              user.mfaEnabled
                ? "border-green-500/30 bg-green-500/10 text-green-300"
                : "border-yellow-500/30 bg-yellow-500/10 text-yellow-200"
            }`}
          >
            {user.mfaEnabled ? "Enabled" : "Not enabled"}
          </span>
        </div>

        {!user.mfaEnabled ? (
          <div className="mt-6 space-y-5">
            {!mfaSetup ? (
              <button
                type="button"
                onClick={() => void handleSetupMfa()}
                disabled={isLoadingMfaSetup}
                className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {isLoadingMfaSetup ? "Dang tao QR..." : "Set Up MFA"}
              </button>
            ) : (
              <form
                onSubmit={handleEnableMfa}
                className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]"
              >
                <div className="rounded-2xl border border-[color:var(--border-theme)] bg-[color:var(--surface-muted)] p-4">
                  <p className="theme-muted text-xs font-semibold uppercase tracking-wide">
                    Step 1
                  </p>
                  <p className="mt-2 text-sm text-[color:var(--text-main-theme)]">
                    Scan QR nay bang authenticator app cua ban.
                  </p>
                  <img
                    src={mfaSetup.qrCodeDataUrl}
                    alt="MFA QR code"
                    className="mt-4 h-56 w-56 rounded-2xl border border-[color:var(--border-theme)] bg-white p-3"
                  />
                  <p className="theme-muted mt-4 text-xs font-semibold uppercase tracking-wide">
                    Manual entry key
                  </p>
                  <p className="mt-2 break-all rounded-xl border border-dashed border-[color:var(--border-theme)] px-3 py-3 font-mono text-sm text-[color:var(--text-main-theme)]">
                    {mfaSetup.secret}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-[color:var(--text-main-theme)]">
                    Sau khi scan xong, nhap lai mat khau hien tai va ma 6 so
                    dang hien tren authenticator de kich hoat MFA.
                  </div>
                  <input
                    type="password"
                    value={mfaEnablePassword}
                    onChange={(event) =>
                      setMfaEnablePassword(event.target.value)
                    }
                    className="theme-input w-full rounded-2xl px-4 py-3 text-sm"
                    placeholder="Current password"
                    required
                  />
                  <input
                    value={mfaEnableCode}
                    onChange={(event) =>
                      setMfaEnableCode(
                        event.target.value.replaceAll(/\D/g, "").slice(0, 6),
                      )
                    }
                    inputMode="numeric"
                    maxLength={6}
                    className="theme-input w-full rounded-2xl px-4 py-3 font-mono text-sm tracking-[0.3em]"
                    placeholder="123456"
                    required
                  />

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={isEnablingMfa}
                      className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
                    >
                      {isEnablingMfa ? "Dang bat MFA..." : "Enable MFA"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMfaSetup(null)}
                      className="inline-flex h-11 items-center rounded-xl border border-border-dark bg-[color:var(--surface-muted)] px-5 text-sm font-semibold text-[color:var(--text-main-theme)] transition-colors hover:border-primary hover:text-primary"
                    >
                      Cancel setup
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        ) : (
          <form
            onSubmit={handleDisableMfa}
            className="mt-6 grid gap-4 xl:grid-cols-[1fr_1fr_auto] xl:items-end"
          >
            <input
              type="password"
              value={mfaDisablePassword}
              onChange={(event) => setMfaDisablePassword(event.target.value)}
              className="theme-input w-full rounded-2xl px-4 py-3 text-sm"
              placeholder="Current password"
              required
            />
            <input
              value={mfaDisableCode}
              onChange={(event) =>
                setMfaDisableCode(
                  event.target.value.replaceAll(/\D/g, "").slice(0, 6),
                )
              }
              inputMode="numeric"
              maxLength={6}
              className="theme-input w-full rounded-2xl px-4 py-3 font-mono text-sm tracking-[0.3em]"
              placeholder="123456"
              required
            />
            <button
              type="submit"
              disabled={isDisablingMfa}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 px-5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/15 disabled:opacity-60"
            >
              {isDisablingMfa ? "Dang tat MFA..." : "Disable MFA"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
