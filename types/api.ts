import type { CommentStatus, Post, PostStatus, Role } from './entities';

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
    message?: string;
    accessToken?: string;
    accessTokenExpires?: number;
    mfaRequired?: boolean;
    challengeToken?: string;
    challengeExpiresAt?: number;
}

export interface ApiError {
    statusCode: number;
    message: string | string[];
    error?: string;
}

export interface CreatePostForm {
    title: string;
    slug?: string;
    subtitle?: string;
    excerpt?: string;
    content: string;
    contentHtml?: string;
    contentJson?: unknown;
    featuredImage?: string;
    status?: PostStatus;
    categoryId?: string;
    tagIds?: string[];
}

export interface UpdatePostForm extends Partial<CreatePostForm> {}

export interface LoginForm {
    email: string;
    password: string;
}

export interface VerifyMfaLoginForm {
    challengeToken: string;
    token: string;
}

export interface RegisterForm {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}
