// =============================================================================
// ClientService — reads/writes for `clients`, with consultant + meetings embed.
// =============================================================================

// Every query here is staff-only, so it must carry the signed-in staff JWT —
// the anon client would run as role `anon` and is_staff()/is_admin() would
// see nobody. Aliased so the body of this module reads unchanged.
import { staffSupabase as supabase } from "@/lib/auth/supabase-staff";
import type {
  Client,
  ClientInsert,
  ClientUpdate,
  ClientWithRelations,
} from "@/lib/types/client";

const TABLE = "clients";
// `clients` has TWO FKs to staff (primary_consultant_id + added_by_staff_id),
// so each embed must name its constraint to stay unambiguous.
const WITH_RELATIONS =
  "*, consultant:staff!clients_primary_consultant_id_fkey(id,full_name)," +
  " added_by:staff!clients_added_by_staff_id_fkey(id,full_name)," +
  " client_meetings(scheduled_at,status)";

export const ClientService = {
  /** All clients with consultant + meetings embedded (admin CRM list). */
  async listWithRelations(): Promise<ClientWithRelations[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(WITH_RELATIONS)
      .order("full_name", { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as ClientWithRelations[];
  },

  /** Clients assigned to one consultant (staff portal view). */
  async listForConsultant(staffId: string): Promise<ClientWithRelations[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(WITH_RELATIONS)
      .eq("primary_consultant_id", staffId)
      .order("full_name", { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as ClientWithRelations[];
  },

  async getById(id: string): Promise<ClientWithRelations | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(WITH_RELATIONS)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data as unknown as ClientWithRelations) ?? null;
  },

  async create(input: ClientInsert): Promise<Client> {
    const { data, error } = await supabase.from(TABLE).insert(input).select().single();
    if (error) throw error;
    return data as Client;
  },

  async update(id: string, patch: ClientUpdate): Promise<Client> {
    const { data, error } = await supabase
      .from(TABLE)
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Client;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) throw error;
  },

  /** Realtime — any change to clients. Returns an unsubscribe fn. */
  subscribe(onChange: () => void): () => void {
    const channel = supabase
      .channel("clients-all")
      .on("postgres_changes", { event: "*", schema: "public", table: TABLE }, () => onChange())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  },
};
