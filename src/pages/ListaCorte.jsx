import React, { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Upload, FileText, Loader2, ChevronDown, ChevronUp, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as pdfjsLib from "pdfjs-dist";
import { base44 } from "@/api/base44Client";
import { gerarPlanoCorte } from "@/lib/calculoCorte";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Renderiza uma página do PDF em um canvas offscreen e extrai o valor médio de texto/pixel
 * numa região normalizada (x, y, width, height em 0-1).
 * Aqui usamos a camada de texto do pdfjs para extrair strings da região.
 */
async function extrairTextoRegiao(page, rect) {
  // Guard: se rect ou qualquer coordenada estiver ausente, retorna string vazia
  if (
    !rect ||
    typeof rect.x === "undefined" || rect.x === null ||
    typeof rect.y === "undefined" || rect.y === null ||
    typeof rect.width === "undefined" || rect.width === null || rect.width <= 0 ||
    typeof rect.height === "undefined" || rect.height === null || rect.height <= 0
  ) {
    console.warn("extrairTextoRegiao: coordenadas inválidas ou ausentes", rect);
    return "";
  }

  const viewport = page.getViewport({ scale: 1 });
  const { x, y, width, height } = rect;
  // Converter normalizado → unidades do PDF
  const x1 = x * viewport.width;
  const y1 = y * viewport.height;
  const x2 = (x + width) * viewport.width;
  const y2 = (y + height) * viewport.height;

  const textContent = await page.getTextContent();
  const tokens = [];
  for (const item of textContent.items) {
    const tx = item.transform[4];
    const ty = item.transform[5];
    // pdfjs usa y crescente de baixo pra cima — inverter
    const tyFlipped = viewport.height - ty;
    if (tx >= x1 && tx <= x2 && tyFlipped >= y1 && tyFlipped <= y2) {
      tokens.push(item.str.trim());
    }
  }
  return tokens.join(" ").trim();
}

/**
 * Tenta parsear um número de uma string de texto capturada.
 * Aceita formatos: "324", "324.5", "3245" (div por 10 se > 1000), "324x19", "32x19" etc.
 */
function parseNumero(str) {
  const clean = str.replace(/[^\d.,x×X\/]/g, "").trim();
  // se tiver separador dimensional (ex: 324x19), pega apenas o primeiro
  const partes = clean.split(/[xX×\/]/);
  const val = parseFloat(partes[0].replace(",", "."));
  if (isNaN(val)) return null;
  // heurística: valores > 9999 provavelmente estão em mm → converter para cm
  return val > 9999 ? val / 100 : val > 999 ? val / 10 : val;
}

// Cores por tipo de componente
const COR_TIPO = {
  compensado: "#3B82F6",
  sarrafo_vertical: "#F59E0B",
  sarrafo_acabamento: "#10B981",
};

// ── Dropzone ───────────────────────────────────────────────────────────────────
function Dropzone({ onFile }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type === "application/pdf") onFile(file);
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
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
        <p className="text-xs text-[#9CA3AF] mt-1">Caderno completo com todas as páginas de pilares</p>
      </div>
    </div>
  );
}

// ── Tabela de resultados por pilar ─────────────────────────────────────────────
function TabelaPilar({ pilar, index }) {
  const [open, setOpen] = useState(index === 0);

  const totalPecas = pilar.linhas.reduce((s, l) => s + l.quantidade, 0);

  return (
    <div className="bg-white border border-[#E5E5E8] rounded-2xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 bg-[#FAFAFA] hover:bg-[#F1F1F4] transition-colors"
      >
        <div className="w-8 h-8 rounded-xl bg-[#1D4ED8] flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-white">{String.fromCharCode(80 + index)}</span>
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-[#0F0F0F]">{pilar.nome}</p>
          {pilar.aviso ? (
            <p className="text-[10px] text-[#F59E0B] font-medium">{pilar.aviso}</p>
          ) : (
            <p className="text-[10px] text-[#9CA3AF]">
              [X]={pilar.x}cm · [Y]={pilar.y}cm · {totalPecas} peças totais
            </p>
          )}
        </div>
        <span className="text-xs text-[#9CA3AF] font-mono mr-2">{pilar.linhas.length} tipos</span>
        {open ? <ChevronUp className="w-4 h-4 text-[#9CA3AF]" /> : <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />}
      </button>

      {open && pilar.aviso && (
        <div className="px-5 py-4 border-t border-[#FEF3C7] bg-[#FFFBEB]">
          <p className="text-xs text-[#B45309]">{pilar.aviso}</p>
          <p className="text-[10px] text-[#D97706] mt-1">Verifique se a área de captura do Passo 1 cobre corretamente a região dimensional desta página.</p>
        </div>
      )}
      {open && !pilar.aviso && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-[#F1F1F4] bg-[#F8F9FB]">
                <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-[#6B6B72] uppercase tracking-wider w-8">#</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-[#6B6B72] uppercase tracking-wider">Componente</th>
                <th className="text-center px-3 py-2.5 text-[11px] font-semibold text-[#6B6B72] uppercase tracking-wider w-20">Qtd</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-[#6B6B72] uppercase tracking-wider">Dimensões de Corte</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-[#6B6B72] uppercase tracking-wider">Observação</th>
              </tr>
            </thead>
            <tbody>
              {pilar.linhas.map((linha, i) => (
                <tr key={i} className={`border-t border-[#F1F1F4] ${i % 2 === 0 ? "bg-white" : "bg-[#FAFAFA]"}`}>
                  <td className="px-5 py-3 text-[11px] text-[#9CA3AF] font-mono">{i + 1}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: linha.cor }} />
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


// ── Página principal ───────────────────────────────────────────────────────────
export default function ListaCorte() {
  const [processando, setProcessando] = useState(false);
  const [progresso, setProgresso] = useState({ atual: 0, total: 0, msg: "" });
  const [pilares, setPilares] = useState([]);
  const [erro, setErro] = useState(null);
  const [pdfNome, setPdfNome] = useState(null);

  const processarPDF = useCallback(async (file) => {
    setProcessando(true);
    setErro(null);
    setPilares([]);
    setPdfNome(file.name);

    try {
      // 1. Carregar templates e gabaritos salvos
      setProgresso({ atual: 0, total: 0, msg: "Carregando templates e gabaritos..." });
      const [templatesRaw, gabaritosRaw] = await Promise.all([
        base44.entities.TemplatePainel.list(),
        base44.functions.invoke("supabase", { action: "select", table: "gabaritos_espaciais" }),
      ]);

      const templates = templatesRaw || [];
      const gabaritosAll = gabaritosRaw.data?.data || [];
      const gabaritos = gabaritosAll.filter(g =>
        g != null &&
        typeof g.largura === "number" && g.largura > 0 && g.largura <= 1 &&
        typeof g.altura === "number" && g.altura > 0 && g.altura <= 1 &&
        typeof g.coordenada_x === "number" &&
        typeof g.coordenada_y === "number"
      );

      // Gabaritos com tag_funcao painel_bruto = captura X e Y
      const gabX = gabaritos.find(g => g.tag_funcao === "painel_bruto" || !g.tag_funcao);
      const gabId = gabaritos.find(g => g.tag_funcao === "id_elemento");

      if (!gabX) {
        setErro("Nenhum gabarito do tipo 'Painel Bruto' encontrado. Configure as áreas de captura no Passo 1.");
        setProcessando(false);
        return;
      }

      if (templates.length === 0) {
        setErro("Nenhum template de painel encontrado. Configure os componentes no Passo 2.");
        setProcessando(false);
        return;
      }

      // Template padrão (primeiro da lista)
      const template = templates[0];
      const componentes = template.componentes_estrutura
        ? JSON.parse(template.componentes_estrutura)
        : [];

      // 2. Carregar PDF
      setProgresso({ atual: 0, total: 0, msg: "Lendo PDF..." });
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;

      setProgresso({ atual: 0, total: totalPages, msg: `Processando ${totalPages} páginas...` });

      const resultados = [];

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        setProgresso({ atual: pageNum, total: totalPages, msg: `Processando página ${pageNum} de ${totalPages}...` });

        const page = await pdf.getPage(pageNum);

        // Extrair texto da região do painel bruto — com guard de coordenadas
        let textoPainel = "";
        try {
          textoPainel = await extrairTextoRegiao(page, {
            x: gabX.coordenada_x,
            y: gabX.coordenada_y,
            width: gabX.largura,
            height: gabX.altura,
          });
        } catch (extractErr) {
          console.warn(`Página ${pageNum}: erro ao extrair texto do painel —`, extractErr.message);
        }

        // Extrair ID do elemento se gabarito disponível
        let nomeElemento = `Pilar P${pageNum}`;
        if (gabId) {
          try {
            const textoId = await extrairTextoRegiao(page, {
              x: gabId.coordenada_x,
              y: gabId.coordenada_y,
              width: gabId.largura,
              height: gabId.altura,
            });
            if (textoId) nomeElemento = textoId;
          } catch (idErr) {
            console.warn(`Página ${pageNum}: erro ao extrair ID do elemento —`, idErr.message);
          }
        }

        // Parsear X e Y do texto capturado
        let X = null, Y = null;
        if (textoPainel) {
          const matchDimensional = textoPainel.match(/(\d[\d.,]*)\s*[xX×]\s*(\d[\d.,]*)/);
          if (matchDimensional) {
            X = parseNumero(matchDimensional[1]);
            Y = parseNumero(matchDimensional[2]);
          } else {
            const nums = textoPainel.match(/\d[\d.,]*/g);
            if (nums && nums.length >= 2) {
              X = parseNumero(nums[0]);
              Y = parseNumero(nums[1]);
            } else if (nums && nums.length === 1) {
              X = parseNumero(nums[0]);
            }
          }
        }

        // Se não extraiu dimensões válidas, registra aviso e pula a página
        if (!X || X < 1) {
          console.warn(`Página ${pageNum} (${nomeElemento}): Aviso — Dimensões não encontradas para o Painel nesta página. Texto capturado: "${textoPainel}"`);
          resultados.push({
            nome: nomeElemento,
            x: null, y: null,
            aviso: "Aviso: Dimensões não encontradas para o Painel nesta página.",
            linhas: [],
            pagina: pageNum,
          });
          continue;
        }
        if (!Y || Y < 1) Y = 19; // fallback para largura padrão

        // 3. Gerar plano de corte com o motor
        const painel = { nome: nomeElemento, componentes };
        const grupos = gerarPlanoCorte(painel, X * 10, Y * 10); // motor espera mm

        // 4. Montar linhas da tabela
        const linhas = [];
        grupos.forEach(grupo => {
          grupo.pecas.forEach(peca => {
            linhas.push({
              componente: grupo.label,
              cor: grupo.cor,
              quantidade: peca.quantidade,
              dimensoes: peca.descricao,
              obs: "",
            });
          });
        });

        if (linhas.length > 0) {
          resultados.push({ nome: nomeElemento, x: X, y: Y, linhas, pagina: pageNum });
        }
      }

      setPilares(resultados);
      setProgresso({ atual: totalPages, total: totalPages, msg: "Concluído!" });
    } catch (e) {
      console.error(e);
      setErro(`Erro ao processar: ${e.message}`);
    }

    setProcessando(false);
  }, []);

  const totalPecas = pilares.reduce((s, p) => s + p.linhas.reduce((ss, l) => ss + l.quantidade, 0), 0);

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
              <h1 className="text-lg font-semibold text-[#0F0F0F]">Lista de Corte do Projeto</h1>
              <span className="text-[11px] font-medium text-[#6B6B72] bg-[#F1F1F4] px-2 py-0.5 rounded-full">Passo 3 de 3</span>
            </div>
            <p className="text-xs text-[#6B6B72] mt-0.5">
              Faça upload do caderno completo. O sistema lê cada página e gera a lista de corte usando os templates configurados.
            </p>
          </div>
        </div>
        <Link to="/treinamento-painel">
          <Button variant="outline" className="h-9 rounded-xl text-sm font-medium gap-2 px-4">
            <ArrowLeft className="w-4 h-4" />
            Passo 2
          </Button>
        </Link>
      </motion.div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6 flex flex-col gap-4">

        {/* Upload */}
        {!processando && pilares.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Dropzone onFile={processarPDF} />
          </motion.div>
        )}

        {/* Progresso */}
        {processando && (
          <div className="bg-white border border-[#E5E5E8] rounded-2xl shadow-sm p-6 flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin" />
            <div className="text-center">
              <p className="text-sm font-semibold text-[#1F1F24]">{progresso.msg}</p>
              {progresso.total > 0 && (
                <p className="text-xs text-[#9CA3AF] mt-1">{progresso.atual} / {progresso.total} páginas</p>
              )}
            </div>
            {progresso.total > 0 && (
              <div className="w-full max-w-sm h-2 bg-[#F1F1F4] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#3B82F6] rounded-full transition-all duration-300"
                  style={{ width: `${(progresso.atual / progresso.total) * 100}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Erro */}
        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-sm font-semibold text-red-700">Erro no processamento</p>
            <p className="text-xs text-red-500 mt-1">{erro}</p>
            <button onClick={() => { setErro(null); setPilares([]); setPdfNome(null); }}
              className="mt-3 text-xs font-medium text-red-600 hover:text-red-800 underline">
              Tentar novamente
            </button>
          </div>
        )}

        {/* Resultados */}
        {pilares.length > 0 && !processando && (
          <>
            {/* Resumo */}
            <div className="flex items-center gap-4 bg-white border border-[#E5E5E8] rounded-2xl shadow-sm p-4">
              <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-[#22C55E]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#0F0F0F]">
                  Lista gerada com sucesso — <span className="text-[#22C55E]">{pdfNome}</span>
                </p>
                <p className="text-xs text-[#6B6B72] mt-0.5">
                  {pilares.length} elementos · {totalPecas} peças totais · {pilares.reduce((s, p) => s + p.linhas.length, 0)} tipos de corte
                </p>
              </div>
              <button
                onClick={() => { setPilares([]); setPdfNome(null); setErro(null); }}
                className="h-8 px-3 rounded-lg text-xs font-medium border border-[#E5E5E8] text-[#6B6B72] hover:bg-[#F1F1F4] transition-colors"
              >
                Novo arquivo
              </button>
            </div>

            {/* Tabelas por pilar */}
            {pilares.map((pilar, i) => (
              <TabelaPilar key={i} pilar={pilar} index={i} />
            ))}
          </>
        )}

        {/* Empty após processamento sem resultados */}
        {!processando && !erro && pilares.length === 0 && pdfNome && (
          <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-6 text-center">
            <p className="text-sm font-semibold text-[#92400E]">Nenhuma dimensão extraída</p>
            <p className="text-xs text-[#B45309] mt-1">
              O sistema não encontrou dados dimensionais nas regiões mapeadas. Verifique as áreas de captura no Passo 1.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}