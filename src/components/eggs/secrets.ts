"use client";
import { toast } from "@/components/ui/toast-store";
import { track } from "@/lib/analytics";

/** Easter egg registry. Found secrets persist in localStorage; the tracker unlocks a story card. */
export const SECRETS = {
  "fist-bump": "Ba-la-la-la-la (Konami code)",
  "pain-scale": "Rated your pain on the 404 page",
  mochi: "Spotted Mochi",
  "hairy-baby": "Hairy baby",
  "lucky-cat": "Visited the Lucky Cat Café",
  kaiju: "Met Fred's kaiju",
  "another-angle": "Looked for another angle",
  "low-battery": "Let Baymax run low on battery",
  wasabi: "Helped Wasabi tidy up",
  "tadashi-cap": "Found Tadashi's cap",
  console: "Opened the dev console",
  "kabuki-mask": "Unmasked Yokai",
  "rocket-fist": "Fist-bumped the footer",
} as const;
export type SecretId = keyof typeof SECRETS;
export const SECRET_TOTAL = Object.keys(SECRETS).length;
const KEY = "synaxis-secrets";

export function getFound(): SecretId[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => x in SECRETS) : [];
  } catch {
    return [];
  }
}

export function foundSecret(id: SecretId) {
  if (typeof window === "undefined") return;
  const found = getFound();
  if (found.includes(id)) return;
  found.push(id);
  localStorage.setItem(KEY, JSON.stringify(found));
  window.dispatchEvent(new CustomEvent("synaxis:secret", { detail: { id, count: found.length } }));
  track("easter_egg_found", { id });
  toast(`Secret found: ${SECRETS[id]}`, { body: `${found.length}/${SECRET_TOTAL} secrets discovered`, kind: "success" });
}
