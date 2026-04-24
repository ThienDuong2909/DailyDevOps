/**
 * Barrel re-export for the API client.
 *
 * Canonical import path for consumers: `import { apiClient } from '@/lib/api'`
 *
 * L3: Removed the duplicate default export — use `apiClient` everywhere.
 * L5: This barrel remains as a convenience import path.
 */
export { apiClient, AI_TIMEOUT } from "./api/client";
export { getAccessToken, setAccessToken } from "./api/client";
