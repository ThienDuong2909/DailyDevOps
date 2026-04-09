import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
    'relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-bold tracking-[0.01em] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    {
        variants: {
            variant: {
                default: 'theme-glow-button text-white',
                destructive:
                    'bg-[linear-gradient(135deg,#b31b25_0%,#fb5151_100%)] text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.26),inset_0_-2px_4px_rgba(87,0,8,0.18),0_10px_28px_rgba(179,27,37,0.2)] hover:-translate-y-0.5 hover:brightness-[1.06] hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.26),inset_0_-2px_4px_rgba(87,0,8,0.18),0_18px_36px_rgba(179,27,37,0.26)] active:translate-y-0 active:scale-[0.98]',
                outline:
                    'border border-[color:var(--border-soft-theme)] bg-[color:var(--surface-elevated)] text-[color:var(--primary-theme)] shadow-[0_8px_24px_rgba(34,45,81,0.04)] hover:bg-[color:var(--surface-muted)] hover:border-[color:color-mix(in_srgb,var(--primary-theme)_18%,transparent)] hover:shadow-[0_16px_32px_rgba(34,45,81,0.08)] active:translate-y-[1px]',
                secondary:
                    'bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-elevated)_92%,white)_0%,color-mix(in_srgb,var(--surface-muted)_96%,transparent)_100%)] text-[color:var(--text-main-theme)] shadow-[inset_0_2px_4px_rgba(255,255,255,0.55),inset_0_-2px_4px_rgba(34,45,81,0.08),0_10px_28px_rgba(34,45,81,0.08)] hover:-translate-y-0.5 hover:brightness-[1.03] hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.55),inset_0_-2px_4px_rgba(34,45,81,0.08),0_18px_36px_rgba(34,45,81,0.12)] active:translate-y-0 active:scale-[0.98]',
                ghost:
                    'text-[color:var(--text-main-theme)] hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--primary-theme)] active:scale-[0.98]',
                link: 'text-primary underline-offset-4 hover:underline',
            },
            size: {
                default: 'h-10 px-5 py-2',
                sm: 'h-8 px-3.5 text-xs',
                lg: 'h-12 px-8 text-base',
                icon: 'h-10 w-10',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
        const isGlossy = !variant || variant === 'default' || variant === 'destructive' || variant === 'secondary';

        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                disabled={disabled || loading}
                {...props}
            >
                {loading && (
                    <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                )}
                <span className="relative z-[1] inline-flex items-center gap-2">
                    {children}
                </span>
                {isGlossy && !loading && (
                    <span
                        aria-hidden="true"
                        className="pointer-events-none absolute right-[15%] top-[6px] z-[2] h-[4px] w-[12px] rounded-full bg-white/60 blur-[1px]"
                    />
                )}
            </button>
        );
    }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
