import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { arquivo_url } = await req.json();

    if (!arquivo_url) {
      return Response.json({ error: 'arquivo_url obrigatório' }, { status: 400 });
    }

    // Busca o arquivo
    const fileResp = await fetch(arquivo_url);
    if (!fileResp.ok) {
      return Response.json({ error: 'Falha ao baixar arquivo' }, { status: 400 });
    }

    const text = await fileResp.text();

    // Parse simples do CSV/Excel convertido para texto
    const lines = text.split('\n').filter(l => l.trim());
    const parsed = [];

    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(/[,;]/).map(c => c.trim());
      if (cells.length >= 2 && cells[0]) {
        parsed.push({
          codigo: cells[0],
          mva_percentual: parseFloat(cells[1]) || 0,
          descricao: cells[2] || `NCM ${cells[0]}`,
        });
      }
    }

    // Atualiza NCMs existentes com MVA da SEFAZ
    let updated = 0;
    
    // Busca todos os NCMs para fazer lookup em memória
    const todosNCMs = await base44.asServiceRole.entities.TabelaNCM.list();
    
    for (const item of parsed) {
      const ncm = todosNCMs.find(n => n.codigo === item.codigo);
      if (ncm) {
        await base44.asServiceRole.entities.TabelaNCM.update(ncm.id, {
          mva_percentual: parseFloat(item.mva_percentual) || 0,
          observacoes_fiscais: `MVA SEFAZ Portaria 195/2019 - ${new Date().toLocaleDateString('pt-BR')}`,
        });
        updated++;
      }
    }

    return Response.json({
      sucesso: true,
      total: parsed.length,
      atualizados: updated,
      mensagem: `${updated} NCM(s) atualizados com MVA da SEFAZ Portaria 195/2019`,
    });
  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});