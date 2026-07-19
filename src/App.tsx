import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { DecadeRow, NameResult, SearchResult } from "./types";

const MAX_NAMES = 8;
const EXAMPLES = ["Lotta", "Aino", "Väinö"];
const numberFormatter = new Intl.NumberFormat("fi-FI");

function formatCount(value: number | null, under = false): string {
  if (under) return `alle ${numberFormatter.format(value ?? 5)}`;
  return value === null ? "–" : numberFormatter.format(value);
}

function pluralizeNames(value: number | null): string {
  if (value === null) return "henkilöllä";
  return value === 1 ? "henkilöllä" : "henkilöllä";
}

function parseNames(value: string): string[] {
  const seen = new Set<string>();
  return value
    .split(/[,;\n]+/)
    .map((name) => name.trim())
    .filter(Boolean)
    .filter((name) => {
      const key = name.toLocaleLowerCase("fi");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function peakDecade(result: NameResult): DecadeRow | null {
  return result.decades.reduce<DecadeRow | null>((peak, row) => {
    if (row.total === null) return peak;
    return !peak || (peak.total ?? 0) < row.total ? row : peak;
  }, null);
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5" />
    </svg>
  );
}

function ArrowUpRight() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M5 15 15 5M7 5h8v8" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M8 12.1 12.1 8M6.5 14.5l-1 .9a3.4 3.4 0 0 1-4.8-4.8l3.2-3.2a3.4 3.4 0 0 1 4.8 0M13.5 5.5l1-.9a3.4 3.4 0 0 1 4.8 4.8l-3.2 3.2a3.4 3.4 0 0 1-4.8 0" />
    </svg>
  );
}

function ResultSkeleton() {
  return (
    <article className="result-card skeleton-card" aria-label="Nimitietoja ladataan">
      <div className="skeleton skeleton-kicker" />
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-number" />
      <div className="skeleton skeleton-line" />
      <div className="skeleton skeleton-chart" />
    </article>
  );
}

function MiniTimeline({ result }: { result: NameResult }) {
  const values = result.decades.map((row) => row.total ?? 0);
  const max = Math.max(...values, 1);

  return (
    <div className="mini-timeline" aria-hidden="true">
      {result.decades.map((row) => {
        const height = row.total === null ? 8 : Math.max(4, Math.round((row.total / max) * 100));
        return (
          <span
            className={row.total === null ? "mini-bar mini-bar-unknown" : "mini-bar"}
            key={row.period}
            style={{ height: `${height}%` }}
          />
        );
      })}
    </div>
  );
}

function ResultCard({
  result,
  rank,
  selected,
  onSelect,
}: {
  result: NameResult;
  rank: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const peak = peakDecade(result);
  const total = result.total;

  return (
    <button
      className="result-card"
      data-selected={selected}
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className="card-topline">
        <span className="rank-label">#{rank} vertailussa</span>
        <span className="detail-label">Näytä tiedot <span aria-hidden="true">↘</span></span>
      </span>
      <span className="result-name">{result.name}</span>
      <span className="result-total">{formatCount(total, result.totalUnder)}</span>
      <span className="result-unit">{pluralizeNames(total)} väestötietojärjestelmässä</span>
      <span className="card-divider" />
      <span className="peak-line">
        <span>Suosituin kausi</span>
        <strong>{peak ? peak.period : "Ei tarkkaa tietoa"}</strong>
      </span>
      <MiniTimeline result={result} />
    </button>
  );
}

function DecadeChart({ result }: { result: NameResult }) {
  const max = Math.max(...result.decades.map((row) => row.total ?? 0), 1);

  return (
    <div className="chart-scroll" role="img" aria-label={`${result.name}: nimien määrät syntymävuosittain`}>
      <div className="decade-chart">
        <div className="chart-grid" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="chart-bars">
          {result.decades.map((row) => {
            const total = row.total ?? 0;
            const height = row.total === null ? 6 : Math.max(2, (total / max) * 100);
            const men = row.men ?? 0;
            const women = row.women ?? 0;
            const knownGenderTotal = Math.max(men + women, 1);
            const label = `${row.period}: ${formatCount(row.total, row.totalUnder)} yhteensä, ${formatCount(row.men, row.menUnder)} miehillä ja ${formatCount(row.women, row.womenUnder)} naisilla`;

            return (
              <div className="bar-column" key={row.period}>
                <div className="bar-value">{row.total === max ? formatCount(row.total, row.totalUnder) : ""}</div>
                <div className="bar-track">
                  <div
                    className={row.total === null ? "bar-stack bar-unknown" : "bar-stack"}
                    style={{ height: `${height}%` }}
                    title={label}
                  >
                    {row.total !== null && (
                      <>
                        <span
                          className="bar-men"
                          style={{ flexBasis: `${(men / knownGenderTotal) * 100}%` }}
                        />
                        <span
                          className="bar-women"
                          style={{ flexBasis: `${(women / knownGenderTotal) * 100}%` }}
                        />
                      </>
                    )}
                  </div>
                </div>
                <div className="bar-label">{row.period.replace(/–\d{4}/, "")}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DetailPanel({ result }: { result: NameResult }) {
  const genderTotal = (result.men ?? 0) + (result.women ?? 0);
  const menShare = genderTotal > 0 ? ((result.men ?? 0) / genderTotal) * 100 : 0;
  const womenShare = genderTotal > 0 ? ((result.women ?? 0) / genderTotal) * 100 : 0;

  return (
    <section className="detail-panel" aria-labelledby="detail-title">
      <div className="detail-heading">
        <div>
          <span className="eyebrow">Tarkempi jakauma</span>
          <h2 id="detail-title">{result.name} vuosikymmenittäin</h2>
        </div>
        <a className="source-link" href={result.sourceUrl} target="_blank" rel="noreferrer">
          Avaa DVV:ssä <ArrowUpRight />
        </a>
      </div>

      <div className="gender-summary">
        <div className="gender-numbers">
          <span><i className="legend-dot dot-men" />Miehet <strong>{formatCount(result.men, result.menUnder)}</strong></span>
          <span><i className="legend-dot dot-women" />Naiset <strong>{formatCount(result.women, result.womenUnder)}</strong></span>
        </div>
        {genderTotal > 0 && (
          <div className="gender-track" aria-label={`Miehiä ${menShare.toFixed(1)} %, naisia ${womenShare.toFixed(1)} %`}>
            <span className="gender-men" style={{ width: `${menShare}%` }} />
            <span className="gender-women" style={{ width: `${womenShare}%` }} />
          </div>
        )}
      </div>

      <DecadeChart result={result} />

      <details className="data-table-wrap">
        <summary>Näytä tarkat luvut taulukkona</summary>
        <div className="table-scroll">
          <table>
            <thead>
              <tr><th>Syntymävuodet</th><th>Miehet</th><th>Naiset</th><th>Yhteensä</th></tr>
            </thead>
            <tbody>
              {result.decades.map((row) => (
                <tr key={row.period}>
                  <td>{row.period}</td><td>{formatCount(row.men, row.menUnder)}</td><td>{formatCount(row.women, row.womenUnder)}</td><td>{formatCount(row.total, row.totalUnder)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr><td>Yhteensä</td><td>{formatCount(result.men, result.menUnder)}</td><td>{formatCount(result.women, result.womenUnder)}</td><td>{formatCount(result.total, result.totalUnder)}</td></tr>
            </tfoot>
          </table>
        </div>
      </details>

      {result.suppressed && (
        <p className="privacy-note">Alle viiden henkilön määriä ei näytetä tarkasti yksityisyyden suojaamiseksi.</p>
      )}
    </section>
  );
}

export default function App() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [copied, setCopied] = useState(false);
  const requestRef = useRef<AbortController | null>(null);

  async function searchNames(names: string[], updateUrl = true) {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setSelectedName(null);
    setResults(names.map((query) => ({ query, status: "loading" })));

    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set("nimet", names.join(","));
      window.history.pushState({}, "", url);
    }

    await Promise.all(
      names.map(async (query) => {
        try {
          const response = await fetch(`/api/name?schema=2&name=${encodeURIComponent(query)}`, {
            signal: controller.signal,
          });
          const body = (await response.json()) as NameResult | { error?: string };
          if (!response.ok) throw new Error("error" in body ? body.error : "Nimen haku epäonnistui.");
          if (controller.signal.aborted) return;
          const data = body as NameResult;
          setResults((current) =>
            current.map((item) => (item.query === query ? { query, status: "success", data } : item)),
          );
        } catch (error) {
          if (controller.signal.aborted) return;
          const message = error instanceof Error ? error.message : "Nimen haku epäonnistui.";
          setResults((current) =>
            current.map((item) => (item.query === query ? { query, status: "error", message } : item)),
          );
        }
      }),
    );
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const names = parseNames(params.get("nimet") ?? "");
    if (names.length > 0) {
      setInput(names.join(", "));
      void searchNames(names.slice(0, MAX_NAMES), false);
    }
    return () => requestRef.current?.abort();
  }, []);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const names = parseNames(input);
    if (names.length === 0) {
      setFormError("Kirjoita vähintään yksi etunimi.");
      return;
    }
    if (names.length > MAX_NAMES) {
      setFormError(`Voit vertailla enintään ${MAX_NAMES} nimeä kerralla.`);
      return;
    }
    setFormError("");
    void searchNames(names);
  }

  function useExamples() {
    const value = EXAMPLES.join(", ");
    setInput(value);
    setFormError("");
    void searchNames(EXAMPLES);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  const successful = useMemo(
    () =>
      results
        .filter((item): item is Extract<SearchResult, { status: "success" }> => item.status === "success")
        .sort((a, b) => (b.data.total ?? -1) - (a.data.total ?? -1)),
    [results],
  );
  const selected = successful.find((item) => item.data.name === selectedName)?.data ?? successful[0]?.data;
  const isLoading = results.some((item) => item.status === "loading");
  const errors = results.filter((item): item is Extract<SearchResult, { status: "error" }> => item.status === "error");
  const updated = successful.find((item) => item.data.updated)?.data.updated;

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="Nimilista etusivu">
          <span className="brand-mark">N</span>
          <span>Nimilista</span>
        </a>
        <a className="data-badge" href="https://nimipalvelu.dvv.fi/" target="_blank" rel="noreferrer">
          <span className="live-dot" /> Data: DVV <ArrowUpRight />
        </a>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">Suomalaisten etunimien tilastot</span>
            <h1>Kuinka suosittu<br />nimi on?</h1>
            <p>Hae yksi nimi tai vertaile useampaa. Näet kuinka monella nimi on ja milloin se oli suosituimmillaan.</p>
          </div>

          <form className="search-panel" onSubmit={handleSubmit}>
            <label htmlFor="names">Etunimet</label>
            <div className="search-row">
              <span className="input-icon"><SearchIcon /></span>
              <input
                id="names"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Esim. Lotta, Aino, Väinö"
                autoComplete="off"
                spellCheck="false"
                aria-describedby={formError ? "search-error" : "search-hint"}
              />
              <button className="search-button" type="submit">
                <span>Hae nimet</span><span aria-hidden="true">→</span>
              </button>
            </div>
            <div className="search-meta">
              <p id={formError ? "search-error" : "search-hint"} className={formError ? "form-error" : "search-hint"}>
                {formError || `Erottele nimet pilkulla · enintään ${MAX_NAMES} nimeä`}
              </p>
              <button type="button" className="example-button" onClick={useExamples}>Kokeile esimerkkiä</button>
            </div>
          </form>
        </section>

        {results.length > 0 && (
          <section className="results-section" aria-labelledby="results-title" aria-busy={isLoading}>
            <div className="section-heading">
              <div>
                <span className="eyebrow">Hakutulokset</span>
                <h2 id="results-title">Nimet vertailussa</h2>
              </div>
              <div className="section-actions">
                {updated && <span className="updated-label">Päivitetty {updated}</span>}
                <button className="copy-button" type="button" onClick={copyLink} disabled={successful.length === 0}>
                  <LinkIcon /> {copied ? "Linkki kopioitu" : "Kopioi vertailu"}
                </button>
              </div>
            </div>

            <div className="results-grid">
              {successful.map((item, index) => (
                <ResultCard
                  key={item.query}
                  result={item.data}
                  rank={index + 1}
                  selected={(selected?.name ?? selectedName) === item.data.name}
                  onSelect={() => setSelectedName(item.data.name)}
                />
              ))}
              {results.filter((item) => item.status === "loading").map((item) => <ResultSkeleton key={item.query} />)}
            </div>

            {errors.length > 0 && (
              <div className="error-list" role="status">
                {errors.map((error) => (
                  <p key={error.query}><strong>{error.query}</strong><span>{error.message}</span></p>
                ))}
              </div>
            )}

            {selected && <DetailPanel key={selected.name} result={selected} />}
          </section>
        )}

        {results.length === 0 && (
          <section className="empty-section" aria-label="Esimerkkitietoja">
            <p>Yksi haku kertoo enemmän kuin arvaus.</p>
            <div className="empty-rule" />
            <span>Ensimmäiset ja muut etunimet · elävät ja kuolleet henkilöt</span>
          </section>
        )}
      </main>

      <footer className="site-footer">
        <div>
          <strong>Nimilista</strong>
          <p>Epävirallinen näkymä Digi- ja väestötietoviraston julkisiin nimitilastoihin.</p>
        </div>
        <div className="footer-links">
          <a href="https://nimipalvelu.dvv.fi/" target="_blank" rel="noreferrer">DVV:n nimipalvelu <ArrowUpRight /></a>
          <span>Alle 5 henkilön määriä ei näytetä.</span>
        </div>
      </footer>
    </div>
  );
}
