"use client";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { checkIn, undoCheckIn, type CheckinResult } from "@/app/admin/checkin/actions";
import { FistBump } from "@/components/effects/FistBump";

type BarcodeDetectorLike = { detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]> };

/**
 * Mobile QR scanner. Uses the native BarcodeDetector where available (Android Chrome),
 * otherwise jsQR on canvas frames (iOS Safari). Debounced so one QR = one check-in.
 */
export function Scanner({ modules, defaultDay, initialToken, canGate, canUndo }: { modules: { id: number; name: string }[]; defaultDay: number; initialToken: string | null; canGate: boolean; canUndo: boolean }) {
  const router = useRouter();
  const video = useRef<HTMLVideoElement>(null);
  const [day, setDay] = useState(defaultDay);
  const [moduleId, setModuleId] = useState<number | null>(canGate ? null : modules[0]?.id ?? null);
  const [camera, setCamera] = useState<"off" | "starting" | "on" | "denied">("off");
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [manual, setManual] = useState("");
  const [pending, start] = useTransition();
  const lastScan = useRef<{ v: string; t: number }>({ v: "", t: 0 });
  const stopRef = useRef<() => void>(() => {});

  const submit = useCallback(
    (value: string) => {
      const now = Date.now();
      if (value === lastScan.current.v && now - lastScan.current.t < 4000) return;
      lastScan.current = { v: value, t: now };
      start(async () => {
        const r = await checkIn(value, day, moduleId);
        setResult(r);
        if (navigator.vibrate) navigator.vibrate(r.ok ? (r.warnings.length ? [60, 60, 60] : 80) : [200]);
        router.refresh();
      });
    },
    [day, moduleId, router],
  );

  useEffect(() => {
    if (initialToken) submit(initialToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = async () => {
    setCamera("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      const v = video.current!;
      v.srcObject = stream;
      await v.play();
      setCamera("on");
      const W = window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => BarcodeDetectorLike };
      const native = W.BarcodeDetector ? new W.BarcodeDetector({ formats: ["qr_code"] }) : null;
      const jsQR = native ? null : (await import("jsqr")).default;
      const cv = document.createElement("canvas");
      const ctx = cv.getContext("2d", { willReadFrequently: true })!;
      let running = true;
      const loop = async () => {
        if (!running) return;
        if (v.readyState >= 2) {
          try {
            if (native) {
              const codes = await native.detect(v);
              if (codes[0]) submit(codes[0].rawValue);
            } else if (jsQR) {
              const w = 480, h = Math.round((v.videoHeight / v.videoWidth) * 480) || 360;
              cv.width = w;
              cv.height = h;
              ctx.drawImage(v, 0, 0, w, h);
              const img = ctx.getImageData(0, 0, w, h);
              const code = jsQR(img.data, w, h, { inversionAttempts: "dontInvert" });
              if (code?.data) submit(code.data);
            }
          } catch {}
        }
        setTimeout(() => requestAnimationFrame(loop), 180);
      };
      loop();
      stopRef.current = () => {
        running = false;
        stream.getTracks().forEach((t) => t.stop());
        setCamera("off");
      };
    } catch {
      setCamera("denied");
    }
  };
  useEffect(() => () => stopRef.current(), []);

  return (
    <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_1fr]">
      <section className="card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div role="radiogroup" aria-label="Event day" className="flex gap-1">
            {[1, 2, 3].map((d) => (
              <button key={d} role="radio" aria-checked={day === d} onClick={() => setDay(d)} className={`rounded-full px-4 py-2 text-sm font-bold ${day === d ? "bg-[var(--ink)] text-[var(--bg)]" : "border border-[var(--line)]"}`}>Day {d}</button>
            ))}
          </div>
          <select aria-label="Checkpoint" className="field !min-h-10 ml-auto max-w-[14rem] text-sm" value={moduleId ?? ""} onChange={(e) => setModuleId(e.target.value ? Number(e.target.value) : null)}>
            {canGate && <option value="">Main gate</option>}
            {modules.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-[var(--radius-sm)] bg-[#0b1220]">
          <video ref={video} playsInline muted className={`h-full w-full object-cover ${camera === "on" ? "" : "hidden"}`} />
          {camera === "on" && (
            <div aria-hidden className="pointer-events-none absolute inset-[18%] rounded-[16px] border-2 border-[#F24B59] shadow-[0_0_0_9999px_rgba(11,18,32,.45)]">
              <span className="absolute inset-x-0 top-0 h-0.5 bg-[#F24B59] motion-safe:animate-[scanline_1.6s_ease-in-out_infinite]" />
            </div>
          )}
          {camera !== "on" && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center text-[#e8f3ff]">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#8fa3c0]">Baymax scanner</p>
                <p className="mt-2 text-sm">{camera === "denied" ? "Camera blocked. Allow camera access in the browser, or type the registration ID below." : "Point the phone at a team's check-in QR."}</p>
                <button className="btn btn-primary mt-4" onClick={startCamera} disabled={camera === "starting"}>{camera === "starting" ? "Starting…" : "Start camera"}</button>
              </div>
            </div>
          )}
          <style>{`@keyframes scanline{0%,100%{top:0}50%{top:calc(100% - 2px)}}`}</style>
        </div>
        {camera === "on" && <button className="btn btn-ghost mt-2 text-sm" onClick={() => stopRef.current()}>Stop camera</button>}
        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (manual.trim()) {
              lastScan.current = { v: "", t: 0 };
              submit(manual.trim());
            }
          }}
        >
          <label className="sr-only" htmlFor="manual">Registration ID</label>
          <input id="manual" className="field" placeholder="SYN-S1-0042 or 42" value={manual} onChange={(e) => setManual(e.target.value)} autoCapitalize="characters" />
          <button className="btn btn-secondary" disabled={pending}>Check in</button>
        </form>
      </section>

      <section aria-live="assertive" className="card min-h-64 p-5">
        {!result ? (
          <p className="text-sm text-[var(--ink-muted)]">Scan results appear here.</p>
        ) : !result.ok ? (
          <div className="hud-error rounded-[var(--radius-sm)] border-2 border-[var(--danger)] p-4">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--danger)]">Scan failed</p>
            <p className="mt-1 text-lg font-bold">{result.error}</p>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={`font-mono text-xs font-bold uppercase tracking-[0.2em] ${result.already ? "text-[var(--warning)]" : "text-[var(--success)]"}`}>{result.already ? "Already checked in" : "Checked in"} · day {day}</p>
                <p className="mt-1 font-display text-2xl font-extrabold">{result.team.team_name}</p>
                <p className="font-mono text-sm text-[var(--primary-text)]">{result.team.reg_code}</p>
                <p className="text-sm text-[var(--ink-muted)]">{result.team.institution}</p>
              </div>
              {!result.already && <div className="w-28 shrink-0"><FistBump label="Welcome" /></div>}
            </div>
            {result.warnings.map((w) => <p key={w} className="mt-3 rounded bg-[#FBBF24]/20 p-2 text-sm font-semibold text-[var(--warning)]">⚠ {w}</p>)}
            <p className="mt-4 text-sm font-semibold">Members ({result.team.members.length})</p>
            <ul className="text-sm">{result.team.members.map((m) => <li key={m}>• {m}</li>)}</ul>
            <p className="mt-3 text-sm"><strong>Modules:</strong> {result.team.modules.join(", ") || "—"}</p>
            {canUndo && !result.already && (
              <button className="btn btn-ghost mt-3 text-xs text-[var(--danger)]" onClick={() => start(async () => { await undoCheckIn(result.team.id, day, moduleId); setResult(null); router.refresh(); })}>Undo this check-in</button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
