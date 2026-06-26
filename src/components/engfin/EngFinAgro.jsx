import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { fmt, fmtPct, fmtNum } from "./EngFinUtils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Wheat, TrendingUp, TrendingDown, Zap, Loader2, Star } from "lucide-react";
import { calcSafra } from "../agro/AgroUtils";

export default function EngFinAgro() {
  const [safras, setSafras] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [receitas, setReceitas] = useState([]);
  const [financiamentos, setFinanciamentos] = useState([]);
  const [investimentos, setInvestimentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [parecerGeral, setParecerGeral] = useState("");
  const [loadingParecer, setLoadingParecer] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.Safra.list(),
      base44.entities.DespesaAgricola.list(),
      base44.entities.ReceitaAgricola.list(),
      base44.entities.FinanciamentoAgricola.list(),
      base44.entities.InvestimentoAgricola.list(),
    ]).then(([s, d, r, f, i]) => { setSafras(s); setDespesas(d); setReceitas(r); setFinanciamentos(f); setInvestimentos(i); setLoading(false); });
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;

  const safrasCalc = safras.map(s => ({ ...s, ...calcSafra(s, despesas, receitas) }));
  const totalReceita = safrasCalc.reduce((a, s) => a + s.receitaBruta, 0);
  const totalCusto = safrasCalc.reduce((a, s) => a + s.custoTotal, 0);
  const totalLucro = safrasCalc.reduce((a, s) => a + s.lucro, 0);
  const margemGeral = totalReceita > 0 ? (totalLucro / totalReceita) * 100 : 0;
  const totalArea = safrasCalc.reduce((a, s) => a + (s.area_plantada || 0), 0);
  const custoPorHaGeral = totalArea > 0 ? totalCusto / totalArea : 0;
  const melhorSafra = [...safrasCalc].sort((a, b) => b.margem - a.margem)[0];
  const divida = financiamentos.filter(f => f.status === "Ativo").reduce((s, f) => s + (f.valor_contratado || 0), 0);
  const investTotal = investimentos.reduce((s, i) => s + (i.valor || 0), 0);

  // Por cultura
  const porCultura = safrasCalc.reduce((acc, s) => {
    if (!acc[s.cultura]) acc[s.cultura] = { receita: 0, custo: 0, lucro: 0 };
    acc[s.cultura].receita += s.receitaBruta;
    acc[s.cultura].custo += s.custoTotal;
    acc[s.cultura].lucro += s.lucro;
    return acc;
  }, {});
  const chartCultura = Object.entries(porCultura).map(([name, v]) => ({ name, ...v, margem: v.receita > 0 ? (v.lucro / v.receita) * 100 : 0 }));

  const gerarParecer = async () => {
    setLoadingParecer(true);
    const topSafras = safrasCalc.slice(0, 5).map(s => `${s.nome}: receita R$${s.receitaBruta.toFixed(0)}, custo R$${s.custoTotal.toFixed(0)}, lucro R$${s.lucro.toFixed(0)}, margem ${s.margem.toFixed(1)}%`).join("; ");
    const prompt = `
      Você é um especialista em gestão agrícola e engenharia financeira rural.
      Analise os dados de safras e emita um parecer estratégico em português.
      
      Resumo financeiro agrícola:
      - Receita total: R$ ${totalReceita.toFixed(0)}
      - Custo total: R$ ${totalCusto.toFixed(0)}
      - Lucro total: R$ ${totalLucro.toFixed(0)}
      - Margem média: ${margemGeral.toFixed(1)}%
      - Custo médio/ha: R$ ${custoPorHaGeral.toFixed(0)}
      - Dívida rural ativa: R$ ${divida.toFixed(0)}
      - Total investido: R$ ${investTotal.toFixed(0)}
      - Melhor safra: ${melhorSafra?.nome || "N/A"} (margem ${melhorSafra?.margem?.toFixed(1) || 0}%)
      
      Safras: ${topSafras || "Nenhuma cadastrada"}
      
      Emita um parecer de 5 a 7 linhas contendo:
      1. Diagnóstico geral da rentabilidade agrícola
      2. Melhor e pior desempenho identificado
      3. Riscos (financiamento, custo/ha, clima, etc.)
      4. Recomendações estratégicas
      Seja preciso e direto.
    `;
    const res = await base44.integrations.Core.InvokeLLM({ prompt });
    setParecerGeral(res);
    setLoadingParecer(false);
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-card border border-border rounded-xl p-4"><p className="text-xs text-muted-foreground mb-1">Receita Agrícola</p><p className="text-xl font-bold text-green-400">{fmt(totalReceita)}</p></div>
        <div className="bg-card border border-border rounded-xl p-4"><p className="text-xs text-muted-foreground mb-1">Custo Agrícola</p><p className="text-xl font-bold text-red-400">{fmt(totalCusto)}</p></div>
        <div className="bg-card border border-border rounded-xl p-4"><p className="text-xs text-muted-foreground mb-1">Lucro Agrícola</p><p className={`text-xl font-bold ${totalLucro >= 0 ? "text-green-400" : "text-red-400"}`}>{fmt(totalLucro)}</p></div>
        <div className="bg-card border border-border rounded-xl p-4"><p className="text-xs text-muted-foreground mb-1">Margem Média</p><p className={`text-xl font-bold ${margemGeral >= 20 ? "text-green-400" : "text-yellow-400"}`}>{fmtPct(margemGeral)}</p></div>
        <div className="bg-card border border-border rounded-xl p-4"><p className="text-xs text-muted-foreground mb-1">Custo Médio/ha</p><p className="text-xl font-bold text-blue-400">{fmt(custoPorHaGeral)}</p></div>
      </div>

      {/* Melhor safra */}
      {melhorSafra && (
        <div className="bg-primary border border-green-500/30 rounded-xl p-4 flex items-center gap-4">
          <Star size={20} className="text-yellow-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Melhor Safra: {melhorSafra.nome}</p>
            <p className="text-xs text-muted-foreground">Margem {fmtPct(melhorSafra.margem)} · Lucro {fmt(melhorSafra.lucro)} · Cultura: {melhorSafra.cultura}</p>
          </div>
        </div>
      )}

      {/* Por cultura */}
      {chartCultura.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Rentabilidade por Cultura</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartCultura}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={v => typeof v === "number" && v > 100 ? fmt(v) : fmtPct(v)} />
              <Bar dataKey="receita" name="Receita" fill="hsl(142 71% 45%)" radius={[4,4,0,0]} />
              <Bar dataKey="custo" name="Custo" fill="hsl(0 72% 51%)" radius={[4,4,0,0]} />
              <Bar dataKey="lucro" name="Lucro" fill="hsl(217 91% 60%)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabela safras */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border"><h3 className="text-sm font-semibold text-foreground">Análise Detalhada por Safra</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/30">
              {["Safra","Cultura","Área","Receita","Custo","Lucro","Margem","Custo/ha","Prod./ha"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {safrasCalc.length === 0 && <tr><td colSpan={9} className="text-center py-8 text-muted-foreground text-sm">Nenhuma safra.</td></tr>}
              {safrasCalc.map(s => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium text-foreground">{s.nome}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.cultura}</td>
                  <td className="px-4 py-3 text-blue-400">{fmtNum(s.area_plantada)} ha</td>
                  <td className="px-4 py-3 text-green-400 font-bold">{fmt(s.receitaBruta)}</td>
                  <td className="px-4 py-3 text-red-400 font-bold">{fmt(s.custoTotal)}</td>
                  <td className="px-4 py-3 font-bold"><span className={s.lucro >= 0 ? "text-green-400" : "text-red-400"}>{fmt(s.lucro)}</span></td>
                  <td className="px-4 py-3"><span className={s.margem >= 20 ? "text-green-400" : "text-yellow-400"}>{fmtPct(s.margem)}</span></td>
                  <td className="px-4 py-3 text-muted-foreground">{fmt(s.custoPorHa)}</td>
                  <td className="px-4 py-3 text-yellow-400">{fmtNum(s.producaoPorHa, 1)} sc</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Parecer IA */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Zap size={14} className="text-primary" />Parecer Inteligente Agrícola (IA)</h3>
          <button onClick={gerarParecer} disabled={loadingParecer}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 disabled:opacity-50">
            {loadingParecer ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
            {loadingParecer ? "Analisando..." : "Gerar Parecer"}
          </button>
        </div>
        {parecerGeral ? (
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{parecerGeral}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Clique em "Gerar Parecer" para obter análise inteligente das suas safras.</p>
        )}
      </div>
    </div>
  );
}