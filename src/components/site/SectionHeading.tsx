import { MicrobotHeading } from "@/components/effects/MicrobotHeading";

/** Section heading. Text stays in the DOM (SEO/screen readers); the microbot mesh is decorative. */
export function SectionHeading({
  eyebrow,
  title,
  intro,
  id,
}: {
  eyebrow: string;
  title: string;
  intro?: React.ReactNode;
  id?: string;
}) {
  return (
    <div className="mb-8 max-w-2xl sm:mb-10">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary-text)]">{eyebrow}</p>
      <MicrobotHeading id={id} text={title} />
      {intro && <div className="mt-3 text-[var(--ink-muted)] sm:text-lg">{intro}</div>}
    </div>
  );
}
