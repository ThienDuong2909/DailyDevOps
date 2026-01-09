import { BlogHeader } from '@/components/blog/header';
import { BlogFooter } from '@/components/blog/footer';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark text-text-main dark:text-white transition-colors duration-200">
            <BlogHeader />
            <main className="flex flex-1 flex-col items-center w-full px-4 md:px-10 py-6 md:py-10">
                {children}
            </main>
            <BlogFooter />
        </div>
    );
}
