import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Dia de amanhã
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const targetDate = tomorrow.toISOString().split('T')[0];

    // Busca licenças ativas do Plano Profissional que vencem amanhã
    const licencas = await base44.asServiceRole.entities.LicencaCliente.filter({
      status: 'ativa',
      plano: 'Profissional',
      data_expiracao: targetDate
    });

    let avisosEnviados = 0;

    for (const licenca of licencas) {
      if (licenca.user_email) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: licenca.user_email,
          subject: 'Seu período de teste do ERP expira amanhã!',
          body: `Olá,\n\nEsperamos que esteja aproveitando o Plano Profissional do Lumi ERP.\n\nSeu período de teste de 10 dias expira amanhã (${targetDate}).\n\nPara continuar acessando todas as funcionalidades e não perder nenhum dado cadastrado, acesse o sistema e assine o plano definitivo na área de "Planos".\n\nAtenciosamente,\nEquipe Lumi ERP`
        });
        avisosEnviados++;
      }
    }

    return Response.json({ success: true, avisosEnviados, data_alvo: targetDate });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});