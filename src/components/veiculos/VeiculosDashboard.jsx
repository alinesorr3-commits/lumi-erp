import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Truck, Fuel, Wrench, AlertTriangle, DollarSign, Activity } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const statusConfig = {
  Ativo: { color: "text-green-400", bg: "bg-green-400/10" },
  Manutenção: { color: "text-yellow-400", bg: "bg-yellow-400/10" },
  Inativo: { color: "text-muted-foreground", bg: "bg-muted" },
  Vendido: { color: "text-red-400", bg: "bg-red-400/10" },
};

export default function VeiculosDashboard({ onTabChange }) {
  const [veiculos, setVeiculos] = useState([]);
  const [abastecimentos, setAbastecimentos] = useState([]);
  const [manutencoes, setManutencoes] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Veiculo.list(),
      base44.entities.AbastecimentoVeiculo.list("-data", 50),
      base44.entities.ManutencaoVeiculo.list("-data", 50),
      base44.entities.DespesaVeiculo.list("-data", 50),
    ]).then(([v, a, m, d]) => {
      setVeiculos(v); setAbastecimentos(a); setManutencoes(m); setDespesas(d);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;

  const hoje = new Date().toISOString().slice(0, 10);
  const em30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  const ativos = veiculos.filter(v => v.status === "Ativo").length;
  const emManut = veiculos.filter(v => v.status === "Manutenção").length;
  const totalAbast = abastecimentos.reduce((s, a) => s + (a.valor_total || 0), 0);
  const totalManut = manutencoes.reduce((s, m) => s + (m.valor_total || 0), 0);
  const totalDesp = despesas.reduce((s, d) => s + (d.valor || 0), 0);
  const totalGeral = totalAbast + totalManut + totalDesp;

  const alertas = veiculos.filter(v =>
    (v.vencimento_ipva && v.vencimento_ipva <= em30) ||
    (v.vencimento_seguro && v.vencimento_seguro <= em30) ||
    (v.vencimento_licenciamento && v.vencimento_licenciamento <= em30) ||
    (v.data_proxima_revisao && v.data_proxima_revisao <= em30)
  );

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button onClick={() => onTabChange("frota")} className="bg-card border border-border rounded-xl p-5 text-left hover:border-primary/30 transition-all">
          <div className="flex items-center gap-2 mb-3"><Truck size={16} className="text-blue-400" /><span className="text-xs text-muted-foreground">Veículos Ativos</span></div>
          <p className="text-2xl font-bold text-blue-400">{ativos}</p>
          <p className="text-xs text-muted-foreground mt-1">{emManut} em manutenção</p>
        </button>
        <button onClick={() => onTabChange("abastecimento")} className="bg-card border border-border rounded-xl p-5 text-left hover:border-primary/30 transition-all">
          <div className="flex items-center gap-2 mb-3"><Fuel size={16} className="text-blue-400" /><span className="text-xs text-muted-foreground">Combustível (total)</span></div>
          <p className="text-2xl font-bold text-blue-400">{fmt(totalAbast)}</p>
          <p className="text-xs text-muted-foreground mt-1">{abastecimentos.length} abastecimentos</p>
        </button>
        <button onClick={() => onTabChange("manutencao")} className="bg-card border border-border rounded-xl p-5 text-left hover:border-primary/30 transition-all">
          <div className="flex items-center gap-2 mb-3"><Wrench size={16} className="text-yellow-400" /><span className="text-xs text-muted-foreground">Manutenções (total)</span></div>
          <p className="text-2xl font-bold text-yellow-400">{fmt(totalManut)}</p>
          <p className="text-xs text-muted-foreground mt-1">{manutencoes.length} registros</p>
        </button>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3"><DollarSign size={16} className="text-red-400" /><span className="text-xs text-muted-foreground">Custo Total Frota</span></div>
          <p className="text-2xl font-bold text-red-400">{fmt(totalGeral)}</p>
          <p className="text-xs text-muted-foreground mt-1">combustível + manutenção + despesas</p>
        </div>
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="bg-yellow-500/10/5 border border-yellow-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-yellow-400" />
            <p className="text-sm font-semibold text-yellow-400">Alertas de Vencimento (próximos 30 dias)</p>
          </div>
          <div className="space-y-1">
            {alertas.map(v => (
              <div key={v.id} className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{v.placa} — {v.modelo}</span>
                {v.vencimento_ipva <= em30 && <span className="ml-2 text-yellow-400">IPVA: {v.vencimento_ipva}</span>}
                {v.vencimento_seguro <= em30 && <span className="ml-2 text-red-400">Seguro: {v.vencimento_seguro}</span>}
                {v.vencimento_licenciamento <= em30 && <span className="ml-2 text-yellow-400">Licenciamento: {v.vencimento_licenciamento}</span>}
                {v.data_proxima_revisao <= em30 && <span className="ml-2 text-blue-400">Revisão: {v.data_proxima_revisao}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Frota resumida */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={15} className="text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Status da Frota</h3>
        </div>
        {veiculos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhum veículo cadastrado. <button onClick={() => onTabChange("frota")} className="text-primary underline">Cadastrar</button></p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {veiculos.map(v => {
              const s = statusConfig[v.status] || statusConfig.Ativo;
              return (
                <div key={v.id} className={`border rounded-xl p-3 ${v.status === "Manutenção" ? "border-yellow-500/30" : "border-border"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-bold text-foreground">{v.placa}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${s.bg} ${s.color}`}>{v.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{v.marca} {v.modelo}</p>
                  {v.hodometro_atual > 0 && <p className="text-xs text-muted-foreground mt-1">{v.hodometro_atual.toLocaleString("pt-BR")} km</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}