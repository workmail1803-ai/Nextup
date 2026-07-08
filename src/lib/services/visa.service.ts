// =============================================================================
// VisaService — per-client visa record + its document checklist.
// =============================================================================

import { supabase } from "@/lib/supabase";
import type {
  ClientVisa,
  VisaDocStatus,
  VisaDocumentItem,
  VisaStatus,
} from "@/lib/types/client";

const DEFAULT_DOCS = [
  "Valid Passport",
  "Passport-size Photographs",
  "University Offer / Admission Letter",
  "Bank Statement / Financial Proof",
  "Sponsorship / Affidavit of Support",
  "IELTS / Language Certificate",
  "Academic Transcripts & Certificates",
  "Accommodation Proof",
  "Health / Travel Insurance",
  "Completed Visa Application Form",
];

export interface VisaWithDocs extends ClientVisa {
  documents: VisaDocumentItem[];
}

export const VisaService = {
  /** The visa record + ordered documents for a client, or null if none. */
  async getForClient(clientId: string): Promise<VisaWithDocs | null> {
    const { data, error } = await supabase
      .from("client_visa")
      .select("*, documents:visa_document_items(*)")
      .eq("client_id", clientId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const visa = data as unknown as VisaWithDocs;
    visa.documents = (visa.documents ?? []).sort((a, b) => a.sort_order - b.sort_order);
    return visa;
  },

  /** Create a visa record (+ default checklist) for a client if none exists. */
  async ensureForClient(clientId: string): Promise<VisaWithDocs> {
    const existing = await VisaService.getForClient(clientId);
    if (existing) return existing;

    const { data: visa, error } = await supabase
      .from("client_visa")
      .insert({ client_id: clientId, status: "collecting" })
      .select()
      .single();
    if (error) throw error;

    const rows = DEFAULT_DOCS.map((name, i) => ({
      visa_id: (visa as ClientVisa).id,
      document_name: name,
      status: "pending" as VisaDocStatus,
      sort_order: i + 1,
    }));
    const { error: docErr } = await supabase.from("visa_document_items").insert(rows);
    if (docErr) throw docErr;

    return (await VisaService.getForClient(clientId))!;
  },

  async updateVisa(
    id: string,
    patch: { status?: VisaStatus; vfs_appointment_date?: string | null; notes?: string | null },
  ): Promise<ClientVisa> {
    const { data, error } = await supabase
      .from("client_visa")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as ClientVisa;
  },

  async updateDocument(
    id: string,
    patch: { status?: VisaDocStatus; note?: string | null },
  ): Promise<VisaDocumentItem> {
    const { data, error } = await supabase
      .from("visa_document_items")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as VisaDocumentItem;
  },

  async addDocument(visaId: string, name: string, sortOrder: number): Promise<VisaDocumentItem> {
    const { data, error } = await supabase
      .from("visa_document_items")
      .insert({ visa_id: visaId, document_name: name, sort_order: sortOrder })
      .select()
      .single();
    if (error) throw error;
    return data as VisaDocumentItem;
  },

  async removeDocument(id: string): Promise<void> {
    const { error } = await supabase.from("visa_document_items").delete().eq("id", id);
    if (error) throw error;
  },
};
