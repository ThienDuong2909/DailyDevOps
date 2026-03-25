import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionHeadingProps {
    title: string;
    description?: string;
    action?: ReactNode;
    className?: string;
}

export function SectionHeading({
    title,
    description,
    action,
    className,
}: SectionHeadingProps) {
    return (
        <div
            className={cn(
                'flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between',
                className
            )}
        >
            <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-text-main dark:text-white">
                    {title}
                </h2>
                {description ? (
                    <p className="max-w-2xl text-sm text-text-sub dark:text-gray-400">
                        {description}
                    </p>
                ) : null}
            </div>
            {action}
        </div>
    );
}
