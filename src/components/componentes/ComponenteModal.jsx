import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Save, Trash2 } from "lucide-react";

const TIPOS_SUGERIDOS = ["compensado", "sarrafo_pressao", "sarrafo_acabamento", "mosca"];
const CORES = ["#3B82F6", "#F59E0B", "#10B981", "#8B5CF6", "#EF4444", "#0EA5E9", "#6366F1", "#6B7280"];

export default function ComponenteModal({ componente, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(() => ({
    nome: componente?.nome || "",
    tipo: componente?.tipo || "",
    cor: componente?.cor || "#3B82F6",
    ativo: componente?.ativo !== false,
    regras: componente?.regras || {},
  }));
  const [saving, setSaving] = useState(false);

  function setRegra(chave, valor) {
    setForm(f => ({ ...f, regras: { ...f.regras, [chave]: valor } }));
  }

  function handleSave() {
    if (!form.nome.trim() || !form.tipo.trim()) {
      alert("Preencha nome e tipo do componente.");
      return;
    }
    setSaving(true);
    onSave({ ...componente, ...form, id: componente?.id }).finally(() => setSaving(false));
  }

  return (
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
        className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg flex flex-col overflow-hidden"
        style={{ maxHeight: "90vh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-base font-bold text-white">{componente ? "Editar Componente" : "Novo Componente"}</p>
              <p className="text-[11px] text-white/70 mt-0.5">Defina o componente e suas regras de cálculo</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-5 bg-[#F8F9FB] flex flex-col gap-4">
          {/* Dados básicos */}
          <div className="bg-white border border-[#E5E5E8] rounded-2xl p-4 flex flex-col gap-3">
            <p className="text-[10px] font-semibold text-[#6B6B72] uppercase tracking-wider">Dados Básicos</p>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-[#374151]">Nome</label>
              <input
                value={form.nome}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                placeholder="Ex: Compensado, Sarrafo de Pressão"
                className="border border-[#E5E5E8] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B82F6] bg-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-[#374151]">Tipo (identificador técnico)</label>
              <input
                value={form.tipo}
                onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                placeholder="Ex: compensado, sarrafo_pressao"
                list="tipos-sugeridos"
                className="border border-[#E5E5E8] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B82F6] bg-white font-mono"
              />
              <datalist id="tipos-sugeridos">
                {TIPOS_SUGERIDOS.map(t => <option key={t} value={t} />)}
              </datalist>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-[#374151]">Cor (identificação visual)</label>
              <div className="flex gap-2 flex-wrap">
                {CORES.map(c => (
                  <button
                    key={c}
                    onClick={() => setForm(f => ({ ...f, cor: c }))}
                    className={`w-7 h-7 rounded-lg transition-all ${form.cor === c ? "ring-2 ring-offset-2 ring-[#1F1F24]" : ""}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-[#374151]">Largura do componente (cm) <span className="text-[#9CA3AF]">(usado como [LARGURA] nas fórmulas)</span></label>
              <input
                type="number"
                step="0.1"
                value={form.regras.largura || ""}
                onChange={e => setRegra("largura", e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="Ex: 6.5"
                className="border border-[#E5E5E8] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B82F6] bg-white"
              />
            </div>
          </div>

          {/* Regras de Medida */}
          <div className="bg-white border border-[#E5E5E8] rounded-2xl p-4 flex flex-col gap-3">
            <p className="text-[10px] font-semibold text-[#6B6B72] uppercase tracking-wider">Fórmulas de Medida</p>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-[#374151]">Fórmula do comprimento <span className="text-[#9CA3AF]">(use [MEDIDA], [LARGURA], [X], [Y])</span></label>
              <input
                value={form.regras.formula_comprimento || ""}
                onChange={e => setRegra("formula_comprimento", e.target.value)}
                placeholder="Ex: [MEDIDA] - 0.5   ou   [MEDIDA] - [LARGURA] - 0.5"
                className="border border-[#E5E5E8] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B82F6] bg-white font-mono"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-[#374151]">Fórmula da largura <span className="text-[#9CA3AF]">(use [MEDIDA], [LARGURA], [X], [Y])</span></label>
              <input
                value={form.regras.formula_largura || ""}
                onChange={e => setRegra("formula_largura", e.target.value)}
                placeholder="Ex: [Y]   (vazio = usar medida bruta do desenho)"
                className="border border-[#E5E5E8] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B82F6] bg-white font-mono"
              />
            </div>
          </div>

          {/* Regras de Desconto */}
          <div className="bg-white border border-[#E5E5E8] rounded-2xl p-4 flex flex-col gap-3">
            <p className="text-[10px] font-semibold text-[#6B6B72] uppercase tracking-wider">Descontos</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-[#374151]">Desconto fixo (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.regras.desconto_fixo || ""}
                  onChange={e => setRegra("desconto_fixo", e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="0"
                  className="border border-[#E5E5E8] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B82F6] bg-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-[#374151]">Desconto %</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.regras.desconto_percentual || ""}
                  onChange={e => setRegra("desconto_percentual", e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="0"
                  className="border border-[#E5E5E8] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B82F6] bg-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-[#374151]">Folga (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.regras.folga || ""}
                  onChange={e => setRegra("folga", e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="0"
                  className="border border-[#E5E5E8] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B82F6] bg-white"
                />
              </div>
            </div>
          </div>

          {/* Regra de Emenda */}
          <div className="bg-white border border-[#E5E5E8] rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold text-[#6B6B72] uppercase tracking-wider">Regra de Emenda</p>
              <button
                onClick={() => setRegra("regra_emenda", !form.regras.regra_emenda)}
                className={`w-9 h-5 rounded-full transition-colors relative ${form.regras.regra_emenda ? "bg-[#22C55E]" : "bg-[#E5E5E8]"}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${form.regras.regra_emenda ? "left-[18px]" : "left-0.5"}`} />
              </button>
            </div>
            {form.regras.regra_emenda && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-[#374151]">Limite para emenda (cm)</label>
                  <input
                    type="number"
                    value={form.regras.limite_emenda || 244}
                    onChange={e => setRegra("limite_emenda", parseInt(e.target.value) || 244)}
                    className="border border-[#E5E5E8] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B82F6] bg-white"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-[#374151]">Módulo base (cm)</label>
                  <input
                    type="number"
                    value={form.regras.modulo_emenda || 200}
                    onChange={e => setRegra("modulo_emenda", parseInt(e.target.value) || 200)}
                    className="border border-[#E5E5E8] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B82F6] bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Regras de Quantidade */}
          <div className="bg-white border border-[#E5E5E8] rounded-2xl p-4 flex flex-col gap-3">
            <p className="text-[10px] font-semibold text-[#6B6B72] uppercase tracking-wider">Quantidade</p>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-[#374151]">Quantidade padrão</label>
              <input
                type="number"
                value={form.regras.quantidade || 1}
                onChange={e => setRegra("quantidade", parseInt(e.target.value) || 1)}
                className="border border-[#E5E5E8] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B82F6] bg-white"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium text-[#374151]">Quantidade baseada em Y (largura)</label>
              <button
                onClick={() => setRegra("regra_qty_y", !form.regras.regra_qty_y)}
                className={`w-9 h-5 rounded-full transition-colors relative ${form.regras.regra_qty_y ? "bg-[#22C55E]" : "bg-[#E5E5E8]"}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${form.regras.regra_qty_y ? "left-[18px]" : "left-0.5"}`} />
              </button>
            </div>
            {form.regras.regra_qty_y && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-[#374151]">Qtd extra quando Y maior que limite</label>
                  <input
                    type="number"
                    value={form.regras.qty_extra || 2}
                    onChange={e => setRegra("qty_extra", parseInt(e.target.value) || 2)}
                    className="border border-[#E5E5E8] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B82F6] bg-white"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-[#374151]">Limite Y simples (cm)</label>
                  <input
                    type="number"
                    value={form.regras.limite_y_simples || 24}
                    onChange={e => setRegra("limite_y_simples", parseInt(e.target.value) || 24)}
                    className="border border-[#E5E5E8] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B82F6] bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Ancoragem */}
          <div className="bg-white border border-[#E5E5E8] rounded-2xl p-4 flex flex-col gap-3">
            <p className="text-[10px] font-semibold text-[#6B6B72] uppercase tracking-wider">Ancoragem</p>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-[#374151]">Tipo de ancoragem</label>
              <select
                value={form.regras.ancoragem || "topo"}
                onChange={e => setRegra("ancoragem", e.target.value)}
                className="border border-[#E5E5E8] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B82F6] bg-white"
              >
                <option value="topo">Topo</option>
                <option value="base">Base</option>
                <option value="livre">Livre</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#F1F1F4] bg-white flex items-center gap-2 flex-shrink-0">
          {componente?.id && (
            <button
              onClick={() => onDelete(componente.id)}
              className="h-9 px-3 rounded-xl text-xs font-medium border border-[#FCA5A5] text-[#DC2626] hover:bg-[#FEF2F2] transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Excluir
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-xl text-xs font-medium text-[#6B7280] hover:text-[#374151] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-9 px-5 rounded-xl text-xs font-semibold bg-[#3B82F6] text-white hover:bg-[#2563EB] transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}