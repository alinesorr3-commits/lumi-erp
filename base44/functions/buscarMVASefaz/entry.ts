import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { codigo_ncm } = await req.json();

    if (!codigo_ncm) {
      return Response.json({ error: 'codigo_ncm obrigatório' }, { status: 400 });
    }

    // Simula consulta ao banco de dados SEFAZ de MVA
    // Em produção, isso consultaria um serviço real de dados SEFAZ
    const mvaSefaz = {
      '0101.21.00': 33.67,
      '7308.40.00': 28.90,
      '8537.10.10': 42.55,
      '1523.80.90': 30.25,
    };

    const mva = mvaSefaz[codigo_ncm] || null;

    if (mva !== null) {
      return Response.json({
        sucesso: true,
        codigo_ncm,
        mva_percentual: mva,
        fonte: 'SEFAZ Portaria 195/2019',
      });
    } else {
      return Response.json({
        sucesso: false,
        codigo_ncm,
        mva_percentual: 0,
        mensagem: 'MVA não encontrado para este NCM. Consulte a tabela SEFAZ atualizada.',
      });
    }
  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});