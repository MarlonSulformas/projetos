import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { db } from "@/lib/supabaseClient";
import ProjetistasList from "@/components/projetistas/ProjetistasList";
import ProjetistaDetail from "@/components/projetistas/ProjetistaDetail";
import ProjetistaModal from "@/components/projetistas/ProjetistaModal";
import ProdutoModal from "@/components/projetistas/ProdutoModal";
import ConfirmDialog from "@/components/projetistas/ConfirmDialog";

const PRODUTO_STATUS_CYCLE = { "Ativo": "Em revisão", "Em revisão": "Inativo", "Inativo": "Ativo" };

// Map Supabase schema → internal field names used by existing UI components
function mapProjetista(p) {
  return {
    id: p.id,
    nome: p.nome_razao_social,
    razao_social: p.nome_razao_social,
    cnpj: p.cnpj,
    email: p.email_contato,
    especialidade: p.especialidade,
    ativo: p.status === "Ativo",
    status: p.status,
    created_at: p.created_at,
  };
}

function mapProduto(p) {
  return {
    id: p.id,
    projetista_id: p.id_projetista,
    nome: p.nome_produto,
    descricao: p.descricao_modelo,
    status: p.status,
    created_at: p.created_at,
  };
}

const SEED_PROJETISTAS = [
  { nome_razao_social: "Estruturas Apex Engenharia Ltda.", cnpj: "12.345.678/0001-90", email_contato: "contato@estruturasapex.com.br", especialidade: "Vigas e Lajes", status: "Ativo" },
  { nome_razao_social: "Engenharia Delta S.A.", cnpj: "98.765.432/0001-11", email_contato: "contato@deltaeng.com.br", especialidade: "Pilares e Fundações", status: "Ativo" },
  { nome_razao_social: "Concretar Estrutural Eireli", cnpj: "11.222.333/0001-44", email_contato: "engenharia@concretar.com.br", especialidade: "Painéis e Fachadas", status: "Ativo" },
  { nome_razao_social: "Prémold Tech Sistemas Ltda.", cnpj: "67.890.123/0001-55", email_contato: "suporte@premoldtech.com.br", especialidade: "Sistemas Pré-Moldados", status: "Ativo" },
];

export default function Projetistas() {
  const [projetistas, setProjetistas] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [projetistaModal, setProjetistaModal] = useState({ open: false, data: null });
  const [produtoModal, setProdutoModal] = useState({ open: false, data: null });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, onConfirm: null, description: "" });

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      let raw = await db.listProjetistas();
      if (!raw || raw.length === 0) {
        for (const p of SEED_PROJETISTAS) await db.createProjetista(p);
        raw = await db.listProjetistas();
      }
      const ps = (raw || []).map(mapProjetista);
      setProjetistas(ps);
      if (ps.length > 0) setSelectedId(ps[0].id);

      let rawProds = await db.listProdutos();
      if (!rawProds || rawProds.length === 0) {
        const seeds = [
          { id_projetista: ps[0]?.id, nome_produto: "Vigas Pré-Moldadas", descricao_modelo: "Layout Padrão V1", status: "Ativo" },
          { id_projetista: ps[0]?.id, nome_produto: "Pilares Industriais", descricao_modelo: "Modelo Técnico P3", status: "Em revisão" },
          { id_projetista: ps[1]?.id, nome_produto: "Fundação Profunda", descricao_modelo: "Sistema FP-10", status: "Ativo" },
          { id_projetista: ps[2]?.id, nome_produto: "Painéis de Fachada", descricao_modelo: "Módulo Externo PF-7", status: "Ativo" },
          { id_projetista: ps[3]?.id, nome_produto: "Lajes Nervuradas", descricao_modelo: "Série Industrial LN-5", status: "Ativo" },
        ].filter(s => s.id_projetista);
        for (const s of seeds) await db.createProduto(s);
        rawProds = await db.listProdutos();
      }
      setProdutos((rawProds || []).map(mapProduto));
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  async function reloadProjetistas() {
    const raw = await db.listProjetistas();
    setProjetistas((raw || []).map(mapProjetista));
  }
  async function reloadProdutos() {
    const raw = await db.listProdutos();
    setProdutos((raw || []).map(mapProduto));
  }

  async function saveProjetista(form) {
    const payload = {
      nome_razao_social: form.razao_social || form.nome,
      cnpj: form.cnpj,
      email_contato: form.email,
      especialidade: form.especialidade,
      status: form.ativo !== false ? "Ativo" : "Inativo",
    };
    if (projetistaModal.data) {
      await db.updateProjetista(projetistaModal.data.id, payload);
    } else {
      const created = await db.createProjetista(payload);
      if (created?.id) setSelectedId(created.id);
    }
    reloadProjetistas();
  }

  function confirmDeleteProjetista(p) {
    setConfirmDialog({
      open: true,
      description: `Tem certeza que deseja excluir "${p.nome}"? Os produtos vinculados serão removidos.`,
      onConfirm: async () => {
        await db.deleteProjetista(p.id); // CASCADE deletes produtos + gabaritos
        const updated = await db.listProjetistas();
        const ps = (updated || []).map(mapProjetista);
        setProjetistas(ps);
        if (selectedId === p.id) setSelectedId(ps[0]?.id || null);
        reloadProdutos();
        setConfirmDialog({ open: false, onConfirm: null, description: "" });
      },
    });
  }

  async function toggleProjetistaStatus(p) {
    await db.updateProjetista(p.id, { status: p.ativo ? "Inativo" : "Ativo" });
    reloadProjetistas();
  }

  async function saveProduto(form) {
    const payload = {
      id_projetista: selectedId,
      nome_produto: form.nome,
      descricao_modelo: form.descricao,
      status: form.status || "Ativo",
    };
    if (produtoModal.data) {
      await db.updateProduto(produtoModal.data.id, payload);
    } else {
      await db.createProduto(payload);
    }
    reloadProdutos();
  }

  function confirmDeleteProduto(prod) {
    setConfirmDialog({
      open: true,
      description: `Tem certeza que deseja excluir o produto "${prod.nome}"?`,
      onConfirm: async () => {
        await db.deleteProduto(prod.id);
        reloadProdutos();
        setConfirmDialog({ open: false, onConfirm: null, description: "" });
      },
    });
  }

  async function toggleProdutoStatus(prod) {
    const next = PRODUTO_STATUS_CYCLE[prod.status] || "Ativo";
    await db.updateProduto(prod.id, { status: next });
    reloadProdutos();
  }

  const selectedProjetista = projetistas.find((p) => p.id === selectedId);
  const selectedProdutos = produtos.filter((pr) => pr.projetista_id === selectedId);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-[3px] border-[#E5E5E8] border-t-[#3B82F6] rounded-full animate-spin" />
          <span className="text-xs text-[#6B6B72]">Carregando dados do Supabase...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <p className="text-sm font-semibold text-red-600 mb-2">Erro ao conectar ao Supabase</p>
          <p className="text-xs text-[#6B6B72] mb-4">{error}</p>
          <p className="text-xs text-[#9CA3AF]">Verifique se as tabelas foram criadas no Supabase SQL Editor e se as políticas RLS permitem acesso.</p>
          <button onClick={loadAll} className="mt-4 px-4 py-2 bg-[#3B82F6] text-white text-xs rounded-lg hover:bg-[#2563EB] transition-colors">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 p-6 gap-6 overflow-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="text-xl font-semibold text-[#0F0F0F]">Projetistas e Produtos</h1>
        <p className="text-sm text-[#6B6B72] mt-0.5">Gerencie os projetistas homologados e os produtos estruturais vinculados a cada um.</p>
      </motion.div>

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