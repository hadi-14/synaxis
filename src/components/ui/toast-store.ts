"use client";
// Tiny toast store (no dependency). Toasts render as Baymax's chest display.
export type ToastKind = "info" | "success" | "error";
export type ToastItem = { id: number; kind: ToastKind; title: string; body?: string };
type Listener = (t: ToastItem[]) => void;

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((l) => l(items));

export function toast(title: string, opts: { kind?: ToastKind; body?: string; ms?: number } = {}) {
  const id = nextId++;
  items = [...items.slice(-2), { id, kind: opts.kind ?? "info", title, body: opts.body }];
  emit();
  setTimeout(() => dismiss(id), opts.ms ?? 4500);
  return id;
}
toast.success = (title: string, body?: string) => toast(title, { kind: "success", body });
toast.error = (title: string, body?: string) => toast(title, { kind: "error", body, ms: 7000 });

export function dismiss(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}
export function subscribe(l: Listener) {
  listeners.add(l);
  l(items);
  return () => void listeners.delete(l);
}
