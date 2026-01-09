import Link from 'next/link';

export default function HomePage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background-dark text-white">
            <div className="text-center max-w-3xl px-6">
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-3xl">terminal</span>
                    </div>
                    <h1 className="text-4xl font-bold">
                        DevOps<span className="text-primary">Daily</span>
                    </h1>
                </div>

                {/* Tagline */}
                <p className="text-xl text-gray-400 mb-12">
                    Automate Everything, Deploy Anywhere
                </p>

                {/* Links */}
                <div className="flex flex-wrap gap-4 justify-center">
                    <Link
                        href="/blog"
                        className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg shadow-lg shadow-primary/20 transition-all"
                    >
                        <span className="flex items-center gap-2">
                            <span className="material-symbols-outlined">article</span>
                            View Blog
                        </span>
                    </Link>
                    <Link
                        href="/admin"
                        className="px-6 py-3 bg-surface-dark hover:bg-gray-700 text-white font-bold rounded-lg border border-border-dark transition-all"
                    >
                        <span className="flex items-center gap-2">
                            <span className="material-symbols-outlined">dashboard</span>
                            Admin Dashboard
                        </span>
                    </Link>
                    <Link
                        href="/login"
                        className="px-6 py-3 bg-transparent hover:bg-surface-dark text-gray-400 hover:text-white font-bold rounded-lg border border-border-dark transition-all"
                    >
                        <span className="flex items-center gap-2">
                            <span className="material-symbols-outlined">login</span>
                            Login
                        </span>
                    </Link>
                </div>

                {/* Tech Stack */}
                <div className="mt-16 pt-8 border-t border-border-dark">
                    <p className="text-sm text-gray-500 mb-4">Built with</p>
                    <div className="flex flex-wrap gap-3 justify-center text-xs">
                        <span className="px-3 py-1 bg-surface-dark rounded-full text-gray-400">Next.js 14</span>
                        <span className="px-3 py-1 bg-surface-dark rounded-full text-gray-400">NestJS</span>
                        <span className="px-3 py-1 bg-surface-dark rounded-full text-gray-400">PostgreSQL</span>
                        <span className="px-3 py-1 bg-surface-dark rounded-full text-gray-400">Prisma</span>
                        <span className="px-3 py-1 bg-surface-dark rounded-full text-gray-400">Tailwind CSS</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
