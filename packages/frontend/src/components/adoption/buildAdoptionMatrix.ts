import { AdoptionProgramRef, AdoptionRow, AdoptionStatusData } from "@/types/adoption";

// Fixed column order (spec §2.1). Any other statut is appended to the right.
export const STATUT_ORDER = ["information", "participation", "test", "formalisation"] as const;

const UNLINKED_ROW_ID = "__unlinked__";

export interface LogoEntry {
  companyName: string | null;
  logoUrl: string | null;
}

export interface MatrixCell {
  metier: LogoEntry[];
  tech: LogoEntry[];
  autre: LogoEntry[];
}

export interface MatrixColumn {
  key: string;
  label: string;
  count: number;
}

export interface MatrixRow {
  id: string;
  name: string;
}

export interface AdoptionMatrix {
  columns: MatrixColumn[];
  rows: MatrixRow[];
  getCell: (rowId: string, colKey: string) => MatrixCell;
  totalCompanies: number;
}

// Combining diacritical marks (U+0300–U+036F), built without literal combining
// chars in the source.
const COMBINING = new RegExp("[\\u0300-\\u036f]", "g");

const stripAccents = (s: string) => s.normalize("NFD").replace(COMBINING, "");

const norm = (s: string) => stripAccents(String(s || "")).toLowerCase().trim();

export const initials = (name: string | null | undefined): string => {
  if (!name) return "?";
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?"
  );
};

const classifyType = (raw: string | null): keyof MatrixCell => {
  const n = norm(raw || "");
  if (!n) return "autre";
  if (n.includes("metier")) return "metier";
  if (n.includes("tech")) return "tech";
  return "autre";
};

const emptyCell = (): MatrixCell => ({ metier: [], tech: [], autre: [] });

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** Order programs by the pgm_adopt RANK column (ascending); unranked go last. */
const orderPrograms = (programs: AdoptionProgramRef[]): AdoptionProgramRef[] =>
  programs
    .map((p, i) => ({ p, i }))
    .sort(
      (a, b) =>
        (a.p.rank ?? Number.POSITIVE_INFINITY) - (b.p.rank ?? Number.POSITIVE_INFINITY) ||
        a.i - b.i,
    )
    .map((x) => x.p);

/**
 * Pure transform: normalized adoption rows -> pivot matrix
 * (rows = programs, columns = statut, cells split by métier/tech/autre).
 */
export function buildAdoptionMatrix(data: AdoptionStatusData | undefined): AdoptionMatrix {
  const programs = data?.programs ?? [];
  const rawRows: AdoptionRow[] = data?.rows ?? [];

  // Rows: all known programs (ordered), + a virtual "unlinked" row when needed.
  const knownIds = new Set(programs.map((p) => p.id));
  const rows: MatrixRow[] = orderPrograms(programs).map((p) => ({
    id: p.id,
    name: p.name || "(sans nom)",
  }));
  const hasUnlinked = rawRows.some((r) => !r.programId || !knownIds.has(r.programId));
  if (hasUnlinked) rows.push({ id: UNLINKED_ROW_ID, name: "Non rattaché" });

  // Columns: fixed order first, unknown statuts appended right.
  const colKeys: string[] = [...STATUT_ORDER];
  const colLabels: Record<string, string> = {
    information: "Information",
    participation: "Participation",
    test: "Test",
    formalisation: "Formalisation",
  };

  const cells = new Map<string, MatrixCell>();
  const cellKey = (rowId: string, colKey: string) => `${rowId} ${colKey}`;
  const counts: Record<string, number> = {};
  let totalCompanies = 0;

  for (const r of rawRows) {
    const rowId = r.programId && knownIds.has(r.programId) ? r.programId : UNLINKED_ROW_ID;
    const statutRaw = (r.statut || "").trim() || "Non renseigné";
    const known = STATUT_ORDER.find((s) => s === norm(statutRaw));
    const colKey = known || norm(statutRaw);
    if (!known && !colKeys.includes(colKey)) {
      colKeys.push(colKey);
      colLabels[colKey] = capitalize(statutRaw);
    }

    const key = cellKey(rowId, colKey);
    if (!cells.has(key)) cells.set(key, emptyCell());
    const bucket = classifyType(r.typeMetier);
    cells.get(key)![bucket].push({ companyName: r.companyName, logoUrl: r.logoUrl });
    counts[colKey] = (counts[colKey] || 0) + 1;
    totalCompanies += 1;
  }

  const columns: MatrixColumn[] = colKeys.map((key) => ({
    key,
    label: colLabels[key] || capitalize(key),
    count: counts[key] || 0,
  }));

  const getCell = (rowId: string, colKey: string): MatrixCell =>
    cells.get(cellKey(rowId, colKey)) || emptyCell();

  return { columns, rows, getCell, totalCompanies };
}
