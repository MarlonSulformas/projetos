import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus, Save, Upload, ZoomIn, ZoomOut, Crosshair, Trash2, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Static mock data ─────────────────────────────────────────────────────────
const PROJETISTAS = ["Estruturas Apex", "Engenharia Delta", "Concretar Estrutural", "Prémold Tech"];
const PRODUTOS = {
  "Estruturas Apex": ["Vigas Pré-Moldadas", "Pilares Industriais"],
  "Engenharia Delta": ["Fundação Profunda"],
  "Concretar Estrutural": ["Painéis de Fachada", "Escadas Pré-Moldadas"],
  "Prémold Tech": ["Lajes Nervuradas"],
};

const FIELD_TYPES = ["Texto", "Número", "Tabela", "Data", "Booleano"];

const TYPE_COLORS = {
  Texto: "bg-blue-50 text-blue-600 border-blue-200",
  Número: "bg-violet-50 text-violet-600 border-violet-200",
  Tabela: "bg-amber-50 text-amber-600 border-amber-200",
  Data: "bg-teal-50 text-teal-600 border-teal-200",
  Booleano: "bg-pink-50 text-pink-600 border-pink-200",
};

const INITIAL_FIELDS = [
  { id: 1, label: "Identificação do Pilar", type: "Texto" },
  { id: 2, label: "Carga / Força Axial", type: "Número" },
  { id: 3, label: "Volume de Concreto", type: "Número" },
  { id: 4, label: "Detalhamento de Armadura / Ferro", type: "Tabela" },
  { id: 5, label: "Dados do Carimbo", type: "Texto" },
];

// Demarcation areas overlaid on the PDF viewer
const DEMO_AREAS = [
  {
    id: 1, label: "Área 1: Identificação do Pilar",
    color: "bg-blue-400/20 border-blue-500",
    textColor: "text-blue-700",
    style: { top: "5%", left: "4%", width: "60%", height: "9%" },
  },
  {
    id: 4, label: "Área 4: Detalhamento de Armadura",
    color: "bg-green-400/20 border-green-500",
    textColor: "text-green-700",
    style: { top: "28%", left: "60%", width: "36%", height: "40%" },
  },
  {
    id: 5, label: "Área 5: Dados do Carimbo",
    color: "bg-orange-400/20 border-orange-500",
    textColor: "text-orange-700",
    style: { bottom: "4%", right: "3%", width: "38%", height: "11%" },
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function Select({ value, onChange, options, placeholder }) {
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

function FieldRow({ field, index, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className="flex items-center gap-2 p-3 bg-white border border-[#E5E5E8] rounded-xl hover:border-[#D4D4D8] transition-colors group"
    >
      <div className="w-5 h-5 rounded-md bg-[#F1F1F4] flex items-center justify-center flex-shrink-0">
        <span className="text-[10px] font-bold text-[#6B6B72]">{field.id}</span>
      </div>
      <p className="flex-1 text-sm text-[#1F1F24] font-medium truncate">{field.label}</p>
      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${TYPE_COLORS[field.type] || TYPE_COLORS["Texto"]}`}>
        {field.type}
      </span>
      <button
        onClick={() => onDelete(field.id)}
        className="w-6 h-6 rounded-md flex items-center justify-center text-[#A1A1AA] hover:text-red-400 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

function BlueprintViewer({ zoom }) {
  const scale = zoom / 100;

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#F7F7FA] flex items-center justify-center">
      {/* Sheet */}
      <div
        className="relative bg-white shadow-md"
        style={{
          width: `${scale * 680}px`,
          height: `${scale * 480}px`,
          transition: "width 0.2s, height 0.2s",
          border: "1px solid #D4D4D8",
        }}
      >
        {/* Technical drawing SVG */}
        <svg
          width="100%" height="100%"
          viewBox="0 0 680 480"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0"
        >
          {/* Title border */}
          <rect x="10" y="10" width="660" height="460" fill="none" stroke="#9CA3AF" strokeWidth="1.2" />
          <rect x="14" y="14" width="652" height="452" fill="none" stroke="#D1D5DB" strokeWidth="0.5" />

          {/* Header strip */}
          <rect x="10" y="10" width="660" height="46" fill="#F9FAFB" stroke="#9CA3AF" strokeWidth="1" />
          <text x="340" y="26" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1F2937" fontFamily="Inter, sans-serif">PROJETO ESTRUTURAL — DETALHE DE PILAR P-07</text>
          <text x="340" y="42" textAnchor="middle" fontSize="8" fill="#6B7280" fontFamily="Inter, sans-serif">ESCALA 1:20  |  FOLHA 03/12  |  REVISÃO B</text>

          {/* Column cross-section */}
          <rect x="70" y="90" width="340" height="290" fill="none" stroke="#374151" strokeWidth="1" />
          {/* Grid inside column */}
          {[...Array(6)].map((_, i) => (
            <line key={`h${i}`} x1="70" y1={90 + (i + 1) * (290 / 7)} x2="410" y2={90 + (i + 1) * (290 / 7)} stroke="#E5E7EB" strokeWidth="0.6" />
          ))}
          {[...Array(5)].map((_, i) => (
            <line key={`v${i}`} x1={70 + (i + 1) * (340 / 6)} y1="90" x2={70 + (i + 1) * (340 / 6)} y2="380" stroke="#E5E7EB" strokeWidth="0.6" />
          ))}

          {/* Rebar circles */}
          {[[110,130],[370,130],[110,340],[370,340],[240,130],[240,340],[110,235],[370,235]].map(([cx,cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="8" fill="#F3F4F6" stroke="#4B5563" strokeWidth="1.5" />
          ))}
          {[[110,130],[370,130],[110,340],[370,340],[240,130],[240,340],[110,235],[370,235]].map(([cx,cy], i) => (
            <circle key={`inner-${i}`} cx={cx} cy={cy} r="4" fill="#9CA3AF" />
          ))}

          {/* Stirrups */}
          <rect x="95" y="118" width="300" height="15" fill="none" stroke="#6B7280" strokeWidth="0.8" strokeDasharray="4 3" />
          <rect x="95" y="222" width="300" height="15" fill="none" stroke="#6B7280" strokeWidth="0.8" strokeDasharray="4 3" />
          <rect x="95" y="328" width="300" height="15" fill="none" stroke="#6B7280" strokeWidth="0.8" strokeDasharray="4 3" />

          {/* Dimension lines */}
          <line x1="55" y1="90" x2="55" y2="380" stroke="#6B7280" strokeWidth="0.8" />
          <line x1="50" y1="90" x2="60" y2="90" stroke="#6B7280" strokeWidth="0.8" />
          <line x1="50" y1="380" x2="60" y2="380" stroke="#6B7280" strokeWidth="0.8" />
          <text x="42" y="240" fontSize="7" fill="#6B7280" textAnchor="middle" transform="rotate(-90,42,240)" fontFamily="Inter, sans-serif">h = 290 cm</text>

          <line x1="70" y1="75" x2="410" y2="75" stroke="#6B7280" strokeWidth="0.8" />
          <line x1="70" y1="70" x2="70" y2="80" stroke="#6B7280" strokeWidth="0.8" />
          <line x1="410" y1="70" x2="410" y2="80" stroke="#6B7280" strokeWidth="0.8" />
          <text x="240" y="70" fontSize="7" fill="#6B7280" textAnchor="middle" fontFamily="Inter, sans-serif">b = 340 cm</text>

          {/* Side table (armadura) */}
          <rect x="425" y="90" width="230" height="220" fill="#FAFAFA" stroke="#9CA3AF" strokeWidth="0.8" />
          <rect x="425" y="90" width="230" height="22" fill="#F3F4F6" stroke="#9CA3AF" strokeWidth="0.8" />
          <text x="540" y="105" textAnchor="middle" fontSize="8" fontWeight="700" fill="#1F2937" fontFamily="Inter, sans-serif">QUADRO DE ARMADURA</text>
          {["Barra", "Qtd.", "Diâm.", "Comp."].map((h, i) => (
            <text key={i} x={435 + i * 57} y="122" fontSize="7" fontWeight="600" fill="#374151" fontFamily="Inter, sans-serif">{h}</text>
          ))}
          {[["A1","8","20mm","2.90m"],["A2","8","16mm","2.90m"],["E1","18","8mm","1.26m"],["E2","12","8mm","0.90m"]].map(([b,q,d,c], row) => (
            <g key={row}>
              <rect x="425" y={130 + row * 22} width="230" height="22" fill={row % 2 === 0 ? "#fff" : "#F9FAFB"} stroke="#E5E7EB" strokeWidth="0.4" />
              {[b,q,d,c].map((v, col) => (
                <text key={col} x={435 + col * 57} y={145 + row * 22} fontSize="7" fill="#374151" fontFamily="Inter, sans-serif">{v}</text>
              ))}
            </g>
          ))}

          {/* Notes below table */}
          <text x="425" y="330" fontSize="7" fill="#6B7280" fontFamily="Inter, sans-serif">OBS: Armadura conforme NBR 6118:2014</text>
          <text x="425" y="342" fontSize="7" fill="#6B7280" fontFamily="Inter, sans-serif">Concreto: fck = 30 MPa | Aço: CA-50</text>
          <text x="425" y="354" fontSize="7" fill="#6B7280" fontFamily="Inter, sans-serif">Cobrimento: 3.0 cm (agressividade II)</text>

          {/* Title block / carimbo */}
          <rect x="10" y="394" width="660" height="76" fill="#F9FAFB" stroke="#9CA3AF" strokeWidth="1" />
          <line x1="220" y1="394" x2="220" y2="470" stroke="#9CA3AF" strokeWidth="0.8" />
          <line x1="420" y1="394" x2="420" y2="470" stroke="#9CA3AF" strokeWidth="0.8" />
          <line x1="10" y1="428" x2="220" y2="428" stroke="#E5E7EB" strokeWidth="0.5" />
          <line x1="420" y1="428" x2="660" y2="428" stroke="#E5E7EB" strokeWidth="0.5" />
          <text x="115" y="414" textAnchor="middle" fontSize="8" fontWeight="700" fill="#1F2937" fontFamily="Inter, sans-serif">ESTRUTURAS APEX ENG. LTDA.</text>
          <text x="115" y="444" textAnchor="middle" fontSize="7" fill="#4B5563" fontFamily="Inter, sans-serif">Responsável: Eng. A. Silva</text>
          <text x="115" y="456" textAnchor="middle" fontSize="7" fill="#4B5563" fontFamily="Inter, sans-serif">CREA: 12345-D/SP</text>
          <text x="320" y="414" textAnchor="middle" fontSize="8" fontWeight="600" fill="#1F2937" fontFamily="Inter, sans-serif">OBRA: Edifício Torres do Rio</text>
          <text x="320" y="444" textAnchor="middle" fontSize="7" fill="#4B5563" fontFamily="Inter, sans-serif">Local: São Paulo - SP</text>
          <text x="320" y="456" textAnchor="middle" fontSize="7" fill="#4B5563" fontFamily="Inter, sans-serif">Contrato: 2024/0087</text>
          <text x="540" y="414" textAnchor="middle" fontSize="8" fontWeight="600" fill="#1F2937" fontFamily="Inter, sans-serif">Data: Mar/2024</text>
          <text x="540" y="444" textAnchor="middle" fontSize="7" fill="#4B5563" fontFamily="Inter, sans-serif">Revisão: B | Folha: 03/12</text>
          <text x="540" y="456" textAnchor="middle" fontSize="7" fill="#4B5563" fontFamily="Inter, sans-serif">Arquivo: EST-P07-R2</text>
        </svg>

        {/* Demarcation areas */}
        {DEMO_AREAS.map((area) => (
          <div
            key={area.id}
            className={`absolute border-2 ${area.color} rounded-sm pointer-events-none`}
            style={area.style}
          >
            <span className={`absolute top-1 left-1.5 text-[10px] font-semibold ${area.textColor} whitespace-nowrap`}>
              {area.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Configuracao() {
  const [projetista, setProjetista] = useState("Estruturas Apex");
  const [produto, setProduto] = useState("Pilares Industriais");
  const [fields, setFields] = useState(INITIAL_FIELDS);
  const [zoom, setZoom] = useState(100);
  const [activeTool, setActiveTool] = useState(null);

  const produtoOptions = PRODUTOS[projetista] || [];

  function handleDeleteField(id) {
    setFields((f) => f.filter((x) => x.id !== id));
  }

  function handleAddField() {
    const newId = (fields[fields.length - 1]?.id || 0) + 1;
    setFields((f) => [...f, { id: newId, label: `Campo ${newId}`, type: "Texto" }]);
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="px-6 pt-6 pb-4 flex-shrink-0"
      >
        <h1 className="text-xl font-semibold text-[#0F0F0F]">Configuração de Gabarito de Leitura</h1>
        <p className="text-sm text-[#6B6B72] mt-0.5">
          Defina os campos de extração e demarcue as regiões de captura no PDF do projeto.
        </p>
      </motion.div>

      {/* Two-column layout */}
      <div className="flex flex-1 min-h-0 gap-0 px-6 pb-6">

        {/* ── LEFT COLUMN ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          className="w-[300px] flex-shrink-0 flex flex-col gap-4 mr-5"
        >
          {/* Context selectors */}
          <div className="bg-white border border-[#E5E5E8] rounded-2xl shadow-sm p-5 flex flex-col gap-4">
            <div>
              <p className="text-[11px] font-semibold text-[#6B6B72] uppercase tracking-wider mb-1.5">Projetista</p>
              <Select
                value={projetista}
                onChange={(v) => { setProjetista(v); setProduto(PRODUTOS[v]?.[0] || ""); }}
                options={PROJETISTAS}
                placeholder="Selecione..."
              />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#6B6B72] uppercase tracking-wider mb-1.5">Produto / Esquema</p>
              <Select
                value={produto}
                onChange={setProduto}
                options={produtoOptions}
                placeholder="Selecione..."
              />
            </div>
          </div>

          {/* Fields for extraction */}
          <div className="bg-white border border-[#E5E5E8] rounded-2xl shadow-sm p-5 flex flex-col gap-3 flex-1 overflow-hidden">
            <div className="flex items-center justify-between flex-shrink-0">
              <div>
                <p className="text-sm font-semibold text-[#0F0F0F]">Campos para Extração</p>
                <p className="text-[11px] text-[#6B6B72] mt-0.5">{fields.length} campo{fields.length !== 1 ? "s" : ""} configurado{fields.length !== 1 ? "s" : ""}</p>
              </div>
              <button
                onClick={handleAddField}
                className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#3B82F6] hover:bg-[#DBEAFE] flex items-center justify-center transition-colors"
                title="Adicionar campo"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto flex-1 pr-0.5">
              {fields.map((f, i) => (
                <FieldRow key={f.id} field={f} index={i} onDelete={handleDeleteField} />
              ))}
            </div>
          </div>

          {/* Save button */}
          <Button className="w-full h-10 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl text-sm font-medium shadow-sm gap-2 flex-shrink-0">
            <Save className="w-4 h-4" />
            Salvar Gabarito de Leitura
          </Button>
        </motion.div>

        {/* ── RIGHT COLUMN ────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          className="flex-1 min-w-0 flex flex-col bg-white border border-[#E5E5E8] rounded-2xl shadow-sm overflow-hidden"
        >
          {/* Toolbar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#E5E5E8] flex-shrink-0 bg-[#FAFAFA]">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs font-medium rounded-lg border-[#E5E5E8] text-[#4A4A52] hover:bg-[#F1F1F4] gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              Carregar PDF de Exemplo
            </Button>

            <div className="h-5 w-px bg-[#E5E5E8] mx-1" />

            {/* Zoom controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoom((z) => Math.max(50, z - 10))}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6B72] border border-[#E5E5E8] bg-white hover:bg-[#F1F1F4] transition-colors"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-medium text-[#4A4A52] w-10 text-center tabular-nums">{zoom}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(200, z + 10))}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6B72] border border-[#E5E5E8] bg-white hover:bg-[#F1F1F4] transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-5 w-px bg-[#E5E5E8] mx-1" />

            {/* Draw tool */}
            <button
              onClick={() => setActiveTool(activeTool === "draw" ? null : "draw")}
              className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium border transition-colors
                ${activeTool === "draw"
                  ? "bg-[#EFF6FF] border-[#3B82F6] text-[#3B82F6]"
                  : "bg-white border-[#E5E5E8] text-[#4A4A52] hover:bg-[#F1F1F4]"
                }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              Desenhar Área de Captura
            </button>

            {/* Legend pills */}
            <div className="ml-auto flex items-center gap-2">
              {DEMO_AREAS.map((a) => (
                <span key={a.id} className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${a.color} ${a.textColor}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${a.color.split(" ")[0].replace("/20", "").replace("bg-", "bg-")}`} />
                  Área {a.id}
                </span>
              ))}
            </div>
          </div>

          {/* PDF Viewer area */}
          <div className="flex-1 overflow-auto">
            <BlueprintViewer zoom={zoom} />
          </div>
        </motion.div>

      </div>
    </div>
  );
}