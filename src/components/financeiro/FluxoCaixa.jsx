import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, CartesianGrid } from "recharts";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 text-xs shadow-xl">
      <p className="font-medium text-foreground mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {fmt(p.value)}</p>
      ))}
    </div>
  );
};

export default function FluxoCaixa({ lancamentos }) {
  const [periodo, setPeriodo] = useState("mes");
  const [meses, setMeses] = useState(6);

  const data = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = meses - 1; i >= 0; i--) {
      const d = subMonths(now, i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const label = format(d, "MMM/yy", { locale: ptBR });

      const entradas = lancamentos
        .filter(l => l.tipo === "receita" && l.status === "pago" && l.data_pagamento >= format(start, "yyyy-MM-dd") && l.data_pagamento <= format(end, "yyyy-MM-dd"))
        .reduce((s, l) => s + (l.valor_pago !== undefined && l.valor_pago !== null && l.valor_pago !== "" ? Number(l.valor_pago) : (Number(l.valor) || 0) + (Number(l.valor_por_fora) || 0) + (Number(l.juros_multas) || 0)), 0);

      const saidas = lancamentos
        .filter(l => l.tipo === "despesa" && l.status === "pago" && l.data_pagamento >= format(start, "yyyy-MM-dd") && l.data_pagamento <= format(end, "yyyy-MM-dd"))
        .reduce((s, l) => s + (l.valor_pago !== undefined && l.valor_pago !== null && l.valor_pago !== "" ? Number(l.valor_pago) : (Number(l.valor) || 0) + (Number(l.valor_por_fora) || 0) + (Number(l.juros_multas) || 0)), 0);

      months.push({ label, entradas, saidas, saldo: entradas - saidas });
    }
    return months;
  }, [lancamentos, meses]);

  const totalEntradas = data.reduce((s, d) => s + d.entradas, 0);
  const totalSaidas = data.reduce((s, d) => s + d.saidas, 0);
  const saldoFinal = totalEntradas - totalSaidas;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Total de Entradas</p>
          <p className="text-xl font-bold text-green-400">{fmt(totalEntradas)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Total de Saídas</p>
          <p className="text-xl font-bold text-red-400">{fmt(totalSaidas)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Saldo do Período</p>
          <p className={`text-xl font-bold ${saldoFinal >= 0 ? "text-green-400" : "text-red-400"}`}>{fmt(saldoFinal)}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">Período:</span>
        {[3, 6, 12].map(m => (
          <button
            key={m}
            onClick={() => setMeses(m)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all
 ${meses === m ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
          >
            {m} meses
          </button>
        ))}
      </div>

      {/* Bar Chart */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Entradas x Saídas por Mês</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 25% 15%)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "hsl(215 20% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(215 20% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: "hsl(215 20% 55%)" }} />
            <Bar dataKey="entradas" name="Entradas" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="saidas" name="Saídas" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Line Chart saldo */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Saldo Acumulado</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 25% 15%)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "hsl(215 20% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(215 20% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Line dataKey="saldo" name="Saldo" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ fill: "hsl(var(--chart-2))", r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}