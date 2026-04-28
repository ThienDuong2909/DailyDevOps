"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminDashboardSkeleton } from "@/components/admin/admin-dashboard-skeleton";
import { useAuthStore } from "@/hooks/use-auth";
import { resolvePostLoginRoute } from "@/lib/auth/redirects";

const adminRoles = new Set(["ADMIN", "MODERATOR", "EDITOR"]);

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

export function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const router = useRouter();
  const { initializeAuth, isAuthenticated, isInitialized, user } =
    useAuthStore();

  useEffect(() => {
    void initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    // Wait until auth is fully initialized AND user profile is loaded.
    // isAuthenticated can be true (from persisted localStorage) while
    // user is still null (profile not yet fetched). Redirecting before
    // user is resolved causes a false redirect to /login.
    if (!isInitialized || (isAuthenticated && user === null)) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (!adminRoles.has(user?.role || "")) {
      router.replace(resolvePostLoginRoute(user?.role));
    }
  }, [isAuthenticated, isInitialized, router, user, user?.role]);

  // Show skeleton while auth is initializing or while user profile is loading.
  if (!isInitialized || (isAuthenticated && user === null)) {
    return <AdminDashboardSkeleton />;
  }

  if (!isAuthenticated || !adminRoles.has(user?.role || "")) {
    return <AdminDashboardSkeleton />;
  }

  return <>{children}</>;
}
