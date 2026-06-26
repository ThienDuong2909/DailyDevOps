import { headers } from "next/headers";
import { normalizeLocale } from "./config";

export async function getRequestLocale() {
  const requestHeaders = await headers();
  return normalizeLocale(requestHeaders.get("x-locale"));
}
