import React from "react";
import { Plus, Trash2, Ruler, Square, ArrowUpDown, ArrowLeftRight } from "lucide-react";

const OPERADORES = [
  { id: "subtrair", simbolo: "−", cor: "#EF4444", label: "Subtrair" },
  { id: "somar", simbolo: "+", cor: "#22C55E", label: "Somar" },
  { id: "multiplicar", simbolo: "×", cor: "#3B82F6", label: "Multiplicar" },
  { id: "dividir", simbolo: "÷", cor: "#8B5CF6", label: "Dividir" },
];

const VARIAVEIS = [
  { id: "LARGURA", label: "Largura deste componente", icon: Square, cor: "#F59E0B" },
  { id: "X", label: "Altura total do painel (X)", icon: ArrowUpDown, cor: "#10B981" },
  { id: "Y", label: "Largura total do painel (Y)", icon: ArrowLeftRight, cor: "#8B5CF6" },
];

export function passosParaFormula(passos) {
  if (!passos || passos.length === 0) return "";
  let formula = "[MEDIDA]";
  for (const p of passos) {
    const op = p.operador === "somar" ? "+"
      : p.operador === "subtrair" ? "-"
      : p.operador === "multiplicar" ? "*"
      : "/";
    const val = p.tipo === "variavel" ? `[${p.variavel}]` : p.valor;
    formula += ` ${op} ${val}`;
  }
  return formula;
}

export function formulaParaPassos(formula) {
  if (!formula) return [];
  const passos = [];
  let restante = String(formula).trim();
  if (restante.startsWith("[MEDIDA]")) restante = restante.slice(8).trim();
  if (!restante) return [];

  const regex = /([+\-*/])\s*(\[([A-Z]+)\]|(\d+\.?\d*))/g;
  let match;
  while ((match = regex.exec(restante)) !== null) {
    const op = match[1];
    const operador = op === "+" ? "somar" : op === "-" ? "subtrair" : op === "*" ? "multiplicar" : "dividir";
    const isVar = !!match[3];
    passos.push({
      operador,
      tipo: isVar ? "variavel" : "fixo",
      valor: isVar ? null : parseFloat(match[4]),
      variavel: isVar ? match[3] : null,
    });
  }
  return passos;
}

export default function RegraVisualBuilder({ passos, onChange }) {
  function addPasso() {
    onChange([...passos, { operador: "subtrair", tipo: "fixo", valor: 0.5, variavel: null }]);
  }

  function updatePasso(idx, updates) {
    onChange(passos.map((p, i) => (i === idx ? { ...p, ...updates } : p)));
  }

  function removePasso(idx) {
    onChange(passos.filter((_, i) => i !== idx));
  }

  function cycleOperador(idx) {
    const currentIdx = OPERADORES.findIndex(o => o.id === passos[idx].operador);
    const nextIdx = (currentIdx + 1) % OPERADORES.length;
    updatePasso(idx, { operador: OPERADORES[nextIdx].id });
  }

  const formulaPreview = passosParaFormula(passos);

  return (
    <div className="flex flex-col gap-2">
      {/* Base */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg px-2.5 py-1.5">
          <Ruler className="w-3.5 h-3.5 text-[#3B82F6]" />
          <span className="text-xs font-semibold text-[#1D4ED8]">Medida anotada no desenho</span>
        </div>
      </div>

      {/* Passos */}
      {passos.map((passo, idx) => {
        const op = OPERADORES.find(o => o.id === passo.operador) || OPERADORES[0];
        return (
          <div key={idx} className="flex items-center gap-1.5 pl-2">
            {/* Operador */}
            <button
              onClick={() => cycleOperador(idx)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0 transition-transform hover:scale-105"
              style={{ backgroundColor: op.cor }}
              title={op.label}
            >
              {op.simbolo}
            </button>

            {/* Tipo toggle */}
            <div className="flex bg-[#F1F1F4] rounded-lg p-0.5 flex-shrink-0">
              <button
                onClick={() => updatePasso(idx, { tipo: "fixo" })}
                className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${passo.tipo === "fixo" ? "bg-white text-[#1F1F24] shadow-sm" : "text-[#6B7280]"}`}
              >
                Número
              </button>
              <button
                onClick={() => updatePasso(idx, { tipo: "variavel", variavel: passo.variavel || "LARGURA" })}
                className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${passo.tipo === "variavel" ? "bg-white text-[#1F1F24] shadow-sm" : "text-[#6B7280]"}`}
              >
                Variável
              </button>
            </div>

            {/* Valor */}
            {passo.tipo === "fixo" ? (
              <input
                type="number"
                step="0.1"
                value={passo.valor ?? ""}
                onChange={e => updatePasso(idx, { valor: parseFloat(e.target.value) || 0 })}
                className="flex-1 border border-[#E5E5E8] rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B82F6] bg-white min-w-0"
                placeholder="0"
              />
            ) : (
              <select
                value={passo.variavel || "LARGURA"}
                onChange={e => updatePasso(idx, { variavel: e.target.value })}
                className="flex-1 border border-[#E5E5E8] rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B82F6] bg-white min-w-0"
              >
                {VARIAVEIS.map(v => (
                  <option key={v.id} value={v.id}>{v.label}</option>
                ))}
              </select>
            )}

            {/* Delete */}
            <button
              onClick={() => removePasso(idx)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors flex-shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}

      {/* Add passo */}
      <button
        onClick={addPasso}
        className="flex items-center gap-1.5 text-xs font-medium text-[#3B82F6] hover:text-[#2563EB] transition-colors py-1 w-fit"
      >
        <div className="w-5 h-5 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
          <Plus className="w-3.5 h-3.5" />
        </div>
        Adicionar passo
      </button>

      {/* Preview */}
      {formulaPreview && (
        <div className="bg-[#F8F9FB] border border-[#E5E5E8] rounded-lg px-3 py-2 flex items-center gap-2">
          <span className="text-[10px] text-[#9CA3AF] font-medium flex-shrink-0">Fórmula:</span>
          <code className="text-[11px] font-mono text-[#1F1F24] font-semibold break-all">{formulaPreview}</code>
        </div>
      )}
    </div>
  );
}