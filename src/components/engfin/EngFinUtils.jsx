export const fmt = (v, dec = 0) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: dec }).format(v || 0);

export const fmtPct = (v, dec = 1) =>
  `${(v || 0).toFixed(dec)}%`;

export const fmtNum = (v, dec = 0) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(v || 0);

export const fmtDate = (d) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";

export const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// Agrega dados de todos os módulos para cálculos consolidados
export function consolidarDados({ lancamentos = [], despesasObra = [], materiaisObra = [], maoObra = [], receitasAgro = [], despesasAgro = [], financiamentos = [], financiamentosAgro = [], investimentos = [], investimentosAgro = [], colaboradores = [], folhas = [] }) {
  const receitaFinanceiro = lancamentos.filter(l => l.tipo === "receita").reduce((s, l) => s + (l.valor || 0), 0);
  const despesaFinanceiro = lancamentos.filter(l => l.tipo === "despesa").reduce((s, l) => s + (l.valor || 0), 0);
  const receitaAgro = receitasAgro.reduce((s, r) => s + (r.valor_total || 0), 0);
  const despesaAgro = despesasAgro.reduce((s, d) => s + (d.valor_total || 0), 0);
  const custoObras = [...despesasObra, ...materiaisObra, ...maoObra].reduce((s, i) => s + (i.valor_total || i.valor || 0), 0);
  const folhaTotal = folhas.reduce((s, f) => s + (f.total_liquido || f.salario_bruto || 0), 0);
  const salarios = colaboradores.reduce((s, c) => s + (c.salario_base || 0), 0);
  const totalFinanciamentos = [...financiamentos, ...financiamentosAgro].filter(f => f.status === "Ativo").reduce((s, f) => s + (f.valor_contratado || 0), 0);
  const totalInvestimentos = [...investimentos, ...investimentosAgro].reduce((s, i) => s + (i.valor || 0), 0);
  const depreciacao = [...investimentos, ...investimentosAgro].reduce((s, i) => s + (i.vida_util_anos > 0 ? (i.valor || 0) / i.vida_util_anos : 0), 0);

  const receitaBruta = receitaFinanceiro + receitaAgro;
  const custoTotal = despesaFinanceiro + despesaAgro + custoObras + (folhaTotal || salarios);
  const lucroOperacional = receitaBruta - custoTotal;
  const lucroLiquido = lucroOperacional - (depreciacao / 12);
  const margemLiquida = receitaBruta > 0 ? (lucroLiquido / receitaBruta) * 100 : 0;
  const margemOperacional = receitaBruta > 0 ? (lucroOperacional / receitaBruta) * 100 : 0;
  const ebitda = lucroOperacional + (depreciacao / 12);
  const endividamento = receitaBruta > 0 ? (totalFinanciamentos / receitaBruta) * 100 : 0;
  const roi = totalInvestimentos > 0 ? (lucroLiquido / totalInvestimentos) * 100 : 0;
  const pontoEquilibrio = margemLiquida < 100 ? custoTotal / (1 - Math.max(margemLiquida / 100, 0.01)) : 0;
  const capitalGiro = receitaBruta - custoTotal;
  const liquidez = despesaFinanceiro > 0 ? receitaFinanceiro / despesaFinanceiro : 0;

  return {
    receitaBruta, despesaFinanceiro, despesaAgro, custoObras, custoTotal,
    lucroOperacional, lucroLiquido, margemLiquida, margemOperacional,
    ebitda, endividamento, roi, pontoEquilibrio, capitalGiro, liquidez,
    totalFinanciamentos, totalInvestimentos, depreciacao, folhaTotal, salarios,
    receitaFinanceiro, receitaAgro
  };
}

// Constrói série mensal a partir de lançamentos
export function seriesMensais(lancamentos = [], receitasAgro = [], despesasAgro = []) {
  const mapa = {};
  const initMes = (k) => { if (!mapa[k]) mapa[k] = { receita: 0, despesa: 0, lucro: 0 }; };

  lancamentos.forEach(l => {
    const d = l.vencimento || l.data_pagamento;
    if (!d) return;
    const k = d.slice(0, 7);
    initMes(k);
    if (l.tipo === "receita") mapa[k].receita += l.valor || 0;
    else mapa[k].despesa += l.valor || 0;
  });
  [...receitasAgro].forEach(r => {
    if (!r.data) return;
    const k = r.data.slice(0, 7);
    initMes(k);
    mapa[k].receita += r.valor_total || 0;
  });
  [...despesasAgro].forEach(d => {
    if (!d.data) return;
    const k = d.data.slice(0, 7);
    initMes(k);
    mapa[k].despesa += d.valor_total || 0;
  });

  return Object.entries(mapa).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([mes, v]) => ({
    mes: mes.slice(5, 7) + "/" + mes.slice(2, 4),
    receita: v.receita,
    despesa: v.despesa,
    lucro: v.receita - v.despesa,
  }));
}