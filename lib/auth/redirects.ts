export function resolvePostLoginRoute(role?: string | null) {
    if (!role) {
        return '/';
    }

    if (['ADMIN', 'MODERATOR', 'EDITOR'].includes(role)) {
        return '/admin';
    }

    return '/account';
}
