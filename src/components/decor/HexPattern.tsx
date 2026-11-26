/** Faint armour-panel hexagon pattern (SVG pattern, no images). Use inside an absolutely positioned layer. */
export function HexPattern({ className = "" }: { className?: string }) {
  return (
    <svg className={className} aria-hidden width="100%" height="100%">
      <defs>
        <pattern id="hexes" width="56" height="48.5" patternUnits="userSpaceOnUse" patternTransform="scale(1.2)">
          <path d="M14 0 L42 0 L56 24.25 L42 48.5 L14 48.5 L0 24.25 Z" fill="none" stroke="currentColor" strokeWidth="1" />
          <path d="M42 0 L56 0 M42 48.5 L56 48.5" stroke="currentColor" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hexes)" />
    </svg>
  );
}
