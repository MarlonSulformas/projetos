import React, { useState } from "react";
import { motion } from "framer-motion";
import { Save, ChevronDown, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

const PROJETISTAS = ["Estruturas Apex", "Engenharia Delta", "Concretar Estrutural", "Prémold Tech"];
const PRODUTOS = {
  "Estruturas Apex": ["Vigas Pré-Moldadas", "Pilares Industriais"],
  "Engenharia Delta": ["Fundação Profunda"],
  "Concretar Estrutural": ["Painéis de Fachada", "Escadas Pré-Moldadas"],
  "Prémold Tech": ["Lajes Nervuradas"],
};

function Select({ label, value, onChange, options, placeholder }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-medium text-[#6B6B72] uppercase tracking-wider">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-9 pl-3 pr-8 rounded-lg border border-[#E5E5E8] bg-white text-sm text-[#1F1F24] appearance-none focus:outline-none focus:ring-1 focus:ring-[#3B82F6] focus:border-[#3B82F6] transition-colors"
        >
          <option value="">{placeholder}</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-[#6B6B72] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  );
}

export default function FiltroInstrucoes() {
  const [projetista, setProjetista] = useState("");
  const [produto, setProduto] = useState("");
  const [instrucoes, setInstrucoes] = useState("");
  const [saved, setSaved] = useState(false);

  const handleProjetista = (v) => { setProjetista(v); setProduto(""); };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const produtosDisponiveis = projetista ? (PRODUTOS[projetista] || []) : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col gap-4"
    >
      {/* Context selectors */}
      <div className="bg-white border border-[#E5E5E8] rounded-2xl shadow-sm p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1 h-4 rounded-full bg-[#3B82F6]" />
          <h3 className="text-sm font-semibold text-[#0F0F0F]">Contexto de Configuração</h3>
        </div>
        <Select label="Projetista" value={projetista} onChange={handleProjetista} options={PROJETISTAS} placeholder="Selecionar Projetista" />
        <Select label="Produto" value={produto} onChange={setProduto} options={produtosDisponiveis} placeholder={projetista ? "Selecionar Produto" : "Selecione um projetista primeiro"} />
      </div>

      {/* Instruções */}
      <div className="bg-white border border-[#E5E5E8] rounded-2xl shadow-sm p-5 flex flex-col gap-4 flex-1">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#3B82F6]" strokeWidth={1.8} />
          <h3 className="text-sm font-semibold text-[#0F0F0F]">Instruções Gerais de Leitura</h3>
        </div>
        <p className="text-xs text-[#6B6B72] -mt-1">
          Descreva as regras que a IA deve seguir ao processar as plantas deste produto.
        </p>
        <textarea
          value={instrucoes}
          onChange={(e) => setInstrucoes(e.target.value)}
          placeholder={`Exemplo de instruções:\n\n• Procure pela tabela de cargas no canto inferior direito da folha.\n• O carimbo de identificação sempre aparece na margem direita.\n• Ignore anotações manuscritas em vermelho.\n• A legenda de vigas segue o padrão "V-XX" onde XX é o número sequencial.`}
          className="w-full min-h-[220px] resize-none rounded-xl border border-[#E5E5E8] bg-[#F7F7FA] px-3.5 py-3 text-sm text-[#1F1F24] placeholder-[#A1A1AA] focus:outline-none focus:ring-1 focus:ring-[#3B82F6] focus:border-[#3B82F6] transition-colors leading-relaxed"
        />
        <Button
          onClick={handleSave}
          className={`w-full h-9 rounded-xl text-sm font-medium transition-all duration-200 gap-2 ${saved ? "bg-green-500 hover:bg-green-500" : "bg-[#3B82F6] hover:bg-[#2563EB]"} text-white shadow-sm`}
        >
          <Save className="w-3.5 h-3.5" />
          {saved ? "Instruções salvas!" : "Salvar Instruções"}
        </Button>
      </div>
    </motion.div>
  );
}