import "server-only";
import { createAdminClient } from "./supabase/admin";

type AuditEntry = {
  actor: { id: string; email: string } | null;
  action: string;
  entity: string;
  entityId?: string | number | null;
  teamId?: string | null;
  before?: unknown;
  after?: unknown;
  note?: string | null;
};

export async function audit(e: AuditEntry) {
  const admin = createAdminClient();
  const { error } = await admin.from("audit_logs").insert({
    actor_id: e.actor?.id ?? null,
    actor_email: e.actor?.email ?? null,
    action: e.action,
    entity: e.entity,
    entity_id: e.entityId != null ? String(e.entityId) : null,
    team_id: e.teamId ?? null,
    before: (e.before ?? null) as never,
    after: (e.after ?? null) as never,
    note: e.note ?? null,
  });
  if (error) console.error("audit log failed", error.message);
}
