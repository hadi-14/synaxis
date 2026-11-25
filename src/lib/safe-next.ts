/**
 * Returns a same-origin path for post-login redirects, or the fallback.
 * Resolves against a dummy origin so tricks like "//evil.com", "/\evil.com" or
 * encoded control characters can never leave the site.
 */
export function safeNext(raw: string | null | undefined, fallback = "/register"): string {
  if (!raw || !raw.startsWith("/") || /[\\\u0000-\u001f]/.test(raw)) return fallback;
  try {
    const base = "https://synaxis.invalid";
    const u = new URL(raw, base);
    if (u.origin !== base) return fallback;
    // Re-check AFTER normalisation: dot-segments like "/.//evil.com" collapse to "//evil.com".
    const out = u.pathname + u.search + u.hash;
    if (!out.startsWith("/") || out.startsWith("//") || out.startsWith("/\\")) return fallback;
    return out;
  } catch {
    return fallback;
  }
}
