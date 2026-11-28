/**
 * Venue map: turn whatever was pasted in admin settings (an embed URL or a whole <iframe> snippet, a
 * google.com/maps place/search URL, coordinates or a plain address) into an iframe-safe embed URL and a
 * link that opens Google Maps. Share links (maps.app.goo.gl, share.google) can't be embedded or parsed: saveSettings
 * expands them once (expandMapShortLink); until then the venue name + address are used.
 * Pure (no server-only code): also used by the live preview in admin.
 */
export type VenueMap = { embed: string; open: string };

const SHORT = /^https?:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps|share\.google)\//i;
const isShortLink = (v: string) => SHORT.test(v);

/** Coordinates or a search query from a Google Maps URL (place, search, ?q=…), or null. */
function queryFromMapsUrl(u: URL): string | null {
  const path = decodeURIComponent(u.pathname);
  // exact pin of a place: …!3d<lat>!4d<lng>
  const pin = /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/.exec(path);
  const place = /\/maps\/place\/([^/]+)/.exec(path)?.[1]?.replace(/\+/g, " ");
  if (pin) return place ? `${pin[1]},${pin[2]} (${place})` : `${pin[1]},${pin[2]}`; // exact pin, labelled
  const q = u.searchParams.get("q") ?? u.searchParams.get("query") ?? u.searchParams.get("daddr");
  if (q) return q;
  if (place) return place;
  const at = /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/.exec(path);
  if (at) return `${at[1]},${at[2]}`;
  const search = /\/maps\/search\/([^/]+)/.exec(path)?.[1]?.replace(/\+/g, " ");
  return search || null;
}

const isGoogleMaps = (u: URL) => /(^|\.)google\.[a-z.]+$/i.test(u.hostname) && (u.pathname.startsWith("/maps") || u.hostname.startsWith("maps."));

/** Build the embed + open links, or null when there is nothing to show (empty setting). */
export function venueMap(setting: string, fallbackQuery = ""): VenueMap | null {
  let v = (setting ?? "").trim();
  if (!v) return null;
  const search = (q: string) => ({
    embed: `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`,
    open: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`,
  });
  // a whole <iframe …> snippet pasted from Google's "Embed a map": take its src
  const src = /<iframe[^>]*\ssrc=["']([^"']+)["']/i.exec(v)?.[1];
  if (src) v = src.replace(/&amp;/g, "&");
  if (isShortLink(v)) return fallbackQuery ? { ...search(fallbackQuery), open: v } : null;
  let u: URL | null = null;
  try {
    u = /^https?:\/\//i.test(v) ? new URL(v) : null;
  } catch {}
  if (!u) return search(v); // a plain address or "lat, lng"
  if (!isGoogleMaps(u)) return fallbackQuery ? { ...search(fallbackQuery), open: v } : null;
  if (u.pathname.startsWith("/maps/embed")) {
    const q = u.searchParams.get("q");
    return { embed: u.toString(), open: q ? search(q).open : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fallbackQuery || "Heuser College Karachi")}` };
  }
  const q = queryFromMapsUrl(u) ?? fallbackQuery;
  if (!q) return null;
  return { embed: search(q).embed, open: v };
}

/** True when the value is a share link that saveSettings should expand. */
export const needsExpanding = isShortLink;

/**
 * Follow a share link (maps.app.goo.gl → a google.com/maps place URL; share.google → a Google Search page
 * for the place) to a full Google Maps URL, tracking query dropped. Anything unexpected keeps the original.
 */
export async function expandMapShortLink(v: string): Promise<string> {
  if (!isShortLink(v)) return v;
  try {
    let next = v;
    for (let hop = 0; hop < 5; hop++) {
      const r = await fetch(next, { redirect: "manual", signal: AbortSignal.timeout(5000) });
      const loc = r.headers.get("location");
      if (!loc) return v;
      const u = new URL(loc, next);
      if (isGoogleMaps(u)) {
        u.search = "";
        return u.toString();
      }
      const q = /(^|\.)google\.[a-z.]+$/i.test(u.hostname) && u.pathname === "/search" ? u.searchParams.get("q") : null;
      if (q) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
      next = u.toString();
    }
    return v;
  } catch {
    return v; // offline / blocked: keep the share link; the site falls back to the venue address
  }
}
