export type Role = 'ADMIN' | 'MODERATOR' | 'EDITOR' | 'AUTHOR' | 'VIEWER';

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    bio?: string;
    role: Role;
    isActive: boolean;
    mfaEnabled: boolean;
    emailVerifiedAt?: string;
    lastLoginAt?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface UserWithStats extends User {
    _count: {
        posts: number;
        comments: number;
    };
}

export type PostStatus = 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED';

export interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    color?: string;
    icon?: string;
    _count?: {
        posts: number;
    };
}

export interface Tag {
    id: string;
    name: string;
    slug: string;
    _count?: {
        posts: number;
    };
}

export interface Post {
    id: string;
    title: string;
    slug: string;
    subtitle?: string;
    excerpt?: string;
    content: string;
    contentHtml?: string;
    contentJson?: unknown;
    featuredImage?: string;
    status: PostStatus;
    viewCount: number;
    readingTime?: number;
    rejectionReason?: string;
    reviewedAt?: string;
    publishedAt?: string;
    scheduledAt?: string;
    createdAt: string;
    updatedAt: string;
    author: {
        id: string;
        firstName: string;
        lastName: string;
        avatar?: string;
        bio?: string;
    };
    category?: Category;
    tags: Tag[];
    _count?: {
        comments: number;
    };
}

export interface PostVersion {
    id: string;
    title: string;
    slug: string;
    status: PostStatus;
    reason?: string;
    createdAt: string;
    createdBy?: {
        id: string;
        firstName: string;
        lastName: string;
    };
}

export type CommentStatus = 'PENDING' | 'APPROVED' | 'SPAM' | 'TRASH';

export interface Comment {
    id: string;
    content: string;
    authorName?: string;
    authorEmail?: string;
    authorIp?: string;
    status: CommentStatus;
    parentId?: string;
    createdAt: string;
    updatedAt: string;
    user?: {
        id: string;
        firstName: string;
        lastName: string;
        avatar?: string;
    };
    post?: {
        id: string;
        title: string;
        slug: string;
    };
    replies?: Comment[];
}

export interface SeoSetting {
    id: string;
    metaTitle?: string;
    metaDescription?: string;
    focusKeywords: string[];
    canonicalUrl?: string;
    ogImage?: string;
    noIndex: boolean;
    noFollow: boolean;
}

export interface PostWithComments extends Post {
    comments: Comment[];
    seoSetting?: SeoSetting;
}

export interface DashboardStats {
    posts: {
        total: number;
        totalViews: number;
        byStatus: Record<PostStatus, number>;
        recentPosts: Post[];
    };
    comments: {
        total: number;
        byStatus: Record<CommentStatus, number>;
    };
    users: {
        total: number;
        active: number;
        byRole: Record<Role, number>;
    };
}
