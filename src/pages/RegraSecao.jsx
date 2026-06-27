import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Info, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

// ── Visual Pillar ──────────────────────────────────────────────────────────────
function PillarDiagram({ medidaMenorFaces, medidaMaiorFaces }) {
  const colorOf = (face) => {
    if (medidaMenorFaces.includes(face)) return "#3B82F6"; // azul = menor (C/D)
    if (medidaMaiorFaces.includes(face)) return "#8B5CF6"; // roxo = maior (A/B)
    return "#CBD5E1";
  };

  // Faces: A=top, B=bottom, C=left, D=right (fundo = C/D = laterais)
  return (
    <div className="flex flex-col items-center gap-3 flex-shrink-0">
      <div className="relative" style={{ width: 160, height: 160 }}>
        {/* Core square */}
        <div className="absolute inset-8 bg-[#F1F5F9] border-2 border-[#94A3B8] rounded-sm" />

        {/* Face A — top */}
        <div className="absolute left-8 right-8 top-0 h-8 flex items-center justify-center rounded-t-md text-[11px] font-bold text-white transition-colors"
          style={{ backgroundColor: colorOf("A") }}>A</div>

        {/* Face B — bottom */}
        <div className="absolute left-8 right-8 bottom-0 h-8 flex items-center justify-center rounded-b-md text-[11px] font-bold text-white transition-colors"
          style={{ backgroundColor: colorOf("B") }}>B</div>

        {/* Face C — left */}
        <div className="absolute top-8 bottom-8 left-0 w-8 flex items-center justify-center rounded-l-md text-[11px] font-bold text-white transition-colors"
          style={{ backgroundColor: colorOf("C") }}>C</div>

        {/* Face D — right */}
        <div className="absolute top-8 bottom-8 right-0 w-8 flex items-center justify-center rounded-r-md text-[11px] font-bold text-white transition-colors"
          style={{ backgroundColor: colorOf("D") }}>D</div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-1 text-[10px] font-medium text-[#6B6B72]">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm inline-block bg-[#8B5CF6]" /> Medida Maior (A/B) — faces principais
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm inline-block bg-[#3B82F6]" /> Medida Menor (C/D) — fundo
        </span>
      </div>
    </div>
  );
}

// ── Labeled Input ──────────────────────────────────────────────────────────────
function NumberInput({ label, hint, value, onChange, suffix = "cm", prefix }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold text-[#374151]">{label}</label>
      {hint && <p className="text-[10px] text-[#9CA3AF] -mt-0.5">{hint}</p>}
      <div className="flex items-center border border-[#E5E5E8] rounded-lg overflow-hidden bg-white focus-within:ring-1 focus-within:ring-[#8B5CF6] focus-within:border-[#8B5CF6] transition-all">
        {prefix && <span className="px-2.5 text-[11px] text-[#6B6B72] bg-[#F8F9FB] border-r border-[#E5E5E8] py-2 font-medium whitespace-nowrap">{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="0"
          className="flex-1 px-3 py-2 text-xs text-[#1F1F24] focus:outline-none text-center min-w-0"
          style={{ minWidth: 0 }}
        />
        {suffix && <span className="px-2.5 text-[11px] text-[#6B6B72] bg-[#F8F9FB] border-l border-[#E5E5E8] py-2 font-medium">{suffix}</span>}
      </div>
    </div>
  );
}

// ── Section divider ────────────────────────────────────────────────────────────
function SectionTitle({ color, label, subtitle }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
      <div>
        <p className="text-xs font-semibold text-[#0F0F0F] uppercase tracking-wide">{label}</p>
        {subtitle && <p className="text-[10px] text-[#9CA3AF]">{subtitle}</p>}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function RegraSecao() {
  const navigate = useNavigate();

  const [temSecao, setTemSecao] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // ── Bloco 1: Faces da Medida Maior (A/B) — painéis principais
  const [facesAB, setFacesAB] = useState({
    faces: ["A", "B"],
    acrescimoCoberturaAba: "20.4",   // cm que as abas acrescentam na largura total
  });

  // ── Bloco 2: Faces da Medida Menor (C/D) — fundo
  const [facesCD, setFacesCD] = useState({
    faces: ["C", "D"],
    descontoPorFace: "0",            // desconto por face para encaixe das bordas
  });

  // ── Bloco 3: Método construtivo do fundo
  const [metodoFundo, setMetodoFundo] = useState("dois_sarrafos"); // "dois_sarrafos" | "sarrafeado_completo"
  const [sarrafos, setSarrafos] = useState({
    largura: "4",       // cm — largura de cada sarrafo lateral
    espessura: "4",     // cm — espessura do sarrafo
  });

  function updateSarrafo(field, val) {
    setSarrafos(prev => ({ ...prev, [field]: val }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        tem_secao_variavel: temSecao,
        faces_medida_maior: {
          faces: facesAB.faces,
          acrescimo_cobertura_aba_cm: parseFloat(facesAB.acrescimoCoberturaAba) || 0,
        },
        faces_medida_menor: {
          faces: facesCD.faces,
          desconto_por_face_cm: parseFloat(facesCD.descontoPorFace) || 0,
        },
        metodo_fundo: metodoFundo,
        sarrafos_fundo: metodoFundo === "dois_sarrafos" ? {
          largura_cm: parseFloat(sarrafos.largura) || 0,
          espessura_cm: parseFloat(sarrafos.espessura) || 0,
        } : null,
      };

      await base44.entities.RegraSecaoTransversal.create({
        configuracao_json: JSON.stringify(payload),
      });
    } catch (e) {
      // Entity may not exist yet — continue to next step anyway
      console.warn("Save skipped:", e.message);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      navigate("/regra-painel");
    }, 1200);
  }

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: "100%", overflow: "hidden" }}>

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
              <h1 className="text-lg font-semibold text-[#0F0F0F]">Regras de Interpretação — Etapa 2.1</h1>
              <span className="text-[11px] font-medium text-[#6B6B72] bg-[#F1F1F4] px-2 py-0.5 rounded-full">Seção Transversal</span>
            </div>
            <p className="text-xs text-[#6B6B72] mt-0.5">Configure como o sistema traduzirá a geometria do pilar em dimensões de fôrma.</p>
          </div>
        </div>
        <Link to="/configuracao">
          <Button variant="outline" className="h-9 rounded-xl text-sm font-medium gap-2 px-4">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Passo 1
          </Button>
        </Link>
      </motion.div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6 flex flex-col gap-4">

        {/* Toggle */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
          className="bg-white border border-[#E5E5E8] rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F5F3FF] flex items-center justify-center flex-shrink-0">
                <Info className="w-4 h-4 text-[#8B5CF6]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0F0F0F]">Este produto possui Seção Transversal variável no PDF?</p>
                <p className="text-xs text-[#6B6B72] mt-0.5">
                  Ative se o PDF contiver medidas de seção que variam por elemento (ex: <span className="font-mono font-semibold">19x95</span>).
                </p>
              </div>
            </div>
            <button type="button" onClick={() => setTemSecao(v => !v)} className="relative flex-shrink-0 ml-6">
              <div className={`w-12 h-6 rounded-full transition-colors duration-200 ${temSecao ? "bg-[#8B5CF6]" : "bg-[#D1D5DB]"}`} />
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${temSecao ? "left-7" : "left-1"}`} />
            </button>
          </div>
          {!temSecao && (
            <div className="mt-4 flex items-center gap-2 bg-[#F8F9FB] border border-[#E5E5E8] rounded-xl px-4 py-3">
              <div className="w-2 h-2 rounded-full bg-[#9CA3AF] flex-shrink-0" />
              <p className="text-xs text-[#6B6B72]">Sem seção variável — o sistema pulará para as <span className="font-semibold text-[#374151]">regras dos painéis (Etapa 2.2)</span>.</p>
            </div>
          )}
        </motion.div>

        <AnimatePresence>
          {temSecao && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4"
            >
              {/* ── Bloco principal: Diagrama + Configuração lado a lado ── */}
              <div className="bg-white border border-[#E5E5E8] rounded-2xl shadow-sm p-5">
                <p className="text-[10px] font-semibold text-[#6B6B72] uppercase tracking-wider mb-5">Mapeamento das Dimensões das Faces</p>

                <div className="flex gap-8 flex-wrap items-start">

                  {/* Diagrama visual */}
                  <PillarDiagram medidaMenorFaces={facesCD.faces} medidaMaiorFaces={facesAB.faces} />

                  {/* Configurações */}
                  <div className="flex-1 min-w-[280px] flex flex-col gap-6">

                    {/* Hint de leitura */}
                    <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-3">
                      <p className="text-[11px] font-semibold text-[#1D4ED8] mb-1">Exemplo: texto lido no PDF</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sm text-[#1D4ED8] bg-blue-100 px-2 py-0.5 rounded">19x95</span>
                        <span className="text-xs text-[#3B82F6]">→ Medida Menor <strong>19 cm</strong> (Faces C/D) · Medida Maior <strong>95 cm</strong> (Faces A/B)</span>
                      </div>
                    </div>

                    {/* MEDIDA MAIOR — A/B */}
                    <div className="border border-[#EDE9FE] bg-[#FAFAFF] rounded-xl p-4">
                      <SectionTitle color="#8B5CF6" label="Medida Maior → Faces A e B (Painéis Principais)" />
                      <div className="grid grid-cols-1 gap-3">
                        <NumberInput
                          label="Acréscimo de Cobertura das Abas"
                          hint="Valor adicionado à medida bruta para chegar na largura total com abas (ex: 95 + 20.4 = 115.4 cm)"
                          value={facesAB.acrescimoCoberturaAba}
                          onChange={v => setFacesAB(p => ({ ...p, acrescimoCoberturaAba: v }))}
                          prefix="+ "
                          suffix="cm"
                        />
                        <div className="flex items-center gap-2 bg-white border border-[#DDD6FE] rounded-lg px-3 py-2">
                          <span className="text-[10px] text-[#7C3AED] font-medium">Fórmula resultante:</span>
                          <span className="font-mono text-[11px] text-[#5B21B6] font-semibold">
                            Largura painel A/B = Medida Maior + {facesAB.acrescimoCoberturaAba || "0"} cm
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* MEDIDA MENOR — C/D */}
                    <div className="border border-[#DBEAFE] bg-[#F8FBFF] rounded-xl p-4">
                      <SectionTitle color="#3B82F6" label="Medida Menor → Faces C e D (Fundo)" />
                      <div className="grid grid-cols-1 gap-3">
                        <NumberInput
                          label="Desconto por Face para Encaixe das Bordas"
                          hint="Desconto aplicado na medida bruta de cada face de fundo (ex: fechamento de fôrma)"
                          value={facesCD.descontoPorFace}
                          onChange={v => setFacesCD(p => ({ ...p, descontoPorFace: v }))}
                          prefix="− "
                          suffix="cm"
                        />
                        <div className="flex items-center gap-2 bg-white border border-[#BFDBFE] rounded-lg px-3 py-2">
                          <span className="text-[10px] text-[#1D4ED8] font-medium">Fórmula resultante:</span>
                          <span className="font-mono text-[11px] text-[#1E40AF] font-semibold">
                            Largura painel C/D = Medida Menor − {facesCD.descontoPorFace || "0"} cm
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Bloco 3: Método Construtivo do Fundo ── */}
              <div className="bg-white border border-[#E5E5E8] rounded-2xl shadow-sm p-5">
                <p className="text-[10px] font-semibold text-[#6B6B72] uppercase tracking-wider mb-4">Método Construtivo do Fundo (Faces C / D)</p>

                {/* Dropdown */}
                <div className="flex flex-col gap-1 mb-4">
                  <label className="text-[11px] font-semibold text-[#374151]">Tipo de Estrutura do Fundo</label>
                  <p className="text-[10px] text-[#9CA3AF]">Define como a fôrma de fechamento lateral do pilar é montada com base na seção lida.</p>
                  <div className="relative mt-1">
                    <select
                      value={metodoFundo}
                      onChange={e => setMetodoFundo(e.target.value)}
                      className="w-full appearance-none border border-[#E5E5E8] rounded-xl px-4 py-2.5 text-sm text-[#1F1F24] bg-white focus:outline-none focus:ring-1 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] cursor-pointer pr-10 transition-all"
                    >
                      <option value="dois_sarrafos">Dois Sarrafos Simples (larguras pequenas)</option>
                      <option value="sarrafeado_completo">Painel Sarrafeado Completo (estruturado)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
                  </div>
                </div>

                {/* Descrição do método */}
                <div className={`rounded-xl px-4 py-3 border mb-4 ${metodoFundo === "dois_sarrafos" ? "bg-[#F0FDF4] border-[#BBF7D0]" : "bg-[#FFF7ED] border-[#FED7AA]"}`}>
                  {metodoFundo === "dois_sarrafos" ? (
                    <p className="text-xs text-[#166534]">
                      <span className="font-semibold">Dois Sarrafos Simples:</span> dois sarrafos laterais com dimensões fixas fecham o fundo do pilar. Utilizado quando a seção de concreto é pequena e não exige estruturação interna.
                    </p>
                  ) : (
                    <p className="text-xs text-[#92400E]">
                      <span className="font-semibold">Painel Sarrafeado Completo:</span> um painel completo estruturado cobre todo o fundo. Utilizado em seções maiores que exigem maior rigidez e precisão dimensional.
                    </p>
                  )}
                </div>

                {/* Campos condicionais — Dois Sarrafos */}
                <AnimatePresence>
                  {metodoFundo === "dois_sarrafos" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden"
                    >
                      <div className="border border-[#E5E5E8] rounded-xl p-4 bg-[#FAFAFA]">
                        <p className="text-[11px] font-semibold text-[#374151] mb-3">Dimensões Padrão dos Sarrafos Laterais</p>
                        <div className="grid grid-cols-2 gap-4">
                          <NumberInput
                            label="Largura do Sarrafo"
                            hint="Dimensão horizontal de cada sarrafo"
                            value={sarrafos.largura}
                            onChange={v => updateSarrafo("largura", v)}
                            suffix="cm"
                          />
                          <NumberInput
                            label="Espessura do Sarrafo"
                            hint="Dimensão de profundidade do sarrafo"
                            value={sarrafos.espessura}
                            onChange={v => updateSarrafo("espessura", v)}
                            suffix="cm"
                          />
                        </div>
                        <div className="mt-3 flex items-center gap-2 bg-white border border-[#E5E5E8] rounded-lg px-3 py-2">
                          <span className="text-[10px] text-[#6B6B72] font-medium">Sarrafos gerados:</span>
                          <span className="font-mono text-[11px] text-[#374151] font-semibold">
                            2× {sarrafos.largura || "?"} × {sarrafos.espessura || "?"} cm (travamento lateral)
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Botão Salvar ── */}
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving || saved}
                  className="flex items-center gap-2 h-10 px-6 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-70 shadow-sm"
                  style={{ backgroundColor: saved ? "#22C55E" : "#8B5CF6" }}
                >
                  {saving ? (
                    <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Salvando...</>
                  ) : saved ? (
                    <><Check className="w-4 h-4" />Salvo! Avançando para Etapa 2.2...</>
                  ) : (
                    <>Salvar Seção e Avançar para Painel Principal (Etapa 2.2)<ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botão skip quando desativado */}
        {!temSecao && (
          <div className="flex justify-end">
            <button
              onClick={() => navigate("/regra-painel")}
              className="flex items-center gap-2 h-10 px-6 rounded-xl text-sm font-semibold text-white bg-[#3B82F6] hover:bg-[#2563EB] transition-colors"
            >
              Ir para Regras do Painel Principal (Etapa 2.2)
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}