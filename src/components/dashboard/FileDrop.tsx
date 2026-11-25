"use client";
import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useUpload } from "./useUpload";
import { toast } from "@/components/ui/toast-store";

/** Plain upload control (waivers). */
export function FileDrop({ memberId, label }: { memberId: string | null; label: string }) {
  const id = useId();
  const router = useRouter();
  const { state, error, upload } = useUpload("waiver", memberId);
  const [drag, setDrag] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={async (e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files?.[0];
        if (f && (await upload(f))) {
          toast.success("Waiver uploaded");
          router.refresh();
        }
      }}
      className={drag ? "rounded-full ring-2 ring-[var(--accent)]" : ""}
    >
      <input
        id={id}
        type="file"
        accept="application/pdf,image/*"
        className="sr-only"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f && (await upload(f))) {
            toast.success("Waiver uploaded");
            router.refresh();
          }
        }}
      />
      <label htmlFor={id} className="btn btn-secondary !min-h-9 cursor-pointer !px-3 text-sm">
        {state === "uploading" ? "Uploading…" : label}
      </label>
      {error && <p role="alert" className="mt-1 text-xs font-semibold text-[var(--danger)]">{error}</p>}
    </div>
  );
}
