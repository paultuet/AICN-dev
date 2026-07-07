import { AxiosError } from "axios";

/**
 * Human-readable error line for the adoption dashboards, surfacing the HTTP
 * status (and the underlying Airtable status when the backend passes it through)
 * per spec §2.4 — instead of a fixed generic sentence.
 */
export function adoptionErrorText(error: unknown): string {
  const e = error as AxiosError<{ error?: string; status?: number }> | undefined;
  const httpStatus = e?.response?.status;
  const body = e?.response?.data;
  const message = body?.error || e?.message || "Erreur inconnue";
  const airtable = body?.status ? ` (Airtable ${body.status})` : "";
  return httpStatus ? `Erreur ${httpStatus}${airtable} — ${message}` : message;
}
