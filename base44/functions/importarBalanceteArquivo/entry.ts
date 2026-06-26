import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { arquivo_url, titulo, periodo } = body;

    if (!arquivo_url) {
      return Response.json({ error: 'arquivo_url é obrigatório' }, { status: 400 });
    }

    // Extrair dados do arquivo
    const schema = {
      type: "object",
      properties: {
        balancete_dados: {
          type: "object",
          properties: {
            titulo: { type: "string" },
            periodo: { type: "string" },
            data: { type: "string" }
          }
        },
        contas: {
          type: "array",
          items: {
            type: "object",
            properties: {
              codigo: { type: "string" },
              nome: { type: "string" },
              tipo: { type: "string" },
              saldo_inicial_debito: { type: "number" },
              saldo_inicial_credito: { type: "number" },
              debito_periodo: { type: "number" },
              credito_periodo: { type: "number" }
            }
          }
        }
      }
    };

    const resultado = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url: arquivo_url,
      json_schema: schema
    });

    if (resultado.status !== "success") {
      return Response.json({ 
        error: 'Erro ao extrair dados do arquivo',
        details: resultado.details 
      }, { status: 400 });
    }

    const dados = resultado.output;

    // Preparar resposta com dados extraídos
    const balanceteImportado = {
      titulo: titulo || dados.balancete_dados?.titulo || "Balancete Importado",
      periodo: periodo || dados.balancete_dados?.periodo || "",
      data_balancete: dados.balancete_dados?.data || new Date().toISOString().split("T")[0],
      movimentacoes: (dados.contas || []).map(c => ({
        conta_codigo: c.codigo || "",
        conta_nome: c.nome || "",
        tipo_conta: c.tipo || "Ativo Circulante",
        saldo_inicial_debito: parseFloat(c.saldo_inicial_debito) || 0,
        saldo_inicial_credito: parseFloat(c.saldo_inicial_credito) || 0,
        debito_periodo: parseFloat(c.debito_periodo) || 0,
        credito_periodo: parseFloat(c.credito_periodo) || 0,
        saldo_final_debito: (parseFloat(c.saldo_inicial_debito) || 0) + (parseFloat(c.debito_periodo) || 0),
        saldo_final_credito: (parseFloat(c.saldo_inicial_credito) || 0) + (parseFloat(c.credito_periodo) || 0)
      }))
    };

    // Calcular totais
    let totais = {
      total_debito_inicial: 0,
      total_credito_inicial: 0,
      total_debito_periodo: 0,
      total_credito_periodo: 0,
      total_debito_final: 0,
      total_credito_final: 0
    };

    balanceteImportado.movimentacoes.forEach(m => {
      totais.total_debito_inicial += m.saldo_inicial_debito;
      totais.total_credito_inicial += m.saldo_inicial_credito;
      totais.total_debito_periodo += m.debito_periodo;
      totais.total_credito_periodo += m.credito_periodo;
      totais.total_debito_final += m.saldo_final_debito;
      totais.total_credito_final += m.saldo_final_credito;
    });

    Object.keys(totais).forEach(k => {
      totais[k] = Math.round(totais[k] * 100) / 100;
    });

    balanceteImportado.totais = totais;

    return Response.json({
      sucesso: true,
      balancete: balanceteImportado,
      contas_importadas: balanceteImportado.movimentacoes.length,
      equilibrio: totais.total_debito_final === totais.total_credito_final
    });

  } catch (error) {
    console.error('Erro em importarBalanceteArquivo:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});