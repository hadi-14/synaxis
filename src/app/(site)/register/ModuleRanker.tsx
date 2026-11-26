"use client";
import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Motif } from "@/components/brand/Motif";
import type { Module } from "@/lib/types";
import { CloseIcon } from "@/components/ui/Icon";

/**
 * Drag-to-rank modules. Ranked cards are linked like microbots joining a chain.
 * Keyboard: Space to lift, arrows to move. Buttons provide ↑/↓/remove for everyone.
 */
export function ModuleRanker({ modules, value, max, onChange }: { modules: Module[]; value: number[]; max: number; onChange: (ids: number[]) => void }) {
  const compulsory = modules.filter((m) => m.is_compulsory);
  const optional = modules.filter((m) => !m.is_compulsory);
  const ranked = value.map((id) => optional.find((m) => m.id === id)).filter(Boolean) as Module[];
  const pool = optional.filter((m) => !value.includes(m.id));
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 160, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = value.indexOf(Number(e.active.id));
    const to = value.indexOf(Number(e.over.id));
    onChange(arrayMove(value, from, to));
  };
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    onChange(arrayMove(value, i, j));
  };

  return (
    <div className="mt-5 space-y-5">
      <ul className="space-y-2" aria-label="Compulsory modules">
        {compulsory.map((m) => (
          <li key={m.id} className="card flex items-center gap-3 border-2 !border-[var(--primary)] p-3" aria-label={`${m.name}, compulsory, locked`}>
            <span aria-hidden className="grid h-8 w-8 place-items-center rounded-full bg-[var(--primary)] text-sm">🔒</span>
            <Motif motif={m.motif} accent={m.accent} className="h-9 w-9 text-[var(--ink)]" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{m.name}</p>
              <p className="truncate text-xs text-[var(--ink-muted)]">{m.subject} · {m.character}</p>
            </div>
            <span className="rounded-full bg-[var(--primary)] px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--primary-ink)]">Compulsory</span>
          </li>
        ))}
      </ul>

      <div>
        <p className="mb-2 text-sm font-semibold">Your ranking ({ranked.length}/{max})</p>
        {ranked.length === 0 ? (
          <p className="rounded-[var(--radius-sm)] border-2 border-dashed border-[var(--line)] p-4 text-center text-sm text-[var(--ink-muted)]">
            Tap a module below to add it to your ranking.
          </p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={value.map(String)} strategy={verticalListSortingStrategy}>
              <ol className="relative space-y-2">
                {/* microbot chain linking the ranked cards */}
                <span aria-hidden className="absolute bottom-6 left-[27px] top-6 w-0 border-l-2 border-dotted border-[var(--ink-muted)]/50" />
                {ranked.map((m, i) => (
                  <RankedItem key={m.id} m={m} i={i} total={ranked.length} onUp={() => move(i, -1)} onDown={() => move(i, 1)} onRemove={() => onChange(value.filter((x) => x !== m.id))} />
                ))}
              </ol>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {pool.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold">Available modules</p>
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2">
            {pool.map((m) => (
              <li key={m.id} className="min-w-0">
                <button
                  type="button"
                  disabled={ranked.length >= max}
                  onClick={() => onChange([...value, m.id])}
                  className="card flex w-full items-center gap-3 p-3 text-left transition-colors hover:border-[var(--accent-c)] disabled:opacity-50"
                  style={{ "--accent-c": m.accent } as React.CSSProperties}
                  aria-label={`Add ${m.name} to ranking`}
                >
                  <Motif motif={m.motif} accent={m.accent} className="h-9 w-9 shrink-0 text-[var(--ink)]" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{m.name}</span>
                    <span className="block truncate text-xs text-[var(--ink-muted)]">{m.subject} · {m.tagline}</span>
                  </span>
                  <span aria-hidden className="text-lg font-bold text-[var(--primary-text)]">+</span>
                </button>
              </li>
            ))}
          </ul>
          {ranked.length >= max && <p className="mt-2 text-xs text-[var(--ink-muted)]">You&apos;ve ranked the maximum. Remove one to swap.</p>}
        </div>
      )}
    </div>
  );
}

function RankedItem({ m, i, total, onUp, onDown, onRemove }: { m: Module; i: number; total: number; onUp: () => void; onDown: () => void; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: String(m.id) });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, borderLeftColor: m.accent }}
      className={`card relative flex items-center gap-2 border-l-4 p-2 pr-1 sm:gap-3 sm:p-3 ${isDragging ? "z-10 shadow-xl ring-2 ring-[var(--accent)]" : ""}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="grid h-10 w-10 shrink-0 cursor-grab touch-none place-items-center rounded-full bg-[var(--ink)] font-mono text-sm font-bold text-[var(--bg)] active:cursor-grabbing"
        aria-label={`Rank ${i + 1}: ${m.name}. Press space to drag`}
      >
        {i + 1}
      </button>
      <Motif motif={m.motif} accent={m.accent} className="hidden h-9 w-9 shrink-0 text-[var(--ink)] sm:block" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{m.name}</p>
        <p className="truncate text-xs text-[var(--ink-muted)]">{m.subject}</p>
      </div>
      <div className="flex shrink-0 items-center">
        <button type="button" onClick={onUp} disabled={i === 0} className="grid h-10 w-9 place-items-center rounded-full disabled:opacity-30" aria-label={`Move ${m.name} up`}>↑</button>
        <button type="button" onClick={onDown} disabled={i === total - 1} className="grid h-10 w-9 place-items-center rounded-full disabled:opacity-30" aria-label={`Move ${m.name} down`}>↓</button>
        <button type="button" onClick={onRemove} className="grid h-10 w-9 place-items-center rounded-full text-[var(--danger)]" aria-label={`Remove ${m.name}`}><CloseIcon /></button>
      </div>
    </li>
  );
}
