import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Box, Trash2, Loader2, AlertCircle, Settings2 } from "lucide-react";
import { db } from "@/lib/supabaseClient";
import ComponenteModal from "@/components/componentes/ComponenteModal";

export default function Componentes() {
  const [componentes, setComponentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingComp, setEditingComp] = useState(null);

  async function carregar() {
    setLoading(true);
    setErro(null);
    try {
      const data = await db.listComponentes();
      setComponentes(data || []);
    } catch (e) {
      setErro(e.message);
    }
    setLoading(false);
  }

  useEffect(() => { carregar(); }, []);

  function handleNovo() {
    setEditingComp(null);
    setModalOpen(true);
  }

  function handleEditar(comp) {
    setEditingComp(comp);
    setModalOpen(true);
  }

  async function handleSave(comp) {
    try {
      if (comp.id) {
        await db.updateComponente(comp.id, comp);
      } else {
        await db.createComponente(comp);
      }
      setModalOpen(false);
      carregar();
    } catch (e) {
      alert("Erro ao salvar: " + e.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Excluir este componente? As regras associadas serão removidas.")) return;
    try {
      await db.deleteComponente(id);
      setModalOpen(false);
      carregar();
    } catch (e) {
      alert("Erro ao excluir: " + e.message);
    }
  }

  async function handleToggleAtivo(comp) {
    try {
      await db.updateComponente(comp.id, { ativo: !comp.ativo });
      carregar();
    } catch (e) {
      alert("Erro: " + e.message);
    }
  }

  return (
    <div className="flex flex-col" style={{ height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 pt-5 pb-3 flex-shrink-0 flex items-center justify-between border-b border-[#F1F1F4]"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center flex-shrink-0">
            <Settings2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[#0F0F0F]">Componentes e Regras</h1>
            <p className="text-xs text-[#6B6B72] mt-0.5">
              Cadastre os componentes e suas regras de cálculo. A IA apenas extrai as medidas brutas — o sistema aplica as regras.
            </p>
          </div>
        </div>
        <button
          onClick={handleNovo}
          className="flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-medium bg-[#3B82F6] text-white hover:bg-[#2563EB] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Componente
        </button>
      </motion.div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 bg-[#F8F9FB]">
        {loading && (
          <div className="flex items-center justify-center py-20 gap-2">
            <Loader2 className="w-5 h-5 text-[#3B82F6] animate-spin" />
            <span className="text-sm text-[#6B6B72]">Carregando componentes...</span>
          </div>
        )}

        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">Erro ao carregar</p>
              <p className="text-xs text-red-500 mt-1">{erro}</p>
              <p className="text-[11px] text-red-400 mt-2">
                Verifique se a tabela <code className="bg-red-100 px-1 rounded">componentes</code> foi criada no Supabase.
              </p>
            </div>
          </div>
        )}

        {!loading && !erro && componentes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#F1F1F4] flex items-center justify-center">
              <Box className="w-7 h-7 text-[#D1D5DB]" />
            </div>
            <p className="text-sm font-semibold text-[#6B7280]">Nenhum componente cadastrado</p>
            <p className="text-xs text-[#9CA3AF] max-w-sm">
              Cadastre os componentes (Compensado, Sarrafo de Pressão, etc.) e defina as regras de cálculo para cada um.
            </p>
            <button
              onClick={handleNovo}
              className="mt-2 flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-medium bg-[#3B82F6] text-white hover:bg-[#2563EB] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Cadastrar primeiro componente
            </button>
          </div>
        )}

        {!loading && !erro && componentes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {componentes.map((comp, i) => {
              const regras = comp.regras || {};
              const regrasAtivas = Object.entries(regras).filter(([k, v]) => v !== null && v !== "" && v !== false && v !== 0).length;
              return (
                <motion.div
                  key={comp.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-white border border-[#E5E5E8] rounded-2xl shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleEditar(comp)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (comp.cor || "#6B7280") + "22" }}>
                        <Box className="w-4 h-4" style={{ color: comp.cor || "#6B7280" }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1F1F24]">{comp.nome}</p>
                        <p className="text-[10px] text-[#9CA3AF] font-mono">{comp.tipo}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleAtivo(comp); }}
                      className={`w-9 h-5 rounded-full transition-colors flex-shrink-0 relative ${comp.ativo !== false ? "bg-[#22C55E]" : "bg-[#E5E5E8]"}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${comp.ativo !== false ? "left-[18px]" : "left-0.5"}`} />
                    </button>
                  </div>

                  {/* Resumo das regras */}
                  <div className="flex flex-wrap gap-1.5">
                    {regras.desconto_fixo ? (
                      <span className="text-[10px] bg-[#EFF6FF] text-[#3B82F6] border border-[#BFDBFE] rounded-md px-2 py-0.5 font-medium">
                        −{regras.desconto_fixo}cm
                      </span>
                    ) : null}
                    {regras.desconto_percentual ? (
                      <span className="text-[10px] bg-[#EFF6FF] text-[#3B82F6] border border-[#BFDBFE] rounded-md px-2 py-0.5 font-medium">
                        −{regras.desconto_percentual}%
                      </span>
                    ) : null}
                    {regras.regra_emenda ? (
                      <span className="text-[10px] bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] rounded-md px-2 py-0.5 font-medium">
                        Emenda {regras.limite_emenda || 244}cm
                      </span>
                    ) : null}
                    {regras.formula_comprimento ? (
                      <span className="text-[10px] bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] rounded-md px-2 py-0.5 font-medium font-mono">
                        {regras.formula_comprimento}
                      </span>
                    ) : null}
                    {regras.regra_qty_y ? (
                      <span className="text-[10px] bg-[#EDE9FE] text-[#7C3AED] border border-[#DDD6FE] rounded-md px-2 py-0.5 font-medium">
                        Qtd por Y
                      </span>
                    ) : null}
                    {regrasAtivas === 0 && (
                      <span className="text-[10px] text-[#D1D5DB] italic">Sem regras configuradas</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <ComponenteModal
            componente={editingComp}
            onClose={() => setModalOpen(false)}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}