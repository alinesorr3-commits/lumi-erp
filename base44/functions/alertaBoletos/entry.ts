import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hoje = new Date();
    const em3dias = new Date(hoje); em3dias.setDate(hoje.getDate() + 3);
    const em7dias = new Date(hoje); em7dias.setDate(hoje.getDate() + 7);

    const toISO = (d) => d.toISOString().split('T')[0];

    const lancamentos = await base44.asServiceRole.entities.Lancamento.filter({ status: 'pendente' });

    const vencendo3 = lancamentos.filter(l => {
      const v = new Date(l.vencimento);
      return v >= hoje && v <= em3dias;
    });

    const vencendo7 = lancamentos.filter(l => {
      const v = new Date(l.vencimento);
      return v > em3dias && v <= em7dias;
    });

    const vencidos = lancamentos.filter(l => {
      return new Date(l.vencimento) < hoje;
    });

    // Marcar vencidos como "vencido"
    let atualizados = 0;
    for (const l of vencidos) {
      await base44.asServiceRole.entities.Lancamento.update(l.id, { status: 'vencido' });
      atualizados++;
    }

    // Enviar e-mail de alerta se houver vencimentos críticos
    const urgentes = [...vencidos, ...vencendo3];
    if (urgentes.length > 0) {
      const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
      const fmtDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

      const linhas = urgentes.map(l =>
        `• ${l.descricao} — ${fmt(l.valor)} — Venc: ${fmtDate(l.vencimento)} [${l.tipo === 'despesa' ? 'DESPESA' : 'RECEITA'}]`
      ).join('\n');

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject: `⚠️ Lumi ERP — ${urgentes.length} boleto(s) vencido(s) ou a vencer em 3 dias`,
        body: `Olá,\n\nOs seguintes lançamentos requerem atenção:\n\n${linhas}\n\nAcesse o sistema para regularizar.\n\n— Lumi ERP`,
      });
    }

    return Response.json({
      vencidos: vencidos.length,
      vencendo3dias: vencendo3.length,
      vencendo7dias: vencendo7.length,
      statusAtualizados: atualizados,
      emailEnviado: urgentes.length > 0,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});