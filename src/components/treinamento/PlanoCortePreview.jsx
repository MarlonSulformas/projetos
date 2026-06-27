import React from "react";
import { gerarPlanoCorte } from "@/lib/calculoCorte";

const COR_TIPO = {
  compensado: "#3B82F6",
  sarrafo_vertical: "#F59E0B",
  sarrafo_acabamento: "#10B981",
};

export default function PlanoCortePreview({ painel, X, Y }) {
  if (!painel || painel.componentes.length === 0) return null;

  // gerarPlanoCorte recebe X,Y em mm
  const grupos = gerarPlanoCorte(painel, X * 10, Y * 10);
  if (grupos.length === 0) return null;

  const todasPecas = grupos.flatMap(g => g.pecas.map(p => ({ ...p, cor: g.cor })));

  return (
    <div className="mx-4 mb-4 border border-[#E5E5E8] rounded-2xl bg-white shadow-sm overflow-hidden flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#F1F1F4] bg-[#FAFAFA]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
          <span className="text-[11px] font-bold text-[#0F0F0F] uppercase tracking-wide">
            Plano de Corte — {painel.nome}
          </span>
        </div>
        <span className="text-[10px] text-[#9CA3AF] font-mono">[X]={X}cm · [Y]={Y}cm</span>
      </div>

      {/* Lista inline compacta */}
      <div className="px-4 py-3 flex flex-wrap gap-2">
        {todasPecas.map((p, i) => (
          <div
            key={i}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-mono font-semibold"
            style={{
              backgroundColor: p.cor + "15",
              borderColor: p.cor + "40",
              color: p.cor,
            }}
          >
            <span className="font-black text-xs">{p.quantidade}×</span>
            <span>{p.descricao}</span>
          </div>
        ))}
      </div>

      {/* Linha resumo carpinteiro */}
      <div className="px-4 pb-3">
        <p className="text-[9px] text-[#9CA3AF] font-mono leading-relaxed">
          {todasPecas.map(p => `${p.quantidade}× ${p.descricao}`).join("  |  ")}
        </p>
      </div>
    </div>
  );
}