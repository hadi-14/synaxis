import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans, Unbounded } from "next/font/google";
import { Toaster } from "@/components/ui/Toaster";
import { DeferredEffects } from "@/components/effects/DeferredEffects";
import { Analytics } from "@/components/analytics/Analytics";
import "./globals.css";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, SITE_NAME, SITE_URL } from "@/lib/seo";

// Display: wide, heavy, geometric with soft outer radii — closest match to the logo lettering.
const unbounded = Unbounded({ variable: "--font-unbounded", subsets: ["latin"], display: "swap" });
// Body: highly legible on phones, gently rounded terminals.
const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], display: "swap" });
// Mono/HUD: counters, registration IDs, Battle Mode labels.
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], display: "swap", preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: DEFAULT_TITLE, template: "%s · Synaxis 2027" },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  // Stable, un-hashed URLs in /public (built by scripts/make-icons.mjs). Google needs a square icon
  // in a multiple of 48 px that robots.txt allows; the .ico covers old browsers and /favicon.ico probes.
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/icon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: SITE_NAME, locale: "en_PK", url: "/", title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION },
  twitter: { card: "summary_large_image", title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION },
  ...(process.env.GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } } : {}),
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#DC2A35" },
    { media: "(prefers-color-scheme: dark)", color: "#08090F" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/**
 * Runs before first paint and decides the intro on "/" (html[data-intro], which also shows the opaque cover):
 * - ?intro=full|off: testing override; works for any visitor (also automation).
 * - crawlers / Lighthouse / headless / automation: none.
 * - everyone else: the full intro on every full page load of "/" (first visit, return visit, reload).
 *   Reduced motion gets the static version (IntroOverlay). Nothing is stored between visits.
 * When it plays:
 * - scroll restoration is turned off and the page is scrolled to the top (again on load, since a reload can
 *   still restore it; IntroOverlay also does it before the page is revealed), so the visitor lands on the hero;
 * - view transitions are skipped as soon as they start: React's <ViewTransition> (site layout) starts one when
 *   the streamed page arrives, and its snapshots paint in the top layer, above the cover and the intro, which
 *   flashed the page. React handles a skipped transition (its DOM update still runs).
 * Client-side navigation to "/" never runs this, so it never plays an intro.
 * If the intro code has not started within 8 s (very slow network), the cover is dropped.
 */
const introScript = `(function(){try{
if(location.pathname!=="/")return;
var h=document.documentElement,q=new URLSearchParams(location.search).get("intro");
if(q==="off")return;
if(q!=="full"&&(/bot|crawl|spider|slurp|lighthouse|headless|preview|facebookexternalhit|whatsapp|telegram|discord|embedly|bing|google/i.test(navigator.userAgent)||navigator.webdriver))return;
h.dataset.intro="full";
if("scrollRestoration" in history)history.scrollRestoration="manual";
var top=function(){if(h.dataset.intro)scrollTo({top:0,left:0,behavior:"instant"})};top();addEventListener("load",top);
var svt=document.startViewTransition;
if(svt)document.startViewTransition=function(){var t=svt.apply(document,arguments);if(h.dataset.intro){try{t.skipTransition()}catch(e){}}return t};
setTimeout(function(){if(!h.dataset.introLive){delete h.dataset.intro;if("scrollRestoration" in history)history.scrollRestoration="auto"}},8000);
}catch(e){}})()`;

/** Runs before first paint: stored choice, else system preference. */
const themeScript = `(function(){try{var t=localStorage.getItem("synaxis-theme");if(t!=="medical"&&t!=="battle"){t=matchMedia("(prefers-color-scheme: dark)").matches?"battle":"medical"}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="medical"}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="medical"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${unbounded.variable} ${jakarta.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] btn btn-primary"
        >
          Skip to content
        </a>
        {children}
        <Toaster />
        <DeferredEffects />
        <Analytics />
      </body>
    </html>
  );
}
