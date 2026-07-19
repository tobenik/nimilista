import { readFile, writeFile } from "node:fs/promises";

const apiBase = (process.env.NIMILISTA_API_BASE ?? "https://nimilista.pages.dev").replace(/\/$/, "");
const categories = JSON.parse(await readFile(new URL("../data/shortlist-names.json", import.meta.url), "utf8"));
const names = categories.flatMap((category) => category.names);
const results = new Array(names.length);
let cursor = 0;

function peakDecade(decades) {
  return decades.reduce((peak, row) => {
    if (row.total === null) return peak;
    return !peak || row.total > peak.total ? row : peak;
  }, null);
}

async function fetchName(name) {
  const response = await fetch(`${apiBase}/api/name?schema=2&name=${encodeURIComponent(name)}`);
  const body = await response.json();

  if (!response.ok) {
    return {
      found: false,
      name,
      message: body.error ?? "Nimeä ei löytynyt DVV:n nimipalvelusta.",
    };
  }

  const peak = peakDecade(body.decades);
  return {
    found: true,
    name: body.name,
    updated: body.updated,
    total: body.total,
    totalUnder: body.totalUnder,
    peakPeriod: peak?.period ?? null,
    peakTotal: peak?.total ?? null,
    peakUnder: peak?.totalUnder ?? false,
    sourceUrl: body.sourceUrl,
  };
}

async function worker() {
  while (cursor < names.length) {
    const index = cursor++;
    const name = names[index];
    try {
      results[index] = await fetchName(name);
      process.stdout.write(`${results[index].found ? "✓" : "–"} ${name}\n`);
    } catch (error) {
      throw new Error(`DVV-tietojen haku epäonnistui nimelle ${name}: ${error.message}`);
    }
  }
}

await Promise.all(Array.from({ length: 3 }, () => worker()));

const updatedDates = [...new Set(results.filter((item) => item.found && item.updated).map((item) => item.updated))];
if (updatedDates.length !== 1) {
  throw new Error(`Odotettiin yhtä DVV:n päivityspäivää, saatiin: ${updatedDates.join(", ") || "ei yhtään"}`);
}

const output = {
  updated: updatedDates[0],
  generatedAt: new Date().toISOString(),
  items: Object.fromEntries(names.map((name, index) => [name.toLocaleLowerCase("fi"), results[index]])),
};

await writeFile(
  new URL("../src/shortlist-dvv.json", import.meta.url),
  `${JSON.stringify(output, null, 2)}\n`,
  "utf8",
);

process.stdout.write(`Tallennettu ${results.length} nimeä (DVV ${output.updated}).\n`);
