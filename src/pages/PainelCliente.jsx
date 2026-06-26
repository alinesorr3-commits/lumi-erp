import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import {
  CheckCircle2, XCircle, DollarSign, ShoppingCart, FileText,
  Users, Truck, HardHat, Sprout, TrendingUp, BarChart2,
  Package, Calculator, Send, Crown, AlertCircle, Calendar,
  RefreshCw, Lock, Zap
} from "lucide-react";

const MODULO_MAP = {
  financeiro:     { label: "Financeiro",            icon: DollarSign,   color: "text-green-400", bg: "bg-green-500/10/10", border: "border-green-500/30", path: "/financeiro" },
  comercial:      { label: "Comercial / CRM",        icon: ShoppingCart, color: "text-blue-400",    bg: "bg-primary/10/10",    border: "border-blue-500/30",    path: "/comercial" },
  fiscal:         { label: "Fiscal & Tributário",    icon: FileText,     color: "text-yellow-400",  bg: "bg-yellow-500/10/10",  border: "border-yellow-500/30",  path: "/fiscal" },
  rh:             { label: "Recursos Humanos",       icon: Users,        color: "text-blue-400",  bg: "bg-primary/10/10",  border: "border-blue-500/30",  path: "/rh" },
  veiculos:       { label: "Veículos",               icon: Truck,        color: "text-blue-400",    bg: "bg-primary/10/10",    border: "border-blue-500/30",    path: "/veiculos" },
  obras:          { label: "Gestão de Obras",        icon: HardHat,      color: "text-yellow-400",  bg: "bg-yellow-500/10/10",  border: "border-yellow-500/30",  path: "/obras" },
  agronegocio:    { label: "Agronegócio",            icon: Sprout,       color: "text-green-400",   bg: "bg-green-500/10/10",   border: "border-green-500/30",   path: "/agronegocio" },
  eng_financeira: { label: "Eng. Financeira",        icon: TrendingUp,   color: "text-green-400",    bg: "bg-green-500/10/10",    border: "border-green-500/30",    path: "/eng-financeira" },
  bens_recebidos: { label: "Análise Balanciê",       icon: Package,      color: "text-yellow-400",   bg: "bg-yellow-500/10/10",   border: "border-yellow-500/30",   path: "/bens-recebidos" },
  tributario:     { label: "Planej. Tributário",     icon: Calculator,   color: "text-blue-400",  bg: "bg-primary/10/10",  border: "border-blue-500/30",  path: "/planejamento-tributario" },
  nfe:            { label: "Emissão NF-e / NFS-e",  icon: Send,         color: "text-red-400",     bg: "bg-red-500/10/10",     border: "border-red-500/30",     path: "/modulo-nfe" },
  simulador:      { label: "Simulador de Lucro",     icon: BarChart2,    color: "text-blue-400",  bg: "bg-primary/10/10",  border: "border-blue-500/30",  path: "/simulador" },
};

const PLANO_CONFIG = {
  "Básico":        { color: "text-blue-400",   bg: "bg-primary/10/10",   border: "border-blue-500/30",   valor: 197 },
  "Profissional":  { color: "text-green-400", bg: "bg-green-500/10/10", border: "border-green-500/30", valor: 397 },
  "Enterprise":    { color: "text-yellow-400",  bg: "bg-yellow-500/10/10", border: "border-yellow-500/30",  valor: 797 },
};

const STATUS_CONFIG = {
  "Ativa":     { color: "text-green-400", bg: "bg-green-500/10/10", icon: CheckCircle2 },
  "Trial":     { color: "text-blue-400",    bg: "bg-primary/10/10",    icon: Zap },
  "Suspensa":  { color: "text-yellow-400",  bg: "bg-yellow-500/10/10",  icon: AlertCircle },
  "Cancelada": { color: "text-red-400",     bg: "bg-red-500/10/10",     icon: XCircle },
};

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const fmtDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";

export default function PainelCliente() {
  const [user, setUser] = useState(null);
  const [assinatura, setAssinatura] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        // Busca assinatura ativa vinculada ao email do usuário
        const todas = await base44.entities.AssinaturaCliente.filter({ user_email: me.email });
        const ativa = todas.find(a => a.status === "Ativa" || a.status === "Trial") || todas[0] || null;
        setAssinatura(ativa);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-32">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Sem assinatura
  if (!assinatura) {
    return (
      <div className="p-6 lg:p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Lock size={28} className="text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Nenhuma assinatura ativa</h2>
        <p className="text-muted-foreground text-sm text-center max-w-md mb-6">
          Você ainda não possui uma assinatura ativa. Escolha um plano para começar a usar os módulos do Lumi ERP.
        </p>
        <Link to="/planos" className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors">
          <Zap size={16} /> Ver Planos e Assinar
        </Link>
      </div>
    );
  }

  const planoConf = PLANO_CONFIG[assinatura.plano] || PLANO_CONFIG["Profissional"];
  const statusConf = STATUS_CONFIG[assinatura.status] || STATUS_CONFIG["Ativa"];
  const StatusIcon = statusConf.icon;
  const modulos = assinatura.modulos_contratados || [];

  // Calcula dias para vencimento
  const diasParaVencer = assinatura.data_renovacao
    ? Math.ceil((new Date(assinatura.data_renovacao + "T00:00:00") - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-heading text-foreground">Meu Painel</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Bem-vindo, <span className="text-foreground font-medium">{user?.full_name || user?.email}</span>
        </p>
      </div>

      {/* Alerta de vencimento próximo */}
      {diasParaVencer !== null && diasParaVencer <= 7 && diasParaVencer >= 0 && (
        <div className="bg-yellow-500/10/10 border border-yellow-500/30 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-yellow-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-yellow-400">
              {diasParaVencer === 0 ? "Sua assinatura vence hoje!" : `Sua assinatura vence em ${diasParaVencer} dia${diasParaVencer > 1 ? "s" : ""}!`}
            </p>
            <p className="text-xs text-muted-foreground">Renove para não perder acesso aos módulos.</p>
          </div>
          <Link to="/planos" className="text-xs font-semibold text-yellow-400 hover:underline whitespace-nowrap">Renovar →</Link>
        </div>
      )}
      {diasParaVencer !== null && diasParaVencer < 0 && (
        <div className="bg-red-500/10/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-400">Assinatura vencida</p>
            <p className="text-xs text-muted-foreground">Renove agora para recuperar o acesso completo.</p>
          </div>
          <Link to="/planos" className="text-xs font-semibold text-red-400 hover:underline whitespace-nowrap">Renovar →</Link>
        </div>
      )}

      {/* Card da Assinatura */}
      <div className={`rounded-2xl border p-6 ${planoConf.bg} ${planoConf.border}`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${planoConf.bg} ${planoConf.color} ${planoConf.border}`}>
                Plano {assinatura.plano}
              </span>
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${statusConf.bg} ${statusConf.color}`}>
                <StatusIcon size={12} /> {assinatura.status}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Empresa</p>
                <p className="text-sm font-semibold text-foreground">{assinatura.empresa_nome || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">CNPJ</p>
                <p className="text-sm font-semibold text-foreground">{assinatura.empresa_cnpj || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Valor Mensal</p>
                <p className={`text-sm font-bold ${planoConf.color}`}>{fmt(assinatura.valor_mensal || planoConf.valor)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Próxima Renovação</p>
                <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                  <Calendar size={12} className="text-muted-foreground" />
                  {fmtDate(assinatura.data_renovacao)}
                </p>
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[10px] text-muted-foreground mb-1">Módulos contratados</p>
            <p className={`text-3xl font-black ${planoConf.color}`}>{modulos.length}</p>
            <Link to="/planos" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Fazer upgrade →
            </Link>
          </div>
        </div>
      </div>

      {/* Módulos Contratados */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-1">Seus Módulos Contratados</h2>
        <p className="text-xs text-muted-foreground mb-4">Clique em um módulo para acessá-lo</p>

        {modulos.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <Package size={28} className="mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">Nenhum módulo configurado ainda.</p>
            <p className="text-xs text-muted-foreground mt-1">Entre em contato com o suporte para ativar seus módulos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {modulos.map((key) => {
              const mod = MODULO_MAP[key];
              if (!mod) return null;
              const Icon = mod.icon;
              return (
                <Link
                  key={key}
                  to={mod.path}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all hover:scale-[1.02] hover:shadow-lg group ${mod.bg} ${mod.border}`}
                >
                  <div className={`w-9 h-9 rounded-lg bg-background/40 flex items-center justify-center flex-shrink-0`}>
                    <Icon size={18} className={mod.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${mod.color}`}>{mod.label}</p>
                    <p className="text-xs text-muted-foreground">Acessar →</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Módulos não contratados (bloqueados) */}
      {Object.keys(MODULO_MAP).some(k => !modulos.includes(k)) && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-1 flex items-center gap-2">
            <Lock size={13} /> Módulos não incluídos no seu plano
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {Object.entries(MODULO_MAP)
              .filter(([key]) => !modulos.includes(key))
              .map(([key, mod]) => {
                const Icon = mod.icon;
                return (
                  <div key={key} className="flex items-center gap-2 p-3 rounded-xl border border-border bg-muted/30 opacity-50 cursor-not-allowed">
                    <Lock size={12} className="text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground truncate">{mod.label}</span>
                  </div>
                );
              })}
          </div>
          <div className="mt-3">
            <Link to="/planos" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
              <Crown size={12} /> Fazer upgrade para desbloquear mais módulos
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}