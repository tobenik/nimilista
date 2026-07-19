export type DecadeRow = {
  period: string;
  men: number | null;
  menUnder: boolean;
  women: number | null;
  womenUnder: boolean;
  total: number | null;
  totalUnder: boolean;
};

export type NameResult = {
  name: string;
  updated: string | null;
  men: number | null;
  menUnder: boolean;
  women: number | null;
  womenUnder: boolean;
  total: number | null;
  totalUnder: boolean;
  suppressed: boolean;
  decades: DecadeRow[];
  sourceUrl: string;
};

export type SearchResult =
  | { query: string; status: "loading" }
  | { query: string; status: "success"; data: NameResult }
  | { query: string; status: "error"; message: string };

export type ShortlistCategory = {
  id: string;
  label: string;
  names: string[];
};

export type ShortlistSnapshotItem =
  | {
      found: true;
      name: string;
      updated: string | null;
      total: number | null;
      totalUnder: boolean;
      peakPeriod: string | null;
      peakTotal: number | null;
      peakUnder: boolean;
      sourceUrl: string;
    }
  | {
      found: false;
      name: string;
      message: string;
    };

export type ShortlistSnapshot = {
  updated: string;
  generatedAt: string;
  items: Record<string, ShortlistSnapshotItem>;
};
