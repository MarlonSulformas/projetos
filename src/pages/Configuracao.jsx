import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/supabaseClient";
import { Plus, ArrowRight, Target, CheckCircle2, Clock, Trash2, Upload, ZoomIn, ZoomOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import BlueprintCanvas from "@/components/configuracao/BlueprintCanvas";

const PROJETISTAS_LIST = ["Estruturas Apex", "Engenharia Delta", "Concretar Estrutural", "Prémold Tech"];
const CADERNOS = ["Caderno de Pilares", "Caderno de Vigas", "Caderno de Lajes", "Caderno de Painéis"];

const COLOR_OPTIONS = [
  { id: "blue",   label: "Azul",   cls: "bg-blue-500",   border: "border-blue-500",   light: "bg-blue-50" },
  { id: "green",  label: "Verde",  cls: "bg-green-500",  border: "border-green-500",  light: "bg-green-50" },
  { id: "orange", label: "Laranja",cls: "bg-orange-500", border: "border-orange-500", light: "bg-orange-50" },
  { id: "violet", label: "Roxo",   cls: "bg-violet-500", border: "border-violet-500", light: "bg-violet-50" },
];

function getColorMeta(id) {
  return COLOR_OPTIONS.find(c => c.id === id) || COLOR_OPTIONS[0];
}

function NewAreaModal({ onConfirm, onClose }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("blue");
  const inputRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50); }, []);

  function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onConfirm({ name: name.trim(), color });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.18 }}
        className="bg-white rounded-2xl shadow-xl border border-[#E5E5E8] w-[340px] p-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-[#0F0F0F]">Nova Área de Captura</p>
          <button onClick={onClose} className="w-6 h-6 rounded-md flex items-center justify-center text-[#9CA3AF] hover:bg-[#F1F1F4] transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label className="text-[11px] font-semibold text-[#6B6B72] uppercase tracking-wider block mb-1.5">
              Nome da Área
            </label>
            <input
              ref={inputRef}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Vista Frontal, Carimbo..."
              className="w-full border border-[#E5E5E8] rounded-lg px-3 py-2 text-sm text-[#1F1F24] focus:outline-none focus:ring-1 focus:ring-[#3B82F6] focus:border-[#3B82F6] transition-colors"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#6B6B72] uppercase tracking-wider block mb-2">
              Cor do Retângulo
            </label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-2 rounded-xl border-2 transition-all ${
                    color === c.id ? `${c.border} ${c.light}` : "border-[#E5E5E8] bg-white hover:border-[#D4D4D8]"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full ${c.cls}`} />
                  <span className="text-[10px] font-medium text-[#4A4A52]">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 mt-1">
            <button type="button" onClick={onClose} className="flex-1 h-9 rounded-xl border border-[#E5E5E8] text-sm font-medium text-[#4A4A52] hover:bg-[#F1F1F4] transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={!name.trim()} className="flex-1 h-9 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-sm font-medium text-white transition-colors">
              Criar Área
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function AreaCard({ area, active, onTarget, onDelete }) {
  const c = getColorMeta(area.color);
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all duration-150 group ${
        active ? `${c.border} ${c.light} border-2` : "border-[#E5E5E8] bg-white hover:border-[#D4D4D8]"
      }`}
    >
      {/* Color dot */}
      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${c.cls}`} />

      {/* Name */}
      <p className="flex-1 text-[12px] font-medium text-[#1F1F24] truncate">{area.name}</p>

      {/* Status */}
      {area.rect ? (
        <span className="flex items-center gap-1 text-[10px] font-semibold text-green-600 whitespace-nowrap">
          <CheckCircle2 className="w-3 h-3" />
        </span>
      ) : (
        <span className="flex items-center gap-1 text-[10px] text-[#9CA3AF] whitespace-nowrap">
          <Clock className="w-3 h-3" />
        </span>
      )}

      {/* Target button */}
      <button
        onClick={() => onTarget(area.id)}
        title="Demarcar no PDF"
        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
          active
            ? "bg-[#3B82F6] text-white"
            : "bg-[#F1F1F4] text-[#6B6B72] hover:bg-[#E5E5E8]"
        }`}
      >
        <Target className="w-3.5 h-3.5" />
      </button>

      {/* Delete */}
      <button
        onClick={() => onDelete(area.id)}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-red-50 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </motion.div>
  );
}

export default function Configuracao() {
  const [projetista, setProjetista] = useState("Estruturas Apex");
  const [caderno, setCaderno] = useState("Caderno de Pilares");
  const [areas, setAreas] = useState([]);
  const [activeAreaId, setActiveAreaId] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfName, setPdfName] = useState(null);
  const fileInputRef = useRef(null);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(URL.createObjectURL(file));
    setPdfName(file.name);
  }

  useEffect(() => {
    async function load() {
      // Find the projetista UUID by name, then load gabaritos
      try {
        const allProjetistas = await db.listProjetistas();
        const found = (allProjetistas || []).find(p => p.nome_razao_social === projetista);
        const pid = found?.id || projetista;
        const records = await db.listGabaritos(pid);
        setAreas((records || [])
          .filter(r => !caderno || r.tipo_documento === caderno || !r.tipo_documento)
          .map(r => ({
            id: r.id,
            recordId: r.id,
            projetistaId: pid,
            name: r.nome_regiao,
            color: r.cor_marcador || "blue",
            rect: r.largura > 0 ? { x: r.coordenada_x, y: r.coordenada_y, width: r.largura, height: r.altura } : null,
          })));
      } catch {
        setAreas([]);
      }
      setActiveAreaId(null);
    }
    load();
  }, [projetista, caderno]);

  async function resolveProjetistaId() {
    const all = await db.listProjetistas();
    const found = (all || []).find(p => p.nome_razao_social === projetista);
    return found?.id || null;
  }

  async function handleCreateArea({ name, color }) {
    setShowModal(false);
    setSaving(true);
    const pid = await resolveProjetistaId();
    const created = await db.createGabarito({
      id_projetista: pid,
      tipo_documento: caderno,
      nome_regiao: name,
      cor_marcador: color,
      coordenada_x: 0,
      coordenada_y: 0,
      largura: 0,
      altura: 0,
    });
    setAreas(prev => [...prev, {
      id: created.id,
      recordId: created.id,
      projetistaId: pid,
      name,
      color,
      rect: null,
    }]);
    setSaving(false);
  }

  async function handleRegionDrawn(areaId, rect) {
    const area = areas.find(a => a.id === areaId);
    if (!area) return;
    setSaving(true);
    await db.updateGabarito(area.recordId, {
      coordenada_x: Math.round(rect.x),
      coordenada_y: Math.round(rect.y),
      largura: Math.round(rect.width),
      altura: Math.round(rect.height),
    });
    setAreas(prev => prev.map(a => a.id === areaId ? { ...a, rect } : a));
    setActiveAreaId(null);
    setSaving(false);
  }

  async function handleRegionDeleted(areaId) {
    const area = areas.find(a => a.id === areaId);
    if (!area) return;
    await db.updateGabarito(area.recordId, {
      coordenada_x: 0, coordenada_y: 0, largura: 0, altura: 0,
    });
    setAreas(prev => prev.map(a => a.id === areaId ? { ...a, rect: null } : a));
  }

  async function handleDeleteArea(areaId) {
    const area = areas.find(a => a.id === areaId);
    if (!area) return;
    await db.deleteGabarito(area.recordId);
    setAreas(prev => prev.filter(a => a.id !== areaId));
    if (activeAreaId === areaId) setActiveAreaId(null);
  }

  function handleTarget(areaId) {
    setActiveAreaId(prev => prev === areaId ? null : areaId);
  }

  const mappedCount = areas.filter(a => a.rect).length;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 pt-5 pb-3 flex-shrink-0 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg bg-[#3B82F6] flex items-center justify-center flex-shrink-0">
            <span className="text-[11px] font-bold text-white">1</span>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-semibold text-[#0F0F0F]">Mapeamento Espacial do PDF</h1>
              <span className="text-[11px] font-medium text-[#6B6B72] bg-[#F1F1F4] px-2 py-0.5 rounded-full">Passo 1 de 3</span>
            </div>
            <p className="text-xs text-[#6B6B72] mt-0.5">Indique em quais regiões da folha padrão ficam os blocos principais de informação.</p>
          </div>
        </div>
        <Button className="h-9 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded-xl text-sm font-medium shadow-sm gap-2 px-4 flex-shrink-0">
          Avançar para Regras (Passo 2)
          <ArrowRight className="w-4 h-4" />
        </Button>
      </motion.div>

      {/* Body — 25 / 75 split */}
      <div className="flex flex-1 min-h-0 px-6 pb-6 gap-4 overflow-hidden">

        {/* ── LEFT PANEL (25%) ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="w-[240px] flex-shrink-0 flex flex-col gap-3"
        >
          {/* Selectors */}
          <div className="bg-white border border-[#E5E5E8] rounded-2xl shadow-sm p-4 flex flex-col gap-3">
            <div>
              <p className="text-[10px] font-semibold text-[#6B6B72] uppercase tracking-wider mb-1">Projetista</p>
              <div className="relative">
                <select
                  value={projetista}
                  onChange={e => setProjetista(e.target.value)}
                  className="w-full appearance-none bg-white border border-[#E5E5E8] text-xs text-[#1F1F24] rounded-lg px-2.5 py-1.5 pr-7 focus:outline-none focus:ring-1 focus:ring-[#3B82F6] cursor-pointer"
                >
                  {PROJETISTAS_LIST.map(o => <option key={o}>{o}</option>)}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#6B6B72]">▾</div>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-[#6B6B72] uppercase tracking-wider mb-1">Tipo de Caderno</p>
              <div className="relative">
                <select
                  value={caderno}
                  onChange={e => setCaderno(e.target.value)}
                  className="w-full appearance-none bg-white border border-[#E5E5E8] text-xs text-[#1F1F24] rounded-lg px-2.5 py-1.5 pr-7 focus:outline-none focus:ring-1 focus:ring-[#3B82F6] cursor-pointer"
                >
                  {CADERNOS.map(o => <option key={o}>{o}</option>)}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#6B6B72]">▾</div>
              </div>
            </div>
          </div>

          {/* Areas manager */}
          <div className="bg-white border border-[#E5E5E8] rounded-2xl shadow-sm p-4 flex flex-col gap-3 flex-1 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between flex-shrink-0">
              <div>
                <p className="text-xs font-semibold text-[#0F0F0F]">Áreas de Captura</p>
                <p className="text-[10px] text-[#9CA3AF]">{mappedCount}/{areas.length} mapeadas</p>
              </div>
              {areas.length > 0 && (
                <div className="h-1 w-16 bg-[#F1F1F4] rounded-full overflow-hidden">
                  <div className="h-full bg-[#3B82F6] rounded-full transition-all duration-500" style={{ width: `${areas.length ? (mappedCount / areas.length) * 100 : 0}%` }} />
                </div>
              )}
            </div>

            {/* Create button */}
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center gap-1.5 w-full h-9 rounded-xl border-2 border-dashed border-[#D1D5DB] text-xs font-medium text-[#6B6B72] hover:border-[#3B82F6] hover:text-[#3B82F6] hover:bg-[#EFF6FF] transition-all duration-150 flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Criar Nova Área de Captura
            </button>

            {/* Area cards */}
            <div className="flex flex-col gap-1.5 overflow-y-auto flex-1">
              {areas.length === 0 ? (
                <div className="flex-1 flex items-center justify-center py-8 text-center">
                  <p className="text-[11px] text-[#9CA3AF] leading-relaxed">Nenhuma área criada.<br />Clique em "+ Criar" para começar.</p>
                </div>
              ) : (
                areas.map(area => (
                  <AreaCard
                    key={area.id}
                    area={area}
                    active={activeAreaId === area.id}
                    onTarget={handleTarget}
                    onDelete={handleDeleteArea}
                  />
                ))
              )}
            </div>

            {saving && (
              <div className="flex items-center gap-1.5 text-[10px] text-[#3B82F6] flex-shrink-0">
                <div className="w-3 h-3 border-2 border-[#BFDBFE] border-t-[#3B82F6] rounded-full animate-spin" />
                Salvando...
              </div>
            )}
          </div>
        </motion.div>

        {/* ── RIGHT PANEL (75%) ────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 min-w-0 min-h-0 flex flex-col bg-white border border-[#E5E5E8] rounded-2xl shadow-sm overflow-hidden"
        >
          {/* Toolbar */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#E5E5E8] flex-shrink-0 bg-[#FAFAFA]">
            <input type="file" accept=".pdf" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium border border-[#E5E5E8] bg-white text-[#4A4A52] hover:bg-[#F1F1F4] transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              {pdfName ? pdfName : "Carregar PDF"}
            </button>

            <div className="h-4 w-px bg-[#E5E5E8]" />

            <div className="flex items-center gap-1">
              <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6B6B72] border border-[#E5E5E8] bg-white hover:bg-[#F1F1F4] transition-colors">
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-medium text-[#4A4A52] w-10 text-center tabular-nums">{zoom}%</span>
              <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6B6B72] border border-[#E5E5E8] bg-white hover:bg-[#F1F1F4] transition-colors">
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {activeAreaId && (() => {
              const a = areas.find(x => x.id === activeAreaId);
              const c = a ? getColorMeta(a.color) : null;
              return (
                <div className="ml-2 flex items-center gap-1.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg px-3 h-7">
                  {c && <div className={`w-2 h-2 rounded-full ${c.cls} animate-pulse`} />}
                  <span className="text-[11px] font-medium text-[#3B82F6]">
                    Clique e arraste para demarcar "{a?.name}"
                  </span>
                  <button onClick={() => setActiveAreaId(null)} className="ml-1 text-[#93C5FD] hover:text-[#3B82F6]">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })()}
          </div>

          {/* Canvas */}
          <div className="flex-1 min-h-0 overflow-auto">
            {pdfUrl ? (
              <BlueprintCanvas
                zoom={zoom}
                activeAreaId={activeAreaId}
                areas={areas}
                pdfUrl={pdfUrl}
                onRegionDrawn={handleRegionDrawn}
                onRegionDeleted={handleRegionDeleted}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#F8F9FB] gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] flex items-center justify-center">
                  <Upload className="w-6 h-6 text-[#3B82F6]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-[#1F1F24]">Nenhum PDF carregado</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">Clique em "Carregar PDF" na barra acima para começar o mapeamento.</p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 h-9 px-4 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-medium transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Selecionar arquivo PDF
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* New area modal */}
      <AnimatePresence>
        {showModal && <NewAreaModal onConfirm={handleCreateArea} onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </div>
  );
}