import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function WelcomeHeader() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
      <div>
        <h1 className="text-[28px] sm:text-[32px] font-medium text-[#0F0F0F] tracking-tight leading-tight">
          {greeting}, Engenheiro.
        </h1>
        <p className="text-sm text-[#6B6B72] mt-1.5 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Você possui <span className="font-medium text-[#1F1F24]">4 auditorias estruturais ativas</span> e{" "}
          <span className="font-medium text-[#1F1F24]">12 componentes</span> aguardando validação.
        </p>
      </div>
      <Button
        className="bg-[#0F0F0F] hover:bg-[#1F1F24] text-white rounded-xl px-5 h-10 text-sm font-medium shadow-sm transition-all duration-150 hover:shadow-md self-start sm:self-auto"
      >
        <Plus className="w-4 h-4 mr-2" />
        Inicializar Projeto
      </Button>
    </motion.div>
  );
}