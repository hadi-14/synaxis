import { MicrobotHeading } from "@/components/effects/MicrobotHeading";

/** Section heading. Text stays in the DOM (SEO/screen readers); the microbot mesh is decorative. */
export function SectionHeading({
  eyebrow,
  title,
  intro,
  id,
  onRed = false,
  as = "h2",
}: {
  eyebrow: string;
  title: string;
  intro?: React.ReactNode;
  id?: string;
  onRed?: boolean;
  as?: "h1" | "h2";
}) {
  return (
    <div className="mb-8 max-w-2xl sm:mb-10">
      <p className={`font-mono text-xs font-bold uppercase tracking-[0.2em] ${onRed ? "text-[var(--band-body)]" : "text-[var(--primary-text)]"}`}>{eyebrow}</p>
      <div className={onRed ? "text-[var(--band-heading)]" : ""}><MicrobotHeading id={id} text={title} as={as} /></div>
      {intro && <div className={`mt-3 sm:text-lg ${onRed ? "font-semibold text-[var(--band-body)]" : "text-[var(--ink-muted)]"}`}>{intro}</div>}
    </div>
  );
}
