import type { VenueMap as Map } from "@/lib/maps";

/**
 * Small venue map for the footer's Contact column: lazy-loaded Google Maps iframe in a fixed frame
 * (no layout shift), darkened to sit on the red footer, plus an "Open in Google Maps" link.
 * Render only when venueMap() returned a map (the setting is not empty).
 */
export function VenueMap({ map, title }: { map: Map; title: string }) {
  return (
    <div className="mt-4 w-full md:max-w-[260px]">
      <div className="overflow-hidden rounded-xl border border-white/30 bg-black/20">
        <iframe
          src={map.embed}
          title={title}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="block aspect-[13/7] h-auto w-full border-0 [filter:brightness(.82)_contrast(1.05)_saturate(.7)]"
        />
      </div>
      <a href={map.open} target="_blank" rel="noopener noreferrer" className="plasma-link mt-2 inline-block text-sm">
        Open in Google Maps <span aria-hidden>↗</span>
      </a>
    </div>
  );
}
