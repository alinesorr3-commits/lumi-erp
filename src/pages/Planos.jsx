import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Check, Zap, Star, Building2, ArrowRight, X, Loader2, CheckCircle2, CreditCard, QrCode, Copy, CheckCheck, Plus } from "lucide-react";

const PLANOS = [
  {
    id: "essencial",
    nome: "Essencial",
    preco: 199.90,
    color: "border-blue-500/40",
    colorBg: "bg-primary/10/10",
    colorText: "text-blue-400",
    icon: Zap,
    destaque: false,
    modulos: [
      "Contas a pagar e receber",
      "Fluxo de caixa",
      "Conciliação manual",
      "Cadastro de clientes e fornecedores",
      "Relatórios financeiros básicos",
      "Controle de despesas e receitas",
      "Dashboard financeiro básico",
      "1 usuário",
    ],
    modulo_ids: ["financeiro", "comercial"],
  },
  {
    id: "profissional",
    nome: "Profissional",
    preco: 499.90,
    color: "border-green-500/60",
    colorBg: "bg-green-500/10/10",
    colorText: "text-green-400",
    icon: Star,
    destaque: true,
    modulos: [
      "Tudo do Essencial",
      "Emissão de NF-e, NFS-e, CT-e e MDF-e",
      "Conciliação bancária automática",
      "Integração bancária",
      "Controle fiscal e tributário",
      "Dashboard avançado",
      "Até 5 usuários",
    ],
    modulo_ids: ["financeiro", "comercial", "fiscal", "nfe"],
  },
  {
    id: "empresarial",
    nome: "Empresarial",
    preco: 749.90,
    color: "border-blue-500/40",
    colorBg: "bg-primary/10/10",
    colorText: "text-blue-400",
    icon: Building2,
    destaque: false,
    modulos: [
      "Tudo do Profissional",
      "Integração eSocial e PGDAS-D",
      "Integração SERPRO",
      "Captura automática de docs fiscais",
      "Backup automático em nuvem e local",
      "IA para análise financeira e fiscal",
      "Auditoria de lançamentos",
      "Usuários ilimitados",
    ],
    modulo_ids: ["all"],
  },
  {
    id: "corporativo",
    nome: "Corporativo",
    preco: "Sob consulta",
    color: "border-gray-500/40",
    colorBg: "bg-gray-500/10",
    colorText: "text-gray-400",
    icon: Building2,
    destaque: false,
    modulos: [
      "Usuários e empresas ilimitadas",
      "Servidores dedicados",
      "Suporte prioritário",
      "Customizações exclusivas",
    ],
    modulo_ids: ["all"],
    sobConsulta: true
  }
];

const MODULOS_ADICIONAIS = [
  { id: "mod_eng_fin", nome: "Engenharia Financeira", preco: 99.90 },
  { id: "mod_obras", nome: "Gestão de Obras", preco: 149.90 },
  { id: "mod_agro", nome: "Gestão Agro e Safras", preco: 149.90 },
  { id: "mod_bi", nome: "BI Avançado", preco: 99.90 },
  { id: "mod_ia", nome: "IA Premium", preco: 79.90 },
  { id: "mod_assinatura", nome: "Assinatura Digital", preco: 49.90 },
];

const PERIODICIDADES = [
  { id: "mensal",    label: "Mensal",    desc: "Cobrado mensalmente",         desconto: null, mult: 1 },
  { id: "semestral", label: "Semestral", desc: "Cobrado a cada 6 meses",      desconto: "14% off", mult: 6 * 0.86 },
  { id: "anual",     label: "Anual",     desc: "Cobrado anualmente",          desconto: "20% off", mult: 12 * 0.80 },
];

const PRECOS = {
  essencial:       { mensal: 199.90,  semestral: 199.90 * 6 * 0.86, anual: 199.90 * 12 * 0.80 },
  profissional:    { mensal: 499.90,  semestral: 499.90 * 6 * 0.86, anual: 499.90 * 12 * 0.80 },
  empresarial:     { mensal: 749.90,  semestral: 749.90 * 6 * 0.86, anual: 749.90 * 12 * 0.80 },
};

const DADOS_BANCARIOS = {
  banco: "Nu Pagamentos S.A. (Nubank) — Banco 260",
  agencia: "0001",
  conta: "333167936-8",
  titular: "LUMI ERP TECNOLOGIA LTDA",
  cnpj: "65.397.388/0001-51",
  pix_chave: "65.397.388/0001-51",
  pix_tipo: "CNPJ",
};

function CopiarBtn({ texto }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = () => {
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  };
  return (
    <button onClick={copiar} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors ml-2">
      {copiado ? <CheckCheck size={12} className="text-green-400" /> : <Copy size={12} />}
      {copiado ? "Copiado!" : "Copiar"}
    </button>
  );
}

function ModalCheckout({ plano, onClose }) {
  const [form, setForm] = useState({ empresa_nome: "", empresa_cnpj: "", responsavel_nome: "", email: "" });
  const [periodicidade, setPeriodicidade] = useState("mensal");
  const [formaPag, setFormaPag] = useState("online"); // "online" | "pix"
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [modulosAdicionais, setModulosAdicionais] = useState([]);

  if (plano.sobConsulta) {
    return (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl p-6 text-center">
          <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">Plano Corporativo</h3>
          <p className="text-sm text-muted-foreground mb-6">Entre em contato com nossa equipe comercial para desenharmos uma proposta exclusiva para sua empresa, com usuários ilimitados e servidores dedicados.</p>
          <a href="mailto:comercial@lumierp.com.br" className="w-full flex items-center justify-center py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90">
            Falar com Consultor
          </a>
          <button onClick={onClose} className="mt-4 text-sm text-muted-foreground hover:text-foreground">Voltar</button>
        </div>
      </div>
    );
  }

  const periInfo = PERIODICIDADES.find(p => p.id === periodicidade);
  const mult = periInfo.mult;

  const precoBaseSelecionado = (PRECOS[plano.id]?.[periodicidade] || (plano.preco * mult));
  
  const valorModulosMensal = modulosAdicionais.reduce((acc, mId) => {
    const mod = MODULOS_ADICIONAIS.find(m => m.id === mId);
    return acc + (mod ? mod.preco : 0);
  }, 0);
  
  const precoModulosTotal = valorModulosMensal * mult;
  const precoSelecionado = precoBaseSelecionado + precoModulosTotal;

  const toggleModulo = (mId) => {
    setModulosAdicionais(prev => prev.includes(mId) ? prev.filter(id => id !== mId) : [...prev, mId]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");

    try { if (window.self !== window.top) { setErro("O pagamento online só funciona no app publicado, não em preview."); return; } } catch {}

    if (!form.email || !form.empresa_nome || !form.responsavel_nome) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }
    if (!form.empresa_cnpj) {
      setErro("O CNPJ da empresa é obrigatório para emissão de nota fiscal.");
      return;
    }

    setLoading(true);
    try {
      const todosModulosIds = [...plano.modulo_ids, ...modulosAdicionais];
      const res = await base44.functions.invoke("criarCheckout", {
        plano: plano.id,
        nomePlano: plano.nome,
        periodicidade,
        ...form,
        modulos: todosModulosIds,
        precoBase: precoBaseSelecionado,
        precoAdicionais: precoModulosTotal,
        origin: window.location.origin,
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        setErro(res.data?.error || "Erro ao gerar link de pagamento.");
      }
    } catch (err) {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b border-border rounded-t-2xl ${plano.colorBg}`}>
          <div>
            <p className="text-xs text-muted-foreground">Assinar plano</p>
            <h3 className={`text-lg font-bold ${plano.colorText}`}>{plano.nome}</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4">
          
          {/* Módulos Adicionais */}
          {plano.id !== "corporativo" && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Módulos Adicionais Opcionais</label>
              <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                {MODULOS_ADICIONAIS.map(m => (
                  <label key={m.id} className="flex items-center justify-between p-2 rounded-lg border border-border bg-muted/30 cursor-pointer hover:bg-muted transition-colors">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="rounded border-muted-foreground/30" checked={modulosAdicionais.includes(m.id)} onChange={() => toggleModulo(m.id)} />
                      <span className="text-xs font-medium text-foreground">{m.nome}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">+ R$ {m.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/mês</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Periodicidade */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Periodicidade de cobrança</label>
            <div className="grid grid-cols-3 gap-2">
              {PERIODICIDADES.map(p => (
                <button key={p.id} type="button" onClick={() => setPeriodicidade(p.id)}
                  className={`relative flex flex-col items-center py-3 px-2 rounded-xl border text-xs font-medium transition-all
 ${periodicidade === p.id
 ? `${plano.colorBg} ${plano.colorText} border-current`
                      : "bg-muted border-border text-muted-foreground hover:text-foreground"}`}>
                  {p.desconto && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-green-500/10 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      {p.desconto}
                    </span>
                  )}
                  <span className="font-semibold">{p.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-3 bg-muted rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{periInfo?.desc}</p>
                {periodicidade !== "mensal" && (
                  <p className="text-[10px] text-green-400 mt-0.5">
                    ≈ R$ {(precoSelecionado / (periodicidade === "semestral" ? 6 : 12)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/mês
                  </p>
                )}
              </div>
              <p className={`text-xl font-black ${plano.colorText}`}>
                R$ {precoSelecionado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Forma de pagamento (Boleto Removido) */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Forma de Pagamento</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "online", icon: CreditCard, label: "Cartão", sub: "Crédito / Débito" },
                { id: "pix",    icon: QrCode,     label: "PIX",    sub: "Instantâneo" },
              ].map(fp => {
                const Icon = fp.icon;
                return (
                  <button key={fp.id} type="button" onClick={() => setFormaPag(fp.id)}
                    className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border text-xs font-medium transition-all
 ${formaPag === fp.id
 ? `${plano.colorBg} ${plano.colorText} border-current`
                        : "bg-muted border-border text-muted-foreground hover:text-foreground"}`}>
                    <Icon size={16} />
                    <span className="font-semibold">{fp.label}</span>
                    <span className="text-[10px] opacity-70">{fp.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PIX Manual */}
          {formaPag === "pix" && (
            <div className="bg-green-500/10/5 border border-green-500/20 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-green-400 uppercase tracking-wider">Dados para PIX</p>
              <div className="space-y-2">
                {[
                  { label: "Chave PIX (CNPJ)", valor: DADOS_BANCARIOS.pix_chave },
                  { label: "Titular", valor: DADOS_BANCARIOS.titular },
                  { label: "Banco", valor: DADOS_BANCARIOS.banco },
                  { label: "Valor", valor: `R$ ${precoSelecionado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-semibold text-foreground">{item.valor}</p>
                    </div>
                    <CopiarBtn texto={item.valor} />
                  </div>
                ))}
              </div>
              <div className="bg-green-500/10/10 rounded-lg p-3 text-xs text-green-300">
                ✅ Após o pagamento, envie o comprovante para <strong>contato@lumierp.com.br</strong> com seu e-mail e plano escolhido. Ativaremos o acesso em até 1 hora útil.
              </div>
            </div>
          )}

          {/* Cartão Online */}
          {formaPag === "online" && (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Nome da Empresa *</label>
                <input type="text" placeholder="Ex: Minha Empresa Ltda" value={form.empresa_nome}
                  onChange={e => setForm(f => ({ ...f, empresa_nome: e.target.value }))}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary" required />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">CNPJ da Empresa *</label>
                <input type="text" placeholder="00.000.000/0000-00" value={form.empresa_cnpj}
                  onChange={e => setForm(f => ({ ...f, empresa_cnpj: e.target.value }))}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary" required />
                <p className="text-[10px] text-muted-foreground mt-1">Necessário para emissão de nota fiscal</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Responsável *</label>
                <input type="text" placeholder="Nome completo" value={form.responsavel_nome}
                  onChange={e => setForm(f => ({ ...f, responsavel_nome: e.target.value }))}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary" required />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">E-mail para cobrança *</label>
                <input type="email" placeholder="email@empresa.com" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary" required />
              </div>

              {erro && <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{erro}</p>}

              <button type="submit" disabled={loading}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all
 ${loading ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"}
 ${plano.destaque ? "bg-green-500/10 text-white" : "bg-primary text-primary-foreground"}`}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                {loading ? "Aguarde..." : `Pagar com Cartão — R$ ${precoSelecionado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              </button>

              <p className="text-[10px] text-muted-foreground text-center">
                🔒 Pagamento seguro via Stripe. Cancele a qualquer momento.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Planos() {
  const [modalPlano, setModalPlano] = useState(null);
  const urlParams = new URLSearchParams(window.location.search);
  const sucesso = urlParams.get("sucesso") === "true";
  const cancelado = urlParams.get("cancelado") === "true";
  const planoSucesso = urlParams.get("plano");

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      {/* Sucesso */}
      {sucesso && (
        <div className="max-w-xl mx-auto mb-8 bg-green-500/10/10 border border-green-500/30 rounded-2xl p-6">
          <div className="flex items-start gap-4 mb-4">
            <CheckCircle2 size={36} className="text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-foreground text-lg">Pagamento confirmado! 🎉</p>
              <p className="text-sm text-muted-foreground mt-1">
                Você assinou o <strong className="text-green-400">Plano {planoSucesso ? PLANOS.find(p => p.id === planoSucesso)?.nome : ""}</strong> do ERP GFE.
              </p>
            </div>
          </div>
          <div className="bg-green-500/10/10 border border-green-500/20 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2">Próximos passos para acessar o sistema:</p>
            {[
              "Verifique seu e-mail — enviamos as instruções de acesso",
              "Acesse /register e cadastre-se com o mesmo e-mail usado no pagamento",
              "Confirme sua conta pelo link enviado por e-mail",
              "Faça login e todos os módulos do seu plano estarão liberados",
            ].map((passo, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-green-500/10 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                <p className="text-sm text-foreground">{passo}</p>
              </div>
            ))}
          </div>
          <a href="/register" className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-green-500/10 text-white rounded-xl font-semibold text-sm hover:bg-green-400 transition-colors">
            Criar minha conta agora →
          </a>
        </div>
      )}

      {/* Cancelado */}
      {cancelado && (
        <div className="max-w-xl mx-auto mb-8 bg-yellow-500/10/10 border border-yellow-500/30 rounded-2xl p-4 flex items-center gap-3">
          <X size={20} className="text-yellow-400 flex-shrink-0" />
          <p className="text-sm text-yellow-300">Pagamento cancelado. Escolha um plano quando quiser.</p>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs px-3 py-1.5 rounded-full mb-4 font-medium">
          <Zap size={12} /> ERP GFE — Planos e Preços
        </div>
        
        <div className="mb-6">
          <button 
            onClick={() => {
              const link = window.location.origin + '/teste-10-dias';
              navigator.clipboard.writeText(link);
              alert('Link copiado com sucesso!\n\nEnvie este link para o cliente:\n' + link);
            }} 
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 text-white rounded-lg text-sm font-bold shadow-md hover:bg-green-400 transition-colors"
          >
            📋 Copiar Link do Teste de 10 Dias
          </button>
        </div>

        <h1 className="text-4xl font-black text-foreground mb-3">Escolha seu plano</h1>
        <p className="text-muted-foreground text-base max-w-lg mx-auto">
          Sistema ERP completo para gestão empresarial. Cancele a qualquer momento.
        </p>
      </div>

      {/* Cards */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
        {PLANOS.map((plano) => {
          const Icon = plano.icon;
          return (
            <div
              key={plano.id}
              className={`relative bg-card border-2 rounded-2xl p-6 flex flex-col transition-all hover:scale-[1.02] ${plano.color} ${plano.destaque ? "shadow-xl shadow-green-500/10 scale-105 z-10" : ""}`}
            >
              {plano.destaque && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-green-500/10 text-white text-xs font-bold px-4 py-1 rounded-full shadow">
                    MAIS POPULAR
                  </span>
                </div>
              )}

              <div className={`w-10 h-10 rounded-xl ${plano.colorBg} flex items-center justify-center mb-4`}>
                <Icon size={20} className={plano.colorText} />
              </div>

              <h2 className="text-lg font-bold text-foreground mb-1">{plano.nome}</h2>

              <div className="flex items-end gap-1 mb-1">
                {plano.sobConsulta ? (
                  <span className="text-2xl font-black text-foreground">Sob consulta</span>
                ) : (
                  <>
                    <span className="text-3xl font-black text-foreground">
                      R$ {plano.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-muted-foreground text-sm mb-1">/mês</span>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                {plano.sobConsulta ? "Solução personalizada" : "Ou semestral / anual com desconto"}
              </p>

              <ul className="space-y-2 flex-1 mb-6">
                {plano.modulos.map((m) => (
                  <li key={m} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check size={14} className={`${plano.colorText} flex-shrink-0 mt-0.5`} />
                    {m}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => setModalPlano(plano)}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 mt-auto
 ${plano.destaque
 ? "bg-green-500/10 text-white"
 : `${plano.colorBg} ${plano.colorText} border border-current`
                  }`}
              >
                {plano.sobConsulta ? "Falar com Consultor" : `Assinar ${plano.nome}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Rodapé */}
      <div className="text-center mt-10 space-y-2">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><CreditCard size={12} /> Cartão de Crédito / Débito</span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><QrCode size={12} /> PIX</span>
        </div>
        <p className="text-xs text-muted-foreground">🔒 Pagamentos seguros · CNPJ 65.397.388/0001-51 · Suporte em português</p>
      </div>

      {modalPlano && (
        <ModalCheckout plano={modalPlano} onClose={() => setModalPlano(null)} />
      )}
    </div>
  );
}