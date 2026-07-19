import { describe, expect, it } from "vitest";
import { DvvParseError, parseDvvNameHtml } from "../functions/lib/dvv";

const sourceUrl = "https://nimipalvelu.dvv.fi/etunimihaku?nimi=lotta";

describe("parseDvvNameHtml", () => {
  it("parses decade rows, non-breaking-space counts and totals", () => {
    const html = `
      <span>Aineisto päivitetty 13.7.2026</span>
      <span>Haettu nimi: &quot;Lotta&quot;</span>
      <table>
        <thead><tr><th>Syntymä&shy;vuodet</th><th>Miehiä</th><th>Naisia</th><th>Yhteensä</th></tr></thead>
        <tbody>
          <tr><td>1980–1989</td><td>0</td><td>1 403</td><td>1 403</td></tr>
          <tr><td>2000–2009</td><td>0</td><td>3 802</td><td>3 802</td></tr>
        </tbody>
        <tfoot><tr><td>Yhteensä</td><td>0</td><td>12 387</td><td>12 387</td></tr></tfoot>
      </table>`;

    const result = parseDvvNameHtml(html, "lotta", sourceUrl);
    expect(result.name).toBe("Lotta");
    expect(result.updated).toBe("13.7.2026");
    expect(result.total).toBe(12387);
    expect(result.totalUnder).toBe(false);
    expect(result.women).toBe(12387);
    expect(result.decades[0].total).toBe(1403);
    expect(result.suppressed).toBe(false);
  });

  it("preserves privacy-suppressed values as null", () => {
    const html = `
      <span>Haettu nimi: &quot;Harvinainen&quot;</span>
      <table>
        <thead><tr><th>Syntymävuodet</th><th>Miehiä</th><th>Naisia</th><th>Yhteensä</th></tr></thead>
        <tbody><tr><td>2020–2026</td><td>alle 5</td><td>0</td><td>alle 5</td></tr></tbody>
        <tfoot><tr><td>Yhteensä</td><td>alle 5</td><td>0</td><td>alle 5</td></tr></tfoot>
      </table>`;

    const result = parseDvvNameHtml(html, "Harvinainen", sourceUrl);
    expect(result.total).toBe(5);
    expect(result.totalUnder).toBe(true);
    expect(result.suppressed).toBe(true);
  });

  it("reports a missing name", () => {
    expect(() =>
      parseDvvNameHtml(
        "<div>Väestötietojärjestelmässä ei ole hakemaasi etunimeä.</div>",
        "Qwerty",
        sourceUrl,
      ),
    ).toThrow(DvvParseError);
  });
});
