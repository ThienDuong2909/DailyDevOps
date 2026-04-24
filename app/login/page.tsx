"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { ResendVerificationForm } from "@/components/auth/resend-verification-form";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuthStore } from "@/hooks/use-auth";
import { extractApiMessage, normalizeAuthMessage } from "@/lib/auth/messages";
import { resolvePostLoginRoute } from "@/lib/auth/redirects";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const {
    initializeAuth,
    login,
    verifyMfaLogin,
    isAuthenticated,
    isInitialized,
    isLoading,
    error,
    clearError,
    user,
  } = useAuthStore();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [mfaStep, setMfaStep] = useState<{
    challengeToken: string;
    challengeExpiresAt?: number;
    email: string;
  } | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const shouldShowResendVerification =
    typeof error === "string" &&
    error.toLowerCase().includes("verify your email");
  const submitButtonLabel = isLoading
    ? "Signing in..."
    : mfaStep
      ? "Verify Code"
      : "Sign In";

  useEffect(() => {
    void initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!isInitialized || !isAuthenticated) {
      return;
    }

    router.replace(resolvePostLoginRoute(user?.role));
  }, [isAuthenticated, isInitialized, router, user?.role]);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    clearError();

    try {
      if (mfaStep) {
        await verifyMfaLogin({
          challengeToken: mfaStep.challengeToken,
          token: mfaCode,
        });
        toast.success("Two-step verification complete!");
        const nextRoute = resolvePostLoginRoute(
          useAuthStore.getState().user?.role,
        );
        router.push(nextRoute);
        return;
      }

      const result = await login(formData);

      if (result?.mfaRequired && result.challengeToken) {
        setMfaStep({
          challengeToken: result.challengeToken,
          challengeExpiresAt: result.challengeExpiresAt,
          email: formData.email,
        });
        setMfaCode("");
        toast.success(
          "Enter the authentication code from your authenticator app",
        );
        return;
      }

      toast.success("Login successful!");
      const nextRoute = resolvePostLoginRoute(
        useAuthStore.getState().user?.role,
      );
      router.push(nextRoute);
    } catch (err) {
      const nextMessage = normalizeAuthMessage(
        extractApiMessage(err, error || "Unable to sign in right now."),
      );
      toast.error(nextMessage);
    }
  };

  if (!isInitialized && isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <span className="size-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-[#111418] dark:text-white min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Decoration */}
      <div
        className="absolute inset-0 z-0 opacity-40 dark:opacity-20 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#137fec 0.5px, transparent 0.5px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Main Layout Container */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        {/* Login Card */}
        <div className="w-full max-w-[480px] bg-white dark:bg-[#1a232e] rounded-xl shadow-lg border border-[#dbe0e6] dark:border-gray-700 overflow-hidden">
          {/* Header Section */}
          <div className="flex flex-col items-center pt-10 pb-4 px-8 text-center">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-primary text-4xl">
                terminal
              </span>
            </div>
            <h1 className="text-[#111418] dark:text-white tracking-tight text-[28px] font-bold leading-tight">
              Sign in to DevOps Blog
            </h1>
            <p className="text-[#617589] dark:text-gray-400 text-base font-normal leading-normal pt-2">
              Continue to your workspace. We will route you to the right area
              based on your role.
            </p>
          </div>

          {/* Form Section */}
          <div className="px-8 pb-10">
            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
                  {error}
                </div>
              )}

              {!mfaStep ? (
                <>
                  <div className="flex flex-col gap-2">
                    <label className="text-[#111418] dark:text-gray-200 text-sm font-medium leading-normal">
                      Email Address
                    </label>
                    <input
                      aria-label="Email Address"
                      className="form-input flex w-full resize-none overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-[#1a232e] focus:border-primary h-12 placeholder:text-[#617589] px-4 text-base font-normal leading-normal transition-all"
                      placeholder="you@devopsblog.com"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[#111418] dark:text-gray-200 text-sm font-medium leading-normal">
                        Password
                      </label>
                    </div>
                    <div className="relative flex w-full items-center rounded-lg">
                      <input
                        aria-label="Password"
                        className="form-input flex w-full resize-none overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-[#1a232e] focus:border-primary h-12 placeholder:text-[#617589] px-4 pr-12 text-base font-normal leading-normal transition-all"
                        placeholder="Enter your password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        required
                      />
                      <div
                        className="absolute right-0 top-0 bottom-0 flex items-center justify-center pr-4 cursor-pointer text-[#617589] hover:text-primary transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Link
                        className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                        href="/forgot-password"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <div>
                    <p className="text-sm font-semibold text-[#111418] dark:text-white">
                      Two-step verification
                    </p>
                    <p className="mt-1 text-sm text-[#617589] dark:text-gray-400">
                      Enter the 6-digit code from your authenticator app for{" "}
                      <span className="font-semibold text-[#111418] dark:text-white">
                        {mfaStep.email}
                      </span>
                      .
                    </p>
                  </div>
                  <input
                    aria-label="Authentication Code"
                    className="form-input flex h-12 w-full resize-none overflow-hidden rounded-lg border border-[#dbe0e6] bg-white px-4 text-base font-semibold tracking-[0.35em] text-[#111418] placeholder:text-[#617589] focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/50 dark:border-gray-600 dark:bg-[#1a232e] dark:text-white"
                    placeholder="123456"
                    inputMode="numeric"
                    maxLength={6}
                    value={mfaCode}
                    onChange={(event) =>
                      setMfaCode(
                        event.target.value.replaceAll(/\D/g, "").slice(0, 6),
                      )
                    }
                    required
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setMfaStep(null);
                      setMfaCode("");
                      clearError();
                    }}
                    className={cn(
                      buttonVariants({ variant: "link", size: "sm" }),
                      "h-auto px-0 py-0",
                    )}
                  >
                    Use a different account
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  loading={isLoading}
                  className="h-12 w-full rounded-lg text-base font-bold leading-normal tracking-[0.015em] shadow-md shadow-blue-500/20"
                >
                  <span className="truncate">{submitButtonLabel}</span>
                </Button>
              </div>
            </form>

            {/* Footer/Copyright */}
            <div className="mt-8 text-center">
              <p className="mb-2 text-sm text-[#617589] dark:text-gray-400">
                Need an account?{" "}
                <Link
                  className="font-semibold text-primary hover:text-primary/80"
                  href="/register"
                >
                  Register here
                </Link>
              </p>
              <p className="text-xs text-[#617589] dark:text-gray-500">
                © 2026 DevOps Blog. All rights reserved.
              </p>
            </div>

            {shouldShowResendVerification ? (
              <div className="mt-6">
                <ResendVerificationForm defaultEmail={formData.email} />
              </div>
            ) : null}
          </div>

          {/* Decorative Bottom Bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 via-primary to-blue-600" />
        </div>

        {/* Additional Links */}
        <div className="mt-6 text-center">
          <Link
            className="text-sm text-[#617589] hover:text-[#111418] dark:text-gray-400 dark:hover:text-white transition-colors flex items-center gap-1"
            href="/"
          >
            <span className="material-symbols-outlined text-[16px]">
              arrow_back
            </span>
            <span>Return to Blog</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
