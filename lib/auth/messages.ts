export function extractApiMessage(error: unknown, fallback: string) {
    if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof error.response === 'object' &&
        error.response !== null &&
        'data' in error.response &&
        typeof error.response.data === 'object' &&
        error.response.data !== null
    ) {
        const payload = error.response.data as {
            error?: string | string[];
            message?: string | string[];
        };
        const candidate = payload.error ?? payload.message;

        if (Array.isArray(candidate)) {
            return candidate[0] || fallback;
        }

        if (typeof candidate === 'string' && candidate.trim()) {
            return candidate;
        }
    }

    return fallback;
}

export function normalizeAuthMessage(message: string) {
    const normalized = message.trim().toLowerCase();

    if (normalized.includes('invalid credentials')) {
        return 'Email or password is incorrect.';
    }

    if (normalized.includes('verify your email')) {
        return 'Please verify your email before signing in.';
    }

    if (normalized.includes('authentication code')) {
        return 'The authentication code is invalid or expired.';
    }

    if (normalized.includes('missing verification token')) {
        return 'This verification link is missing required information.';
    }

    if (normalized.includes('missing reset token')) {
        return 'This password reset link is incomplete.';
    }

    if (normalized.includes('passwords do not match')) {
        return 'The password confirmation does not match.';
    }

    if (normalized.includes('user already exists')) {
        return 'An account with this email already exists.';
    }

    if (normalized.includes('unable to verify')) {
        return 'This verification link is invalid or has expired.';
    }

    if (normalized.includes('unable to reset')) {
        return 'We could not reset your password right now. Please request a new reset link.';
    }

    return message;
}
