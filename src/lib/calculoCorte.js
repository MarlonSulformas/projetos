/**
 * Motor de Cálculo Industrial de Corte de Painéis
 * Regras: limite de sarrafo 244cm, modulação 200cm, largura-limite 24cm
 */

const LIMITE_SARRAFO_CM = 244;
const MODULO_PECA_CM = 200;
const DESCONTO_ACABAMENTO_TOPO_CM = 7;
const LIMITE_Y_SIMPLES_CM = 24;

/**
 * Resolve fórmula paramétrica com [X] e [Y]
 */
export function resolveFormula(formula, X, Y) {
  if (!formula) return 0;
  const str = String(formula).replace(/\[X\]/g, X).replace(/\[Y\]/g, Y);
  try { return Math.max(0, parseFloat(eval(str)) || 0); } catch { return 0; }
}

/**
 * Calcula o plano de corte de um sarrafo vertical com regra de emenda.
 * @param {object} comp - componente sarrafo_vertical
 * @param {number} X - Altura total em mm
 * @param {number} Y - Largura total em mm
 * @returns {Array<{comprimento_cm, quantidade, descricao}>}
 */
export function calcularEmendaSarrafo(comp, X, Y) {
  const comprimento_mm = resolveFormula(comp.formula_comprimento, X, Y);
  const comprimento_cm = comprimento_mm / 10;
  const qtdSarrafos = calcularQuantidadeSarrafos(comp, Y / 10);

  if (!comp.regra_emenda || comprimento_cm <= LIMITE_SARRAFO_CM) {
    // Sem emenda — peça única
    return [{ comprimento_cm: Math.round(comprimento_cm), quantidade: qtdSarrafos, descricao: "Peça inteira" }];
  }

  // Aplica regra de emenda industrial
  const altura_cm = X / 10;
  const saldo_cm = altura_cm - DESCONTO_ACABAMENTO_TOPO_CM; // desconta sarrafo de acabamento do topo

  const pecas = [];
  let restante = saldo_cm;

  while (restante > 0) {
    const peca = Math.min(MODULO_PECA_CM, restante);
    const existing = pecas.find(p => Math.abs(p.comprimento_cm - Math.round(peca)) < 0.5);
    if (existing) {
      existing.quantidade += qtdSarrafos;
    } else {
      pecas.push({ comprimento_cm: Math.round(peca), quantidade: qtdSarrafos, descricao: peca >= MODULO_PECA_CM ? "Peça padrão" : "Peça de emenda" });
    }
    restante -= peca;
  }

  return pecas;
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
 * Gera o plano de corte completo de um painel (lista de peças para carpinteiro).
 * @param {object} painel - { nome, componentes }
 * @param {number} X - Altura em mm
 * @param {number} Y - Largura em mm
 * @returns {Array<{label, pecas: Array<{descricao, comprimento_cm, largura_cm, quantidade}>}>}
 */
export function gerarPlanoCorte(painel, X, Y) {
  const grupos = [];

  painel.componentes.forEach(comp => {
    if (comp.tipo === "compensado") {
      const largura_mm  = resolveFormula(comp.formula_largura, X, Y);
      const compr_mm    = resolveFormula(comp.formula_comprimento, X, Y);
      const espessura   = parseFloat(comp.espessura_mm) || 18;
      const qty         = parseInt(comp.quantidade) || 1;
      grupos.push({
        label: "Compensado",
        cor: "#3B82F6",
        pecas: [{
          descricao: `${Math.round(compr_mm / 10)}×${Math.round(largura_mm / 10)} cm (e=${espessura}mm)`,
          quantidade: qty,
        }],
      });
    }

    if (comp.tipo === "sarrafo_vertical") {
      const largura_cm = (parseFloat(comp.largura_mm) || 40) / 10;
      const espessura  = (parseFloat(comp.espessura_mm) || 20) / 10;
      const emenda     = calcularEmendaSarrafo(comp, X, Y);
      grupos.push({
        label: "Sarrafo Vertical",
        cor: "#F59E0B",
        pecas: emenda.map(p => ({
          descricao: `${p.comprimento_cm}×${largura_cm.toFixed(0)} cm${p.descricao === "Peça de emenda" ? " (emenda)" : ""}`,
          quantidade: p.quantidade,
        })),
      });
    }

    if (comp.tipo === "sarrafo_acabamento") {
      const largura_cm = (parseFloat(comp.largura_mm) || 30) / 10;
      const compr_mm   = resolveFormula(comp.formula_comprimento, X, Y);
      const qty        = parseInt(comp.quantidade) || 3;
      grupos.push({
        label: "Sarrafo Acabamento",
        cor: "#10B981",
        pecas: [{
          descricao: `${Math.round(compr_mm / 10)}×${largura_cm.toFixed(0)} cm`,
          quantidade: qty,
        }],
      });
    }
  });

  return grupos;
}