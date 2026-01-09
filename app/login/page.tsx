'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/hooks/use-auth';

export default function LoginPage() {
    const router = useRouter();
    const { login, isLoading, error, clearError } = useAuthStore();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();

        try {
            await login(formData);
            toast.success('Login successful!');
            router.push('/admin');
        } catch (err) {
            toast.error(error || 'Login failed');
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-[#111418] dark:text-white min-h-screen flex flex-col relative overflow-hidden">
            {/* Background Decoration */}
            <div
                className="absolute inset-0 z-0 opacity-40 dark:opacity-20 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(#137fec 0.5px, transparent 0.5px)',
                    backgroundSize: '24px 24px'
                }}
            />

            {/* Main Layout Container */}
            <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
                {/* Login Card */}
                <div className="w-full max-w-[480px] bg-white dark:bg-[#1a232e] rounded-xl shadow-lg border border-[#dbe0e6] dark:border-gray-700 overflow-hidden">
                    {/* Header Section */}
                    <div className="flex flex-col items-center pt-10 pb-4 px-8 text-center">
                        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-primary text-4xl">terminal</span>
                        </div>
                        <h1 className="text-[#111418] dark:text-white tracking-tight text-[28px] font-bold leading-tight">
                            DevOps Admin Portal
                        </h1>
                        <p className="text-[#617589] dark:text-gray-400 text-base font-normal leading-normal pt-2">
                            Please enter your details to access the dashboard.
                        </p>
                    </div>

                    {/* Form Section */}
                    <div className="px-8 pb-10">
                        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                            {/* Error Message */}
                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Email Input */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[#111418] dark:text-gray-200 text-sm font-medium leading-normal">
                                    Email Address
                                </label>
                                <input
                                    className="form-input flex w-full resize-none overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-[#1a232e] focus:border-primary h-12 placeholder:text-[#617589] px-4 text-base font-normal leading-normal transition-all"
                                    placeholder="admin@devopsblog.com"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Password Input */}
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-[#111418] dark:text-gray-200 text-sm font-medium leading-normal">
                                        Password
                                    </label>
                                </div>
                                <div className="relative flex w-full items-center rounded-lg">
                                    <input
                                        className="form-input flex w-full resize-none overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-[#1a232e] focus:border-primary h-12 placeholder:text-[#617589] px-4 pr-12 text-base font-normal leading-normal transition-all"
                                        placeholder="Enter your password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                    <div
                                        className="absolute right-0 top-0 bottom-0 flex items-center justify-center pr-4 cursor-pointer text-[#617589] hover:text-primary transition-colors"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        <span className="material-symbols-outlined text-[20px]">
                                            {showPassword ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <Link
                                        className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                                        href="/forgot-password"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary hover:bg-blue-600 disabled:bg-primary/60 text-white text-base font-bold leading-normal tracking-[0.015em] transition-colors shadow-md shadow-blue-500/20"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center gap-2">
                                            <span className="size-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            Signing in...
                                        </span>
                                    ) : (
                                        <span className="truncate">Sign In</span>
                                    )}
                                </button>
                            </div>
                        </form>

                        {/* Test Credentials Info */}
                        <div className="mt-6 p-4 bg-[#f6f7f8] dark:bg-[#111418] rounded-lg text-center">
                            <p className="text-xs text-[#617589] mb-1">Test Credentials</p>
                            <p className="text-sm text-[#111418] dark:text-white font-mono">
                                admin@devopsblog.com / Admin@123
                            </p>
                        </div>

                        {/* Footer/Copyright */}
                        <div className="mt-8 text-center">
                            <p className="text-xs text-[#617589] dark:text-gray-500">
                                © 2024 DevOps Blog. All rights reserved.
                            </p>
                        </div>
                    </div>

                    {/* Decorative Bottom Bar */}
                    <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 via-primary to-blue-600" />
                </div>

                {/* Additional Links */}
                <div className="mt-6 text-center">
                    <Link
                        className="text-sm text-[#617589] hover:text-[#111418] dark:text-gray-400 dark:hover:text-white transition-colors flex items-center gap-1"
                        href="/blog"
                    >
                        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                        Return to Blog
                    </Link>
                </div>
            </div>
        </div>
    );
}
