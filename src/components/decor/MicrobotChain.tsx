/**
 * Section divider: a chain of real microbots. One element: the team's microbot.png, pre-rotated to lie
 * horizontally (public/assets/bh6/derived/microbot-h.png, from `magick microbot.png -rotate 90`), repeated
 * as a CSS mask with small gaps so the rods read as linked end to end. When it enters the viewport a
 * light pulse runs along the chain once (DecorObservers + globals.css). Static under reduced motion.
 */
export function MicrobotChain({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none flex h-6 w-full items-center ${className}`}>
      <div className="mb-chain h-[9px] w-full" />
    </div>
  );
}
