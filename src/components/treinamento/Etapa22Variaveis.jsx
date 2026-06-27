import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import SecaoTransversalConfig from "./SecaoTransversalConfig";
import BancoPaineis from "./BancoPaineis";
import { Layers, LayoutTemplate, Lock } from "lucide-react";

export default function Etapa22Variaveis({ anatomia, secao, onSecaoChange, paineis, onPaineisChange }) {
  return (
    <div className="flex flex-col gap-5">
      {/* Intro */}
      <div className="bg-[#F5F3FF] border border-[#DDD6FE] rounded-2xl p-4">
        <p className="text-sm font-semibold text-[#5B21B6] mb-1">Cérebro da Interpretação — Regras de Negócio</p>
        <p className="text-xs text-[#7C3AED] leading-relaxed">
          Configure aqui a lógica que o sistema usará para processar cada página do caderno completo (100+ folhas) de forma autônoma, pilar por pilar.
        </p>
      </div>

      {/* Sub-módulo: Seção Transversal */}
      <div className="bg-white border border-[#E5E5E8] rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F1F1F4] bg-[#FAFAFA]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#F5F3FF] flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-[#8B5CF6]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#0F0F0F]">Sub-Módulo A — Regulagem da Seção Transversal</p>
              <p className="text-[10px] text-[#9CA3AF]">Traduz a variável composta lida no PDF (ex: 19/95) em dimensões de painel</p>
            </div>
          </div>
          {!anatomia.possuiSecaoTransversal && (
            <div className="flex items-center gap-1.5 text-[10px] text-[#9CA3AF] font-medium bg-[#F1F1F4] rounded-lg px-2.5 py-1">
              <Lock className="w-3 h-3" />
              Bloqueado — ative na Etapa 2.1
            </div>
          )}
        </div>
        {anatomia.possuiSecaoTransversal ? (
          <div className="p-5">
            <SecaoTransversalConfig value={secao} onChange={onSecaoChange} />
          </div>
        ) : (
          <div className="px-5 py-8 flex items-center justify-center">
            <p className="text-xs text-[#9CA3AF] text-center">
              Este módulo está desabilitado pois o caderno não possui seção transversal variável.<br />
              <span className="text-[#8B5CF6] font-medium cursor-pointer" onClick={() => {}}>Volte à Etapa 2.1</span> para ativar.
            </p>
          </div>
        )}
      </div>

      {/* Sub-módulo: Banco de Painéis */}
      <div className="bg-white border border-[#E5E5E8] rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F1F1F4] bg-[#FAFAFA]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
              <LayoutTemplate className="w-3.5 h-3.5 text-[#3B82F6]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#0F0F0F]">Sub-Módulo B — Banco de Dados de Painéis (Catálogo de Templates)</p>
              <p className="text-[10px] text-[#9CA3AF]">Cadastre os tipos de painel da fábrica com fórmulas dinâmicas atreladas às variáveis do PDF</p>
            </div>
          </div>
          {!anatomia.possuiDetalhamentoPaineis && (
            <div className="flex items-center gap-1.5 text-[10px] text-[#9CA3AF] font-medium bg-[#F1F1F4] rounded-lg px-2.5 py-1">
              <Lock className="w-3 h-3" />
              Bloqueado — ative na Etapa 2.1
            </div>
          )}
        </div>
        {anatomia.possuiDetalhamentoPaineis ? (
          <div className="p-5">
            <BancoPaineis paineis={paineis} onChange={onPaineisChange} />
          </div>
        ) : (
          <div className="px-5 py-8 flex items-center justify-center">
            <p className="text-xs text-[#9CA3AF] text-center">
              Módulo bloqueado — ative "Região de Detalhamento de Painéis" na Etapa 2.1.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}