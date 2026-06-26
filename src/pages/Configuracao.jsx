import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import {
  ChevronDown, Upload, ZoomIn, ZoomOut, Crosshair,
  CheckCircle2, Circle, ArrowRight, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import BlueprintCanvas from "@/components/configuracao/BlueprintCanvas";

const PROJETISTAS_LIST = ["Estruturas Apex", "Engenharia Delta", "Concretar Estrutural", "Prémold Tech"];
const CADERNOS = ["Caderno de Pilares", "Caderno de Vigas", "Caderno de Lajes", "Caderno de Painéis"];

const REGION_DEFINITIONS = [
  { id: 1, label: "Vista Frontal dos Painéis", description: "Desenhos coloridos com sarrafos e painéis", color: "blue" },
  { id: 2, label: "Detalhe de Seção Transversal", description: "Espessura e quantidade de sarrafos por extremidade", color: "green" },
  { id: 3, label: "Tabela de Resumo / Quantitativos", description: "Totais e quantitativos da folha (se houver)", color: "violet" },
  { id: 4, label: "Carimbo de Identificação", description: "Nome da obra, pavimento e número do pilar", color: "slate" },
];

const COLOR_STYLES = {
  blue:   { active: "border-blue-500 bg-blue-50",   badge: "bg-blue-100 text-blue-700 border-blue-200",   btn: "bg-blue-500 hover:bg-blue-600 text-white" },
  green:  { active: "border-green-500 bg-green-50",  badge: "bg-green-100 text-green-700 border-green-200", btn: "bg-green-500 hover:bg-green-600 text-white" },
  violet: { active: "border-violet-500 bg-violet-50", badge: "bg-violet-100 text-violet-700 border-violet-200", btn: "bg-violet-500 hover:bg-violet-600 text-white" },
  slate:  { active: "border-slate-400 bg-slate-50",  badge: "bg-slate-100 text-slate-600 border-slate-200",  btn: "bg-slate-500 hover:bg-slate-600 text-white" },
};

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

function RegionCard({ region, active, onDemarcar }) {
  const s = COLOR_STYLES[region.color];
  return (
    <div
      className={`flex items-center gap-3 px-3 py-3 rounded-xl border transition-all duration-150 ${
        active ? s.active : "border-[#E5E5E8] bg-white hover:border-[#D4D4D8]"
      }`}
    >
      {/* Number */}
      <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-[11px] font-bold border ${s.badge}`}>
        {region.id}
      </div>

      {/* Label */}
      <p className="flex-1 text-[13px] font-medium text-[#1F1F24] leading-tight truncate">{region.label}</p>

      {/* Status badge */}
      {region.rect ? (
        <span className="flex items-center gap-1 text-[10px] font-semibold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full whitespace-nowrap">
          <CheckCircle2 className="w-3 h-3" /> Mapeado
        </span>
      ) : (
        <span className="flex items-center gap-1 text-[10px] font-medium text-[#9CA3AF] bg-[#F4F4F6] border border-[#E5E5E8] px-2 py-0.5 rounded-full whitespace-nowrap">
          <Circle className="w-3 h-3" /> Pendente
        </span>
      )}

      {/* Demarcar button */}
      <button
        onClick={() => onDemarcar(region.id)}
        className={`flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${
          active
            ? "bg-[#3B82F6] text-white"
            : "bg-white border border-[#E5E5E8] text-[#4A4A52] hover:bg-[#F1F1F4]"
        }`}
      >
        <Target className="w-3 h-3" />
        {active ? "Mapeando..." : "Demarcar"}
      </button>
    </div>
  );
}

export default function Configuracao() {
  const [projetista, setProjetista] = useState("Estruturas Apex");
  const [caderno, setCaderno] = useState("Caderno de Pilares");
  const [activeRegion, setActiveRegion] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  // regions state: array matching REGION_DEFINITIONS + rect field
  const [regions, setRegions] = useState(REGION_DEFINITIONS.map(r => ({ ...r, rect: null, recordId: null })));

  // Load saved gabaritos for current projetista + caderno
  useEffect(() => {
    async function load() {
      const records = await base44.entities.GabaritoEspacial.filter({
        projetista_id: projetista,
        tipo_documento: caderno,
      });
      setRegions(REGION_DEFINITIONS.map(r => {
        const saved = records.find(rec => rec.nome_regiao === r.label);
        return {
          ...r,
          rect: saved ? { x: saved.coordenada_x, y: saved.coordenada_y, width: saved.largura, height: saved.altura } : null,
          recordId: saved ? saved.id : null,
        };
      }));
      setActiveRegion(null);
    }
    load();
  }, [projetista, caderno]);

  async function handleRegionDrawn(regionId, rect) {
    const region = regions.find(r => r.id === regionId);
    if (!region) return;
    setSaving(true);
    // If already has a record, delete it first
    if (region.recordId) {
      await base44.entities.GabaritoEspacial.delete(region.recordId);
    }
    const created = await base44.entities.GabaritoEspacial.create({
      projetista_id: projetista,
      tipo_documento: caderno,
      nome_regiao: region.label,
      coordenada_x: Math.round(rect.x),
      coordenada_y: Math.round(rect.y),
      largura: Math.round(rect.width),
      altura: Math.round(rect.height),
    });
    setRegions(prev => prev.map(r =>
      r.id === regionId ? { ...r, rect, recordId: created.id } : r
    ));
    setActiveRegion(null);
    setSaving(false);
  }

  async function handleRegionDeleted(regionId) {
    const region = regions.find(r => r.id === regionId);
    if (!region) return;
    if (region.recordId) {
      await base44.entities.GabaritoEspacial.delete(region.recordId);
    }
    setRegions(prev => prev.map(r =>
      r.id === regionId ? { ...r, rect: null, recordId: null } : r
    ));
  }

  function handleDemarcar(id) {
    setActiveRegion(activeRegion === id ? null : id);
  }

  const mappedCount = regions.filter(r => r.rect).length;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="px-6 pt-6 pb-4 flex-shrink-0 flex items-start justify-between"
      >
        <div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-[#3B82F6] flex items-center justify-center">
              <span className="text-[11px] font-bold text-white">1</span>
            </div>
            <h1 className="text-xl font-semibold text-[#0F0F0F]">Mapeamento Espacial do PDF</h1>
            <span className="text-xs font-medium text-[#6B6B72] bg-[#F1F1F4] px-2.5 py-1 rounded-full">Passo 1 de 3</span>
          </div>
          <p className="text-sm text-[#6B6B72] mt-1 ml-9">
            Indique em quais regiões da folha padrão ficam os blocos principais de informação.
          </p>
        </div>

        {/* Advance button — top right */}
        <Button className="h-9 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded-xl text-sm font-medium shadow-sm gap-2 px-4 flex-shrink-0">
          Avançar para Regras (Passo 2)
          <ArrowRight className="w-4 h-4" />
        </Button>
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
              <SelectField value={projetista} onChange={setProjetista} options={PROJETISTAS_LIST} placeholder="Selecione..." />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#6B6B72] uppercase tracking-wider mb-1.5">Tipo de Caderno</p>
              <SelectField value={caderno} onChange={setCaderno} options={CADERNOS} placeholder="Selecione..." />
            </div>
          </div>

          {/* Capture regions */}
          <div className="bg-white border border-[#E5E5E8] rounded-2xl shadow-sm p-5 flex flex-col gap-3 flex-1 overflow-hidden">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#0F0F0F]">Áreas de Captura Obrigatórias</p>
                <span className="text-[11px] font-medium text-[#6B6B72]">{mappedCount}/{regions.length}</span>
              </div>
              <div className="mt-2 h-1 w-full bg-[#F1F1F4] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#3B82F6] rounded-full transition-all duration-500"
                  style={{ width: `${(mappedCount / regions.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto flex-1">
              {regions.map(region => (
                <RegionCard
                  key={region.id}
                  region={region}
                  active={activeRegion === region.id}
                  onDemarcar={handleDemarcar}
                />
              ))}
            </div>

            {saving && (
              <div className="flex items-center gap-2 text-xs text-[#3B82F6] pt-1 flex-shrink-0">
                <div className="w-3 h-3 border-2 border-[#BFDBFE] border-t-[#3B82F6] rounded-full animate-spin" />
                Salvando coordenadas...
              </div>
            )}
          </div>
        </motion.div>

        {/* ── RIGHT PANEL ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          className="flex-1 min-w-0 flex flex-col bg-white border border-[#E5E5E8] rounded-2xl shadow-sm overflow-hidden"
        >
          {/* Toolbar */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#E5E5E8] flex-shrink-0 bg-[#FAFAFA]">
            {/* Upload */}
            <input
              type="file"
              accept=".pdf"
              ref={fileInputRef}
              className="hidden"
              onChange={() => {}}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium border border-[#E5E5E8] bg-white text-[#4A4A52] hover:bg-[#F1F1F4] transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Carregar PDF de Exemplo
            </button>

            <div className="h-4 w-px bg-[#E5E5E8] mx-0.5" />

            {/* Zoom */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoom(z => Math.max(50, z - 10))}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6B6B72] border border-[#E5E5E8] bg-white hover:bg-[#F1F1F4] transition-colors"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-medium text-[#4A4A52] w-9 text-center tabular-nums">{zoom}%</span>
              <button
                onClick={() => setZoom(z => Math.min(200, z + 10))}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6B6B72] border border-[#E5E5E8] bg-white hover:bg-[#F1F1F4] transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-4 w-px bg-[#E5E5E8] mx-0.5" />

            {/* Draw tool */}
            <button
              onClick={() => setActiveRegion(activeRegion ? null : null)}
              disabled={!activeRegion}
              className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium border transition-colors ${
                activeRegion
                  ? "bg-[#EFF6FF] border-[#3B82F6] text-[#3B82F6]"
                  : "bg-white border-[#E5E5E8] text-[#A1A1AA] cursor-not-allowed"
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              Desenhar Região Retangular
            </button>

            {/* Active indicator */}
            {activeRegion && (
              <div className="ml-2 flex items-center gap-1.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg px-2.5 h-7">
                <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
                <span className="text-[11px] font-medium text-[#3B82F6]">
                  Clique e arraste para demarcar Região {activeRegion}
                </span>
              </div>
            )}
          </div>

          {/* Blueprint canvas */}
          <div className="flex-1 overflow-hidden">
            <BlueprintCanvas
              zoom={zoom}
              activeRegion={activeRegion}
              regions={regions}
              onRegionDrawn={handleRegionDrawn}
              onRegionDeleted={handleRegionDeleted}
            />
          </div>
        </motion.div>

      </div>
    </div>
  );
}