import { DvvParseError, parseDvvNameHtml } from "../lib/dvv";

type PagesFunction = (context: { request: Request }) => Response | Promise<Response>;

const jsonHeaders = {
  "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
  "Content-Type": "application/json; charset=utf-8",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function validName(value: string): boolean {
  return (
    value.length >= 1 &&
    value.length <= 50 &&
    !/[\u0000-\u001f\u007f]/.test(value) &&
    !/[,;\n\r]/.test(value)
  );
}

export const onRequestGet: PagesFunction = async ({ request }) => {
  const requestUrl = new URL(request.url);
  const name = requestUrl.searchParams.get("name")?.trim() ?? "";

  if (!validName(name)) {
    return json({ error: "Anna yksi etunimi, enintään 50 merkkiä." }, 400);
  }

  const dvvUrl = new URL("https://nimipalvelu.dvv.fi/etunimihaku");
  dvvUrl.searchParams.set("nimi", name);

  try {
    const response = await fetch(dvvUrl, {
      headers: {
        Accept: "text/html; charset=utf-8",
        "Accept-Language": "fi",
        "User-Agent": "Nimilista/1.0 (+https://zeno.neomendel.com)",
      },
    });

    if (!response.ok) {
      return json({ error: "DVV:n nimipalvelu ei vastannut. Yritä hetken kuluttua uudelleen." }, 502);
    }

    const html = await response.text();
    const result = parseDvvNameHtml(html, name, dvvUrl.toString());
    return json(result);
  } catch (error) {
    if (error instanceof DvvParseError) {
      return json({ error: error.message }, error.message.includes("ei löytynyt") ? 404 : 502);
    }
    return json({ error: "Nimitietojen hakeminen epäonnistui. Yritä uudelleen." }, 502);
  }
};
