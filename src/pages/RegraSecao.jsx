import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Plus, Trash2, Info, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const FACES = ["A", "B", "C", "D"];

// Visual cross-section of a column pillar
function PillarSection({ medida1Faces, medida2Faces }) {
  function getFaceColor(face) {
    if (medida1Faces.includes(face)) return "#3B82F6";
    if (medida2Faces.includes(face)) return "#8B5CF6";
    return "#D1D5DB";
  }

  // A=top, B=right, C=bottom, D=left
  return (
    <div className="relative w-44 h-44 flex items-center justify-center flex-shrink-0">
      {/* Center square */}
      <div className="w-20 h-20 bg-[#F1F5F9] border-2 border-[#CBD5E1] rounded-sm absolute" />

      {/* Face A — top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center" style={{ top: 8 }}>
        <div className="w-20 h-5 rounded-t-md flex items-center justify-center text-[10px] font-bold text-white transition-colors duration-200"
          style={{ backgroundColor: getFaceColor("A") }}>
          A
        </div>
        <div className="w-0.5 h-6" style={{ backgroundColor: getFaceColor("A") }} />
      </div>

      {/* Face B — right */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-row items-center" style={{ right: 8 }}>
        <div className="h-0.5 w-6" style={{ backgroundColor: getFaceColor("B") }} />
        <div className="h-20 w-5 rounded-r-md flex items-center justify-center text-[10px] font-bold text-white transition-colors duration-200"
          style={{ backgroundColor: getFaceColor("B") }}>
          B
        </div>
      </div>

      {/* Face C — bottom */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center" style={{ bottom: 8 }}>
        <div className="w-0.5 h-6" style={{ backgroundColor: getFaceColor("C") }} />
        <div className="w-20 h-5 rounded-b-md flex items-center justify-center text-[10px] font-bold text-white transition-colors duration-200"
          style={{ backgroundColor: getFaceColor("C") }}>
          C
        </div>
      </div>

      {/* Face D — left */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-row items-center" style={{ left: 8 }}>
        <div className="h-20 w-5 rounded-l-md flex items-center justify-center text-[10px] font-bold text-white transition-colors duration-200"
          style={{ backgroundColor: getFaceColor("D") }}>
          D
        </div>
        <div className="h-0.5 w-6" style={{ backgroundColor: getFaceColor("D") }} />
      </div>
    </div>
  );
}

// Face selector chip
function FaceChip({ face, selected, color, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(face)}
      className="w-8 h-8 rounded-lg border-2 text-xs font-bold transition-all duration-150"
      style={{
        borderColor: selected ? color : "#E5E7EB",
        backgroundColor: selected ? color : "#F9FAFB",
        color: selected ? "#fff" : "#6B7280",
      }}
    >
      {face}
    </button>
  );
}

export default function RegraSecao() {
  const navigate = useNavigate();
  const [temSecao, setTemSecao] = useState(false);
  const [medida1Faces, setMedida1Faces] = useState(["C", "D"]);
  const [medida2Faces, setMedida2Faces] = useState(["A", "B"]);
  const [ajustes, setAjustes] = useState([{ descricao: "", valor: "" }]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggleFace(face, medida) {
    if (medida === 1) {
      setMedida1Faces(prev =>
        prev.includes(face) ? prev.filter(f => f !== face) : [...prev, face]
      );
    } else {
      setMedida2Faces(prev =>
        prev.includes(face) ? prev.filter(f => f !== face) : [...prev, face]
      );
    }
  }

  function addAjuste() {
    setAjustes(prev => [...prev, { descricao: "", valor: "" }]);
  }

  function removeAjuste(idx) {
    setAjustes(prev => prev.filter((_, i) => i !== idx));
  }

  function updateAjuste(idx, field, value) {
    setAjustes(prev => prev.map((a, i) => i === idx ? { ...a, [field]: value } : a));
  }

  async function handleSave() {
    setSaving(true);
    // Simulate save — in production, persist to Supabase via db client
    await new Promise(r => setTimeout(r, 800));
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
            <p className="text-xs text-[#6B6B72] mt-0.5">Defina como o sistema interpretará a geometria de concreto extraída do PDF.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/configuracao">
            <Button variant="outline" className="h-9 rounded-xl text-sm font-medium gap-2 px-4">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Passo 1
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6 flex flex-col gap-4">

        {/* Toggle card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white border border-[#E5E5E8] rounded-2xl shadow-sm p-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F5F3FF] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Info className="w-4 h-4 text-[#8B5CF6]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0F0F0F]">Este produto possui Seção Transversal variável no PDF?</p>
                <p className="text-xs text-[#6B6B72] mt-0.5">
                  Ative se o PDF contiver uma região com medidas da seção de concreto que variam por elemento (ex: "19/95").
                </p>
              </div>
            </div>

            {/* Toggle switch */}
            <button
              type="button"
              onClick={() => setTemSecao(v => !v)}
              className="relative flex-shrink-0 ml-6"
            >
              <div className={`w-12 h-6 rounded-full transition-colors duration-200 ${temSecao ? "bg-[#8B5CF6]" : "bg-[#D1D5DB]"}`} />
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${temSecao ? "left-7" : "left-1"}`} />
            </button>
          </div>

          <AnimatePresence>
            {!temSecao && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 flex items-center gap-2 bg-[#F8F9FB] border border-[#E5E5E8] rounded-xl px-4 py-3">
                  <div className="w-2 h-2 rounded-full bg-[#9CA3AF] flex-shrink-0" />
                  <p className="text-xs text-[#6B6B72]">
                    Sem seção variável — o sistema pulará para as <span className="font-semibold text-[#374151]">regras principais dos painéis (Etapa 2.2)</span>.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
              {/* Face mapping */}
              <div className="bg-white border border-[#E5E5E8] rounded-2xl shadow-sm p-5">
                <p className="text-xs font-semibold text-[#6B6B72] uppercase tracking-wider mb-4">Mapeamento das Faces</p>
                <div className="flex items-start gap-8 flex-wrap">

                  {/* Visual pillar */}
                  <div className="flex flex-col items-center gap-3">
                    <PillarSection medida1Faces={medida1Faces} medida2Faces={medida2Faces} />
                    <div className="flex items-center gap-4 text-[10px] font-medium text-[#6B6B72]">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm bg-[#3B82F6] inline-block" /> Medida 1
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm bg-[#8B5CF6] inline-block" /> Medida 2
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm bg-[#D1D5DB] inline-block" /> Sem mapeamento
                      </span>
                    </div>
                  </div>

                  {/* Face selectors */}
                  <div className="flex flex-col gap-5 flex-1 min-w-[260px]">
                    {/* Example hint */}
                    <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-3">
                      <p className="text-[11px] font-semibold text-[#1D4ED8] mb-0.5">Exemplo de leitura no PDF</p>
                      <p className="text-xs text-[#3B82F6]">
                        Texto <span className="font-mono font-bold bg-blue-100 px-1 rounded">19/95</span> → Medida 1 = 19 cm · Medida 2 = 95 cm
                      </p>
                    </div>

                    {/* Medida 1 */}
                    <div>
                      <p className="text-[11px] font-semibold text-[#374151] mb-2">
                        Medida 1 <span className="text-[#6B6B72] font-normal">(primeiro valor) — aplica-se às Faces:</span>
                      </p>
                      <div className="flex gap-2">
                        {FACES.map(f => (
                          <FaceChip key={f} face={f} selected={medida1Faces.includes(f)} color="#3B82F6" onClick={f => toggleFace(f, 1)} />
                        ))}
                      </div>
                      {medida1Faces.length > 0 && (
                        <p className="text-[10px] text-[#6B6B72] mt-1.5">
                          Faces selecionadas: <span className="font-semibold text-[#3B82F6]">{medida1Faces.join(", ")}</span>
                        </p>
                      )}
                    </div>

                    {/* Medida 2 */}
                    <div>
                      <p className="text-[11px] font-semibold text-[#374151] mb-2">
                        Medida 2 <span className="text-[#6B6B72] font-normal">(segundo valor) — aplica-se às Faces:</span>
                      </p>
                      <div className="flex gap-2">
                        {FACES.map(f => (
                          <FaceChip key={f} face={f} selected={medida2Faces.includes(f)} color="#8B5CF6" onClick={f => toggleFace(f, 2)} />
                        ))}
                      </div>
                      {medida2Faces.length > 0 && (
                        <p className="text-[10px] text-[#6B6B72] mt-1.5">
                          Faces selecionadas: <span className="font-semibold text-[#8B5CF6]">{medida2Faces.join(", ")}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ajustes fixos */}
              <div className="bg-white border border-[#E5E5E8] rounded-2xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs font-semibold text-[#6B6B72] uppercase tracking-wider">Ajustes Fixos de Concreto</p>
                    <p className="text-[11px] text-[#9CA3AF] mt-0.5">Descontos ou acréscimos aplicados sobre a medida lida no PDF.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addAjuste}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#F5F3FF] text-[#8B5CF6] text-xs font-medium hover:bg-[#EDE9FE] transition-colors border border-[#DDD6FE]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar ajuste
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {ajustes.map((ajuste, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        value={ajuste.descricao}
                        onChange={e => updateAjuste(idx, "descricao", e.target.value)}
                        placeholder='Ex: Desconto para fechamento de fôrma'
                        className="flex-1 border border-[#E5E5E8] rounded-lg px-3 py-2 text-xs text-[#1F1F24] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] transition-colors"
                      />
                      <div className="flex items-center border border-[#E5E5E8] rounded-lg overflow-hidden">
                        <input
                          type="number"
                          value={ajuste.valor}
                          onChange={e => updateAjuste(idx, "valor", e.target.value)}
                          placeholder="0"
                          className="w-16 px-2 py-2 text-xs text-[#1F1F24] focus:outline-none text-center"
                        />
                        <span className="px-2 text-[11px] text-[#6B6B72] bg-[#F8F9FB] border-l border-[#E5E5E8] py-2 font-medium">cm</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAjuste(idx)}
                        disabled={ajustes.length === 1}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-red-50 hover:text-red-400 transition-colors disabled:opacity-30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving || saved}
                  className="flex items-center gap-2 h-10 px-6 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-70"
                  style={{ backgroundColor: saved ? "#22C55E" : "#8B5CF6" }}
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Salvando...
                    </>
                  ) : saved ? (
                    <>
                      <Check className="w-4 h-4" />
                      Salvo! Avançando...
                    </>
                  ) : (
                    <>
                      Salvar Seção e Avançar para Painel Principal (Etapa 2.2)
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

        {/* Skip button when toggle is off */}
        {!temSecao && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-end"
          >
            <button
              onClick={() => navigate("/regra-painel")}
              className="flex items-center gap-2 h-10 px-6 rounded-xl text-sm font-semibold text-white bg-[#3B82F6] hover:bg-[#2563EB] transition-colors"
            >
              Ir para Regras do Painel Principal (Etapa 2.2)
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}