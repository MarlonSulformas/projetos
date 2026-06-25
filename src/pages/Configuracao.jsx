import React from "react";
import { motion } from "framer-motion";
import FiltroInstrucoes from "@/components/configuracao/FiltroInstrucoes";
import BancoImagens from "@/components/configuracao/BancoImagens";
import MapeamentoVisual from "@/components/configuracao/MapeamentoVisual";

export default function Configuracao() {
  return (
    <div className="flex-1 flex flex-col min-h-0 p-6 gap-6 overflow-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="text-xl font-semibold text-[#0F0F0F]">Configuração / Treinamento</h1>
        <p className="text-sm text-[#6B6B72] mt-0.5">
          Configure as regras de leitura e treine o sistema para reconhecer padrões de layout por produto.
        </p>
      </motion.div>

      {/* 3-column grid */}
      <div className="grid grid-cols-[260px_1fr_2fr] gap-5 items-start flex-1">
        {/* Col 1 — Filtro e Instruções */}
        <FiltroInstrucoes />

        {/* Col 2 — Banco de Imagens */}
        <BancoImagens />

        {/* Col 3 — Mapeamento Visual */}
        <MapeamentoVisual />
      </div>
    </div>
  );
}