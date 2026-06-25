import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Trash2, ImageIcon, Tag } from "lucide-react";

const MOCK_REFS = [
  { id: 1, label: "Padrão de Carimbo", color: "bg-blue-50 text-blue-600 border-blue-200", bg: "bg-[#EFF6FF]", icon: "📋" },
  { id: 2, label: "Detalhe de Armadura", color: "bg-orange-50 text-orange-600 border-orange-200", bg: "bg-[#FFF7ED]", icon: "⚙️" },
  { id: 3, label: "Legenda de Vigas", color: "bg-green-50 text-green-600 border-green-200", bg: "bg-[#F0FDF4]", icon: "📐" },
  { id: 4, label: "Tabela de Cargas", color: "bg-purple-50 text-purple-600 border-purple-200", bg: "bg-[#FAF5FF]", icon: "📊" },
];

function MockBlueprint({ bg, icon }) {
  return (
    <div className={`w-full h-20 ${bg} rounded-lg flex flex-col items-center justify-center relative overflow-hidden`}>
      {/* Grid lines */}
      <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={`grid-${icon}`} width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#6B6B72" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${icon})`} />
      </svg>
      <span className="text-2xl relative z-10">{icon}</span>
    </div>
  );
}

export default function BancoImagens() {
  const [refs, setRefs] = useState(MOCK_REFS);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const removeRef = (id) => setRefs((prev) => prev.filter((r) => r.id !== id));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
      className="bg-white border border-[#E5E5E8] rounded-2xl shadow-sm p-5 flex flex-col gap-4 h-full"
    >
      <div className="flex items-center gap-2">
        <ImageIcon className="w-4 h-4 text-[#3B82F6]" strokeWidth={1.8} />
        <h3 className="text-sm font-semibold text-[#0F0F0F]">Banco de Imagens e Referências</h3>
      </div>

      {/* Upload area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center gap-2 text-center cursor-pointer transition-all duration-150
          ${dragging ? "border-[#3B82F6] bg-[#EFF6FF]" : "border-[#E5E5E8] hover:border-[#3B82F6] hover:bg-[#F7F9FF] bg-[#F7F7FA]"}`}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" />
        <div className="w-9 h-9 rounded-xl bg-[#DBEAFE] flex items-center justify-center">
          <Upload className="w-4 h-4 text-[#3B82F6]" strokeWidth={2} />
        </div>
        <div>
          <p className="text-xs font-medium text-[#4A4A52]">Arraste e solte imagens aqui</p>
          <p className="text-[11px] text-[#6B6B72] mt-0.5">Fotos de carimbos, fôrmas, tabelas ou detalhes</p>
        </div>
        <span className="text-[11px] text-[#3B82F6] font-medium">ou clique para selecionar</span>
      </div>

      {/* Gallery */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Tag className="w-3.5 h-3.5 text-[#6B6B72]" />
          <span className="text-[11px] font-medium text-[#6B6B72] uppercase tracking-wider">Referências Salvas</span>
          <span className="ml-auto text-[11px] text-[#6B6B72]">{refs.length} items</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <AnimatePresence>
            {refs.map((ref) => (
              <motion.div
                key={ref.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="border border-[#E5E5E8] rounded-xl overflow-hidden bg-white hover:border-[#D4D4D8] transition-colors group"
              >
                <MockBlueprint bg={ref.bg} icon={ref.icon} />
                <div className="p-2 flex items-center justify-between gap-1">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${ref.color} truncate`}>
                    {ref.label}
                  </span>
                  <button
                    onClick={() => removeRef(ref.id)}
                    className="w-6 h-6 rounded-md flex items-center justify-center text-[#A1A1AA] hover:bg-red-50 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {refs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-xs text-[#6B6B72]">Nenhuma referência salva.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}