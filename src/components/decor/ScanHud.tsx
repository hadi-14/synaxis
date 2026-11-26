/** Scanning HUD: concentric rings + tick marks, and a slow horizontal scan line (CSS, paused off-screen via .decor-anim). */
export function ScanHud({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none ${className}`} aria-hidden>
      <svg viewBox="0 0 400 400" className="absolute left-1/2 top-1/2 h-[120%] max-h-[720px] w-auto -translate-x-1/2 -translate-y-1/2">
        {[60, 110, 160, 196].map((r, i) => (
          <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="currentColor" strokeWidth={i === 3 ? 1.5 : 1} strokeDasharray={i % 2 ? "2 6" : undefined} />
        ))}
        {Array.from({ length: 36 }, (_, i) => {
          const a = (i / 36) * Math.PI * 2;
          const r1 = 196, r2 = i % 3 ? 188 : 180;
          return <line key={i} x1={(200 + Math.cos(a) * r1).toFixed(2)} y1={(200 + Math.sin(a) * r1).toFixed(2)} x2={(200 + Math.cos(a) * r2).toFixed(2)} y2={(200 + Math.sin(a) * r2).toFixed(2)} stroke="currentColor" strokeWidth="1" />;
        })}
        <path d="M200 0 V400 M0 200 H400" stroke="currentColor" strokeWidth="0.6" strokeDasharray="1 5" />
      </svg>
      <div className="decor-anim absolute inset-x-0 top-0 h-px bg-current opacity-60 motion-safe:animate-[scan_7s_linear_infinite]" />
      <style>{`@keyframes scan{from{transform:translateY(0)}to{transform:translateY(var(--scan-h,600px))}}`}</style>
    </div>
  );
}
