import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Calculator, Zap, TrendingUp, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const fmtPct = (v) => `${(v || 0).toFixed(2)}%`;
const round2 = (v) => Math.round((v || 0) * 100) / 100;

// Tabela Simples Nacional Anexo I (Comércio) 2018+
const SIMPLES_ANEXO_I = [
  { ate: 180000, aliq: 4, deducao: 0 },
  { ate: 360000, aliq: 7.3, deducao: 5940 },
  { ate: 720000, aliq: 9.5, deducao: 13860 },
  { ate: 1800000, aliq: 10.7, deducao: 22500 },
  { ate: 3600000, aliq: 14.3, deducao: 87300 },
  { ate: 4800000, aliq: 19, deducao: 378000 },
];
// Anexo III (Serviços com FatorR)
const SIMPLES_ANEXO_III = [
  { ate: 180000, aliq: 6, deducao: 0 },
  { ate: 360000, aliq: 11.2, deducao: 9360 },
  { ate: 720000, aliq: 13.5, deducao: 17640 },
  { ate: 1800000, aliq: 16, deducao: 35640 },
  { ate: 3600000, aliq: 21, deducao: 125640 },
  { ate: 4800000, aliq: 33, deducao: 648000 },
];
// Anexo V (Serviços sem FatorR)
const SIMPLES_ANEXO_V = [
  { ate: 180000, aliq: 15.5, deducao: 0 },
  { ate: 360000, aliq: 18, deducao: 4500 },
  { ate: 720000, aliq: 19.5, deducao: 9900 },
  { ate: 1800000, aliq: 20.5, deducao: 17100 },
  { ate: 3600000, aliq: 23, deducao: 62100 },
  { ate: 4800000, aliq: 30.5, deducao: 540000 },
];

function calcularSimples(rb_mensal, rbt12, folha12, tipo = "comercio") {
  const tabela = tipo === "comercio" ? SIMPLES_ANEXO_I
    : tipo === "servicos_anexo3" ? SIMPLES_ANEXO_III
    : SIMPLES_ANEXO_V;

  const faixa = tabela.find(f => rbt12 <= f.ate) || tabela[tabela.length - 1];
  const aliq_nominal = faixa.aliq / 100;
  const aliq_efetiva = rbt12 > 0 ? round2(((rbt12 * aliq_nominal - faixa.deducao) / rbt12) * 100) : 0;
  const das = round2(rb_mensal * aliq_efetiva / 100);
  const fatorR = folha12 > 0 && rbt12 > 0 ? round2((folha12 / rbt12) * 100) : 0;

  return {
    faixa: `Faixa ${tabela.indexOf(faixa) + 1}`,
    aliq_nominal: faixa.aliq,
    deducao: faixa.deducao,
    aliq_efetiva,
    das,
    fatorR,
    tributos_total: das,
  };
}

function calcularPresumido(rb_mensal, tipo = "misto") {
  const base_irpj_com = round2(rb_mensal * 0.08);
  const base_irpj_srv = round2(rb_mensal * 0.32);
  const base_csll_com = round2(rb_mensal * 0.12);
  const base_csll_srv = round2(rb_mensal * 0.32);

  let base_irpj, base_csll;
  if (tipo === "comercio") { base_irpj = base_irpj_com; base_csll = base_csll_com; }
  else if (tipo === "servicos") { base_irpj = base_irpj_srv; base_csll = base_csll_srv; }
  else { base_irpj = round2((base_irpj_com + base_irpj_srv) / 2); base_csll = round2((base_csll_com + base_csll_srv) / 2); }

  const irpj_base = round2(base_irpj * 0.15);
  const adicional = base_irpj > 20000 ? round2((base_irpj - 20000) * 0.10) : 0;
  const irpj = round2(irpj_base + adicional);
  const csll = round2(base_csll * 0.09);
  const pis = round2(rb_mensal * 0.0065);
  const cofins = round2(rb_mensal * 0.03);

  const tributos_total = round2(irpj + csll + pis + cofins);
  return { irpj, adicional, csll, pis, cofins, tributos_total, base_irpj, base_csll };
}

function calcularReal(rb_mensal, cmv, despesas_total) {
  const lucro_contabil = round2(rb_mensal - cmv - despesas_total);
  const lucro_real = lucro_contabil; // simplificado
  const irpj_base = lucro_real > 0 ? round2(lucro_real * 0.15) : 0;
  const adicional = lucro_real > 20000 ? round2((lucro_real - 20000) * 0.10) : 0;
  const irpj = round2(irpj_base + adicional);
  const csll = lucro_real > 0 ? round2(lucro_real * 0.09) : 0;
  const pis = round2(rb_mensal * 0.0165);
  const cofins = round2(rb_mensal * 0.076);
  // Créditos estimados
  const credito_pis_cofins = round2(cmv * (0.0165 + 0.076));
  const pis_liq = round2(Math.max(0, pis - credito_pis_cofins * 0.0165 / (0.0165 + 0.076)));
  const cofins_liq = round2(Math.max(0, cofins - credito_pis_cofins * 0.076 / (0.0165 + 0.076)));
  const tributos_total = round2(irpj + csll + pis_liq + cofins_liq);
  return { irpj, adicional, csll, pis: pis_liq, cofins: cofins_liq, credito_pis_cofins, lucro_contabil, lucro_real, tributos_total };
}

function MemoriaSection({ titulo, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-lg mb-2">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between p-3 text-left">
        <span className="text-sm font-semibold text-foreground">{titulo}</span>
        {open ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
      </button>
      {open && <div className="px-3 pb-3 space-y-1">{children}</div>}
    </div>
  );
}

const Linha = ({ label, value, highlight }) => (
  <div className={`flex justify-between text-xs py-0.5 ${highlight ? "font-bold border-t border-border pt-1 mt-1" : ""}`}>
    <span className="text-muted-foreground">{label}</span>
    <span className={highlight ? "text-foreground" : "text-muted-foreground"}>{value}</span>
  </div>
);

export default function SimuladorTributario() {
  const [form, setForm] = useState({
    receita_bruta: "",
    receita_comercio: "",
    receita_servicos: "",
    rbt12: "",
    folha12: "",
    cmv: "",
    despesas_salarios: "",
    despesas_aluguel: "",
    outras_despesas: "",
    competencia: new Date().toISOString().slice(0, 7),
  });
  const [resultado, setResultado] = useState(null);
  const [parecerLoading, setParecerLoading] = useState(false);
  const [parecer, setParecer] = useState(null);
  const [showMemoria, setShowMemoria] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const n = (v) => parseFloat(v) || 0;

  const calcular = () => {
    const rb = n(form.receita_bruta);
    const rbt12 = n(form.rbt12) || rb * 12;
    const folha12 = n(form.folha12);
    const cmv = n(form.cmv);
    const despesas = n(form.despesas_salarios) + n(form.despesas_aluguel) + n(form.outras_despesas);
    const tipoAtividade = n(form.receita_servicos) > n(form.receita_comercio) ? "servicos_anexo3" : "comercio";

    const simples = calcularSimples(rb, rbt12, folha12, tipoAtividade);
    const presumido = calcularPresumido(rb, n(form.receita_comercio) > n(form.receita_servicos) ? "comercio" : "servicos");
    const real = calcularReal(rb, cmv, despesas);

    const lucro_simples = round2(rb - cmv - despesas - simples.tributos_total);
    const lucro_presumido = round2(rb - cmv - despesas - presumido.tributos_total);
    const lucro_real = round2(rb - cmv - despesas - real.tributos_total);

    const margem_s = rb > 0 ? round2((lucro_simples / rb) * 100) : 0;
    const margem_p = rb > 0 ? round2((lucro_presumido / rb) * 100) : 0;
    const margem_r = rb > 0 ? round2((lucro_real / rb) * 100) : 0;
    const carga_s = rb > 0 ? round2((simples.tributos_total / rb) * 100) : 0;
    const carga_p = rb > 0 ? round2((presumido.tributos_total / rb) * 100) : 0;
    const carga_r = rb > 0 ? round2((real.tributos_total / rb) * 100) : 0;

    const regimes = [
      { nome: "Simples Nacional", lucro: lucro_simples, carga: carga_s, tributos: simples.tributos_total },
      { nome: "Lucro Presumido", lucro: lucro_presumido, carga: carga_p, tributos: presumido.tributos_total },
      { nome: "Lucro Real", lucro: lucro_real, carga: carga_r, tributos: real.tributos_total },
    ];
    const melhor = regimes.reduce((a, b) => a.lucro > b.lucro ? a : b);

    setResultado({
      rb, rbt12, folha12, cmv, despesas,
      simples, presumido, real,
      lucro_simples, lucro_presumido, lucro_real,
      margem_s, margem_p, margem_r,
      carga_s, carga_p, carga_r,
      melhor: melhor.nome,
    });
    setParecer(null);
  };

  const gerarParecer = async () => {
    if (!resultado) return;
    setParecerLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um especialista tributário brasileiro. Analise os dados abaixo e emita um parecer técnico completo em português.

Receita Bruta Mensal: ${fmt(resultado.rb)}
RBT12: ${fmt(resultado.rbt12)}

Simples Nacional: Tributos ${fmt(resultado.simples.tributos_total)} | Carga ${fmtPct(resultado.carga_s)} | Lucro Líquido ${fmt(resultado.lucro_simples)} | Alíq. Efetiva ${fmtPct(resultado.simples.aliq_efetiva)}
Lucro Presumido: Tributos ${fmt(resultado.presumido.tributos_total)} | Carga ${fmtPct(resultado.carga_p)} | Lucro Líquido ${fmt(resultado.lucro_presumido)}
Lucro Real: Tributos ${fmt(resultado.real.tributos_total)} | Carga ${fmtPct(resultado.carga_r)} | Lucro Líquido ${fmt(resultado.lucro_real)}

Melhor regime calculado: ${resultado.melhor}

Emita um parecer com:
1. Regime recomendado e justificativa técnica
2. Economia mensal e anual estimada vs. pior regime
3. Impacto na margem líquida
4. Riscos tributários identificados
5. Considerações sobre créditos e oportunidades

Seja objetivo, técnico e use valores numéricos. Máximo 400 palavras.`,
    });
    setParecer(res);
    setParecerLoading(false);
  };

  const salvarSimulacao = async () => {
    if (!resultado) return;
    setSalvando(true);
    await base44.entities.SimulacaoTributaria.create({
      descricao: `Simulação ${form.competencia}`,
      competencia: form.competencia,
      receita_bruta: resultado.rb,
      rbt12: resultado.rbt12,
      cmv: resultado.cmv,
      resultado_simples: resultado.simples,
      resultado_presumido: resultado.presumido,
      resultado_real: resultado.real,
      melhor_regime: resultado.melhor,
      parecer_ia: parecer || "",
      memoria_calculo: { form, resultado },
    });
    setSalvando(false);
    alert("Simulação salva com sucesso!");
  };

  return (
    <div className="space-y-6">
      {/* Formulário */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Base de Dados da Empresa</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: "Competência", field: "competencia", type: "month" },
            { label: "Receita Bruta Mensal (R$)", field: "receita_bruta", type: "number" },
            { label: "RBT12 – Receita 12 meses (R$)", field: "rbt12", type: "number" },
            { label: "Folha de Pagamento 12 meses (R$)", field: "folha12", type: "number" },
            { label: "Receita Comércio (R$)", field: "receita_comercio", type: "number" },
            { label: "Receita Serviços (R$)", field: "receita_servicos", type: "number" },
            { label: "CMV / CPV (R$)", field: "cmv", type: "number" },
            { label: "Despesas Salários (R$)", field: "despesas_salarios", type: "number" },
            { label: "Aluguel (R$)", field: "despesas_aluguel", type: "number" },
            { label: "Outras Despesas (R$)", field: "outras_despesas", type: "number" },
          ].map(({ label, field, type }) => (
            <div key={field}>
              <label className="block text-xs text-muted-foreground mb-1.5">{label}</label>
              <input type={type} step={type === "number" ? "0.01" : undefined} value={form[field]}
                onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
          ))}
        </div>
        <button onClick={calcular}
          className="mt-4 flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
          <Calculator size={16} /> Calcular e Comparar Regimes
        </button>
      </div>

      {resultado && (
        <>
          {/* Tabela comparativa */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Comparativo de Regimes Tributários</h3>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10/10 border border-green-500/20 rounded-lg">
                <CheckCircle size={14} className="text-green-400" />
                <span className="text-xs text-green-400 font-medium">Melhor: {resultado.melhor}</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Regime", "Receita Bruta", "Tributos", "Carga Trib. %", "Lucro Líquido", "Margem Líquida"].map(h => (
                      <th key={h} className="text-left text-xs text-muted-foreground px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { nome: "Simples Nacional", tributos: resultado.simples.tributos_total, carga: resultado.carga_s, lucro: resultado.lucro_simples, margem: resultado.margem_s },
                    { nome: "Lucro Presumido", tributos: resultado.presumido.tributos_total, carga: resultado.carga_p, lucro: resultado.lucro_presumido, margem: resultado.margem_p },
                    { nome: "Lucro Real", tributos: resultado.real.tributos_total, carga: resultado.carga_r, lucro: resultado.lucro_real, margem: resultado.margem_r },
                  ].map((r) => {
                    const isBest = r.nome === resultado.melhor;
                    return (
                      <tr key={r.nome} className={`border-b border-border/50 ${isBest ? "bg-green-500/10/5" : ""}`}>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-semibold ${isBest ? "text-green-400" : "text-foreground"}`}>
                            {r.nome} {isBest && "✓"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">{fmt(resultado.rb)}</td>
                        <td className="px-4 py-3 text-sm text-red-400 font-medium">{fmt(r.tributos)}</td>
                        <td className="px-4 py-3 text-sm text-yellow-400">{fmtPct(r.carga)}</td>
                        <td className={`px-4 py-3 text-sm font-bold ${r.lucro >= 0 ? "text-green-400" : "text-red-400"}`}>{fmt(r.lucro)}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{fmtPct(r.margem)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Memória de Cálculo */}
          <div className="bg-card border border-border rounded-xl p-5">
            <button onClick={() => setShowMemoria(m => !m)} className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
              {showMemoria ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              Ver Memória de Cálculo Completa
            </button>
            {showMemoria && (
              <div className="space-y-2">
                <MemoriaSection titulo="Simples Nacional" defaultOpen>
                  <Linha label="RBT12" value={fmt(resultado.rbt12)} />
                  <Linha label="Faixa" value={resultado.simples.faixa} />
                  <Linha label="Alíquota Nominal" value={fmtPct(resultado.simples.aliq_nominal)} />
                  <Linha label="Parcela a Deduzir" value={fmt(resultado.simples.deducao)} />
                  <Linha label="Alíquota Efetiva" value={fmtPct(resultado.simples.aliq_efetiva)} />
                  <Linha label="Fator R (Folha/RBT12)" value={fmtPct(resultado.simples.fatorR)} />
                  <Linha label="DAS Mensal" value={fmt(resultado.simples.das)} highlight />
                </MemoriaSection>
                <MemoriaSection titulo="Lucro Presumido">
                  <Linha label="Base IRPJ (8% ou 32%)" value={fmt(resultado.presumido.base_irpj)} />
                  <Linha label="IRPJ (15%)" value={fmt(resultado.presumido.irpj)} />
                  <Linha label="Adicional IRPJ (10%)" value={fmt(resultado.presumido.adicional)} />
                  <Linha label="Base CSLL (12% ou 32%)" value={fmt(resultado.presumido.base_csll)} />
                  <Linha label="CSLL (9%)" value={fmt(resultado.presumido.csll)} />
                  <Linha label="PIS (0,65%)" value={fmt(resultado.presumido.pis)} />
                  <Linha label="COFINS (3%)" value={fmt(resultado.presumido.cofins)} />
                  <Linha label="Total Tributos" value={fmt(resultado.presumido.tributos_total)} highlight />
                </MemoriaSection>
                <MemoriaSection titulo="Lucro Real">
                  <Linha label="Receita Bruta" value={fmt(resultado.rb)} />
                  <Linha label="(-) CMV/CPV" value={fmt(resultado.cmv)} />
                  <Linha label="(-) Despesas" value={fmt(resultado.despesas)} />
                  <Linha label="Lucro Contábil" value={fmt(resultado.real.lucro_contabil)} />
                  <Linha label="Lucro Real (Base)" value={fmt(resultado.real.lucro_real)} />
                  <Linha label="IRPJ (15%)" value={fmt(resultado.real.irpj)} />
                  <Linha label="Adicional IRPJ (10%)" value={fmt(resultado.real.adicional)} />
                  <Linha label="CSLL (9%)" value={fmt(resultado.real.csll)} />
                  <Linha label="PIS Não-Cumulativo (1,65%)" value={fmt(resultado.real.pis)} />
                  <Linha label="COFINS Não-Cumulativo (7,6%)" value={fmt(resultado.real.cofins)} />
                  <Linha label="Crédito PIS/COFINS" value={`-${fmt(resultado.real.credito_pis_cofins)}`} />
                  <Linha label="Total Tributos" value={fmt(resultado.real.tributos_total)} highlight />
                </MemoriaSection>
              </div>
            )}
          </div>

          {/* Parecer IA */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-yellow-400" />
                <h3 className="text-sm font-semibold text-foreground">Parecer de Inteligência Tributária</h3>
              </div>
              <button onClick={gerarParecer} disabled={parecerLoading}
                className="px-4 py-1.5 bg-yellow-500/10/10 border border-yellow-500/20 text-yellow-400 rounded-lg text-xs font-medium hover:bg-yellow-500/10/20 disabled:opacity-50">
                {parecerLoading ? "Analisando..." : "Gerar Parecer com IA"}
              </button>
            </div>
            {parecer ? (
              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap bg-muted/50 rounded-lg p-4">{parecer}</div>
            ) : (
              <p className="text-xs text-muted-foreground">Clique em "Gerar Parecer" para obter a análise técnica completa com recomendação de regime e memória de cálculo auditável.</p>
            )}
          </div>

          {/* Salvar */}
          <div className="flex justify-end">
            <button onClick={salvarSimulacao} disabled={salvando}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
              {salvando ? "Salvando..." : "Salvar Simulação"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}