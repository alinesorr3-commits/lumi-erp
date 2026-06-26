import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { fmt, fmtNum, fmtDate, STATUS_SAFRA, calcSafra } from "./AgroUtils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import { TrendingUp, TrendingDown, Wheat, MapPin, DollarSign, AlertTriangle, ChevronRight } from "lucide-react";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

function KPICard({ label, value, sub, color = "text-foreground", icon: Icon, iconColor }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground">{label}</p>
        {Icon && <Icon size={14} className={iconColor || "text-muted-foreground"} />}
      </div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export default function AgroDashboard({ onTabChange }) {
  const [safras, setSafras] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [receitas, setReceitas] = useState([]);
  const [fazendas, setFazendas] = useState([]);
  const [financiamentos, setFinanciamentos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Safra.list(),
      base44.entities.DespesaAgricola.list(),
      base44.entities.ReceitaAgricola.list(),
      base44.entities.Fazenda.list(),
      base44.entities.FinanciamentoAgricola.list(),
    ]).then(([s, d, r, f, fi]) => {
      setSafras(s); setDespesas(d); setReceitas(r); setFazendas(f); setFinanciamentos(fi);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-7 h-7 border-2 border-muted border-t-green-400 rounded-full animate-spin" />
    </div>
  );

  // KPIs globais
  const totalReceita = receitas.reduce((s, r) => s + (r.valor_total || 0), 0);
  const totalDespesa = despesas.reduce((s, d) => s + (d.valor_total || 0), 0);
  const lucroGlobal = totalReceita - totalDespesa;
  const margemGlobal = totalReceita > 0 ? (lucroGlobal / totalReceita) * 100 : 0;
  const areaTotal = fazendas.reduce((s, f) => s + (f.area_agricola || 0), 0);
  const safrasAtivas = safras.filter(s => s.status === "Em Andamento" || s.status === "Plantio" || s.status === "Desenvolvimento" || s.status === "Colheita");
  const divida = financiamentos.filter(f => f.status === "Ativo").reduce((s, f) => s + (f.valor_contratado || 0), 0);

  // Gráfico receita vs custo por safra
  const chartSafras = safras.slice(0, 7).map(s => {
    const calc = calcSafra(s, despesas, receitas);
    return { name: s.nome?.length > 12 ? s.nome.slice(0, 12) + "…" : s.nome, Receita: calc.receitaBruta, Custo: calc.custoTotal, Lucro: calc.lucro };
  });

  // Pie despesas por categoria
  const catMap = despesas.reduce((acc, d) => {
    acc[d.categoria] = (acc[d.categoria] || 0) + (d.valor_total || 0);
    return acc;
  }, {});
  const pieData = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => ({ name, value }));

  // Alertas financiamentos vencendo
  const hoje = new Date();
  const em30 = new Date(); em30.setDate(hoje.getDate() + 30);
  const vencendo = financiamentos.filter(f => f.status === "Ativo" && f.data_vencimento && new Date(f.data_vencimento) <= em30);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard label="Receita Total" value={fmt(totalReceita)} color="text-green-400" icon={TrendingUp} iconColor="text-green-400" />
        <KPICard label="Custo Total" value={fmt(totalDespesa)} color="text-red-400" icon={TrendingDown} iconColor="text-red-400" />
        <KPICard label="Lucro Líquido" value={fmt(lucroGlobal)} color={lucroGlobal >= 0 ? "text-green-400" : "text-red-400"} icon={DollarSign} iconColor="text-blue-400" />
        <KPICard label="Margem Global" value={`${margemGlobal.toFixed(1)}%`} color={margemGlobal >= 20 ? "text-green-400" : "text-yellow-400"} icon={Wheat} iconColor="text-yellow-400" sub={`${safras.length} safras`} />
        <KPICard label="Área Total" value={`${fmtNum(areaTotal)} ha`} color="text-blue-400" icon={MapPin} iconColor="text-blue-400" sub={`${fazendas.length} fazendas`} />
      </div>

      {/* Gráfico principal + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Receita vs Custo por Safra</h3>
          {chartSafras.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm">
              <Wheat size={28} className="mb-2 opacity-40" />
              <p>Nenhuma safra cadastrada.</p>
              <button onClick={() => onTabChange("safras")} className="mt-2 text-primary text-xs hover:underline">Cadastrar safra</button>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartSafras} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={v => fmt(v)} />
                <Legend wrapperStyle={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }} />
                <Bar dataKey="Receita" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Custo" fill="hsl(0 72% 51%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Lucro" fill="hsl(217 91% 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Despesas por Categoria</h3>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Sem despesas registradas.</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={v => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {pieData.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-muted-foreground truncate max-w-[110px]">{item.name}</span>
                    </div>
                    <span className="text-foreground font-medium">{fmt(item.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Safras ativas + alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Safras */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Safras em Andamento</h3>
            <button onClick={() => onTabChange("safras")} className="text-xs text-primary hover:underline flex items-center gap-1">Ver todas <ChevronRight size={12} /></button>
          </div>
          {safras.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma safra cadastrada.</p>
          ) : (
            <div className="space-y-3">
              {safras.slice(0, 5).map(s => {
                const st = STATUS_SAFRA[s.status] || STATUS_SAFRA.Planejamento;
                const calc = calcSafra(s, despesas, receitas);
                const pct = calc.receitaBruta > 0 ? Math.min((calc.custoTotal / calc.receitaBruta) * 100, 100) : 0;
                return (
                  <div key={s.id} className="border border-border/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${st.bg} ${st.color}`}>{s.status}</span>
                        <p className="text-sm font-medium text-foreground">{s.nome}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{s.cultura}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Área: {fmtNum(s.area_plantada)} ha</span>
                      <span className={calc.lucro >= 0 ? "text-green-400" : "text-red-400"}>Lucro: {fmt(calc.lucro)}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div className="bg-green-500/10 h-1.5 rounded-full" style={{ width: `${100 - pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Alertas financiamentos */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Financiamentos Ativos</h3>
          {financiamentos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum financiamento cadastrado.</p>
          ) : (
            <div className="space-y-3">
              {vencendo.length > 0 && (
                <div className="bg-red-500/10/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle size={14} className="text-red-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-400">{vencendo.length} financiamento(s) vencendo em 30 dias</p>
                </div>
              )}
              {financiamentos.filter(f => f.status === "Ativo").slice(0, 4).map(f => {
                const pago = f.parcelas_total > 0 ? (f.parcelas_pagas / f.parcelas_total) * 100 : 0;
                return (
                  <div key={f.id} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-foreground font-medium">{f.linha_credito}</span>
                      <span className="text-blue-400">{fmt(f.valor_contratado)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{f.banco}</span>
                      <span>{f.parcelas_pagas}/{f.parcelas_total} parcelas · Venc: {fmtDate(f.data_vencimento)}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div className="bg-primary/10 h-1.5 rounded-full" style={{ width: `${pago}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}