import { describe, expect, it } from "vitest";
import { buildAdoptionMatrix, initials, STATUT_ORDER } from "./buildAdoptionMatrix";
import { AdoptionStatusData } from "@/types/adoption";

// Deliberately out of order; the RANK column drives presentation order.
const programs = [
  { id: "rec7Woz", name: "Adoption métier des nomenclatures des missions et responsabilités", rank: 1 },
  { id: "recfVb5", name: "Information générale AICN", rank: 5 },
  { id: "recjYy5", name: "Adoption technique des référentiels d'interopérabilité", rank: 4 },
  { id: "reclEsb", name: "Adoption Data Spaces", rank: 6 },
  { id: "recmtym", name: "Adoption technique des nomenclatures de missions et responsabilités", rank: 2 },
  { id: "recyNP", name: "Adoption métier des référentiels d'interopérabilité", rank: 3 },
];

const rows = [
  { id: "r1", programId: "reclEsb", programName: "Adoption Data Spaces", statut: "Participation", typeMetier: "Métier", companyName: "Vinci", logoUrl: "http://x/logo.png" },
  { id: "r2", programId: "recjYy5", programName: "x", statut: "Participation", typeMetier: "Tech", companyName: "Beeldi", logoUrl: null },
  { id: "r3", programId: "recyNP", programName: "x", statut: "Information", typeMetier: "MÉTIER", companyName: "Acme", logoUrl: null },
  { id: "r4", programId: null, programName: null, statut: "Information", typeMetier: "Tech", companyName: "Orphan", logoUrl: null },
  { id: "r5", programId: "reclEsb", programName: "x", statut: "Signé", typeMetier: "Autre chose", companyName: "X", logoUrl: null },
  { id: "r6", programId: "reclEsb", programName: "x", statut: "test", typeMetier: null, companyName: "Y", logoUrl: null },
];

const data: AdoptionStatusData = { programs, rows };

describe("buildAdoptionMatrix — columns (spec §2.1)", () => {
  const m = buildAdoptionMatrix(data);

  it("keeps the fixed statut order first", () => {
    expect(m.columns.slice(0, 4).map((c) => c.key)).toEqual([...STATUT_ORDER]);
  });

  it("appends unknown statuts to the right (accent-stripped key, readable label)", () => {
    const last = m.columns[m.columns.length - 1];
    expect(last.key).toBe("signe"); // internal key is normalized (no accents)
    expect(last.label).toBe("Signé"); // label keeps the original text
  });

  it("computes per-column counts", () => {
    const byKey = Object.fromEntries(m.columns.map((c) => [c.key, c.count]));
    expect(byKey.information).toBe(2); // r3 + r4
    expect(byKey.participation).toBe(2); // r1 + r2
    expect(byKey.test).toBe(1); // r6
    expect(byKey.formalisation).toBe(0);
    expect(byKey["signe"]).toBe(1); // r5 (unknown statut, accent-stripped key)
  });
});

describe("buildAdoptionMatrix — rows (RANK order, spec §1.2)", () => {
  const m = buildAdoptionMatrix(data);
  const ids = m.rows.map((r) => r.id);

  it("orders rows by the pgm_adopt RANK column", () => {
    expect(ids.slice(0, 6)).toEqual([
      "rec7Woz", // 1
      "recmtym", // 2
      "recyNP", // 3
      "recjYy5", // 4
      "recfVb5", // 5
      "reclEsb", // 6
    ]);
  });

  it("appends programs without a rank after the ranked ones", () => {
    const d2 = { programs: [...programs, { id: "recNoRank", name: "Sans rang" }], rows };
    const ranked = buildAdoptionMatrix(d2).rows
      .filter((r) => r.name !== "Non rattaché")
      .map((r) => r.id);
    expect(ranked[ranked.length - 1]).toBe("recNoRank");
  });

  it("creates exactly one 'Non rattaché' row for unlinked entries (no phantom dup)", () => {
    const unlinked = m.rows.filter((r) => r.name === "Non rattaché");
    expect(unlinked).toHaveLength(1);
    expect(m.rows[m.rows.length - 1].name).toBe("Non rattaché");
    expect(m.rows).toHaveLength(7); // 6 programs + 1 unlinked
  });
});

describe("buildAdoptionMatrix — cell bucketing (spec §2.2)", () => {
  const m = buildAdoptionMatrix(data);

  it("routes Métier/Tech case- and accent-insensitively", () => {
    expect(m.getCell("reclEsb", "participation").metier.map((e) => e.companyName)).toEqual(["Vinci"]);
    expect(m.getCell("recjYy5", "participation").tech.map((e) => e.companyName)).toEqual(["Beeldi"]);
    expect(m.getCell("recyNP", "information").metier).toHaveLength(1); // "MÉTIER" -> metier
  });

  it("routes unknown / null type to 'autre'", () => {
    expect(m.getCell("reclEsb", "signe").autre.map((e) => e.companyName)).toEqual(["X"]);
    expect(m.getCell("reclEsb", "test").autre.map((e) => e.companyName)).toEqual(["Y"]);
  });

  it("puts unlinked entries in the 'Non rattaché' row", () => {
    const unlinkedId = m.rows[m.rows.length - 1].id;
    expect(m.getCell(unlinkedId, "information").tech.map((e) => e.companyName)).toEqual(["Orphan"]);
  });

  it("preserves the logo URL and returns empty cells for gaps", () => {
    expect(m.getCell("reclEsb", "participation").metier[0].logoUrl).toBe("http://x/logo.png");
    expect(m.getCell("recyNP", "formalisation")).toEqual({ metier: [], tech: [], autre: [] });
  });

  it("counts total companies", () => {
    expect(m.totalCompanies).toBe(6);
  });
});

describe("buildAdoptionMatrix — empty input", () => {
  it("returns the fixed columns and no rows", () => {
    const m = buildAdoptionMatrix(undefined);
    expect(m.columns.map((c) => c.key)).toEqual([...STATUT_ORDER]);
    expect(m.rows).toHaveLength(0);
    expect(m.totalCompanies).toBe(0);
  });
});

describe("initials", () => {
  it("takes the first letter of the first two words", () => {
    expect(initials("Vinci Facilities")).toBe("VF");
    expect(initials("Acme")).toBe("A");
  });
  it("falls back to ? for empty / null", () => {
    expect(initials("")).toBe("?");
    expect(initials(null)).toBe("?");
    expect(initials(undefined)).toBe("?");
  });
});
