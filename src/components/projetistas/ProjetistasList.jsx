import React from "react";
import { motion } from "framer-motion";
import { Plus, Building2, MoreVertical, Pencil, Trash2, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function StatusDot({ ativo }) {
  return <span className={`w-2 h-2 rounded-full flex-shrink-0 ${ativo ? "bg-green-500" : "bg-[#A1A1AA]"}`} />;
}

export default function ProjetistasList({ projetistas, selectedId, onSelect, onNew, onEdit, onDelete, onToggleStatus }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-[300px] flex-shrink-0 flex flex-col gap-3"
    >
      <Button onClick={onNew} className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl h-10 text-sm font-medium shadow-sm justify-start gap-2 px-4">
        <Plus className="w-4 h-4" />
        Cadastrar Projetista
      </Button>

      <div className="flex flex-col gap-2">
        {projetistas.map((p, idx) => {
          const isSelected = p.id === selectedId;
          const ativo = p.ativo !== false;
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.05, ease: "easeOut" }}
              onClick={() => onSelect(p.id)}
              className={`relative w-full text-left p-4 rounded-xl border transition-all duration-150 cursor-pointer
                ${isSelected ? "bg-[#EFF6FF] border-[#3B82F6] shadow-sm" : "bg-white border-[#E5E5E8] hover:border-[#D4D4D8] hover:bg-[#F7F7FA] shadow-sm"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? "bg-[#DBEAFE]" : "bg-[#F1F1F4]"}`}>
                    <Building2 className={`w-4 h-4 ${isSelected ? "text-[#3B82F6]" : "text-[#6B6B72]"}`} strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <StatusDot ativo={ativo} />
                      <p className={`text-sm font-medium leading-snug truncate ${isSelected ? "text-[#1D4ED8]" : "text-[#1F1F24]"}`}>{p.nome}</p>
                    </div>
                    <span className="inline-block mt-1 text-[11px] font-medium text-[#6B6B72] bg-[#F1F1F4] px-2 py-0.5 rounded-full">{p.especialidade}</span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <button className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6B6B72] hover:bg-white hover:text-[#1F1F24] transition-colors flex-shrink-0 mt-0.5">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-lg border-[#E5E5E8]" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem className="gap-2 text-sm cursor-pointer" onSelect={() => onEdit(p)}>
                      <Pencil className="w-3.5 h-3.5 text-[#6B6B72]" /> Editar dados
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 text-sm cursor-pointer" onSelect={() => onToggleStatus(p)}>
                      <PowerOff className="w-3.5 h-3.5 text-[#6B6B72]" /> {ativo ? "Desativar" : "Ativar"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2 text-sm cursor-pointer text-red-500 focus:text-red-500" onSelect={() => onDelete(p)}>
                      <Trash2 className="w-3.5 h-3.5" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          );
        })}

        {projetistas.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-sm text-[#6B6B72]">Nenhum projetista cadastrado.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}