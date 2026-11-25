/** All user-facing dates render in Asia/Karachi so server and client output always match (A15). */
const TZ = "Asia/Karachi";

export function formatDate(iso: string, withTime = false) {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00+05:00` : iso);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit", hour12: true } : {}),
  }).format(d);
}

export function formatDateRange(startIso: string, endIso: string) {
  const s = new Date(`${startIso}T12:00:00+05:00`);
  const e = new Date(`${endIso}T12:00:00+05:00`);
  const day = (d: Date) => new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "numeric" }).format(d);
  const my = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, month: "long", year: "numeric" }).format(e);
  return `${day(s)}–${day(e)} ${my}`;
}

/** datetime-local value (Karachi wall clock) <-> ISO */
export function toKarachiLocalInput(iso: string) {
  const d = new Date(new Date(iso).getTime() + 5 * 3600_000);
  return d.toISOString().slice(0, 16);
}
export function fromKarachiLocalInput(v: string) {
  return new Date(`${v}:00+05:00`).toISOString();
}
