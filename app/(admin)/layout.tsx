import type { Metadata } from "next";
import { AdminRouteGuard } from "@/components/auth/admin-route-guard";
import { AdminShell } from "@/components/layout/admin-shell";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AdminRouteGuard>
      <AdminShell>{children}</AdminShell>
    </AdminRouteGuard>
  );
}
