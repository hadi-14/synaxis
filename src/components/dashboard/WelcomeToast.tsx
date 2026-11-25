"use client";
import { useEffect } from "react";
import { toast } from "@/components/ui/toast-store";
import { say } from "@/components/guide/guide-store";

export function WelcomeToast({ welcome, updated }: { welcome: boolean; updated: boolean }) {
  useEffect(() => {
    if (welcome) {
      toast.success("Team registered", "Check your email for the confirmation and payment details.");
      say("Next step: transfer the fee and drop the receipt into Honey Lemon's purse.", "point");
      history.replaceState(null, "", "/dashboard");
    } else if (updated) {
      toast.success("Changes saved");
      history.replaceState(null, "", "/dashboard");
    }
  }, [welcome, updated]);
  return null;
}
