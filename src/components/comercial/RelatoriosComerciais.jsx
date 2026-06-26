import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const COLORS = ["hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 text-xs shadow-xl">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: {typeof p.value === "number" && p.value > 100 ? fmt(p.value) : p.value}</p>)}
    </div>
  );
};

export default function RelatoriosComerciais() {
  const [oportunidades, setOportunidades] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Oportunidade.list(),
      base44.entities.Pedido.list(),
    ]).then(([ops, peds]) => {
      setOportunidades(ops);
      setPedidos(peds);
      setLoading(false);
    });
  }, []);

  const stats = useMemo(() => {
    const totalOps = oportunidades.length;
    const ganhas = oportunidades.filter(o => o.etapa === "fechado_ganho").length;
    const perdidas = oportunidades.filter(o => o.etapa === "fechado_perdido").length;
    const taxa = totalOps > 0 ? Math.round((ganhas / totalOps) * 100) : 0;

    const receitaPedidos = pedidos
      .filter(p => p.status === "entregue" || p.status === "confirmado")
      .reduce((s, p) => s + (p.total || 0), 0);

    const porResponsavel = {};
    oportunidades.forEach(o => {
      if (o.responsavel) {
        porResponsavel[o.responsavel] = (porResponsavel[o.responsavel] || 0) + (o.valor || 0);
      }
    });

    const responsavelData = Object.entries(porResponsavel).map(([name, value]) => ({ name, value }));

    const etapaData = [
      { name: "Prospecção", value: oportunidades.filter(o => o.etapa === "prospeccao").length },
      { name: "Qualificação", value: oportunidades.filter(o => o.etapa === "qualificacao").length },
      { name: "Proposta", value: oportunidades.filter(o => o.etapa === "proposta").length },
      { name: "Negociação", value: oportunidades.filter(o => o.etapa === "negociacao").length },
      { name: "Ganhas", value: ganhas },
      { name: "Perdidas", value: perdidas },
    ].filter(e => e.value > 0);

    return { totalOps, ganhas, perdidas, taxa, receitaPedidos, responsavelData, etapaData };
  }, [oportunidades, pedidos]);

  if (loading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Total de Oportunidades</p>
          <p className="text-2xl font-bold text-foreground">{stats.totalOps}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Taxa de Conversão</p>
          <p className="text-2xl font-bold text-green-400">{stats.taxa}%</p>
          <div className="mt-2 h-1.5 bg-muted rounded-full">
            <div className="h-1.5 bg-green-400 rounded-full transition-all" style={{ width: `${stats.taxa}%` }} />
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Negócios Ganhos</p>
          <p className="text-2xl font-bold text-blue-400">{stats.ganhas}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Receita (Pedidos)</p>
          <p className="text-2xl font-bold text-green-400">{fmt(stats.receitaPedidos)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funil */}
        {stats.etapaData.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Oportunidades por Etapa</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.etapaData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 25% 15%)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "hsl(215 20% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: "hsl(215 20% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Qtd" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Por responsável */}
        {stats.responsavelData.length > 0 ? (
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Valor por Responsável</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={stats.responsavelData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {stats.responsavelData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Adicione oportunidades com responsável para ver o gráfico</p>
          </div>
        )}
      </div>

      {/* Status pedidos */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Pedidos por Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {["aberto", "confirmado", "em_producao", "entregue", "cancelado"].map(s => {
            const count = pedidos.filter(p => p.status === s).length;
            const labelMap = { aberto: "Aberto", confirmado: "Confirmado", em_producao: "Em Produção", entregue: "Entregue", cancelado: "Cancelado" };
            const colorMap = { aberto: "text-blue-400", confirmado: "text-yellow-400", em_producao: "text-yellow-400", entregue: "text-green-400", cancelado: "text-red-400" };
            return (
              <div key={s} className="text-center p-3 rounded-lg bg-muted">
                <p className={`text-2xl font-bold ${colorMap[s]}`}>{count}</p>
                <p className="text-xs text-muted-foreground mt-1">{labelMap[s]}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}