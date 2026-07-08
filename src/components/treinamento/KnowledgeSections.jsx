import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Layers, Ruler, Box, AlignLeft, Wrench, AlertTriangle, RotateCcw, Tag, Trash2 } from "lucide-react";

const SECTION_CONFIG = {
  "IDENTIFICAÇÃO DO PRODUTO":       { icon: Tag,          color: "#8B5CF6", bg: "#EDE9FE" },
  "DIMENSÕES PRINCIPAIS":           { icon: Ruler,        color: "#3B82F6", bg: "#EFF6FF" },
  "COMPENSADO":                     { icon: Layers,       color: "#0EA5E9", bg: "#E0F2FE" },
  "SARRUFOS VERTICAIS":             { icon: AlignLeft,    color: "#F59E0B", bg: "#FEF3C7" },
  "SARRUFOS DE ACABAMENTO":         { icon: AlignLeft,    color: "#10B981", bg: "#D1FAE5" },
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

export default function KnowledgeSections({ sections, renderLinha, onDeleteSection, onDeleteLine }) {
  const [openIdx, setOpenIdx] = useState(0);
  const [deleting, setDeleting] = useState(null); // { type: 'section'|'line', section, line } durante confirmação

  function handleDeleteSection(i) {
    if (setDeleting) setDeleting({ type: "section", section: i });
    if (!confirm("Excluir esta seção inteira da base de conhecimento?")) {
      setDeleting(null);
      return;
    }
    onDeleteSection?.(i);
    setDeleting(null);
  }

  function handleDeleteLine(sectionIdx, lineIdx) {
    setDeleting({ type: "line", section: sectionIdx, line: lineIdx });
    if (!confirm("Excluir esta regra/instrução?")) {
      setDeleting(null);
      return;
    }
    onDeleteLine?.(sectionIdx, lineIdx);
    setDeleting(null);
  }

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
            <div className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#FAFAFA] transition-colors">
              <button onClick={() => setOpenIdx(isOpen ? -1 : i)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cfg.bg }}>
                  <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#1F1F24] truncate">{section.titulo}</p>
                  {itemCount > 0 && (
                    <p className="text-[10px] mt-0.5" style={{ color: cfg.color }}>{itemCount} regra{itemCount !== 1 ? "s" : ""}</p>
                  )}
                </div>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />
                </motion.div>
              </button>

              {onDeleteSection && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteSection(i); }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-[#FEE2E2] hover:text-[#EF4444] transition-colors flex-shrink-0"
                  title="Excluir seção"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

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
                      {section.conteudo.map((linha, j) => (
                        <div key={j} className="group/l flex items-start gap-1 -mx-1 px-1 rounded">
                          <div className="flex-1 min-w-0">
                            {renderLinha(linha, j)}
                          </div>
                          {onDeleteLine && linha.trim() && (
                            <button
                              onClick={() => handleDeleteLine(i, j)}
                              className="opacity-0 group-hover/l:opacity-100 w-5 h-5 mt-0.5 rounded flex items-center justify-center text-[#D1D5DB] hover:text-[#EF4444] hover:bg-[#FEE2E2] transition-all flex-shrink-0"
                              title="Excluir regra"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {sections.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-6">
          <div className="w-12 h-12 rounded-2xl bg-[#F1F1F4] flex items-center justify-center">
            <AlignLeft className="w-6 h-6 text-[#D1D5DB]" />
          </div>
          <p className="text-sm font-semibold text-[#6B7280]">Base de conhecimento vazia.</p>
          <p className="text-xs text-[#9CA3AF]">Converse com o agente para que ele aprenda as regras.</p>
        </div>
      )}
    </div>
  );
}