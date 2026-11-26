import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import type { Settings } from "@/lib/types";
import { LuckyCat } from "./LuckyCat";
import { SecretsTracker } from "@/components/eggs/SecretsTracker";

export function Footer({ settings }: { settings: Settings }) {
  const wa = settings.contact_whatsapp.replace(/\D/g, "");
  return (
    <footer className="mt-0 bg-[#a3141f] pb-[env(safe-area-inset-bottom)] text-white battle:bg-[#7d0f18] [&_a:focus-visible]:outline-white" id="footer">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo mono className="h-6 w-auto" />
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
            <li className="text-white">{settings.venue_name}, {settings.venue_address}</li>
          </ul>
        </div>
        <div>
          <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-white">Quick links</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="plasma-link" href="/register">Register</Link></li>
            <li><Link className="plasma-link" href="/dashboard">My team</Link></li>
            <li><Link className="plasma-link" href="/portal#modules">Modules</Link></li>
            <li><Link className="plasma-link" href="/council">Council</Link></li>
            <li><Link className="plasma-link" href="/sponsors">Sponsors</Link></li>
            <li><Link className="plasma-link" href="/admin">Cubinet login</Link></li>
          </ul>
        </div>
      </div>
      <p className="border-t border-white/30 px-4 py-5 text-center font-mono text-[11px] text-white">
        Big Hero 6 © Disney. Fan-made for a student event. · {settings.season_label} · Heuser Science Society · Karachi
      </p>
    </footer>
  );
}
