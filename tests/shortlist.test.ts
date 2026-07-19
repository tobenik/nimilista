import { describe, expect, it } from "vitest";
import shortlistNames from "../data/shortlist-names.json";
import shortlistDvv from "../src/shortlist-dvv.json";

describe("curated shortlist", () => {
  const names = shortlistNames.flatMap((category) => category.names);
  const keys = names.map((name) => name.toLocaleLowerCase("fi"));

  it("preserves all four groups and removes duplicate spellings", () => {
    expect(shortlistNames.map((category) => category.names.length)).toEqual([25, 20, 8, 1]);
    expect(names).toHaveLength(54);
    expect(new Set(keys).size).toBe(names.length);
    expect(keys.filter((name) => name === "isla")).toHaveLength(1);
  });

  it("has a DVV snapshot for every listed name", () => {
    expect(Object.keys(shortlistDvv.items).sort()).toEqual([...keys].sort());
    expect(shortlistDvv.updated).toMatch(/^\d{1,2}\.\d{1,2}\.\d{4}$/);
    expect(Object.values(shortlistDvv.items).filter((item) => item.found)).toHaveLength(50);
  });
});
