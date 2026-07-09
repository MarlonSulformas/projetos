import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

async function execSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql }),
  });
  const text = await res.text();
  return { status: res.status, body: text };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    // Try creating tables via Supabase Management API approach
    // We'll use the pg REST endpoint if available, or return SQL to run manually
    const setupSQL = `
-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor)

CREATE TABLE IF NOT EXISTS projetistas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_razao_social text NOT NULL,
  cnpj text UNIQUE,
  email_contato text,
  especialidade text,
  status text DEFAULT 'Ativo',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_projetista uuid REFERENCES projetistas(id) ON DELETE CASCADE,
  nome_produto text NOT NULL,
  descricao_modelo text,
  status text DEFAULT 'Ativo',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gabaritos_espaciais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_projetista uuid REFERENCES projetistas(id) ON DELETE CASCADE,
  nome_regiao text NOT NULL,
  cor_marcador text DEFAULT 'blue',
  coordenada_x numeric DEFAULT 0,
  coordenada_y numeric DEFAULT 0,
  largura numeric DEFAULT 0,
  altura numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE projetistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE gabaritos_espaciais ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS componentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_projetista uuid REFERENCES projetistas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  tipo text NOT NULL,
  dica_visual text,
  cor text DEFAULT '#6B7280',
  regras jsonb DEFAULT '{}'::jsonb,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Se a tabela já existe, adiciona a coluna dica_visual
ALTER TABLE componentes ADD COLUMN IF NOT EXISTS dica_visual text;

ALTER TABLE componentes ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon key (adjust as needed)
CREATE POLICY IF NOT EXISTS "allow_all_projetistas" ON projetistas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "allow_all_produtos" ON produtos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "allow_all_gabaritos" ON gabaritos_espaciais FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "allow_all_componentes" ON componentes FOR ALL USING (true) WITH CHECK (true);
    `.trim();

    return Response.json({ 
      message: "Copy and run this SQL in your Supabase SQL Editor at: https://supabase.com/dashboard → SQL Editor",
      sql: setupSQL
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});