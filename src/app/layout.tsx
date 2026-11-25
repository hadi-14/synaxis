import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans, Unbounded } from "next/font/google";
import { Toaster } from "@/components/ui/Toaster";
import { MicrobotBurst } from "@/components/effects/MicrobotBurst";
import { EasterEggs } from "@/components/eggs/EasterEggs";
import "./globals.css";

// Display: wide, heavy, geometric with soft outer radii — closest match to the logo lettering.
const unbounded = Unbounded({ variable: "--font-unbounded", subsets: ["latin"], display: "swap" });
// Body: highly legible on phones, gently rounded terminals.
const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], display: "swap" });
// Mono/HUD: counters, registration IDs, Battle Mode labels.
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], display: "swap", preload: false });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Synaxis S1 · Heuser Science Society Olympiad", template: "%s · Synaxis S1" },
  description:
    "Synaxis Season 1: a three-day Big Hero 6–themed science olympiad by the Heuser Science Society, Karachi. 15–17 January 2027. Register your team.",
  applicationName: "Synaxis",
  openGraph: { type: "website", siteName: "Synaxis", locale: "en_PK" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F5F0" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1220" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

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
        <MicrobotBurst />
        <EasterEggs />
      </body>
    </html>
  );
}
