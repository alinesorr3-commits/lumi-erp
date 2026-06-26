import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { fmt, fmtDate, seriesMensais } from "./EngFinUtils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, ReferenceLine
} from "recharts";
import { AlertTriangle, TrendingUp, TrendingDown, Wallet, Clock, CheckCircle2 } from "lucide-react";

export default function EngFinFluxo() {
  const [lancamentos, setLancamentos] = useState([]);
  const [receitasAgro, setReceitasAgro] = useState([]);
  const [despesasAgro, setDespesasAgro] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Lancamento.list("-vencimento"),
      base44.entities.ReceitaAgricola.list(),
      base44.entities.DespesaAgricola.list(),
    ]).then(([l, ra, da]) => { setLancamentos(l); setReceitasAgro(ra); setDespesasAgro(da); setLoading(false); });
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;

  const hoje = new Date();
  const em7 = new Date(); em7.setDate(hoje.getDate() + 7);
  const em30 = new Date(); em30.setDate(hoje.getDate() + 30);

  const aPagar = lancamentos.filter(l => l.tipo === "despesa" && l.status !== "pago" && l.status !== "cancelado");
  const aReceber = lancamentos.filter(l => l.tipo === "receita" && l.status !== "pago" && l.status !== "cancelado");
  const vencidosHoje = lancamentos.filter(l => l.status === "vencido");
  const vencendo7 = lancamentos.filter(l => l.status === "pendente" && l.vencimento && new Date(l.vencimento + "T00:00:00") <= em7);

  const totalPagar = aPagar.reduce((s, l) => s + (l.valor || 0), 0);
  const totalReceber = aReceber.reduce((s, l) => s + (l.valor || 0), 0);
  const saldoPrevisto = totalReceber - totalPagar;

  const series = seriesMensais(lancamentos, receitasAgro, despesasAgro);

  // Fluxo projetado: acumula saldo ao longo dos meses
  let saldoAcum = 0;
  const projetado = series.map(s => {
    saldoAcum += s.lucro;
    return { ...s, saldo: saldoAcum };
  });

  const alertas = [];
  if (saldoPrevisto < 0) alertas.push({ msg: `Saldo previsto negativo: ${fmt(saldoPrevisto)}`, sev: "critico" });
  if (vencidosHoje.length > 0) alertas.push({ msg: `${vencidosHoje.length} lançamento(s) vencido(s) em atraso`, sev: "critico" });
  if (vencendo7.length > 0) alertas.push({ msg: `${vencendo7.length} lançamento(s) vencendo em 7 dias`, sev: "alerta" });
  if (totalPagar > totalReceber * 1.3) alertas.push({ msg: "Despesas 30% acima das receitas projetadas", sev: "alerta" });

  return (
    <div className="space-y-6">
      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="space-y-2">
          {alertas.map((a, i) => (
            <div key={i} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm ${a.sev === "critico" ? "bg-red-500/10/10 border-red-500/30 text-red-400" : "bg-yellow-500/10/10 border-yellow-500/30 text-yellow-400"}`}>
              <AlertTriangle size={14} /> <span>{a.msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><TrendingUp size={14} className="text-green-400" /><p className="text-xs text-muted-foreground">A Receber</p></div>
          <p className="text-xl font-bold text-green-400">{fmt(totalReceber)}</p>
          <p className="text-xs text-muted-foreground mt-1">{aReceber.length} lançamentos</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><TrendingDown size={14} className="text-red-400" /><p className="text-xs text-muted-foreground">A Pagar</p></div>
          <p className="text-xl font-bold text-red-400">{fmt(totalPagar)}</p>
          <p className="text-xs text-muted-foreground mt-1">{aPagar.length} lançamentos</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><Wallet size={14} className="text-blue-400" /><p className="text-xs text-muted-foreground">Saldo Previsto</p></div>
          <p className={`text-xl font-bold ${saldoPrevisto >= 0 ? "text-green-400" : "text-red-400"}`}>{fmt(saldoPrevisto)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><Clock size={14} className="text-red-400" /><p className="text-xs text-muted-foreground">Em Atraso</p></div>
          <p className="text-xl font-bold text-red-400">{vencidosHoje.length}</p>
          <p className="text-xs text-muted-foreground mt-1">{fmt(vencidosHoje.reduce((s, l) => s + (l.valor || 0), 0))}</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Fluxo Mensal (Receita vs Despesa)</h3>
          {series.length === 0 ? <p className="text-sm text-muted-foreground text-center py-10">Sem dados históricos.</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={v => fmt(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="receita" name="Receita" fill="hsl(142 71% 45%)" radius={[4,4,0,0]} />
                <Bar dataKey="despesa" name="Despesa" fill="hsl(0 72% 51%)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Saldo Acumulado Projetado</h3>
          {projetado.length === 0 ? <p className="text-sm text-muted-foreground text-center py-10">Sem dados.</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={projetado}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={v => fmt(v)} />
                <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="lucro" name="Lucro Mensal" stroke="hsl(217 91% 60%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="saldo" name="Saldo Acum." stroke="hsl(142 71% 45%)" strokeWidth={2} strokeDasharray="5 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Tabela vencendo em 30 dias */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Próximos Vencimentos (30 dias)</h3>
          <span className="text-xs text-muted-foreground">{vencendo7.length} vencendo em 7 dias</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/30">
              {["Vencimento", "Descrição", "Tipo", "Valor", "Status"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {lancamentos.filter(l => l.vencimento && new Date(l.vencimento + "T00:00:00") <= em30 && l.status !== "pago").slice(0, 15).length === 0
                ? <tr><td colSpan={5} className="text-center py-6 text-muted-foreground text-sm">Nenhum vencimento próximo.</td></tr>
                : lancamentos.filter(l => l.vencimento && new Date(l.vencimento + "T00:00:00") <= em30 && l.status !== "pago").sort((a, b) => a.vencimento.localeCompare(b.vencimento)).slice(0, 15).map(l => {
                  const vence7 = new Date(l.vencimento + "T00:00:00") <= em7;
                  return (
                    <tr key={l.id} className={`border-b border-border/50 hover:bg-muted/20 ${vence7 ? "bg-red-500/10/5" : ""}`}>
                      <td className="px-4 py-3 text-muted-foreground">{fmtDate(l.vencimento)}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{l.descricao}</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${l.tipo === "receita" ? "bg-green-500/10/10 text-green-400" : "bg-red-500/10/10 text-red-400"}`}>{l.tipo}</span></td>
                      <td className="px-4 py-3 font-bold"><span className={l.tipo === "receita" ? "text-green-400" : "text-red-400"}>{fmt(l.valor)}</span></td>
                      <td className="px-4 py-3">
                        {l.status === "vencido" ? <span className="text-xs text-red-400 flex items-center gap-1"><AlertTriangle size={11} />Vencido</span>
                          : <span className="text-xs text-yellow-400 flex items-center gap-1"><Clock size={11} />Pendente</span>}
                      </td>
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