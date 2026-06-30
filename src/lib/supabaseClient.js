import { base44 } from "@/api/base44Client";

async function call(action, table, data = null, filters = null) {
  const res = await base44.functions.invoke("supabase", { action, table, data, filters });
  if (res.data?.error) throw new Error(res.data.error);
  return res.data?.data;
}

export const db = {
  // projetistas
  async listProjetistas() {
    const data = await call("select", "projetistas");
    return (data || []).map(p => ({ ...p, nome: p.nome || p.nome_razao_social || "" }));
  },
  async createProjetista(data) {
    return call("insert", "projetistas", data);
  },
  async updateProjetista(id, fields) {
    return call("update", "projetistas", { id, ...fields });
  },
  async deleteProjetista(id) {
    return call("delete", "projetistas", { id });
  },

  // produtos
  async listProdutos() {
    const data = await call("select", "produtos");
    return (data || []).map(p => ({ ...p, nome: p.nome || p.nome_produto || "" }));
  },
  async listProdutosByProjetista(id_projetista) {
    return call("select", "produtos", null, { id_projetista });
  },
  async createProduto(data) {
    return call("insert", "produtos", data);
  },
  async updateProduto(id, fields) {
    return call("update", "produtos", { id, ...fields });
  },
  async deleteProduto(id) {
    return call("delete", "produtos", { id });
  },

  // gabaritos_espaciais
  async listGabaritos(id_projetista) {
    return call("select", "gabaritos_espaciais", null, { id_projetista });
  },
  async createGabarito(data) {
    return call("insert", "gabaritos_espaciais", data);
  },
  async updateGabarito(id, fields) {
    return call("update", "gabaritos_espaciais", { id, ...fields });
  },
  async deleteGabarito(id) {
    return call("delete", "gabaritos_espaciais", { id });
  },
};