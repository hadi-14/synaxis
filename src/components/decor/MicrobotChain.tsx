/** Section divider: a thin chain of linked microbots (SVG pattern). */
export function MicrobotChain({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none h-3 w-full ${className}`}>
      <svg width="100%" height="12">
        <defs>
          <pattern id="mbchain" width="28" height="12" patternUnits="userSpaceOnUse">
            <rect x="2" y="3" width="10" height="6" rx="2" fill="currentColor" />
            <path d="M12 6 H30" stroke="currentColor" strokeWidth="1.2" />
            <rect x="16" y="4.5" width="4" height="3" rx="1" fill="currentColor" opacity=".6" />
          </pattern>
        </defs>
        <rect width="100%" height="12" fill="url(#mbchain)" />
      </svg>
    </div>
  );
}
