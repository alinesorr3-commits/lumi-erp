import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Executa uma ordem de produção:
 * - Valida ficha técnica e saldo de insumos
 * - Realiza baixa proporcional dos insumos
 * - Dá entrada no produto acabado
 * - Recalcula custos médios
 * - Registra histórico de movimentação
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    const { ordem_producao_id, quantidade_produzida } = payload;

    if (!ordem_producao_id) {
      return Response.json({ error: 'ordem_producao_id é obrigatório' }, { status: 400 });
    }

    // 1. Buscar ordem de produção
    const op = await base44.asServiceRole.entities.OrdemProducao.list();
    const ordem = op.find(o => o.id === ordem_producao_id);
    if (!ordem) {
      return Response.json({ error: 'Ordem de produção não encontrada' }, { status: 404 });
    }

    // 2. Buscar ficha técnica
    const fichas = await base44.asServiceRole.entities.FichaTecnica.list();
    const ficha = fichas.find(f => f.id === ordem.ficha_tecnica_id);
    if (!ficha) {
      return Response.json({ error: 'Ficha técnica não encontrada' }, { status: 404 });
    }

    const qtdProd = quantidade_produzida || ordem.quantidade_planejada;
    const dataMov = new Date().toISOString().split('T')[0];
    const lote = ordem.lote_producao || `OP-${ordem.numero}-${dataMov}`;

    // 3. Validar saldos dos insumos
    const produtos = await base44.asServiceRole.entities.ProdutoServico.list();
    const movimentos = await base44.asServiceRole.entities.MovimentacaoEstoque.list();

    const errosValidacao = [];
    let custoProdução = ordem.custo_real_mao_obra || 0;

    for (const insumo of ficha.insumos) {
      const qtdNecessaria = insumo.quantidade_por_unidade * qtdProd;
      const qtdComDesperdicio = qtdNecessaria * (1 + (insumo.desperdicio_percentual || 0) / 100);
      
      // Calcular saldo atual do insumo
      const movInsumo = movimentos.filter(m => m.produto_id === insumo.insumo_id);
      let saldoAtual = 0;
      for (const mov of movInsumo) {
        if (mov.tipo_movimento === 'Entrada' || mov.tipo_movimento === 'Produção') {
          saldoAtual += mov.quantidade;
        } else if (mov.tipo_movimento === 'Saída' || mov.tipo_movimento === 'Consumo Produção') {
          saldoAtual -= mov.quantidade;
        }
      }

      if (saldoAtual < qtdComDesperdicio) {
        errosValidacao.push(
          `${insumo.insumo_descricao}: saldo ${saldoAtual} < necessário ${qtdComDesperdicio}`
        );
      }
    }

    if (errosValidacao.length > 0) {
      return Response.json({ 
        error: 'Saldo insuficiente para os insumos',
        detalhes: errosValidacao 
      }, { status: 400 });
    }

    // 4. Registrar baixa dos insumos e atualizar custos médios
    for (const insumo of ficha.insumos) {
      const qtdNecessaria = insumo.quantidade_por_unidade * qtdProd;
      const qtdComDesperdicio = qtdNecessaria * (1 + (insumo.desperdicio_percentual || 0) / 100);

      // Buscar custo médio atual do insumo
      const movInsumo = movimentos.filter(m => m.produto_id === insumo.insumo_id);
      let saldoAtual = 0;
      let custoMedioAtual = insumo.custo_unitario || 0;
      
      for (const mov of movInsumo.sort((a, b) => new Date(a.data_movimento) - new Date(b.data_movimento))) {
        if (mov.tipo_movimento === 'Entrada' || mov.tipo_movimento === 'Produção') {
          const valorTotal = mov.quantidade * mov.preco_unitario;
          const saldoAnterior = saldoAtual;
          saldoAtual += mov.quantidade;
          custoMedioAtual = (saldoAnterior * custoMedioAtual + valorTotal) / saldoAtual;
        } else if (mov.tipo_movimento === 'Saída' || mov.tipo_movimento === 'Consumo Produção') {
          saldoAtual -= mov.quantidade;
        }
      }

      // Registrar movimentação de consumo (saída para produção)
      await base44.asServiceRole.entities.MovimentacaoEstoque.create({
        produto_id: insumo.insumo_id,
        produto_codigo: insumo.insumo_codigo,
        produto_descricao: insumo.insumo_descricao,
        tipo_movimento: 'Consumo Produção',
        quantidade: qtdComDesperdicio,
        preco_unitario: custoMedioAtual,
        valor_total: qtdComDesperdicio * custoMedioAtual,
        custo_medio_anterior: custoMedioAtual,
        custo_medio_novo: custoMedioAtual,
        saldo_anterior: saldoAtual,
        saldo_novo: saldoAtual - qtdComDesperdicio,
        data_movimento: dataMov,
        ordem_producao_id,
        lote_producao: lote,
        referencia_documento: ordem.numero,
        responsavel: user.full_name || user.email
      });

      // Atualizar estoque do produto
      const produtoAtual = produtos.find(p => p.id === insumo.insumo_id);
      if (produtoAtual) {
        await base44.asServiceRole.entities.ProdutoServico.update(insumo.insumo_id, {
          estoque_atual: (produtoAtual.estoque_atual || 0) - qtdComDesperdicio
        });
      }

      // Somar custo dos insumos
      custoProdução += qtdComDesperdicio * custoMedioAtual;
    }

    // 5. Dar entrada no produto acabado
    const produtoAcabado = produtos.find(p => p.id === ordem.produto_id);
    const custoUnitario = custoProdução / qtdProd;
    
    // Buscar histórico de custos médios do produto acabado
    const movProduto = movimentos.filter(m => m.produto_id === ordem.produto_id);
    let saldoAnterior = 0;
    let custoMedioAnterior = produtoAcabado?.preco_custo || 0;

    for (const mov of movProduto) {
      if (mov.tipo_movimento === 'Entrada' || mov.tipo_movimento === 'Produção') {
        const valorTotal = mov.quantidade * mov.preco_unitario;
        saldoAnterior += mov.quantidade;
        custoMedioAnterior = (saldoAnterior * custoMedioAnterior + valorTotal) / (saldoAnterior + mov.quantidade);
      } else if (mov.tipo_movimento === 'Saída') {
        saldoAnterior -= mov.quantidade;
      }
    }

    const saldoNovo = saldoAnterior + qtdProd;
    const custoMedioNovo = (saldoAnterior * custoMedioAnterior + custoProdução) / saldoNovo;

    // Registrar entrada do produto acabado
    await base44.asServiceRole.entities.MovimentacaoEstoque.create({
      produto_id: ordem.produto_id,
      produto_codigo: ordem.produto_codigo,
      produto_descricao: ordem.produto_descricao,
      tipo_movimento: 'Produção',
      quantidade: qtdProd,
      preco_unitario: custoUnitario,
      valor_total: custoProdução,
      custo_medio_anterior: custoMedioAnterior,
      custo_medio_novo: custoMedioNovo,
      saldo_anterior: saldoAnterior,
      saldo_novo: saldoNovo,
      data_movimento: dataMov,
      ordem_producao_id,
      lote_producao: lote,
      referencia_documento: ordem.numero,
      responsavel: user.full_name || user.email
    });

    // Atualizar estoque e custo médio do produto acabado
    await base44.asServiceRole.entities.ProdutoServico.update(ordem.produto_id, {
      estoque_atual: saldoNovo,
      preco_custo: custoMedioNovo
    });

    // 6. Atualizar ordem de produção
    await base44.asServiceRole.entities.OrdemProducao.update(ordem_producao_id, {
      quantidade_produzida: qtdProd,
      custo_real_insumos: custoProdução - (ordem.custo_real_mao_obra || 0),
      custo_total_realizado: custoProdução,
      lote_producao: lote,
      status: 'Concluída',
      data_conclusao: dataMov
    });

    return Response.json({
      sucesso: true,
      mensagem: `OP ${ordem.numero} executada com sucesso`,
      dados: {
        lote: lote,
        quantidade_produzida: qtdProd,
        custo_total: custoProdução,
        custo_unitario: custoUnitario,
        novo_saldo_produto: saldoNovo,
        novo_custo_medio: custoMedioNovo
      }
    });
  } catch (error) {
    console.error('Erro ao executar produção:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});