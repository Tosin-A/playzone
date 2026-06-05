/**
 * Single source of truth for share URLs.
 *
 * Order of precedence:
 *   1. NEXT_PUBLIC_SITE_URL  (set this in Vercel for canonical domain)
 *   2. window.location.origin (runtime fallback, follows current host)
 *   3. Hardcoded fallback (build-time / SSR safety)
 */

const FALLBACK = "https://playzone.live";

export function getSiteOrigin(): string {
  const envOrigin = process.env.NEXT_PUBLIC_SITE_URL;
  if (envOrigin) return envOrigin.replace(/\/$/, "");
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return FALLBACK;
}

/**
 * Build a shareable URL for a game.
 * `ref` adds a UTM-ish tag so we can see what surfaces convert
 * (e.g. ref="share" for native share, ref="copy" for URL copy).
 */
export function getGameShareUrl(slug: string, ref?: string): string {
  const url = `${getSiteOrigin()}/play/${slug}`;
  return ref ? `${url}?ref=${encodeURIComponent(ref)}` : url;
}
