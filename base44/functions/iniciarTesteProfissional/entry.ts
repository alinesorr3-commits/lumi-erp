import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { empresa, cnpj } = body;

    // Verifica se já possui licença
    const existing = await base44.asServiceRole.entities.LicencaCliente.filter({ user_id: user.id });
    if (existing.length > 0) {
      return Response.json({ error: 'Usuário já possui licença.' }, { status: 400 });
    }

    const dataAtivacao = new Date();
    const dataExpiracao = new Date();
    dataExpiracao.setDate(dataExpiracao.getDate() + 10);

    // Cria a licença
    await base44.asServiceRole.entities.LicencaCliente.create({
      user_email: user.email,
      user_id: user.id,
      empresa_nome: empresa || "Empresa Teste",
      plano: "Profissional",
      status: "ativa",
      chave_licenca: "TRIAL-" + Math.random().toString(36).substring(2, 10).toUpperCase(),
      data_ativacao: dataAtivacao.toISOString().split('T')[0],
      data_expiracao: dataExpiracao.toISOString().split('T')[0],
      observacoes: `Teste 10 dias. CNPJ: ${cnpj}`,
      total_acessos: 0,
      termos_aceitos: true,
      termos_aceitos_em: new Date().toISOString()
    });

    // Cria a empresa cliente para o usuário ter os dados iniciais
    await base44.entities.EmpresaCliente.create({
      razao_social: empresa || "Empresa Teste",
      cnpj: cnpj || "",
      status: "Ativo",
      plano: "Profissional",
      modulos_ativos: [
        "financeiro", "comercial", "fiscal", "rh", "veiculos", "obras",
        "agronegocio", "eng_financeira", "bens_recebidos", "simulador", "nfe", "cte_mdfe"
      ]
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});