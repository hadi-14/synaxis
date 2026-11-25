import Link from "next/link";
import { requireStaff, hasRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/dates";
import { Empty } from "@/components/ui/Empty";
import { ActionForm, F, Toggle } from "@/components/admin/ActionForm";
import { DeleteButton, InquiryToggle } from "@/components/admin/DeleteButton";
import { MediaUpload } from "@/components/admin/MediaUpload";
import { saveCouncil, saveFaq, saveModule, saveSponsor } from "./actions";

export const instant = false;
export const metadata = { title: "Content" };

const TABS = [
  { key: "modules", label: "Modules", superOnly: false },
  { key: "faqs", label: "FAQs", superOnly: true },
  { key: "council", label: "Council", superOnly: true },
  { key: "sponsors", label: "Sponsors", superOnly: true },
  { key: "inquiries", label: "Sponsor inquiries", superOnly: true },
];

export default async function ContentPage(props: PageProps<"/admin/content">) {
  const staff = await requireStaff("super_admin", "module_head");
  const isSuper = hasRole(staff, "super_admin");
  const sp = (await props.searchParams) as Record<string, string | undefined>;
  const tab = TABS.find((t) => t.key === sp.tab && (isSuper || !t.superOnly))?.key ?? "modules";
  const admin = createAdminClient();

  return (
    <div className="mx-auto max-w-5xl">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--primary-text)]">Blueprint editor</p>
      <h1 className="font-display text-3xl font-extrabold">Content</h1>
      <nav className="no-scrollbar mt-4 flex gap-1 overflow-x-auto" aria-label="Content sections">
        {TABS.filter((t) => isSuper || !t.superOnly).map((t) => (
          <Link key={t.key} href={`?tab=${t.key}`} aria-current={tab === t.key ? "page" : undefined} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${tab === t.key ? "bg-[var(--ink)] text-[var(--bg)]" : "bg-[var(--surface)] border border-[var(--line)]"}`}>
            {t.label}
          </Link>
        ))}
      </nav>
      <div className="mt-6">
        {tab === "modules" && <Modules admin={admin} isSuper={isSuper} moduleIds={staff.moduleIds} />}
        {tab === "faqs" && <Faqs admin={admin} />}
        {tab === "council" && <Council admin={admin} />}
        {tab === "sponsors" && <Sponsors admin={admin} />}
        {tab === "inquiries" && <Inquiries admin={admin} />}
      </div>
    </div>
  );
}

type Admin = ReturnType<typeof createAdminClient>;
type Tables = import("@/lib/database.types").Database["public"]["Tables"];
type FaqRow = Tables["faqs"]["Row"];
type CouncilRow = Tables["council_members"]["Row"];
type SponsorRow = Tables["sponsors"]["Row"];

async function Modules({ admin, isSuper, moduleIds }: { admin: Admin; isSuper: boolean; moduleIds: number[] }) {
  const { data } = await admin.from("modules").select("*").order("sort");
  const mods = (data ?? []).filter((m) => isSuper || moduleIds.includes(m.id));
  if (!mods.length) return <Empty title="No modules assigned to you" />;
  return (
    <div className="space-y-4">
      {mods.map((m) => (
        <details key={m.id} className="card group overflow-hidden" open={mods.length === 1}>
          <summary className="flex cursor-pointer items-center gap-3 p-4" style={{ borderLeft: `6px solid ${m.accent}` }}>
            <span className="font-display font-bold">{m.name}</span>
            <span className="text-sm text-[var(--ink-muted)]">{m.subject} · {m.character}</span>
            {m.is_compulsory && <span className="rounded-full bg-[var(--primary)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--primary-ink)]">Compulsory</span>}
            {!m.is_active && <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-bold uppercase">Hidden</span>}
          </summary>
          <ActionForm action={saveModule} className="border-t border-[var(--line)] p-4">
            <input type="hidden" name="id" value={m.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <F label="Name"><input className="field" name="name" defaultValue={m.name} required /></F>
              <F label="Tagline"><input className="field" name="tagline" defaultValue={m.tagline} /></F>
              <F label="Description" className="sm:col-span-2"><textarea className="field min-h-28" name="description" defaultValue={m.description} /></F>
              <F label="Format"><input className="field" name="format" defaultValue={m.format} /></F>
              <F label="Team size"><input className="field" name="team_size_note" defaultValue={m.team_size_note} /></F>
              <F label="Schedule slot"><input className="field" name="schedule_slot" defaultValue={m.schedule_slot} /></F>
              <F label="Module Head"><input className="field" name="head_name" defaultValue={m.head_name} /></F>
              <F label="Module Co-Head"><input className="field" name="cohead_name" defaultValue={m.cohead_name} /></F>
              {isSuper && (
                <>
                  <F label="Subject"><input className="field" name="subject" defaultValue={m.subject} /></F>
                  <F label="Character"><input className="field" name="character" defaultValue={m.character} /></F>
                  <F label="Accent colour"><input className="field" name="accent" defaultValue={m.accent} pattern="#[0-9a-fA-F]{6}" /></F>
                  <F label="Capacity (teams)" hint="Blank = unlimited"><input className="field" name="capacity" type="number" min={0} defaultValue={m.capacity ?? ""} /></F>
                  <F label="Order"><input className="field" name="sort" type="number" defaultValue={m.sort} /></F>
                  <div className="flex flex-col gap-3 pt-6">
                    <Toggle name="is_compulsory" defaultChecked={m.is_compulsory} label="Compulsory for every team" />
                    <Toggle name="is_active" defaultChecked={m.is_active} label="Visible on the site" />
                  </div>
                </>
              )}
            </div>
          </ActionForm>
        </details>
      ))}
    </div>
  );
}

async function Faqs({ admin }: { admin: Admin }) {
  const { data } = await admin.from("faqs").select("*").order("sort");
  return (
    <div className="space-y-4">
      <section className="card p-4"><h2 className="mb-3 font-display font-bold">Add an FAQ</h2><FaqForm nextSort={(data?.length ?? 0) + 1} /></section>
      {(data ?? []).map((f) => (
        <details key={f.id} className="card p-4">
          <summary className="flex cursor-pointer items-center justify-between gap-3"><span className="font-semibold">{f.question}</span>{!f.is_published && <span className="text-xs font-bold uppercase text-[var(--ink-muted)]">Hidden</span>}</summary>
          <div className="mt-3"><FaqForm f={f} nextSort={0} /><div className="mt-2 text-right"><DeleteButton kind="faqs" id={f.id} /></div></div>
        </details>
      ))}
    </div>
  );
}

async function Council({ admin }: { admin: Admin }) {
  const [{ data }, { data: modules }] = await Promise.all([admin.from("council_members").select("*").order("sort"), admin.from("modules").select("id, name").order("sort")]);
  return (
    <div className="space-y-4">
      <section className="card p-4"><h2 className="mb-3 font-display font-bold">Add a Cubinet member</h2><CouncilForm modules={modules} /></section>
      {(data ?? []).length === 0 && <Empty title="No council members yet" body="Add the President and VP first." />}
      {(data ?? []).map((c) => (
        <details key={c.id} className="card p-4">
          <summary className="cursor-pointer font-semibold">{c.name} <span className="font-normal text-[var(--ink-muted)]">· {c.role}</span></summary>
          <div className="mt-3"><CouncilForm c={c} modules={modules} /><div className="mt-2 text-right"><DeleteButton kind="council_members" id={c.id} /></div></div>
        </details>
      ))}
    </div>
  );
}

async function Sponsors({ admin }: { admin: Admin }) {
  const { data } = await admin.from("sponsors").select("*").order("sort");
  return (
    <div className="space-y-4">
      <section className="card p-4"><h2 className="mb-3 font-display font-bold">Add a sponsor</h2><SponsorForm /></section>
      {(data ?? []).map((s) => (
        <details key={s.id} className="card p-4">
          <summary className="cursor-pointer font-semibold">{s.name} <span className="font-normal capitalize text-[var(--ink-muted)]">· {s.tier}</span></summary>
          <div className="mt-3"><SponsorForm s={s} /><div className="mt-2 text-right"><DeleteButton kind="sponsors" id={s.id} /></div></div>
        </details>
      ))}
    </div>
  );
}

async function Inquiries({ admin }: { admin: Admin }) {
  const { data } = await admin.from("sponsor_inquiries").select("*").order("created_at", { ascending: false });
  if (!data?.length) return <div className="card"><Empty title="No sponsor inquiries yet" body="Messages from the /sponsors form appear here and are emailed to admins." /></div>;
  return (
    <ul className="space-y-3">
      {data.map((q) => (
        <li key={q.id} className={`card p-4 ${q.handled ? "opacity-60" : ""}`}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold">{q.organisation} <span className="font-normal text-[var(--ink-muted)]">· {q.name}</span></p>
              <p className="text-sm"><a className="plasma-link" href={`mailto:${q.email}`}>{q.email}</a>{q.phone ? ` · ${q.phone}` : ""}{q.interest ? ` · ${q.interest}` : ""}</p>
            </div>
            <div className="flex items-center gap-3"><span className="font-mono text-xs text-[var(--ink-muted)]">{formatDate(q.created_at, true)}</span><InquiryToggle id={q.id} handled={q.handled} /></div>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm">{q.message}</p>
        </li>
      ))}
    </ul>
  );
}

function FaqForm({ f, nextSort }: { f?: FaqRow; nextSort: number }) {
  return (
    <ActionForm action={saveFaq} resetOnSuccess={!f} submitLabel={f ? "Save" : "Add FAQ"}>
      {f && <input type="hidden" name="id" value={f.id} />}
      <div className="grid gap-3 sm:grid-cols-[1fr_10rem_6rem]">
        <F label="Question"><input className="field" name="question" defaultValue={f?.question} required /></F>
        <F label="Category"><input className="field" name="category" defaultValue={f?.category ?? "General"} /></F>
        <F label="Order"><input className="field" name="sort" type="number" defaultValue={f?.sort ?? nextSort} /></F>
        <F label="Answer" className="sm:col-span-3"><textarea className="field min-h-24" name="answer" defaultValue={f?.answer} required /></F>
      </div>
      <div className="mt-3"><Toggle name="is_published" defaultChecked={f?.is_published ?? true} label="Published" /></div>
    </ActionForm>
  );
}

function CouncilForm({ c, modules }: { c?: CouncilRow; modules: { id: number; name: string }[] | null }) {
  return (
    <ActionForm action={saveCouncil} resetOnSuccess={!c} submitLabel={c ? "Save" : "Add member"}>
      {c && <input type="hidden" name="id" value={c.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <F label="Name"><input className="field" name="name" defaultValue={c?.name} required /></F>
        <F label="Role" hint="e.g. President, Module Head"><input className="field" name="role" defaultValue={c?.role} required /></F>
        <F label="Group">
          <select className="field" name="tier" defaultValue={c?.tier ?? "module"}><option value="executive">Executive (President/VP)</option><option value="module">Module team</option></select>
        </F>
        <F label="Module">
          <select className="field" name="module_id" defaultValue={c?.module_id ?? ""}><option value="">—</option>{modules?.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
        </F>
        <F label="Photo" className="sm:col-span-2"><MediaUpload kind="council" inputName="photo_url" defaultValue={c?.photo_url} /></F>
        <F label="Instagram handle"><input className="field" name="instagram" defaultValue={c?.instagram ?? ""} placeholder="@handle" /></F>
        <F label="LinkedIn URL"><input className="field" name="linkedin" defaultValue={c?.linkedin ?? ""} /></F>
        <F label="Email"><input className="field" name="email" type="email" defaultValue={c?.email ?? ""} /></F>
        <F label="Order"><input className="field" name="sort" type="number" defaultValue={c?.sort ?? 0} /></F>
        <F label="Short bio" className="sm:col-span-2"><textarea className="field" name="bio" defaultValue={c?.bio ?? ""} maxLength={300} /></F>
      </div>
      <div className="mt-3"><Toggle name="is_published" defaultChecked={c?.is_published ?? true} label="Published" /></div>
    </ActionForm>
  );
}

function SponsorForm({ s }: { s?: SponsorRow }) {
  return (
    <ActionForm action={saveSponsor} resetOnSuccess={!s} submitLabel={s ? "Save" : "Add sponsor"}>
      {s && <input type="hidden" name="id" value={s.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <F label="Name"><input className="field" name="name" defaultValue={s?.name} required /></F>
        <F label="Tier">
          <select className="field" name="tier" defaultValue={s?.tier ?? "partner"}>
            {["title", "platinum", "gold", "community", "partner"].map((t) => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}
          </select>
        </F>
        <F label="Logo" className="sm:col-span-2"><MediaUpload kind="sponsors" inputName="logo_url" defaultValue={s?.logo_url} /></F>
        <F label="Website"><input className="field" name="url" defaultValue={s?.url ?? ""} /></F>
        <F label="Order"><input className="field" name="sort" type="number" defaultValue={s?.sort ?? 0} /></F>
        <F label="Blurb" className="sm:col-span-2"><textarea className="field" name="blurb" defaultValue={s?.blurb ?? ""} maxLength={300} /></F>
      </div>
      <div className="mt-3"><Toggle name="is_published" defaultChecked={s?.is_published ?? true} label="Published" /></div>
    </ActionForm>
  );
}
