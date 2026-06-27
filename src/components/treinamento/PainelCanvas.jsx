import React, { useMemo } from "react";

const SCALE = 1.2; // px per mm — canvas rendering scale

function resolveFormula(formula, X, Y) {
  if (!formula) return 0;
  const str = formula.toString().replace(/\[X\]/g, X).replace(/\[Y\]/g, Y);
  try { return parseFloat(eval(str)) || 0; } catch { return 0; }
}

function formatMm(val) {
  if (val >= 10) return `${val} mm`;
  return `${val} mm`;
}

// ── Colour palette ─────────────────────────────────────────────────────────────
const CORES = {
  compensado:     { fill: "rgba(59,130,246,0.18)", stroke: "#3B82F6", text: "#1D4ED8" },
  sarrafo_vertical: { fill: "rgba(245,158,11,0.2)", stroke: "#F59E0B", text: "#92400E" },
  travamento:     { fill: "rgba(16,185,129,0.18)", stroke: "#10B981", text: "#065F46" },
};

// ── Compute layout from components ────────────────────────────────────────────
function computeLayout(componentes, X, Y) {
  const items = [];

  // Find compensado (base plate — forms the full painel face)
  const compensado = componentes.find(c => c.tipo === "compensado");
  const larguraTotal = compensado ? resolveFormula(compensado.formula_largura, X, Y) : Y;
  const alturaTotal  = compensado ? resolveFormula(compensado.formula_comprimento, X, Y) : X;

  // Compensado layer
  if (compensado) {
    items.push({
      id: compensado.id,
      tipo: "compensado",
      label: `Compensado ${compensado.espessura_mm}mm`,
      x: 0,
      y: 0,
      w: larguraTotal,
      h: alturaTotal,
      depth: compensado.espessura_mm,
    });
  }

  // Sarrafos verticais — one on each side (left & right)
  const sarrafosV = componentes.filter(c => c.tipo === "sarrafo_vertical");
  sarrafosV.forEach((s, idx) => {
    const comprimento = resolveFormula(s.formula_comprimento, X, Y);
    const count = parseInt(s.quantidade) || 2;
    const positions = count === 1
      ? [larguraTotal / 2 - s.largura_mm / 2]
      : [0, larguraTotal - s.largura_mm];
    positions.forEach((px, i) => {
      if (i >= count) return;
      items.push({
        id: `${s.id}-${i}`,
        tipo: "sarrafo_vertical",
        label: i === 0 ? `Sarrafo V. ${s.largura_mm}×${s.espessura_mm}mm` : null,
        x: px,
        y: 0,
        w: parseFloat(s.largura_mm) || 40,
        h: comprimento,
        depth: s.espessura_mm,
      });
    });
  });

  // Travamentos — distributed evenly along height
  const travamentos = componentes.filter(c => c.tipo === "travamento");
  travamentos.forEach(t => {
    const comprimento = resolveFormula(t.formula_comprimento, X, Y);
    const count = parseInt(t.quantidade) || 3;
    const spacing = count > 1 ? alturaTotal / (count + 1) : alturaTotal / 2;
    for (let i = 0; i < count; i++) {
      items.push({
        id: `${t.id}-${i}`,
        tipo: "travamento",
        label: i === 0 ? `Travamento ${t.largura_mm}×${t.espessura_mm}mm` : null,
        x: 0,
        y: spacing * (i + 1) - parseFloat(t.espessura_mm) / 2,
        w: comprimento,
        h: parseFloat(t.espessura_mm) || 20,
        depth: t.largura_mm,
      });
    }
  });

  return { items, larguraTotal, alturaTotal };
}

// ── Legend item ────────────────────────────────────────────────────────────────
function LegendItem({ tipo, label }) {
  const c = CORES[tipo];
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-3 h-3 rounded-sm border flex-shrink-0" style={{ backgroundColor: c.fill, borderColor: c.stroke }} />
      <span className="text-[10px] text-[#6B6B72]">{label}</span>
    </div>
  );
}

// ── Main canvas component ──────────────────────────────────────────────────────
export default function PainelCanvas({ painel, previewX, previewY }) {
  const { items, larguraTotal, alturaTotal } = useMemo(
    () => computeLayout(painel.componentes, previewX, previewY),
    [painel.componentes, previewX, previewY]
  );

  const PAD = 48; // padding in canvas px
  const canvasW = larguraTotal * SCALE + PAD * 2;
  const canvasH = alturaTotal * SCALE + PAD * 2;

  if (painel.componentes.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-[#F1F1F4] flex items-center justify-center">
          <span className="text-3xl text-[#D1D5DB]">□</span>
        </div>
        <p className="text-sm font-semibold text-[#374151]">Canvas Paramétrico Vazio</p>
        <p className="text-xs text-[#9CA3AF] leading-relaxed max-w-64">
          Adicione componentes na coluna ao lado para visualizar a estrutura do painel em escala proporcional.
        </p>
        <div className="mt-2 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-3 text-left">
          <p className="text-[11px] font-semibold text-[#1D4ED8] mb-1">Variáveis disponíveis</p>
          <div className="flex gap-3">
            <span className="font-mono font-bold text-[#3B82F6] text-sm">[X] = {previewX} mm</span>
            <span className="font-mono font-bold text-[#8B5CF6] text-sm">[Y] = {previewY} mm</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-[#F1F1F4] flex-shrink-0 flex-wrap">
        {painel.componentes.some(c => c.tipo === "compensado") && <LegendItem tipo="compensado" label="Compensado" />}
        {painel.componentes.some(c => c.tipo === "sarrafo_vertical") && <LegendItem tipo="sarrafo_vertical" label="Sarrafo Vertical" />}
        {painel.componentes.some(c => c.tipo === "travamento") && <LegendItem tipo="travamento" label="Travamento" />}
        <span className="ml-auto text-[10px] text-[#9CA3AF] font-mono">
          {Math.round(larguraTotal)}×{Math.round(alturaTotal)} mm
        </span>
      </div>

      {/* SVG canvas */}
      <div className="flex-1 overflow-auto flex items-center justify-center bg-[#F8F9FB]"
        style={{ backgroundImage: "radial-gradient(circle, #D1D5DB 1px, transparent 1px)", backgroundSize: "20px 20px" }}
      >
        <svg
          width={canvasW}
          height={canvasH}
          style={{ display: "block", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.10))" }}
        >
          {/* Background panel outline */}
          <rect
            x={PAD}
            y={PAD}
            width={larguraTotal * SCALE}
            height={alturaTotal * SCALE}
            fill="#FFFFFF"
            stroke="#CBD5E1"
            strokeWidth={1}
            strokeDasharray="4 3"
          />

          {/* Components */}
          {items.map(item => {
            const c = CORES[item.tipo] || CORES.compensado;
            const px = PAD + item.x * SCALE;
            const py = PAD + item.y * SCALE;
            const pw = item.w * SCALE;
            const ph = item.h * SCALE;
            return (
              <g key={item.id}>
                <rect
                  x={px} y={py} width={pw} height={ph}
                  fill={c.fill}
                  stroke={c.stroke}
                  strokeWidth={1.5}
                  rx={2}
                />
                {/* Label only for first in series (when label is set) */}
                {item.label && pw > 30 && ph > 14 && (
                  <text
                    x={px + pw / 2}
                    y={py + ph / 2 + 4}
                    textAnchor="middle"
                    fontSize={9}
                    fontWeight={600}
                    fill={c.text}
                    fontFamily="ui-monospace, monospace"
                  >
                    {item.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Dimension arrows — width */}
          <g>
            <line x1={PAD} y1={PAD - 16} x2={PAD + larguraTotal * SCALE} y2={PAD - 16} stroke="#6B7280" strokeWidth={1} markerEnd="url(#arrow)" markerStart="url(#arrow-rev)" />
            <text x={PAD + larguraTotal * SCALE / 2} y={PAD - 20} textAnchor="middle" fontSize={9} fill="#374151" fontWeight={600} fontFamily="ui-monospace, monospace">
              [Y] = {Math.round(larguraTotal)} mm
            </text>
          </g>

          {/* Dimension arrows — height */}
          <g>
            <line x1={PAD - 20} y1={PAD} x2={PAD - 20} y2={PAD + alturaTotal * SCALE} stroke="#6B7280" strokeWidth={1} />
            <text x={PAD - 28} y={PAD + alturaTotal * SCALE / 2} textAnchor="middle" fontSize={9} fill="#374151" fontWeight={600} fontFamily="ui-monospace, monospace"
              transform={`rotate(-90, ${PAD - 28}, ${PAD + alturaTotal * SCALE / 2})`}>
              [X] = {Math.round(alturaTotal)} mm
            </text>
          </g>

          {/* Arrow markers */}
          <defs>
            <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#6B7280" />
            </marker>
            <marker id="arrow-rev" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
              <path d="M0,0 L6,3 L0,6 Z" fill="#6B7280" />
            </marker>
          </defs>
        </svg>
      </div>
    </div>
  );
}