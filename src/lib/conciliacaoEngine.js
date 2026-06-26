/**
 * Conciliação Inteligente Engine
 */

const normalizar = (str) => {
  if (!str) return "";
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

const apenasNumeros = (str) => {
  if (!str) return "";
  return str.replace(/\D/g, "");
};

const diffDias = (data1, data2) => {
  if (!data1 || !data2) return 9999;
  const d1 = new Date(data1);
  const d2 = new Date(data2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const calcularScoreConciliacao = (movimentacao, lancamento) => {
  let score = 0;
  let matches = [];

  // Tipos devem ser compatíveis
  if (movimentacao.tipo !== lancamento.tipo) {
    return { score: 0, matches: [], percentage: 0 };
  }

  // Se já está conciliado, ignora
  if (lancamento.conciliado) {
    return { score: 0, matches: [], percentage: 0 };
  }

  // 1. Valor (Até 40 pontos)
  const valorMov = Math.abs(Number(movimentacao.valor || 0)) - Number(movimentacao.valor_conciliado || 0);
  const valorLan = Math.abs(Number(lancamento.valor || 0)) - Number(lancamento.valor_pago || 0);
  if (Math.abs(valorMov - valorLan) < 0.01 && valorMov > 0) {
    score += 40;
    matches.push("Valor Exato");
  }

  // 2. Data (Até 20 pontos)
  const diff = diffDias(movimentacao.data_transacao, lancamento.vencimento);
  if (diff === 0) {
    score += 20;
    matches.push("Data Exata");
  } else if (diff <= 5) {
    score += 10;
    matches.push(`Data Próxima (${diff} dias)`);
  }

  // 3. Documento / NF (Até 20 pontos)
  const numDocMov = normalizar(movimentacao.numero_documento || movimentacao.descricao);
  const numDocLan = normalizar(lancamento.numero_documento || lancamento.chave_acesso);
  if (numDocLan && numDocMov.includes(numDocLan) && numDocLan.length > 2) {
    score += 20;
    matches.push("Número Doc/NF");
  }

  // 4. CNPJ/CPF (Até 20 pontos)
  const cpfCnpjMov = apenasNumeros(movimentacao.cnpj_cpf || movimentacao.descricao);
  const cpfCnpjLan = apenasNumeros(lancamento.cliente_fornecedor); 
  if (cpfCnpjMov && cpfCnpjMov.length >= 11 && cpfCnpjLan && cpfCnpjLan.includes(cpfCnpjMov)) {
    score += 20;
    matches.push("CNPJ/CPF");
  }

  // 5. Nome Fornecedor/Cliente (Até 15 pontos)
  const nomeLan = normalizar(lancamento.cliente_fornecedor);
  const descMov = normalizar(movimentacao.descricao);
  if (nomeLan && nomeLan.length > 3 && descMov.includes(nomeLan)) {
    score += 15;
    matches.push("Razão Social/Nome");
  }

  const finalScore = Math.min(score, 100);

  return {
    score: finalScore,
    matches,
    percentage: finalScore
  };
};

export const analisarConciliacoes = (movimentacoes, lancamentos) => {
  return movimentacoes.map(mov => {
    // Pular se já está vinculado
    if (mov.vinculado || mov.status_conciliacao === 'conciliado' || mov.status_conciliacao === 'divergente') {
      return { ...mov, sugestoes: [], status_sugestao: mov.status_conciliacao || 'conciliado', melhorSugestao: null };
    }

    const sugestoes = lancamentos
      .map(lan => {
        const { score, matches, percentage } = calcularScoreConciliacao(mov, lan);
        return { lancamento: lan, score, matches, percentage };
      })
      .filter(s => s.percentage >= 30) // Filtrar apenas os que tem alguma chance
      .sort((a, b) => b.score - a.score);

    const melhorSugestao = sugestoes[0];
    
    let status_sugestao = 'nenhuma';
    if (melhorSugestao) {
      if (melhorSugestao.percentage >= 80) {
        status_sugestao = 'automatica';
      } else {
        status_sugestao = 'assistida';
      }
    }

    return {
      ...mov,
      sugestoes,
      melhorSugestao,
      status_sugestao
    };
  });
};