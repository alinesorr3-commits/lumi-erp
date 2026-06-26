import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const { 
      plano, 
      periodicidade = 'mensal', 
      empresa_nome, 
      empresa_cnpj, 
      responsavel_nome, 
      email, 
      modulos, 
      precoBase,
      precoAdicionais,
      nomePlano,
      origin: clientOrigin 
    } = await req.json();

    if (!plano) {
      return Response.json({ error: 'Plano inválido' }, { status: 400 });
    }
    if (!email) {
      return Response.json({ error: 'E-mail obrigatório' }, { status: 400 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const origin = clientOrigin || req.headers.get('origin') || 'https://app.base44.com';
    
    const intervalMap = {
      mensal: { interval: 'month', interval_count: 1 },
      semestral: { interval: 'month', interval_count: 6 },
      anual: { interval: 'year', interval_count: 1 }
    };
    const rec = intervalMap[periodicidade] || intervalMap.mensal;
    
    const line_items = [];
    
    // Add base plan
    if (precoBase) {
      line_items.push({
        price_data: {
          currency: 'brl',
          product_data: { name: `Plano ${nomePlano} - ERP GFE` },
          unit_amount: Math.round(precoBase * 100),
          recurring: rec,
        },
        quantity: 1,
      });
    }

    // Add additional modules
    if (precoAdicionais && precoAdicionais > 0) {
      line_items.push({
        price_data: {
          currency: 'brl',
          product_data: { name: `Módulos Adicionais Opcionais (${modulos ? modulos.length : 0})` },
          unit_amount: Math.round(precoAdicionais * 100),
          recurring: rec,
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items,
      customer_email: email,
      success_url: `${origin}/planos?sucesso=true&plano=${plano}`,
      cancel_url: `${origin}/planos?cancelado=true`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        plano,
        periodicidade,
        empresa_nome: empresa_nome || '',
        empresa_cnpj: empresa_cnpj || '',
        responsavel_nome: responsavel_nome || '',
        modulos: modulos ? JSON.stringify(modulos) : '',
      },
      subscription_data: {
        metadata: {
          plano,
          periodicidade,
          empresa_nome: empresa_nome || '',
          empresa_cnpj: empresa_cnpj || '',
        },
      },
      locale: 'pt-BR',
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Erro ao criar checkout:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});