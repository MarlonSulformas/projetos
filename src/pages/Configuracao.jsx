import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronDown, Upload, ZoomIn, ZoomOut, Crosshair,
  CheckCircle2, Circle, ArrowRight, Map
} from "lucide-react";
import { Button } from "@/components/ui/button";

const PROJETISTAS = ["Estruturas Apex", "Engenharia Delta", "Concretar Estrutural", "Prémold Tech"];
const CADERNOS = ["Caderno de Pilares", "Caderno de Vigas", "Caderno de Lajes", "Caderno de Painéis"];

const CAPTURE_REGIONS = [
  {
    id: 1,
    label: "Vista Frontal dos Painéis",
    description: "Desenhos coloridos com sarrafos e painéis",
    color: "blue",
    mapped: true,
  },
  {
    id: 2,
    label: "Detalhe de Seção Transversal",
    description: "Espessura e quantidade de sarrafos por extremidade",
    color: "green",
    mapped: true,
  },
  {
    id: 3,
    label: "Tabela de Resumo / Quantitativos",
    description: "Totais e quantitativos da folha (se houver)",
    color: "violet",
    mapped: false,
  },
  {
    id: 4,
    label: "Carimbo de Identificação",
    description: "Nome da obra, pavimento e número do pilar",
    color: "slate",
    mapped: true,
  },
];

const REGION_STYLES = {
  blue:   { pill: "bg-blue-50 text-blue-600 border-blue-200",   rect: "border-blue-500 bg-blue-400/15",   tag: "text-blue-700",   dot: "bg-blue-500" },
  green:  { pill: "bg-green-50 text-green-600 border-green-200", rect: "border-green-500 bg-green-400/15", tag: "text-green-700",  dot: "bg-green-500" },
  violet: { pill: "bg-violet-50 text-violet-600 border-violet-200", rect: "border-violet-500 bg-violet-400/15", tag: "text-violet-700", dot: "bg-violet-500" },
  slate:  { pill: "bg-slate-100 text-slate-600 border-slate-200", rect: "border-slate-400 bg-slate-400/15", tag: "text-slate-600",  dot: "bg-slate-400" },
};

const DEMO_AREAS = [
  {
    id: 1, color: "blue",
    label: "Região 1: Vista Frontal",
    style: { top: "17%", left: "3%", width: "86%", height: "44%" },
    dashed: true,
  },
  {
    id: 2, color: "green",
    label: "Região 2: Seção Transversal",
    style: { top: "63%", left: "3%", width: "55%", height: "16%" },
    dashed: true,
  },
  {
    id: 4, color: "slate",
    label: "Região 4: Carimbo",
    style: { bottom: "3%", right: "2%", width: "96%", height: "12%" },
    dashed: false,
  },
];

function SelectField({ value, onChange, options, placeholder }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-white border border-[#E5E5E8] text-sm text-[#1F1F24] rounded-lg px-3 py-2 pr-8 h-9 focus:outline-none focus:ring-1 focus:ring-[#3B82F6] focus:border-[#3B82F6] transition-colors cursor-pointer"
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6B6B72] pointer-events-none" />
    </div>
  );
}

function RegionRow({ region, index, active, onMap }) {
  const s = REGION_STYLES[region.color];
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.07 }}
      className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-150 ${
        active
          ? "border-[#3B82F6] bg-[#EFF6FF]"
          : "border-[#E5E5E8] bg-white hover:border-[#D4D4D8]"
      }`}
    >
      {/* Number badge */}
      <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${s.pill} border`}>
        <span className="text-[11px] font-bold">{region.id}</span>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-[#1F1F24] leading-tight">{region.label}</p>
        <p className="text-[11px] text-[#6B6B72] mt-0.5 leading-snug">{region.description}</p>
      </div>

      {/* Status + action */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        {region.mapped ? (
          <span className="flex items-center gap-1 text-[10px] font-medium text-green-600">
            <CheckCircle2 className="w-3 h-3" /> Demarcado
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] font-medium text-[#A1A1AA]">
            <Circle className="w-3 h-3" /> Pendente
          </span>
        )}
        <button
          onClick={() => onMap(region.id)}
          className={`flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-colors ${
            active
              ? "bg-[#3B82F6] border-[#3B82F6] text-white"
              : "bg-white border-[#E5E5E8] text-[#4A4A52] hover:bg-[#F1F1F4]"
          }`}
        >
          <Map className="w-3 h-3" />
          {active ? "Mapeando..." : "Mapear"}
        </button>
      </div>
    </motion.div>
  );
}

function BlueprintSheet({ zoom }) {
  const scale = zoom / 100;
  return (
    <div className="relative w-full h-full flex items-center justify-center bg-[#F4F4F6] overflow-auto p-6">
      <div
        className="relative bg-white shadow-md flex-shrink-0"
        style={{
          width: `${scale * 660}px`,
          height: `${scale * 500}px`,
          border: "1px solid #D1D5DB",
          transition: "width 0.2s, height 0.2s",
        }}
      >
        {/* SVG drawing */}
        <svg width="100%" height="100%" viewBox="0 0 660 500" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0">
          {/* Outer border */}
          <rect x="8" y="8" width="644" height="484" fill="none" stroke="#9CA3AF" strokeWidth="1.5" />
          <rect x="12" y="12" width="636" height="476" fill="none" stroke="#E5E7EB" strokeWidth="0.5" />

          {/* Header */}
          <rect x="8" y="8" width="644" height="42" fill="#F9FAFB" stroke="#9CA3AF" strokeWidth="1" />
          <text x="334" y="24" textAnchor="middle" fontSize="10" fontWeight="700" fill="#1F2937" fontFamily="Inter,sans-serif">PROJETO ESTRUTURAL — CADERNO DE PILARES</text>
          <text x="334" y="38" textAnchor="middle" fontSize="7.5" fill="#6B7280" fontFamily="Inter,sans-serif">OBRA: Edifício Torres do Rio  |  PAVIMENTO: 3º AO 8º  |  FOLHA: 07/24  |  REV: C</text>

          {/* Vista Frontal area (panels) */}
          <text x="20" y="67" fontSize="7.5" fontWeight="600" fill="#6B7280" fontFamily="Inter,sans-serif">VISTA FRONTAL — PAINÉIS P-07 A P-12</text>

          {/* Panels row */}
          {[0,1,2,3,4,5].map(i => (
            <g key={i}>
              <rect x={22 + i*104} y={74} width={94} height={200} fill={["#EFF6FF","#F0FDF4","#FFF7ED","#FDF4FF","#FFFBEB","#F0F9FF"][i]} stroke="#9CA3AF" strokeWidth="0.8" />
              {/* sarrafo lines */}
              {[0,1,2,3,4].map(j => (
                <rect key={j} x={30 + i*104} y={82 + j*36} width={78} height={24} fill="none" stroke={["#60A5FA","#34D399","#FB923C","#A78BFA","#FBBF24","#38BDF8"][i]} strokeWidth="1" />
              ))}
              <text x={69 + i*104} y={284} textAnchor="middle" fontSize="7" fill="#374151" fontFamily="Inter,sans-serif">{`P-0${7+i}`}</text>
            </g>
          ))}

          {/* Section detail area */}
          <text x="20" y="305" fontSize="7.5" fontWeight="600" fill="#6B7280" fontFamily="Inter,sans-serif">DETALHE SEÇÃO TRANSVERSAL</text>
          {[0,1,2].map(i => (
            <g key={i}>
              <rect x={22 + i*110} y={312} width={94} height={65} fill="#FAFAFA" stroke="#9CA3AF" strokeWidth="0.8" />
              <line x1={22+i*110} y1={344} x2={116+i*110} y2={344} stroke="#D1D5DB" strokeWidth="0.5" />
              <line x1={69+i*110} y1={312} x2={69+i*110} y2={377} stroke="#D1D5DB" strokeWidth="0.5" />
              {[0,1,2,3].map(j => (
                <circle key={j} cx={35+j*25+i*110} cy={328} r="4" fill="#F3F4F6" stroke="#4B5563" strokeWidth="1" />
              ))}
              <text x={69+i*110} y={390} textAnchor="middle" fontSize="6.5" fill="#6B7280" fontFamily="Inter,sans-serif">{`Seção S-0${i+1} | e=20cm`}</text>
            </g>
          ))}

          {/* Title block / carimbo */}
          <rect x="8" y="430" width="644" height="62" fill="#F9FAFB" stroke="#9CA3AF" strokeWidth="1" />
          <line x1="210" y1="430" x2="210" y2="492" stroke="#D1D5DB" strokeWidth="0.8" />
          <line x1="420" y1="430" x2="420" y2="492" stroke="#D1D5DB" strokeWidth="0.8" />
          <text x="109" y="446" textAnchor="middle" fontSize="8" fontWeight="700" fill="#1F2937" fontFamily="Inter,sans-serif">ESTRUTURAS APEX ENG. LTDA.</text>
          <text x="109" y="460" textAnchor="middle" fontSize="7" fill="#4B5563" fontFamily="Inter,sans-serif">Resp.: Eng. A. Silva  |  CREA: 12345</text>
          <text x="109" y="473" textAnchor="middle" fontSize="7" fill="#4B5563" fontFamily="Inter,sans-serif">Data: Mar/2024</text>
          <text x="315" y="446" textAnchor="middle" fontSize="8" fontWeight="600" fill="#1F2937" fontFamily="Inter,sans-serif">OBRA: Edifício Torres do Rio</text>
          <text x="315" y="460" textAnchor="middle" fontSize="7" fill="#4B5563" fontFamily="Inter,sans-serif">Local: São Paulo - SP  |  Contr.: 2024/0087</text>
          <text x="315" y="473" textAnchor="middle" fontSize="7" fill="#4B5563" fontFamily="Inter,sans-serif">Pavimento: 3º ao 8º  |  Pilares: P-07/P-12</text>
          <text x="540" y="446" textAnchor="middle" fontSize="8" fontWeight="600" fill="#1F2937" fontFamily="Inter,sans-serif">Rev. C  |  Folha 07/24</text>
          <text x="540" y="460" textAnchor="middle" fontSize="7" fill="#4B5563" fontFamily="Inter,sans-serif">Aprovado: Dir. Técnica</text>
          <text x="540" y="473" textAnchor="middle" fontSize="7" fill="#4B5563" fontFamily="Inter,sans-serif">Arquivo: EST-PILARES-R3</text>
        </svg>

        {/* Overlay regions */}
        {DEMO_AREAS.map((area) => {
          const s = REGION_STYLES[area.color];
          return (
            <div
              key={area.id}
              className={`absolute border-2 rounded-sm pointer-events-none ${s.rect} ${area.dashed ? "border-dashed" : "border-solid"}`}
              style={area.style}
            >
              <div className={`absolute top-1.5 left-2 flex items-center gap-1.5`}>
                <span className={`w-2 h-2 rounded-full ${s.dot} flex-shrink-0`} />
                <span className={`text-[10px] font-semibold ${s.tag} bg-white/80 px-1.5 py-0.5 rounded`}>
                  {area.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Configuracao() {
  const [projetista, setProjetista] = useState("Estruturas Apex");
  const [caderno, setCaderno] = useState("Caderno de Pilares");
  const [activeRegion, setActiveRegion] = useState(null);
  const [activeTool, setActiveTool] = useState(null);
  const [zoom, setZoom] = useState(100);

  function handleMap(id) {
    setActiveRegion(activeRegion === id ? null : id);
    setActiveTool("draw");
  }

  const mappedCount = CAPTURE_REGIONS.filter(r => r.mapped).length;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="px-6 pt-6 pb-4 flex-shrink-0"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#3B82F6] flex items-center justify-center">
              <span className="text-[11px] font-bold text-white">1</span>
            </div>
            <h1 className="text-xl font-semibold text-[#0F0F0F]">Mapeamento Espacial do PDF</h1>
          </div>
          <span className="text-xs font-medium text-[#6B6B72] bg-[#F1F1F4] px-2.5 py-1 rounded-full">Passo 1 de 3</span>
        </div>
        <p className="text-sm text-[#6B6B72] mt-1 ml-9">
          Indique em quais regiões da folha padrão ficam os blocos principais de informação.
        </p>
      </motion.div>

      {/* Main layout */}
      <div className="flex flex-1 min-h-0 gap-0 px-6 pb-6">

        {/* ── LEFT PANEL ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          className="w-[296px] flex-shrink-0 flex flex-col gap-4 mr-5"
        >
          {/* Context selectors */}
          <div className="bg-white border border-[#E5E5E8] rounded-2xl shadow-sm p-5 flex flex-col gap-4">
            <div>
              <p className="text-[11px] font-semibold text-[#6B6B72] uppercase tracking-wider mb-1.5">Projetista</p>
              <SelectField value={projetista} onChange={setProjetista} options={PROJETISTAS} placeholder="Selecione..." />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#6B6B72] uppercase tracking-wider mb-1.5">Tipo de Caderno</p>
              <SelectField value={caderno} onChange={setCaderno} options={CADERNOS} placeholder="Selecione..." />
            </div>
          </div>

          {/* Capture regions list */}
          <div className="bg-white border border-[#E5E5E8] rounded-2xl shadow-sm p-5 flex flex-col gap-3 flex-1 overflow-hidden">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#0F0F0F]">Áreas de Captura Obrigatórias</p>
                <span className="text-[11px] font-medium text-[#6B6B72]">{mappedCount}/{CAPTURE_REGIONS.length}</span>
              </div>
              {/* Progress bar */}
              <div className="mt-2 h-1 w-full bg-[#F1F1F4] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#3B82F6] rounded-full transition-all duration-500"
                  style={{ width: `${(mappedCount / CAPTURE_REGIONS.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto flex-1">
              {CAPTURE_REGIONS.map((region, i) => (
                <RegionRow
                  key={region.id}
                  region={region}
                  index={i}
                  active={activeRegion === region.id}
                  onMap={handleMap}
                />
              ))}
            </div>
          </div>

          {/* Advance button */}
          <Button className="w-full h-10 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl text-sm font-medium shadow-sm gap-2 flex-shrink-0">
            Avançar para Regras dos Painéis (Passo 2)
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>

        {/* ── RIGHT PANEL ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          className="flex-1 min-w-0 flex flex-col bg-white border border-[#E5E5E8] rounded-2xl shadow-sm overflow-hidden"
        >
          {/* Toolbar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#E5E5E8] flex-shrink-0 bg-[#FAFAFA]">
            <Button variant="outline" size="sm" className="h-8 px-3 text-xs font-medium rounded-lg border-[#E5E5E8] text-[#4A4A52] hover:bg-[#F1F1F4] gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              Carregar PDF de Exemplo
            </Button>

            <div className="h-5 w-px bg-[#E5E5E8] mx-1" />

            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoom(z => Math.max(50, z - 10))}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6B72] border border-[#E5E5E8] bg-white hover:bg-[#F1F1F4] transition-colors"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-medium text-[#4A4A52] w-10 text-center tabular-nums">{zoom}%</span>
              <button
                onClick={() => setZoom(z => Math.min(200, z + 10))}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6B72] border border-[#E5E5E8] bg-white hover:bg-[#F1F1F4] transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-5 w-px bg-[#E5E5E8] mx-1" />

            <button
              onClick={() => setActiveTool(activeTool === "draw" ? null : "draw")}
              className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium border transition-colors ${
                activeTool === "draw"
                  ? "bg-[#EFF6FF] border-[#3B82F6] text-[#3B82F6]"
                  : "bg-white border-[#E5E5E8] text-[#4A4A52] hover:bg-[#F1F1F4]"
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              Desenhar Nova Região Retangular
            </button>

            {/* Active region indicator */}
            {activeRegion && (
              <div className="ml-auto flex items-center gap-1.5 bg-[#EFF6FF] border border-[#3B82F6] rounded-lg px-3 h-8">
                <div className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse" />
                <span className="text-xs font-medium text-[#3B82F6]">
                  Mapeando Região {activeRegion}
                </span>
              </div>
            )}
          </div>

          {/* Blueprint viewer */}
          <div className="flex-1 overflow-auto">
            <BlueprintSheet zoom={zoom} />
          </div>
        </motion.div>

      </div>
    </div>
  );
}