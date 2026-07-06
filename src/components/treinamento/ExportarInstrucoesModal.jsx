import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Copy, CheckCheck, MessageSquare, BookOpen } from "lucide-react";

export default function ExportarInstrucoesModal({ mensagens, baseConhecimento, nomeProduto, onClose }) {
  const [copiado, setCopiado] = useState(false);
  const [aba, setAba] = useState("instrucoes"); // "instrucoes" | "base"

  // Filtra apenas as mensagens do engenheiro (usuário) do histórico atual
  const instrucoes = (mensagens || []).filter(m => m.role === "user");

  const textoInstrucoes = instrucoes.length > 0
    ? instrucoes.map((m, i) => `[Instrução ${i + 1}]\n${m.content}`).join("\n\n---\n\n")
    : "(Nenhuma instrução no histórico atual — históricos anteriores já foram consolidados na Base de Conhecimento abaixo)";

  const textoBase = baseConhecimento || "(Base de conhecimento ainda não gerada)";

  const textoCompleto = `BACKUP DE TREINAMENTO — ${nomeProduto}
Exportado em: ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}

${"=".repeat(60)}
PARTE 1 — INSTRUÇÕES DO HISTÓRICO ATUAL (${instrucoes.length} mensagens)
${"=".repeat(60)}

${textoInstrucoes}

${"=".repeat(60)}
PARTE 2 — BASE DE CONHECIMENTO CONSOLIDADA (fonte principal)
${"=".repeat(60)}

${textoBase}`;

  function handleCopiar() {
    const texto = aba === "instrucoes" ? textoInstrucoes : textoBase;
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  function handleDownload() {
    const blob = new Blob([textoCompleto], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup_treinamento_${nomeProduto?.replace(/\s+/g, "_").toLowerCase()}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: "88vh" }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 bg-gradient-to-br from-[#1F1F24] to-[#374151] flex-shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Download className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-base font-bold text-white">Backup de Treinamento</p>
                  <p className="text-[11px] text-white/60 mt-0.5">{nomeProduto}</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-white/50 mt-3">
              Salve antes de zerar. A <strong className="text-white/80">Base de Conhecimento</strong> é a fonte mais completa — ela contém todo o histórico consolidado, inclusive de sessões anteriores.
            </p>

            {/* Abas */}
            <div className="flex gap-1 mt-4">
              <button
                onClick={() => setAba("instrucoes")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${aba === "instrucoes" ? "bg-white text-[#1F1F24]" : "text-white/60 hover:text-white hover:bg-white/10"}`}
              >
                <MessageSquare className="w-3 h-3" />
                Histórico atual ({instrucoes.length})
              </button>
              <button
                onClick={() => setAba("base")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${aba === "base" ? "bg-white text-[#1F1F24]" : "text-white/60 hover:text-white hover:bg-white/10"}`}
              >
                <BookOpen className="w-3 h-3" />
                Base consolidada ✦
              </button>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="flex-1 overflow-y-auto bg-[#F8F9FB]">
            {aba === "instrucoes" && (
              <div className="p-4 flex flex-col gap-2">
                {instrucoes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-6">
                    <div className="w-12 h-12 rounded-2xl bg-[#F1F1F4] flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-[#D1D5DB]" />
                    </div>
                    <p className="text-sm font-semibold text-[#6B7280]">Nenhuma instrução no histórico atual.</p>
                    <p className="text-xs text-[#9CA3AF]">Veja a aba "Base consolidada" — ela contém todo o conhecimento acumulado, incluindo sessões anteriores.</p>
                  </div>
                ) : (
                  instrucoes.map((m, i) => (
                    <div key={i} className="bg-white border border-[#E5E5E8] rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Instrução {i + 1}</span>
                        {m.pdfNome && (
                          <span className="text-[10px] bg-[#EFF6FF] text-[#3B82F6] border border-[#BFDBFE] rounded-md px-1.5 py-0.5 font-medium">
                            📎 {m.pdfNome}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#374151] leading-relaxed whitespace-pre-wrap">{m.content}</p>
                      <p className="text-[9px] text-[#9CA3AF] mt-2">{new Date(m.timestamp).toLocaleString("pt-BR")}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {aba === "base" && (
              <div className="p-4">
                {!baseConhecimento ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-6">
                    <div className="w-12 h-12 rounded-2xl bg-[#F1F1F4] flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-[#D1D5DB]" />
                    </div>
                    <p className="text-sm font-semibold text-[#6B7280]">Base de conhecimento ainda vazia.</p>
                  </div>
                ) : (
                  <pre className="text-xs text-[#374151] leading-relaxed whitespace-pre-wrap font-mono bg-white border border-[#E5E5E8] rounded-xl p-4">
                    {baseConhecimento}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-[#F1F1F4] bg-white flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleCopiar}
              className="flex-1 h-9 rounded-xl text-xs font-semibold border border-[#E5E5E8] text-[#374151] hover:bg-[#F1F1F4] transition-colors flex items-center justify-center gap-1.5"
            >
              {copiado ? <CheckCheck className="w-3.5 h-3.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5" />}
              {copiado ? "Copiado!" : "Copiar aba atual"}
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 h-9 rounded-xl text-xs font-semibold bg-[#1F1F24] text-white hover:bg-[#374151] transition-colors flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar tudo (.txt)
            </button>
            <button onClick={onClose} className="h-9 px-4 rounded-xl text-xs font-medium text-[#9CA3AF] hover:text-[#374151] transition-colors">
              Fechar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}