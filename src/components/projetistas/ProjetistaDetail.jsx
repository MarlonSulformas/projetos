import React from "react";
import { motion } from "framer-motion";
import { Pencil, Plus, Settings2, Package, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const STATUS_STYLE = {
  "Ativo":      { dot: "bg-green-500",  badge: "bg-green-50 text-green-600",  label: "Ativo" },
  "Em revisão": { dot: "bg-amber-400",  badge: "bg-amber-50 text-amber-600",  label: "Em revisão" },
  "Inativo":    { dot: "bg-[#A1A1AA]",  badge: "bg-[#F1F1F4] text-[#6B6B72]", label: "Inativo" },
};

function InfoField({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-[#6B6B72] uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm text-[#1F1F24] font-medium">{value || "—"}</p>
    </div>
  );
}

function ProdutoCard({ produto, idx, onEdit, onDelete, onToggleStatus }) {
  const s = STATUS_STYLE[produto.status] || STATUS_STYLE["Ativo"];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 + idx * 0.07, ease: "easeOut" }}
      className="flex items-center justify-between gap-3 p-4 bg-white border border-[#E5E5E8] rounded-xl hover:border-[#D4D4D8] transition-all duration-150 shadow-sm"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-9 h-9 rounded-lg bg-[#F1F1F4] flex items-center justify-center flex-shrink-0">
          <Package className="w-4 h-4 text-[#6B6B72]" strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#1F1F24] truncate">{produto.nome}</p>
          <p className="text-xs text-[#6B6B72] mt-0.5 truncate">{produto.descricao}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Status badge (clickable to cycle) */}
        <button
          onClick={() => onToggleStatus(produto)}
          className={`flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border border-transparent hover:opacity-80 transition-opacity ${s.badge}`}
          title="Clique para alterar status"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          {s.label}
        </button>

        <button onClick={() => onEdit(produto)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6B72] border border-[#E5E5E8] bg-white hover:bg-[#F1F1F4] transition-colors">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onDelete(produto)} className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 border border-red-100 bg-white hover:bg-red-50 hover:text-red-500 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        <Button size="sm" className="bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg h-8 px-3 text-xs font-medium shadow-sm gap-1.5 whitespace-nowrap">
          <Settings2 className="w-3.5 h-3.5" />
          Configurar Layout de Leitura
        </Button>
      </div>
    </motion.div>
  );
}

export default function ProjetistaDetail({ projetista, produtos, onEdit, onDelete, onToggleStatus, onNewProduto, onEditProduto, onDeleteProduto, onToggleProdutoStatus }) {
  const ativo = projetista.ativo !== false;

  return (
    <motion.div
      key={projetista.id}
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex-1 min-w-0 flex flex-col gap-5"
    >
      {/* Profile card */}
      <div className="bg-white border border-[#E5E5E8] rounded-2xl shadow-sm p-6">
        <div className="flex items-start justify-between mb-5 gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold text-[#0F0F0F]">{projetista.nome}</h2>
              <span className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${ativo ? "bg-green-50 text-green-600" : "bg-[#F1F1F4] text-[#6B6B72]"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${ativo ? "bg-green-500" : "bg-[#A1A1AA]"}`} />
                {ativo ? "Ativo" : "Inativo"}
              </span>
            </div>
            <p className="text-xs text-[#6B6B72] mt-0.5">Projetista Homologado</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E5E5E8] bg-[#F7F7FA]">
              <Switch
                checked={ativo}
                onCheckedChange={() => onToggleStatus(projetista)}
                className="scale-75 data-[state=checked]:bg-green-500"
              />
              <span className="text-xs font-medium text-[#4A4A52]">{ativo ? "Ativo" : "Inativo"}</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => onEdit(projetista)} className="rounded-lg h-8 px-3 text-xs font-medium text-[#4A4A52] border-[#E5E5E8] hover:bg-[#F1F1F4] gap-1.5">
              <Pencil className="w-3.5 h-3.5" /> Editar Dados
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDelete(projetista)} className="rounded-lg h-8 px-3 text-xs font-medium text-red-500 border-red-200 hover:bg-red-50 gap-1.5">
              <Trash2 className="w-3.5 h-3.5" /> Excluir
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <InfoField label="Razão Social" value={projetista.razao_social} />
          <InfoField label="CNPJ" value={projetista.cnpj} />
          <InfoField label="E-mail de Contato" value={projetista.email} />
        </div>
      </div>

      {/* Produtos section */}
      <div className="bg-white border border-[#E5E5E8] rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold text-[#0F0F0F]">Produtos Estruturais Atrelados</h3>
            <p className="text-xs text-[#6B6B72] mt-0.5">{produtos.length} produto{produtos.length !== 1 ? "s" : ""} vinculado{produtos.length !== 1 ? "s" : ""}</p>
          </div>
          <Button variant="outline" size="sm" onClick={onNewProduto} className="rounded-lg h-8 px-3 text-xs font-medium text-[#3B82F6] border-[#BFDBFE] hover:bg-[#EFF6FF] gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Vincular Novo Produto
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          {produtos.length > 0 ? (
            produtos.map((produto, idx) => (
              <ProdutoCard
                key={produto.id}
                produto={produto}
                idx={idx}
                onEdit={onEditProduto}
                onDelete={onDeleteProduto}
                onToggleStatus={onToggleProdutoStatus}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#F1F1F4] flex items-center justify-center mb-3">
                <Package className="w-6 h-6 text-[#6B6B72]" strokeWidth={1.4} />
              </div>
              <p className="text-sm font-medium text-[#4A4A52]">Nenhum produto vinculado</p>
              <p className="text-xs text-[#6B6B72] mt-1">Clique em "Vincular Novo Produto" para começar.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}