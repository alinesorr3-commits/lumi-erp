import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { fmt, fmtPct, fmtNum, consolidarDados } from "./EngFinUtils";
import { Zap, Loader2, TrendingUp, TrendingDown, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";

function Gauge({ label, value, min = 0, max = 100, good, bad, unit = "%" }) {
  const pct = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);
  const isGood = good !== undefined ? (bad < good ? value >= good : value <= good) : true;
  const color = isGood ? "text-green-400" : value === bad ? "text-red-400" : "text-yellow-400";
  const barColor = isGood ? "bg-green-500/10" : "bg-yellow-500/10";
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-xs text-muted-foreground mb-2">{label}</p>
      <p className={`text-2xl font-bold mb-2 ${color}`}>{typeof value === "number" ? (unit === "%" ? fmtPct(value) : unit === "x" ? fmtNum(value, 2) + "x" : fmt(value)) : value}</p>
      <div className="w-full bg-muted rounded-full h-1.5">
        <div className={`${barColor} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}

function StatusBadge({ ok, msg }) {
  const Icon = ok === "ok" ? CheckCircle : ok === "alerta" ? AlertTriangle : XCircle;
  const cls = ok === "ok" ? "text-green-400 bg-green-500/10/10 border-green-500/20" : ok === "alerta" ? "text-yellow-400 bg-yellow-500/10/10 border-yellow-500/20" : "text-red-400 bg-red-500/10/10 border-red-500/20";
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${cls}`}>
      <Icon size={14} /><span>{msg}</span>
    </div>
  );
}

export default function EngFinIndicadores() {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [parecer, setParecer] = useState("");
  const [loadingParecer, setLoadingParecer] = useState(false);

  useEffect(() => {
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
      setDados(consolidarDados({ lancamentos: lanc, despesasObra: despObra, materiaisObra: mat, maoObra: mao, receitasAgro: recAgro, despesasAgro: despAgro, financiamentosAgro: finAgro, investimentosAgro: invAgro, colaboradores: colab }));
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;

  const d = dados;

  const radarData = [
    { indicador: "Margem", A: Math.min(Math.max(d.margemLiquida, 0), 100) },
    { indicador: "ROI", A: Math.min(Math.max(d.roi, 0), 100) },
    { indicador: "Liquidez", A: Math.min(d.liquidez * 50, 100) },
    { indicador: "EBITDA%", A: Math.min(Math.max(d.receitaBruta > 0 ? (d.ebitda / d.receitaBruta) * 100 : 0, 0), 100) },
    { indicador: "Giro", A: Math.min(100 - d.endividamento, 100) },
    { indicador: "Capital", A: d.capitalGiro > 0 ? Math.min(50 + (d.capitalGiro / d.receitaBruta) * 50, 100) : 0 },
  ];

  const statusList = [
    { ok: d.lucroLiquido >= 0 ? "ok" : "erro", msg: d.lucroLiquido >= 0 ? `Lucro positivo: ${fmt(d.lucroLiquido)}` : `Prejuízo: ${fmt(d.lucroLiquido)}` },
    { ok: d.margemLiquida >= 15 ? "ok" : d.margemLiquida >= 5 ? "alerta" : "erro", msg: `Margem líquida: ${fmtPct(d.margemLiquida)}` },
    { ok: d.liquidez >= 1.5 ? "ok" : d.liquidez >= 1 ? "alerta" : "erro", msg: `Liquidez corrente: ${fmtNum(d.liquidez, 2)}x` },
    { ok: d.endividamento <= 40 ? "ok" : d.endividamento <= 70 ? "alerta" : "erro", msg: `Endividamento: ${fmtPct(d.endividamento)} da receita` },
    { ok: d.roi > 0 ? "ok" : "erro", msg: `ROI: ${fmtPct(d.roi)}` },
    { ok: d.capitalGiro >= 0 ? "ok" : "erro", msg: `Capital de giro: ${fmt(d.capitalGiro)}` },
  ];

  const gerarParecer = async () => {
    setLoadingParecer(true);
    const prompt = `
      Você é um consultor de finanças corporativas e engenharia financeira.
      Analise os indicadores financeiros abaixo e emita um PARECER DE SAÚDE FINANCEIRA completo.
      
      Indicadores:
      - Receita Bruta: R$ ${d.receitaBruta.toFixed(0)}
      - Lucro Líquido: R$ ${d.lucroLiquido.toFixed(0)}
      - Margem Líquida: ${d.margemLiquida.toFixed(1)}%
      - Margem Operacional: ${d.margemOperacional.toFixed(1)}%
      - EBITDA: R$ ${d.ebitda.toFixed(0)}
      - ROI: ${d.roi.toFixed(1)}%
      - Liquidez Corrente: ${d.liquidez.toFixed(2)}x
      - Endividamento: ${d.endividamento.toFixed(1)}% da receita
      - Capital de Giro: R$ ${d.capitalGiro.toFixed(0)}
      - Ponto de Equilíbrio: R$ ${d.pontoEquilibrio.toFixed(0)}
      - Total Financiado: R$ ${d.totalFinanciamentos.toFixed(0)}
      - Total Investido: R$ ${d.totalInvestimentos.toFixed(0)}
      
      Emita um parecer detalhado (8 a 12 linhas) contendo:
      1. Diagnóstico geral da saúde financeira (nota de 0 a 10)
      2. Pontos fortes identificados
      3. Gargalos e riscos financeiros
      4. Previsão de tendência (crescimento ou risco de declínio)
      5. Recomendações estratégicas prioritárias
      Use linguagem executiva profissional.
    `;
    const res = await base44.integrations.Core.InvokeLLM({ prompt, model: "claude_sonnet_4_6" });
    setParecer(res);
    setLoadingParecer(false);
  };

  return (
    <div className="space-y-6">
      {/* Status geral */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {statusList.map((s, i) => <StatusBadge key={i} ok={s.ok} msg={s.msg} />)}
      </div>

      {/* Gauges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Gauge label="Margem Líquida" value={d.margemLiquida} min={-50} max={50} good={15} bad={0} />
        <Gauge label="ROI" value={d.roi} min={-50} max={100} good={10} bad={0} />
        <Gauge label="Liquidez" value={d.liquidez} min={0} max={3} good={1.5} bad={1} unit="x" />
        <Gauge label="Endividamento" value={d.endividamento} min={0} max={150} good={40} bad={80} />
        <Gauge label="Margem EBITDA" value={d.receitaBruta > 0 ? (d.ebitda / d.receitaBruta) * 100 : 0} min={0} max={50} good={15} bad={5} />
        <Gauge label="Capital de Giro" value={d.capitalGiro > 0 ? Math.min((d.capitalGiro / d.receitaBruta) * 100, 100) : 0} min={0} max={100} good={20} bad={0} />
        <Gauge label="Margem Oper." value={d.margemOperacional} min={-30} max={50} good={15} bad={5} />
        <Gauge label="ROI s/ Invest." value={d.totalInvestimentos > 0 ? (d.lucroLiquido / d.totalInvestimentos) * 100 : 0} min={-20} max={50} good={10} bad={0} />
      </div>

      {/* Radar + Tabela indicadores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Radar de Saúde Financeira</h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="indicador" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <Radar dataKey="A" stroke="hsl(217 91% 60%)" fill="hsl(217 91% 60%)" fillOpacity={0.3} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Tabela de Indicadores</h3>
          <div className="space-y-2.5">
            {[
              { label: "Receita Bruta", val: fmt(d.receitaBruta), bench: "base" },
              { label: "Lucro Líquido", val: fmt(d.lucroLiquido), bench: d.lucroLiquido >= 0 ? "✓" : "✗" },
              { label: "EBITDA", val: fmt(d.ebitda), bench: d.ebitda > 0 ? "✓" : "✗" },
              { label: "Margem Líquida", val: fmtPct(d.margemLiquida), bench: d.margemLiquida >= 15 ? "✓ ideal ≥15%" : "⚠ mínimo 15%" },
              { label: "Margem Operacional", val: fmtPct(d.margemOperacional), bench: d.margemOperacional >= 15 ? "✓ bom" : "⚠ baixo" },
              { label: "ROI", val: fmtPct(d.roi), bench: d.roi > 0 ? "✓" : "✗" },
              { label: "Liquidez Corrente", val: fmtNum(d.liquidez, 2) + "x", bench: d.liquidez >= 1 ? "✓ ≥1x" : "✗ risco" },
              { label: "Endividamento", val: fmtPct(d.endividamento), bench: d.endividamento < 50 ? "✓ saudável" : "⚠ alto" },
              { label: "Ponto de Equilíbrio", val: fmt(d.pontoEquilibrio), bench: "receita mínima" },
              { label: "Capital de Giro", val: fmt(d.capitalGiro), bench: d.capitalGiro >= 0 ? "✓" : "✗" },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center py-2 border-b border-border/40 text-sm">
                <span className="text-muted-foreground">{row.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground/60">{row.bench}</span>
                  <span className="font-mono font-semibold text-foreground">{row.val}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Parecer IA saúde financeira */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Zap size={14} className="text-primary" />Parecer de Saúde Financeira (IA Avançada)
          </h3>
          <button onClick={gerarParecer} disabled={loadingParecer}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium disabled:opacity-50">
            {loadingParecer ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
            {loadingParecer ? "Analisando..." : "Gerar Parecer Completo"}
          </button>
        </div>
        {parecer ? (
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{parecer}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Clique para gerar análise profunda de saúde financeira com IA avançada.</p>
        )}
      </div>
    </div>
  );
}