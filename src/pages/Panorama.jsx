import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  DollarSign, TrendingUp, TrendingDown, ShoppingCart,
  Users, Truck, HardHat, Sprout, FileText, BarChart2,
  AlertTriangle, Calendar, Shield, Bell
} from "lucide-react";
import { Link } from "react-router-dom";

const StatCard = ({ title, value, subtitle, icon: Icon, iconColor, valueColor, link }) => (
  <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all group">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-muted`}>
        <Icon size={18} className={iconColor} />
      </div>
      {link && (
        <Link to={link} className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
          Ver módulo →
        </Link>
      )}
    </div>
    <p className="text-muted-foreground text-xs font-bold mb-1">{title}</p>
    <p className={`text-2xl font-bold font-heading ${valueColor || "text-foreground"}`}>{value}</p>
    {subtitle && <p className="text-xs font-bold text-muted-foreground mt-1">{subtitle}</p>}
  </div>
);

export default function Panorama() {
  const [stats, setStats] = useState({
    saldoFinanceiro: 0,
    aReceber: 0,
    aPagar: 0,
    faturamento: 0,
    colaboradoresAtivos: 0,
    veiculosAtivos: 0,
    obrasAndamento: 0,
    safrasAtivas: 0,
    receitasTotais: 0,
    notasFiscais: 0,
  });
  const [alertas, setAlertas] = useState({ lancamentosVencidos: [], certidoesVencendo: [], tarefasUrgentes: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const hoje = new Date().toISOString().split("T")[0];
        const em30 = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

        const [lancamentos, colaboradores, certidoes, tarefas] = await Promise.all([
          base44.entities.Lancamento.list(),
          base44.entities.Colaborador.list(),
          base44.entities.Certidao.list().catch(() => []),
          base44.entities.Tarefa.list().catch(() => []),
        ]);

        // Alertas
        const lancamentosVencidos = lancamentos.filter(l =>
          l.status === "vencido" || (l.status === "pendente" && l.vencimento && l.vencimento < hoje)
        );
        const certidoesVencendo = certidoes.filter(c =>
          c.data_validade && c.data_validade <= em30
        );
        const tarefasUrgentes = tarefas.filter(t =>
          t.status !== "concluida" && t.status !== "cancelada" &&
          (t.prioridade === "Urgente" || (t.data_vencimento && t.data_vencimento <= hoje))
        );
        setAlertas({ lancamentosVencidos, certidoesVencendo, tarefasUrgentes });

        const receitas = lancamentos
          .filter(l => l.tipo === "receita" && l.status === "pago")
          .reduce((s, l) => s + (l.valor || 0), 0);

        const despesas = lancamentos
          .filter(l => l.tipo === "despesa" && l.status === "pago")
          .reduce((s, l) => s + (l.valor || 0), 0);

        const aReceber = lancamentos
          .filter(l => l.tipo === "receita" && (l.status === "pendente" || l.status === "vencido"))
          .reduce((s, l) => s + (l.valor || 0), 0);

        const aPagar = lancamentos
          .filter(l => l.tipo === "despesa" && (l.status === "pendente" || l.status === "vencido"))
          .reduce((s, l) => s + (l.valor || 0), 0);

        const colaboradoresAtivos = colaboradores.filter(c => c.status === "ativo").length;

        setStats({
          saldoFinanceiro: receitas - despesas,
          aReceber,
          aPagar,
          faturamento: receitas,
          colaboradoresAtivos,
          veiculosAtivos: 0,
          obrasAndamento: 0,
          safrasAtivas: 0,
          receitasTotais: receitas,
          notasFiscais: 0,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-heading text-foreground">Panorama Geral</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão consolidada de todos os módulos ativos</p>
      </div>

      {/* Painel de Alertas */}
      {(alertas.lancamentosVencidos.length > 0 || alertas.certidoesVencendo.length > 0 || alertas.tarefasUrgentes.length > 0) && (
        <div className="mb-6 space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Bell size={12} /> Alertas e Notificações
          </p>
          {alertas.lancamentosVencidos.length > 0 && (
            <Link to="/financeiro" className="flex items-center gap-3 bg-yellow-400 border border-yellow-500 rounded-xl px-4 py-3 hover:bg-yellow-500/10 transition-colors">
              <AlertTriangle size={16} className="text-yellow-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-yellow-500 font-bold">{alertas.lancamentosVencidos.length} lançamento(s) vencido(s)</p>
                <p className="text-xs text-yellow-500 font-bold truncate">{alertas.lancamentosVencidos.slice(0, 3).map(l => l.descricao).join(", ")}</p>
              </div>
              <span className="text-xs text-yellow-500 font-bold">Ver →</span>
            </Link>
          )}
          {alertas.certidoesVencendo.length > 0 && (
            <Link to="/certidoes" className="flex items-center gap-3 bg-yellow-400 border border-yellow-500 rounded-xl px-4 py-3 hover:bg-yellow-500/10 transition-colors">
              <Shield size={16} className="text-yellow-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-yellow-500 font-bold">{alertas.certidoesVencendo.length} certidão(ões) vencendo em 30 dias</p>
                <p className="text-xs text-yellow-500 font-bold truncate">{alertas.certidoesVencendo.slice(0, 3).map(c => c.tipo).join(", ")}</p>
              </div>
              <span className="text-xs text-yellow-500 font-bold">Ver →</span>
            </Link>
          )}
          {alertas.tarefasUrgentes.length > 0 && (
            <Link to="/calendario" className="flex items-center gap-3 bg-yellow-400 border border-yellow-500 rounded-xl px-4 py-3 hover:bg-yellow-500/10 transition-colors">
              <Calendar size={16} className="text-yellow-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-yellow-500 font-bold">{alertas.tarefasUrgentes.length} tarefa(s) urgente(s) / vencidas</p>
                <p className="text-xs text-yellow-500 font-bold truncate">{alertas.tarefasUrgentes.slice(0, 3).map(t => t.titulo).join(", ")}</p>
              </div>
              <span className="text-xs text-yellow-500 font-bold">Ver →</span>
            </Link>
          )}
        </div>
      )}

      {/* Financeiro row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <StatCard
          title="Saldo Financeiro"
          value={fmt(stats.saldoFinanceiro)}
          subtitle="Receitas − Despesas confirmadas"
          icon={DollarSign}
          iconColor="text-green-500"
          valueColor={stats.saldoFinanceiro >= 0 ? "text-green-500" : "text-yellow-600"}
          link="/financeiro"
        />
        <StatCard
          title="A Receber"
          value={fmt(stats.aReceber)}
          icon={TrendingUp}
          iconColor="text-green-500"
          valueColor="text-green-500"
          link="/financeiro"
        />
        <StatCard
          title="A Pagar"
          value={fmt(stats.aPagar)}
          icon={TrendingDown}
          iconColor="text-red-500"
          valueColor="text-red-500"
          link="/financeiro"
        />
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatCard
          title="Faturamento"
          value={fmt(stats.faturamento)}
          icon={ShoppingCart}
          iconColor="text-primary"
          valueColor="text-primary"
          link="/comercial"
        />
        <StatCard
          title="Colaboradores Ativos"
          value={stats.colaboradoresAtivos}
          icon={Users}
          iconColor="text-blue-600"
          valueColor="text-blue-600"
          link="/rh"
        />
        <StatCard
          title="Veículos Ativos"
          value={stats.veiculosAtivos}
          icon={Truck}
          iconColor="text-blue-400"
          valueColor="text-blue-400"
          link="/veiculos"
        />
        <StatCard
          title="Obras em Andamento"
          value={stats.obrasAndamento}
          icon={HardHat}
          iconColor="text-yellow-600"
          valueColor="text-yellow-600"
          link="/obras"
        />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Safras Ativas"
          value={stats.safrasAtivas}
          icon={Sprout}
          iconColor="text-green-500"
          valueColor="text-green-500"
          link="/agronegocio"
        />
        <StatCard
          title="Notas Fiscais"
          value={stats.notasFiscais}
          icon={FileText}
          iconColor="text-primary"
          valueColor="text-primary"
          link="/fiscal"
        />
        <StatCard
          title="Eng. Financeira"
          value="Ver módulo"
          icon={TrendingUp}
          iconColor="text-blue-600"
          valueColor="text-blue-600"
          link="/eng-financeira"
        />
        <StatCard
          title="Receitas Totais"
          value={fmt(stats.receitasTotais)}
          icon={BarChart2}
          iconColor="text-green-600"
          valueColor="text-green-600"
          link="/financeiro"
        />
      </div>
    </div>
  );
}