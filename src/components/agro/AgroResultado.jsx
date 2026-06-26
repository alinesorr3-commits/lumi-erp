import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { fmt, fmtNum, STATUS_SAFRA, calcSafra } from "./AgroUtils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Wheat, Percent } from "lucide-react";

function MetricCard({ label, value, sub, color, icon: Icon }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground">{label}</p>
        {Icon && <Icon size={14} className={color} />}
      </div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AgroResultado() {
  const [safras, setSafras] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [receitas, setReceitas] = useState([]);
  const [safraFoco, setSafraFoco] = useState("todas");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Safra.list(),
      base44.entities.DespesaAgricola.list(),
      base44.entities.ReceitaAgricola.list(),
    ]).then(([s, d, r]) => { setSafras(s); setDespesas(d); setReceitas(r); setLoading(false); });
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-muted border-t-green-400 rounded-full animate-spin" /></div>;

  // Calcula por safra
  const safrasCalc = safras.map(s => ({ ...s, ...calcSafra(s, despesas, receitas) }));

  const foco = safraFoco === "todas" ? null : safrasCalc.find(s => s.id === safraFoco);
  const lista = foco ? [foco] : safrasCalc;

  // Agregado
  const totalReceita = lista.reduce((s, o) => s + o.receitaBruta, 0);
  const totalCusto = lista.reduce((s, o) => s + o.custoTotal, 0);
  const totalLucro = lista.reduce((s, o) => s + o.lucro, 0);
  const margemMedia = totalReceita > 0 ? (totalLucro / totalReceita) * 100 : 0;
  const totalArea = lista.reduce((s, o) => s + (o.area_plantada || 0), 0);
  const custoPorHaMedia = totalArea > 0 ? totalCusto / totalArea : 0;
  const producaoMedia = lista.length > 0 ? lista.reduce((s, o) => s + (o.producaoPorHa || 0), 0) / lista.length : 0;

  // Gráfico por safra
  const chartData = safrasCalc.map(s => ({
    name: s.nome?.length > 12 ? s.nome.slice(0, 12) + "…" : s.nome,
    Receita: s.receitaBruta,
    Custo: s.custoTotal,
    Lucro: s.lucro,
    Margem: s.margem,
  }));

  // Breakdown de custos
  const catMap = (foco ? foco.despSafra : despesas).reduce((acc, d) => {
    acc[d.categoria] = (acc[d.categoria] || 0) + (d.valor_total || 0);
    return acc;
  }, {});
  const catList = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  const totalCatSum = catList.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="space-y-6">
      {/* Filtro */}
      <div className="flex items-center gap-3">
        <label className="text-xs text-muted-foreground">Safra:</label>
        <select value={safraFoco} onChange={e => setSafraFoco(e.target.value)}
          className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground">
          <option value="todas">Consolidado Geral</option>
          {safras.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
        </select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <MetricCard label="Receita Bruta" value={fmt(totalReceita)} color="text-green-400" icon={TrendingUp} />
        <MetricCard label="Custo Total" value={fmt(totalCusto)} color="text-red-400" icon={TrendingDown} />
        <MetricCard label="Lucro Líquido" value={fmt(totalLucro)} color={totalLucro >= 0 ? "text-green-400" : "text-red-400"} icon={DollarSign} />
        <MetricCard label="Margem" value={`${margemMedia.toFixed(1)}%`} color={margemMedia >= 20 ? "text-green-400" : "text-yellow-400"} icon={Percent} />
        <MetricCard label="Custo/ha" value={fmt(custoPorHaMedia)} color="text-blue-400" icon={Wheat} sub="média por hectare" />
        <MetricCard label="Prod./ha" value={`${fmtNum(producaoMedia, 1)} sc`} color="text-yellow-400" icon={Wheat} sub="média das safras" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Gráfico */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Resultado por Safra</h3>
          {chartData.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Sem dados.</p> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={v => fmt(v)} />
                <Bar dataKey="Receita" fill="hsl(142 71% 45%)" radius={[4,4,0,0]} />
                <Bar dataKey="Custo" fill="hsl(0 72% 51%)" radius={[4,4,0,0]} />
                <Bar dataKey="Lucro" fill="hsl(217 91% 60%)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Breakdown de custos */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Composição dos Custos</h3>
          {catList.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Sem despesas registradas.</p> : (
            <div className="space-y-2.5">
              {catList.map(([cat, val]) => {
                const pct = totalCatSum > 0 ? (val / totalCatSum) * 100 : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-foreground">{cat}</span>
                      <div className="flex gap-3">
                        <span className="text-muted-foreground">{pct.toFixed(1)}%</span>
                        <span className="font-bold text-red-400">{fmt(val)}</span>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div className="bg-red-500/10 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              <div className="pt-2 border-t border-border flex justify-between text-sm font-bold">
                <span className="text-foreground">Total</span>
                <span className="text-red-400">{fmt(totalCatSum)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabela comparativa safras */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Comparativo Detalhado por Safra</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/30">
              {["Safra", "Cultura", "Área (ha)", "Receita", "Custo", "Lucro", "Margem", "Custo/ha", "Prod./ha", "Status"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {safrasCalc.length === 0 && <tr><td colSpan={10} className="text-center py-8 text-muted-foreground text-sm">Nenhuma safra.</td></tr>}
              {safrasCalc.map(s => {
                const st = STATUS_SAFRA[s.status] || STATUS_SAFRA.Planejamento;
                return (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium text-foreground">{s.nome}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.cultura}</td>
                    <td className="px-4 py-3 text-blue-400">{fmtNum(s.area_plantada)}</td>
                    <td className="px-4 py-3 text-green-400 font-bold">{fmt(s.receitaBruta)}</td>
                    <td className="px-4 py-3 text-red-400 font-bold">{fmt(s.custoTotal)}</td>
                    <td className="px-4 py-3 font-bold"><span className={s.lucro >= 0 ? "text-green-400" : "text-red-400"}>{fmt(s.lucro)}</span></td>
                    <td className="px-4 py-3"><span className={s.margem >= 20 ? "text-green-400" : "text-yellow-400"}>{s.margem.toFixed(1)}%</span></td>
                    <td className="px-4 py-3 text-muted-foreground">{fmt(s.custoPorHa)}</td>
                    <td className="px-4 py-3 text-yellow-400">{fmtNum(s.producaoPorHa, 1)} sc</td>
                    <td className="px-4 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full ${st.bg} ${st.color}`}>{s.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}