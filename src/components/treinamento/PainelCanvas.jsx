import React, { useMemo, useState, useRef, useCallback } from "react";
import { Plus, Trash2, X, ChevronDown, ChevronUp } from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────
const CORES = {
  compensado:       { fill: "#DBEAFE", stroke: "#3B82F6", text: "#1E40AF", grain: "#BFDBFE" },
  sarrafo_vertical: { fill: "#FEF3C7", stroke: "#F59E0B", text: "#92400E", grain: "#FDE68A" },
  sarrafo_acabamento: { fill: "#D1FAE5", stroke: "#10B981", text: "#065F46", grain: "#A7F3D0" },
};

function getCor(tipo) { return CORES[tipo] || CORES.compensado; }

function resolveFormula(formula, X, Y) {
  if (!formula) return 0;
  const str = String(formula).replace(/\[X\]/g, X).replace(/\[Y\]/g, Y);
  try { return Math.max(1, parseFloat(eval(str)) || 0); } catch { return 0; }
}

// ── Compute pixel layout ───────────────────────────────────────────────────────
function computeLayout(componentes, X, Y, canvasW, canvasH) {
  const PAD = 56;
  const availW = canvasW - PAD * 2;
  const availH = canvasH - PAD * 2;

  // Base panel = X (height) × Y (width), scaled to fit
  const baseH = X, baseW = Y;
  const scaleX = availW / baseW;
  const scaleY = availH / baseH;
  const scale  = Math.min(scaleX, scaleY, 4); // cap at 4px/mm

  const panelPxW = baseW * scale;
  const panelPxH = baseH * scale;
  const ox = (canvasW - panelPxW) / 2; // offset to center
  const oy = (canvasH - panelPxH) / 2;

  const items = [];

  componentes.forEach(comp => {
    const tipo = comp.tipo;
    if (tipo === "compensado") {
      const compW = resolveFormula(comp.formula_largura, X, Y) * scale;
      const compH = resolveFormula(comp.formula_comprimento, X, Y) * scale;
      items.push({ id: comp.id, tipo, comp, px: ox, py: oy, pw: compW, ph: compH });

    } else if (tipo === "sarrafo_vertical") {
      const larg  = (parseFloat(comp.largura_mm) || 40) * scale;
      const compr = resolveFormula(comp.formula_comprimento, X, Y) * scale;
      const qty   = parseInt(comp.quantidade) || 2;
      const positions = qty === 1
        ? [ox + panelPxW / 2 - larg / 2]
        : Array.from({ length: qty }, (_, i) => {
            if (i === 0) return ox;
            if (i === qty - 1) return ox + panelPxW - larg;
            return ox + (panelPxW / (qty - 1)) * i - larg / 2;
          });
      positions.forEach((px, i) => {
        items.push({ id: `${comp.id}-${i}`, tipo, comp, px, py: oy, pw: larg, ph: compr, instanceIdx: i });
      });

    } else if (tipo === "sarrafo_acabamento") {
      const larg  = (parseFloat(comp.largura_mm) || 30) * scale;
      const compr = resolveFormula(comp.formula_comprimento, X, Y) * scale;
      const qty   = parseInt(comp.quantidade) || 3;
      const spacing = panelPxH / (qty + 1);
      for (let i = 0; i < qty; i++) {
        items.push({
          id: `${comp.id}-${i}`, tipo, comp,
          px: ox, py: oy + spacing * (i + 1) - larg / 2,
          pw: compr, ph: larg,
          instanceIdx: i,
        });
      }
    }
  });

  return { items, ox, oy, panelPxW, panelPxH, scale };
}

// ── Wood grain SVG pattern ─────────────────────────────────────────────────────
function WoodRect({ px, py, pw, ph, cor, selected, onClick }) {
  const id = `grain-${Math.random().toString(36).slice(2, 7)}`;
  return (
    <g onClick={onClick} style={{ cursor: "pointer" }}>
      <defs>
        <pattern id={id} patternUnits="userSpaceOnUse" width="6" height="6">
          <rect width="6" height="6" fill={cor.fill} />
          <line x1="0" y1="3" x2="6" y2="3" stroke={cor.grain} strokeWidth="0.8" opacity="0.6" />
        </pattern>
      </defs>
      <rect x={px} y={py} width={pw} height={ph}
        fill={`url(#${id})`}
        stroke={selected ? "#6366F1" : cor.stroke}
        strokeWidth={selected ? 2.5 : 1.5}
        rx={2}
        style={{ filter: selected ? "drop-shadow(0 0 6px rgba(99,102,241,0.5))" : "none" }}
      />
      {/* Label */}
      {pw > 20 && ph > 10 && (
        <text
          x={px + pw / 2} y={py + ph / 2 + 3.5}
          textAnchor="middle" fontSize={Math.min(10, ph * 0.45, pw * 0.12)}
          fontWeight={700} fill={cor.text} fontFamily="ui-monospace, monospace"
          style={{ userSelect: "none", pointerEvents: "none" }}
        >
          {pw > 40 && ph > 14 ? (
            pw > ph
              ? `${Math.round(pw)}×${Math.round(ph)}`
              : `${Math.round(ph)}×${Math.round(pw)}`
          ) : ""}
        </text>
      )}
    </g>
  );
}

// ── Popover for clicked component ─────────────────────────────────────────────
function ComponentPopover({ comp, onUpdate, onDelete, onClose }) {
  const cor = getCor(comp.tipo);
  const [local, setLocal] = useState({ ...comp });

  function field(key, label, hint) {
    return (
      <div className="flex flex-col gap-0.5">
        <label className="text-[10px] font-semibold text-[#374151]">{label}</label>
        {hint && <span className="text-[9px] text-[#9CA3AF]">{hint}</span>}
        <input
          type="text"
          value={local[key] ?? ""}
          onChange={e => setLocal(p => ({ ...p, [key]: e.target.value }))}
          onBlur={() => onUpdate(local)}
          className="border border-[#E5E5E8] rounded-lg px-2.5 py-1.5 text-xs text-[#1F1F24] focus:outline-none focus:ring-1 bg-white w-full"
          placeholder="0"
        />
      </div>
    );
  }

  const LABELS = {
    compensado:         "Chapa de Compensado",
    sarrafo_vertical:   "Sarrafo Vertical (Montante)",
    sarrafo_acabamento: "Sarrafo de Acabamento",
  };

  return (
    <div className="absolute right-3 top-14 z-30 w-60 bg-white border-2 rounded-2xl shadow-2xl overflow-hidden animate-in"
      style={{ borderColor: cor.stroke }}
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5" style={{ backgroundColor: cor.fill, borderBottom: `1.5px solid ${cor.grain}` }}>
        <span className="flex-1 text-xs font-bold" style={{ color: cor.text }}>{LABELS[comp.tipo] || comp.tipo}</span>
        <button onClick={() => { onDelete(comp.id); onClose(); }}
          className="w-5 h-5 rounded flex items-center justify-center hover:bg-red-100 text-red-400 transition-colors">
          <Trash2 className="w-3 h-3" />
        </button>
        <button onClick={onClose}
          className="w-5 h-5 rounded flex items-center justify-center hover:bg-black/5 text-[#6B7280] transition-colors">
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Fields */}
      <div className="p-3 flex flex-col gap-2.5">
        {comp.tipo === "compensado" && (
          <>
            {field("espessura_mm", "Espessura (mm)")}
            {field("formula_largura", "Largura", "ex: [Y] ou [Y]+20")}
            {field("formula_comprimento", "Comprimento", "ex: [X] ou [X]-40")}
            {field("quantidade", "Qtd. de chapas")}
          </>
        )}
        {(comp.tipo === "sarrafo_vertical" || comp.tipo === "sarrafo_acabamento") && (
          <>
            {field("largura_mm", "Largura (mm)")}
            {field("espessura_mm", "Espessura (mm)")}
            {field("formula_comprimento", "Comprimento", "ex: [X] ou [X]-10")}
            {field("quantidade", "Quantidade")}
          </>
        )}

        {/* Formula preview */}
        <div className="bg-[#F8F9FB] border border-[#E5E5E8] rounded-lg px-2.5 py-2 text-[10px] text-[#6B7280] font-mono">
          <span className="font-semibold text-[#3B82F6]">[X]</span> = Altura &nbsp;|&nbsp; <span className="font-semibold text-[#8B5CF6]">[Y]</span> = Largura
        </div>
      </div>
    </div>
  );
}

// ── Toolbar buttons ────────────────────────────────────────────────────────────
const BOTOES = [
  { tipo: "compensado",         label: "Chapa de Compensado",         short: "+ Compensado" },
  { tipo: "sarrafo_vertical",   label: "Sarrafo Vertical (Montante)", short: "+ Sarrafo Vertical" },
  { tipo: "sarrafo_acabamento", label: "Sarrafo de Acabamento",       short: "+ Sarrafo Acabamento" },
];

const DEFAULTS = {
  compensado:         { espessura_mm: 18, formula_largura: "[Y]",     formula_comprimento: "[X]", quantidade: 1 },
  sarrafo_vertical:   { largura_mm: 40,   espessura_mm: 20,           formula_comprimento: "[X]", quantidade: 2 },
  sarrafo_acabamento: { largura_mm: 30,   espessura_mm: 20,           formula_comprimento: "[Y]", quantidade: 3 },
};

// ── Main export ────────────────────────────────────────────────────────────────
export default function PainelCanvas({ painel, previewX, previewY, onUpdateComponente, onDeleteComponente, onAddComponente }) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ w: 800, h: 500 });
  const [selectedId, setSelectedId] = useState(null);

  // Track container size
  const measuredRef = useCallback(node => {
    if (!node) return;
    const ro = new ResizeObserver(([e]) => {
      setSize({ w: e.contentRect.width, h: e.contentRect.height });
    });
    ro.observe(node);
  }, []);

  const { items, ox, oy, panelPxW, panelPxH } = useMemo(
    () => computeLayout(painel.componentes, previewX, previewY, size.w, size.h),
    [painel.componentes, previewX, previewY, size]
  );

  // Find selected comp
  const selectedItem = selectedId ? items.find(i => i.id === selectedId) : null;
  const selectedComp = selectedItem?.comp || null;

  function handleClickItem(item, e) {
    e.stopPropagation();
    setSelectedId(prev => (prev === item.id ? null : item.id));
  }

  function addComponente(tipo) {
    onAddComponente({ id: crypto.randomUUID(), tipo, ...DEFAULTS[tipo] });
    setSelectedId(null);
  }

  const dimColor = "#64748B";
  const PAD = 56;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#F1F1F4] bg-[#FAFAFA] flex-shrink-0 flex-wrap">
        {BOTOES.map(b => {
          const cor = getCor(b.tipo);
          return (
            <button
              key={b.tipo}
              onClick={() => addComponente(b.tipo)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold border transition-all hover:shadow-sm active:scale-95"
              style={{ backgroundColor: cor.fill, borderColor: cor.stroke, color: cor.text }}
            >
              <Plus className="w-3.5 h-3.5" />
              {b.short}
            </button>
          );
        })}
        <span className="ml-auto text-[10px] text-[#9CA3AF] font-mono">
          [X]={previewX}mm · [Y]={previewY}mm
        </span>
      </div>

      {/* Canvas area */}
      <div
        ref={measuredRef}
        className="flex-1 min-h-0 relative overflow-hidden"
        style={{ background: "#F1F5F9", backgroundImage: "radial-gradient(circle, #CBD5E1 1px, transparent 1px)", backgroundSize: "24px 24px" }}
        onClick={() => setSelectedId(null)}
      >
        {painel.componentes.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
            <div className="w-20 h-20 rounded-2xl bg-white/80 border border-[#E2E8F0] flex items-center justify-center shadow-sm">
              <span className="text-4xl text-[#CBD5E1]">⬜</span>
            </div>
            <p className="text-sm font-semibold text-[#64748B]">Mesa de Desenho Vazia</p>
            <p className="text-xs text-[#94A3B8] text-center max-w-52">
              Clique em um dos botões acima para adicionar o primeiro componente ao painel.
            </p>
          </div>
        ) : (
          <svg width={size.w} height={size.h} style={{ display: "block" }}>
            <defs>
              <pattern id="woodBase" patternUnits="userSpaceOnUse" width="8" height="8">
                <rect width="8" height="8" fill="#FEF9EE" />
                <line x1="0" y1="4" x2="8" y2="4" stroke="#FDE68A" strokeWidth="0.6" opacity="0.5" />
              </pattern>
            </defs>

            {/* Panel background (base board) */}
            <rect x={ox} y={oy} width={panelPxW} height={panelPxH}
              fill="url(#woodBase)" stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="6 3" rx={3} />

            {/* Dimension — width */}
            <line x1={ox} y1={oy - 20} x2={ox + panelPxW} y2={oy - 20} stroke={dimColor} strokeWidth={1} />
            <line x1={ox} y1={oy - 26} x2={ox} y2={oy - 14} stroke={dimColor} strokeWidth={1} />
            <line x1={ox + panelPxW} y1={oy - 26} x2={ox + panelPxW} y2={oy - 14} stroke={dimColor} strokeWidth={1} />
            <text x={ox + panelPxW / 2} y={oy - 24} textAnchor="middle" fontSize={10} fontWeight={700} fill={dimColor} fontFamily="monospace">
              [Y] = {previewY} mm
            </text>

            {/* Dimension — height */}
            <line x1={ox - 20} y1={oy} x2={ox - 20} y2={oy + panelPxH} stroke={dimColor} strokeWidth={1} />
            <line x1={ox - 26} y1={oy} x2={ox - 14} y2={oy} stroke={dimColor} strokeWidth={1} />
            <line x1={ox - 26} y1={oy + panelPxH} x2={ox - 14} y2={oy + panelPxH} stroke={dimColor} strokeWidth={1} />
            <text
              x={ox - 30} y={oy + panelPxH / 2}
              textAnchor="middle" fontSize={10} fontWeight={700} fill={dimColor} fontFamily="monospace"
              transform={`rotate(-90 ${ox - 30} ${oy + panelPxH / 2})`}
            >
              [X] = {previewX} mm
            </text>

            {/* Structural components */}
            {items.map(item => (
              <WoodRect
                key={item.id}
                px={item.px} py={item.py} pw={item.pw} ph={item.ph}
                cor={getCor(item.tipo)}
                selected={selectedId === item.id}
                onClick={e => handleClickItem(item, e)}
              />
            ))}
          </svg>
        )}

        {/* Popover */}
        {selectedComp && (
          <ComponentPopover
            comp={selectedComp}
            onUpdate={onUpdateComponente}
            onDelete={id => { onDeleteComponente(id); setSelectedId(null); }}
            onClose={() => setSelectedId(null)}
          />
        )}

        {/* Legend */}
        {painel.componentes.length > 0 && (
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur border border-[#E2E8F0] rounded-xl px-3 py-2 flex gap-3 shadow-sm">
            {[...new Set(painel.componentes.map(c => c.tipo))].map(tipo => {
              const cor = getCor(tipo);
              const LABELS = { compensado: "Compensado", sarrafo_vertical: "Sarrafo Vertical", sarrafo_acabamento: "Sarrafo Acabamento" };
              return (
                <div key={tipo} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm border flex-shrink-0" style={{ backgroundColor: cor.fill, borderColor: cor.stroke }} />
                  <span className="text-[10px] text-[#64748B] font-medium">{LABELS[tipo]}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Click hint */}
        {painel.componentes.length > 0 && !selectedComp && (
          <div className="absolute bottom-3 right-3 bg-white/80 border border-[#E2E8F0] rounded-lg px-2.5 py-1.5">
            <span className="text-[10px] text-[#94A3B8]">Clique em uma peça para editar</span>
          </div>
        )}
      </div>
    </div>
  );
}