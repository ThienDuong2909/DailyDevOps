import { AdminRouteGuard } from "@/components/auth/admin-route-guard";
import { AdminShell } from "@/components/layout/admin-shell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminRouteGuard>
      <AdminShell>{children}</AdminShell>
    </AdminRouteGuard>
  );
}
