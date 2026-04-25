"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { AI_TIMEOUT } from "@/lib/api/client";
import { getAccessToken } from "@/lib/auth";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import type {
  Category,
  Post,
  PostStatus,
  PostTranslation,
  PostVersion,
  Tag,
} from "@/types";
import { formatDate, formatRelativeTime, getImageUrl } from "@/lib/utils";
import toast from "react-hot-toast";
import { useAuthStore } from "@/hooks/use-auth";

type PostPayload = { data?: Post } | Post;
type TaxonomyPayload<T> = { data?: T[] } | T[];
type VersionsPayload = { data?: PostVersion[] } | PostVersion[];
type MediaItem = {
  key: string;
  url: string;
  size: number;
  lastModified?: string | null;
  folder?:
    | "post-media"
    | "featured-images"
    | "avatars"
    | "seo"
    | "newsletter"
    | "all";
};
type MediaPayload = { data?: MediaItem[] } | MediaItem[];
type ThumbnailJob = {
  id: string;
  postId: string;
  status: "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "CANCELLED";
  imageUrl?: string | null;
  storageKey?: string | null;
  mimeType?: string | null;
  prompt?: string | null;
  errorMessage?: string | null;
  attemptCount?: number;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};
type ThumbnailJobPayload = {
  data?: {
    id: string;
    postId: string;
    status: "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "CANCELLED";
    imageUrl?: string | null;
    storageKey?: string | null;
    mimeType?: string | null;
    prompt?: string | null;
    errorMessage?: string | null;
    attemptCount?: number;
    startedAt?: string | null;
    completedAt?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  };
};

interface ArticleFormState {
  title: string;
  subtitle: string;
  slug: string;
  content: string;
  contentJson: Record<string, unknown> | null;
  featuredImage: string;
  status: PostStatus;
  categoryId: string;
  tagIds: string[];
  scheduledAt: string;
}

type EditorLocale = "vi" | "en";
type ArticleSavePayload = {
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  contentHtml: string;
  contentJson: Record<string, unknown> | null;
  featuredImage: string | null;
  status: PostStatus;
  categoryId: string | null;
  tagIds: string[];
  scheduledAt: string | null;
};
type PostTranslationPayload = {
  locale: EditorLocale;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  contentHtml: string;
  contentJson: Record<string, unknown> | null;
  featuredImage: string | null;
  status: PostStatus;
  scheduledAt: string | null;
};

interface CategoryDraftState {
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
}

interface TagDraftState {
  name: string;
  slug: string;
}

interface OutlineItem {
  id: string;
  text: string;
  level: 2 | 3;
}

const initialFormState: ArticleFormState = {
  title: "",
  subtitle: "",
  slug: "",
  content: "",
  contentJson: null,
  featuredImage: "",
  status: "DRAFT",
  categoryId: "",
  tagIds: [],
  scheduledAt: "",
};

const initialCategoryDraft: CategoryDraftState = {
  name: "",
  slug: "",
  description: "",
  color: "",
  icon: "",
};

const initialTagDraft: TagDraftState = {
  name: "",
  slug: "",
};

const COMBINING_MARKS_REGEX = /[\u0300-\u036f]/g;
const NON_SLUG_CHARACTERS_REGEX = /[^a-z0-9\s-]/g;
const WHITESPACE_REGEX = /\s+/g;
const REPEATED_HYPHENS_REGEX = /-+/g;

function resolveData<T>(payload: T | { data?: T }, fallback: T): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload.data ?? fallback) as T;
  }

  return (payload as T) ?? fallback;
}

function createSlug(value: string) {
  let slug = value
    .normalize("NFD")
    .replaceAll(COMBINING_MARKS_REGEX, "")
    .replaceAll("\u0111", "d")
    .replaceAll("\u0110", "d")
    .trim()
    .toLowerCase()
    .replaceAll(NON_SLUG_CHARACTERS_REGEX, "")
    .replaceAll(WHITESPACE_REGEX, "-")
    .replaceAll(REPEATED_HYPHENS_REGEX, "-");

  while (slug.startsWith("-")) {
    slug = slug.slice(1);
  }

  while (slug.endsWith("-")) {
    slug = slug.slice(0, -1);
  }

  return slug.slice(0, 80);
}

function normalizeFeaturedImageValue(value: string | null | undefined) {
  const normalized = String(value || "").trim();

  if (!normalized) {
    return "";
  }

  if (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("/api/v1/media/object?key=")
  ) {
    return normalized;
  }

  if (normalized.startsWith("api/v1/media/object?key=")) {
    return `/${normalized}`;
  }

  if (normalized.startsWith("media/") || normalized.startsWith("avatars/")) {
    return `/api/v1/media/object?key=${encodeURIComponent(normalized)}`;
  }

  return normalized;
}

function buildFormState(post?: Post): ArticleFormState {
  if (!post) {
    return initialFormState;
  }

  return {
    title: post.title || "",
    subtitle: post.subtitle || post.excerpt || "",
    slug: post.slug || "",
    content: post.contentHtml || post.content || "",
    contentJson: (post.contentJson as Record<string, unknown> | null) || null,
    featuredImage: normalizeFeaturedImageValue(post.featuredImage),
    status: post.status || "DRAFT",
    categoryId: post.category?.id || "",
    tagIds: post.tags?.map((tag) => tag.id) || [],
    scheduledAt: post.scheduledAt ? post.scheduledAt.slice(0, 16) : "",
  };
}

function buildTranslationFormState(
  post: Post,
  translation?: PostTranslation | null,
): ArticleFormState {
  if (!translation) {
    return {
      ...buildFormState(post),
      title: "",
      subtitle: "",
      slug: "",
      content: "",
      contentJson: null,
      status: "DRAFT",
    };
  }

  return {
    title: translation.title || "",
    subtitle: translation.subtitle || translation.excerpt || "",
    slug: translation.slug || "",
    content: translation.contentHtml || translation.content || "",
    contentJson:
      (translation.contentJson as Record<string, unknown> | null) || null,
    featuredImage: normalizeFeaturedImageValue(
      translation.featuredImage || post.featuredImage,
    ),
    status: translation.status || "DRAFT",
    categoryId: post.category?.id || "",
    tagIds: post.tags?.map((tag) => tag.id) || [],
    scheduledAt: translation.scheduledAt
      ? translation.scheduledAt.slice(0, 16)
      : "",
  };
}

function countWords(content: string) {
  if (!content.trim()) {
    return 0;
  }

  const parserHost = globalThis.document.createElement("div");
  parserHost.innerHTML = content;
  const plainText = (parserHost.textContent || "").trim();

  if (!plainText) {
    return 0;
  }

  return plainText.split(/\s+/).length;
}

export default function ArticleEditPage() {
  const params = useParams();
  const router = useRouter();
  const articleId = params.id as string;
  const isNewArticle = articleId === "new";
  const currentUser = useAuthStore((state) => state.user);
  const [selectedLocale, setSelectedLocale] = useState<EditorLocale>("vi");

  const [article, setArticle] = useState<Post | null>(null);
  const [activeTranslation, setActiveTranslation] =
    useState<PostTranslation | null>(null);
  const [formState, setFormState] =
    useState<ArticleFormState>(initialFormState);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [versions, setVersions] = useState<PostVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isFormattingContent, setIsFormattingContent] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [thumbnailJob, setThumbnailJob] = useState<ThumbnailJob | null>(null);
  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>([]);
  const [isLoadingMediaLibrary, setIsLoadingMediaLibrary] = useState(false);
  const [activeMediaFolder, setActiveMediaFolder] = useState<
    "featured-images" | "post-media" | "avatars"
  >("featured-images");
  const [errorMessage, setErrorMessage] = useState("");
  const [autosaveState, setAutosaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [showCategoryCreator, setShowCategoryCreator] = useState(false);
  const [showTagCreator, setShowTagCreator] = useState(false);
  const [categoryDraft, setCategoryDraft] =
    useState<CategoryDraftState>(initialCategoryDraft);
  const [tagDraft, setTagDraft] = useState<TagDraftState>(initialTagDraft);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasHydratedRef = useRef(false);
  const lastSavedSnapshotRef = useRef("");
  const isAutosavingRef = useRef(false);
  const shouldAutoGenerateSlugRef = useRef(true);

  const fetchTaxonomies = useCallback(async () => {
    const [categoriesPayload, tagsPayload] = await Promise.all([
      apiClient.get<TaxonomyPayload<Category>>("/api/v1/categories"),
      apiClient.get<TaxonomyPayload<Tag>>("/api/v1/tags"),
    ]);

    setCategories(resolveData<Category[]>(categoriesPayload, []));
    setTags(resolveData<Tag[]>(tagsPayload, []));
  }, []);

  const fetchArticle = useCallback(async () => {
    if (isNewArticle) {
      setArticle(null);
      setActiveTranslation(null);
      setFormState(initialFormState);
      setVersions([]);
      shouldAutoGenerateSlugRef.current = true;
      return;
    }

    const payload = await apiClient.get<PostPayload>(
      `/api/v1/posts/${articleId}`,
    );
    const resolved = resolveData<Post | null>(payload, null);

    setArticle(resolved);
    if (!resolved) {
      setActiveTranslation(null);
      setFormState(initialFormState);
      shouldAutoGenerateSlugRef.current = true;
      return;
    }

    if (selectedLocale === "vi") {
      setActiveTranslation(null);
      setFormState(buildFormState(resolved));
      shouldAutoGenerateSlugRef.current = !(resolved.slug || "").trim();
      return;
    }

    try {
      const translationPayload = await apiClient.get<
        { data?: PostTranslation | null } | PostTranslation | null
      >(`/api/v1/posts/${articleId}/translations/${selectedLocale}`);
      const resolvedTranslation = resolveData<PostTranslation | null>(
        translationPayload,
        null,
      );
      setActiveTranslation(resolvedTranslation);
      setFormState(buildTranslationFormState(resolved, resolvedTranslation));
      shouldAutoGenerateSlugRef.current = !(
        resolvedTranslation?.slug || ""
      ).trim();
    } catch {
      setActiveTranslation(null);
      setFormState(buildTranslationFormState(resolved, null));
      shouldAutoGenerateSlugRef.current = true;
    }
  }, [articleId, isNewArticle, selectedLocale]);

  const fetchVersions = useCallback(async () => {
    if (isNewArticle) {
      setVersions([]);
      return;
    }

    const payload = await apiClient.get<VersionsPayload>(
      `/api/v1/posts/${articleId}/versions`,
    );
    setVersions(resolveData<PostVersion[]>(payload, []));
  }, [articleId, isNewArticle]);

  const fetchMediaLibrary = useCallback(async () => {
    try {
      setIsLoadingMediaLibrary(true);
      const payload = await apiClient.get<MediaPayload>("/api/v1/media", {
        params: { folder: "all" },
      });
      setMediaLibrary(resolveData<MediaItem[]>(payload, []));
    } finally {
      setIsLoadingMediaLibrary(false);
    }
  }, []);

  const fetchLatestThumbnailJob = useCallback(
    async (targetArticleId?: string) => {
      const resolvedArticleId = targetArticleId || articleId;

      if (!resolvedArticleId || resolvedArticleId === "new") {
        setThumbnailJob(null);
        return null;
      }

      try {
        const payload = await apiClient.get<ThumbnailJobPayload>(
          `/api/v1/posts/${resolvedArticleId}/thumbnail-jobs/latest`,
        );
        const resolvedJob = resolveData<ThumbnailJob | null>(payload, null);

        setThumbnailJob(resolvedJob);

        if (resolvedJob?.status === "SUCCEEDED" && resolvedJob.imageUrl) {
          const normalizedImage = normalizeFeaturedImageValue(
            resolvedJob.imageUrl,
          );
          setFormState((previous) =>
            previous.featuredImage === normalizedImage
              ? previous
              : { ...previous, featuredImage: normalizedImage },
          );
          setArticle((previous) =>
            previous && previous.featuredImage !== normalizedImage
              ? { ...previous, featuredImage: normalizedImage }
              : previous,
          );
        }

        return resolvedJob;
      } catch {
        return null;
      }
    },
    [articleId],
  );

  useEffect(() => {
    let isMounted = true;

    const loadPage = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        await Promise.all([
          fetchTaxonomies(),
          fetchArticle(),
          fetchVersions(),
          fetchMediaLibrary(),
          fetchLatestThumbnailJob(isNewArticle ? undefined : articleId),
        ]);

        if (!isMounted) {
          return;
        }
      } catch {
        if (!isMounted) {
          return;
        }

        setErrorMessage("Khong the tai du lieu bai viet de chinh sua.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadPage();

    return () => {
      isMounted = false;
    };
  }, [
    articleId,
    fetchArticle,
    fetchLatestThumbnailJob,
    fetchTaxonomies,
    fetchVersions,
    fetchMediaLibrary,
    isNewArticle,
  ]);

  const stats = useMemo(() => {
    const words = countWords(formState.content);

    return {
      words,
      characters: formState.content.length,
      readingTime: Math.max(1, Math.ceil(words / 200)),
    };
  }, [formState.content]);

  const documentOutline = useMemo<OutlineItem[]>(() => {
    if (globalThis.window === undefined || !formState.content) {
      return [];
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(formState.content, "text/html");

    return Array.from(doc.querySelectorAll("h2, h3"))
      .map((heading, index) => ({
        id: heading.id || `outline-${index}`,
        text: (heading.textContent || "").trim(),
        level: heading.tagName === "H2" ? (2 as const) : (3 as const),
      }))
      .filter((item) => item.text);
  }, [formState.content]);

  const lastSavedLabel = article?.updatedAt
    ? formatRelativeTime(article.updatedAt)
    : "Chua luu lan nao";
  const canPublishDirectly = ["ADMIN", "EDITOR", "MODERATOR"].includes(
    currentUser?.role || "",
  );
  const showReviewActions = !isNewArticle && article;
  const canManageTaxonomy = ["ADMIN", "EDITOR"].includes(
    currentUser?.role || "",
  );
  const selectedCategory =
    categories.find((category) => category.id === formState.categoryId) || null;
  const selectedTagNames = tags
    .filter((tag) => formState.tagIds.includes(tag.id))
    .map((tag) => tag.name);
  const visibleThumbnailMediaItems = mediaLibrary.filter((item) => {
    if (activeMediaFolder === "featured-images") {
      return item.folder === "featured-images";
    }

    if (activeMediaFolder === "post-media") {
      return item.folder === "post-media";
    }

    return item.folder === "avatars";
  });
  const isThumbnailJobRunning =
    thumbnailJob?.status === "PENDING" || thumbnailJob?.status === "PROCESSING";

  let thumbnailButtonLabel = "Gen thumbnail";
  if (isGeneratingImage) {
    thumbnailButtonLabel = "Dang tao job...";
  } else if (isThumbnailJobRunning) {
    thumbnailButtonLabel = "Dang gen thumbnail...";
  } else if (formState.featuredImage) {
    thumbnailButtonLabel = "Regen thumbnail";
  }

  let thumbnailJobMessage = "Trang thai job da duoc cap nhat.";
  if (isThumbnailJobRunning) {
    thumbnailJobMessage =
      "Backend dang tao anh nen o background. Ban co the tiep tuc chinh sua, doi trang, hoac dong trinh duyet.";
  } else if (thumbnailJob?.status === "SUCCEEDED") {
    thumbnailJobMessage =
      "Anh thumbnail moi da duoc tao va luu vao media library.";
  } else if (thumbnailJob?.status === "FAILED") {
    thumbnailJobMessage =
      thumbnailJob.errorMessage || "Qua trinh tao thumbnail that bai.";
  } else if (thumbnailJob?.status === "CANCELLED") {
    thumbnailJobMessage = "Job cu da bi huy vi co yeu cau moi hon.";
  }

  let featuredMediaLibraryContent = (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {visibleThumbnailMediaItems.slice(0, 12).map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => handleFieldChange("featuredImage", item.url)}
          className="group overflow-hidden rounded-lg border border-border-dark bg-[#1e293b] text-left transition-colors hover:border-primary"
        >
          <div className="aspect-video overflow-hidden bg-[#0b1220]">
            <img
              src={getImageUrl(item.url)}
              alt={item.key}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
          <div className="p-2">
            <p className="truncate text-[11px] font-semibold text-white">
              {item.key.split("/").pop()}
            </p>
            <p className="mt-1 text-[10px] text-[#9dabb9]">
              {Math.max(1, Math.round(item.size / 1024))} KB
            </p>
          </div>
        </button>
      ))}
    </div>
  );

  if (isLoadingMediaLibrary) {
    featuredMediaLibraryContent = (
      <p className="theme-muted text-sm">Dang tai media library...</p>
    );
  } else if (visibleThumbnailMediaItems.length === 0) {
    featuredMediaLibraryContent = (
      <p className="theme-muted text-sm">Chua co anh nao trong storage.</p>
    );
  }

  const buildPayload = useCallback(
    () => ({
      title: formState.title.trim(),
      slug: formState.slug.trim() || createSlug(formState.title),
      excerpt: formState.subtitle.trim() || null,
      content: formState.content,
      contentHtml: formState.content,
      contentJson: formState.contentJson,
      featuredImage:
        normalizeFeaturedImageValue(formState.featuredImage) || null,
      status: formState.status,
      categoryId: formState.categoryId || null,
      tagIds: formState.tagIds,
      scheduledAt:
        formState.status === "SCHEDULED" && formState.scheduledAt
          ? new Date(formState.scheduledAt).toISOString()
          : null,
    }),
    [formState],
  );

  const buildTranslationPayload = useCallback(
    () => ({
      locale: selectedLocale,
      title: formState.title.trim(),
      slug: formState.slug.trim() || createSlug(formState.title),
      excerpt: formState.subtitle.trim() || null,
      content: formState.content,
      contentHtml: formState.content,
      contentJson: formState.contentJson,
      featuredImage:
        normalizeFeaturedImageValue(formState.featuredImage) || null,
      status: formState.status,
      scheduledAt:
        formState.status === "SCHEDULED" && formState.scheduledAt
          ? new Date(formState.scheduledAt).toISOString()
          : null,
    }),
    [formState, selectedLocale],
  );

  const buildAutosaveSnapshot = useCallback(
    () =>
      JSON.stringify({
        locale: selectedLocale,
        title: formState.title.trim(),
        slug: formState.slug.trim(),
        subtitle: formState.subtitle.trim(),
        content: formState.content,
        contentJson: formState.contentJson,
        featuredImage: formState.featuredImage.trim(),
        status: formState.status,
        categoryId: formState.categoryId,
        tagIds: formState.tagIds,
        scheduledAt: formState.scheduledAt,
      }),
    [formState, selectedLocale],
  );

  useEffect(() => {
    if (!articleId || articleId === "new") {
      return;
    }

    if (
      !thumbnailJob ||
      !["PENDING", "PROCESSING"].includes(thumbnailJob.status)
    ) {
      return;
    }

    const timer = setInterval(() => {
      void fetchLatestThumbnailJob(articleId);
    }, 5000);

    return () => clearInterval(timer);
  }, [articleId, fetchLatestThumbnailJob, thumbnailJob]);

  useEffect(() => {
    if (loading) {
      return;
    }

    hasHydratedRef.current = true;
    lastSavedSnapshotRef.current = buildAutosaveSnapshot();
    setAutosaveState("idle");
  }, [article?.id, buildAutosaveSnapshot, loading]);

  const handleFieldChange = <K extends keyof ArticleFormState>(
    field: K,
    value: ArticleFormState[K],
  ) => {
    setFormState((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleTitleChange = (value: string) => {
    setFormState((previous) => ({
      ...previous,
      title: value,
      slug: shouldAutoGenerateSlugRef.current
        ? createSlug(value)
        : previous.slug,
    }));
  };

  const handleSlugChange = (value: string) => {
    shouldAutoGenerateSlugRef.current = false;
    handleFieldChange("slug", createSlug(value));
  };

  const handleTagToggle = (tagId: string) => {
    setFormState((previous) => ({
      ...previous,
      tagIds: previous.tagIds.includes(tagId)
        ? previous.tagIds.filter((item) => item !== tagId)
        : [...previous.tagIds, tagId],
    }));
  };

  const handleGenerateSlug = () => {
    shouldAutoGenerateSlugRef.current = true;
    handleFieldChange("slug", createSlug(formState.title));
  };

  const resetCategoryDraft = () => {
    setCategoryDraft(initialCategoryDraft);
    setShowCategoryCreator(false);
  };

  const resetTagDraft = () => {
    setTagDraft(initialTagDraft);
    setShowTagCreator(false);
  };

  const handleCreateCategory = async () => {
    if (!categoryDraft.name.trim()) {
      toast.error("Ten category la bat buoc");
      return;
    }

    try {
      setIsCreatingCategory(true);
      const payload = {
        name: categoryDraft.name.trim(),
        slug: categoryDraft.slug.trim() || null,
        description: categoryDraft.description.trim() || null,
        color: categoryDraft.color.trim() || null,
        icon: categoryDraft.icon.trim() || null,
      };

      const response = await apiClient.post<{ data?: Category } | Category>(
        "/api/v1/categories",
        payload,
      );
      const createdCategory = resolveData<Category | null>(response, null);

      await fetchTaxonomies();
      if (createdCategory?.id) {
        handleFieldChange("categoryId", createdCategory.id);
      }
      resetCategoryDraft();
      toast.success("Da tao category moi");
    } catch {
      toast.error("Khong the tao category luc nay");
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleCreateTag = async () => {
    if (!tagDraft.name.trim()) {
      toast.error("Ten tag la bat buoc");
      return;
    }

    try {
      setIsCreatingTag(true);
      const payload = {
        name: tagDraft.name.trim(),
        slug: tagDraft.slug.trim() || null,
      };

      const response = await apiClient.post<{ data?: Tag } | Tag>(
        "/api/v1/tags",
        payload,
      );
      const createdTag = resolveData<Tag | null>(response, null);

      await fetchTaxonomies();
      if (createdTag?.id) {
        setFormState((previous) => ({
          ...previous,
          tagIds: previous.tagIds.includes(createdTag.id)
            ? previous.tagIds
            : [...previous.tagIds, createdTag.id],
        }));
      }
      resetTagDraft();
      toast.success("Da tao tag moi");
    } catch {
      toast.error("Khong the tao tag luc nay");
    } finally {
      setIsCreatingTag(false);
    }
  };

  const handleFeaturedImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      setIsUploadingImage(true);
      const uploadedItem = await uploadMediaFile(file, "featured-image");

      handleFieldChange("featuredImage", uploadedItem.url);
      setMediaLibrary((previous) => [
        uploadedItem,
        ...previous.filter((item) => item.key !== uploadedItem.key),
      ]);
      setActiveMediaFolder("featured-images");
      await fetchMediaLibrary();
      toast.success("Da upload anh dai dien");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Khong the upload anh luc nay",
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleGenerateFeaturedImage = async () => {
    if (!formState.title.trim() && !formState.content.trim()) {
      toast.error("Can co title hoac noi dung de gen image");
      return;
    }

    try {
      setIsGeneratingImage(true);
      let targetArticleId = articleId;

      if (isNewArticle) {
        const draftResponse = await apiClient.post<PostPayload>(
          "/api/v1/posts",
          buildPayload(),
        );
        const createdPost = resolveData<Post | null>(draftResponse, null);

        if (!createdPost?.id) {
          throw new Error("Khong the tao draft bai viet de gen thumbnail");
        }

        const nextState = buildFormState(createdPost);
        setArticle(createdPost);
        setFormState(nextState);
        lastSavedSnapshotRef.current = JSON.stringify({
          title: nextState.title.trim(),
          slug: nextState.slug.trim(),
          subtitle: nextState.subtitle.trim(),
          content: nextState.content,
          contentJson: nextState.contentJson,
          featuredImage: nextState.featuredImage.trim(),
          status: nextState.status,
          categoryId: nextState.categoryId,
          tagIds: nextState.tagIds,
          scheduledAt: nextState.scheduledAt,
        });
        setAutosaveState("saved");
        targetArticleId = createdPost.id;
        router.replace(`/admin/articles/${createdPost.id}`);
      }

      const response = await apiClient.post<ThumbnailJobPayload>(
        `/api/v1/posts/${targetArticleId}/thumbnail-jobs`,
        {
          title: formState.title.trim(),
          subtitle: formState.subtitle.trim(),
          content: formState.content,
          contentHtml: formState.content,
          categoryName: selectedCategory?.name || "",
          tagNames: selectedTagNames,
        },
      );

      const job = resolveData<ThumbnailJob | null>(response, null);
      setThumbnailJob(job);

      toast.success(
        "Da bat dau tao thumbnail nen. Ban co the tiep tuc lam viec hoac tat trinh duyet.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Khong the gen image luc nay",
      );
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const uploadMediaFile = useCallback(
    async (file: File, purpose = "post-media") => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("purpose", purpose);
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "";

      const response = await fetch(`${apiBase}/api/v1/media/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAccessToken() || ""}`,
        },
        credentials: "include",
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message || "Image upload failed");
      }

      const uploadedItem = payload?.data as MediaItem | undefined;
      if (!uploadedItem?.url) {
        throw new Error("Image upload failed");
      }

      return uploadedItem;
    },
    [],
  );

  const uploadEditorMediaFile = useCallback(
    async (file: File) => {
      const uploadedItem = await uploadMediaFile(file, "post-media");
      return uploadedItem.url;
    },
    [uploadMediaFile],
  );

  const handleFormatContentByGemini = async () => {
    if (!formState.content.trim()) {
      toast.error("Cần có nội dung bài viết để định dạng");
      return;
    }

    try {
      setIsFormattingContent(true);
      const response = await apiClient.post<any>(
        "/api/v1/posts/format-content",
        {
          content: formState.content,
        },
        { timeout: AI_TIMEOUT },
      );
      const formattedContent = resolveData(response, { content: "" }).content;

      if (formattedContent) {
        setFormState((prev) => ({
          ...prev,
          content: formattedContent,
          contentJson: null,
        }));
        toast.success("Đã định dạng bài viết bằng AI");
      } else {
        toast.error("Không nhận được nội dung từ AI");
      }
    } catch (error) {
      toast.error("Lỗi khi định dạng bài viết");
      console.error("Format error:", error);
    } finally {
      setIsFormattingContent(false);
    }
  };

  const handleAutoTranslate = async () => {
    if (isNewArticle) {
      toast.error("Hay tao bai viet goc tieng Viet truoc khi dich");
      return;
    }

    if (!article?.id) {
      toast.error("Khong tim thay bai viet goc de dich");
      return;
    }

    const confirmed = globalThis.window.confirm(
      activeTranslation
        ? "Ban dich tieng Anh da ton tai. Dich lai se ghi de noi dung hien tai. Ban co chac khong?"
        : "He thong se su dung AI de dich bai viet sang tieng Anh. Qua trinh nay co the mat vai phut. Tiep tuc?",
    );

    if (!confirmed) return;

    try {
      setIsTranslating(true);
      const response = await apiClient.post<
        { data?: PostTranslation } | PostTranslation
      >(`/api/v1/posts/${article.id}/auto-translate`, undefined, {
        timeout: AI_TIMEOUT,
      });
      const translation = resolveData<PostTranslation | null>(response, null);

      if (translation) {
        setSelectedLocale("en");
        setActiveTranslation(translation);
        setFormState(buildTranslationFormState(article, translation));
        shouldAutoGenerateSlugRef.current = false;
        toast.success("Da dich bai viet sang tieng Anh thanh cong!");
      } else {
        toast.error("Khong nhan duoc ban dich tu AI");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Loi khi dich bai viet";
      toast.error(message);
      console.error("Translation error:", error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSave = async () => {
    if (!formState.title.trim() || !formState.content.trim()) {
      toast.error("Title va content la bat buoc");
      return;
    }

    setIsSaving(true);
    const isDefaultEditorLocale = selectedLocale === "vi";
    const payload = isDefaultEditorLocale
      ? buildPayload()
      : buildTranslationPayload();

    try {
      if (!isDefaultEditorLocale && isNewArticle) {
        toast.error("Hay tao bai viet goc tieng Viet truoc khi them ban dich");
        return;
      }

      if (isNewArticle) {
        const response = await apiClient.post<PostPayload>(
          "/api/v1/posts",
          payload,
        );
        const createdPost = resolveData<Post | null>(response, null);

        toast.success("Da tao bai viet moi");

        if (createdPost?.id) {
          lastSavedSnapshotRef.current = buildAutosaveSnapshot();
          setAutosaveState("saved");
          router.replace(`/admin/articles/${createdPost.id}`);
        }

        return;
      }

      if (!isDefaultEditorLocale) {
        const response = await apiClient.post<
          { data?: PostTranslation } | PostTranslation
        >(`/api/v1/posts/${articleId}/translations`, payload);
        const updatedTranslation = resolveData<PostTranslation | null>(
          response,
          null,
        );
        setActiveTranslation(updatedTranslation);
        if (article) {
          setFormState(buildTranslationFormState(article, updatedTranslation));
        }
        lastSavedSnapshotRef.current = buildAutosaveSnapshot();
        setAutosaveState("saved");
        toast.success("Da luu ban dich bai viet");
        await fetchArticle();
        return;
      }

      const response = await apiClient.put<PostPayload>(
        `/api/v1/posts/${articleId}`,
        payload,
      );
      const updatedPost = resolveData<Post | null>(response, null);

      setArticle(updatedPost);
      setFormState(buildFormState(updatedPost || undefined));
      lastSavedSnapshotRef.current = buildAutosaveSnapshot();
      setAutosaveState("saved");
      await fetchVersions();
      toast.success("Da luu thay doi bai viet");
    } catch {
      toast.error("Khong the luu bai viet luc nay");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isNewArticle) {
      router.push("/admin/articles");
      return;
    }

    if (!confirm("Ban co chac muon xoa bai viet nay khong?")) {
      return;
    }

    try {
      setIsDeleting(true);
      await apiClient.delete(`/api/v1/posts/${articleId}`);
      toast.success("Da xoa bai viet");
      router.push("/admin/articles");
    } catch {
      toast.error("Khong the xoa bai viet");
    } finally {
      setIsDeleting(false);
    }
  };

  const finishAutosave = (snapshot: string) => {
    lastSavedSnapshotRef.current = snapshot;
    setAutosaveState("saved");
  };

  const autosaveNewArticleDraft = async (
    payload: ArticleSavePayload,
    snapshot: string,
  ) => {
    const response = await apiClient.post<PostPayload>(
      "/api/v1/posts",
      payload,
    );
    const createdPost = resolveData<Post | null>(response, null);

    if (!createdPost?.id) {
      return;
    }

    finishAutosave(snapshot);
    router.replace(`/admin/articles/${createdPost.id}`);
  };

  const autosaveTranslationDraft = async (
    payload: PostTranslationPayload,
    snapshot: string,
  ) => {
    const response = await apiClient.post<
      { data?: PostTranslation } | PostTranslation
    >(`/api/v1/posts/${articleId}/translations`, payload);
    const updatedTranslation = resolveData<PostTranslation | null>(
      response,
      null,
    );

    if (!updatedTranslation) {
      return;
    }

    setActiveTranslation(updatedTranslation);
    finishAutosave(snapshot);
  };

  const autosaveExistingPostDraft = async (
    payload: ArticleSavePayload,
    snapshot: string,
  ) => {
    const response = await apiClient.put<PostPayload>(
      `/api/v1/posts/${articleId}`,
      {
        ...payload,
        createVersion: false,
      },
    );
    const updatedPost = resolveData<Post | null>(response, null);

    if (!updatedPost) {
      return;
    }

    setArticle(updatedPost);
    finishAutosave(snapshot);
    await fetchVersions();
  };

  const autosaveDraft = useCallback(async () => {
    if (isSaving || isDeleting || isAutosavingRef.current) {
      return;
    }

    if (!formState.title.trim() || !formState.content.trim()) {
      return;
    }

    const snapshot = buildAutosaveSnapshot();
    if (snapshot === lastSavedSnapshotRef.current) {
      return;
    }

    isAutosavingRef.current = true;
    setAutosaveState("saving");

    try {
      const isDefaultEditorLocale = selectedLocale === "vi";

      if (isNewArticle) {
        if (!isDefaultEditorLocale) {
          return;
        }
        const payload = buildPayload();
        await autosaveNewArticleDraft(payload, snapshot);
        return;
      }

      if (!isDefaultEditorLocale) {
        const payload = buildTranslationPayload();
        await autosaveTranslationDraft(payload, snapshot);
        return;
      }

      const payload = buildPayload();
      await autosaveExistingPostDraft(payload, snapshot);
    } catch {
      setAutosaveState("error");
    } finally {
      isAutosavingRef.current = false;
    }
  }, [
    articleId,
    buildAutosaveSnapshot,
    buildPayload,
    buildTranslationPayload,
    formState.content,
    formState.title,
    isDeleting,
    isNewArticle,
    isSaving,
    fetchVersions,
    router,
    selectedLocale,
  ]);

  useEffect(() => {
    if (!hasHydratedRef.current || loading) {
      return;
    }

    const snapshot = buildAutosaveSnapshot();
    if (snapshot === lastSavedSnapshotRef.current) {
      return;
    }

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      void autosaveDraft();
    }, 3000);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [autosaveDraft, buildAutosaveSnapshot, loading]);

  const handleSubmitForReview = async () => {
    try {
      await apiClient.post(`/api/v1/posts/${articleId}/submit-review`);
      toast.success("Da gui bai viet di review");
      await fetchArticle();
      await fetchVersions();
    } catch {
      toast.error("Khong the gui bai viet di review");
    }
  };

  const handleApprove = async () => {
    try {
      const nextApprovedStatus =
        formState.status === "SCHEDULED" && formState.scheduledAt
          ? "SCHEDULED"
          : "PUBLISHED";
      await apiClient.post(`/api/v1/posts/${articleId}/approve`, {
        status: nextApprovedStatus,
      });
      toast.success("Da duyet bai viet");
      await fetchArticle();
      await fetchVersions();
    } catch {
      toast.error("Khong the duyet bai viet");
    }
  };

  const handleReject = async () => {
    const rejectionReason = globalThis.window.prompt(
      "Nhap ly do tu choi bai viet",
    );
    if (!rejectionReason) {
      return;
    }

    try {
      await apiClient.post(`/api/v1/posts/${articleId}/reject`, {
        rejectionReason,
      });
      toast.success("Da tra bai viet ve draft");
      await fetchArticle();
      await fetchVersions();
    } catch {
      toast.error("Khong the tu choi bai viet");
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    const reason =
      globalThis.window.prompt("Nhap ghi chu rollback (khong bat buoc)") || "";

    try {
      const response = await apiClient.post<PostPayload>(
        `/api/v1/posts/${articleId}/versions/${versionId}/restore`,
        { reason: reason || null },
      );
      const restoredPost = resolveData<Post | null>(response, null);

      setArticle(restoredPost);
      setFormState(buildFormState(restoredPost || undefined));
      lastSavedSnapshotRef.current = JSON.stringify({
        title: restoredPost?.title?.trim() || "",
        slug: restoredPost?.slug?.trim() || "",
        subtitle: (
          restoredPost?.subtitle ||
          restoredPost?.excerpt ||
          ""
        ).trim(),
        content: restoredPost?.contentHtml || restoredPost?.content || "",
        contentJson: restoredPost?.contentJson || null,
        featuredImage: restoredPost?.featuredImage?.trim() || "",
        status: restoredPost?.status || "DRAFT",
        categoryId: restoredPost?.category?.id || "",
        tagIds: restoredPost?.tags?.map((tag) => tag.id) || [],
        scheduledAt: restoredPost?.scheduledAt
          ? restoredPost.scheduledAt.slice(0, 16)
          : "",
      });
      setAutosaveState("saved");
      await fetchVersions();
      toast.success("Da rollback bai viet ve phien ban da chon");
    } catch {
      toast.error("Khong the rollback phien ban nay");
    }
  };

  if (loading) {
    return (
      <div className="theme-panel rounded-2xl p-8 text-sm theme-muted">
        Dang tai du lieu bai viet...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="theme-panel rounded-2xl p-8 text-center">
        <span className="material-symbols-outlined mb-3 block text-4xl text-[#fa6238]">
          warning
        </span>
        <p className="theme-muted text-sm">{errorMessage}</p>
        <Link
          href="/admin/articles"
          className="theme-glow-button mt-4 inline-flex h-10 items-center rounded-2xl px-4 text-sm font-bold"
        >
          Quay lai danh sach
        </Link>
      </div>
    );
  }

  let autosaveStatusLabel = "Autosave sau 3 giay khi dung go";
  if (autosaveState === "saving") {
    autosaveStatusLabel = "Dang autosave...";
  } else if (autosaveState === "saved") {
    autosaveStatusLabel = "Autosave da cap nhat draft";
  } else if (autosaveState === "error") {
    autosaveStatusLabel = "Autosave that bai, hay luu tay";
  }
  const previewHref =
    selectedLocale === "vi"
      ? `/${formState.slug}`
      : `/${selectedLocale}/${formState.slug}`;
  const translationNoticeText = activeTranslation
    ? "Ban dang chinh sua ban dich tieng Anh cua bai viet nay."
    : "Chua co ban dich tieng Anh. Ban co the tao moi va luu ngay tai day.";
  let translationButtonLabel = "Dich sang EN bang AI";
  if (isTranslating) {
    translationButtonLabel = "Dang dich...";
  } else if (activeTranslation) {
    translationButtonLabel = "Dich lai bang AI";
  }
  const autoTranslateButtonLabel = isTranslating
    ? "Dang dich sang EN..."
    : "Auto-translate sang EN";
  const editorSlugPrefix =
    selectedLocale === "vi"
      ? "https://dailydevops.blog/"
      : `https://dailydevops.blog/${selectedLocale}/`;
  const isEditingEnglishTranslation = selectedLocale === "en";
  const canAutoTranslate = !isNewArticle;
  const saveButtonIcon = isSaving ? "sync" : "save";
  const saveButtonLabel = isSaving ? "Dang luu..." : "Luu bai viet";
  const translateButtonIcon = isTranslating ? "sync" : "translate";
  const categoryToggleLabel = showCategoryCreator ? "Dong" : "Tao moi";
  const tagToggleLabel = showTagCreator ? "Dong" : "Tao moi";
  const subtitleInputId = "article-subtitle";
  const publishingStatusInputId = "article-status";
  const scheduledTimeInputId = "article-scheduled-at";
  const featuredImageInputId = "article-featured-image";

  return (
    <div className="flex flex-col gap-6">
      <header className="theme-border -mx-6 -mt-6 mb-2 flex h-16 shrink-0 items-center justify-between border-b px-6 lg:-mx-8 lg:-mt-8 lg:mb-4 lg:px-10">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/articles"
            className="theme-muted flex size-8 items-center justify-center rounded-full transition-colors hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--text-main-theme)]"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div className="mx-1 h-6 w-px bg-border-dark" />
          <div>
            <h2 className="text-lg font-bold tracking-tight text-[color:var(--text-main-theme)]">
              {isNewArticle ? "Bai viet moi" : "Chinh sua bai viet"}
            </h2>
            <p className="theme-muted text-xs">
              Last saved:{" "}
              <span className="text-[color:var(--text-main-theme)]">
                {lastSavedLabel}
              </span>
            </p>
            <p className="theme-muted text-[11px]">{autosaveStatusLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {showReviewActions &&
          !canPublishDirectly &&
          formState.status === "DRAFT" ? (
            <button
              onClick={() => void handleSubmitForReview()}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-violet-500/20 bg-violet-500/10 px-4 text-sm font-bold text-violet-200 transition-colors hover:bg-violet-500/20"
            >
              <span className="material-symbols-outlined text-[18px]">
                rate_review
              </span>
              Gui review
            </button>
          ) : null}
          {showReviewActions &&
          canPublishDirectly &&
          formState.status === "REVIEW" ? (
            <>
              <button
                onClick={() => void handleReject()}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 text-sm font-bold text-red-200 transition-colors hover:bg-red-500/20"
              >
                <span className="material-symbols-outlined text-[18px]">
                  cancel
                </span>
                Tu choi
              </button>
              <button
                onClick={() => void handleApprove()}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-4 text-sm font-bold text-green-200 transition-colors hover:bg-green-500/20"
              >
                <span className="material-symbols-outlined text-[18px]">
                  task_alt
                </span>
                Duyet bai
              </button>
            </>
          ) : null}
          <div className="flex items-center gap-2">
            <span className="theme-muted text-xs font-semibold uppercase tracking-wide">
              Locale
            </span>
            <select
              value={selectedLocale}
              onChange={(event) =>
                setSelectedLocale(event.target.value as EditorLocale)
              }
              className="theme-input h-9 rounded-lg px-3 text-sm"
            >
              <option value="vi">VI</option>
              <option value="en" disabled={isNewArticle}>
                EN
              </option>
            </select>
          </div>
          {!isNewArticle && formState.slug ? (
            <Link
              href={previewHref}
              target="_blank"
              className="hidden h-9 items-center gap-2 rounded-lg border border-border-dark bg-[#283039] px-4 text-sm font-bold text-[#9dabb9] transition-colors hover:bg-[#3b4754] hover:text-white sm:inline-flex"
            >
              <span className="material-symbols-outlined text-[18px]">
                visibility
              </span>
              Preview
            </Link>
          ) : null}
          <button
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">
              {saveButtonIcon}
            </span>
            <span>{saveButtonLabel}</span>
          </button>
        </div>
      </header>

      <div className="grid max-w-[1600px] grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-8">
          <div className="flex flex-col gap-3">
            {isEditingEnglishTranslation ? (
              <div className="theme-panel-muted theme-border rounded-2xl border px-4 py-3 text-xs theme-muted flex items-center justify-between gap-3">
                <span>{translationNoticeText}</span>
                <button
                  type="button"
                  onClick={() => void handleAutoTranslate()}
                  disabled={isTranslating || isNewArticle}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
                >
                  <span
                    className={`material-symbols-outlined text-[14px] ${isTranslating ? "animate-spin" : ""}`}
                  >
                    {translateButtonIcon}
                  </span>
                  {translationButtonLabel}
                </button>
              </div>
            ) : canAutoTranslate ? (
              <div className="flex">
                <button
                  type="button"
                  onClick={() => void handleAutoTranslate()}
                  disabled={isTranslating}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-700 bg-emerald-900/30 px-3 py-2 text-xs font-bold text-emerald-400 transition-colors hover:bg-emerald-900/60 disabled:opacity-50"
                >
                  <span
                    className={`material-symbols-outlined text-[14px] ${isTranslating ? "animate-spin" : ""}`}
                  >
                    {translateButtonIcon}
                  </span>
                  {autoTranslateButtonLabel}
                </button>
              </div>
            ) : null}
            <input
              type="text"
              value={formState.title}
              onChange={(event) => handleTitleChange(event.target.value)}
              placeholder="Nhap tieu de bai viet..."
              className="w-full border-0 border-b theme-border bg-transparent px-0 py-2 text-3xl font-bold text-[color:var(--text-main-theme)] placeholder-[color:var(--text-soft-theme)] transition-colors focus:border-primary focus:ring-0"
            />
            <div className="flex items-center gap-2 text-sm">
              <span className="select-none theme-muted">
                {editorSlugPrefix}
              </span>
              <div className="group relative flex-1">
                <input
                  type="text"
                  value={formState.slug}
                  onChange={(event) => handleSlugChange(event.target.value)}
                  className="theme-input w-full rounded border px-2 py-1 text-xs font-mono theme-muted transition-all focus:text-[color:var(--text-main-theme)]"
                />
                <button
                  onClick={handleGenerateSlug}
                  className="theme-muted absolute right-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity hover:text-primary group-hover:opacity-100"
                  title="Tao lai slug tu title"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    autorenew
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="theme-panel rounded-2xl p-5">
            <label
              htmlFor={subtitleInputId}
              className="theme-muted mb-2 block text-xs font-medium uppercase"
            >
              Sub title
            </label>
            <textarea
              id={subtitleInputId}
              value={formState.subtitle}
              onChange={(event) =>
                handleFieldChange("subtitle", event.target.value)
              }
              rows={3}
              className="theme-input w-full resize-none rounded-2xl px-4 py-3 text-sm"
              placeholder="Sub title ngan, mo ta nhanh goc nhin va gia tri cua bai viet..."
            />
          </div>

          <div className="theme-panel flex flex-col gap-4 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-[color:var(--text-main-theme)]">
                  Noi dung bai viet
                </h3>
                <p className="theme-muted mt-1 text-xs">
                  Soan thao truc quan nhu Word: heading, dam, nghieng, can le,
                  mau sac, quote, list, code block va link.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleFormatContentByGemini()}
                  disabled={isFormattingContent}
                  className="theme-panel-muted theme-border inline-flex items-center gap-1 rounded-full border px-3 py-1 font-mono text-[11px] font-semibold text-primary transition-colors hover:border-primary/50 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    auto_fix_high
                  </span>
                  {isFormattingContent ? "Dang format..." : "AI Format"}
                </button>
                <span className="theme-border theme-muted rounded-full border px-2.5 py-1 font-mono text-[11px]">
                  WYSIWYG
                </span>
              </div>
            </div>

            <RichTextEditor
              value={formState.content}
              jsonValue={formState.contentJson}
              onImageUpload={uploadEditorMediaFile}
              mediaItems={mediaLibrary}
              onRefreshMediaLibrary={fetchMediaLibrary}
              onChange={({ html, json }) =>
                setFormState((previous) => ({
                  ...previous,
                  content: html,
                  contentJson: json,
                }))
              }
            />

            <div className="theme-panel-muted theme-border grid gap-3 rounded-2xl border p-4 md:grid-cols-3">
              <div>
                <p className="theme-muted text-[11px] uppercase tracking-wide">
                  Words
                </p>
                <p className="mt-1 text-base font-bold text-[color:var(--text-main-theme)]">
                  {stats.words}
                </p>
              </div>
              <div>
                <p className="theme-muted text-[11px] uppercase tracking-wide">
                  Characters
                </p>
                <p className="mt-1 text-base font-bold text-[color:var(--text-main-theme)]">
                  {stats.characters}
                </p>
              </div>
              <div>
                <p className="theme-muted text-[11px] uppercase tracking-wide">
                  Reading time
                </p>
                <p className="mt-1 text-base font-bold text-[color:var(--text-main-theme)]">
                  {stats.readingTime} min
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-4">
          <div className="theme-panel rounded-2xl p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-bold text-[color:var(--text-main-theme)]">
              Document Outline
            </h3>
            <div className="theme-panel-muted theme-border rounded-2xl border p-4">
              {documentOutline.length ? (
                <div className="space-y-1.5">
                  {documentOutline.map((item, index) => (
                    <div
                      key={`${item.text}-${index}`}
                      className={`rounded-lg border-l-2 px-3 py-2 text-sm ${
                        item.level === 3
                          ? "ml-4 border-transparent theme-muted"
                          : "border-primary/50 bg-primary/5 font-semibold text-[color:var(--text-main-theme)]"
                      }`}
                    >
                      {item.text}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="theme-muted text-sm">
                  Them cac heading H2/H3 trong editor de tao muc luc cho bai
                  viet.
                </p>
              )}
            </div>
          </div>

          <div className="theme-panel rounded-2xl p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[color:var(--text-main-theme)]">
                Version History
              </h3>
              <span className="theme-muted text-[11px] uppercase tracking-wide">
                {versions.length} versions
              </span>
            </div>
            <div className="space-y-3">
              {versions.length === 0 ? (
                <div className="theme-panel-muted theme-border rounded-2xl border p-4 text-sm theme-muted">
                  Chua co version history cho bai viet nay.
                </div>
              ) : (
                versions.map((version) => (
                  <div
                    key={version.id}
                    className="theme-panel-muted theme-border rounded-2xl border p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[color:var(--text-main-theme)]">
                          {version.title}
                        </p>
                        <p className="theme-muted mt-1 text-xs">
                          {formatRelativeTime(version.createdAt)}
                          {version.createdBy
                            ? ` by ${version.createdBy.firstName} ${version.createdBy.lastName}`
                            : ""}
                        </p>
                        <p className="theme-muted mt-2 text-[11px] uppercase tracking-wide">
                          {version.status}
                        </p>
                        {version.reason ? (
                          <p className="theme-muted mt-2 text-xs">
                            {version.reason}
                          </p>
                        ) : null}
                      </div>
                      <button
                        onClick={() => void handleRestoreVersion(version.id)}
                        className="theme-panel-muted theme-border inline-flex h-8 items-center gap-1 rounded-2xl border px-3 text-xs font-bold text-[color:var(--text-main-theme)] transition-colors hover:border-primary hover:text-primary"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          history
                        </span>
                        Restore
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="theme-panel rounded-2xl p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-bold text-[color:var(--text-main-theme)]">
              Publishing
            </h3>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor={publishingStatusInputId}
                  className="theme-muted mb-1.5 block text-xs font-medium"
                >
                  Status
                </label>
                <select
                  id={publishingStatusInputId}
                  value={formState.status}
                  onChange={(event) =>
                    handleFieldChange(
                      "status",
                      event.target.value as PostStatus,
                    )
                  }
                  className="theme-input w-full cursor-pointer rounded-2xl px-3 py-2 text-sm"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="REVIEW">In Review</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              {formState.status === "SCHEDULED" ? (
                <div>
                  <label
                    htmlFor={scheduledTimeInputId}
                    className="theme-muted mb-1.5 block text-xs font-medium"
                  >
                    Scheduled time
                  </label>
                  <input
                    id={scheduledTimeInputId}
                    type="datetime-local"
                    value={formState.scheduledAt}
                    onChange={(event) =>
                      handleFieldChange("scheduledAt", event.target.value)
                    }
                    className="theme-input w-full rounded-2xl px-3 py-2 text-sm"
                  />
                </div>
              ) : null}

              <div className="theme-panel-muted theme-border rounded-2xl border px-4 py-3 text-xs theme-muted">
                {article?.status === "REVIEW" ? (
                  <span>Bai viet dang cho duyet boi editor/admin.</span>
                ) : article?.publishedAt ? (
                  <span>Published at {formatDate(article.publishedAt)}</span>
                ) : (
                  <span>Chua duoc publish.</span>
                )}
              </div>
              {article?.rejectionReason ? (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-200">
                  Ly do tu choi: {article.rejectionReason}
                </div>
              ) : null}
            </div>

            <div className="theme-border mt-6 flex items-center justify-between border-t pt-4">
              <button
                onClick={() => void handleDelete()}
                disabled={isDeleting}
                className="text-sm font-medium text-red-400 transition-colors hover:text-red-300 disabled:opacity-50"
              >
                {isDeleting ? "Dang xoa..." : "Move to Trash"}
              </button>
              {!isNewArticle ? (
                <span className="theme-muted text-xs italic">
                  {article?.createdAt
                    ? `Created ${formatDate(article.createdAt)}`
                    : ""}
                </span>
              ) : null}
            </div>
          </div>

          <div className="theme-panel rounded-2xl p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-bold text-[color:var(--text-main-theme)]">
              Author
            </h3>
            <div className="theme-panel-muted theme-border rounded-2xl border p-3">
              {article?.author ? (
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-primary/15">
                    {article.author.avatar ? (
                      <img
                        src={getImageUrl(article.author.avatar)}
                        alt={`${article.author.firstName} ${article.author.lastName}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-primary">
                        person
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[color:var(--text-main-theme)]">
                      {article.author.firstName} {article.author.lastName}
                    </span>
                    <span className="theme-muted text-[10px]">
                      Tac gia hien tai
                    </span>
                  </div>
                </div>
              ) : (
                <p className="theme-muted text-sm">
                  Bai viet moi se gan tac gia theo tai khoan dang dang nhap.
                </p>
              )}
            </div>
          </div>

          <div className="theme-panel rounded-2xl p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-bold text-[color:var(--text-main-theme)]">
              Taxonomy
            </h3>
            <div className="mb-5">
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="theme-muted block text-xs font-medium">
                  Category
                </span>
                {canManageTaxonomy ? (
                  <button
                    type="button"
                    onClick={() =>
                      setShowCategoryCreator((previous) => !previous)
                    }
                    className="text-[11px] font-semibold text-primary hover:text-blue-400"
                  >
                    {categoryToggleLabel}
                  </button>
                ) : null}
              </div>
              <div className="theme-panel-muted theme-border custom-scrollbar max-h-56 space-y-2 overflow-y-auto rounded-2xl border p-3">
                <label
                  htmlFor="article-category-none"
                  className="flex cursor-pointer items-center gap-2"
                >
                  <input
                    id="article-category-none"
                    type="radio"
                    name="categoryId"
                    value=""
                    checked={formState.categoryId === ""}
                    onChange={() => handleFieldChange("categoryId", "")}
                    className="rounded-full border-border-dark bg-[#283039] text-primary focus:ring-0 focus:ring-offset-0"
                  />
                  <span className="text-sm text-[color:var(--text-main-theme)]">
                    Khong chon category
                  </span>
                </label>
                {categories.map((category) => (
                  <label
                    key={category.id}
                    htmlFor={`article-category-${category.id}`}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <input
                      id={`article-category-${category.id}`}
                      type="radio"
                      name="categoryId"
                      value={category.id}
                      checked={formState.categoryId === category.id}
                      onChange={() =>
                        handleFieldChange("categoryId", category.id)
                      }
                      className="rounded-full border-border-dark bg-[#283039] text-primary focus:ring-0 focus:ring-offset-0"
                    />
                    <div className="flex items-center gap-2">
                      {category.color && (
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        ></span>
                      )}
                      <span className="text-sm text-[color:var(--text-main-theme)]">
                        {category.name}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
              {showCategoryCreator ? (
                <div className="theme-panel-muted theme-border mt-3 space-y-3 rounded-2xl border p-3">
                  <input
                    value={categoryDraft.name}
                    onChange={(event) =>
                      setCategoryDraft((previous) => ({
                        ...previous,
                        name: event.target.value,
                      }))
                    }
                    className="theme-input w-full rounded-2xl px-3 py-2 text-sm"
                    placeholder="Ten category"
                  />
                  <input
                    value={categoryDraft.slug}
                    onChange={(event) =>
                      setCategoryDraft((previous) => ({
                        ...previous,
                        slug: event.target.value,
                      }))
                    }
                    className="theme-input w-full rounded-2xl px-3 py-2 text-sm"
                    placeholder="Slug tuy chon"
                  />
                  <textarea
                    value={categoryDraft.description}
                    onChange={(event) =>
                      setCategoryDraft((previous) => ({
                        ...previous,
                        description: event.target.value,
                      }))
                    }
                    rows={3}
                    className="theme-input w-full resize-none rounded-2xl px-3 py-2 text-sm"
                    placeholder="Mo ta ngan"
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={categoryDraft.color || "#000000"}
                        onChange={(event) =>
                          setCategoryDraft((previous) => ({
                            ...previous,
                            color: event.target.value,
                          }))
                        }
                        className="h-10 w-10 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
                        title="Chon mau"
                      />
                      <input
                        value={categoryDraft.color}
                        onChange={(event) =>
                          setCategoryDraft((previous) => ({
                            ...previous,
                            color: event.target.value,
                          }))
                        }
                        className="theme-input w-full rounded-2xl px-3 py-2 text-sm"
                        placeholder="#0ea5e9"
                      />
                    </div>
                    <input
                      value={categoryDraft.icon}
                      onChange={(event) =>
                        setCategoryDraft((previous) => ({
                          ...previous,
                          icon: event.target.value,
                        }))
                      }
                      className="theme-input w-full rounded-2xl px-3 py-2 text-sm"
                      placeholder="Icon"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => void handleCreateCategory()}
                      disabled={isCreatingCategory}
                      className="theme-glow-button inline-flex h-9 items-center rounded-2xl px-4 text-xs font-bold disabled:opacity-50"
                    >
                      {isCreatingCategory ? "Dang tao..." : "Luu category"}
                    </button>
                    <button
                      type="button"
                      onClick={resetCategoryDraft}
                      className="theme-muted text-xs hover:text-[color:var(--text-main-theme)]"
                    >
                      Huy
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="theme-muted text-xs font-medium">Tags</span>
                <div className="flex items-center gap-3">
                  <span className="theme-muted text-[10px] uppercase tracking-wide">
                    {formState.tagIds.length} selected
                  </span>
                  {canManageTaxonomy ? (
                    <button
                      type="button"
                      onClick={() => setShowTagCreator((previous) => !previous)}
                      className="text-[11px] font-semibold text-primary hover:text-blue-400"
                    >
                      {tagToggleLabel}
                    </button>
                  ) : null}
                </div>
              </div>
              {showTagCreator ? (
                <div className="theme-panel-muted theme-border mb-3 space-y-3 rounded-2xl border p-3">
                  <input
                    value={tagDraft.name}
                    onChange={(event) =>
                      setTagDraft((previous) => ({
                        ...previous,
                        name: event.target.value,
                      }))
                    }
                    className="theme-input w-full rounded-2xl px-3 py-2 text-sm"
                    placeholder="Ten tag"
                  />
                  <input
                    value={tagDraft.slug}
                    onChange={(event) =>
                      setTagDraft((previous) => ({
                        ...previous,
                        slug: event.target.value,
                      }))
                    }
                    className="theme-input w-full rounded-2xl px-3 py-2 text-sm"
                    placeholder="Slug tuy chon"
                  />
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => void handleCreateTag()}
                      disabled={isCreatingTag}
                      className="theme-glow-button inline-flex h-9 items-center rounded-2xl px-4 text-xs font-bold disabled:opacity-50"
                    >
                      {isCreatingTag ? "Dang tao..." : "Luu tag"}
                    </button>
                    <button
                      type="button"
                      onClick={resetTagDraft}
                      className="theme-muted text-xs hover:text-[color:var(--text-main-theme)]"
                    >
                      Huy
                    </button>
                  </div>
                </div>
              ) : null}
              <div className="theme-panel-muted theme-border custom-scrollbar max-h-56 space-y-2 overflow-y-auto rounded-2xl border p-3">
                {tags.length === 0 ? (
                  <p className="theme-muted text-sm">
                    Chua co tag nao de gan cho bai viet.
                  </p>
                ) : (
                  tags.map((tag) => (
                    <label
                      key={tag.id}
                      htmlFor={`article-tag-${tag.id}`}
                      className="flex cursor-pointer items-center gap-2"
                    >
                      <input
                        id={`article-tag-${tag.id}`}
                        type="checkbox"
                        checked={formState.tagIds.includes(tag.id)}
                        onChange={() => handleTagToggle(tag.id)}
                        className="rounded border-border-dark bg-[#283039] text-primary focus:ring-0 focus:ring-offset-0"
                      />
                      <span className="text-sm text-[color:var(--text-main-theme)]">
                        {tag.name}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="theme-panel rounded-2xl p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-bold text-[color:var(--text-main-theme)]">
              Featured Image
            </h3>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <label className="theme-panel-muted theme-border inline-flex cursor-pointer items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold text-[color:var(--text-main-theme)] transition-colors hover:border-primary hover:text-primary">
                <span className="material-symbols-outlined text-[18px]">
                  upload
                </span>
                {isUploadingImage ? "Dang upload..." : "Upload image"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(event) => void handleFeaturedImageUpload(event)}
                  disabled={isUploadingImage || isGeneratingImage}
                />
              </label>
              <button
                type="button"
                onClick={() => void handleGenerateFeaturedImage()}
                disabled={
                  isGeneratingImage || isUploadingImage || isThumbnailJobRunning
                }
                className="theme-panel-muted theme-border inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold text-[color:var(--text-main-theme)] transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-[18px]">
                  auto_awesome
                </span>
                {thumbnailButtonLabel}
              </button>
            </div>
            {thumbnailJob ? (
              <div className="theme-panel-muted theme-border mb-3 rounded-2xl border p-3 text-xs">
                <p className="font-semibold text-[color:var(--text-main-theme)]">
                  Thumbnail job: {thumbnailJob.status}
                </p>
                <p className="theme-muted mt-1">{thumbnailJobMessage}</p>
              </div>
            ) : null}
            <input
              id={featuredImageInputId}
              type="url"
              value={formState.featuredImage}
              onChange={(event) =>
                handleFieldChange("featuredImage", event.target.value)
              }
              placeholder="/api/v1/media/object/..."
              className="theme-input w-full rounded-2xl px-3 py-2 text-sm"
            />
            <div className="theme-panel-muted relative mt-4 aspect-video overflow-hidden rounded-2xl border border-dashed theme-border">
              {formState.featuredImage ? (
                <img
                  src={getImageUrl(formState.featuredImage)}
                  alt="Featured preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="theme-muted flex h-full items-center justify-center text-sm">
                  Chua co anh dai dien
                </div>
              )}
            </div>
            <div className="theme-panel-muted theme-border mt-4 rounded-2xl border p-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="theme-muted text-xs font-semibold uppercase tracking-wide">
                  Media library
                </p>
                <div className="flex items-center gap-3">
                  <Link
                    href="/admin/media"
                    className="text-[11px] font-semibold text-primary hover:text-blue-400"
                  >
                    Open library
                  </Link>
                  <button
                    type="button"
                    onClick={() => void fetchMediaLibrary()}
                    className="text-[11px] font-semibold text-primary hover:text-blue-400"
                  >
                    Refresh
                  </button>
                </div>
              </div>
              <div className="mb-3 flex flex-wrap gap-2">
                {[
                  { value: "featured-images", label: "Featured" },
                  { value: "post-media", label: "Post Media" },
                  { value: "avatars", label: "Avatar" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setActiveMediaFolder(
                        option.value as
                          | "featured-images"
                          | "post-media"
                          | "avatars",
                      )
                    }
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                      activeMediaFolder === option.value
                        ? "bg-primary text-white"
                        : "theme-panel border theme-border text-[color:var(--text-muted-theme)] hover:border-primary hover:text-primary"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {featuredMediaLibraryContent}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #111418;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3b4754;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
