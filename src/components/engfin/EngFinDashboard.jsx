import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { fmt, fmtPct, fmtNum, MESES, consolidarDados, seriesMensais } from "./EngFinUtils";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, LineChart, Line
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, Activity, AlertTriangle,
  BarChart2, Percent, CreditCard, Scale, Target, Zap, ChevronUp, ChevronDown
} from "lucide-react";

function KPI({ label, value, sub, color = "text-foreground", trend, icon: Icon, iconColor, size = "md" }) {
  const TrendIcon = trend === "up" ? ChevronUp : trend === "down" ? ChevronDown : null;
  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground leading-tight">{label}</p>
        {Icon && <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconColor || "bg-muted"}`}><Icon size={13} className="text-foreground/70" /></div>}
      </div>
      <p className={`${size === "lg" ? "text-2xl" : "text-xl"} font-bold ${color}`}>{value}</p>
      {sub && (
        <div className="flex items-center gap-1 mt-1">
          {TrendIcon && <TrendIcon size={11} className={trend === "up" ? "text-green-400" : "text-red-400"} />}
          <p className="text-xs text-muted-foreground">{sub}</p>
        </div>
      )}
    </div>
  );
}

function AlertBanner({ dados }) {
  const alertas = [];
  if (dados.lucroLiquido < 0) alertas.push({ msg: "Prejuízo líquido detectado", sev: "critico" });
  if (dados.margemLiquida < 10 && dados.margemLiquida >= 0) alertas.push({ msg: `Margem baixa: ${dados.margemLiquida.toFixed(1)}%`, sev: "alerta" });
  if (dados.endividamento > 80) alertas.push({ msg: `Alto endividamento: ${dados.endividamento.toFixed(0)}% da receita`, sev: "critico" });
  if (dados.liquidez < 1 && dados.liquidez > 0) alertas.push({ msg: "Liquidez corrente abaixo de 1x", sev: "alerta" });
  if (dados.capitalGiro < 0) alertas.push({ msg: "Capital de giro negativo", sev: "critico" });
  if (alertas.length === 0) return null;
  return (
    <div className="space-y-2">
      {alertas.map((a, i) => (
        <div key={i} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm ${a.sev === "critico" ? "bg-red-500/10/10 border-red-500/30 text-red-400" : "bg-yellow-500/10/10 border-yellow-500/30 text-yellow-400"}`}>
          <AlertTriangle size={14} />
          <span>{a.msg}</span>
        </div>
      ))}
    </div>
  );
}

export default function EngFinDashboard() {
  const [dados, setDados] = useState(null);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anoFiltro, setAnoFiltro] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    setLoading(true);
    Promise.all([
      base44.entities.Lancamento.list(),
      base44.entities.DespesaObra.list(),
      base44.entities.MaterialObra.list(),
      base44.entities.MaoDeObraObra.list(),
      base44.entities.ReceitaAgricola.list(),
      base44.entities.DespesaAgricola.list(),
      base44.entities.FinanciamentoAgricola.list(),
      base44.entities.InvestimentoAgricola.list(),
      base44.entities.Colaborador.list(),
    ]).then(([lanc, despObra, mat, mao, recAgro, despAgro, finAgro, invAgro, colab]) => {
      const d = consolidarDados({
        lancamentos: lanc, despesasObra: despObra, materiaisObra: mat, maoObra: mao,
        receitasAgro: recAgro, despesasAgro: despAgro, financiamentosAgro: finAgro,
        investimentosAgro: invAgro, colaboradores: colab,
      });
      setDados(d);
      setSeries(seriesMensais(lanc, recAgro, despAgro));
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">Consolidando dados financeiros...</p>
    </div>
  );

  const d = dados;

  return (
    <div className="space-y-6">
      <AlertBanner dados={d} />

      {/* KPIs primários */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Receita Bruta" value={fmt(d.receitaBruta)} color="text-green-400" icon={TrendingUp} iconColor="bg-green-500/10/10" size="lg" sub="todas as fontes" />
        <KPI label="Custos Totais" value={fmt(d.custoTotal)} color="text-red-400" icon={TrendingDown} iconColor="bg-red-500/10/10" size="lg" sub="operac. + obras + agro" />
        <KPI label="Lucro Líquido" value={fmt(d.lucroLiquido)} color={d.lucroLiquido >= 0 ? "text-green-400" : "text-red-400"} icon={DollarSign} iconColor="bg-primary/10/10" size="lg" />
        <KPI label="Margem Líquida" value={fmtPct(d.margemLiquida)} color={d.margemLiquida >= 20 ? "text-green-400" : d.margemLiquida >= 10 ? "text-yellow-400" : "text-red-400"} icon={Percent} iconColor="bg-primary/10/10" size="lg" />
      </div>

      {/* KPIs secundários */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KPI label="EBITDA" value={fmt(d.ebitda)} color="text-blue-400" icon={Activity} iconColor="bg-primary/10/10" />
        <KPI label="Capital de Giro" value={fmt(d.capitalGiro)} color={d.capitalGiro >= 0 ? "text-green-400" : "text-red-400"} icon={Scale} iconColor="bg-primary/10/10" />
        <KPI label="ROI" value={fmtPct(d.roi)} color={d.roi > 0 ? "text-green-400" : "text-red-400"} icon={Target} iconColor="bg-green-500/10/10" sub="sobre invest. total" />
        <KPI label="Endividamento" value={fmtPct(d.endividamento)} color={d.endividamento > 70 ? "text-red-400" : d.endividamento > 40 ? "text-yellow-400" : "text-green-400"} icon={CreditCard} iconColor="bg-yellow-500/10/10" sub="% da receita" />
        <KPI label="Ponto de Equil." value={fmt(d.pontoEquilibrio)} color="text-yellow-400" icon={BarChart2} iconColor="bg-yellow-500/10/10" sub="receita mínima" />
      </div>

      {/* KPIs terciários */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI label="Margem Operacional" value={fmtPct(d.margemOperacional)} color={d.margemOperacional >= 15 ? "text-green-400" : "text-yellow-400"} />
        <KPI label="Liquidez Corrente" value={fmtNum(d.liquidez, 2) + "x"} color={d.liquidez >= 1 ? "text-green-400" : "text-red-400"} sub="receita / despesa" />
        <KPI label="Total Financiado" value={fmt(d.totalFinanciamentos)} color="text-yellow-400" sub="saldo devedor ativo" />
        <KPI label="Total Investido" value={fmt(d.totalInvestimentos)} color="text-blue-400" sub="patrim. produtivo" />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Evolução mensal - área */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Zap size={14} className="text-primary" /> Evolução Financeira (12 meses)
          </h3>
          {series.length === 0 ? (
            <div className="flex items-center justify-center h-52 text-muted-foreground text-sm">Sem histórico de lançamentos.</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="gradRec" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(142 71% 45%)" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gradDesp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(0 72% 51%)" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(0 72% 51%)" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gradLuc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(217 91% 60%)" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(217 91% 60%)" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={v => fmt(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="receita" name="Receita" stroke="hsl(142 71% 45%)" fill="url(#gradRec)" strokeWidth={2} />
                <Area type="monotone" dataKey="despesa" name="Despesa" stroke="hsl(0 72% 51%)" fill="url(#gradDesp)" strokeWidth={2} />
                <Area type="monotone" dataKey="lucro" name="Lucro" stroke="hsl(217 91% 60%)" fill="url(#gradLuc)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Composição receita */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Composição Financeira</h3>
          <div className="space-y-4">
            {[
              { label: "Receita Financeiro", val: d.receitaFinanceiro, total: d.receitaBruta, color: "bg-green-500/10" },
              { label: "Receita Agronegócio", val: d.receitaAgro, total: d.receitaBruta, color: "bg-primary/10" },
              { label: "Custo Obras", val: d.custoObras, total: d.custoTotal, color: "bg-yellow-500/10" },
              { label: "Custo Agro", val: d.despesaAgro, total: d.custoTotal, color: "bg-yellow-500/10" },
              { label: "Despesas Gerais", val: d.despesaFinanceiro, total: d.custoTotal, color: "bg-red-500/10" },
            ].map(item => {
              const pct = item.total > 0 ? (item.val / item.total) * 100 : 0;
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="text-foreground font-medium">{fmt(item.val)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div className={`${item.color} h-1.5 rounded-full transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground text-right mt-0.5">{pct.toFixed(1)}%</p>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-muted rounded-lg p-2">
                <p className="text-[10px] text-muted-foreground">Lucro Operac.</p>
                <p className={`text-sm font-bold ${d.lucroOperacional >= 0 ? "text-green-400" : "text-red-400"}`}>{fmt(d.lucroOperacional)}</p>
              </div>
              <div className="bg-muted rounded-lg p-2">
                <p className="text-[10px] text-muted-foreground">Depreciação/mês</p>
                <p className="text-sm font-bold text-yellow-400">{fmt(d.depreciacao / 12)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DRE resumida no dashboard */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">DRE Resumida — Consolidado</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[
            { label: "Receita Bruta", val: d.receitaBruta, indent: 0, bold: true, color: "text-green-400" },
            { label: "  (-) Custos Operacionais", val: -d.custoTotal, indent: 1, color: "text-red-400" },
            { label: "Lucro Operacional (EBIT)", val: d.lucroOperacional, indent: 0, bold: true, color: d.lucroOperacional >= 0 ? "text-blue-400" : "text-red-400" },
            { label: "  (+) Depreciação (EBITDA)", val: d.ebitda - d.lucroOperacional, indent: 1, color: "text-muted-foreground" },
            { label: "EBITDA", val: d.ebitda, indent: 0, bold: true, color: "text-blue-400" },
            { label: "  (-) Depreciação/mês", val: -(d.depreciacao / 12), indent: 1, color: "text-yellow-400" },
            { label: "Lucro Líquido", val: d.lucroLiquido, indent: 0, bold: true, color: d.lucroLiquido >= 0 ? "text-green-400" : "text-red-400" },
          ].map((row, i) => (
            <div key={i} className={`flex justify-between items-center py-2 border-b border-border/50 ${row.bold ? "font-bold" : ""}`}>
              <span className={`text-sm ${row.indent ? "pl-4 text-muted-foreground" : "text-foreground"}`}>{row.label}</span>
              <span className={`text-sm font-mono ${row.color || "text-foreground"}`}>{fmt(row.val)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}