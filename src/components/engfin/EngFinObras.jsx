import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { fmt, fmtPct, fmtNum } from "./EngFinUtils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Building2, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Zap, Loader2 } from "lucide-react";

function calcObra(obra, materiais, mao, despesas, negociacoes) {
  const mat = materiais.filter(m => m.obra_id === obra.id).reduce((s, m) => s + (m.valor_total || 0), 0);
  const mo = mao.filter(m => m.obra_id === obra.id).reduce((s, m) => s + (m.valor_total || 0), 0);
  const desp = despesas.filter(d => d.obra_id === obra.id).reduce((s, d) => s + (d.valor || 0), 0);
  const recNeg = negociacoes.filter(n => n.obra_id === obra.id && n.classificacao === "Recebimento").reduce((s, n) => s + (n.valor || 0), 0);
  const custo = mat + mo + desp;
  const receita = recNeg || obra.valor_contrato || 0;
  const lucro = receita - custo;
  const margem = receita > 0 ? (lucro / receita) * 100 : 0;
  return { mat, mo, desp, custo, receita, lucro, margem };
}

function saudeObra(calc) {
  if (calc.margem >= 25) return { label: "Rentável", color: "text-green-400", bg: "bg-green-500/10/10", icon: CheckCircle };
  if (calc.margem >= 10) return { label: "Atenção", color: "text-yellow-400", bg: "bg-yellow-500/10/10", icon: AlertTriangle };
  if (calc.lucro < 0) return { label: "Prejuízo", color: "text-red-400", bg: "bg-red-500/10/10", icon: AlertTriangle };
  return { label: "Risco", color: "text-yellow-400", bg: "bg-yellow-500/10/10", icon: AlertTriangle };
}

export default function EngFinObras() {
  const [obras, setObras] = useState([]);
  const [materiais, setMateriais] = useState([]);
  const [mao, setMao] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [negociacoes, setNegociacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pareceres, setPareceres] = useState({});
  const [loadingParecer, setLoadingParecer] = useState({});

  useEffect(() => {
    Promise.all([
      base44.entities.Obra.list(),
      base44.entities.MaterialObra.list(),
      base44.entities.MaoDeObraObra.list(),
      base44.entities.DespesaObra.list(),
      base44.entities.NegociacaoObra.list(),
    ]).then(([o, m, mo, d, n]) => { setObras(o); setMateriais(m); setMao(mo); setDespesas(d); setNegociacoes(n); setLoading(false); });
  }, []);

  const gerarParecer = async (obra, calc) => {
    setLoadingParecer(p => ({ ...p, [obra.id]: true }));
    const prompt = `
      Você é um especialista em engenharia financeira de obras de construção civil.
      Analise os dados financeiros desta obra e emita um parecer executivo em português brasileiro.
      
      Obra: ${obra.nome}
      Cliente: ${obra.cliente || "não informado"}
      Status: ${obra.status}
      Área: ${obra.endereco || ""}
      
      Dados financeiros:
      - Valor do contrato: R$ ${calc.receita.toFixed(2)}
      - Total de materiais: R$ ${calc.mat.toFixed(2)}
      - Mão de obra: R$ ${calc.mo.toFixed(2)}
      - Outras despesas: R$ ${calc.desp.toFixed(2)}
      - Custo total: R$ ${calc.custo.toFixed(2)}
      - Lucro estimado: R$ ${calc.lucro.toFixed(2)}
      - Margem de lucro: ${calc.margem.toFixed(1)}%
      
      Emita um parecer de 4 a 6 linhas com:
      1. Diagnóstico da saúde financeira da obra
      2. Pontos de risco ou atenção
      3. Sugestões práticas de melhoria
      Seja direto e objetivo.
    `;
    const res = await base44.integrations.Core.InvokeLLM({ prompt });
    setPareceres(p => ({ ...p, [obra.id]: res }));
    setLoadingParecer(p => ({ ...p, [obra.id]: false }));
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;

  const obras_calc = obras.map(o => ({ ...o, calc: calcObra(o, materiais, mao, despesas, negociacoes) }));
  const totalReceita = obras_calc.reduce((s, o) => s + o.calc.receita, 0);
  const totalCusto = obras_calc.reduce((s, o) => s + o.calc.custo, 0);
  const totalLucro = obras_calc.reduce((s, o) => s + o.calc.lucro, 0);
  const margemGeral = totalReceita > 0 ? (totalLucro / totalReceita) * 100 : 0;

  const chartData = obras_calc.map(o => ({
    name: o.nome?.length > 10 ? o.nome.slice(0, 10) + "…" : o.nome,
    Receita: o.calc.receita, Custo: o.calc.custo, Lucro: o.calc.lucro
  }));

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4"><p className="text-xs text-muted-foreground mb-1">Receita Total Obras</p><p className="text-xl font-bold text-green-400">{fmt(totalReceita)}</p></div>
        <div className="bg-card border border-border rounded-xl p-4"><p className="text-xs text-muted-foreground mb-1">Custo Total Obras</p><p className="text-xl font-bold text-red-400">{fmt(totalCusto)}</p></div>
        <div className="bg-card border border-border rounded-xl p-4"><p className="text-xs text-muted-foreground mb-1">Lucro Total</p><p className={`text-xl font-bold ${totalLucro >= 0 ? "text-green-400" : "text-red-400"}`}>{fmt(totalLucro)}</p></div>
        <div className="bg-card border border-border rounded-xl p-4"><p className="text-xs text-muted-foreground mb-1">Margem Geral</p><p className={`text-xl font-bold ${margemGeral >= 20 ? "text-green-400" : "text-yellow-400"}`}>{fmtPct(margemGeral)}</p></div>
      </div>

      {/* Gráfico */}
      {chartData.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Resultado Financeiro por Obra</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={v => fmt(v)} />
              <Bar dataKey="Receita" fill="hsl(142 71% 45%)" radius={[4,4,0,0]} />
              <Bar dataKey="Custo" fill="hsl(0 72% 51%)" radius={[4,4,0,0]} />
              <Bar dataKey="Lucro" fill="hsl(217 91% 60%)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Cards por obra */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Análise Individual por Obra</h3>
        {obras_calc.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma obra cadastrada.</p>}
        {obras_calc.map(o => {
          const saude = saudeObra(o.calc);
          const SIcon = saude.icon;
          return (
            <div key={o.id} className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center"><Building2 size={16} className="text-muted-foreground" /></div>
                  <div>
                    <p className="font-semibold text-foreground">{o.nome}</p>
                    <p className="text-xs text-muted-foreground">{o.cliente} · {o.status}</p>
                  </div>
                </div>
                <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${saude.bg} ${saude.color}`}>
                  <SIcon size={11} />{saude.label}
                </span>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
                {[
                  { l: "Contrato", v: fmt(o.calc.receita), c: "text-green-400" },
                  { l: "Materiais", v: fmt(o.calc.mat), c: "text-red-400" },
                  { l: "Mão de Obra", v: fmt(o.calc.mo), c: "text-yellow-400" },
                  { l: "Despesas", v: fmt(o.calc.desp), c: "text-yellow-400" },
                  { l: "Lucro", v: fmt(o.calc.lucro), c: o.calc.lucro >= 0 ? "text-green-400" : "text-red-400" },
                  { l: "Margem", v: fmtPct(o.calc.margem), c: o.calc.margem >= 20 ? "text-green-400" : "text-yellow-400" },
                ].map(item => (
                  <div key={item.l} className="bg-muted rounded-lg p-2 text-center">
                    <p className="text-muted-foreground mb-0.5">{item.l}</p>
                    <p className={`font-bold ${item.c}`}>{item.v}</p>
                  </div>
                ))}
              </div>

              {/* Barra composição custos */}
              {o.calc.custo > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Composição do custo</p>
                  <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                    <div className="bg-primary/10" style={{ width: `${(o.calc.mat / o.calc.custo) * 100}%` }} title={`Materiais: ${fmtPct(o.calc.mat / o.calc.custo * 100)}`} />
                    <div className="bg-yellow-500/10" style={{ width: `${(o.calc.mo / o.calc.custo) * 100}%` }} title={`Mão de obra: ${fmtPct(o.calc.mo / o.calc.custo * 100)}`} />
                    <div className="bg-yellow-500/10" style={{ width: `${(o.calc.desp / o.calc.custo) * 100}%` }} title={`Despesas: ${fmtPct(o.calc.desp / o.calc.custo * 100)}`} />
                  </div>
                  <div className="flex gap-4 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-primary/10 rounded-full inline-block" />Mat. {fmtPct(o.calc.mat / o.calc.custo * 100)}</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-500/10 rounded-full inline-block" />M.O. {fmtPct(o.calc.mo / o.calc.custo * 100)}</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-500/10 rounded-full inline-block" />Desp. {fmtPct(o.calc.desp / o.calc.custo * 100)}</span>
                  </div>
                </div>
              )}

              {/* Parecer IA */}
              <div className="pt-2 border-t border-border">
                {pareceres[o.id] ? (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2"><Zap size={12} className="text-primary" /><span className="text-xs font-semibold text-foreground">Parecer IA</span></div>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{pareceres[o.id]}</p>
                  </div>
                ) : (
                  <button onClick={() => gerarParecer(o, o.calc)} disabled={loadingParecer[o.id]}
                    className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors disabled:opacity-50">
                    {loadingParecer[o.id] ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                    {loadingParecer[o.id] ? "Gerando parecer..." : "Gerar Parecer Inteligente (IA)"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}