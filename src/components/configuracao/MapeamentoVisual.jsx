import React, { useState } from "react";
import { motion } from "framer-motion";
import { ZoomIn, ZoomOut, PlusSquare, Maximize2, Map } from "lucide-react";
import { Button } from "@/components/ui/button";

const ZONAS = [
  {
    id: "carimbo",
    label: "Área do Carimbo / Identificação",
    color: "border-blue-400 bg-blue-400/10",
    labelColor: "bg-blue-500 text-white",
    style: { left: "62%", top: "60%", width: "34%", height: "32%" },
  },
  {
    id: "ferros",
    label: "Tabela de Ferros / Quantitativos",
    color: "border-green-500 bg-green-400/10",
    labelColor: "bg-green-500 text-white",
    style: { left: "4%", top: "62%", width: "40%", height: "26%" },
  },
  {
    id: "geometria",
    label: "Geometria da Peça Pré-Moldada",
    color: "border-orange-400 bg-orange-400/10",
    labelColor: "bg-orange-500 text-white",
    style: { left: "6%", top: "10%", width: "55%", height: "44%" },
  },
];

function BlueprintSVG() {
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="bp-grid-small" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(59,130,246,0.08)" strokeWidth="0.5" />
        </pattern>
        <pattern id="bp-grid-large" width="100" height="100" patternUnits="userSpaceOnUse">
          <rect width="100" height="100" fill="url(#bp-grid-small)" />
          <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(59,130,246,0.15)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#bp-grid-large)" />

      {/* Simulated structural drawing */}
      {/* Main beam outline */}
      <rect x="6%" y="12%" width="52%" height="40%" fill="none" stroke="rgba(30,58,138,0.2)" strokeWidth="1.5" />
      {/* Inner detail */}
      <rect x="9%" y="16%" width="46%" height="32%" fill="none" stroke="rgba(30,58,138,0.12)" strokeWidth="1" strokeDasharray="4 2" />
      {/* Cross lines */}
      <line x1="9%" y1="32%" x2="55%" y2="32%" stroke="rgba(30,58,138,0.1)" strokeWidth="0.8" />
      <line x1="32%" y1="16%" x2="32%" y2="48%" stroke="rgba(30,58,138,0.1)" strokeWidth="0.8" />
      {/* Title block outline */}
      <rect x="62%" y="62%" width="32%" height="28%" fill="none" stroke="rgba(30,58,138,0.2)" strokeWidth="1.5" />
      <line x1="62%" y1="72%" x2="94%" y2="72%" stroke="rgba(30,58,138,0.15)" strokeWidth="0.8" />
      <line x1="62%" y1="80%" x2="94%" y2="80%" stroke="rgba(30,58,138,0.12)" strokeWidth="0.8" />
      <line x1="78%" y1="62%" x2="78%" y2="90%" stroke="rgba(30,58,138,0.12)" strokeWidth="0.8" />
      {/* Table outline */}
      <rect x="4%" y="64%" width="38%" height="22%" fill="none" stroke="rgba(30,58,138,0.2)" strokeWidth="1.5" />
      <line x1="4%" y1="72%" x2="42%" y2="72%" stroke="rgba(30,58,138,0.12)" strokeWidth="0.8" />
      <line x1="4%" y1="78%" x2="42%" y2="78%" stroke="rgba(30,58,138,0.12)" strokeWidth="0.8" />
      <line x1="15%" y1="64%" x2="15%" y2="86%" stroke="rgba(30,58,138,0.12)" strokeWidth="0.8" />
      <line x1="26%" y1="64%" x2="26%" y2="86%" stroke="rgba(30,58,138,0.12)" strokeWidth="0.8" />
      {/* Dim lines */}
      <line x1="6%" y1="8%" x2="58%" y2="8%" stroke="rgba(30,58,138,0.15)" strokeWidth="0.8" />
      <line x1="60%" y1="12%" x2="60%" y2="52%" stroke="rgba(30,58,138,0.15)" strokeWidth="0.8" />
      {/* Text placeholders */}
      <rect x="12%" y="52%" width="18%" height="2%" rx="1" fill="rgba(30,58,138,0.07)" />
      <rect x="12%" y="55.5%" width="12%" height="1.5%" rx="1" fill="rgba(30,58,138,0.05)" />
      <rect x="65%" y="65%" width="14%" height="1.5%" rx="1" fill="rgba(30,58,138,0.07)" />
      <rect x="65%" y="68%" width="10%" height="1.5%" rx="1" fill="rgba(30,58,138,0.05)" />
    </svg>
  );
}

export default function MapeamentoVisual() {
  const [zoom, setZoom] = useState(100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
      className="bg-white border border-[#E5E5E8] rounded-2xl shadow-sm p-5 flex flex-col gap-4 h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Map className="w-4 h-4 text-[#3B82F6]" strokeWidth={1.8} />
          <h3 className="text-sm font-semibold text-[#0F0F0F]">Mapeamento Visual do Layout</h3>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom((z) => Math.max(50, z - 10))}
            className="w-8 h-8 p-0 rounded-lg border-[#E5E5E8] text-[#4A4A52] hover:bg-[#F1F1F4]"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <span className="text-xs font-medium text-[#6B6B72] w-10 text-center">{zoom}%</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom((z) => Math.min(200, z + 10))}
            className="w-8 h-8 p-0 rounded-lg border-[#E5E5E8] text-[#4A4A52] hover:bg-[#F1F1F4]"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
          <div className="w-px h-5 bg-[#E5E5E8] mx-1" />
          <Button
            size="sm"
            className="h-8 px-3 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-medium gap-1.5 shadow-sm"
          >
            <PlusSquare className="w-3.5 h-3.5" />
            Demarcar Nova Área
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-8 h-8 p-0 rounded-lg border-[#E5E5E8] text-[#4A4A52] hover:bg-[#F1F1F4]"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Zones legend */}
      <div className="flex items-center gap-3 flex-wrap">
        {ZONAS.map((z) => (
          <div key={z.id} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-sm border-2 ${z.color}`} />
            <span className="text-[11px] text-[#6B6B72]">{z.label}</span>
          </div>
        ))}
      </div>

      {/* Blueprint canvas */}
      <div className="flex-1 rounded-xl overflow-hidden border border-[#E8ECF0] bg-[#F4F6F9] relative min-h-[380px]">
        <div
          className="absolute inset-0 transition-transform duration-200 origin-center"
          style={{ transform: `scale(${zoom / 100})` }}
        >
          <BlueprintSVG />

          {/* Mapping zones */}
          {ZONAS.map((zona) => (
            <div
              key={zona.id}
              className={`absolute border-2 rounded-md ${zona.color} transition-all duration-200`}
              style={zona.style}
            >
              <div className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold shadow-sm ${zona.labelColor} whitespace-nowrap`}>
                {zona.label}
              </div>
            </div>
          ))}
        </div>

        {/* Watermark */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 opacity-40">
          <span className="text-[10px] font-medium text-[#6B6B72]">Structura AI · Preview</span>
        </div>
      </div>
    </motion.div>
  );
}