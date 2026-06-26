import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Verifica admin
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const hoje = new Date();
    const em7  = new Date(hoje); em7.setDate(hoje.getDate() + 7);
    const em15 = new Date(hoje); em15.setDate(hoje.getDate() + 15);
    const em30 = new Date(hoje); em30.setDate(hoje.getDate() + 30);

    const toISO = (d) => d.toISOString().slice(0, 10);

    // Busca todas as certidões ativas
    const certidoes = await base44.asServiceRole.entities.Certidao.list();

    const vencendoEm7  = certidoes.filter(c => c.data_validade >= toISO(hoje) && c.data_validade <= toISO(em7));
    const vencendoEm15 = certidoes.filter(c => c.data_validade > toISO(em7)  && c.data_validade <= toISO(em15));
    const vencendoEm30 = certidoes.filter(c => c.data_validade > toISO(em15) && c.data_validade <= toISO(em30));
    const vencidas     = certidoes.filter(c => c.data_validade < toISO(hoje) && c.situacao !== 'Em Renovação');

    const total = vencendoEm7.length + vencidas.length;

    if (total === 0 && vencendoEm15.length === 0 && vencendoEm30.length === 0) {
      console.log('Nenhuma certidão com alerta necessário.');
      return Response.json({ enviados: 0, message: 'Nenhum alerta necessário' });
    }

    // Busca usuários admin para enviar o alerta
    const usuarios = await base44.asServiceRole.entities.LogAcesso.list('-timestamp', 1);
    const adminEmail = user.email;

    const linhasVencidas = vencidas.map(c =>
      `  ❌ ${c.tipo} — ${c.empresa || 'N/A'} (venceu em ${c.data_validade})`
    ).join('\n');

    const linhas7 = vencendoEm7.map(c =>
      `  ⚠️  ${c.tipo} — ${c.empresa || 'N/A'} (vence em ${c.data_validade})`
    ).join('\n');

    const linhas15 = vencendoEm15.map(c =>
      `  🔔 ${c.tipo} — ${c.empresa || 'N/A'} (vence em ${c.data_validade})`
    ).join('\n');

    const linhas30 = vencendoEm30.map(c =>
      `  📅 ${c.tipo} — ${c.empresa || 'N/A'} (vence em ${c.data_validade})`
    ).join('\n');

    const partes = [];
    if (vencidas.length > 0)      partes.push(`🚨 CERTIDÕES VENCIDAS (${vencidas.length}):\n${linhasVencidas}`);
    if (vencendoEm7.length > 0)   partes.push(`⚠️  Vencendo nos próximos 7 dias (${vencendoEm7.length}):\n${linhas7}`);
    if (vencendoEm15.length > 0)  partes.push(`🔔 Vencendo em 8–15 dias (${vencendoEm15.length}):\n${linhas15}`);
    if (vencendoEm30.length > 0)  partes.push(`📅 Vencendo em 16–30 dias (${vencendoEm30.length}):\n${linhas30}`);

    const corpo = `Relatório automático de certidões — ${hoje.toLocaleDateString('pt-BR')}

${partes.join('\n\n')}

Acesse o Lumi ERP → Módulo Certidões para renovar.
    `.trim();

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: adminEmail,
      subject: `🚨 Alerta Certidões — ${vencidas.length} vencidas, ${vencendoEm7.length} vencem em 7 dias`,
      body: corpo,
    });

    console.log(`Alerta de certidões enviado para ${adminEmail}. Vencidas: ${vencidas.length}, próximas: ${vencendoEm7.length + vencendoEm15.length + vencendoEm30.length}`);
    return Response.json({
      enviados: 1,
      vencidas: vencidas.length,
      alerta7: vencendoEm7.length,
      alerta15: vencendoEm15.length,
      alerta30: vencendoEm30.length,
    });
  } catch (error) {
    console.error('Erro em alertarCertidoes:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});