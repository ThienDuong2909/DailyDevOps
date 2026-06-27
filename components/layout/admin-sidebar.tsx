"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { useAuthStore } from "@/hooks/use-auth";
import {
  adminPrimaryNavItems,
  adminSecondaryNavItems,
  isAdminNavItemActive,
  type AdminNavItem,
} from "@/components/layout/admin-navigation";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  mode?: "desktop" | "mobile";
  onNavigate?: () => void;
}

function AdminNavLink({
  item,
  active,
  compact,
  onNavigate,
}: Readonly<{
  item: AdminNavItem;
  active: boolean;
  compact?: boolean;
  onNavigate?: () => void;
}>) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-all",
        active
          ? "border-primary/20 bg-primary/10 text-[color:var(--text-main-theme)] shadow-sm"
          : "theme-muted hover:border-[color:var(--border-soft-theme)] hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--text-main-theme)]",
      )}
    >
      <span
        className={cn(
          "material-symbols-outlined flex size-9 shrink-0 items-center justify-center rounded-lg text-[20px] transition-colors",
          active
            ? "bg-primary text-white"
            : "bg-[color:var(--surface-muted)] text-[color:var(--text-muted-theme)] group-hover:text-primary",
        )}
      >
        {item.icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">
          {item.label}
        </span>
        {!compact && item.description ? (
          <span className="theme-soft mt-0.5 block truncate text-[11px]">
            {item.description}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

export function AdminSidebar({
  mode = "desktop",
  onNavigate,
}: Readonly<AdminSidebarProps>) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuthStore();
  const compact = mode === "mobile";

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      router.push("/login");
      onNavigate?.();
    } catch {
      toast.error("Logout failed");
    }
  };

  return (
    <aside
      className={cn(
        "theme-surface flex h-full w-[280px] shrink-0 flex-col border-r",
        mode === "desktop" && "hidden lg:flex",
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col p-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <span className="material-symbols-outlined">
              admin_panel_settings
            </span>
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold leading-tight text-[color:var(--text-main-theme)]">
              {user ? `${user.firstName} ${user.lastName}` : "DevOps Admin"}
            </h1>
            <p className="theme-muted text-xs">DailyDevOps Control</p>
          </div>
        </div>

        <nav className="custom-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
          {adminPrimaryNavItems.map((item) => (
            <AdminNavLink
              key={item.href}
              item={item}
              active={isAdminNavItemActive(pathname, item.href)}
              compact={compact}
              onNavigate={onNavigate}
            />
          ))}
        </nav>

        <div className="theme-border mt-5 space-y-1 border-t pt-4">
          {adminSecondaryNavItems.map((item) => (
            <AdminNavLink
              key={item.href}
              item={item}
              active={isAdminNavItemActive(pathname, item.href)}
              compact
              onNavigate={onNavigate}
            />
          ))}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[#fa6238] transition-colors hover:bg-[color:var(--surface-muted)]"
            type="button"
          >
            <span className="material-symbols-outlined flex size-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-[20px]">
              logout
            </span>
            <span className="text-sm font-semibold">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
