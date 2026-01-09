import { AdminSidebar } from '@/components/admin/sidebar';
import { AdminHeader } from '@/components/admin/header';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen w-full bg-background-light dark:bg-background-dark text-[#111418] dark:text-white font-display overflow-hidden">
            {/* Side Navigation */}
            <AdminSidebar />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full min-w-0 bg-background-light dark:bg-background-dark overflow-hidden">
                {/* Top Header */}
                <AdminHeader title="Overview" />

                {/* Dashboard Content Scrollable */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10">
                    {children}
                </div>
            </main>
        </div>
    );
}
