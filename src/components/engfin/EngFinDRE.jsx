import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { fmt, fmtPct, consolidarDados } from "./EngFinUtils";
import { FileText, Download, Zap, Loader2, BookOpen } from "lucide-react";

function LinhasDRE({ rows }) {
  return (
    <div className="space-y-0">
      {rows.map((row, i) => (
        <div key={i} className={`flex items-center justify-between py-3 border-b border-border/40 ${row.destaque ? "bg-muted/30 -mx-5 px-5" : ""}`}>
          <span className={`text-sm ${row.nivel === 0 ? "font-bold text-foreground" : row.nivel === 1 ? "pl-4 text-muted-foreground" : "pl-8 text-muted-foreground/70"} ${row.separador ? "border-t border-border pt-2" : ""}`}>
            {row.label}
          </span>
          <span className={`text-sm font-mono font-semibold ${row.cor || "text-foreground"}`}>{row.val !== undefined ? fmt(row.val) : ""}</span>
        </div>
      ))}
    </div>
  );
}

// Mapeia contas do PlanoContas para a DRE
function agruparContasDRE(contas) {
  const soma = (prefixos) => contas
    .filter(c => prefixos.some(p => c.codigo?.startsWith(p)) && (c.hierarquia_nivel ?? (c.codigo?.split(".").length - 1)) >= 2)
    .reduce((s, c) => s + (c.valor || 0), 0);

  return {
    receitaBruta: soma(["4.1"]),
    deducoes: soma(["4.2"]),
    receitasFinanceiras: soma(["4.3", "4.4"]),
    custos: soma(["5"]),
    despesasAdmin: soma(["6.1"]),
    despesasComerciais: soma(["6.2"]),
    despesasFinanceiras: soma(["6.3"]),
    depreciacao: soma(["6.4"]),
    capex: soma(["7"]),
    socios: soma(["8"]),
  };
}

export default function EngFinDRE() {
  const [dados, setDados] = useState(null);
  const [planoContas, setPlanoContas] = useState([]);
  const [usarPlano, setUsarPlano] = useState(false);
  const [loading, setLoading] = useState(true);
  const [parecerDRE, setParecerDRE] = useState("");
  const [loadingParecer, setLoadingParecer] = useState(false);
  const [periodo, setPeriodo] = useState("anual");

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
      base44.entities.PlanoContas.list("codigo"),
    ]).then(([lanc, despObra, mat, mao, recAgro, despAgro, finAgro, invAgro, colab, plano]) => {
      setDados(consolidarDados({ lancamentos: lanc, despesasObra: despObra, materiaisObra: mat, maoObra: mao, receitasAgro: recAgro, despesasAgro: despAgro, financiamentosAgro: finAgro, investimentosAgro: invAgro, colaboradores: colab }));
      setPlanoContas(plano || []);
      if (plano && plano.length > 0) setUsarPlano(true);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;

  const d = dados;
  const mult = periodo === "mensal" ? 1/12 : 1;
  const pc = agruparContasDRE(planoContas);

  // Se houver Plano de Contas cadastrado, usa os valores dele; senão usa dados consolidados
  const recBruta = usarPlano && pc.receitaBruta > 0 ? pc.receitaBruta : d.receitaBruta;
  const custos = usarPlano && (pc.custos + pc.despesasAdmin + pc.despesasComerciais + pc.despesasFinanceiras) > 0
    ? pc.custos + pc.despesasAdmin + pc.despesasComerciais + pc.despesasFinanceiras
    : d.custoTotal;
  const deducoes = usarPlano ? pc.deducoes : 0;
  const depreciacao = usarPlano && pc.depreciacao > 0 ? pc.depreciacao : d.depreciacao / 12;
  const recLiq = recBruta - deducoes;
  const ebit = recLiq - custos;
  const ebitda = ebit + depreciacao;
  const lucroLiq = ebitda - depreciacao;

  const linhas = usarPlano ? [
    { label: "RECEITAS", nivel: 0, destaque: true },
    { label: "(+) Receita Bruta de Vendas (4.1)", nivel: 1, val: pc.receitaBruta * mult, cor: "text-green-400" },
    { label: "(-) Deduções da Receita (4.2)", nivel: 1, val: -(pc.deducoes * mult), cor: "text-red-400" },
    { label: "(+) Receitas Financeiras/Outras (4.3/4.4)", nivel: 1, val: pc.receitasFinanceiras * mult, cor: "text-green-400" },
    { label: "= RECEITA LÍQUIDA", nivel: 0, val: recLiq * mult, cor: "text-green-400", destaque: true },
    { label: "CUSTOS DRE (5)", nivel: 0, destaque: true },
    { label: "(-) CMV / CSP / Insumos (5.x)", nivel: 1, val: -(pc.custos * mult), cor: "text-red-400" },
    { label: "DESPESAS DRE (6)", nivel: 0, destaque: true },
    { label: "(-) Despesas Administrativas (6.1)", nivel: 1, val: -(pc.despesasAdmin * mult), cor: "text-red-400" },
    { label: "(-) Despesas Comerciais (6.2)", nivel: 1, val: -(pc.despesasComerciais * mult), cor: "text-red-400" },
    { label: "(-) Despesas Financeiras (6.3)", nivel: 1, val: -(pc.despesasFinanceiras * mult), cor: "text-red-400" },
    { label: "= LUCRO OPERACIONAL (EBIT)", nivel: 0, val: ebit * mult, cor: ebit >= 0 ? "text-blue-400" : "text-red-400", destaque: true },
    { label: "(+) Depreciação / Amortização (6.4)", nivel: 1, val: depreciacao * mult, cor: "text-muted-foreground" },
    { label: "= EBITDA", nivel: 0, val: ebitda * mult, cor: "text-blue-400", destaque: true },
    { label: "(-) Depreciação (6.4)", nivel: 1, val: -(depreciacao * mult), cor: "text-yellow-400" },
    { label: "= LUCRO ANTES IR (LAIR)", nivel: 0, val: lucroLiq * mult * 1.05, cor: lucroLiq >= 0 ? "text-green-400" : "text-red-400" },
    { label: "(-) Estimativa IR/CSLL (15%)", nivel: 1, val: lucroLiq > 0 ? -(lucroLiq * mult * 0.15) : 0, cor: "text-red-400" },
    { label: "= LUCRO LÍQUIDO FINAL", nivel: 0, val: lucroLiq * mult, cor: lucroLiq >= 0 ? "text-green-400" : "text-red-400", destaque: true },
    { label: "SÓCIOS (8)", nivel: 0, destaque: true },
    { label: "(-) Pró-Labore + Distribuição (8.1/8.2)", nivel: 1, val: -(pc.socios * mult), cor: "text-yellow-400" },
  ] : [
    { label: "RECEITAS", nivel: 0, destaque: true },
    { label: "(+) Receita Financeiro / Vendas", nivel: 1, val: d.receitaFinanceiro * mult, cor: "text-green-400" },
    { label: "(+) Receita Agronegócio", nivel: 1, val: d.receitaAgro * mult, cor: "text-green-400" },
    { label: "= RECEITA BRUTA", nivel: 0, val: d.receitaBruta * mult, cor: "text-green-400", destaque: true },
    { label: "CUSTOS E DESPESAS", nivel: 0, destaque: true },
    { label: "(-) Custo Obras (mat. + m.o. + desp.)", nivel: 1, val: -(d.custoObras * mult), cor: "text-red-400" },
    { label: "(-) Custo Agronegócio", nivel: 1, val: -(d.despesaAgro * mult), cor: "text-red-400" },
    { label: "(-) Despesas Financeiras/Gerais", nivel: 1, val: -(d.despesaFinanceiro * mult), cor: "text-red-400" },
    { label: "= TOTAL CUSTOS", nivel: 0, val: -(d.custoTotal * mult), cor: "text-red-400", destaque: true },
    { label: "RESULTADO OPERACIONAL", nivel: 0, destaque: true },
    { label: "= LUCRO OPERACIONAL (EBIT)", nivel: 0, val: d.lucroOperacional * mult, cor: d.lucroOperacional >= 0 ? "text-blue-400" : "text-red-400", destaque: true },
    { label: "(+) Depreciação / Amortização", nivel: 1, val: (d.depreciacao / 12) * mult, cor: "text-muted-foreground" },
    { label: "= EBITDA", nivel: 0, val: d.ebitda * mult, cor: "text-blue-400", destaque: true },
    { label: "(-) Depreciação", nivel: 1, val: -(d.depreciacao / 12) * mult, cor: "text-yellow-400" },
    { label: "= LUCRO ANTES IR (LAIR)", nivel: 0, val: d.lucroLiquido * mult * 1.05, cor: d.lucroLiquido >= 0 ? "text-green-400" : "text-red-400" },
    { label: "(-) Estimativa IR/CSLL (15%)", nivel: 1, val: d.lucroLiquido > 0 ? -(d.lucroLiquido * mult * 0.15) : 0, cor: "text-red-400" },
    { label: "= LUCRO LÍQUIDO FINAL", nivel: 0, val: d.lucroLiquido * mult, cor: d.lucroLiquido >= 0 ? "text-green-400" : "text-red-400", destaque: true },
  ];

  const exportarCSV = () => {
    const rows = [["Descrição", "Valor (R$)"]];
    linhas.filter(l => l.val !== undefined).forEach(l => rows.push([l.label.replace(/,/g, ""), (l.val || 0).toFixed(2)]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `DRE_${periodo}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const gerarParecer = async () => {
    setLoadingParecer(true);
    const prompt = `
      Analise esta DRE (Demonstrativo de Resultado do Exercício) e emita um parecer financeiro executivo.
      
      DRE (${periodo}):
      - Receita Bruta: R$ ${(d.receitaBruta * mult).toFixed(0)}
      - Total de Custos: R$ ${(d.custoTotal * mult).toFixed(0)}
      - Lucro Operacional (EBIT): R$ ${(d.lucroOperacional * mult).toFixed(0)}
      - EBITDA: R$ ${(d.ebitda * mult).toFixed(0)}
      - Lucro Líquido: R$ ${(d.lucroLiquido * mult).toFixed(0)}
      - Margem Operacional: ${d.margemOperacional.toFixed(1)}%
      - Margem Líquida: ${d.margemLiquida.toFixed(1)}%
      - ROI: ${d.roi.toFixed(1)}%
      - Endividamento: ${d.endividamento.toFixed(1)}% da receita
      
      Emita um parecer de 5 a 8 linhas sobre:
      1. Saúde geral da empresa baseada na DRE
      2. Pontos críticos
      3. Recomendações estratégicas financeiras
      Seja objetivo e use linguagem executiva.
    `;
    const res = await base44.integrations.Core.InvokeLLM({ prompt });
    setParecerDRE(res);
    setLoadingParecer(false);
  };

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            {[["mensal", "Visão Mensal"], ["anual", "Visão Anual"]].map(([k, l]) => (
              <button key={k} onClick={() => setPeriodo(k)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${periodo === k ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {l}
              </button>
            ))}
          </div>
          {planoContas.length > 0 && (
            <button onClick={() => setUsarPlano(!usarPlano)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all
 ${usarPlano ? "bg-primary/10 text-primary border-primary/30" : "bg-muted text-muted-foreground border-border"}`}>
              <BookOpen size={12} />
              {usarPlano ? "DRE por Plano de Contas ✓" : "Usar Plano de Contas"}
            </button>
          )}
        </div>
        <button onClick={exportarCSV} className="flex items-center gap-2 px-3 py-2 bg-muted hover:bg-muted/70 text-foreground rounded-lg text-sm border border-border">
          <Download size={14} /> Exportar CSV
        </button>
      </div>
      {usarPlano && planoContas.length > 0 && (
        <div className="bg-primary/10/10 border border-blue-500/20 rounded-lg px-4 py-2 text-xs text-blue-300 flex items-center gap-2">
          <BookOpen size={12} /> DRE calculada com base nos valores do <strong>Plano de Contas</strong> (Financeiro → Plano de Contas). Edite os valores lá para atualizar a DRE.
        </div>
      )}

      {/* KPIs rápidos */}
      {(() => {
        const recBase = usarPlano ? recLiq : d.receitaBruta;
        const lucroBase = usarPlano ? lucroLiq : d.lucroLiquido;
        const ebitBase = usarPlano ? ebit : d.lucroOperacional;
        const custBase = usarPlano ? custos : d.custoTotal;
        const margemLiq = recBase > 0 ? (lucroBase / recBase) * 100 : d.margemLiquida;
        const margemOp = recBase > 0 ? (ebitBase / recBase) * 100 : d.margemOperacional;
        const roiCalc = custBase > 0 ? (lucroBase / custBase) * 100 : d.roi;
        const endivCalc = usarPlano ? (recBase > 0 ? (pc.socios / recBase) * 100 : 0) : d.endividamento;
        return (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Margem Líquida</p>
              <p className={`text-2xl font-bold ${margemLiq >= 15 ? "text-green-400" : "text-yellow-400"}`}>{fmtPct(margemLiq)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Margem Operacional</p>
              <p className={`text-2xl font-bold ${margemOp >= 15 ? "text-green-400" : "text-yellow-400"}`}>{fmtPct(margemOp)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">ROI</p>
              <p className={`text-2xl font-bold ${roiCalc > 0 ? "text-green-400" : "text-red-400"}`}>{fmtPct(roiCalc)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Endividamento</p>
              <p className={`text-2xl font-bold ${endivCalc < 50 ? "text-green-400" : "text-red-400"}`}>{fmtPct(endivCalc)}</p>
            </div>
          </div>
        );
      })()}

      {/* DRE */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-primary" />
            <h3 className="text-sm font-semibold text-foreground">DRE — Demonstrativo do Resultado {periodo === "mensal" ? "(Mensal estimado)" : "(Acumulado Geral)"}</h3>
          </div>
        </div>
        <LinhasDRE rows={linhas} />
      </div>

      {/* Parecer IA */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Zap size={14} className="text-primary" />Análise Inteligente da DRE</h3>
          <button onClick={gerarParecer} disabled={loadingParecer}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium disabled:opacity-50">
            {loadingParecer ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
            {loadingParecer ? "Analisando..." : "Analisar com IA"}
          </button>
        </div>
        {parecerDRE ? (
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{parecerDRE}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Clique em "Analisar com IA" para receber um parecer financeiro executivo baseado na DRE.</p>
        )}
      </div>
    </div>
  );
}