import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

// Mapa plano ID Stripe → dados internos
const MODULOS_POR_PLANO = {
  basico:        ["financeiro", "comercial", "rh"],
  profissional:  ["financeiro", "comercial", "rh", "fiscal", "nfe", "veiculos", "obras", "agronegocio", "eng_financeira", "bens_recebidos", "tributario"],
  enterprise:    ["all"],
};

const NOMES_PLANO = {
  basico: "Básico",
  profissional: "Profissional",
  enterprise: "Enterprise",
};

// Valores mensais de referência
const VALORES_MENSAIS = { basico: 197, profissional: 397, enterprise: 797 };

Deno.serve(async (req) => {
  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature inválida:', err.message);
      return new Response('Webhook Error: ' + err.message, { status: 400 });
    }

    console.log('Stripe event recebido:', event.type);

    // Usa service role pois não há usuário autenticado
    const base44 = createClientFromRequest(req);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const meta = session.metadata || {};
      const email = session.customer_email || session.customer_details?.email || '';
      const planoId = meta.plano || 'profissional';
      const periodicidade = meta.periodicidade || 'mensal';
      const empresaNome = meta.empresa_nome || '';
      const empresaCnpj = meta.empresa_cnpj || '';
      const responsavelNome = meta.responsavel_nome || '';
      const stripeCustomerId = session.customer || '';
      const stripeSubId = session.subscription || '';

      if (!email) {
        console.error('E-mail não encontrado na sessão Stripe');
        return Response.json({ received: true });
      }

      // Calcula data de renovação
      const hoje = new Date();
      let dataRenovacao = new Date(hoje);
      if (periodicidade === 'anual') dataRenovacao.setFullYear(hoje.getFullYear() + 1);
      else if (periodicidade === 'semestral') dataRenovacao.setMonth(hoje.getMonth() + 6);
      else dataRenovacao.setMonth(hoje.getMonth() + 1);

      const modulos = planoId === 'enterprise' ? ['all'] : (MODULOS_POR_PLANO[planoId] || MODULOS_POR_PLANO.profissional);

      // Verifica se já existe assinatura para este e-mail
      const existentes = await base44.asServiceRole.entities.AssinaturaCliente.filter({ user_email: email });
      
      if (existentes.length > 0) {
        // Atualiza assinatura existente
        await base44.asServiceRole.entities.AssinaturaCliente.update(existentes[0].id, {
          plano: NOMES_PLANO[planoId],
          status: 'Ativa',
          modulos_contratados: modulos,
          data_inicio: hoje.toISOString().slice(0, 10),
          data_renovacao: dataRenovacao.toISOString().slice(0, 10),
          stripe_subscription_id: stripeSubId,
          stripe_customer_id: stripeCustomerId,
          valor_mensal: VALORES_MENSAIS[planoId] || 0,
          empresa_nome: empresaNome,
          empresa_cnpj: empresaCnpj,
          responsavel_nome: responsavelNome,
        });
        console.log('Assinatura atualizada para:', email);
      } else {
        // Cria nova assinatura
        await base44.asServiceRole.entities.AssinaturaCliente.create({
          user_email: email,
          plano: NOMES_PLANO[planoId],
          status: 'Ativa',
          modulos_contratados: modulos,
          data_inicio: hoje.toISOString().slice(0, 10),
          data_renovacao: dataRenovacao.toISOString().slice(0, 10),
          stripe_subscription_id: stripeSubId,
          stripe_customer_id: stripeCustomerId,
          valor_mensal: VALORES_MENSAIS[planoId] || 0,
          empresa_nome: empresaNome,
          empresa_cnpj: empresaCnpj,
          responsavel_nome: responsavelNome,
        });
        console.log('Nova assinatura criada para:', email);
      }

      // Envia e-mail de boas-vindas com link de acesso
      const appUrl = Deno.env.get('APP_URL') || 'https://app.base44.com';
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject: `✅ Bem-vindo ao Lumi ERP — Plano ${NOMES_PLANO[planoId]}!`,
        body: `
Olá, ${responsavelNome || 'cliente'}!

Seu pagamento foi confirmado e sua assinatura do Lumi ERP (Plano ${NOMES_PLANO[planoId]}) está ativa. 🎉

Para acessar o sistema, siga os passos abaixo:

1. Acesse: ${appUrl}/register
2. Cadastre-se com este e-mail: ${email}
3. Confirme sua conta pelo e-mail de verificação
4. Faça login e aproveite todos os módulos do seu plano!

📋 Resumo da sua assinatura:
• Plano: ${NOMES_PLANO[planoId]}
• Periodicidade: ${periodicidade}
• Renovação: ${dataRenovacao.toLocaleDateString('pt-BR')}
• Empresa: ${empresaNome}

Se precisar de ajuda, responda este e-mail.

Atenciosamente,
Equipe Lumi ERP
        `.trim(),
      });

      console.log('E-mail de boas-vindas enviado para:', email);
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      const customerId = sub.customer;

      const existentes = await base44.asServiceRole.entities.AssinaturaCliente.filter({ stripe_customer_id: customerId });
      for (const ass of existentes) {
        await base44.asServiceRole.entities.AssinaturaCliente.update(ass.id, { status: 'Cancelada' });
      }
      console.log('Assinatura cancelada para customer:', customerId);
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      const customerId = invoice.customer;

      const existentes = await base44.asServiceRole.entities.AssinaturaCliente.filter({ stripe_customer_id: customerId });
      for (const ass of existentes) {
        await base44.asServiceRole.entities.AssinaturaCliente.update(ass.id, { status: 'Suspensa' });
      }
      console.log('Assinatura suspensa por falha de pagamento, customer:', customerId);
    }

    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object;
      const customerId = invoice.customer;
      const sub = invoice.subscription;

      // Reativa se estava suspensa e renova data
      const existentes = await base44.asServiceRole.entities.AssinaturaCliente.filter({ stripe_customer_id: customerId });
      for (const ass of existentes) {
        if (ass.status === 'Suspensa') {
          const novaRenovacao = new Date();
          novaRenovacao.setMonth(novaRenovacao.getMonth() + 1);
          await base44.asServiceRole.entities.AssinaturaCliente.update(ass.id, {
            status: 'Ativa',
            data_renovacao: novaRenovacao.toISOString().slice(0, 10),
          });
          console.log('Assinatura reativada para customer:', customerId);
        }
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Erro no webhook:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});