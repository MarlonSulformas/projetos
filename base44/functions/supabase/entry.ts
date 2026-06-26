import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

async function supabaseRequest(path, method = "GET", body = null) {
  const baseUrl = (SUPABASE_URL || "").replace(/\/$/, "");
  const res = await fetch(`${baseUrl}/rest/v1/${path}`, {
    method,
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      "Prefer": method === "POST" ? "return=representation" : "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { action, table, data, filters } = await req.json();

    if (action === "select") {
      const params = new URLSearchParams({ select: "*" });
      if (filters) {
        for (const [k, v] of Object.entries(filters)) {
          params.set(k, `eq.${v}`);
        }
      }
      const rows = await supabaseRequest(`${table}?${params.toString()}&order=created_at.asc`);
      return Response.json({ data: rows });
    }

    if (action === "insert") {
      const rows = await supabaseRequest(table, "POST", data);
      return Response.json({ data: Array.isArray(rows) ? rows[0] : rows });
    }

    if (action === "update") {
      const { id, ...fields } = data;
      const rows = await supabaseRequest(`${table}?id=eq.${id}`, "PATCH", fields);
      return Response.json({ data: Array.isArray(rows) ? rows[0] : rows });
    }

    if (action === "delete") {
      await supabaseRequest(`${table}?id=eq.${data.id}`, "DELETE");
      return Response.json({ data: null });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});