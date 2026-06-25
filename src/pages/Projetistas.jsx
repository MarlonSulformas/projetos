import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import ProjetistasList from "@/components/projetistas/ProjetistasList";
import ProjetistaDetail from "@/components/projetistas/ProjetistaDetail";
import ProjetistaModal from "@/components/projetistas/ProjetistaModal";
import ProdutoModal from "@/components/projetistas/ProdutoModal";
import ConfirmDialog from "@/components/projetistas/ConfirmDialog";

const PRODUTO_STATUS_CYCLE = { "Ativo": "Em revisão", "Em revisão": "Inativo", "Inativo": "Ativo" };

const SEED_PROJETISTAS = [
  { nome: "Estruturas Apex", razao_social: "Estruturas Apex Engenharia Ltda.", cnpj: "12.345.678/0001-90", email: "contato@estruturasapex.com.br", especialidade: "Vigas e Lajes", ativo: true },
  { nome: "Engenharia Delta", razao_social: "Engenharia Delta S.A.", cnpj: "98.765.432/0001-11", email: "contato@deltaeng.com.br", especialidade: "Pilares e Fundações", ativo: true },
  { nome: "Concretar Estrutural", razao_social: "Concretar Estrutural Eireli", cnpj: "11.222.333/0001-44", email: "engenharia@concretar.com.br", especialidade: "Painéis e Fachadas", ativo: true },
  { nome: "Prémold Tech", razao_social: "Prémold Tech Sistemas Ltda.", cnpj: "67.890.123/0001-55", email: "suporte@premoldtech.com.br", especialidade: "Sistemas Pré-Moldados", ativo: true },
];

export default function Projetistas() {
  const [projetistas, setProjetistas] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [projetistaModal, setProjetistaModal] = useState({ open: false, data: null });
  const [produtoModal, setProdutoModal] = useState({ open: false, data: null });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, onConfirm: null, description: "" });

  // ── Load data & seed if empty ──────────────────────────────────────────────
  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    let ps = await base44.entities.Projetista.list();
    if (ps.length === 0) {
      for (const p of SEED_PROJETISTAS) {
        await base44.entities.Projetista.create(p);
      }
      ps = await base44.entities.Projetista.list();
    }
    setProjetistas(ps);
    if (ps.length > 0 && !selectedId) setSelectedId(ps[0].id);

    const prods = await base44.entities.ProdutoEstrutural.list();
    if (prods.length === 0 && ps.length >= 4) {
      const seedProdutos = [
        { projetista_id: ps[0].id, nome: "Vigas Pré-Moldadas", descricao: "Layout Padrão V1", status: "Ativo" },
        { projetista_id: ps[0].id, nome: "Pilares Industriais", descricao: "Modelo Técnico P3", status: "Em revisão" },
        { projetista_id: ps[1].id, nome: "Fundação Profunda", descricao: "Sistema FP-10", status: "Ativo" },
        { projetista_id: ps[2].id, nome: "Painéis de Fachada", descricao: "Módulo Externo PF-7", status: "Ativo" },
        { projetista_id: ps[2].id, nome: "Escadas Pré-Moldadas", descricao: "Série Residencial ES3", status: "Ativo" },
        { projetista_id: ps[3].id, nome: "Lajes Nervuradas", descricao: "Série Industrial LN-5", status: "Ativo" },
      ];
      for (const prod of seedProdutos) {
        await base44.entities.ProdutoEstrutural.create(prod);
      }
      setProdutos(await base44.entities.ProdutoEstrutural.list());
    } else {
      setProdutos(prods);
    }
    setLoading(false);
  }

  async function reloadProjetistas() {
    setProjetistas(await base44.entities.Projetista.list());
  }
  async function reloadProdutos() {
    setProdutos(await base44.entities.ProdutoEstrutural.list());
  }

  // ── Projetista CRUD ────────────────────────────────────────────────────────
  async function saveProjetista(form) {
    if (projetistaModal.data) {
      await base44.entities.Projetista.update(projetistaModal.data.id, form);
    } else {
      const created = await base44.entities.Projetista.create({ ...form, ativo: true });
      setSelectedId(created.id);
    }
    reloadProjetistas();
  }

  function confirmDeleteProjetista(p) {
    setConfirmDialog({
      open: true,
      description: `Tem certeza que deseja excluir "${p.nome}"? Os produtos vinculados serão removidos.`,
      onConfirm: async () => {
        await base44.entities.Projetista.delete(p.id);
        // delete linked produtos
        const linked = produtos.filter((pr) => pr.projetista_id === p.id);
        for (const pr of linked) await base44.entities.ProdutoEstrutural.delete(pr.id);
        const updated = await base44.entities.Projetista.list();
        setProjetistas(updated);
        if (selectedId === p.id) setSelectedId(updated[0]?.id || null);
        reloadProdutos();
        setConfirmDialog({ open: false, onConfirm: null, description: "" });
      },
    });
  }

  async function toggleProjetistaStatus(p) {
    await base44.entities.Projetista.update(p.id, { ativo: !p.ativo });
    reloadProjetistas();
  }

  // ── Produto CRUD ───────────────────────────────────────────────────────────
  async function saveProduto(form) {
    if (produtoModal.data) {
      await base44.entities.ProdutoEstrutural.update(produtoModal.data.id, form);
    } else {
      await base44.entities.ProdutoEstrutural.create({ ...form, projetista_id: selectedId, status: "Ativo" });
    }
    reloadProdutos();
  }

  function confirmDeleteProduto(prod) {
    setConfirmDialog({
      open: true,
      description: `Tem certeza que deseja excluir o produto "${prod.nome}"?`,
      onConfirm: async () => {
        await base44.entities.ProdutoEstrutural.delete(prod.id);
        reloadProdutos();
        setConfirmDialog({ open: false, onConfirm: null, description: "" });
      },
    });
  }

  async function toggleProdutoStatus(prod) {
    const next = PRODUTO_STATUS_CYCLE[prod.status] || "Ativo";
    await base44.entities.ProdutoEstrutural.update(prod.id, { status: next });
    reloadProdutos();
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const selectedProjetista = projetistas.find((p) => p.id === selectedId);
  const selectedProdutos = produtos.filter((pr) => pr.projetista_id === selectedId);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-[3px] border-[#E5E5E8] border-t-[#3B82F6] rounded-full animate-spin" />
          <span className="text-xs text-[#6B6B72]">Carregando dados...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 p-6 gap-6 overflow-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="text-xl font-semibold text-[#0F0F0F]">Projetistas e Produtos</h1>
        <p className="text-sm text-[#6B6B72] mt-0.5">Gerencie os projetistas homologados e os produtos estruturais vinculados a cada um.</p>
      </motion.div>

      {/* Main layout */}
      <div className="flex gap-6 items-start">
        <ProjetistasList
          projetistas={projetistas}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onNew={() => setProjetistaModal({ open: true, data: null })}
          onEdit={(p) => setProjetistaModal({ open: true, data: p })}
          onDelete={confirmDeleteProjetista}
          onToggleStatus={toggleProjetistaStatus}
        />

        {selectedProjetista ? (
          <ProjetistaDetail
            projetista={selectedProjetista}
            produtos={selectedProdutos}
            onEdit={(p) => setProjetistaModal({ open: true, data: p })}
            onDelete={confirmDeleteProjetista}
            onToggleStatus={toggleProjetistaStatus}
            onNewProduto={() => setProdutoModal({ open: true, data: null })}
            onEditProduto={(prod) => setProdutoModal({ open: true, data: prod })}
            onDeleteProduto={confirmDeleteProduto}
            onToggleProdutoStatus={toggleProdutoStatus}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center py-20 text-center">
            <p className="text-sm text-[#6B6B72]">Selecione um projetista para ver os detalhes.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <ProjetistaModal
        open={projetistaModal.open}
        onClose={() => setProjetistaModal({ open: false, data: null })}
        onSave={saveProjetista}
        initial={projetistaModal.data}
      />
      <ProdutoModal
        open={produtoModal.open}
        onClose={() => setProdutoModal({ open: false, data: null })}
        onSave={saveProduto}
        initial={produtoModal.data}
      />
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, onConfirm: null, description: "" })}
        onConfirm={confirmDialog.onConfirm}
        description={confirmDialog.description}
      />
    </div>
  );
}