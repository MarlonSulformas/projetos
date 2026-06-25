import React, { useState } from "react";
import ProjetistasList from "@/components/projetistas/ProjetistasList";
import ProjetistaDetail from "@/components/projetistas/ProjetistaDetail";

const MOCK_PROJETISTAS = [
  {
    id: 1,
    nome: "Estruturas Apex",
    especialidade: "Vigas e Lajes",
    razaoSocial: "Estruturas Apex Engenharia Ltda.",
    cnpj: "12.345.678/0001-90",
    email: "contato@estruturasapex.com.br",
    produtos: [
      { id: 1, nome: "Vigas Pré-Moldadas", subtitulo: "Layout Padrão V1", status: "Ativo" },
      { id: 2, nome: "Pilares Industriais", subtitulo: "Modelo Técnico P3", status: "Em revisão" },
    ],
  },
  {
    id: 2,
    nome: "Engenharia Delta",
    especialidade: "Pilares e Fundações",
    razaoSocial: "Delta Soluções Estruturais S.A.",
    cnpj: "98.765.432/0001-11",
    email: "projetos@engdelta.com.br",
    produtos: [
      { id: 3, nome: "Fundações Profundas", subtitulo: "Layout Industrial F2", status: "Ativo" },
    ],
  },
  {
    id: 3,
    nome: "Concretar Estrutural",
    especialidade: "Painéis e Fachadas",
    razaoSocial: "Concretar Engenharia Estrutural ME",
    cnpj: "45.678.901/0001-33",
    email: "engenharia@concretar.com.br",
    produtos: [],
  },
  {
    id: 4,
    nome: "Prémold Tech",
    especialidade: "Sistemas Pré-Moldados",
    razaoSocial: "Prémold Tech Sistemas Ltda.",
    cnpj: "67.890.123/0001-55",
    email: "suporte@premoldtech.com.br",
    produtos: [
      { id: 4, nome: "Painéis de Fachada", subtitulo: "Módulo Externo PF-7", status: "Ativo" },
      { id: 5, nome: "Escadas Pré-Moldadas", subtitulo: "Série Residencial ES3", status: "Ativo" },
    ],
  },
];

export default function Projetistas() {
  const [selectedId, setSelectedId] = useState(1);
  const selected = MOCK_PROJETISTAS.find((p) => p.id === selectedId);

  return (
    <div className="max-w-[1600px] mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-[28px] font-medium text-[#0F0F0F] tracking-tight leading-tight">
          Projetistas e Produtos
        </h1>
        <p className="text-sm text-[#6B6B72] mt-1">
          Gerencie os projetistas homologados e os produtos estruturais vinculados a cada um.
        </p>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-5 items-start">
        <ProjetistasList
          projetistas={MOCK_PROJETISTAS}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
        {selected && <ProjetistaDetail projetista={selected} />}
      </div>
    </div>
  );
}