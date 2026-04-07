import { Skeleton } from '@/components/shared/skeleton';
import { cn } from '@/lib/utils';

interface TopicOption {
    label: string;
    value: string;
}

interface BlogTopicsProps {
    isLoading?: boolean;
    selectedTopic: string;
    topics: TopicOption[];
    onSelect: (topic: string) => void;
}

export function BlogTopics({
    isLoading,
    selectedTopic,
    topics,
    onSelect,
}: BlogTopicsProps) {
    return (
        <section className="flex flex-wrap items-center gap-3 py-2">
            <span className="text-sm font-semibold text-text-sub dark:text-gray-400">
                Topics:
            </span>
            {isLoading ? (
                <>
                    {Array.from({ length: 6 }, (_, i) => (
                        <Skeleton
                            key={i}
                            className="h-9 rounded-full"
                            style={{ width: 56 + (i % 3) * 20 }}
                        />
                    ))}
                </>
            ) : (
                topics.map((topic) => (
                    <button
                        key={topic.value}
                        className={cn(
                            'flex h-9 items-center justify-center rounded-full border px-4 text-sm font-medium transition-all active:scale-95',
                            selectedTopic === topic.value
                                ? 'border-primary bg-primary text-white shadow-sm'
                                : 'border-gray-200 bg-surface-light text-text-main hover:border-primary hover:text-primary dark:border-gray-700 dark:bg-surface-dark dark:text-gray-300'
                        )}
                        onClick={() => onSelect(topic.value)}
                        type="button"
                    >
                        {topic.label}
                    </button>
                ))
            )}
        </section>
    );
}
