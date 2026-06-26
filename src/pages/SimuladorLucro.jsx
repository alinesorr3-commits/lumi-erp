import { useState, useMemo } from "react";
import { TrendingUp, TrendingDown, DollarSign, Users, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v || 0);
const pct = (v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;

function Slider({ label, min, max, step, value, onChange, formatVal, color = "text-yellow-400" }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={`text-xs font-bold ${color}`}>{formatVal ? formatVal(value) : value}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-yellow-400"
        style={{ background: `linear-gradient(to right, hsl(38 92% 50%) ${((value - min) / (max - min)) * 100}%, hsl(var(--muted)) ${((value - min) / (max - min)) * 100}%)` }}
      />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{formatVal ? formatVal(min) : min}</span>
        <span>{formatVal ? formatVal(max) : max}</span>
      </div>
    </div>
  );
}

function AlavancaInput({ label, desc, icon: Icon, value, onChange, unit = "%" }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-green-500/10/10 flex items-center justify-center">
            <Icon size={14} className="text-green-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg px-2 py-1">
          <input
            type="number" min={0} max={100} value={value}
            onChange={e => onChange(Number(e.target.value))}
            className="w-10 bg-transparent text-sm font-bold text-foreground text-right outline-none"
          />
          <span className="text-xs text-muted-foreground">{unit}</span>
        </div>
      </div>
      <div className="w-full bg-muted rounded-full h-1.5">
        <div className="bg-green-500/10 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(value * 5, 100)}%` }} />
      </div>
    </div>
  );
}

export default function SimuladorLucro() {
  // Premissas
  const [ticket, setTicket] = useState(5000);
  const [clientes, setClientes] = useState(20);
  const [gastoFixo, setGastoFixo] = useState(25000);
  const [margem, setMargem] = useState(80);
  const [cac, setCac] = useState(1200);
  const [churn, setChurn] = useState(5);

  // Alavancas
  const [aumenTicket, setAumenTicket] = useState(10);
  const [redChurn, setRedChurn] = useState(2);
  const [corteFixo, setCorteFixo] = useState(5);

  const [showDemo, setShowDemo] = useState(false);
  const [periodoMeses, setPeriodoMeses] = useState(12);

  const MESES_OPCOES = [3, 6, 12, 18, 24, 36];

  const calc = useMemo(() => {
    const meses = periodoMeses;
    // Atual
    const mrr = ticket * clientes;
    const custVar = mrr * (1 - margem / 100);
    const lucroMensal = mrr - custVar - gastoFixo;
    const receitaAnual = mrr * meses;
    const paybackCac = lucroMensal > 0 ? Math.ceil(cac / (lucroMensal / clientes)) : 0;

    // Otimizado
    const ticketOtim = ticket * (1 + aumenTicket / 100);
    const clientesOtim = clientes * (1 + redChurn / 100);
    const gastoFixoOtim = gastoFixo * (1 - corteFixo / 100);
    const mrrOtim = ticketOtim * clientesOtim;
    const custVarOtim = mrrOtim * (1 - margem / 100);
    const lucroMensalOtim = mrrOtim - custVarOtim - gastoFixoOtim;
    const receitaAnualOtim = mrrOtim * meses;

    const lucroAdicionalMensal = lucroMensalOtim - lucroMensal;
    const impactoTotal = lucroAdicionalMensal * meses;

    // Progressão mensal
    const progressao = Array.from({ length: meses }, (_, i) => {
      const fator = 1 + (aumenTicket / 100) * (i / (meses - 1 || 1)) + (redChurn / 100) * (i / (meses - 1 || 1));
      return {
        mes: `M${i + 1}`,
        ganho: lucroAdicionalMensal * fator * ((i + 1) / meses),
      };
    });

    return {
      mrr, lucroMensal, receitaAnual, paybackCac,
      mrrOtim, lucroMensalOtim, receitaAnualOtim,
      lucroAdicionalMensal, impactoTotal, progressao,
      custVar, custVarOtim, gastoFixoOtim,
    };
  }, [ticket, clientes, gastoFixo, margem, cac, churn, aumenTicket, redChurn, corteFixo, periodoMeses]);

  const demoRows = [
    { label: "Receita Bruta Acumulada", atual: calc.receitaAnual, otim: calc.receitaAnualOtim, destaque: false },
    { label: "Custos Fixos do Período", atual: gastoFixo * periodoMeses, otim: calc.gastoFixoOtim * periodoMeses, destaque: false },
    { label: "Custos Variáveis", atual: calc.custVar * periodoMeses, otim: calc.custVarOtim * periodoMeses, destaque: false },
    { label: "Resultado Bruto (Margem)", atual: (calc.mrr - calc.custVar) * periodoMeses, otim: (calc.mrrOtim - calc.custVarOtim) * periodoMeses, destaque: false },
    { label: "Lucro Operacional Acumulado", atual: calc.lucroMensal * periodoMeses, otim: calc.lucroMensalOtim * periodoMeses, destaque: false },
    { label: "Lucro Adicional (alavancas)", atual: null, otim: calc.impactoTotal, destaque: true },
  ];

  const estrategias = [
    {
      titulo: "ESTRATÉGIA 1: ALAVANCAGEM DE TICKET",
      desc: `Foque em Upsell/Cross-sell para sua base atual. Aumentar o Ticket Médio em ${aumenTicket}% gera um acúmulo líquido de ${fmt(aumenTicket > 0 ? calc.lucroAdicionalMensal * 12 * 0.6 : 0)} sem gastar 1 real extra em marketing (CAC Zero).`,
      color: "border-green-500/30 bg-green-500/10/5",
    },
    {
      titulo: "ESTRATÉGIA 2: BLINDAGEM DE CAIXA",
      desc: `Transforme Custos Fixos em Variáveis. Reduzir gastos fixos em ${corteFixo}% protege sua operação em períodos de baixa demanda, garantindo uma economia de ${fmt(gastoFixo * corteFixo / 100 * 12)} no plano de 12 meses.`,
      color: "border-blue-500/30 bg-primary/10/5",
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">Simulador de Lucro</h1>
          <p className="text-muted-foreground text-sm mt-1">Simule cenários de receita, custo e margem para tomada de decisão</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Período:</span>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {MESES_OPCOES.map(m => (
              <button
                key={m}
                onClick={() => setPeriodoMeses(m)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all
 ${periodoMeses === m
 ? "bg-green-500/10 text-white shadow-sm"
 : "text-muted-foreground hover:text-foreground"}`}
              >
                {m}m
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Banner impacto */}
      <div className="bg-primary border border-green-500/30 rounded-2xl p-6">
        <div className="text-xs text-green-400 font-semibold mb-1 uppercase tracking-wide">IMPACTO NO PLANO DE {periodoMeses} MESES</div>
        <div className="text-4xl font-black text-foreground mb-1">{fmt(calc.impactoTotal)}</div>
        <p className="text-sm text-muted-foreground mb-5">Lucro adicional gerado através das alavancas de eficiência.</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Mensal Extra", value: `+${fmt(calc.lucroAdicionalMensal)}`, color: "text-green-400" },
            { label: "Melhoria de Margem", value: `+${aumenTicket}.0%`, color: "text-green-400" },
            { label: "MRR Atual", value: fmt(calc.mrr), color: "text-foreground" },
            { label: `Total ${periodoMeses}m Otimizado`, value: fmt(calc.receitaAnualOtim), color: "text-blue-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-background/40 rounded-xl px-4 py-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
              <p className={`text-base font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Progressão mensal */}
        <div className="mt-5">
          <p className="text-xs text-muted-foreground mb-2">PROGRESSÃO MENSAL DO GANHO</p>
          <ResponsiveContainer width="100%" height={60}>
            <BarChart data={calc.progressao} barSize={16}>
              <Bar dataKey="ganho" radius={[3, 3, 0, 0]}>
                {calc.progressao.map((_, i) => (
                  <Cell key={i} fill={`hsl(142 71% ${35 + i * 3}%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>Mês 1</span><span>Mês {periodoMeses}</span>
          </div>
        </div>
      </div>

      {/* Corpo principal */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Premissas */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Premissas Atuais do Negócio</h2>
            <p className="text-xs text-muted-foreground">Insira seus dados reais</p>
          </div>
          <Slider label="TICKET MÉDIO (R$)" min={500} max={50000} step={500} value={ticket} onChange={setTicket} formatVal={v => fmt(v)} />
          <Slider label="CARTEIRA (CLIENTES)" min={1} max={500} step={1} value={clientes} onChange={setClientes} formatVal={v => v} />
          <Slider label="GASTOS FIXOS MENSAIS (R$)" min={1000} max={200000} step={1000} value={gastoFixo} onChange={setGastoFixo} formatVal={v => fmt(v)} />
          <Slider label="MARGEM BRUTA (%)" min={10} max={99} step={1} value={margem} onChange={setMargem} formatVal={v => `${v}%`} />
          <Slider label="CUSTO AQUISIÇÃO (CAC)" min={0} max={20000} step={100} value={cac} onChange={setCac} formatVal={v => fmt(v)} />
          <Slider label="TAXA DE CANCELAMENTO (%)" min={0} max={30} step={0.5} value={churn} onChange={setChurn} formatVal={v => `${v}%`} />

          {/* Resumo atual */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
            {[
              { label: "MRR", value: fmt(calc.mrr) },
              { label: "Lucro Mensal", value: fmt(calc.lucroMensal), color: calc.lucroMensal >= 0 ? "text-green-400" : "text-red-400" },
              { label: "Receita 12m", value: fmt(calc.receitaAnual) },
              { label: "Payback CAC", value: calc.paybackCac > 0 ? `${calc.paybackCac}m` : "—" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-muted rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
                <p className={`text-sm font-bold ${color || "text-foreground"}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Alavancas + estratégias */}
        <div className="lg:col-span-3 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Alavancas de Melhoria</h2>
            <p className="text-xs text-muted-foreground">Alvos de crescimento</p>
          </div>

          <AlavancaInput
            label="Aumento Planejado de Preço (%)"
            desc="Impacto direto na margem de contribuição."
            icon={TrendingUp}
            value={aumenTicket}
            onChange={setAumenTicket}
          />
          <AlavancaInput
            label="Redução de Churn/Perda (%)"
            desc="Retenção estratégica de clientes ativos."
            icon={Users}
            value={redChurn}
            onChange={setRedChurn}
          />
          <AlavancaInput
            label="Corte de Despesas Fixas (%)"
            desc="Otimização de custos operacionais."
            icon={TrendingDown}
            value={corteFixo}
            onChange={setCorteFixo}
          />

          {/* Estratégias */}
          <div className="space-y-3 pt-2">
            {estrategias.map((e) => (
              <div key={e.titulo} className={`rounded-xl border p-4 ${e.color}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={12} className="text-green-400" />
                  <p className="text-xs font-bold text-foreground">{e.titulo}</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{e.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Demonstrativo 12 meses */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowDemo(!showDemo)}
          className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" />
            <span className="text-sm font-semibold text-foreground">DEMONSTRATIVO DE SIMULAÇÃO ({periodoMeses} MESES)</span>
          </div>
          {showDemo ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </button>
        {showDemo && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-border bg-muted/30">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">GRUPO DE CONTA</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">CENÁRIO ATUAL</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">CENÁRIO OTIMIZADO</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">DIFERENCIAL</th>
                </tr>
              </thead>
              <tbody>
                {demoRows.map((row) => {
                  const diff = (row.otim || 0) - (row.atual || 0);
                  const isPositive = diff >= 0;
                  return (
                    <tr key={row.label} className={`border-t border-border/50 ${row.destaque ? "bg-green-500/10/5" : "hover:bg-muted/20"}`}>
                      <td className={`px-5 py-3 font-medium ${row.destaque ? "text-green-400" : "text-foreground"}`}>{row.label}</td>
                      <td className="px-5 py-3 text-right text-muted-foreground">{row.atual !== null ? fmt(row.atual) : "—"}</td>
                      <td className={`px-5 py-3 text-right font-semibold ${row.destaque ? "text-green-400" : "text-foreground"}`}>{fmt(row.otim)}</td>
                      <td className={`px-5 py-3 text-right font-bold ${isPositive ? "text-green-400" : "text-red-400"}`}>
                        {row.atual !== null ? `${isPositive ? "+" : ""}${fmt(diff)}` : `+${fmt(row.otim)}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}