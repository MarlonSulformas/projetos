import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: "Forbidden" }, { status: 403 });

    const SUPABASE_URL = (Deno.env.get("SUPABASE_URL") || "").replace(/\/rest\/v1.*$/, "").replace(/\/$/, "");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    // Use Supabase RPC to run raw SQL via the sql endpoint (service role not available, use alter via REST)
    // We'll try adding the column via a dummy insert to see current schema, then patch via RPC
    // Instead: try to PATCH a record with tag_funcao to see if column exists
    // Best approach: use the /rest/v1/rpc or just try an INSERT with tag_funcao and catch

    // Attempt to add the column via Supabase management API (not available with anon key)
    // Fallback: return the ALTER TABLE SQL for manual execution
    const sql = `ALTER TABLE gabaritos_espaciais ADD COLUMN IF NOT EXISTS tag_funcao text;`;

    // Try via Supabase REST pg_jsonb_set workaround — not possible with anon key
    // Return SQL for manual run
    return Response.json({
      message: "Run this SQL in your Supabase SQL Editor: https://supabase.com/dashboard → SQL Editor",
      sql
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});