import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  LOCALE_COOKIE_NAME,
} from "@/lib/i18n/config";

/**
 * POST /api/set-locale
 *
 * Receives a locale preference from the client and sets it as a secure
 * server-side cookie. This is the single source of truth for locale
 * persistence — the middleware reads this cookie on every subsequent request.
 *
 * Using an API route (rather than document.cookie) ensures:
 * - The cookie is set with consistent security attributes
 * - Validation happens server-side (can't inject arbitrary locale values)
 * - Works correctly in SSR/edge environments
 */
export async function POST(req: NextRequest) {
  let locale = DEFAULT_LOCALE;

  try {
    const body = await req.json();
    if (isSupportedLocale(body?.locale)) {
      locale = body.locale;
    } else {
      return NextResponse.json(
        { ok: false, error: "Unsupported locale" },
        { status: 400 },
      );
    }
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body" },
      { status: 400 },
    );
  }

  const response = NextResponse.json({ ok: true, locale });

  response.cookies.set(LOCALE_COOKIE_NAME, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
    // httpOnly: false — middleware (Edge) cần đọc cookie này để resolve locale.
    // Cookie này không chứa dữ liệu nhạy cảm, chỉ là "vi" hoặc "en".
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
