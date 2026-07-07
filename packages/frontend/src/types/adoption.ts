// Wire types for the two adoption dashboards (mirrors aicn.adoption handlers).

export interface AdoptionProgramRef {
  id: string;
  name: string | null;
  /** Presentation order from the pgm_adopt RANK column. */
  rank?: number | null;
}

/** One adoption entry: a company at a given statut for a given program. */
export interface AdoptionRow {
  id: string;
  programId: string | null;
  programName: string | null;
  statut: string | null;
  typeMetier: string | null;
  companyName: string | null;
  logoUrl: string | null;
}

export interface AdoptionStatusData {
  programs: AdoptionProgramRef[];
  rows: AdoptionRow[];
}

export interface AdoptionEvent {
  id: string;
  programId: string | null;
  numEvent: number | string | null;
  titre: string | null;
  date: string | null;
}

export interface AdoptionProgramme {
  id: string;
  name: string | null;
  rank?: number | null;
  description: string | null;
  cible: string | null;
  livrables: string | null;
  communication: string | null;
  events: AdoptionEvent[];
}

export interface AdoptionProgrammesData {
  programmes: AdoptionProgramme[];
}

export interface ProgramRegistration {
  id: string;
  programAirtableId: string;
  programName: string | null;
  organizations: string[];
  submittedBy: string;
  submittedByEmail: string | null;
  submittedByName: string | null;
  createdAt: string;
}

export interface SubmitRegistrationInput {
  programId: string;
  programName: string | null;
  organizations: string[];
}
