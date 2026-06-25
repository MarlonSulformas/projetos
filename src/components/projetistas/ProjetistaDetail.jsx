import React from "react";
import { motion } from "framer-motion";
import { Pencil, Plus, Settings2, Package, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const statusConfig = {
  "Ativo": { color: "text-green-600", bg: "bg-green-50", icon: CheckCircle },
  "Em revisão": { color: "text-amber-600", bg: "bg-amber-50", icon: Clock },
};

function InfoField({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-[#6B6B72] uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm text-[#1F1F24] font-medium">{value}</p>
    </div>
  );
}

function ProdutoCard({ produto, idx }) {
  const status = statusConfig[produto.status] || statusConfig["Ativo"];
  const StatusIcon = status.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.25 + idx * 0.08, ease: "easeOut" }}
      className="flex items-center justify-between gap-4 p-4 bg-white border border-[#E5E5E8] rounded-xl hover:border-[#D4D4D8] transition-all duration-150 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#F1F1F4] flex items-center justify-center flex-shrink-0">
          <Package className="w-4 h-4 text-[#6B6B72]" strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-sm font-medium text-[#1F1F24] leading-snug">{produto.nome}</p>
          <p className="text-xs text-[#6B6B72] mt-0.5">{produto.subtitulo}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className={`flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full ${status.bg} ${status.color}`}>
          <StatusIcon className="w-3 h-3" strokeWidth={2} />
          {produto.status}
        </span>
        <Button
          size="sm"
          className="bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg h-8 px-3 text-xs font-medium shadow-sm transition-all duration-150 gap-1.5"
        >
          <Settings2 className="w-3.5 h-3.5" />
          Configurar Layout de Leitura
        </Button>
      </div>
    </motion.div>
  );
}

export default function ProjetistaDetail({ projetista }) {
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
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-[#0F0F0F]">{projetista.nome}</h2>
            <p className="text-xs text-[#6B6B72] mt-0.5">Projetista Homologado</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg h-8 px-3 text-xs font-medium text-[#4A4A52] border-[#E5E5E8] hover:bg-[#F1F1F4] gap-1.5"
          >
            <Pencil className="w-3.5 h-3.5" />
            Editar Dados
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <InfoField label="Razão Social" value={projetista.razaoSocial} />
          <InfoField label="CNPJ" value={projetista.cnpj} />
          <InfoField label="E-mail de Contato" value={projetista.email} />
        </div>
      </div>

      {/* Produtos section */}
      <div className="bg-white border border-[#E5E5E8] rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold text-[#0F0F0F]">Produtos Estruturais Atrelados</h3>
            <p className="text-xs text-[#6B6B72] mt-0.5">
              {projetista.produtos.length} produto{projetista.produtos.length !== 1 ? "s" : ""} vinculado{projetista.produtos.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg h-8 px-3 text-xs font-medium text-[#3B82F6] border-[#BFDBFE] hover:bg-[#EFF6FF] gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Vincular Novo Produto
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          {projetista.produtos.length > 0 ? (
            projetista.produtos.map((produto, idx) => (
              <ProdutoCard key={produto.id} produto={produto} idx={idx} />
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