import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { HeuserWordmark } from "@/components/brand/Heuser";
import type { Settings } from "@/lib/types";
import { venueMap } from "@/lib/maps";
import { VenueMap } from "./VenueMap";
import { LuckyCat } from "./LuckyCat";
import { SecretsTracker } from "@/components/eggs/SecretsTracker";

export function Footer({ settings }: { settings: Settings }) {
  const wa = settings.contact_whatsapp.replace(/\D/g, "");
  const venue = [settings.venue_name, settings.venue_address].filter(Boolean).join(", ");
  const map = venueMap(settings.venue_map_url, venue);
  return (
    <footer className="mt-0 bg-[#a3141f] pb-[env(safe-area-inset-bottom)] text-white battle:bg-[#7d0f18] [&_a:focus-visible]:outline-white" id="footer">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo mono className="h-6 w-auto" />
          {/* The footer is red in both themes, so the white wordmark is right in both. */}
          <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm font-semibold text-white">
            <span>An initiative of Heuser Science Society</span>
            <span aria-hidden>·</span>
            <HeuserWordmark title="Heuser College" className="h-[13px] w-auto" />
          </p>
          <p className="mt-4 max-w-sm text-sm text-white">
            Synaxis {settings.season_label} is organised by the Heuser Science Society. Big Hero 6 is a Disney property. This is a
            fan-themed student event and is not affiliated with or endorsed by Disney.
          </p>
          <div className="mt-6 flex items-center gap-3 text-sm text-white">
            <LuckyCat />
          </div>
          <div className="mt-4"><SecretsTracker /></div>
        </div>
        <div>
          <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-white">Contact</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><a className="plasma-link" href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a></li>
            <li><a className="plasma-link" href={`https://wa.me/${wa}`} rel="noopener" target="_blank">WhatsApp {settings.contact_whatsapp}</a></li>
            <li><a className="plasma-link" href={settings.instagram_url} rel="noopener" target="_blank">Instagram @heusersynaxis</a></li>
            <li className="text-white">{venue}</li>
          </ul>
          {map && <VenueMap map={map} title={`Map: ${venue}`} />}
        </div>
        <div>
          <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-white">Quick links</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="plasma-link" href="/register">Register</Link></li>
            <li><Link className="plasma-link" href="/dashboard">My team</Link></li>
            <li><Link className="plasma-link" href="/#modules">Modules</Link></li>
            <li><Link className="plasma-link" href="/council">Council</Link></li>
            <li><Link className="plasma-link" href="/sponsors">Sponsors</Link></li>
            <li><Link className="plasma-link" href="/terms">Terms of Service</Link></li>
            <li><Link className="plasma-link" href="/privacy">Privacy Policy</Link></li>
            <li><Link className="plasma-link" href="/admin">Cabinet login</Link></li>
          </ul>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1.5 border-t border-white/30 px-4 py-5 text-center font-mono text-[11px] text-white sm:flex-row sm:justify-between sm:text-left">
        <p>Big Hero 6 © Disney. Fan-made for a student event. · {settings.season_label} · Heuser Science Society · Karachi</p>
        <p>
          Website by{" "}
          <a className="font-bold underline underline-offset-2" href="https://abdul-hadi-millwala.vercel.app" target="_blank" rel="noopener">
            Abdul Hadi Millwala
          </a>{" "}
          &amp; <span className="font-bold">Muhammad Aoun Imran</span>
        </p>
      </div>
    </footer>
  );
}
