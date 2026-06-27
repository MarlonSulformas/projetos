import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ImageIcon, ChevronDown, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

const VARIAVEIS_PDF = [
  { value: "Altura_Lida", label: "Altura_Lida — altura do elemento no PDF" },
  { value: "Largura_AB", label: "Largura_AB — largura calculada das faces A/B" },
  { value: "Largura_CD", label: "Largura_CD — largura calculada das faces C/D" },
  { value: "Comprimento_Lido", label: "Comprimento_Lido — comprimento bruto do PDF" },
];

const OPERADORES = [
  { value: "-", label: "−  Subtrair" },
  { value: "+", label: "+  Somar" },
  { value: "*", label: "×  Multiplicar" },
  { value: "/", label: "÷  Dividir" },
];

function newPainel() {
  return {
    id: Date.now(),
    nome: "",
    imagemUrl: null,
    imagemLoading: false,
    componentes: [newComponente()],
  };
}
function newComponente() {
  return { id: Date.now() + Math.random(), nome: "", variavel: "Altura_Lida", operador: "-", valor: "0.5" };
}

function PainelCard({ painel, onUpdate, onDelete }) {
  const fileRef = useRef(null);

  function setField(field, val) {
    onUpdate({ ...painel, [field]: val });
  }

  function addComponente() {
    onUpdate({ ...painel, componentes: [...painel.componentes, newComponente()] });
  }

  function updateComponente(id, field, val) {
    onUpdate({ ...painel, componentes: painel.componentes.map(c => c.id === id ? { ...c, [field]: val } : c) });
  }

  function removeComponente(id) {
    onUpdate({ ...painel, componentes: painel.componentes.filter(c => c.id !== id) });
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    onUpdate({ ...painel, imagemLoading: true });
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onUpdate({ ...painel, imagemUrl: file_url, imagemLoading: false });
    } catch {
      onUpdate({ ...painel, imagemLoading: false });
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-[#E5E5E8] rounded-2xl overflow-hidden bg-white"
    >
      {/* Header do card */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#FAFAFA] border-b border-[#F1F1F4]">
        <div className="w-2 h-2 rounded-full bg-[#3B82F6] flex-shrink-0" />
        <input
          value={painel.nome}
          onChange={e => setField("nome", e.target.value)}
          placeholder="Nome do Padrão (ex: Painel Passante Tipo 1)"
          className="flex-1 bg-transparent text-sm font-semibold text-[#0F0F0F] focus:outline-none placeholder:text-[#9CA3AF] placeholder:font-normal"
        />
        <button onClick={onDelete} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-red-50 hover:text-red-400 transition-colors flex-shrink-0">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-4 flex gap-4 flex-wrap">
        {/* Imagem de referência */}
        <div className="flex-shrink-0">
          <p className="text-[10px] font-semibold text-[#6B6B72] uppercase tracking-wider mb-2">Esquema Visual</p>
          <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={handleImageUpload} />
          <div
            onClick={() => fileRef.current?.click()}
            className="w-28 h-28 rounded-xl border-2 border-dashed border-[#D4D4D8] bg-[#F8F9FB] flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-[#3B82F6] hover:bg-[#EFF6FF] transition-all group"
          >
            {painel.imagemLoading ? (
              <div className="w-5 h-5 border-2 border-[#BFDBFE] border-t-[#3B82F6] rounded-full animate-spin" />
            ) : painel.imagemUrl ? (
              <img src={painel.imagemUrl} alt="" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <>
                <ImageIcon className="w-6 h-6 text-[#D4D4D8] group-hover:text-[#3B82F6] transition-colors" />
                <span className="text-[9px] text-[#9CA3AF] group-hover:text-[#3B82F6] text-center leading-tight">Clique para<br />adicionar</span>
              </>
            )}
          </div>
        </div>

        {/* Construtor de fórmulas */}
        <div className="flex-1 min-w-[280px]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold text-[#6B6B72] uppercase tracking-wider">Componentes e Fórmulas Dinâmicas</p>
            <button
              onClick={addComponente}
              className="flex items-center gap-1 text-[10px] font-medium text-[#3B82F6] hover:text-[#2563EB] transition-colors"
            >
              <Plus className="w-3 h-3" />
              Adicionar
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {painel.componentes.map(c => (
              <div key={c.id} className="flex items-center gap-1.5 flex-wrap">
                {/* Nome componente */}
                <input
                  value={c.nome}
                  onChange={e => updateComponente(c.id, "nome", e.target.value)}
                  placeholder="Nome (ex: Compensado)"
                  className="w-36 border border-[#E5E5E8] rounded-lg px-2.5 py-1.5 text-[11px] text-[#1F1F24] focus:outline-none focus:ring-1 focus:ring-[#3B82F6] transition-all"
                />
                <span className="text-[10px] text-[#9CA3AF] font-medium">=</span>
                {/* Variável */}
                <div className="relative">
                  <select
                    value={c.variavel}
                    onChange={e => updateComponente(c.id, "variavel", e.target.value)}
                    className="appearance-none border border-[#E5E5E8] rounded-lg pl-2.5 pr-6 py-1.5 text-[11px] text-[#1F1F24] bg-white focus:outline-none focus:ring-1 focus:ring-[#3B82F6] cursor-pointer transition-all"
                  >
                    {VARIAVEIS_PDF.map(v => <option key={v.value} value={v.value}>{v.value}</option>)}
                  </select>
                  <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#9CA3AF] pointer-events-none" />
                </div>
                {/* Operador */}
                <div className="relative">
                  <select
                    value={c.operador}
                    onChange={e => updateComponente(c.id, "operador", e.target.value)}
                    className="appearance-none border border-[#E5E5E8] rounded-lg pl-2.5 pr-6 py-1.5 text-[11px] text-[#1F1F24] bg-white focus:outline-none focus:ring-1 focus:ring-[#3B82F6] cursor-pointer transition-all w-16"
                  >
                    {OPERADORES.map(o => <option key={o.value} value={o.value}>{o.value}</option>)}
                  </select>
                  <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#9CA3AF] pointer-events-none" />
                </div>
                {/* Valor fixo */}
                <div className="flex items-center border border-[#E5E5E8] rounded-lg overflow-hidden">
                  <input
                    type="number"
                    value={c.valor}
                    onChange={e => updateComponente(c.id, "valor", e.target.value)}
                    placeholder="0"
                    className="w-14 px-2 py-1.5 text-[11px] text-[#1F1F24] focus:outline-none text-center"
                  />
                  <span className="px-2 text-[10px] text-[#6B6B72] bg-[#F8F9FB] border-l border-[#E5E5E8] py-1.5 font-medium">cm</span>
                </div>
                {/* Fórmula resultante badge */}
                <span className="text-[10px] font-mono text-[#6B6B72] bg-[#F1F1F4] rounded px-2 py-1 hidden sm:inline-block">
                  {c.nome || "?"} = {c.variavel} {c.operador} {c.valor}
                </span>
                <button onClick={() => removeComponente(c.id)} disabled={painel.componentes.length === 1}
                  className="w-6 h-6 rounded-md flex items-center justify-center text-[#9CA3AF] hover:text-red-400 hover:bg-red-50 transition-colors disabled:opacity-30 flex-shrink-0">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function BancoPaineis({ paineis, onChange }) {
  function addPainel() {
    onChange([...paineis, newPainel()]);
  }

  function updatePainel(id, updated) {
    onChange(paineis.map(p => p.id === id ? updated : p));
  }

  function deletePainel(id) {
    onChange(paineis.filter(p => p.id !== id));
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Intro */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-[#0F0F0F]">Templates Construtivos Cadastrados</p>
          <p className="text-[10px] text-[#9CA3AF]">{paineis.length} padrão{paineis.length !== 1 ? "ões" : ""} no catálogo</p>
        </div>
        <button
          onClick={addPainel}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#EFF6FF] text-[#3B82F6] text-xs font-medium hover:bg-[#DBEAFE] transition-colors border border-[#BFDBFE]"
        >
          <Plus className="w-3.5 h-3.5" />
          Novo Template
        </button>
      </div>

      {paineis.length === 0 ? (
        <div className="border-2 border-dashed border-[#E5E5E8] rounded-2xl py-10 flex flex-col items-center justify-center gap-3 bg-[#FAFAFA]">
          <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] flex items-center justify-center">
            <Plus className="w-5 h-5 text-[#3B82F6]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-[#374151]">Catálogo vazio</p>
            <p className="text-xs text-[#9CA3AF] mt-1">Adicione os tipos de painel que a fábrica produz.<br />Cada template terá suas fórmulas dinâmicas atreladas às variáveis do PDF.</p>
          </div>
          <button onClick={addPainel}
            className="flex items-center gap-2 h-9 px-5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-medium transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Criar primeiro template
          </button>
        </div>
      ) : (
        <AnimatePresence>
          {paineis.map(p => (
            <PainelCard
              key={p.id}
              painel={p}
              onUpdate={updated => updatePainel(p.id, updated)}
              onDelete={() => deletePainel(p.id)}
            />
          ))}
        </AnimatePresence>
      )}

      {paineis.length > 0 && (
        <div className="flex items-center gap-2 bg-[#F8F9FB] border border-[#E5E5E8] rounded-xl px-4 py-3">
          <div className="w-2 h-2 rounded-full bg-[#22C55E] flex-shrink-0" />
          <p className="text-[11px] text-[#6B6B72]">
            <span className="font-semibold text-[#374151]">{paineis.length} template{paineis.length !== 1 ? "s" : ""}</span> cadastrado{paineis.length !== 1 ? "s" : ""}. 
            Ao salvar a máscara, o sistema associará automaticamente cada pilar ao template correspondente durante o processamento do caderno completo.
          </p>
        </div>
      )}
    </div>
  );
}