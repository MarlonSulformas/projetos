import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Upload, Send, Bot, User, Trash2, CheckCircle, BookOpen, FileText, Loader2, ScrollText, X, FolderDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { db } from "@/lib/supabaseClient";
import { salvarHistorico, carregarHistorico } from "@/lib/historicoStorage";
import * as pdfjsLib from "pdfjs-dist";
import KnowledgeSections from "@/components/treinamento/KnowledgeSections";
import ExportarInstrucoesModal from "@/components/treinamento/ExportarInstrucoesModal";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// Converte uma página do PDF em imagem base64
async function pdfPageToBase64(file, pageNum = 1) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  await page.render({ canvasContext: ctx, viewport }).promise;
  return { base64: canvas.toDataURL("image/jpeg", 0.85), totalPages: pdf.numPages };
}

// ── Seletor de Produto ─────────────────────────────────────────────────────────
function ProdutoSelector({ produtos, projetistas, selectedProduto, onSelect, onProjetistaChange }) {
  const [projetistaId, setProjetistaId] = useState("");
  const produtosFiltrados = projetistaId
    ? produtos.filter(p => (p.id_projetista || p.projetista_id) === projetistaId)
    : [];

  function handleProjetistaChange(e) {
    setProjetistaId(e.target.value);
    onSelect(null); // limpa produto ao trocar projetista
    onProjetistaChange(e.target.value);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-semibold text-[#6B6B72] uppercase tracking-wider">Projetista</label>
        <select
          value={projetistaId}
          onChange={handleProjetistaChange}
          className="border border-[#E5E5E8] rounded-xl px-3 py-2 text-sm text-[#1F1F24] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6] bg-white"
        >
          <option value="">Selecionar projetista...</option>
          {projetistas.map(p => (
            <option key={p.id} value={p.id}>{p.nome}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-semibold text-[#6B6B72] uppercase tracking-wider">
          Produto {!projetistaId && <span className="text-[#D1D5DB] normal-case font-normal">— selecione o projetista primeiro</span>}
        </label>
        <select
          value={selectedProduto?.id || ""}
          disabled={!projetistaId}
          onChange={e => {
            const prod = produtosFiltrados.find(p => p.id === e.target.value);
            if (prod) onSelect(prod);
          }}
          className="border border-[#E5E5E8] rounded-xl px-3 py-2 text-sm text-[#1F1F24] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6] bg-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Selecionar produto...</option>
          {produtosFiltrados.map(p => (
            <option key={p.id} value={p.id}>{p.nome}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ── Bolha de Mensagem ──────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? "bg-[#8B5CF6]" : "bg-[#3B82F6]"
      }`}>
        {isUser ? <User className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-white" />}
      </div>
      <div className={`max-w-[80%] flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
        {msg.pdfNome && (
          <div className="flex items-center gap-1.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg px-2.5 py-1.5 text-[10px] text-[#1D4ED8] font-medium">
            <FileText className="w-3 h-3" />
            {msg.pdfNome}
          </div>
        )}
        <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-[#8B5CF6] text-white rounded-tr-sm"
            : "bg-white border border-[#E5E5E8] text-[#1F1F24] rounded-tl-sm shadow-sm"
        }`}>
          {msg.content}
        </div>
        <span className="text-[9px] text-[#9CA3AF]">
          {new Date(msg.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}

// ── Página Principal ───────────────────────────────────────────────────────────
export default function TreinamentoIA() {
  const [produtos, setProdutos] = useState([]);
  const [projetistas, setProjetistas] = useState([]);
  const [selectedProjetistaId, setSelectedProjetistaId] = useState("");
  const [selectedProduto, setSelectedProduto] = useState(null);
  const [agente, setAgente] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [input, setInput] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [loadingAgente, setLoadingAgente] = useState(false);
  const [anexos, setAnexos] = useState([]); // [{ file, nome, fileUrl, totalPages }]
  const [showRegras, setShowRegras] = useState(false);
  const [showExportar, setShowExportar] = useState(false);
  const fileInputRef = useRef(null);
  const MAX_ANEXOS = 5;
  const chatEndRef = useRef(null);

  // Carregar produtos e projetistas do Supabase
  useEffect(() => {
    db.listProdutos().then(data => setProdutos(data || [])).catch(console.warn);
    db.listProjetistas().then(data => setProjetistas(data || [])).catch(console.warn);
  }, []);

  // Scroll automático
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, enviando]);

  // Ao selecionar produto, carregar ou criar agente
  useEffect(() => {
    if (!selectedProduto) return;
    setLoadingAgente(true);
    setMensagens([]);
    setAgente(null);

    base44.entities.AgenteIA.filter({ produto_id: selectedProduto.id, projetista_id: selectedProjetistaId }).then(async (resultados) => {
      let ag = resultados[0];
      if (!ag) {
        // Criar novo agente para este produto
        ag = await base44.entities.AgenteIA.create({
          produto_id: selectedProduto.id,
          projetista_id: selectedProjetistaId,
          nome_produto: selectedProduto.nome,
          historico_conversa: JSON.stringify([]),
          status_treinamento: "iniciando",
          total_exemplos: 0,
        });
        // Mensagem de boas-vindas automática do sistema
        const boasVindas = {
          role: "assistant",
          content: `Olá! Sou o agente de treinamento para o produto **${selectedProduto.nome}**.\n\nPara me treinar, envie um PDF de exemplo e me diga quais são as dimensões corretas (altura X e largura Y do elemento). Vou aprender com cada exemplo que você me fornecer.\n\nQuando você achar que aprendi o suficiente, pode usar a **Lista de Corte** e eu vou gerar as listagens automaticamente com base no que aprendi aqui.`,
          timestamp: Date.now(),
        };
        const historicoInicial = [boasVindas];
        const urlHistorico = await salvarHistorico(historicoInicial);
        await base44.entities.AgenteIA.update(ag.id, {
          historico_conversa: urlHistorico,
        });
        ag.historico_conversa = urlHistorico;
      }
      setAgente(ag);
      const msgs = await carregarHistorico(ag.historico_conversa);
      setMensagens(msgs);
      setLoadingAgente(false);
    }).catch(e => {
      console.warn("Erro ao carregar agente:", e);
      setLoadingAgente(false);
    });
  }, [selectedProduto]);

  async function handleAnexarArquivo(file) {
    if (!file) return;
    if (anexos.length >= MAX_ANEXOS) return;
    try {
      let fileUrl, totalPages = null;

      if (file.type === "application/pdf") {
        const { base64, totalPages: pages } = await pdfPageToBase64(file);
        const res = await fetch(base64);
        const blob = await res.blob();
        const imageFile = new File([blob], file.name.replace(".pdf", ".jpg"), { type: "image/jpeg" });
        const uploaded = await base44.integrations.Core.UploadFile({ file: imageFile });
        fileUrl = uploaded.file_url;
        totalPages = pages;
      } else if (file.type.startsWith("image/")) {
        const uploaded = await base44.integrations.Core.UploadFile({ file });
        fileUrl = uploaded.file_url;
      } else {
        return;
      }

      setAnexos(prev => [...prev, { file, nome: file.name, fileUrl, totalPages }]);
    } catch (e) {
      console.warn("Erro ao processar arquivo:", e);
    }
  }

  // Consolida conhecimento ACUMULANDO, nunca substituindo detalhes anteriores
  async function consolidarConhecimento(historicoAtualizado, baseAtual) {
    // Usa apenas as últimas 10 mensagens para evitar sobrecarga (a base_conhecimento já tem o resto)
    const historicoRecortado = historicoAtualizado.slice(-10);

    // Separa mensagens do engenheiro (fonte primária) das respostas da IA (confirmações)
    const mensagensEngenheiro = historicoRecortado
      .filter(m => m.role === "user")
      .map((m, i) => `[REGRA ${i + 1} — ENGENHEIRO]:\n${m.content}`)
      .join("\n\n---\n\n");

    const mensagensIA = historicoRecortado
      .filter(m => m.role === "assistant")
      .map((m, i) => `[CONFIRMAÇÃO ${i + 1} — IA]:\n${m.content}`)
      .join("\n\n---\n\n");

    // Detecta correções: mensagens do engenheiro que contenham palavras de correção
    const palavrasCorrecao = ["errado", "incorreto", "não é", "correto é", "corrija", "mude", "altere", "na verdade", "não são", "deveria ser"];
    const correcoes = historicoAtualizado
      .filter(m => m.role === "user" && palavrasCorrecao.some(p => m.content.toLowerCase().includes(p)))
      .map(m => `⚠️ CORREÇÃO DETECTADA: "${m.content}"`)
      .join("\n");

    const prompt = `Você é um sistema especializado em extrair e preservar conhecimento técnico de engenharia estrutural para formas de pré-moldados de concreto.

═══════════════════════════════════════════
BASE DE CONHECIMENTO ATUAL (IMUTÁVEL — nunca apague, resuma ou altere — somente adicione ou aplique correções explícitas do engenheiro):
═══════════════════════════════════════════
${baseAtual || "Nenhuma base registrada ainda."}

═══════════════════════════════════════════
NOVAS INSTRUÇÕES DO ENGENHEIRO (FONTE DE VERDADE — transcreva literalmente):
═══════════════════════════════════════════
${mensagensEngenheiro || "Nenhuma mensagem nova do engenheiro."}

═══════════════════════════════════════════
CONFIRMAÇÕES DA IA (use apenas para validar entendimento, não como fonte técnica):
═══════════════════════════════════════════
${mensagensIA || "Nenhuma confirmação."}

${correcoes ? `═══════════════════════════════════════════\nCORREÇÕES EXPLÍCITAS DETECTADAS (aplique imediatamente, descarte o valor anterior):\n═══════════════════════════════════════════\n${correcoes}` : ""}

═══════════════════════════════════════════
TAREFA: Atualize a base de conhecimento técnico seguindo estas regras:
═══════════════════════════════════════════

PRIORIDADES:
1. Correções explícitas do engenheiro SEMPRE substituem valores anteriores
2. Novas instruções do engenheiro são adicionadas literalmente, sem parafrasear
3. A base anterior é preservada integralmente onde não houver correção

ESTRUTURA OBRIGATÓRIA DA BASE (mantenha estas seções sempre que houver dados):
## IDENTIFICAÇÃO DO PRODUTO
## DIMENSÕES PRINCIPAIS (X = altura, Y = largura — valores em cm)
## COMPENSADO (dimensões, quantidade, regras de corte)
## SARRAFOS VERTICAIS (dimensões, quantidade, regras de emenda, folgas)
## SARRAFOS DE ACABAMENTO (dimensões, quantidade, posicionamento)
## INSERTOS E ESPECIAIS (chumbadores, caixas, ancoragens)
## REGRAS DE FOLGA E MONTAGEM (condicionais, exceções, sequência)
## CORREÇÕES APLICADAS (histórico de mudanças para rastreabilidade)

REGRAS CRÍTICAS:
- Copie textualmente qualquer fórmula ou regra condicional do engenheiro (ex: "se X > 300cm, então...")
- Preserve todos os valores numéricos com suas unidades (cm, mm, peças, kg)
- Registre cada correção aplicada na seção "CORREÇÕES APLICADAS" com o valor antigo e o novo
- NUNCA invente valores — se não souber, não escreva

Responda APENAS com a base de conhecimento técnico atualizada e estruturada, sem texto introdutório.`;

    const resposta = await base44.integrations.Core.InvokeLLM({
      prompt,
      model: "claude_sonnet_4_6",
    });

    return typeof resposta === "string" ? resposta : JSON.stringify(resposta);
  }

  async function handleEnviar() {
    if (!input.trim() && anexos.length === 0) return;
    if (!agente) return;

    const nomesAnexos = anexos.map(a => a.nome);
    const msgUsuario = {
      role: "user",
      content: input.trim() || `Analisando ${anexos.length} arquivo(s): ${nomesAnexos.join(", ")}`,
      pdfNome: nomesAnexos.length > 0 ? nomesAnexos.join(", ") : null,
      timestamp: Date.now(),
    };

    const novasMensagens = [...mensagens, msgUsuario];
    setMensagens(novasMensagens);
    setInput("");
    setEnviando(true);
    const anexosAtuais = [...anexos];
    setAnexos([]);

    // Salvar mensagem do usuário imediatamente (antes da resposta da IA)
    try {
      const urlParcial = await salvarHistorico(novasMensagens);
      await base44.entities.AgenteIA.update(agente.id, { historico_conversa: urlParcial });
    } catch (saveErr) {
      console.warn("Aviso: não foi possível salvar mensagem parcial:", saveErr);
    }

    try {
      // Montar contexto: base de conhecimento salva + últimas 5 mensagens do chat
      const baseConhecimento = agente.base_conhecimento || "";
      const historicoRecente = novasMensagens.slice(-6, -1).map(m => ({
        role: m.role === "user" ? "Engenheiro" : "Assistente IA",
        texto: m.content,
      }));

      const promptBase = `Você é um assistente especializado em engenharia estrutural de pré-moldados.

PRODUTO: ${selectedProduto?.nome}

${baseConhecimento ? `BASE DE CONHECIMENTO TÉCNICO CONSOLIDADA (regras aprendidas anteriormente — use sempre):
${baseConhecimento}

` : ""}HISTÓRICO RECENTE DA CONVERSA:
${historicoRecente.map(h => `${h.role}: ${h.texto}`).join("\n")}

NOVA MENSAGEM DO ENGENHEIRO: ${msgUsuario.content}

${anexosAtuais.length > 0 ? "O engenheiro enviou imagem(ns) da prancha técnica para análise. Analise as imagens e extraia as dimensões principais (altura X e largura Y em cm) do elemento estrutural. Apresente sua resposta de forma clara com os valores encontrados e pergunte se estão corretos." : ""}

Responda de forma objetiva e técnica. Se o engenheiro corrigir algum valor, confirme que entendeu e incorpore a correção.`;

      const fileUrls = anexosAtuais.map(a => a.fileUrl).filter(Boolean);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Tempo limite atingido (60s). Tente novamente.")), 60000)
      );

      const response = await Promise.race([
        base44.integrations.Core.InvokeLLM({
          prompt: promptBase,
          model: "gemini_3_flash",
          file_urls: fileUrls.length > 0 ? fileUrls : undefined,
        }),
        timeoutPromise,
      ]);

      const msgIA = {
        role: "assistant",
        content: typeof response === "string" ? response : response?.text || JSON.stringify(response),
        timestamp: Date.now(),
      };

      const historicoAtualizado = [...novasMensagens, msgIA];
      setMensagens(historicoAtualizado);

      const totalExemplos = (agente.total_exemplos || 0) + (anexosAtuais.length > 0 ? 1 : 0);
      const novoStatus = totalExemplos === 0 ? "iniciando" : totalExemplos < 3 ? "em_treinamento" : "treinado";
      const urlHistorico = await salvarHistorico(historicoAtualizado);

      // Salva histórico e status imediatamente (sem bloquear na consolidação)
      await base44.entities.AgenteIA.update(agente.id, {
        historico_conversa: urlHistorico,
        total_exemplos: totalExemplos,
        status_treinamento: novoStatus,
      });

      setAgente(ag => ({ ...ag, total_exemplos: totalExemplos, status_treinamento: novoStatus }));

      // Consolidação com Claude roda em background (não bloqueia a UI)
      const totalRespostasIA = historicoAtualizado.filter(m => m.role === "assistant").length;
      if (totalRespostasIA === 1 || totalRespostasIA % 2 === 0) {
        consolidarConhecimento(historicoAtualizado, agente.base_conhecimento || "")
          .then(async (novaBase) => {
            await base44.entities.AgenteIA.update(agente.id, { base_conhecimento: novaBase });
            setAgente(ag => ({ ...ag, base_conhecimento: novaBase }));
          })
          .catch(e => console.warn("Consolidação em background falhou:", e.message));
      }
    } catch (e) {
      const msgErro = {
        role: "assistant",
        content: `Desculpe, ocorreu um erro ao processar: ${e.message}`,
        timestamp: Date.now(),
      };
      setMensagens(prev => [...prev, msgErro]);
    }

    setEnviando(false);
  }

  async function handleLimparHistorico() {
    if (!agente || !confirm("Apagar o histórico de chat? O conhecimento técnico consolidado será preservado no banco de dados.")) return;

    // Consolidar conhecimento antes de limpar (garante que nada seja perdido)
    let baseAtualizada = agente.base_conhecimento || "";
    if (mensagens.length > 2) {
      try {
        baseAtualizada = await consolidarConhecimento(mensagens, baseAtualizada);
      } catch (e) {
        console.warn("Aviso: não foi possível consolidar conhecimento antes da limpeza:", e);
      }
    }

    const boasVindas = [{
      role: "assistant",
      content: `Histórico de chat apagado. ✅\n\n**O conhecimento técnico foi preservado** — continuo sabendo tudo que aprendi sobre o produto **${selectedProduto?.nome}**.\n\nPode continuar enviando exemplos ou fazer perguntas normalmente.`,
      timestamp: Date.now(),
    }];

    const urlHistorico = await salvarHistorico(boasVindas);
    await base44.entities.AgenteIA.update(agente.id, {
      historico_conversa: urlHistorico,
      base_conhecimento: baseAtualizada,
    });
    setMensagens(boasVindas);
    setAgente(ag => ({ ...ag, base_conhecimento: baseAtualizada }));
  }

  const statusInfo = {
    iniciando:      { label: "Sem exemplos",   color: "#9CA3AF", bg: "#F1F1F4" },
    em_treinamento: { label: "Em treinamento",  color: "#F59E0B", bg: "#FEF3C7" },
    treinado:       { label: "Pronto para uso", color: "#22C55E", bg: "#DCFCE7" },
  };
  const status = statusInfo[agente?.status_treinamento || "iniciando"];

  // Extrai blocos de regras/seções da base_conhecimento para exibição
  function parseBaseConhecimento(base) {
    if (!base) return [];
    const sections = [];
    const lines = base.split("\n");
    let current = null;
    for (const line of lines) {
      if (line.startsWith("## ")) {
        if (current) sections.push(current);
        current = { titulo: line.replace("## ", "").trim(), conteudo: [] };
      } else if (current) {
        current.conteudo.push(line);
      }
    }
    if (current) sections.push(current);
    if (sections.length === 0 && base.trim()) {
      return [{ titulo: "Base de Conhecimento", conteudo: base.split("\n") }];
    }
    return sections;
  }

  // Renderiza uma linha de texto com formatação básica de markdown
  function renderLinha(linha, idx) {
    if (!linha.trim()) return <div key={idx} className="h-2" />;
    // Título ###
    if (linha.startsWith("### ")) {
      return <p key={idx} className="text-[11px] font-bold text-[#1F1F24] uppercase tracking-wider mt-2 mb-1">{linha.replace("### ", "")}</p>;
    }
    // Linha com **negrito**
    const parts = linha.split(/(\*\*[^*]+\*\*)/g);
    const formatted = parts.map((p, i) =>
      p.startsWith("**") && p.endsWith("**")
        ? <strong key={i} className="font-semibold text-[#1F1F24]">{p.slice(2, -2)}</strong>
        : <span key={i}>{p}</span>
    );
    // Bullet
    const isBullet = linha.trim().startsWith("- ") || linha.trim().startsWith("* ");
    if (isBullet) {
      const content = linha.trim().replace(/^[-*]\s/, "");
      const contentParts = content.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
        p.startsWith("**") && p.endsWith("**")
          ? <strong key={i} className="font-semibold text-[#1F1F24]">{p.slice(2, -2)}</strong>
          : <span key={i}>{p}</span>
      );
      return (
        <div key={idx} className="flex gap-2 items-start py-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] mt-1.5 flex-shrink-0" />
          <p className="text-[11px] text-[#374151] leading-relaxed">{contentParts}</p>
        </div>
      );
    }
    return <p key={idx} className="text-[11px] text-[#374151] leading-relaxed py-0.5">{formatted}</p>;
  }

  return (
    <div className="flex flex-col" style={{ height: "100%", overflow: "hidden" }}>

      {/* Modal: Exportar Instruções */}
      {showExportar && (
        <ExportarInstrucoesModal
          mensagens={mensagens}
          baseConhecimento={agente?.base_conhecimento}
          nomeProduto={selectedProduto?.nome}
          onClose={() => setShowExportar(false)}
        />
      )}

      {/* Modal: Base de Conhecimento */}
      <AnimatePresence>
        {showRegras && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
            onClick={() => setShowRegras(false)}
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
              <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-[#8B5CF6] to-[#3B82F6] flex-shrink-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <ScrollText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-white">Base de Conhecimento</p>
                      <p className="text-[11px] text-white/70 mt-0.5">{selectedProduto?.nome}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowRegras(false)} className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors mt-0.5">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {agente?.base_conhecimento && (
                  <div className="flex gap-2 mt-4">
                    <div className="flex items-center gap-1.5 bg-white/20 rounded-lg px-2.5 py-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]" />
                      <span className="text-[10px] text-white font-medium">{parseBaseConhecimento(agente.base_conhecimento).length} seções</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/20 rounded-lg px-2.5 py-1">
                      <CheckCircle className="w-3 h-3 text-white/80" />
                      <span className="text-[10px] text-white font-medium">Atualizado automaticamente</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Conteúdo */}
              <div className="flex-1 overflow-y-auto bg-[#F8F9FB]">
                {!agente?.base_conhecimento ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
                    <div className="w-14 h-14 rounded-2xl bg-[#F1F1F4] flex items-center justify-center">
                      <BookOpen className="w-7 h-7 text-[#D1D5DB]" />
                    </div>
                    <p className="text-sm font-semibold text-[#6B7280]">Nenhuma regra aprendida ainda.</p>
                    <p className="text-xs text-[#9CA3AF] max-w-xs">Converse com o agente enviando exemplos para ele aprender as regras do produto.</p>
                  </div>
                ) : (
                  <KnowledgeSections
                    sections={parseBaseConhecimento(agente.base_conhecimento)}
                    renderLinha={renderLinha}
                  />
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-[#F1F1F4] bg-white flex justify-between items-center flex-shrink-0">
                <p className="text-[10px] text-[#9CA3AF]">Clique em cada seção para expandir</p>
                <button onClick={() => setShowRegras(false)} className="h-8 px-5 rounded-xl text-xs font-semibold bg-[#8B5CF6] text-white hover:bg-[#7C3AED] transition-colors">
                  Fechar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 pt-5 pb-3 flex-shrink-0 flex items-center justify-between border-b border-[#F1F1F4]"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#3B82F6] flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-semibold text-[#0F0F0F]">Treinamento da IA</h1>
              {agente && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ color: status.color, backgroundColor: status.bg }}>
                  {status.label}
                </span>
              )}
            </div>
            <p className="text-xs text-[#6B6B72] mt-0.5">
              Envie PDFs de exemplo e corrija a IA. O histórico é salvo e usado automaticamente na Lista de Corte.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {agente && agente.status_treinamento === "treinado" && (
            <Link to="/lista-corte">
              <Button className="h-9 rounded-xl text-sm font-medium gap-2 px-4 bg-[#22C55E] hover:bg-[#16A34A]">
                <CheckCircle className="w-4 h-4" />
                Usar na Lista de Corte
              </Button>
            </Link>
          )}
          <Link to="/lista-corte">
            <Button variant="outline" className="h-9 rounded-xl text-sm font-medium gap-2 px-4">
              Lista de Corte
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Body */}
      <div className="flex flex-1 min-h-0 gap-0">

        {/* Sidebar esquerda — seletor de produto */}
        <div className="w-72 flex-shrink-0 border-r border-[#F1F1F4] bg-[#FAFAFA] flex flex-col gap-4 p-4 overflow-y-auto">
          <ProdutoSelector
            produtos={produtos}
            projetistas={projetistas}
            selectedProduto={selectedProduto}
            onSelect={setSelectedProduto}
          onProjetistaChange={setSelectedProjetistaId}
          />

          {agente && (
            <div className="bg-white border border-[#E5E5E8] rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#8B5CF6]" />
                <span className="text-xs font-semibold text-[#0F0F0F]">Status do Treinamento</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#6B6B72]">Exemplos enviados</span>
                  <span className="text-xs font-bold text-[#1F1F24]">{agente.total_exemplos || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#6B6B72]">Mensagens no histórico</span>
                  <span className="text-xs font-bold text-[#1F1F24]">{mensagens.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#6B6B72]">Status</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ color: status.color, backgroundColor: status.bg }}>
                    {status.label}
                  </span>
                </div>
              </div>

              {/* Barra de progresso */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[9px] text-[#9CA3AF]">
                  <span>Progresso</span>
                  <span>{Math.min((agente.total_exemplos || 0), 3)}/3 exemplos</span>
                </div>
                <div className="h-1.5 bg-[#F1F1F4] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(((agente.total_exemplos || 0) / 3) * 100, 100)}%`,
                      backgroundColor: status.color,
                    }}
                  />
                </div>
              </div>

              {/* Indicador de base de conhecimento */}
              {agente.base_conhecimento && (
                <div className="flex items-center gap-1.5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg px-2.5 py-1.5">
                  <CheckCircle className="w-3 h-3 text-[#22C55E] flex-shrink-0" />
                  <span className="text-[10px] text-[#15803D] font-medium">Base de conhecimento salva</span>
                </div>
              )}

              <button
                onClick={() => setShowRegras(true)}
                className="flex items-center gap-1.5 text-[10px] text-[#8B5CF6] hover:text-purple-700 mt-1 font-medium"
              >
                <ScrollText className="w-3 h-3" />
                Ver base de conhecimento
              </button>

              <button
                onClick={() => setShowExportar(true)}
                className="flex items-center gap-1.5 text-[10px] text-[#374151] hover:text-[#1F1F24] mt-1 font-medium"
              >
                <FolderDown className="w-3 h-3" />
                Exportar minhas instruções
              </button>

              <button
                onClick={handleLimparHistorico}
                className="flex items-center gap-1.5 text-[10px] text-[#EF4444] hover:text-red-700 mt-1"
              >
                <Trash2 className="w-3 h-3" />
                Limpar histórico de chat
              </button>
            </div>
          )}

          {!selectedProduto && (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-[#F1F1F4] flex items-center justify-center">
                <Bot className="w-5 h-5 text-[#D1D5DB]" />
              </div>
              <p className="text-[10px] text-[#9CA3AF] leading-relaxed">
                Selecione um produto para<br />iniciar o treinamento.
              </p>
            </div>
          )}
        </div>

        {/* Área de chat */}
        <div className="flex-1 min-w-0 flex flex-col bg-[#F8F9FB]">

          {!selectedProduto && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#EDE9FE] to-[#DBEAFE] flex items-center justify-center">
                  <Bot className="w-8 h-8 text-[#8B5CF6]" />
                </div>
                <p className="text-sm font-semibold text-[#374151]">Selecione um produto para começar</p>
                <p className="text-xs text-[#9CA3AF] max-w-xs">
                  Escolha o projetista e produto na barra lateral para carregar o agente de treinamento.
                </p>
              </div>
            </div>
          )}

          {selectedProduto && loadingAgente && (
            <div className="flex-1 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 text-[#8B5CF6] animate-spin" />
              <span className="text-sm text-[#6B6B72]">Carregando agente...</span>
            </div>
          )}

          {selectedProduto && !loadingAgente && (
            <>
              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                {mensagens.map((msg, i) => (
                  <MessageBubble key={i} msg={msg} />
                ))}
                {enviando && (
                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#3B82F6] flex items-center justify-center flex-shrink-0">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="bg-white border border-[#E5E5E8] rounded-2xl rounded-tl-sm px-3.5 py-2.5 shadow-sm flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-[#3B82F6] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-1.5 h-1.5 bg-[#3B82F6] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-1.5 h-1.5 bg-[#3B82F6] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      <span className="text-xs text-[#9CA3AF]">Analisando...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input area */}
              <div className="flex-shrink-0 bg-white border-t border-[#F1F1F4] p-4">
                {/* Anexos */}
                {anexos.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {anexos.map((anexo, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-2.5 py-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#3B82F6] flex-shrink-0" />
                        <span className="text-xs font-medium text-[#1D4ED8] max-w-[120px] truncate">{anexo.nome}</span>
                        {anexo.totalPages && <span className="text-[10px] text-[#60A5FA]">{anexo.totalPages}p.</span>}
                        <button onClick={() => setAnexos(prev => prev.filter((_, idx) => idx !== i))} className="text-[#93C5FD] hover:text-[#3B82F6] ml-0.5 text-xs leading-none">✕</button>
                      </div>
                    ))}
                    {anexos.length < MAX_ANEXOS && (
                      <span className="text-[10px] text-[#9CA3AF] self-center">{anexos.length}/{MAX_ANEXOS} anexos</span>
                    )}
                    {anexos.length >= MAX_ANEXOS && (
                      <span className="text-[10px] text-[#F59E0B] self-center font-medium">Limite de {MAX_ANEXOS} anexos atingido</span>
                    )}
                  </div>
                )}

                <div className="flex items-end gap-2">
                  {/* Botão de upload PDF */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    multiple
                    onChange={e => { Array.from(e.target.files || []).slice(0, MAX_ANEXOS - anexos.length).forEach(f => handleAnexarArquivo(f)); e.target.value = ""; }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={anexos.length >= MAX_ANEXOS}
                    className="w-10 h-10 rounded-xl border border-[#E5E5E8] flex items-center justify-center text-[#6B7280] hover:bg-[#EFF6FF] hover:text-[#3B82F6] hover:border-[#93C5FD] transition-all flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Anexar PDF ou imagem (PNG, JPG)"
                  >
                    <Upload className="w-4 h-4" />
                  </button>

                  {/* Campo de texto */}
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEnviar(); } }}
                    onPaste={e => {
                      const items = e.clipboardData?.items;
                      if (!items) return;
                      for (const item of items) {
                        if (item.type.startsWith("image/")) {
                          e.preventDefault();
                          const file = item.getAsFile();
                          if (file) handleAnexarArquivo(file);
                          break;
                        }
                      }
                    }}
                    placeholder="Escreva sua mensagem... (Ex: 'A altura correta é 324cm, não 320cm')"
                    rows={1}
                    className="flex-1 border border-[#E5E5E8] rounded-xl px-3.5 py-2.5 text-sm text-[#1F1F24] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6] resize-none bg-white"
                    style={{ minHeight: 40, maxHeight: 120 }}
                  />

                  {/* Botão enviar */}
                  <button
                    onClick={handleEnviar}
                    disabled={enviando || (!input.trim() && anexos.length === 0)}
                    className="w-10 h-10 rounded-xl bg-[#8B5CF6] text-white flex items-center justify-center hover:bg-[#7C3AED] transition-all disabled:opacity-40 flex-shrink-0"
                  >
                    {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[9px] text-[#9CA3AF] mt-2 text-center">
                  Enter para enviar · Shift+Enter para nova linha · Clipe para anexar PDF
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}