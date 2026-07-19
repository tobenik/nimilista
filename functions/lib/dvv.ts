import type { DecadeRow, NameResult } from "../../src/types";

const entityMap: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: "\u00a0",
  quot: '"',
};

export class DvvParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DvvParseError";
  }
}

function decodeEntities(value: string): string {
  return value.replace(/&(#x?[\da-f]+|[a-z]+);/gi, (entity, code: string) => {
    if (code[0] === "#") {
      const isHex = code[1]?.toLowerCase() === "x";
      const point = Number.parseInt(code.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      return Number.isFinite(point) ? String.fromCodePoint(point) : entity;
    }
    return entityMap[code.toLowerCase()] ?? entity;
  });
}

function textContent(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, " "))
    .replace(/[\t\r\n]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function parseCount(value: string): { value: number | null; under: boolean } {
  const under = /^alle\b/i.test(value.trim()) || value.trim() === "–";
  const normalized = value.replace(/[^\d]/g, "");
  if (!normalized) return { value: null, under };
  const parsed = Number.parseInt(normalized, 10);
  return { value: Number.isFinite(parsed) ? parsed : null, under };
}

function parseResultCells(html: string): string[] {
  const cells = [...html.matchAll(/<td(?:\s[^>]*)?>([\s\S]*?)<\/td>/gi)].map((cell) =>
    textContent(cell[1]),
  );
  const firstPeriod = cells.findIndex((cell) => /^(?:–1899|\d{4}–\d{4})$/.test(cell));
  return firstPeriod >= 0 ? cells.slice(firstPeriod) : [];
}

function findCanonicalName(html: string, fallback: string): string {
  const heading = html.match(/Haettu nimi:\s*(?:&quot;|\")([^<&\"]+)(?:&quot;|\")/i);
  if (heading?.[1]) return decodeEntities(heading[1]).trim();

  const title = html.match(/<title>([^<|]+)\s*\|/i);
  const titleName = title?.[1] ? textContent(title[1]).trim() : "";
  return titleName || fallback;
}

function findUpdatedDate(html: string): string | null {
  const updated = html.match(/Aineisto päivitetty\s*([^<]+)/i);
  return updated?.[1] ? textContent(updated[1]) : null;
}

function looksNotFound(html: string): boolean {
  const content = textContent(html).toLocaleLowerCase("fi");
  return (
    content.includes("väestötietojärjestelmässä ei ole hakemaasi etunimeä") ||
    content.includes("hakemaasi nimeä ei löytynyt") ||
    content.includes("nimeä ei löytynyt") ||
    content.includes("ei hakutuloksia")
  );
}

export function parseDvvNameHtml(html: string, query: string, sourceUrl: string): NameResult {
  const cells = parseResultCells(html);
  if (cells.length < 4) {
    if (looksNotFound(html)) {
      throw new DvvParseError(`Nimeä “${query}” ei löytynyt DVV:n nimipalvelusta.`);
    }
    throw new DvvParseError("DVV:n vastausta ei voitu tulkita. Yritä hetken kuluttua uudelleen.");
  }

  const decadeRows: DecadeRow[] = [];
  let men: number | null = null;
  let menUnder = false;
  let women: number | null = null;
  let womenUnder = false;
  let total: number | null = null;
  let totalUnder = false;

  for (let index = 0; index + 3 < cells.length; index += 4) {
    const row = cells.slice(index, index + 4);
    const label = row[0].replace(/\u00ad/g, "").trim();
    if (/^yhteensä$/i.test(label)) {
      const menCount = parseCount(row[1]);
      const womenCount = parseCount(row[2]);
      const totalCount = parseCount(row[3]);
      men = menCount.value;
      menUnder = menCount.under;
      women = womenCount.value;
      womenUnder = womenCount.under;
      total = totalCount.value;
      totalUnder = totalCount.under;
      continue;
    }
    if (!/\d{4}|1899/.test(label)) continue;
    const menCount = parseCount(row[1]);
    const womenCount = parseCount(row[2]);
    const totalCount = parseCount(row[3]);
    decadeRows.push({
      period: label,
      men: menCount.value,
      menUnder: menCount.under,
      women: womenCount.value,
      womenUnder: womenCount.under,
      total: totalCount.value,
      totalUnder: totalCount.under,
    });
  }

  if (decadeRows.length === 0) {
    throw new DvvParseError("DVV:n hakutuloksesta puuttuivat vuosikymmenet.");
  }

  const suppressed =
    menUnder ||
    womenUnder ||
    totalUnder ||
    decadeRows.some((row) => row.menUnder || row.womenUnder || row.totalUnder);

  return {
    name: findCanonicalName(html, query),
    updated: findUpdatedDate(html),
    men,
    menUnder,
    women,
    womenUnder,
    total,
    totalUnder,
    suppressed,
    decades: decadeRows,
    sourceUrl,
  };
}
