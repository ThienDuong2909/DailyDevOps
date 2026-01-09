import Link from 'next/link';

export function BlogFooter() {
    return (
        <footer className="w-full bg-surface-light dark:bg-surface-dark border-t border-gray-200 dark:border-gray-800 mt-10">
            <div className="layout-container flex justify-center w-full">
                <div className="flex flex-col max-w-[1280px] w-full px-4 py-10 md:px-10">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-10">
                        {/* Brand Section */}
                        <div className="flex flex-col gap-4 max-w-xs">
                            <div className="flex items-center gap-2 text-text-main dark:text-white">
                                <div className="size-6 text-primary">
                                    <span className="material-symbols-outlined">cloud_circle</span>
                                </div>
                                <h3 className="font-bold text-lg">DevOps Daily</h3>
                            </div>
                            <p className="text-sm text-text-sub">
                                The leading resource for DevOps professionals, SREs, and Platform Engineers. Building
                                the future of infrastructure together.
                            </p>
                            <div className="flex gap-4 mt-2">
                                <Link href="#" className="text-text-sub hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined">public</span>
                                </Link>
                                <Link href="#" className="text-text-sub hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined">alternate_email</span>
                                </Link>
                                <Link href="#" className="text-text-sub hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined">rss_feed</span>
                                </Link>
                            </div>
                        </div>

                        {/* Links Section */}
                        <div className="flex flex-wrap gap-12 md:gap-20">
                            <div className="flex flex-col gap-3">
                                <h4 className="font-bold text-text-main dark:text-white text-sm">Content</h4>
                                <Link href="#" className="text-sm text-text-sub hover:text-primary">Articles</Link>
                                <Link href="#" className="text-sm text-text-sub hover:text-primary">Tutorials</Link>
                                <Link href="#" className="text-sm text-text-sub hover:text-primary">Case Studies</Link>
                                <Link href="#" className="text-sm text-text-sub hover:text-primary">Videos</Link>
                            </div>
                            <div className="flex flex-col gap-3">
                                <h4 className="font-bold text-text-main dark:text-white text-sm">Company</h4>
                                <Link href="#" className="text-sm text-text-sub hover:text-primary">About Us</Link>
                                <Link href="#" className="text-sm text-text-sub hover:text-primary">Careers</Link>
                                <Link href="#" className="text-sm text-text-sub hover:text-primary">Contact</Link>
                                <Link href="#" className="text-sm text-text-sub hover:text-primary">Privacy Policy</Link>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-gray-200 dark:bg-gray-800 w-full my-8" />

                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-text-sub">
                        <p>© 2024 DevOps Daily. All rights reserved.</p>
                        <p className="flex items-center gap-1">
                            Made with{' '}
                            <span className="material-symbols-outlined !text-[16px] text-red-500">favorite</span>{' '}
                            for the community
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
