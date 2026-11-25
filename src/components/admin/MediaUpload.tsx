"use client";
import { useState } from "react";
import { mediaUploadUrl } from "@/app/admin/content/actions";

/** Lazy-load the Supabase browser client so it never ships with public pages. */
const supabase = () => import("@/lib/supabase/browser").then((m) => m.createClient());

/** Uploads a photo/logo to the public media bucket and fills the target URL input. */
export function MediaUpload({ kind, inputName, defaultValue }: { kind: "council" | "sponsors"; inputName: string; defaultValue?: string | null }) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-3">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-12 w-12 rounded-[var(--radius-sm)] border border-[var(--line)] object-cover" />
      ) : (
        <span className="grid h-12 w-12 place-items-center rounded-[var(--radius-sm)] border border-dashed border-[var(--line)] text-xs text-[var(--ink-muted)]">none</span>
      )}
      <input type="url" name={inputName} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://… or upload" className="field !min-h-10 flex-1 text-sm" />
      <label className="btn btn-secondary !min-h-10 cursor-pointer text-xs">
        {busy ? "Uploading…" : "Upload"}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setBusy(true);
            setErr(null);
            const r = await mediaUploadUrl(kind, f.type, f.size);
            if (!r.ok) {
              setErr(r.error);
              setBusy(false);
              return;
            }
            const { error } = await (await supabase()).storage.from("media").uploadToSignedUrl(r.path, r.token, f, { contentType: f.type });
            setBusy(false);
            if (error) setErr("Upload failed");
            else setUrl(r.publicUrl);
          }}
        />
      </label>
      {err && <span className="text-xs text-[var(--danger)]">{err}</span>}
    </div>
  );
}
