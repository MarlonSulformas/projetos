import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ChevronDown, ChevronUp, Bot, Package, User, Loader2, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { db } from "@/lib/supabaseClient";

function statusBadge(status) {
  const map = {
    iniciando:      { label: "Sem exemplos",   color: "#9CA3AF", bg: "#F1F1F4" },
    em_treinamento: { label: "Em treinamento",  color: "#F59E0B", bg: "#FEF3C7" },
    treinado:       { label: "Pronto ✓",        color: "#22C55E", bg: "#DCFCE7" },
  };
  const s = map[status] || map.iniciando;
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ color: s.color, backgroundColor: s.bg }}>
      {s.label}
    </span>
  );
}

function RegraCard({ agente, projetistaNome }) {
  const [open, setOpen] = useState(false);
  const base = agente.base_conhecimento || "";
  const preview = base.slice(0, 180).trim();

  // Extrai seções do markdown para exibição resumida
  const secoes = base.match(/^##.+$/gm) || [];

  return (
    <div className="border border-[#E5E5E8] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-[#FAFAFA] hover:bg-[#F1F1F4] transition-colors text-left"
      >
        <div className="w-8 h-8 rounded-lg bg-[#EDE9FE] flex items-center justify-center flex-shrink-0">
          <Package className="w-4 h-4 text-[#8B5CF6]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-[#0F0F0F] truncate">{agente.nome_produto}</p>
            {statusBadge(agente.status_treinamento)}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <User className="w-3 h-3 text-[#9CA3AF]" />
            <p className="text-[11px] text-[#6B6B72] truncate">{projetistaNome}</p>
            {secoes.length > 0 && (
              <span className="text-[10px] text-[#9CA3AF]">· {secoes.length} seções</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] text-[#9CA3AF] font-mono">{agente.total_exemplos || 0} ex.</span>
          {open ? <ChevronUp className="w-4 h-4 text-[#9CA3AF]" /> : <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 bg-white border-t border-[#F1F1F4]">
              {!base ? (
                <div className="flex items-center gap-2 text-[#9CA3AF]">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span className="text-xs">Nenhuma regra registrada ainda. Treine o agente primeiro.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {/* Seções detectadas */}
                  {secoes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-1">
                      {secoes.map((s, i) => (
                        <span key={i} className="text-[10px] bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] px-2 py-0.5 rounded-md font-medium">
                          {s.replace(/^#+\s*/, "")}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Preview do conteúdo */}
                  <pre className="text-[11px] text-[#374151] whitespace-pre-wrap leading-relaxed font-sans bg-[#F8F9FB] rounded-lg p-3 max-h-48 overflow-y-auto border border-[#E5E5E8]">
                    {preview}{base.length > 180 ? "…" : ""}
                  </pre>
                  {base.length > 180 && (
                    <p className="text-[10px] text-[#9CA3AF] text-right">{base.length} caracteres totais na base de conhecimento</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function RegrasPorProduto() {
  const [agentes, setAgentes] = useState([]);
  const [projetistas, setProjetistas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.AgenteIA.list(),
      db.listProjetistas(),
    ]).then(([ags, projs]) => {
      setAgentes(ags || []);
      setProjetistas(projs || []);
    }).catch(console.warn).finally(() => setLoading(false));
  }, []);

  const projetistaNome = (id) => {
    const p = projetistas.find(p => p.id === id);
    return p?.nome || "—";
  };

  // Agrupa por projetista
  const porProjetista = agentes.reduce((acc, ag) => {
    const key = ag.projetista_id || "sem_projetista";
    if (!acc[key]) acc[key] = [];
    acc[key].push(ag);
    return acc;
  }, {});

  const totalComRegras = agentes.filter(a => a.base_conhecimento).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
      className="bg-white rounded-2xl shadow-sm border border-[#E5E5E8] overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#E5E5E8]">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#8B5CF6]" strokeWidth={1.8} />
          <span className="text-xs font-medium text-[#4A4A52] uppercase tracking-wider">
            Base de Conhecimento por Produto
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[#9CA3AF]">
            {totalComRegras} de {agentes.length} produto{agentes.length !== 1 ? "s" : ""} com regras
          </span>
          <div className="flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span className="text-[11px] font-semibold text-[#8B5CF6]">{agentes.length} agentes</span>
          </div>
        </div>
      </div>

      <div className="p-5">
        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2">
            <Loader2 className="w-5 h-5 text-[#8B5CF6] animate-spin" />
            <span className="text-sm text-[#6B6B72]">Carregando regras...</span>
          </div>
        ) : agentes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#F1F1F4] flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-[#D1D5DB]" />
            </div>
            <p className="text-sm text-[#6B7280]">Nenhum agente treinado ainda.</p>
            <p className="text-xs text-[#9CA3AF]">Vá para Treinamento IA e comece a treinar um produto.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {Object.entries(porProjetista).map(([projetistaId, ags]) => (
              <div key={projetistaId} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-[#6B6B72]" />
                  <span className="text-[11px] font-semibold text-[#6B6B72] uppercase tracking-wider">
                    {projetistaNome(projetistaId)}
                  </span>
                  <span className="text-[10px] text-[#9CA3AF]">({ags.length} produto{ags.length !== 1 ? "s" : ""})</span>
                </div>
                <div className="flex flex-col gap-2">
                  {ags.map(ag => (
                    <RegraCard key={ag.id} agente={ag} projetistaNome={projetistaNome(ag.projetista_id)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}