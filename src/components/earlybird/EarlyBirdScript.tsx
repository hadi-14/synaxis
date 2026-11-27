/**
 * Sets html[data-eb] to "on" or "after" before first paint, so cached pages switch automatically at the
 * early-bird deadline (and again via a timer if the page stays open). The admin-only preview cookie
 * `synaxis-eb-preview=after` forces the after-deadline view in that browser only.
 * Elements opt in with data-eb-only="on" | "after" (see globals.css).
 */
export function EarlyBirdScript({ deadline }: { deadline: string }) {
  const js = `(function(){var d=new Date(${JSON.stringify(deadline)}).getTime();function s(){var p=/(?:^|; )synaxis-eb-preview=after/.test(document.cookie);document.documentElement.dataset.eb=(p||Date.now()>d)?"after":"on"}s();var ms=d-Date.now();if(ms>0&&ms<2147483647)setTimeout(s,ms+500);window.__ebRefresh=s})()`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}

/** Read the current early-bird state on the client (after the inline script ran). */
export const earlyBirdActive = () => typeof document === "undefined" || document.documentElement.dataset.eb !== "after";
