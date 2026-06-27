import React, { useMemo, useState, useCallback } from "react";
import { Plus, Trash2, X as XIcon, FlaskConical, Check, Loader2 } from "lucide-react";
import { resolveFormula, calcularEmendaSarrafo, calcularQuantidadeSarrafos, gerarPlanoCorte } from "@/lib/calculoCorte";

// ── Colour palette ─────────────────────────────────────────────────────────────
const CORES = {
  compensado:         { fill: "#DBEAFE", stroke: "#3B82F6", text: "#1E40AF", grain: "#BFDBFE" },
  sarrafo_vertical:   { fill: "#FEF3C7", stroke: "#F59E0B", text: "#92400E", grain: "#FDE68A" },
  sarrafo_acabamento: { fill: "#D1FAE5", stroke: "#10B981", text: "#065F46", grain: "#A7F3D0" },
};
function getCor(tipo) { return CORES[tipo] || CORES.compensado; }

const COMP_LABELS = {
  compensado: "Chapa de Compensado",
  sarrafo_vertical: "Sarrafo Vertical",
  sarrafo_acabamento: "Sarrafo de Acabamento",
};

// Ancoragem options
const ANCORAGEM_OPTIONS = [
  { value: "topo",    label: "Topo do Painel" },
  { value: "base",    label: "Base do Painel" },
  { value: "lateral", label: "Laterais (Esq/Dir)" },
  { value: "livre",   label: "Posição Livre (Manual)" },
];

// ── Layout engine ──────────────────────────────────────────────────────────────
// Calcula a espessura total dos sarrafos de acabamento ancorados no topo
function getEspessuraAcabamentoTopo(componentes) {
  return componentes
    .filter(c => c.tipo === "sarrafo_acabamento" && c.ancoragem === "topo")
    .reduce((sum, c) => sum + (parseFloat(c.largura_mm) || 0), 0);
}
function getEspessuraAcabamentoBase(componentes) {
  return componentes
    .filter(c => c.tipo === "sarrafo_acabamento" && c.ancoragem === "base")
    .reduce((sum, c) => sum + (parseFloat(c.largura_mm) || 0), 0);
}

function computeLayout(componentes, X, Y, canvasW, canvasH) {
  const PAD = 56;
  const availW = canvasW - PAD * 2;
  const availH = canvasH - PAD * 2;
  const scale = Math.min(availW / Y, availH / X, 4);
  const panelPxW = Y * scale;
  const panelPxH = X * scale;
  const ox = (canvasW - panelPxW) / 2;
  const oy = (canvasH - panelPxH) / 2;
  const items = [];

  componentes.forEach(comp => {
    if (comp.tipo === "compensado") {
      items.push({
        id: comp.id, tipo: comp.tipo, comp,
        px: ox, py: oy,
        pw: resolveFormula(comp.formula_largura, X, Y) * scale,
        ph: resolveFormula(comp.formula_comprimento, X, Y) * scale,
      });

    } else if (comp.tipo === "sarrafo_vertical") {
      const larg = (parseFloat(comp.largura_mm) || 40) * scale;
      const folga = parseFloat(comp.folga) || 0;
      const ancoragem = comp.ancoragem || "topo";

      // Calcula offset do topo considerando sarrafos de acabamento acima e folga
      const espAcabTopo = getEspessuraAcabamentoTopo(componentes);
      const offsetTopo = (espAcabTopo + folga) * scale;
      const espAcabBase = getEspessuraAcabamentoBase(componentes);
      const offsetBase = (espAcabBase + folga) * scale;

      // Comprimento efetivo descontando folga e espessura de acabamento
      let comprimento = resolveFormula(comp.formula_comprimento, X, Y);
      // Se a fórmula não desconta, descontamos automaticamente a folga visualmente
      const comprimentoPx = (comprimento - folga - (ancoragem === "topo" || ancoragem === "base" ? espAcabTopo + espAcabBase : 0)) * scale;
      const ph = Math.max(4, comprimentoPx);

      // Posição Y no canvas baseada na ancoragem
      let py;
      if (ancoragem === "topo") {
        py = oy + offsetTopo;
      } else if (ancoragem === "base") {
        py = oy + panelPxH - offsetBase - ph;
      } else if (ancoragem === "livre") {
        const distTopo = parseFloat(comp.distancia_topo) || 0;
        py = oy + (distTopo + folga) * scale;
      } else {
        // default: topo
        py = oy + offsetTopo;
      }

      const qty = calcularQuantidadeSarrafos(comp, Y / 10);
      const positions = qty === 1
        ? [ox + panelPxW / 2 - larg / 2]
        : Array.from({ length: qty }, (_, i) => {
            if (i === 0) return ox;
            if (i === qty - 1) return ox + panelPxW - larg;
            return ox + (panelPxW / (qty - 1)) * i - larg / 2;
          });
      positions.forEach((px, i) => {
        items.push({ id: `${comp.id}-${i}`, tipo: comp.tipo, comp, px, py, pw: larg, ph });
      });

    } else if (comp.tipo === "sarrafo_acabamento") {
      const larg = (parseFloat(comp.largura_mm) || 30) * scale;
      const pw = resolveFormula(comp.formula_comprimento, X, Y) * scale;
      const ancoragem = comp.ancoragem || "topo";
      const folga = parseFloat(comp.folga) || 0;
      const qty = parseInt(comp.quantidade) || 1;

      if (ancoragem === "topo") {
        // Stack from top
        let curY = oy + folga * scale;
        for (let i = 0; i < qty; i++) {
          items.push({ id: `${comp.id}-${i}`, tipo: comp.tipo, comp, px: ox, py: curY, pw, ph: larg });
          curY += larg;
        }
      } else if (ancoragem === "base") {
        // Stack from bottom
        let curY = oy + panelPxH - folga * scale - larg * qty;
        for (let i = 0; i < qty; i++) {
          items.push({ id: `${comp.id}-${i}`, tipo: comp.tipo, comp, px: ox, py: curY, pw, ph: larg });
          curY += larg;
        }
      } else if (ancoragem === "livre") {
        const distTopo = parseFloat(comp.distancia_topo) || 0;
        for (let i = 0; i < qty; i++) {
          items.push({
            id: `${comp.id}-${i}`, tipo: comp.tipo, comp,
            px: ox, py: oy + (distTopo + folga + i * (parseFloat(comp.largura_mm) || 30)) * scale,
            pw, ph: larg,
          });
        }
      } else {
        // lateral / fallback: distribute evenly
        const spacing = panelPxH / (qty + 1);
        for (let i = 0; i < qty; i++) {
          items.push({ id: `${comp.id}-${i}`, tipo: comp.tipo, comp, px: ox, py: oy + spacing * (i + 1) - larg / 2, pw, ph: larg });
        }
      }
    }
  });

  return { items, ox, oy, panelPxW, panelPxH, scale };
}

// ── SVG wood rect ──────────────────────────────────────────────────────────────
let grainCounter = 0;
function WoodRect({ px, py, pw, ph, cor, selected, onClick, dimLabel }) {
  const gid = useMemo(() => `g${++grainCounter}`, []);
  return (
    <g onClick={onClick} style={{ cursor: "pointer" }}>
      <defs>
        <pattern id={gid} patternUnits="userSpaceOnUse" width="6" height="6">
          <rect width="6" height="6" fill={cor.fill} />
          <line x1="0" y1="3" x2="6" y2="3" stroke={cor.grain} strokeWidth="0.8" opacity="0.6" />
        </pattern>
      </defs>
      <rect x={px} y={py} width={pw} height={ph}
        fill={`url(#${gid})`}
        stroke={selected ? "#6366F1" : cor.stroke}
        strokeWidth={selected ? 2.5 : 1.5} rx={2}
        style={{ filter: selected ? "drop-shadow(0 0 6px rgba(99,102,241,0.4))" : "none" }}
      />
      {dimLabel && pw > 30 && ph > 12 && (
        <text x={px + pw / 2} y={py + ph / 2 + 3.5}
          textAnchor="middle"
          fontSize={Math.min(9, ph * 0.4, pw * 0.1)}
          fontWeight={700} fill={cor.text} fontFamily="monospace"
          style={{ userSelect: "none", pointerEvents: "none" }}>
          {dimLabel}
        </text>
      )}
    </g>
  );
}

// ── Toggle Switch ──────────────────────────────────────────────────────────────
function Toggle({ value, onChange, label, hint }) {
  return (
    <div className="flex items-start gap-2.5 py-1">
      <button type="button" onClick={() => onChange(!value)} className="relative flex-shrink-0 mt-0.5">
        <div className={`w-9 h-5 rounded-full transition-colors duration-200 ${value ? "bg-[#8B5CF6]" : "bg-[#D1D5DB]"}`} />
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${value ? "left-4" : "left-0.5"}`} />
      </button>
      <div>
        <p className="text-[10px] font-semibold text-[#374151] leading-tight">{label}</p>
        {hint && <p className="text-[9px] text-[#9CA3AF] mt-0.5 leading-tight">{hint}</p>}
      </div>
    </div>
  );
}

// ── Ancoragem Select ──────────────────────────────────────────────────────────
function AncoragemSelect({ value, onChange }) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-[10px] font-semibold text-[#374151]">Ancoragem / Posicionamento</label>
      <select
        value={value || "topo"}
        onChange={e => onChange(e.target.value)}
        className="border border-[#E5E5E8] rounded-lg px-2.5 py-1.5 text-xs text-[#1F1F24] focus:outline-none focus:ring-1 focus:ring-violet-400 bg-white w-full"
      >
        {ANCORAGEM_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ── Component Popover ──────────────────────────────────────────────────────────
function ComponentPopover({ comp, previewX, previewY, onUpdate, onDelete, onClose }) {
  const cor = getCor(comp.tipo);
  const [local, setLocal] = useState({ ...comp });

  const X = parseFloat(previewX) || 324;
  const Y = parseFloat(previewY) || 19;

  function upd(key, val) {
    const next = { ...local, [key]: val };
    setLocal(next);
    onUpdate(next);
  }

  function field(key, label, hint, type = "text") {
    return (
      <div className="flex flex-col gap-0.5">
        <label className="text-[10px] font-semibold text-[#374151]">{label}</label>
        {hint && <span className="text-[9px] text-[#9CA3AF] leading-tight">{hint}</span>}
        <input
          type={type}
          value={local[key] ?? ""}
          onChange={e => upd(key, e.target.value)}
          className="border border-[#E5E5E8] rounded-lg px-2.5 py-1.5 text-xs text-[#1F1F24] focus:outline-none focus:ring-1 focus:ring-violet-400 bg-white w-full"
          placeholder="0"
        />
      </div>
    );
  }

  const emendaPreview = local.tipo === "sarrafo_vertical"
    ? calcularEmendaSarrafo(local, X * 10, Y * 10)
    : null;

  const qty_auto = local.tipo === "sarrafo_vertical"
    ? calcularQuantidadeSarrafos(local, Y)
    : null;

  const ancoragemAtual = local.ancoragem || "topo";

  return (
    <div
      className="absolute right-3 top-14 z-30 bg-white border-2 rounded-2xl shadow-2xl overflow-hidden"
      style={{ borderColor: cor.stroke, width: 280 }}
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5"
        style={{ backgroundColor: cor.fill, borderBottom: `1.5px solid ${cor.grain}` }}>
        <span className="flex-1 text-xs font-bold" style={{ color: cor.text }}>{COMP_LABELS[comp.tipo]}</span>
        <button onClick={() => { onDelete(comp.id); onClose(); }}
          className="w-5 h-5 rounded flex items-center justify-center hover:bg-red-100 text-red-400 transition-colors">
          <Trash2 className="w-3 h-3" />
        </button>
        <button onClick={onClose}
          className="w-5 h-5 rounded flex items-center justify-center hover:bg-black/5 text-[#6B7280] transition-colors">
          <XIcon className="w-3 h-3" />
        </button>
      </div>

      <div className="p-3 flex flex-col gap-3 max-h-[72vh] overflow-y-auto">

        {/* ── COMPENSADO ── */}
        {comp.tipo === "compensado" && (
          <>
            <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-3 py-2">
              <p className="text-[10px] font-semibold text-[#1D4ED8] mb-1">Dimensões fixadas em:</p>
              <div className="flex gap-2">
                <span className="font-mono text-xs font-bold text-[#3B82F6]">Largura = [Y]</span>
                <span className="font-mono text-xs font-bold text-[#8B5CF6]">Altura = [X]</span>
              </div>
            </div>
            {field("espessura_mm", "Espessura (cm)")}
            {field("quantidade", "Quantidade de chapas", null, "number")}
          </>
        )}

        {/* ── SARRAFO VERTICAL ── */}
        {comp.tipo === "sarrafo_vertical" && (
          <>
            {field("largura_mm", "Largura (cm)")}
            {field("espessura_mm", "Espessura (cm)")}
            {field("formula_comprimento", "Comprimento (cm)", "ex: [X] ou [X]-4")}

            {/* Ancoragem */}
            <AncoragemSelect value={ancoragemAtual} onChange={v => upd("ancoragem", v)} />
            {ancoragemAtual === "livre" && (
              <div className="ml-0">
                {field("distancia_topo", "Distância do Topo (cm)", "Posição a partir do topo do painel", "number")}
              </div>
            )}

            {/* Folga construtiva */}
            <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-xl p-2.5">
              {field("folga", "Folga / Recuo Construtivo (cm)", "Ex: 0.5cm de recuo do sarrafo de acabamento", "number")}
              {parseFloat(local.folga) > 0 && (
                <div className="mt-1.5 text-[9px] text-[#92400E] font-semibold bg-orange-50 rounded-lg px-2 py-1">
                  → Comprimento efetivo ≈ {(resolveFormula(local.formula_comprimento, X, Y) - parseFloat(local.folga)).toFixed(1)}cm
                </div>
              )}
            </div>

            {/* Regra de emenda 244cm */}
            <div className="border border-[#DDD6FE] rounded-xl p-2.5 bg-[#FAFAFF]">
              <Toggle
                value={!!local.regra_emenda}
                onChange={v => upd("regra_emenda", v)}
                label="Regra de Emenda Industrial (limite 244cm)"
                hint="Desconta 7cm do topo e modula em peças de 200cm + emenda"
              />
              {local.regra_emenda && (
                <div className="mt-2 bg-[#F5F3FF] border border-[#DDD6FE] rounded-lg px-2.5 py-2">
                  <p className="text-[9px] font-semibold text-[#7C3AED] mb-1">
                    [X]={X}cm → saldo={X - 7}cm após desconto de 7cm
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {emendaPreview && emendaPreview.map((p, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] font-bold text-[#6D28D9] w-5 text-right">{p.quantidade}×</span>
                        <span className="font-mono text-[11px] text-[#5B21B6] font-semibold">{p.comprimento_cm}cm</span>
                        <span className="text-[9px] text-[#8B5CF6] italic">{p.descricao}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Regra de quantidade por [Y] */}
            <div className="border border-[#FDE68A] rounded-xl p-2.5 bg-[#FFFBEB]">
              <Toggle
                value={!!local.regra_qty_y}
                onChange={v => upd("regra_qty_y", v)}
                label="Modulação pela Largura [Y]"
                hint="≤24cm → 1 sarrafo | >24cm → quantidade configurável"
              />
              {local.regra_qty_y && (
                <div className="mt-2 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 bg-white border border-[#FDE68A] rounded-lg px-2.5 py-1.5">
                    <span className="text-[9px] text-[#92400E]">
                      [Y]={Y}cm {Y <= 24 ? "≤ 24cm → 1 sarrafo" : `> 24cm → ${local.qty_extra || 2} sarrafos`}
                    </span>
                  </div>
                  {Y > 24 && (
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-semibold text-[#374151]">Qtd. intermediários (Y &gt; 24cm)</label>
                      <input
                        type="number" min={2}
                        value={local.qty_extra ?? 2}
                        onChange={e => upd("qty_extra", e.target.value)}
                        className="border border-[#FDE68A] rounded-lg px-2.5 py-1.5 text-xs text-[#1F1F24] focus:outline-none bg-white w-full"
                      />
                    </div>
                  )}
                  <div className="text-[9px] text-[#92400E] font-semibold">
                    → {qty_auto} sarrafo{qty_auto !== 1 ? "s" : ""} calculado{qty_auto !== 1 ? "s" : ""}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── SARRAFO DE ACABAMENTO ── */}
        {comp.tipo === "sarrafo_acabamento" && (
          <>
            {field("largura_mm", "Largura (cm)")}
            {field("espessura_mm", "Espessura (cm)")}
            {field("formula_comprimento", "Comprimento (cm)", "ex: [Y] ou [Y]+10")}
            {field("quantidade", "Quantidade", null, "number")}

            {/* Ancoragem */}
            <AncoragemSelect value={ancoragemAtual} onChange={v => upd("ancoragem", v)} />
            {ancoragemAtual === "livre" && (
              field("distancia_topo", "Distância do Topo (cm)", "Posição a partir do topo do painel", "number")
            )}

            {/* Folga construtiva */}
            <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-xl p-2.5">
              {field("folga", "Folga / Recuo Construtivo (cm)", "Recuo da borda do painel", "number")}
            </div>
          </>
        )}

        {/* Var hint */}
        <div className="bg-[#F8F9FB] border border-[#E5E5E8] rounded-lg px-2.5 py-1.5 text-[10px] text-[#6B7280] font-mono">
          <span className="font-bold text-[#3B82F6]">[X]</span>={X}cm &nbsp;·&nbsp; <span className="font-bold text-[#8B5CF6]">[Y]</span>={Y}cm
        </div>
      </div>
    </div>
  );
}

// ── Plano de Corte Modal ───────────────────────────────────────────────────────
function PlanoCorteModal({ painel, previewX, previewY, onClose, onSaveAndTest }) {
  const X = parseFloat(previewX) || 324;
  const Y = parseFloat(previewY) || 19;
  const grupos = gerarPlanoCorte(painel, X * 10, Y * 10);
  const [saving, setSaving] = useState(false);
  const [done, setDone]     = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSaveAndTest();
    setSaving(false);
    setDone(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl border border-[#E5E5E8] w-[480px] max-h-[80vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#F1F1F4] bg-[#FAFAFA]">
          <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
            <FlaskConical className="w-4 h-4 text-[#3B82F6]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-[#0F0F0F]">Plano de Corte — {painel.nome}</p>
            <p className="text-[10px] text-[#9CA3AF]">[X]={X}cm · [Y]={Y}cm</p>
          </div>
          <button onClick={onClose} className="w-6 h-6 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-[#F1F1F4] transition-colors">
            <XIcon className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {grupos.length === 0 ? (
            <div className="text-center py-8 text-[#9CA3AF] text-sm">Adicione componentes ao painel primeiro.</div>
          ) : grupos.map((grupo, gi) => (
            <div key={gi}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: grupo.cor }} />
                <span className="text-[11px] font-bold text-[#374151] uppercase tracking-wide">{grupo.label}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {grupo.pecas.map((p, pi) => (
                  <div key={pi} className="flex items-center gap-3 bg-[#F8F9FB] border border-[#F1F1F4] rounded-xl px-4 py-2.5">
                    <span className="text-lg font-black text-[#374151] w-8 text-right flex-shrink-0">{p.quantidade}×</span>
                    <span className="font-mono text-sm font-semibold text-[#1F1F24] flex-1">{p.descricao}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {grupos.length > 0 && (
            <div className="bg-[#F0FDF4] border border-[#A7F3D0] rounded-xl px-4 py-3">
              <p className="text-[11px] font-semibold text-[#065F46] mb-1">Resumo para Carpinteiro:</p>
              <p className="text-xs text-[#047857] font-mono leading-relaxed">
                {grupos.flatMap(g => g.pecas.map(p => `${p.quantidade}× ${p.descricao}`)).join(" · ")}
              </p>
            </div>
          )}
        </div>
        <div className="px-5 py-4 border-t border-[#F1F1F4] flex justify-end gap-2">
          <button onClick={onClose}
            className="h-9 px-4 rounded-xl border border-[#E5E5E8] text-sm font-medium text-[#4A4A52] hover:bg-[#F1F1F4] transition-colors">
            Fechar
          </button>
          <button onClick={handleSave} disabled={saving || done}
            className="flex items-center gap-2 h-9 px-5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-70"
            style={{ backgroundColor: done ? "#22C55E" : "#8B5CF6" }}>
            {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Salvando...</>
              : done ? <><Check className="w-3.5 h-3.5" />Salvo!</>
              : "Salvar Configuração"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Toolbar buttons ────────────────────────────────────────────────────────────
const BOTOES = [
  { tipo: "compensado",         short: "+ Compensado" },
  { tipo: "sarrafo_vertical",   short: "+ Sarrafo Vertical" },
  { tipo: "sarrafo_acabamento", short: "+ Sarrafo Acabamento" },
];
const DEFAULTS = {
  compensado:         { espessura_mm: 1.8, formula_largura: "[Y]", formula_comprimento: "[X]", quantidade: 1 },
  sarrafo_vertical:   { largura_mm: 4, espessura_mm: 2, formula_comprimento: "[X]", quantidade: 2, regra_emenda: true, regra_qty_y: true, qty_extra: 2, ancoragem: "topo", folga: 0 },
  sarrafo_acabamento: { largura_mm: 3, espessura_mm: 2, formula_comprimento: "[Y]", quantidade: 1, ancoragem: "topo", folga: 0 },
};

// ── Main export ────────────────────────────────────────────────────────────────
export default function PainelCanvas({ painel, previewX, previewY, onUpdateComponente, onDeleteComponente, onAddComponente, onSave }) {
  const [size, setSize] = useState({ w: 800, h: 500 });
  const [selectedId, setSelectedId] = useState(null);
  const [showPlano, setShowPlano] = useState(false);

  const measuredRef = useCallback(node => {
    if (!node) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(node);
  }, []);

  const X = parseFloat(previewX) || 324;
  const Y = parseFloat(previewY) || 19;

  const { items, ox, oy, panelPxW, panelPxH } = useMemo(
    () => computeLayout(painel.componentes, X, Y, size.w, size.h),
    [painel.componentes, X, Y, size]
  );

  const selectedItem = selectedId ? items.find(i => i.id === selectedId) : null;
  const selectedComp = selectedItem?.comp || null;

  function addComp(tipo) {
    onAddComponente({ id: crypto.randomUUID(), tipo, ...DEFAULTS[tipo] });
    setSelectedId(null);
  }

  const dimColor = "#64748B";

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#F1F1F4] bg-[#FAFAFA] flex-shrink-0 flex-wrap">
        {BOTOES.map(b => {
          const cor = getCor(b.tipo);
          return (
            <button key={b.tipo} onClick={() => addComp(b.tipo)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold border transition-all hover:shadow-sm active:scale-95"
              style={{ backgroundColor: cor.fill, borderColor: cor.stroke, color: cor.text }}>
              <Plus className="w-3.5 h-3.5" />{b.short}
            </button>
          );
        })}

        {painel.componentes.length > 0 && (
          <button onClick={() => setShowPlano(true)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold border border-[#A7F3D0] bg-[#ECFDF5] text-[#065F46] hover:shadow-sm active:scale-95 transition-all ml-auto">
            <FlaskConical className="w-3.5 h-3.5" />
            Testar Algoritmo
          </button>
        )}

        <span className={`text-[10px] text-[#9CA3AF] font-mono ${painel.componentes.length === 0 ? "ml-auto" : ""}`}>
          [X]={previewX}cm · [Y]={previewY}cm
        </span>
      </div>

      {/* Canvas */}
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

            {/* Panel outline */}
            <rect x={ox} y={oy} width={panelPxW} height={panelPxH}
              fill="url(#woodBase)" stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="6 3" rx={3} />

            {/* Dim Y (width) */}
            <line x1={ox} y1={oy - 20} x2={ox + panelPxW} y2={oy - 20} stroke={dimColor} strokeWidth={1} />
            <line x1={ox} y1={oy - 26} x2={ox} y2={oy - 14} stroke={dimColor} strokeWidth={1} />
            <line x1={ox + panelPxW} y1={oy - 26} x2={ox + panelPxW} y2={oy - 14} stroke={dimColor} strokeWidth={1} />
            <text x={ox + panelPxW / 2} y={oy - 24} textAnchor="middle" fontSize={10} fontWeight={700} fill={dimColor} fontFamily="monospace">
              [Y] = {Y} cm
            </text>

            {/* Dim X (height) */}
            <line x1={ox - 20} y1={oy} x2={ox - 20} y2={oy + panelPxH} stroke={dimColor} strokeWidth={1} />
            <line x1={ox - 26} y1={oy} x2={ox - 14} y2={oy} stroke={dimColor} strokeWidth={1} />
            <line x1={ox - 26} y1={oy + panelPxH} x2={ox - 14} y2={oy + panelPxH} stroke={dimColor} strokeWidth={1} />
            <text x={ox - 30} y={oy + panelPxH / 2} textAnchor="middle" fontSize={10} fontWeight={700} fill={dimColor} fontFamily="monospace"
              transform={`rotate(-90 ${ox - 30} ${oy + panelPxH / 2})`}>
              [X] = {X} cm
            </text>

            {/* Components */}
            {items.map(item => (
              <WoodRect
                key={item.id}
                px={item.px} py={item.py} pw={item.pw} ph={item.ph}
                cor={getCor(item.tipo)}
                selected={selectedId === item.id}
                onClick={e => { e.stopPropagation(); setSelectedId(prev => prev === item.id ? null : item.id); }}
                dimLabel={item.pw > 40 && item.ph > 14 ? `${Math.round(item.ph)}×${Math.round(item.pw)}` : null}
              />
            ))}
          </svg>
        )}

        {/* Popover */}
        {selectedComp && (
          <ComponentPopover
            comp={selectedComp}
            previewX={X}
            previewY={Y}
            onUpdate={onUpdateComponente}
            onDelete={id => { onDeleteComponente(id); setSelectedId(null); }}
            onClose={() => setSelectedId(null)}
          />
        )}

        {/* Legend */}
        {painel.componentes.length > 0 && (
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur border border-[#E2E8F0] rounded-xl px-3 py-2 flex gap-3 shadow-sm flex-wrap">
            {[...new Set(painel.componentes.map(c => c.tipo))].map(tipo => {
              const cor = getCor(tipo);
              return (
                <div key={tipo} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm border flex-shrink-0" style={{ backgroundColor: cor.fill, borderColor: cor.stroke }} />
                  <span className="text-[10px] text-[#64748B] font-medium">{COMP_LABELS[tipo]}</span>
                </div>
              );
            })}
          </div>
        )}

        {painel.componentes.length > 0 && !selectedComp && (
          <div className="absolute bottom-3 right-3 bg-white/80 border border-[#E2E8F0] rounded-lg px-2.5 py-1.5">
            <span className="text-[10px] text-[#94A3B8]">Clique em uma peça para editar</span>
          </div>
        )}
      </div>

      {/* Plano de corte modal */}
      {showPlano && (
        <PlanoCorteModal
          painel={painel}
          previewX={X}
          previewY={Y}
          onClose={() => setShowPlano(false)}
          onSaveAndTest={onSave}
        />
      )}
    </div>
  );
}