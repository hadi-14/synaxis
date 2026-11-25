import type { Metadata } from "next";
import { Entrance } from "@/components/landing/Entrance";

export const metadata: Metadata = {
  title: { absolute: "Synaxis S1 · Enter the portal" },
  alternates: { canonical: "/" },
};

export default function Landing() {
  return <Entrance />;
}
