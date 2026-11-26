import { LOGO_LETTERS, LOGO_VIEWBOX, LOGO_X } from "./logo-paths";

/** The SYNAXIS wordmark, traced from /public/logo. Letters follow the theme; the X stays logo red. */
export function Logo({ className, title = "Synaxis", mono = false }: { className?: string; title?: string; mono?: boolean }) {
  return (
    <svg viewBox={LOGO_VIEWBOX} className={className} role="img" aria-label={title}>
      {/* mono: solid white on red backgrounds (the two-colour logo loses contrast on coral) */}
      <path d={LOGO_LETTERS} fill={mono ? "#fff" : "var(--logo-letters)"} fillRule="evenodd" />
      <path d={LOGO_X} fill={mono ? "#fff" : "var(--logo-red)"} fillRule="evenodd" />
    </svg>
  );
}

/** Just the chevron X: favicon, loaders, thruster motif. */
export function LogoX({ className }: { className?: string }) {
  return (
    <svg viewBox="518 -1 194 127" className={className} aria-hidden="true">
      <path d={LOGO_X} fill="var(--logo-red, #DC2A35)" fillRule="evenodd" />
    </svg>
  );
}
