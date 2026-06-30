import { base44 } from "@/api/base44Client";

/**
 * Salva o histórico de conversa como arquivo JSON e retorna a URL.
 * Usa UploadFile para evitar o limite de tamanho do campo da entidade.
 */
export async function salvarHistorico(historico) {
  const json = JSON.stringify(historico);
  const blob = new Blob([json], { type: "application/json" });
  const file = new File([blob], `historico_${Date.now()}.json`, { type: "application/json" });
  const { file_url } = await base44.integrations.Core.UploadFile({ file });
  return file_url;
}

/**
 * Carrega o histórico a partir de uma URL ou tenta parsear como JSON inline (legado).
 */
export async function carregarHistorico(historicoField) {
  if (!historicoField) return [];

  // Se começa com http, é uma URL de arquivo
  if (historicoField.startsWith("http")) {
    try {
      const res = await fetch(historicoField);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  // Fallback: tenta parsear como JSON inline (históricos antigos)
  try {
    const parsed = JSON.parse(historicoField);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}