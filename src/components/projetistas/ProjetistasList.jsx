import React from "react";
import { motion } from "framer-motion";
import { Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProjetistasList({ projetistas, selectedId, onSelect }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-[300px] flex-shrink-0 flex flex-col gap-3"
    >
      <Button className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl h-10 text-sm font-medium shadow-sm transition-all duration-150 justify-start gap-2 px-4">
        <Plus className="w-4 h-4" />
        Cadastrar Projetista
      </Button>

      <div className="flex flex-col gap-2">
        {projetistas.map((p, idx) => {
          const isSelected = p.id === selectedId;
          return (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.06, ease: "easeOut" }}
              onClick={() => onSelect(p.id)}
              className={`
                w-full text-left p-4 rounded-xl border transition-all duration-150
                ${isSelected
                  ? "bg-[#EFF6FF] border-[#3B82F6] shadow-sm"
                  : "bg-white border-[#E5E5E8] hover:border-[#D4D4D8] hover:bg-[#F7F7FA] shadow-sm"
                }
              `}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? "bg-[#DBEAFE]" : "bg-[#F1F1F4]"}`}>
                    <Building2 className={`w-4 h-4 ${isSelected ? "text-[#3B82F6]" : "text-[#6B6B72]"}`} strokeWidth={1.8} />
                  </div>
                  <div>
                    <p className={`text-sm font-medium leading-snug ${isSelected ? "text-[#1D4ED8]" : "text-[#1F1F24]"}`}>
                      {p.nome}
                    </p>
                    <span className="inline-block mt-1 text-[11px] font-medium text-[#6B6B72] bg-[#F1F1F4] px-2 py-0.5 rounded-full">
                      {p.especialidade}
                    </span>
                  </div>
                </div>
                {isSelected && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] mt-1 flex-shrink-0" />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}