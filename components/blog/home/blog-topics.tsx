import { useDictionary } from "@/components/i18n/locale-provider";
import { Skeleton } from "@/components/shared/skeleton";
import { cn } from "@/lib/utils";

interface TopicOption {
  readonly label: string;
  readonly value: string;
}

interface BlogTopicsProps {
  isLoading?: boolean;
  selectedTopic: string;
  topics: readonly TopicOption[];
  onSelect: (topic: string) => void;
}

export function BlogTopics({
  isLoading,
  selectedTopic,
  topics,
  onSelect,
}: Readonly<BlogTopicsProps>) {
  const dictionary = useDictionary();

  return (
    <section className="flex items-center gap-3 py-2 overflow-x-auto whitespace-nowrap scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:overflow-visible">
      <span className="text-sm font-semibold text-text-sub dark:text-gray-400">
        {dictionary.blog.topics}
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
              "flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition-all active:scale-95",
              selectedTopic === topic.value
                ? "theme-glow-button border-transparent text-white"
                : "theme-panel-muted theme-border text-[color:var(--text-main-theme)] hover:border-primary/40 hover:text-primary",
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
