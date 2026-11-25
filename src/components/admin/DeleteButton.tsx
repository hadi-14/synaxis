"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast-store";
import { deleteContent, markInquiry, removeRole } from "@/app/admin/content/actions";

export function DeleteButton({ kind, id, label = "Delete" }: { kind: "faqs" | "council_members" | "sponsors" | "role"; id: number; label?: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      className="btn btn-ghost !min-h-8 text-xs text-[var(--danger)]"
      onClick={() => {
        if (!confirm("Are you sure?")) return;
        start(async () => {
          const r = kind === "role" ? await removeRole(id) : await deleteContent(kind, id);
          if (r.ok) {
            toast.success(r.message);
            router.refresh();
          } else toast.error(r.message);
        });
      }}
    >
      {label}
    </button>
  );
}

export function InquiryToggle({ id, handled }: { id: number; handled: boolean }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-xs font-semibold">
      <input type="checkbox" disabled={pending} checked={handled} className="h-4 w-4 accent-[var(--success)]" onChange={(e) => start(async () => { await markInquiry(id, e.target.checked); router.refresh(); })} />
      Handled
    </label>
  );
}
