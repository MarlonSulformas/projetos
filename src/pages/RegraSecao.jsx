import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import Etapa21Anatomia from "@/components/treinamento/Etapa21Anatomia";
import Etapa22Variaveis from "@/components/treinamento/Etapa22Variaveis";

const STEPS = [
  { id: 1, label: "Etapa 2.1", sub: "Anatomia do Produto", color: "#3B82F6" },
  { id: 2, label: "Etapa 2.2", sub: "Variáveis e Regras", color: "#8B5CF6" },
];

export default function RegraSecao() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // ── Etapa 2.1 state ──
  const [anatomia, setAnatomia] = useState({
    possuiRodape: true,
    possuiSecaoTransversal: true,
    possuiDetalhamentoPaineis: true,
    layoutBloco: "rodape_baixo", // "rodape_baixo" | "rodape_cima" | "lateral"
  });

  // ── Etapa 2.2 state ──
  const [secao, setSecao] = useState({
    ativa: true,
    acrescimoAbaAB: "20.4",
    descontoEncaixeCD: "0",
    metodoFundo: "dois_sarrafos",
    sarrafoLargura: "4",
    sarrafoEspessura: "4",
  });

  const [paineis, setPaineis] = useState([]); // array de templates de painel

  async function handleFinalSave() {
    setSaving(true);
    const mascara = {
      anatomia: {
        possui_rodape: anatomia.possuiRodape,
        possui_secao_transversal: anatomia.possuiSecaoTransversal,
        possui_detalhamento_paineis: anatomia.possuiDetalhamentoPaineis,
        layout_bloco: anatomia.layoutBloco,
      },
      secao_transversal: secao.ativa ? {
        ativa: true,
        faces_medida_maior: {
          faces: ["A", "B"],
          acrescimo_aba_cm: parseFloat(secao.acrescimoAbaAB) || 0,
          formula: `Largura_AB = Y + ${secao.acrescimoAbaAB}`,
        },
        faces_medida_menor: {
          faces: ["C", "D"],
          desconto_encaixe_cm: parseFloat(secao.descontoEncaixeCD) || 0,
          formula: `Largura_CD = X - ${secao.descontoEncaixeCD}`,
        },
        metodo_fundo: secao.metodoFundo,
        sarrafos: secao.metodoFundo === "dois_sarrafos" ? {
          largura_cm: parseFloat(secao.sarrafoLargura) || 0,
          espessura_cm: parseFloat(secao.sarrafoEspessura) || 0,
        } : null,
      } : { ativa: false },
      banco_paineis: paineis.map(p => ({
        id: p.id,
        nome: p.nome,
        imagem_url: p.imagemUrl || null,
        componentes: p.componentes.map(c => ({
          nome: c.nome,
          variavel: c.variavel,
          operador: c.operador,
          valor: parseFloat(c.valor) || 0,
          formula: `${c.nome} = ${c.variavel} ${c.operador} ${c.valor} cm`,
        })),
      })),
    };

    try {
      await base44.entities.RegraSecaoTransversal.create({
        configuracao_json: JSON.stringify(mascara),
      });
    } catch (e) {
      console.warn("Save warn:", e.message);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => navigate("/configuracao"), 1500);
  }

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: "100%", overflow: "hidden" }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 pt-5 pb-3 flex-shrink-0 flex items-center justify-between border-b border-[#F1F1F4]"
      >
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg bg-[#8B5CF6] flex items-center justify-center flex-shrink-0">
            <span className="text-[11px] font-bold text-white">2</span>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-semibold text-[#0F0F0F]">Motor de Treinamento do Gabarito</h1>
              <span className="text-[11px] font-medium text-[#6B6B72] bg-[#F1F1F4] px-2 py-0.5 rounded-full">Passo 2 de 3</span>
            </div>
            <p className="text-xs text-[#6B6B72] mt-0.5">Ensine o sistema a extrair variáveis e aplicar as regras construtivas da fábrica.</p>
          </div>
        </div>
        <Link to="/configuracao">
          <Button variant="outline" className="h-9 rounded-xl text-sm font-medium gap-2 px-4">
            <ArrowLeft className="w-4 h-4" />
            Passo 1
          </Button>
        </Link>
      </motion.div>

      {/* Step tabs */}
      <div className="flex-shrink-0 px-6 pt-4 pb-0 flex items-center gap-2">
        {STEPS.map(s => (
          <button
            key={s.id}
            onClick={() => setStep(s.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-xl border-b-2 text-xs font-semibold transition-all ${
              step === s.id
                ? "border-[#8B5CF6] text-[#8B5CF6] bg-white"
                : "border-transparent text-[#9CA3AF] hover:text-[#6B6B72] bg-transparent"
            }`}
          >
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{
                backgroundColor: step === s.id ? s.color : "#E5E7EB",
                color: step === s.id ? "#fff" : "#9CA3AF",
              }}>
              {s.id}
            </span>
            <span className="hidden sm:inline">{s.label}: {s.sub}</span>
            <span className="sm:hidden">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}>
              <Etapa21Anatomia value={anatomia} onChange={setAnatomia} />
              <div className="flex justify-end mt-5">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 h-10 px-6 rounded-xl text-sm font-semibold text-white bg-[#3B82F6] hover:bg-[#2563EB] transition-colors shadow-sm"
                >
                  Avançar para Etapa 2.2
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.18 }}>
              <Etapa22Variaveis
                anatomia={anatomia}
                secao={secao}
                onSecaoChange={setSecao}
                paineis={paineis}
                onPaineisChange={setPaineis}
              />
              <div className="flex items-center justify-between mt-5">
                <button onClick={() => setStep(1)} className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-medium text-[#6B6B72] border border-[#E5E5E8] hover:bg-[#F1F1F4] transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  Voltar à Etapa 2.1
                </button>
                <button
                  onClick={handleFinalSave}
                  disabled={saving || saved}
                  className="flex items-center gap-2 h-10 px-6 rounded-xl text-sm font-semibold text-white transition-all shadow-sm disabled:opacity-70"
                  style={{ backgroundColor: saved ? "#22C55E" : "#8B5CF6" }}
                >
                  {saving ? (
                    <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Salvando máscara...</>
                  ) : saved ? (
                    <><Check className="w-4 h-4" />Máscara salva!</>
                  ) : (
                    <>Salvar Máscara de Interpretação<Check className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}