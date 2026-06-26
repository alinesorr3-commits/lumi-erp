import { useState } from "react";
import { CreditCard, TrendingUp, AlertCircle, CheckCircle, Clock, DollarSign, Package, ChevronDown, ChevronUp } from "lucide-react";

const statusConfig = {
  "Ativa": { color: "text-green-400 bg-green-400/10 border-green-400/30", icon: CheckCircle, label: "Ativa" },
  "Trial": { color: "text-blue-400 bg-blue-400/10 border-blue-400/30", icon: Clock, label: "Teste Gratuito" },
  "Suspensa": { color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30", icon: AlertCircle, label: "Suspensa" },
  "Cancelada": { color: "text-red-400 bg-red-400/10 border-red-400/30", icon: AlertCircle, label: "Cancelada" },
};

const planoConfig = {
  "Básico": { color: "text-muted-foreground", bg: "bg-muted", icon: Package },
  "Profissional": { color: "text-blue-400", bg: "bg-blue-400/10", icon: CreditCard },
  "Enterprise": { color: "text-yellow-400", bg: "bg-yellow-400/10", icon: TrendingUp },
};

function AssinaturaRow({ assinatura, expanded, onToggleExpand }) {
  const statusConf = statusConfig[assinatura.status] || statusConfig["Ativa"];
  const planoConf = planoConfig[assinatura.plano] || planoConfig["Profissional"];
  const StatusIcon = statusConf.icon;
  const PlanoIcon = planoConf.icon;

  const diasRenovacao = assinatura.data_renovacao
    ? Math.ceil((new Date(assinatura.data_renovacao) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const isExpanded = expanded === assinatura.id;

  return (
    <>
      <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
        <td className="px-4 py-3">
          <p className="text-sm font-semibold text-foreground">{assinatura.empresa_nome || "Sem nome"}</p>
          <p className="text-xs text-muted-foreground">{assinatura.empresa_cnpj || "—"}</p>
        </td>
        <td className="px-4 py-3">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${planoConf.color} ${planoConf.bg}`}>
            <PlanoIcon size={12} />
            {assinatura.plano}
          </div>
        </td>
        <td className="px-4 py-3">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${statusConf.color}`}>
            <StatusIcon size={12} />
            {statusConf.label}
          </div>
        </td>
        <td className="px-4 py-3 text-right">
          {assinatura.valor_mensal > 0 && (
            <p className="text-sm font-semibold text-green-400">R$ {assinatura.valor_mensal.toLocaleString("pt-BR")}</p>
          )}
          {assinatura.valor_mensal === 0 && <p className="text-xs text-muted-foreground">—</p>}
        </td>
        <td className="px-4 py-3 text-right">
          {diasRenovacao !== null && (
            <div>
              <p className="text-sm font-semibold text-foreground">{diasRenovacao} dias</p>
              <p className="text-xs text-muted-foreground">
                {new Date(assinatura.data_renovacao).toLocaleDateString("pt-BR")}
              </p>
            </div>
          )}
          {diasRenovacao === null && <p className="text-xs text-muted-foreground">—</p>}
        </td>
        <td className="px-4 py-3 text-right">
          <button
            onClick={() => onToggleExpand(assinatura.id)}
            className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr className="border-b border-border/50">
          <td colSpan="6" className="px-4 py-4 bg-muted/20">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">E-mail do Proprietário</p>
                <p className="text-sm text-foreground">{assinatura.user_email || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Responsável</p>
                <p className="text-sm text-foreground">{assinatura.responsavel_nome || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Módulos Contratados</p>
                <p className="text-sm text-foreground font-medium text-blue-400">
                  {assinatura.modulos_contratados?.length || 0} módulos
                </p>
              </div>
              <div className="col-span-3">
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">Módulos</p>
                <div className="flex flex-wrap gap-1.5">
                  {assinatura.modulos_contratados && assinatura.modulos_contratados.length > 0 ? (
                    assinatura.modulos_contratados.map(mod => (
                      <span key={mod} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                        {mod}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Nenhum módulo contratado</p>
                  )}
                </div>
              </div>
              {assinatura.observacoes && (
                <div className="col-span-3">
                  <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Observações</p>
                  <p className="text-sm text-foreground">{assinatura.observacoes}</p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AssinaturasRelatorio({ assinaturas = [], onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroPlano, setFiltroPlano] = useState("todos");

  const assinaturasAtivas = assinaturas.filter(a => a.status === "Ativa" || a.status === "Trial");
  const assinaturaSuspensas = assinaturas.filter(a => a.status === "Suspensa");
  const assinaturaCanceladas = assinaturas.filter(a => a.status === "Cancelada");
  const receita = assinaturasAtivas.reduce((sum, a) => sum + (a.valor_mensal || 0), 0);

  let filtered = assinaturas;
  if (filtroStatus !== "todos") {
    filtered = filtered.filter(a => a.status === filtroStatus);
  }
  if (filtroPlano !== "todos") {
    filtered = filtered.filter(a => a.plano === filtroPlano);
  }

  const toggleExpand = (id) => {
    setExpanded(expanded === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Total de Assinaturas</p>
          <p className="text-3xl font-bold text-foreground">{assinaturas.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Ativas / Trial</p>
          <p className="text-3xl font-bold text-green-400">{assinaturasAtivas.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Suspensas</p>
          <p className="text-3xl font-bold text-yellow-400">{assinaturaSuspensas.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Receita Mensal (MRR)</p>
          <p className="text-2xl font-bold text-blue-400">R$ {receita.toLocaleString("pt-BR")}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <select
          value={filtroStatus}
          onChange={e => setFiltroStatus(e.target.value)}
          className="px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-primary"
        >
          <option value="todos">Todos os Status</option>
          <option value="Ativa">Ativa</option>
          <option value="Trial">Trial</option>
          <option value="Suspensa">Suspensa</option>
          <option value="Cancelada">Cancelada</option>
        </select>
        <select
          value={filtroPlano}
          onChange={e => setFiltroPlano(e.target.value)}
          className="px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-primary"
        >
          <option value="todos">Todos os Planos</option>
          <option value="Básico">Básico</option>
          <option value="Profissional">Profissional</option>
          <option value="Enterprise">Enterprise</option>
        </select>
      </div>

      {/* Tabela */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <CreditCard size={32} className="mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground text-sm">Nenhuma assinatura encontrada com os filtros aplicados</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left text-xs text-muted-foreground px-4 py-3 font-semibold uppercase">Empresa</th>
                <th className="text-left text-xs text-muted-foreground px-4 py-3 font-semibold uppercase">Plano</th>
                <th className="text-left text-xs text-muted-foreground px-4 py-3 font-semibold uppercase">Status</th>
                <th className="text-right text-xs text-muted-foreground px-4 py-3 font-semibold uppercase">Valor/Mês</th>
                <th className="text-right text-xs text-muted-foreground px-4 py-3 font-semibold uppercase">Próxima Renovação</th>
                <th className="text-right text-xs text-muted-foreground px-4 py-3 font-semibold uppercase">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(assinatura => (
                <AssinaturaRow
                  key={assinatura.id}
                  assinatura={assinatura}
                  expanded={expanded}
                  onToggleExpand={toggleExpand}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}