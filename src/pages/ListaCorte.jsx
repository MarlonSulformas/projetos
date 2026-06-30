import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Upload, FileText, Loader2, ChevronDown, ChevronUp, Package, Bot, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// Converte TODAS as páginas de um PDF em base64 (para enviar ao Gemini)
async function pdfToImagens(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const imagens = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    await page.render({ canvasContext: ctx, viewport }).promise;
    imagens.push({ base64: canvas.toDataURL("image/jpeg", 0.8), pagina: i });
  }
  return imagens;
}

// ── Cores ──────────────────────────────────────────────────────────────────────
const COR_TIPO = {
  compensado: "#3B82F6",
  sarrafo_vertical: "#F59E0B",
  sarrafo_acabamento: "#10B981",
};

// ── Dropzone ───────────────────────────────────────────────────────────────────
function Dropzone({ onFile }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f?.type === "application/pdf") onFile(f); }}
      onClick={() => inputRef.current?.click()}
      className={`flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-2xl p-12 cursor-pointer transition-all ${
        dragging ? "border-[#3B82F6] bg-[#EFF6FF]" : "border-[#E5E5E8] bg-[#FAFAFA] hover:border-[#93C5FD] hover:bg-[#F0F7FF]"
      }`}
    >
      <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      <div className="w-16 h-16 rounded-2xl bg-[#EFF6FF] flex items-center justify-center">
        <Upload className="w-7 h-7 text-[#3B82F6]" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-[#1F1F24]">Arraste o PDF do projeto ou clique para selecionar</p>
        <p className="text-xs text-[#9CA3AF] mt-1">O Gemini vai analisar cada página e gerar a lista de corte</p>
      </div>
    </div>
  );
}

// ── Tabela de resultados por elemento ─────────────────────────────────────────
function TabelaElemento({ elemento, index }) {
  const [open, setOpen] = useState(index < 3);

  return (
    <div className="bg-white border border-[#E5E5E8] rounded-2xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 bg-[#FAFAFA] hover:bg-[#F1F1F4] transition-colors"
      >
        <div className="w-8 h-8 rounded-xl bg-[#1D4ED8] flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-white">{index + 1}</span>
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-[#0F0F0F]">{elemento.nome}</p>
          {elemento.aviso ? (
            <p className="text-[10px] text-[#F59E0B] font-medium">{elemento.aviso}</p>
          ) : (
            <p className="text-[10px] text-[#9CA3AF]">
              {elemento.dimensoes} · {elemento.linhas?.length || 0} itens de corte
            </p>
          )}
        </div>
        <span className="text-xs text-[#9CA3AF] font-mono mr-2">Pág. {elemento.pagina}</span>
        {open ? <ChevronUp className="w-4 h-4 text-[#9CA3AF]" /> : <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />}
      </button>

      {open && elemento.aviso && (
        <div className="px-5 py-4 border-t border-[#FEF3C7] bg-[#FFFBEB] flex gap-2">
          <AlertCircle className="w-4 h-4 text-[#F59E0B] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-[#B45309]">{elemento.aviso}</p>
            <p className="text-[10px] text-[#D97706] mt-1">Adicione mais exemplos no Treinamento da IA para melhorar a precisão.</p>
          </div>
        </div>
      )}

      {open && !elemento.aviso && elemento.linhas?.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-[#F1F1F4] bg-[#F8F9FB]">
                <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-[#6B6B72] uppercase tracking-wider w-8">#</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-[#6B6B72] uppercase tracking-wider">Componente</th>
                <th className="text-center px-3 py-2.5 text-[11px] font-semibold text-[#6B6B72] uppercase tracking-wider w-20">Qtd</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-[#6B6B72] uppercase tracking-wider">Dimensões de Corte</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-[#6B6B72] uppercase tracking-wider">Obs.</th>
              </tr>
            </thead>
            <tbody>
              {elemento.linhas.map((linha, i) => (
                <tr key={i} className={`border-t border-[#F1F1F4] ${i % 2 === 0 ? "bg-white" : "bg-[#FAFAFA]"}`}>
                  <td className="px-5 py-3 text-[11px] text-[#9CA3AF] font-mono">{i + 1}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: linha.cor || "#6B7280" }} />
                      <span className="text-xs font-semibold text-[#1F1F24]">{linha.componente}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="text-sm font-black text-[#374151]">{linha.quantidade}×</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="font-mono text-xs font-semibold text-[#1F1F24] bg-[#F1F5F9] px-2.5 py-1 rounded-lg">
                      {linha.dimensoes}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-[11px] text-[#6B6B72] italic">{linha.obs || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Seletor de Produto ─────────────────────────────────────────────────────────
function ProdutoSelector({ produtos, projetistas, selectedProduto, onSelect, agente }) {
  const [projetistaId, setProjetistaId] = useState("");
  const produtosFiltrados = projetistaId ? produtos.filter(p => p.projetista_id === projetistaId) : produtos;
  const statusInfo = {
    iniciando:      { label: "Sem treinamento", color: "#9CA3AF" },
    em_treinamento: { label: "Em treinamento",  color: "#F59E0B" },
    treinado:       { label: "Pronto ✓",        color: "#22C55E" },
  };
  const st = statusInfo[agente?.status_treinamento || "iniciando"];

  return (
    <div className="bg-white border border-[#E5E5E8] rounded-2xl shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <Bot className="w-4 h-4 text-[#8B5CF6]" />
        <span className="text-xs font-semibold text-[#0F0F0F]">Agente por Produto</span>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-semibold text-[#6B6B72]">Projetista</label>
        <select value={projetistaId} onChange={e => setProjetistaId(e.target.value)}
          className="border border-[#E5E5E8] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#8B5CF6] bg-white">
          <option value="">Todos</option>
          {projetistas.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-semibold text-[#6B6B72]">Produto</label>
        <select value={selectedProduto?.id || ""} onChange={e => { const p = produtosFiltrados.find(x => x.id === e.target.value); if (p) onSelect(p); }}
          className="border border-[#E5E5E8] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#8B5CF6] bg-white">
          <option value="">Selecionar...</option>
          {produtosFiltrados.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
      </div>
      {selectedProduto && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-[#6B6B72]">Status do agente:</span>
          <span className="text-[10px] font-semibold" style={{ color: st.color }}>{st.label}</span>
        </div>
      )}
      {selectedProduto && agente?.status_treinamento !== "treinado" && (
        <Link to="/treinamento-ia" className="flex items-center justify-center gap-1.5 text-xs font-medium text-[#8B5CF6] hover:underline">
          <Bot className="w-3 h-3" />
          Treinar agente primeiro
        </Link>
      )}
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function ListaCorte() {
  const [produtos, setProdutos] = useState([]);
  const [projetistas, setProjetistas] = useState([]);
  const [selectedProduto, setSelectedProduto] = useState(null);
  const [agente, setAgente] = useState(null);
  const [processando, setProcessando] = useState(false);
  const [progresso, setProgresso] = useState({ atual: 0, total: 0, msg: "" });
  const [elementos, setElementos] = useState([]);
  const [erro, setErro] = useState(null);
  const [pdfNome, setPdfNome] = useState(null);

  useEffect(() => {
    base44.entities.ProdutoEstrutural.list().then(setProdutos).catch(console.warn);
    base44.entities.Projetista.list().then(setProjetistas).catch(console.warn);
  }, []);

  // Carregar agente ao selecionar produto
  useEffect(() => {
    if (!selectedProduto) { setAgente(null); return; }
    base44.entities.AgenteIA.filter({ produto_id: selectedProduto.id }).then(res => {
      setAgente(res[0] || null);
    }).catch(console.warn);
  }, [selectedProduto]);

  const processarPDF = useCallback(async (file) => {
    if (!agente) {
      setErro("Selecione um produto com agente treinado antes de processar o PDF.");
      return;
    }

    setProcessando(true);
    setErro(null);
    setElementos([]);
    setPdfNome(file.name);

    try {
      // Carregar histórico do agente treinado
      const historico = JSON.parse(agente.historico_conversa || "[]");
      const resumoTreinamento = historico
        .slice(-20)
        .map(m => `${m.role === "user" ? "Engenheiro" : "IA"}: ${m.content}`)
        .join("\n");

      setProgresso({ atual: 0, total: 0, msg: "Convertendo PDF em imagens..." });
      const imagens = await pdfToImagens(file);

      setProgresso({ atual: 0, total: imagens.length, msg: `Analisando ${imagens.length} páginas com IA...` });

      const resultados = [];

      for (let i = 0; i < imagens.length; i++) {
        const img = imagens[i];
        setProgresso({ atual: i + 1, total: imagens.length, msg: `Processando página ${i + 1} de ${imagens.length}...` });

        const prompt = `Você é um engenheiro especializado em pré-moldados. Analise esta prancha técnica estrutural.

CONTEXTO DE TREINAMENTO (como este produto foi aprendido anteriormente):
${resumoTreinamento}

TAREFA: Baseado no aprendizado acima, extraia da imagem desta prancha:
1. Nome/ID do elemento (ex: P1, Pilar-01, etc.)
2. Dimensão principal X (altura em cm)
3. Dimensão principal Y (largura em cm)
4. Lista de corte de madeira: para cada peça informe componente, quantidade e dimensões

Responda SOMENTE em JSON válido neste formato exato:
{
  "nome": "P1",
  "x_cm": 324,
  "y_cm": 19,
  "linhas": [
    {"componente": "Compensado", "quantidade": 1, "dimensoes": "324 x 19 cm", "obs": ""},
    {"componente": "Sarrafo Vertical", "quantidade": 2, "dimensoes": "319 x 4 cm", "obs": "emenda 200+119cm"}
  ]
}

Se não conseguir extrair as dimensões, responda: {"erro": "descrição do problema"}`;

        try {
          const response = await base44.integrations.Core.InvokeLLM({
            prompt,
            model: "gemini_3_flash",
            file_urls: [img.base64],
            response_json_schema: {
              type: "object",
              properties: {
                nome: { type: "string" },
                x_cm: { type: "number" },
                y_cm: { type: "number" },
                erro: { type: "string" },
                linhas: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      componente: { type: "string" },
                      quantidade: { type: "number" },
                      dimensoes: { type: "string" },
                      obs: { type: "string" },
                    }
                  }
                }
              }
            }
          });

          if (response?.erro) {
            resultados.push({ nome: `Pág. ${img.pagina}`, pagina: img.pagina, aviso: response.erro, linhas: [] });
          } else if (response?.x_cm && response?.linhas) {
            resultados.push({
              nome: response.nome || `Elemento Pág. ${img.pagina}`,
              pagina: img.pagina,
              dimensoes: `[X]=${response.x_cm}cm · [Y]=${response.y_cm}cm`,
              linhas: response.linhas.map(l => ({
                ...l,
                cor: COR_TIPO[l.componente?.toLowerCase().replace(" ", "_")] || "#6B7280",
              })),
            });
          } else {
            resultados.push({ nome: `Pág. ${img.pagina}`, pagina: img.pagina, aviso: "Não foi possível extrair dimensões desta página.", linhas: [] });
          }
        } catch (pageErr) {
          resultados.push({ nome: `Pág. ${img.pagina}`, pagina: img.pagina, aviso: `Erro: ${pageErr.message}`, linhas: [] });
        }
      }

      setElementos(resultados);
      setProgresso({ atual: imagens.length, total: imagens.length, msg: "Concluído!" });
    } catch (e) {
      setErro(`Erro ao processar: ${e.message}`);
    }

    setProcessando(false);
  }, [agente]);

  const totalItens = elementos.reduce((s, e) => s + (e.linhas?.length || 0), 0);

  return (
    <div className="flex flex-col" style={{ height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 pt-5 pb-3 flex-shrink-0 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg bg-[#22C55E] flex items-center justify-center flex-shrink-0">
            <span className="text-[11px] font-bold text-white">3</span>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-semibold text-[#0F0F0F]">Lista de Corte</h1>
            </div>
            <p className="text-xs text-[#6B6B72] mt-0.5">
              Selecione o produto treinado, faça upload do PDF e o Gemini gera a lista automaticamente.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/treinamento-ia">
            <Button variant="outline" className="h-9 rounded-xl text-sm font-medium gap-2 px-4">
              <Bot className="w-4 h-4" />
              Treinar IA
            </Button>
          </Link>
          <Link to="/treinamento-painel">
            <Button variant="outline" className="h-9 rounded-xl text-sm font-medium gap-2 px-4">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6 flex flex-col gap-4">

        {/* Seletor de produto */}
        <ProdutoSelector
          produtos={produtos}
          projetistas={projetistas}
          selectedProduto={selectedProduto}
          onSelect={p => { setSelectedProduto(p); setElementos([]); setErro(null); setPdfNome(null); }}
          agente={agente}
        />

        {/* Upload — só aparece se produto selecionado */}
        {selectedProduto && agente && !processando && elementos.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            {agente.status_treinamento !== "treinado" && (
              <div className="flex items-center gap-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-4 mb-2">
                <AlertCircle className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
                <p className="text-xs text-[#92400E]">
                  O agente ainda não está totalmente treinado. Os resultados podem ser imprecisos. <Link to="/treinamento-ia" className="font-semibold underline">Adicione mais exemplos.</Link>
                </p>
              </div>
            )}
            <Dropzone onFile={processarPDF} />
          </motion.div>
        )}

        {!selectedProduto && (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F1F1F4] flex items-center justify-center">
              <Bot className="w-6 h-6 text-[#D1D5DB]" />
            </div>
            <p className="text-sm font-semibold text-[#6B7280]">Selecione um produto acima para continuar</p>
          </div>
        )}

        {/* Progresso */}
        {processando && (
          <div className="bg-white border border-[#E5E5E8] rounded-2xl shadow-sm p-6 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#EDE9FE] to-[#DBEAFE] flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-[#8B5CF6] animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-[#1F1F24]">{progresso.msg}</p>
              {progresso.total > 0 && (
                <p className="text-xs text-[#9CA3AF] mt-1">{progresso.atual} / {progresso.total} páginas</p>
              )}
            </div>
            {progresso.total > 0 && (
              <div className="w-full max-w-sm h-2 bg-[#F1F1F4] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-full transition-all duration-300"
                  style={{ width: `${(progresso.atual / progresso.total) * 100}%` }}
                />
              </div>
            )}
            <p className="text-[10px] text-[#9CA3AF]">O Gemini está analisando cada prancha com base no treinamento salvo...</p>
          </div>
        )}

        {/* Erro */}
        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-sm font-semibold text-red-700">Erro no processamento</p>
            <p className="text-xs text-red-500 mt-1">{erro}</p>
            <button onClick={() => { setErro(null); setElementos([]); setPdfNome(null); }}
              className="mt-3 text-xs font-medium text-red-600 hover:text-red-800 underline">
              Tentar novamente
            </button>
          </div>
        )}

        {/* Resultados */}
        {elementos.length > 0 && !processando && (
          <>
            <div className="flex items-center gap-4 bg-white border border-[#E5E5E8] rounded-2xl shadow-sm p-4">
              <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-[#22C55E]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#0F0F0F]">
                  Lista gerada — <span className="text-[#22C55E]">{pdfNome}</span>
                </p>
                <p className="text-xs text-[#6B6B72] mt-0.5">
                  {elementos.length} elementos · {totalItens} itens de corte · Produto: {selectedProduto?.nome}
                </p>
              </div>
              <button
                onClick={() => { setElementos([]); setPdfNome(null); setErro(null); }}
                className="h-8 px-3 rounded-lg text-xs font-medium border border-[#E5E5E8] text-[#6B6B72] hover:bg-[#F1F1F4] transition-colors"
              >
                Novo arquivo
              </button>
            </div>
            {elementos.map((el, i) => (
              <TabelaElemento key={i} elemento={el} index={i} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}