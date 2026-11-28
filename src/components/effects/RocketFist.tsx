"use client";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { foundSecret } from "@/components/eggs/secrets";

const FIST = "/assets/bh6/derived/rocket-fist.png"; // cut from baymax-armor.png (scripts/make-rocket-fist.mjs)
const ASPECT = 140 / 224;

/**
 * Scroll indicator + back to top: Baymax's rocket fist.
 * - ≥640px: rides a subtle track at the right edge, from just below the header to just above the viewport
 *   bottom. Points down while scrolling down (flame on top), springs round 180° (~250 ms) and points up
 *   while scrolling up. Flame length/brightness follow scroll speed; idle → hover bob + flicker.
 * - <640px: no track, just a small upward fist (bottom right) once scrolled past the hero.
 * - Click / Enter / Space: rockets up with a full flame while the page scrolls to the top.
 * - Very bottom: a quick fist bump + "ba-la-la-la" wiggle (a secret, the first time).
 * The flame lives inside the same rotated element as the fist, anchored to its open end, so it can't detach.
 * Hidden while the intro plays (globals.css). Reduced motion: static fist, no flame, instant scroll.
 * One rAF loop, only while something moves; transform/opacity writes only.
 */
export function RocketFist() {
  const root = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const spin = useRef<HTMLSpanElement>(null);
  const pop = useRef<HTMLSpanElement>(null);
  const flame = useRef<HTMLSpanElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const bubble = useRef<HTMLSpanElement>(null);
  const launch = useRef<() => void>(() => {});

  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const desktop = matchMedia("(min-width: 640px)");
    const header = document.querySelector<HTMLElement>("body > header, header");
    let raf = 0, last = performance.now(), lastY = scrollY;
    let v = 0; // scroll speed, 0..1 (decays)
    let angle = 0, av = 0, target = 0; // 0 = pointing down, 180 = pointing up (spring)
    let boost = 0; // back-to-top flame
    let atBottom = false, launching = false, idleTimer = 0;

    const setIdle = (on: boolean) => root.current?.toggleAttribute("data-idle", on && !reduced);

    const frame = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
      const isDesktop = desktop.matches;

      // spring towards the direction (critically damped-ish: settles in ~250 ms)
      if (reduced) angle = target;
      else {
        const k = 340, c = 30;
        av += (k * (target - angle) - c * av) * dt;
        angle += av * dt;
      }
      v *= Math.pow(0.02, dt); // fades out in about a second
      boost *= launching ? 1 : Math.pow(0.05, dt);
      const f = reduced ? 0 : Math.min(1, Math.max(v, boost));

      if (isDesktop) {
        const top = Math.max(0, header?.getBoundingClientRect().bottom ?? 64) + 30; // room for the flame tip at full speed
        const h = btn.current?.offsetHeight ?? 56;
        const bottom = innerHeight - 16 - h;
        const y = top + Math.max(0, bottom - top) * p;
        if (btn.current) btn.current.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
        if (root.current) {
          root.current.style.setProperty("--rf-top", `${top + h / 2}px`);
          root.current.style.setProperty("--rf-bottom", `${innerHeight - 16 - h / 2}px`);
        }
        if (fill.current) fill.current.style.transform = `scaleY(${p.toFixed(4)})`;
      } else if (btn.current) {
        btn.current.style.transform = "";
      }
      if (spin.current) spin.current.style.transform = `rotate(${(isDesktop ? angle : 180).toFixed(2)}deg)`;
      if (flame.current) {
        flame.current.style.transform = `translateX(-50%) scaleY(${(0.6 + f * 0.9).toFixed(3)})`;
        flame.current.style.opacity = String(reduced ? 0 : (0.5 + f * 0.5).toFixed(3));
      }
      root.current?.toggleAttribute("data-past-hero", scrollY > innerHeight * 0.85);

      // the very bottom: fist bump
      const bottomNow = max > 40 && scrollY >= max - 2;
      if (bottomNow && !atBottom && !launching) bump();
      atBottom = bottomNow;

      if (launching && scrollY <= 1) {
        launching = false;
        btn.current?.blur();
      }
      const moving = Math.abs(target - angle) > 0.2 || Math.abs(av) > 0.5 || f > 0.01 || launching;
      raf = moving ? requestAnimationFrame(frame) : 0;
    };
    const kick = () => {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    const bump = () => {
      if (!desktop.matches) return;
      foundSecret("rocket-fist");
      if (reduced) return;
      pop.current?.animate(
        [
          { transform: "none" },
          { transform: "translateX(-10px) scale(1.25)", offset: 0.25 },
          { transform: "translateX(-6px) scale(1.12) rotate(-9deg)", offset: 0.42 },
          { transform: "translateX(-6px) scale(1.12) rotate(8deg)", offset: 0.54 },
          { transform: "translateX(-6px) scale(1.12) rotate(-7deg)", offset: 0.66 },
          { transform: "translateX(-6px) scale(1.12) rotate(5deg)", offset: 0.78 },
          { transform: "none" },
        ],
        { duration: 900, easing: "cubic-bezier(.3,1.4,.5,1)" },
      );
      bubble.current?.animate(
        [
          { opacity: 0, transform: "translate(6px, 0) scale(.8)" },
          { opacity: 1, transform: "none", offset: 0.2 },
          { opacity: 1, transform: "none", offset: 0.75 },
          { opacity: 0, transform: "translate(-4px, -6px)" },
        ],
        { duration: 1300, easing: "ease-out" },
      );
    };

    const onScroll = () => {
      const now = performance.now();
      const dy = scrollY - lastY;
      lastY = scrollY;
      if (dy !== 0 && !launching) {
        target = dy > 0 ? 0 : 180;
        v = Math.max(v, Math.min(1, (Math.abs(dy) / Math.max(16, now - last)) * 0.45));
      }
      setIdle(false);
      clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => setIdle(true), 260);
      kick();
    };

    launch.current = () => {
      launching = !reduced;
      target = 180;
      boost = 1;
      scrollTo({ top: 0, behavior: reduced ? "instant" : "smooth" });
      kick();
      // smooth scrolling can be interrupted (wheel/touch): stop boosting after a while regardless
      window.setTimeout(() => (launching = false), 2500);
    };

    setIdle(true);
    kick();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", kick);
    desktop.addEventListener("change", kick);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(idleTimer);
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", kick);
      desktop.removeEventListener("change", kick);
    };
  }, []);

  return (
    <div ref={root} className="rocket-fist">
      <span aria-hidden className="rf-track">
        <span ref={fill} className="rf-fill" />
      </span>
      <button ref={btn} type="button" aria-label="Back to top" className="rf-btn" onClick={() => launch.current()}>
        <span ref={spin} className="rf-spin">
          <span ref={pop} className="rf-pop">
            <span className="rf-bob">
              {/* thruster flame: anchored to the fist's open (elbow) end, inside the rotated element */}
              <span ref={flame} aria-hidden className="rf-flame">
                <span className="rf-flame-core" />
              </span>
              <Image src={FIST} alt="" width={140} height={224} sizes="36px" className="rf-img" style={{ aspectRatio: ASPECT }} />
            </span>
          </span>
        </span>
      </button>
      <span ref={bubble} aria-hidden className="rf-bubble">ba-la-la-la!</span>
    </div>
  );
}
