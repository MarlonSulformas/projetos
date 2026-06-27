import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, ChevronRight, Layers, Box, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import PainelCanvas from "@/components/treinamento/PainelCanvas";

// ── Tipos de componente estrutural ────────────────────────────────────────────
const TIPOS_COMPONENTE = [
  {
    tipo: "compensado",
    label: "Compensado",
    icon: "□",
    cor: "#3B82F6",
    corBg: "#EFF6FF",
    corBorder: "#BFDBFE",
    defaults: { espessura_mm: 18, formula_largura: "[Y]", formula_comprimento: "[X]", quantidade: 1 },
  },
  {
    tipo: "sarrafo_vertical",
    label: "Sarrafo Vertical",
    icon: "▌",
    cor: "#F59E0B",
    corBg: "#FFFBEB",
    corBorder: "#FDE68A",
    defaults: { largura_mm: 40, espessura_mm: 20, formula_comprimento: "[X]", quantidade: 2 },
  },
  {
    tipo: "travamento",
    label: "Travamento",
    icon: "═",
    cor: "#10B981",
    corBg: "#ECFDF5",
    corBorder: "#A7F3D0",
    defaults: { largura_mm: 40, espessura_mm: 20, formula_comprimento: "[Y]", quantidade: 3, espacamento_mm: 400 },
  },
];

function getTipometa(tipo) {
  return TIPOS_COMPONENTE.find(t => t.tipo === tipo) || TIPOS_COMPONENTE[0];
}

function newComponente(tipo) {
  const meta = getTipometa(tipo);
  return { id: crypto.randomUUID(), tipo, ...meta.defaults };
}

// ── Painel lateral esquerdo — lista de painéis ────────────────────────────────
function PainelSidebar({ paineis, selectedId, onSelect, onAdd, onDelete }) {
  return (
    <div className="w-full h-full flex flex-col bg-white border border-[#E5E5E8] rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-[#F1F1F4] flex items-center justify-between bg-[#FAFAFA]">
        <span className="text-[11px] font-semibold text-[#6B6B72] uppercase tracking-wider">Painéis</span>
        <button
          onClick={onAdd}
          className="w-6 h-6 rounded-lg bg-[#3B82F6] text-white flex items-center justify-center hover:bg-[#2563EB] transition-colors"
          title="Adicionar painel"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
        {paineis.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#F1F1F4] flex items-center justify-center text-[#9CA3AF] text-sm">□</div>
            <p className="text-[10px] text-[#9CA3AF] leading-relaxed">Nenhum painel.<br />Clique em + para adicionar.</p>
          </div>
        )}
        {paineis.map((p, idx) => (
          <div
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
              selectedId === p.id
                ? "bg-[#EFF6FF] border border-[#BFDBFE]"
                : "hover:bg-[#F8F9FB] border border-transparent"
            }`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              selectedId === p.id ? "bg-[#3B82F6] text-white" : "bg-[#F1F1F4] text-[#6B6B72]"
            }`}>
              {String.fromCharCode(65 + idx)}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold truncate ${selectedId === p.id ? "text-[#1D4ED8]" : "text-[#1F1F24]"}`}>
                {p.nome}
              </p>
              <p className="text-[10px] text-[#9CA3AF]">{p.componentes.length} componentes</p>
            </div>
            {selectedId === p.id && <ChevronRight className="w-3.5 h-3.5 text-[#3B82F6] flex-shrink-0" />}
            {selectedId !== p.id && (
              <button
                onClick={e => { e.stopPropagation(); onDelete(p.id); }}
                className="w-5 h-5 rounded flex items-center justify-center text-[#D1D5DB] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Editor de componente ───────────────────────────────────────────────────────
function ComponenteEditor({ comp, onChange, onDelete }) {
  const meta = getTipometa(comp.tipo);
  const [open, setOpen] = useState(true);

  function field(key, label, suffix = "mm", hint = null) {
    return (
      <div className="flex flex-col gap-0.5">
        <label className="text-[10px] font-semibold text-[#6B6B72]">{label}</label>
        {hint && <span className="text-[9px] text-[#9CA3AF]">{hint}</span>}
        <input
          type="text"
          value={comp[key] ?? ""}
          onChange={e => onChange({ ...comp, [key]: e.target.value })}
          className="border border-[#E5E5E8] rounded-lg px-2.5 py-1.5 text-xs text-[#1F1F24] focus:outline-none focus:ring-1 bg-white"
          style={{ '--tw-ring-color': meta.cor }}
          placeholder={suffix === "fórmula" ? "[X] ou [Y]" : "0"}
        />
        {suffix !== "fórmula" && suffix && (
          <span className="text-[9px] text-[#9CA3AF]">{suffix}</span>
        )}
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: meta.corBorder, backgroundColor: meta.corBg }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-sm" style={{ color: meta.cor }}>{meta.icon}</span>
        <span className="flex-1 text-xs font-semibold" style={{ color: meta.cor }}>{meta.label}</span>
        {comp.quantidade > 1 && (
          <span className="text-[10px] font-medium text-white rounded-full px-1.5 py-0.5" style={{ backgroundColor: meta.cor }}>
            ×{comp.quantidade}
          </span>
        )}
        <button
          onClick={e => { e.stopPropagation(); onDelete(comp.id); }}
          className="w-5 h-5 rounded flex items-center justify-center text-[#D1D5DB] hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
        <span className="text-[10px]" style={{ color: meta.cor }}>{open ? "▲" : "▼"}</span>
      </div>

      {/* Fields */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 grid grid-cols-2 gap-2 bg-white border-t" style={{ borderColor: meta.corBorder }}>
              {comp.tipo === "compensado" && (
                <>
                  {field("espessura_mm", "Espessura")}
                  {field("quantidade", "Quantidade", "un")}
                  {field("formula_largura", "Fórmula — Largura", "fórmula", "use [X] ou [Y]")}
                  {field("formula_comprimento", "Fórmula — Comprimento", "fórmula", "use [X] ou [Y]")}
                </>
              )}
              {comp.tipo === "sarrafo_vertical" && (
                <>
                  {field("largura_mm", "Largura")}
                  {field("espessura_mm", "Espessura")}
                  {field("quantidade", "Quantidade", "un")}
                  {field("formula_comprimento", "Fórmula — Comprimento", "fórmula")}
                </>
              )}
              {comp.tipo === "travamento" && (
                <>
                  {field("largura_mm", "Largura")}
                  {field("espessura_mm", "Espessura")}
                  {field("quantidade", "Quantidade", "un")}
                  {field("espacamento_mm", "Espaçamento entre travamentos")}
                  {field("formula_comprimento", "Fórmula — Comprimento", "fórmula")}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function TreinamentoPainel() {
  const [paineis, setPaineis] = useState([
    { id: "painel-a", nome: "Painel A", componentes: [] },
    { id: "painel-b", nome: "Painel B", componentes: [] },
    { id: "painel-c", nome: "Painel C", componentes: [] },
    { id: "painel-d", nome: "Painel D", componentes: [] },
  ]);
  const [selectedId, setSelectedId] = useState("painel-a");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Preview values for canvas simulation
  const [previewX, setPreviewX] = useState("324");
  const [previewY, setPreviewY] = useState("19");

  const selectedPainel = paineis.find(p => p.id === selectedId);

  function addPainel() {
    const idx = paineis.length;
    const novo = { id: crypto.randomUUID(), nome: `Painel ${String.fromCharCode(65 + idx)}`, componentes: [] };
    setPaineis(p => [...p, novo]);
    setSelectedId(novo.id);
  }

  function deletePainel(id) {
    setPaineis(p => p.filter(p => p.id !== id));
    if (selectedId === id) setSelectedId(paineis[0]?.id || null);
  }

  function addComponente(tipo) {
    setPaineis(prev => prev.map(p =>
      p.id === selectedId ? { ...p, componentes: [...p.componentes, newComponente(tipo)] } : p
    ));
  }

  function updateComponente(compAtualizado) {
    setPaineis(prev => prev.map(p =>
      p.id === selectedId
        ? { ...p, componentes: p.componentes.map(c => c.id === compAtualizado.id ? compAtualizado : c) }
        : p
    ));
  }

  function deleteComponente(compId) {
    setPaineis(prev => prev.map(p =>
      p.id === selectedId ? { ...p, componentes: p.componentes.filter(c => c.id !== compId) } : p
    ));
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Busca templates já salvos para upsert (evitar duplicatas)
      const existentes = await base44.entities.TemplatePainel.list();
      for (const painel of paineis) {
        if (painel.componentes.length === 0) continue;
        const payload = {
          nome_painel: painel.nome,
          componentes_estrutura: JSON.stringify(painel.componentes),
        };
        const existente = existentes.find(t => t.nome_painel === painel.nome);
        if (existente) {
          await base44.entities.TemplatePainel.update(existente.id, payload);
        } else {
          await base44.entities.TemplatePainel.create(payload);
        }
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.warn("Erro ao salvar:", e.message);
    }
    setSaving(false);
  }

  return (
    <div className="flex flex-col" style={{ height: "100%", overflow: "hidden" }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 pt-5 pb-3 flex-shrink-0 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg bg-[#8B5CF6] flex items-center justify-center flex-shrink-0">
            <span className="text-[11px] font-bold text-white">2</span>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-semibold text-[#0F0F0F]">Treinamento de Painéis</h1>
              <span className="text-[11px] font-medium text-[#6B6B72] bg-[#F1F1F4] px-2 py-0.5 rounded-full">Passo 2 de 3</span>
            </div>
            <p className="text-xs text-[#6B6B72] mt-0.5">
              Configure a estrutura de cada painel usando as variáveis <span className="font-mono font-semibold text-[#3B82F6]">[X]</span> (Altura) e <span className="font-mono font-semibold text-[#8B5CF6]">[Y]</span> (Largura) extraídas do PDF.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/configuracao">
            <Button variant="outline" className="h-9 rounded-xl text-sm font-medium gap-2 px-4">
              <ArrowLeft className="w-4 h-4" />
              Passo 1
            </Button>
          </Link>
          <Link to="/lista-corte">
            <Button variant="outline" className="h-9 rounded-xl text-sm font-medium gap-2 px-4">
              Passo 3 — Lista de Corte
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Button>
          </Link>
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="flex items-center gap-2 h-9 px-5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-70 shadow-sm"
            style={{ backgroundColor: saved ? "#22C55E" : "#8B5CF6" }}
          >
            {saving ? (
              <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Salvando...</>
            ) : saved ? (
              <><Check className="w-4 h-4" />Salvo!</>
            ) : (
              <><Save className="w-4 h-4" />Salvar Templates</>
            )}
          </button>
        </div>
      </motion.div>

      {/* Body: 3 colunas */}
      <div className="flex flex-1 min-h-0 gap-4 px-6 pb-6 flex-row overflow-hidden">

        {/* COL 1: Lista de painéis */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          className="flex-shrink-0"
          style={{ width: 224 }}
        >
          <PainelSidebar
            paineis={paineis}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onAdd={addPainel}
            onDelete={deletePainel}
          />
        </motion.div>

        {/* COL 2: Configuração do painel selecionado */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="flex-shrink-0 flex flex-col gap-3 overflow-y-auto h-full"
          style={{ width: 288 }}
        >
          {selectedPainel ? (
            <>
              {/* Header do painel */}
              <div className="bg-white border border-[#E5E5E8] rounded-2xl shadow-sm p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="w-4 h-4 text-[#8B5CF6]" />
                  <span className="text-sm font-semibold text-[#0F0F0F]">{selectedPainel.nome}</span>
                </div>
                {/* Nome editável */}
                <input
                  type="text"
                  value={selectedPainel.nome}
                  onChange={e => setPaineis(prev => prev.map(p => p.id === selectedId ? { ...p, nome: e.target.value } : p))}
                  className="w-full border border-[#E5E5E8] rounded-lg px-3 py-2 text-xs text-[#1F1F24] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6] mb-3"
                />
                {/* Variáveis */}
                <div className="bg-[#F8F9FB] border border-[#E5E5E8] rounded-xl p-3">
                  <p className="text-[10px] font-semibold text-[#6B6B72] uppercase tracking-wider mb-2">Variáveis Dinâmicas</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-[10px] text-[#6B6B72] truncate">[X] = Altura (cm)</span>
                      <div className="flex items-center border border-[#BFDBFE] rounded-lg overflow-hidden bg-white w-full">
                        <span className="px-1.5 text-[10px] font-mono font-bold text-[#3B82F6] bg-[#EFF6FF] border-r border-[#BFDBFE] py-1.5 flex-shrink-0">[X]</span>
                        <input type="number" value={previewX} onChange={e => setPreviewX(e.target.value)}
                          className="min-w-0 w-full px-1 py-1.5 text-xs text-center focus:outline-none" placeholder="324" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-[10px] text-[#6B6B72] truncate">[Y] = Largura (cm)</span>
                      <div className="flex items-center border border-[#DDD6FE] rounded-lg overflow-hidden bg-white w-full">
                        <span className="px-1.5 text-[10px] font-mono font-bold text-[#8B5CF6] bg-[#F5F3FF] border-r border-[#DDD6FE] py-1.5 flex-shrink-0">[Y]</span>
                        <input type="number" value={previewY} onChange={e => setPreviewY(e.target.value)}
                          className="min-w-0 w-full px-1 py-1.5 text-xs text-center focus:outline-none" placeholder="19" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista compacta de componentes */}
              <div className="bg-white border border-[#E5E5E8] rounded-2xl shadow-sm p-4 overflow-y-auto" style={{ maxHeight: 300 }}>
                <p className="text-[10px] font-semibold text-[#6B6B72] uppercase tracking-wider mb-2">
                  Componentes ({selectedPainel.componentes.length})
                </p>
                {selectedPainel.componentes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
                    <Box className="w-5 h-5 text-[#D1D5DB]" />
                    <p className="text-[10px] text-[#9CA3AF] leading-relaxed">
                      Use os botões no canvas<br />para adicionar peças.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {selectedPainel.componentes.map(comp => {
                      const LABELS = { compensado: "Compensado", sarrafo_vertical: "Sarrafo Vertical", sarrafo_acabamento: "Sarrafo Acabamento" };
                      const COLORS = { compensado: "#3B82F6", sarrafo_vertical: "#F59E0B", sarrafo_acabamento: "#10B981" };
                      return (
                        <div key={comp.id} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[#F8F9FB] border border-[#F1F1F4]">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[comp.tipo] || "#6B7280" }} />
                          <span className="flex-1 text-xs text-[#374151] truncate">{LABELS[comp.tipo] || comp.tipo}</span>
                          <button onClick={() => deleteComponente(comp.id)} className="w-4 h-4 flex items-center justify-center text-[#D1D5DB] hover:text-red-400 flex-shrink-0">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[#9CA3AF] text-sm">
              Selecione um painel
            </div>
          )}
        </motion.div>

        {/* COL 3: Canvas interativo */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25, delay: 0.08 }}
          className="flex-1 min-w-0 min-h-0 bg-white border border-[#E5E5E8] rounded-2xl shadow-sm overflow-hidden flex flex-col"
        >
          {selectedPainel ? (
            <PainelCanvas
              painel={selectedPainel}
              previewX={parseFloat(previewX) || 324}
              previewY={parseFloat(previewY) || 19}
              onAddComponente={comp => setPaineis(prev => prev.map(p =>
                p.id === selectedId ? { ...p, componentes: [...p.componentes, comp] } : p
              ))}
              onUpdateComponente={comp => setPaineis(prev => prev.map(p =>
                p.id === selectedId
                  ? { ...p, componentes: p.componentes.map(c => c.id === comp.id ? comp : c) }
                  : p
              ))}
              onDeleteComponente={id => setPaineis(prev => prev.map(p =>
                p.id === selectedId ? { ...p, componentes: p.componentes.filter(c => c.id !== id) } : p
              ))}
              onSave={handleSave}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#9CA3AF] text-sm">
              Selecione um painel para visualizar
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}