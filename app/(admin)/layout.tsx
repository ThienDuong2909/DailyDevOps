import { AdminRouteGuard } from '@/components/auth/admin-route-guard';
import { AdminHeader } from '@/components/layout/admin-header';
import { AdminSidebar } from '@/components/layout/admin-sidebar';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AdminRouteGuard>
            <div className="flex h-screen w-full overflow-hidden bg-background-light font-display text-[#111418] dark:bg-background-dark dark:text-white">
                <AdminSidebar />
                <main className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-background-light dark:bg-background-dark">
                    <AdminHeader title="Overview" />
                    <div className="custom-scrollbar flex-1 overflow-y-auto p-6 lg:p-10">
                        {children}
                    </div>
                </main>
            </div>
        </AdminRouteGuard>
    );
}
