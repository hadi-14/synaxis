"use client";
import type { BaymaxPose } from "@/components/brand/Baymax";

export type GuideMessage = { text: string; pose: BaymaxPose; tone: "info" | "warn" | "success"; at: number };
type L = (m: GuideMessage) => void;
const ls = new Set<L>();
let last: GuideMessage | null = null;

/** Make the Baymax Guide say something. */
export function say(text: string, pose: BaymaxPose = "point", tone: GuideMessage["tone"] = "info") {
  last = { text, pose, tone, at: Date.now() };
  ls.forEach((l) => l(last!));
}
export function onSay(l: L) {
  ls.add(l);
  if (last) l(last);
  return () => void ls.delete(l);
}
