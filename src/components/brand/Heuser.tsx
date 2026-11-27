import { HEUSER_MARK, HEUSER_MARK_VIEWBOX, HEUSER_WORDMARK, HEUSER_WORDMARK_VIEWBOX } from "./heuser-paths";

/**
 * Heuser College brand marks, traced from the originals in /public/brand/heuser (scripts/trace-heuser.mjs).
 * Both paint in currentColor: white on red/dark, ink on light. Decorative unless given a `title`.
 */
type Props = { className?: string; title?: string };
const a11y = (title?: string) => (title ? { role: "img", "aria-label": title } : { "aria-hidden": true as const });

/** The Heuser College mark (the dragon), shown whole. Aspect 638 : 1056. */
export function HeuserMark({ className, title }: Props) {
  return (
    <svg viewBox={HEUSER_MARK_VIEWBOX} className={className} fill="currentColor" {...a11y(title)}>
      <path d={HEUSER_MARK} fillRule="evenodd" />
    </svg>
  );
}

/** The "HEUSERCOLLEGE" wordmark. */
export function HeuserWordmark({ className, title }: Props) {
  return (
    <svg viewBox={HEUSER_WORDMARK_VIEWBOX} className={className} fill="currentColor" {...a11y(title)}>
      <path d={HEUSER_WORDMARK} fillRule="evenodd" />
    </svg>
  );
}
