"use client";
import { useState } from "react";
import { confirmReceipt, confirmWaiver, createUploadUrl } from "@/app/(site)/dashboard/actions";
import { track } from "@/lib/analytics";

/** Lazy-load the Supabase browser client so it never ships with public pages. */
const supabase = () => import("@/lib/supabase/browser").then((m) => m.createClient());

export type UploadState = "idle" | "uploading" | "done" | "error";

/** Signed-URL upload: server validates and issues a one-time URL; the browser uploads directly to private storage. */
export function useUpload(kind: "receipt" | "waiver", memberId: string | null = null) {
  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const upload = async (file: File) => {
    setError(null);
    setState("uploading");
    const mime = file.type || (file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : file.name.toLowerCase().endsWith(".heic") ? "image/heic" : "");
    const r = await createUploadUrl(kind, mime, file.size, memberId);
    if (!r.ok) {
      setState("error");
      setError(r.error);
      return false;
    }
    const { path, token, bucket } = r.data!;
    const { error: upErr } = await (await supabase()).storage.from(bucket).uploadToSignedUrl(path, token, file, { contentType: mime });
    if (upErr) {
      setState("error");
      setError("Upload failed. Check your connection and try again.");
      return false;
    }
    const c = kind === "receipt" ? await confirmReceipt(path) : await confirmWaiver(path, memberId);
    if (!c.ok) {
      setState("error");
      setError(c.error);
      return false;
    }
    setState("done");
    if (kind === "receipt") track("receipt_uploaded");
    return true;
  };
  return { state, error, upload, reset: () => setState("idle") };
}
