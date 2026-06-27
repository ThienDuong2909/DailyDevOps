"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { AdminHeader } from "@/components/layout/admin-header";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { cn } from "@/lib/utils";

export function AdminShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileNavOpen]);

  return (
    <div className="theme-shell flex h-screen w-full overflow-hidden font-body">
      <AdminSidebar />

      <div
        aria-hidden={!mobileNavOpen}
        className={cn(
          "fixed inset-0 z-[70] bg-slate-950/45 backdrop-blur-sm transition-opacity lg:hidden",
          mobileNavOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        onClick={() => setMobileNavOpen(false)}
      />
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-[80] transition-transform duration-300 lg:hidden",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <AdminSidebar
          mode="mobile"
          onNavigate={() => setMobileNavOpen(false)}
        />
      </div>

      <main className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-transparent">
        <AdminHeader onMenuClick={() => setMobileNavOpen(true)} />
        <div className="custom-scrollbar flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
