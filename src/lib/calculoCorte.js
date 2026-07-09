/**
 * Motor de Cálculo Industrial de Corte de Painéis
 * Regras: limite de sarrafo 244cm, modulação 200cm, largura-limite 24cm
 */

const LIMITE_SARRAFO_CM = 244;
const MODULO_PECA_CM = 200;
const DESCONTO_ACABAMENTO_TOPO_CM = 7;
const LIMITE_Y_SIMPLES_CM = 24;

/**
 * Normaliza texto para comparação resiliente:
 * remove acentos, converte para minúsculas e faz trim.
 */
function normalizarTexto(str) {
  if (!str) return "";
  return String(str)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Resolve fórmula paramétrica com [X] e [Y]
 */
export function resolveFormula(formula, X, Y, MEDIDA = 0, LARGURA = 0) {
  if (!formula) return 0;
  const str = String(formula)
    .replace(/\[X\]/g, X)
    .replace(/\[Y\]/g, Y)
    .replace(/\[MEDIDA\]/g, MEDIDA)
    .replace(/\[LARGURA\]/g, LARGURA);
  try { return Math.max(0, parseFloat(eval(str)) || 0); } catch { return 0; }
}

/**
 * Calcula o plano de corte de um sarrafo vertical com regra de emenda.
 * @param {object} comp - componente sarrafo_vertical
 * @param {number} X_mm - Altura total em mm
 * @param {number} Y_mm - Largura total em mm
 * @param {number} folga_extra_cm - folga adicional a descontar (ex: espessura acabamento)
 * @returns {Array<{comprimento_cm, quantidade, descricao}>}
 */
export function calcularEmendaSarrafo(comp, X_mm, Y_mm, folga_extra_cm = 0) {
  const X_cm = X_mm / 10;
  const folga = parseFloat(comp.folga) || 0;
  const qtdSarrafos = calcularQuantidadeSarrafos(comp, Y_mm / 10);

  // SaldoVertical = X - Espessura_Acabamento(7) - Folga_Configurada
  // folga_extra_cm representa a espessura do sarrafo de acabamento do topo
  const saldoVertical = X_cm - folga_extra_cm - folga;

  if (!comp.regra_emenda || saldoVertical <= LIMITE_SARRAFO_CM) {
    return [{
      comprimento_cm: Math.round(saldoVertical * 10) / 10,
      quantidade: qtdSarrafos,
      descricao: "Peça inteira",
    }];
  }

  // Emenda industrial: peça base travada em 200cm + emenda = SaldoVertical - 200
  const pecaBase   = MODULO_PECA_CM;
  const pecaEmenda = Math.round((saldoVertical - pecaBase) * 10) / 10;

  return [
    { comprimento_cm: pecaBase,   quantidade: qtdSarrafos, descricao: "Peça padrão (200cm)" },
    { comprimento_cm: pecaEmenda, quantidade: qtdSarrafos, descricao: "Peça de emenda" },
  ];
}

/**
 * Calcula quantos sarrafos verticais são necessários com base em [Y].
 */
export function calcularQuantidadeSarrafos(comp, Y_cm) {
  if (comp.regra_qty_y) {
    if (Y_cm <= LIMITE_Y_SIMPLES_CM) return 1;
    return parseInt(comp.qty_extra) || 2;
  }
  return parseInt(comp.quantidade) || 2;
}

/**
 * Soma espessura dos sarrafos de acabamento ancorados no topo.
 */
function getEspAcabTopo(componentes) {
  return componentes
    .filter(c => c.tipo === "sarrafo_acabamento" && (c.ancoragem === "topo" || !c.ancoragem))
    .reduce((s, c) => s + (parseFloat(c.largura_mm) || 0), 0);
}

/**
 * Gera o plano de corte completo de um painel (lista de peças para carpinteiro).
 * Leva em conta ancoragem e folgas de cada componente.
 * @param {object} painel - { nome, componentes }
 * @param {number} X_mm - Altura em mm
 * @param {number} Y_mm - Largura em mm
 * @returns {Array<{label, cor, pecas}>}
 */
export function gerarPlanoCorte(painel, X_mm, Y_mm) {
  const X_cm = X_mm / 10;
  const Y_cm = Y_mm / 10;
  const grupos = [];

  // Pré-calcula espessura acabamento no topo para descontar dos verticais
  const espAcabTopo_cm = getEspAcabTopo(painel.componentes);

  painel.componentes.forEach(comp => {
    if (comp.tipo === "compensado") {
      const largura  = resolveFormula(comp.formula_largura, X_cm, Y_cm);
      const compr    = resolveFormula(comp.formula_comprimento, X_cm, Y_cm);
      const esp      = parseFloat(comp.espessura_mm) || 1.8;
      const qty      = parseInt(comp.quantidade) || 1;
      grupos.push({
        label: "Compensado",
        cor: "#3B82F6",
        pecas: [{ descricao: `${compr.toFixed(0)}×${largura.toFixed(0)} cm (e=${esp}cm)`, quantidade: qty }],
      });
    }

    if (comp.tipo === "sarrafo_vertical") {
      const largura_cm = parseFloat(comp.largura_mm) || 4;
      // Desconta a espessura fixa do sarrafo de acabamento do topo (7cm industrial)
      const emenda = calcularEmendaSarrafo(comp, X_mm, Y_mm, DESCONTO_ACABAMENTO_TOPO_CM);
      grupos.push({
        label: "Sarrafo Vertical",
        cor: "#F59E0B",
        pecas: emenda.map(p => ({
          descricao: `${p.comprimento_cm}×${largura_cm.toFixed(0)} cm${p.descricao === "Peça de emenda" ? " (emenda)" : p.descricao === "Peça padrão (200cm)" ? " (padrão)" : ""}`,
          quantidade: p.quantidade,
        })),
      });
    }

    if (comp.tipo === "sarrafo_acabamento") {
      const largura_cm = parseFloat(comp.largura_mm) || 3;
      const compr      = resolveFormula(comp.formula_comprimento, X_cm, Y_cm);
      const qty        = parseInt(comp.quantidade) || 1;
      const folga      = parseFloat(comp.folga) || 0;
      const anc        = comp.ancoragem || "topo";
      const ancLabel   = anc === "topo" ? " [topo]" : anc === "base" ? " [base]" : anc === "livre" ? " [livre]" : "";
      grupos.push({
        label: "Sarrafo Acabamento",
        cor: "#10B981",
        pecas: [{
          descricao: `${(compr - folga).toFixed(0)}×${largura_cm.toFixed(0)} cm${ancLabel}`,
          quantidade: qty,
        }],
      });
    }
  });

  return grupos;
}

/**
 * Motor de Regras Dinâmico — aplica regras cadastradas no banco aos dados brutos extraídos pela IA.
 * A IA apenas extrai; este motor calcula.
 * @param {object} dadosExtraidos - { nome, x_cm, y_cm, componentes_extraidos: [...] }
 * @param {Array} componentesCadastrados - [{ tipo, nome, cor, regras: {...} }]
 * @returns {{ linhas: Array, avisos: Array }}
 */
export function aplicarRegrasComponentes(dadosExtraidos, componentesCadastrados) {
  const linhas = [];
  const avisos = [];
  const X = parseFloat(dadosExtraidos.x_cm) || 0;
  const Y = parseFloat(dadosExtraidos.y_cm) || 0;

  for (const extraido of (dadosExtraidos.componentes_extraidos || [])) {
    const comp = componentesCadastrados.find(c =>
      normalizarTexto(c.tipo) === normalizarTexto(extraido.tipo) ||
      normalizarTexto(c.nome) === normalizarTexto(extraido.componente_nome)
    );

    if (!comp) {
      linhas.push({
        componente: extraido.componente_nome || extraido.tipo,
        quantidade: extraido.quantidade || 1,
        dimensoes: `${extraido.altura_bruta} x ${extraido.largura_bruta} cm`,
        obs: "⚠️ Sem regra cadastrada — medida bruta",
        cor: "#6B7280",
      });
      avisos.push(`Componente "${extraido.componente_nome || extraido.tipo}" sem regra cadastrada.`);
      continue;
    }

    const regras = comp.regras || {};
    const MEDIDA = parseFloat(extraido.altura_bruta) || 0;
    const LARGURA_COMP = parseFloat(regras.largura) || 0;
    let comprimento = MEDIDA;
    let largura = parseFloat(extraido.largura_bruta) || 0;

    // Fórmulas paramétricas: [MEDIDA], [LARGURA], [X], [Y]
    if (regras.formula_comprimento) {
      comprimento = resolveFormula(regras.formula_comprimento, X, Y, MEDIDA, LARGURA_COMP);
    } else {
      // Descontos só aplicam se não houver fórmula manual
      if (regras.desconto_fixo) comprimento -= parseFloat(regras.desconto_fixo);
      if (regras.desconto_percentual) comprimento *= (1 - parseFloat(regras.desconto_percentual) / 100);
      if (regras.folga) comprimento -= parseFloat(regras.folga);
    }
    if (regras.formula_largura) {
      largura = resolveFormula(regras.formula_largura, X, Y, MEDIDA, LARGURA_COMP);
    }

    // Quantidade
    let quantidade = parseInt(regras.quantidade) || extraido.quantidade || 1;
    if (regras.regra_qty_y && Y > (regras.limite_y_simples || 24)) {
      quantidade = parseInt(regras.qty_extra) || 2;
    }

    // Formatar dimensões: se tem largura (compensado), mostra "C x L"; senão só comprimento
    const fmtDim = (c, l) => l > 0 ? `${c} x ${l} cm` : `${c} cm`;

    // Emenda
    if (regras.regra_emenda && comprimento > (regras.limite_emenda || 244)) {
      const modulo = regras.modulo_emenda || 200;
      const pecaEmenda = Math.round((comprimento - modulo) * 10) / 10;
      linhas.push({
        componente: comp.nome,
        quantidade,
        dimensoes: fmtDim(modulo, Math.round(largura * 10) / 10),
        obs: "Peça padrão (emenda)",
        cor: comp.cor || "#6B7280",
      });
      linhas.push({
        componente: comp.nome,
        quantidade,
        dimensoes: fmtDim(pecaEmenda, Math.round(largura * 10) / 10),
        obs: "Peça de emenda",
        cor: comp.cor || "#6B7280",
      });
    } else {
      const comprimentoFinal = Math.round(comprimento * 10) / 10;
      const larguraFinal = Math.round(largura * 10) / 10;
      const obsParts = [];
      if (extraido.obs) obsParts.push(extraido.obs);
      if (!regras.formula_comprimento && regras.desconto_fixo) obsParts.push(`−${regras.desconto_fixo}cm`);
      if (!regras.formula_comprimento && regras.desconto_percentual) obsParts.push(`−${regras.desconto_percentual}%`);
      linhas.push({
        componente: comp.nome,
        quantidade,
        dimensoes: fmtDim(comprimentoFinal, larguraFinal),
        obs: obsParts.join(" · ") || "—",
        cor: comp.cor || "#6B7280",
      });
    }
  }

  return { linhas, avisos };
}