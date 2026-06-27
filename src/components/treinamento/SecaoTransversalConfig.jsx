import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

function PillarDiagram() {
  return (
    <div className="flex flex-col items-center gap-2 flex-shrink-0">
      <div className="relative" style={{ width: 120, height: 120 }}>
        <div className="absolute inset-6 bg-[#F1F5F9] border-2 border-[#94A3B8] rounded-sm" />
        <div className="absolute left-6 right-6 top-0 h-6 bg-[#8B5CF6] flex items-center justify-center rounded-t-md text-[10px] font-bold text-white">A</div>
        <div className="absolute left-6 right-6 bottom-0 h-6 bg-[#8B5CF6] flex items-center justify-center rounded-b-md text-[10px] font-bold text-white">B</div>
        <div className="absolute top-6 bottom-6 left-0 w-6 bg-[#3B82F6] flex items-center justify-center rounded-l-md text-[10px] font-bold text-white">C</div>
        <div className="absolute top-6 bottom-6 right-0 w-6 bg-[#3B82F6] flex items-center justify-center rounded-r-md text-[10px] font-bold text-white">D</div>
      </div>
      <div className="flex flex-col gap-1 text-[9px] font-medium text-[#6B6B72]">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-[#8B5CF6]" /> Y → Faces A/B</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-[#3B82F6]" /> X → Faces C/D</span>
      </div>
    </div>
  );
}

function NumInput({ label, hint, value, onChange, prefix, suffix = "cm" }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold text-[#374151]">{label}</label>
      {hint && <p className="text-[10px] text-[#9CA3AF] leading-tight">{hint}</p>}
      <div className="flex items-center border border-[#E5E5E8] rounded-lg overflow-hidden bg-white focus-within:ring-1 focus-within:ring-[#8B5CF6] transition-all">
        {prefix && <span className="px-2.5 text-[11px] text-[#6B6B72] bg-[#F8F9FB] border-r border-[#E5E5E8] py-2 font-medium whitespace-nowrap">{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="0"
          className="flex-1 px-3 py-2 text-xs text-[#1F1F24] focus:outline-none text-center"
        />
        <span className="px-2.5 text-[11px] text-[#6B6B72] bg-[#F8F9FB] border-l border-[#E5E5E8] py-2 font-medium">{suffix}</span>
      </div>
    </div>
  );
}

export default function SecaoTransversalConfig({ value, onChange }) {
  function set(field, val) { onChange({ ...value, [field]: val }); }

  return (
    <div className="flex flex-col gap-5">
      {/* Toggle ativa seção */}
      <div className="flex items-center justify-between py-2">
        <div>
          <p className="text-sm font-semibold text-[#0F0F0F]">Seção Transversal Variável Ativa?</p>
          <p className="text-xs text-[#9CA3AF]">O texto extraído será sempre uma variável composta (ex: <span className="font-mono font-semibold">19 / 95</span>)</p>
        </div>
        <button type="button" onClick={() => set("ativa", !value.ativa)} className="relative flex-shrink-0 ml-4">
          <div className={`w-11 h-6 rounded-full transition-colors ${value.ativa ? "bg-[#8B5CF6]" : "bg-[#D1D5DB]"}`} />
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${value.ativa ? "left-6" : "left-1"}`} />
        </button>
      </div>

      <AnimatePresence>
        {value.ativa && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="flex flex-col gap-4">

              {/* Diagrama + Configs */}
              <div className="flex gap-6 flex-wrap items-start">
                <PillarDiagram />
                <div className="flex-1 min-w-[260px] flex flex-col gap-4">

                  {/* Hint leitura */}
                  <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-3">
                    <p className="text-[11px] font-semibold text-[#1D4ED8] mb-1">Variável extraída do PDF</p>
                    <p className="text-xs text-[#3B82F6]">
                      Formato: <span className="font-mono font-bold bg-blue-100 px-1.5 rounded">X / Y</span> ou <span className="font-mono font-bold bg-blue-100 px-1.5 rounded">19 / 95</span><br />
                      → X = valor menor (Fundo C/D) · Y = valor maior (Lateral A/B)
                    </p>
                  </div>

                  {/* Medida Y → A/B */}
                  <div className="border border-[#EDE9FE] bg-[#FAFAFF] rounded-xl p-4">
                    <p className="text-[10px] font-semibold text-[#7C3AED] uppercase tracking-wider mb-3">Medida Maior (Y) → Faces A e B — Painéis Laterais</p>
                    <NumInput
                      label="Acréscimo das Abas de Fechamento"
                      hint="Somado ao Y para calcular a largura total real do painel lateral"
                      value={value.acrescimoAbaAB}
                      onChange={v => set("acrescimoAbaAB", v)}
                      prefix="Y +"
                    />
                    <div className="mt-2.5 px-3 py-2 bg-white border border-[#DDD6FE] rounded-lg">
                      <span className="text-[10px] text-[#7C3AED] font-medium">Fórmula: </span>
                      <span className="font-mono text-[11px] text-[#5B21B6] font-semibold">Largura_AB = Y + {value.acrescimoAbaAB || "0"} cm</span>
                    </div>
                  </div>

                  {/* Medida X → C/D */}
                  <div className="border border-[#DBEAFE] bg-[#F8FBFF] rounded-xl p-4">
                    <p className="text-[10px] font-semibold text-[#1D4ED8] uppercase tracking-wider mb-3">Medida Menor (X) → Faces C e D — Fundo</p>
                    <NumInput
                      label="Desconto de Encaixe por Face"
                      hint="Subtraído do X para o encaixe de borda na montagem da fôrma"
                      value={value.descontoEncaixeCD}
                      onChange={v => set("descontoEncaixeCD", v)}
                      prefix="X −"
                    />
                    <div className="mt-2.5 px-3 py-2 bg-white border border-[#BFDBFE] rounded-lg">
                      <span className="text-[10px] text-[#1D4ED8] font-medium">Fórmula: </span>
                      <span className="font-mono text-[11px] text-[#1E40AF] font-semibold">Largura_CD = X − {value.descontoEncaixeCD || "0"} cm</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Método construtivo do fundo */}
              <div className="border border-[#E5E5E8] rounded-xl p-4 bg-[#FAFAFA]">
                <p className="text-[10px] font-semibold text-[#6B6B72] uppercase tracking-wider mb-3">Indicação Construtiva do Fundo (Faces C/D)</p>
                <div className="relative mb-3">
                  <select
                    value={value.metodoFundo}
                    onChange={e => set("metodoFundo", e.target.value)}
                    className="w-full appearance-none border border-[#E5E5E8] rounded-lg px-3 py-2.5 text-sm text-[#1F1F24] bg-white focus:outline-none focus:ring-1 focus:ring-[#8B5CF6] cursor-pointer pr-9 transition-all"
                  >
                    <option value="dois_sarrafos">Opção A — Dois Sarrafos Simples (travamento de borda)</option>
                    <option value="sarrafeado_completo">Opção B — Painel Sarrafeado Completo (estruturado)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
                </div>

                <div className={`rounded-lg px-3 py-2.5 mb-3 text-xs ${value.metodoFundo === "dois_sarrafos" ? "bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534]" : "bg-[#FFF7ED] border border-[#FED7AA] text-[#92400E]"}`}>
                  {value.metodoFundo === "dois_sarrafos"
                    ? "Dois sarrafos com dimensões fixas travam as bordas do fundo. Indicado para seções pequenas."
                    : "Um painel estruturado cobre todo o fundo. Indicado para seções maiores com maior rigidez."}
                </div>

                <AnimatePresence>
                  {value.metodoFundo === "dois_sarrafos" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <NumInput label="Largura do Sarrafo" value={value.sarrafoLargura} onChange={v => set("sarrafoLargura", v)} />
                        <NumInput label="Espessura do Sarrafo" value={value.sarrafoEspessura} onChange={v => set("sarrafoEspessura", v)} />
                      </div>
                      <div className="mt-2.5 px-3 py-2 bg-white border border-[#E5E5E8] rounded-lg">
                        <span className="text-[10px] text-[#6B6B72] font-medium">Corte gerado: </span>
                        <span className="font-mono text-[11px] text-[#374151] font-semibold">2× {value.sarrafoLargura || "?"} × {value.sarrafoEspessura || "?"} cm</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}