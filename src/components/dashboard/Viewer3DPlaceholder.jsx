import React from "react";
import { motion } from "framer-motion";
import { Box, Maximize2 } from "lucide-react";

export default function Viewer3DPlaceholder() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
      className="bg-white rounded-2xl shadow-sm border border-[#E5E5E8] overflow-hidden flex-1 min-h-[380px] flex flex-col"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#E5E5E8]">
        <div className="flex items-center gap-2">
          <Box className="w-4 h-4 text-blue-500" strokeWidth={1.8} />
          <span className="text-xs font-medium text-[#4A4A52] uppercase tracking-wider">
            Visualizador 3D
          </span>
        </div>
        <button className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6B6B72] hover:bg-[#F1F1F4] transition-colors">
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Blueprint grid area */}
      <div className="flex-1 blueprint-grid relative flex items-center justify-center p-6">
        {/* Decorative structural lines */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
          <line x1="20%" y1="15%" x2="80%" y2="15%" stroke="#3B82F6" strokeWidth="1.5" />
          <line x1="20%" y1="85%" x2="80%" y2="85%" stroke="#3B82F6" strokeWidth="1.5" />
          <line x1="20%" y1="15%" x2="20%" y2="85%" stroke="#3B82F6" strokeWidth="1.5" />
          <line x1="80%" y1="15%" x2="80%" y2="85%" stroke="#3B82F6" strokeWidth="1.5" />
          <line x1="35%" y1="15%" x2="35%" y2="85%" stroke="#3B82F6" strokeWidth="0.8" strokeDasharray="6 4" />
          <line x1="50%" y1="15%" x2="50%" y2="85%" stroke="#3B82F6" strokeWidth="0.8" strokeDasharray="6 4" />
          <line x1="65%" y1="15%" x2="65%" y2="85%" stroke="#3B82F6" strokeWidth="0.8" strokeDasharray="6 4" />
          <line x1="20%" y1="40%" x2="80%" y2="40%" stroke="#3B82F6" strokeWidth="0.8" strokeDasharray="6 4" />
          <line x1="20%" y1="60%" x2="80%" y2="60%" stroke="#3B82F6" strokeWidth="0.8" strokeDasharray="6 4" />
          {/* Nodes */}
          <circle cx="20%" cy="15%" r="3" fill="#3B82F6" />
          <circle cx="80%" cy="15%" r="3" fill="#3B82F6" />
          <circle cx="20%" cy="85%" r="3" fill="#3B82F6" />
          <circle cx="80%" cy="85%" r="3" fill="#3B82F6" />
          <circle cx="35%" cy="15%" r="2" fill="#3B82F6" />
          <circle cx="50%" cy="15%" r="2" fill="#3B82F6" />
          <circle cx="65%" cy="15%" r="2" fill="#3B82F6" />
          <circle cx="35%" cy="85%" r="2" fill="#3B82F6" />
          <circle cx="50%" cy="85%" r="2" fill="#3B82F6" />
          <circle cx="65%" cy="85%" r="2" fill="#3B82F6" />
        </svg>

        {/* Center content */}
        <div className="relative z-10 text-center max-w-md">
          <div className="w-14 h-14 rounded-2xl bg-[#F7F7FA] border border-[#E5E5E8] flex items-center justify-center mx-auto mb-4">
            <Box className="w-7 h-7 text-[#6B6B72]" strokeWidth={1.2} />
          </div>
          <h3 className="text-base font-medium text-[#1F1F24] mb-1.5">
            Módulo de Visualização Estrutural 3D
          </h3>
          <p className="text-sm text-[#6B6B72]">
            Aguardando carga de dados do projeto
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-4">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs text-amber-500 font-medium">Standby</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}