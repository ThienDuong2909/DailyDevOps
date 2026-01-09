// ============================================
// User Types
// ============================================

export type Role = 'ADMIN' | 'MODERATOR' | 'EDITOR' | 'VIEWER';

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    bio?: string;
    role: Role;
    isActive: boolean;
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

// ============================================
// Post Types
// ============================================

export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED';

export interface Post {
    id: string;
    title: string;
    slug: string;
    excerpt?: string;
    content: string;
    featuredImage?: string;
    status: PostStatus;
    viewCount: number;
    readingTime?: number;
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

export interface PostWithComments extends Post {
    comments: Comment[];
    seoSetting?: SeoSetting;
}

// ============================================
// Category & Tag Types
// ============================================

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

// ============================================
// Comment Types
// ============================================

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

// ============================================
// SEO Types
// ============================================

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

// ============================================
// API Response Types
// ============================================

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface AuthResponse {
    message: string;
    accessToken: string;
    accessTokenExpires: number;
}

export interface ApiError {
    statusCode: number;
    message: string | string[];
    error?: string;
}

// ============================================
// Form Types
// ============================================

export interface LoginForm {
    email: string;
    password: string;
}

export interface RegisterForm {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}

export interface CreatePostForm {
    title: string;
    slug?: string;
    excerpt?: string;
    content: string;
    featuredImage?: string;
    status?: PostStatus;
    categoryId?: string;
    tagIds?: string[];
}

export interface UpdatePostForm extends Partial<CreatePostForm> { }

// ============================================
// Dashboard Stats
// ============================================

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
