"use client";
import { useEffect, useRef } from "react";
import { registerHeading } from "./microbot-mesh";

/**
 * A heading that resolves out of a swarm of connected microbots.
 * The <h2> text is real DOM text; a shared canvas system draws the swarm only while it's in view.
 */
export function MicrobotHeading({ text, id, as = "h2" }: { text: string; id?: string; as?: "h1" | "h2" }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const Tag = as;
  useEffect(() => (ref.current ? registerHeading(ref.current) : undefined), []);
  return (
    <Tag ref={ref} id={id} className="mb-heading relative mt-2 font-display text-3xl font-extrabold leading-[1.08] tracking-tight sm:text-4xl lg:text-5xl">
      {text}
    </Tag>
  );
}
