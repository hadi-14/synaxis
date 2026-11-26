/** Stroke icons drawn as SVG so they sit at the exact centre of round buttons (no font baseline offset). */
type P = { className?: string };
const base = { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, "aria-hidden": true };
export const PlusIcon = ({ className = "h-3.5 w-3.5" }: P) => (
  <svg {...base} className={className}><path d="M8 3v10M3 8h10" /></svg>
);
export const CloseIcon = ({ className = "h-3.5 w-3.5" }: P) => (
  <svg {...base} className={className}><path d="M4 4l8 8M12 4l-8 8" /></svg>
);
export const MinusIcon = ({ className = "h-3 w-3" }: P) => (
  <svg {...base} className={className}><path d="M3 8h10" /></svg>
);
