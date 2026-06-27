import React from "react";
import { FileText, Layers, LayoutTemplate, PanelBottom } from "lucide-react";

const BLOCOS = [
  {
    key: "possuiRodape",
    icon: PanelBottom,
    iconBg: "#FFF7ED",
    iconColor: "#F97316",
    label: "Bloco de Rodapé / Carimbo",
    desc: "A folha padrão possui um bloco inferior com notas de chapa, compensado e identificação do projeto.",
    tag: "Carimbo",
  },
  {
    key: "possuiSecaoTransversal",
    icon: Layers,
    iconBg: "#F5F3FF",
    iconColor: "#8B5CF6",
    label: "Seção Transversal Variável",
    desc: "Existe uma região com a geometria do pilar (ex: '19 / 95') que varia por elemento no caderno.",
    tag: "Seção",
  },
  {
    key: "possuiDetalhamentoPaineis",
    icon: LayoutTemplate,
    iconBg: "#EFF6FF",
    iconColor: "#3B82F6",
    label: "Região de Detalhamento de Painéis",
    desc: "A folha possui vistas frontais ou laterais dos painéis com dimensões construtivas individuais.",
    tag: "Painéis",
  },
];

const LAYOUTS = [
  {
    id: "rodape_baixo",
    label: "Rodapé na Base",
    desc: "Seção e painéis acima, carimbo no rodapé inferior.",
    preview: [
      { h: 55, label: "Painéis / Seção", bg: "#EFF6FF", border: "#BFDBFE", text: "#3B82F6" },
      { h: 25, label: "Carimbo / Notas", bg: "#FFF7ED", border: "#FED7AA", text: "#EA580C" },
    ],
  },
  {
    id: "rodape_cima",
    label: "Carimbo no Topo",
    desc: "Carimbo no topo, detalhes abaixo.",
    preview: [
      { h: 25, label: "Carimbo / Notas", bg: "#FFF7ED", border: "#FED7AA", text: "#EA580C" },
      { h: 55, label: "Painéis / Seção", bg: "#EFF6FF", border: "#BFDBFE", text: "#3B82F6" },
    ],
  },
  {
    id: "lateral",
    label: "Carimbo Lateral",
    desc: "Bloco de identificação na lateral direita.",
    preview: "lateral",
  },
];

function Toggle({ checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="relative flex-shrink-0">
      <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${checked ? "bg-[#8B5CF6]" : "bg-[#D1D5DB]"}`} />
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${checked ? "left-6" : "left-1"}`} />
    </button>
  );
}

export default function Etapa21Anatomia({ value, onChange }) {
  function set(field, val) {
    onChange({ ...value, [field]: val });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Intro */}
      <div className="bg-[#F8F9FB] border border-[#E5E5E8] rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#3B82F6] flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0F0F0F]">Anatomia do Caderno Padrão</p>
            <p className="text-xs text-[#6B6B72] mt-0.5 leading-relaxed">
              Indique quais blocos de informação existem no layout padrão do PDF deste projetista. Isso define o que o motor de extração procura em cada folha.
            </p>
          </div>
        </div>
      </div>

      {/* Blocos toggle */}
      <div className="bg-white border border-[#E5E5E8] rounded-2xl shadow-sm divide-y divide-[#F1F1F4]">
        <div className="px-5 py-3">
          <p className="text-[10px] font-semibold text-[#6B6B72] uppercase tracking-wider">Elementos Presentes na Folha Padrão</p>
        </div>
        {BLOCOS.map(b => {
          const Icon = b.icon;
          const active = value[b.key];
          return (
            <div key={b.key} className="flex items-center justify-between px-5 py-4 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: b.iconBg }}>
                  <Icon className="w-4 h-4" style={{ color: b.iconColor }} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-[#0F0F0F]">{b.label}</p>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: active ? b.iconBg : "#F1F1F4",
                        color: active ? b.iconColor : "#9CA3AF",
                      }}>
                      {active ? `Tag: ${b.tag}` : "Inativo"}
                    </span>
                  </div>
                  <p className="text-xs text-[#9CA3AF] mt-0.5 leading-relaxed">{b.desc}</p>
                </div>
              </div>
              <Toggle checked={active} onChange={v => set(b.key, v)} />
            </div>
          );
        })}
      </div>

      {/* Layout visual */}
      <div className="bg-white border border-[#E5E5E8] rounded-2xl shadow-sm p-5">
        <p className="text-[10px] font-semibold text-[#6B6B72] uppercase tracking-wider mb-4">Posicionamento dos Blocos no Layout Padrão</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {LAYOUTS.map(l => {
            const sel = value.layoutBloco === l.id;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => set("layoutBloco", l.id)}
                className={`flex flex-col gap-2 p-3 rounded-xl border-2 text-left transition-all ${
                  sel ? "border-[#8B5CF6] bg-[#FAFAFF]" : "border-[#E5E5E8] bg-white hover:border-[#D4D4D8]"
                }`}
              >
                {/* Mini preview */}
                {l.preview === "lateral" ? (
                  <div className="w-full h-16 rounded-lg border border-[#E5E5E8] overflow-hidden flex">
                    <div className="flex-1 bg-[#EFF6FF] flex items-center justify-center text-[9px] font-semibold text-[#3B82F6]">Painéis</div>
                    <div className="w-8 bg-[#FFF7ED] flex items-center justify-center">
                      <span className="text-[8px] font-semibold text-[#EA580C]" style={{ writingMode: "vertical-rl" }}>Carimbo</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-16 rounded-lg border border-[#E5E5E8] overflow-hidden flex flex-col">
                    {l.preview.map((blk, i) => (
                      <div key={i} className="flex items-center justify-center text-[9px] font-semibold border-b last:border-0"
                        style={{ flex: blk.h, backgroundColor: blk.bg, borderColor: blk.border, color: blk.text }}>
                        {blk.label}
                      </div>
                    ))}
                  </div>
                )}
                <div>
                  <p className={`text-xs font-semibold ${sel ? "text-[#7C3AED]" : "text-[#374151]"}`}>{l.label}</p>
                  <p className="text-[10px] text-[#9CA3AF] mt-0.5">{l.desc}</p>
                </div>
                {sel && (
                  <div className="flex items-center gap-1 text-[10px] font-semibold text-[#8B5CF6]">
                    <div className="w-3 h-3 rounded-full bg-[#8B5CF6] flex items-center justify-center">
                      <svg width="6" height="5" viewBox="0 0 6 5" fill="none"><path d="M1 2.5L2.5 4L5 1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    Selecionado
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}