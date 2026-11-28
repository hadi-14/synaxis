"use client";
import { useState } from "react";
import { needsExpanding, venueMap } from "@/lib/maps";

/** Admin "Map link" field: accepts any Google Maps link or an address, with a live preview of the embed. */
export function MapField({ defaultValue, fallbackQuery }: { defaultValue: string; fallbackQuery: string }) {
  const [v, setV] = useState(defaultValue);
  const map = venueMap(v, fallbackQuery);
  return (
    <div className="block text-sm sm:col-span-2">
      <label htmlFor="venue_map_url" className="mb-1 block font-semibold">Map link</label>
      <input id="venue_map_url" className="field" name="venue_map_url" value={v} onChange={(e) => setV(e.target.value)} placeholder="https://maps.app.goo.gl/… or an address" />
      <span className="mt-1 block text-xs text-[var(--ink-muted)]">
        Paste any Google Maps link (Share → Copy link, the page URL, or Share → Embed a map), or just type the address. Leave empty to hide the map on the site.
        {needsExpanding(v.trim()) && " Share links are expanded to the exact pin when you save; the preview below uses the venue address until then."}
      </span>
      {map ? (
        <iframe key={map.embed} src={map.embed} title="Map preview" loading="lazy" className="mt-3 block aspect-[16/9] h-auto w-full max-w-xl rounded-xl border border-[var(--line)]" />
      ) : (
        v.trim() && <span className="mt-2 block text-xs font-semibold text-[var(--warning)]">This isn&apos;t a Google Maps link, so no map will be shown.</span>
      )}
    </div>
  );
}
