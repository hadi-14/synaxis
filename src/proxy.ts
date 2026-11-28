import { createServerClient } from "@supabase/ssr";
import { NextResponse, userAgent, type NextRequest } from "next/server";

/**
 * Crawlers, audit tools and link previewers: they get the home page without the intro (no overlay, no cover,
 * no intro JS). Search: Google (all crawlers), Bing, DuckDuckGo, Yandex, Baidu, Apple. Audits: Lighthouse /
 * PageSpeed Insights, GTmetrix, WebPageTest (PTST). Previews: Facebook, X/Twitter, WhatsApp, LinkedIn, Slack,
 * Discord, Telegram, Pinterest. Plus anything Next.js itself recognises as a bot.
 */
const BOT_UA =
  /googlebot|google-inspectiontool|googleother|adsbot-google|mediapartners-google|storebot-google|apis-google|feedfetcher-google|google-read-aloud|bingbot|bingpreview|duckduckbot|duckassistbot|yandex|baiduspider|applebot|chrome-lighthouse|lighthouse|google page speed|pagespeed|gtmetrix|webpagetest|\bptst\b|facebookexternalhit|facebot|meta-externalagent|twitterbot|whatsapp|linkedinbot|slackbot|discordbot|telegrambot|pinterest/i;
const INTRO_OFF_COOKIE = "synaxis-intro";

/** "/": real visitors get the page with the intro; bots are rewritten to /home-static. No auth work here. */
function home(request: NextRequest) {
  const ua = request.headers.get("user-agent") ?? "";
  const bot = BOT_UA.test(ua) || userAgent(request).isBot;
  const response = bot ? NextResponse.rewrite(new URL("/home-static", request.url)) : NextResponse.next();
  // the shared root layout's pre-paint snippet reads this and stays inert (no cover) for this response
  if (bot) response.cookies.set(INTRO_OFF_COOKIE, "off", { path: "/", maxAge: 600, sameSite: "lax" });
  // The two variants must never be served to each other from a shared cache. On Vercel the proxy runs before the
  // CDN cache and the rewrite keys bots to another path anyway; Next.js replaces Vary on prerendered hits.
  response.headers.set("Vary", "User-Agent");
  return response;
}

/** Refreshes the Supabase session cookie on every matched request. Authorization happens in pages/actions. */
export async function proxy(request: NextRequest) {
  const path0 = request.nextUrl.pathname;
  if (path0 === "/") return home(request);
  // the bot variant is only reachable through the rewrite above
  if (path0 === "/home-static") return NextResponse.redirect(new URL("/", request.url), 308);
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(toSet, headers) {
        for (const { name, value } of toSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
        for (const [k, v] of Object.entries(headers ?? {})) response.headers.set(k, String(v));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const path = request.nextUrl.pathname;
  // /register is public (its landing is indexable); the form itself requires sign-in inside the page.
  const needsAuth = path.startsWith("/dashboard") || path.startsWith("/admin");
  if (needsAuth && !data?.claims) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
    return NextResponse.redirect(login);
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: ["/", "/home-static", "/register/:path*", "/dashboard/:path*", "/admin/:path*", "/login", "/auth/:path*"],
};
