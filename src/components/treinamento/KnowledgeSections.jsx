import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Layers, Ruler, Box, AlignLeft, Wrench, AlertTriangle, RotateCcw, Tag } from "lucide-react";

const SECTION_CONFIG = {
  "IDENTIFICAÇÃO DO PRODUTO":       { icon: Tag,          color: "#8B5CF6", bg: "#EDE9FE" },
  "DIMENSÕES PRINCIPAIS":           { icon: Ruler,        color: "#3B82F6", bg: "#EFF6FF" },
  "COMPENSADO":                     { icon: Layers,       color: "#0EA5E9", bg: "#E0F2FE" },
  "SARRAFOS VERTICAIS":             { icon: AlignLeft,    color: "#F59E0B", bg: "#FEF3C7" },
  "SARRAFOS DE ACABAMENTO":         { icon: AlignLeft,    color: "#10B981", bg: "#D1FAE5" },
  "INSERTOS E ESPECIAIS":           { icon: Wrench,       color: "#EF4444", bg: "#FEE2E2" },
  "REGRAS DE FOLGA E MONTAGEM":     { icon: Box,          color: "#6366F1", bg: "#EEF2FF" },
  "CORREÇÕES APLICADAS":            { icon: RotateCcw,    color: "#F97316", bg: "#FFF7ED" },
};

function getConfig(titulo) {
  for (const [key, cfg] of Object.entries(SECTION_CONFIG)) {
    if (titulo.toUpperCase().includes(key)) return cfg;
  }
  return { icon: AlignLeft, color: "#6B7280", bg: "#F3F4F6" };
}

function countItems(conteudo) {
  return conteudo.filter(l => l.trim().startsWith("- ") || l.trim().startsWith("* ")).length;
}

export default function KnowledgeSections({ sections, renderLinha }) {
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <div className="p-4 flex flex-col gap-2">
      {sections.map((section, i) => {
        const cfg = getConfig(section.titulo);
        const Icon = cfg.icon;
        const isOpen = openIdx === i;
        const itemCount = countItems(section.conteudo);
        const hasContent = section.conteudo.some(l => l.trim());

        return (
          <div
            key={i}
            className="bg-white border rounded-xl overflow-hidden transition-all duration-150"
            style={{ borderColor: isOpen ? cfg.color + "55" : "#E5E5E8" }}
          >
            {/* Row */}
            <button
              onClick={() => setOpenIdx(isOpen ? -1 : i)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#FAFAFA] transition-colors"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cfg.bg }}>
                <Icon className="w-4 h-4" style={{ color: cfg.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#1F1F24] truncate">{section.titulo}</p>
                {itemCount > 0 && (
                  <p className="text-[10px] mt-0.5" style={{ color: cfg.color }}>{itemCount} regra{itemCount !== 1 ? "s" : ""}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className="w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center"
                  style={{ backgroundColor: cfg.bg, color: cfg.color }}
                >
                  {i + 1}
                </span>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />
                </motion.div>
              </div>
            </button>

            {/* Content */}
            <AnimatePresence initial={false}>
              {isOpen && hasContent && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  style={{ overflow: "hidden" }}
                >
                  <div
                    className="px-4 pb-4 pt-1 border-t"
                    style={{ borderColor: cfg.color + "22", backgroundColor: cfg.bg + "44" }}
                  >
                    <div className="flex flex-col">
                      {section.conteudo.map((linha, j) => renderLinha(linha, j))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}