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
