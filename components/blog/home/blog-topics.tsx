import { cn } from '@/lib/utils';

interface BlogTopicsProps {
    selectedTopic: string;
    topics: string[];
    onSelect: (topic: string) => void;
}

export function BlogTopics({
    selectedTopic,
    topics,
    onSelect,
}: BlogTopicsProps) {
    return (
        <section className="flex flex-wrap items-center gap-3 py-2">
            <span className="text-sm font-semibold text-text-sub dark:text-gray-400">
                Topics:
            </span>
            {topics.map((topic) => (
                <button
                    key={topic}
                    className={cn(
                        'flex h-9 items-center justify-center rounded-full border px-4 text-sm font-medium transition-all active:scale-95',
                        selectedTopic === topic
                            ? 'border-primary bg-primary text-white shadow-sm'
                            : 'border-gray-200 bg-surface-light text-text-main hover:border-primary hover:text-primary dark:border-gray-700 dark:bg-surface-dark dark:text-gray-300'
                    )}
                    onClick={() => onSelect(topic)}
                    type="button"
                >
                    {topic}
                </button>
            ))}
        </section>
    );
}
