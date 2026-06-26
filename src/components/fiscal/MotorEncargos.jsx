import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Calculator, ChevronDown, ChevronUp } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const round2 = (v) => Math.round((v || 0) * 100) / 100;

// Tabela INSS Empregado 2024
const FAIXAS_INSS = [
  { ate: 1412.00, aliq: 7.5 },
  { ate: 2666.68, aliq: 9.0 },
  { ate: 4000.03, aliq: 12.0 },
  { ate: 7786.02, aliq: 14.0 },
];

function calcularINSS(salario) {
  let inss = 0;
  let anterior = 0;
  const detalhes = [];

  for (const faixa of FAIXAS_INSS) {
    if (salario <= anterior) break;
    const base = Math.min(salario, faixa.ate) - anterior;
    const parcela = round2(base * faixa.aliq / 100);
    detalhes.push({ de: anterior, ate: Math.min(salario, faixa.ate), aliq: faixa.aliq, base: round2(base), parcela });
    inss += parcela;
    anterior = faixa.ate;
    if (salario <= faixa.ate) break;
  }

  return { total: round2(inss), detalhes };
}

function calcularIRRF(salario, inss, dependentes, pensao, tabelaIRRF) {
  const desconto_simplificado = tabelaIRRF?.desconto_simplificado || 564.80;
  const ded_dependente = tabelaIRRF?.deducao_dependente || 189.59;
  const faixas = tabelaIRRF?.faixas || [
    { faixa_inicial: 0, faixa_final: 2259.20, aliquota: 0, parcela_deduzir: 0 },
    { faixa_inicial: 2259.21, faixa_final: 2826.65, aliquota: 7.5, parcela_deduzir: 169.44 },
    { faixa_inicial: 2826.66, faixa_final: 3751.05, aliquota: 15, parcela_deduzir: 381.44 },
    { faixa_inicial: 3751.06, faixa_final: 4664.68, aliquota: 22.5, parcela_deduzir: 662.77 },
    { faixa_inicial: 4664.69, faixa_final: 999999, aliquota: 27.5, parcela_deduzir: 896.00 },
  ];

  const ded_dependentes = round2(dependentes * ded_dependente);
  const base_sem_simplificado = round2(salario - inss - ded_dependentes - (pensao || 0));
  const base_com_simplificado = round2(salario - inss - desconto_simplificado);
  // Usar o menor (mais favorável)
  const base_irrf = round2(Math.max(0, Math.min(base_sem_simplificado, base_com_simplificado)));
  const usou_simplificado = base_com_simplificado <= base_sem_simplificado;

  const faixa = faixas.find(f => base_irrf >= f.faixa_inicial && base_irrf <= f.faixa_final) || faixas[faixas.length - 1];
  const irrf = base_irrf > 0 ? round2(Math.max(0, base_irrf * faixa.aliquota / 100 - faixa.parcela_deduzir)) : 0;

  return {
    salario,
    inss,
    dependentes,
    ded_dependentes,
    pensao: pensao || 0,
    desconto_simplificado: usou_simplificado ? desconto_simplificado : 0,
    base_irrf,
    faixa_aliquota: faixa.aliquota,
    parcela_deduzir: faixa.parcela_deduzir,
    irrf,
    usou_simplificado,
  };
}

function MemoriaCalculo({ resultado, config }) {
  return (
    <div className="space-y-4 text-xs">
      {/* INSS Empregado */}
      <div className="bg-muted rounded-lg p-4">
        <p className="font-semibold text-foreground mb-3 text-sm">INSS Empregado</p>
        <div className="space-y-1">
          <div className="flex justify-between"><span className="text-muted-foreground">Salário Base</span><span>{fmt(resultado.salario)}</span></div>
          {resultado.inss_det.detalhes.map((d, i) => (
            <div key={i} className="flex justify-between text-muted-foreground pl-2">
              <span>Faixa {i + 1} ({fmt(d.de)} a {fmt(d.ate)}) × {d.aliq}%</span>
              <span>{fmt(d.parcela)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold border-t border-border pt-1 mt-1"><span className="text-foreground">Total INSS</span><span className="text-red-400">{fmt(resultado.inss_det.total)}</span></div>
        </div>
      </div>

      {/* IRRF */}
      <div className="bg-muted rounded-lg p-4">
        <p className="font-semibold text-foreground mb-3 text-sm">IRRF</p>
        <div className="space-y-1">
          <div className="flex justify-between"><span className="text-muted-foreground">Salário Bruto</span><span>{fmt(resultado.irrf_det.salario)}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>(-) INSS</span><span>-{fmt(resultado.irrf_det.inss)}</span></div>
          {resultado.irrf_det.ded_dependentes > 0 && <div className="flex justify-between text-muted-foreground"><span>(-) Dependentes ({resultado.irrf_det.dependentes})</span><span>-{fmt(resultado.irrf_det.ded_dependentes)}</span></div>}
          {resultado.irrf_det.pensao > 0 && <div className="flex justify-between text-muted-foreground"><span>(-) Pensão</span><span>-{fmt(resultado.irrf_det.pensao)}</span></div>}
          {resultado.irrf_det.usou_simplificado && <div className="flex justify-between text-muted-foreground"><span>(-) Desconto Simplificado</span><span>-{fmt(resultado.irrf_det.desconto_simplificado)}</span></div>}
          <div className="flex justify-between font-bold"><span className="text-foreground">Base IRRF</span><span>{fmt(resultado.irrf_det.base_irrf)}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>Faixa {resultado.irrf_det.faixa_aliquota}%</span><span></span></div>
          <div className="flex justify-between text-muted-foreground"><span>(-) Parcela a deduzir</span><span>-{fmt(resultado.irrf_det.parcela_deduzir)}</span></div>
          <div className="flex justify-between font-bold border-t border-border pt-1 mt-1"><span className="text-foreground">IRRF Devido</span><span className="text-red-400">{fmt(resultado.irrf_det.irrf)}</span></div>
        </div>
      </div>

      {/* FGTS */}
      <div className="bg-muted rounded-lg p-4">
        <p className="font-semibold text-foreground mb-3 text-sm">FGTS</p>
        <div className="space-y-1">
          <div className="flex justify-between"><span className="text-muted-foreground">Base FGTS</span><span>{fmt(resultado.salario)}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>Alíquota</span><span>{config?.fgts_percentual || 8}%</span></div>
          <div className="flex justify-between font-bold border-t border-border pt-1 mt-1"><span className="text-foreground">Valor FGTS</span><span className="text-blue-400">{fmt(resultado.fgts)}</span></div>
        </div>
      </div>

      {/* INSS Patronal */}
      <div className="bg-muted rounded-lg p-4">
        <p className="font-semibold text-foreground mb-3 text-sm">INSS Patronal</p>
        <div className="space-y-1">
          <div className="flex justify-between"><span className="text-muted-foreground">Regime Tributário</span><span className="capitalize">{(config?.regime_tributario || "").replace("_", " ")}</span></div>
          {config?.regime_tributario === "simples_nacional" && config?.cpp_no_das ? (
            <div className="flex justify-between font-bold text-green-400"><span>CPP no DAS</span><span>R$ 0,00</span></div>
          ) : (
            <>
              <div className="flex justify-between text-muted-foreground"><span>Percentual</span><span>{config?.inss_patronal_percentual || 20}%</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Base Cálculo</span><span>{fmt(resultado.salario)}</span></div>
              <div className="flex justify-between font-bold border-t border-border pt-1 mt-1"><span className="text-foreground">INSS Patronal</span><span className="text-red-400">{fmt(resultado.inss_patronal)}</span></div>
            </>
          )}
        </div>
      </div>

      {/* Provisões */}
      <div className="bg-muted rounded-lg p-4">
        <p className="font-semibold text-foreground mb-3 text-sm">Provisões</p>
        <div className="space-y-1">
          <div className="flex justify-between text-muted-foreground"><span>Provisão Férias (÷12 × 1/3 const.)</span><span>{fmt(resultado.prov_ferias)}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>Provisão 13º (÷12)</span><span>{fmt(resultado.prov_decimo)}</span></div>
        </div>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-primary/10/5 border border-blue-500/20 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-2 font-semibold">Custo Mensal Imediato</p>
          <div className="space-y-0.5">
            <div className="flex justify-between"><span className="text-muted-foreground">Salário</span><span>{fmt(resultado.salario)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">FGTS</span><span>{fmt(resultado.fgts)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">INSS Patronal</span><span>{fmt(resultado.inss_patronal)}</span></div>
            <div className="flex justify-between font-bold border-t border-border pt-1 mt-1"><span className="text-blue-400">Total</span><span className="text-blue-400">{fmt(resultado.custo_imediato)}</span></div>
          </div>
        </div>
        <div className="bg-primary/10/5 border border-blue-500/20 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-2 font-semibold">Custo Real Provisionado</p>
          <div className="space-y-0.5">
            <div className="flex justify-between"><span className="text-muted-foreground">Salário</span><span>{fmt(resultado.salario)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">FGTS</span><span>{fmt(resultado.fgts)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">INSS Patronal</span><span>{fmt(resultado.inss_patronal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Provisão Férias</span><span>{fmt(resultado.prov_ferias)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Provisão 13º</span><span>{fmt(resultado.prov_decimo)}</span></div>
            <div className="flex justify-between font-bold border-t border-border pt-1 mt-1"><span className="text-blue-400">Total</span><span className="text-blue-400">{fmt(resultado.custo_provisionado)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MotorEncargos() {
  const [config, setConfig] = useState(null);
  const [tabelaIRRF, setTabelaIRRF] = useState(null);
  const [form, setForm] = useState({
    salario: "",
    dependentes: "0",
    pensao: "0",
    competencia: new Date().toISOString().slice(0, 7),
  });
  const [resultado, setResultado] = useState(null);
  const [showMemoria, setShowMemoria] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.ConfigEncargos.filter({ ativa: true }),
      base44.entities.TabelaIRRF.list(),
    ]).then(([configs, tabelas]) => {
      setConfig(configs[0] || null);
      // Pega tabela mais recente compatível com a competência
      const tabela = tabelas.sort((a, b) => (b.competencia_inicio || "").localeCompare(a.competencia_inicio || ""))[0];
      setTabelaIRRF(tabela || null);
      setLoading(false);
    });
  }, []);

  const calcular = () => {
    const salario = round2(parseFloat(form.salario) || 0);
    const dependentes = parseInt(form.dependentes) || 0;
    const pensao = round2(parseFloat(form.pensao) || 0);

    const inss_det = calcularINSS(salario);
    const irrf_det = calcularIRRF(salario, inss_det.total, dependentes, pensao, tabelaIRRF);

    const fgts_pct = (config?.fgts_percentual || 8) / 100;
    const fgts = round2(salario * fgts_pct);

    let inss_patronal = 0;
    if (config?.regime_tributario === "simples_nacional" && config?.cpp_no_das) {
      inss_patronal = 0;
    } else {
      const pct = (config?.inss_patronal_percentual || 20) / 100;
      inss_patronal = round2(salario * pct);
    }

    const prov_ferias = round2((salario / 12) * (1 + 1 / 3));
    const prov_decimo = round2(salario / 12);

    const custo_imediato = round2(salario + fgts + inss_patronal);
    const custo_provisionado = round2(custo_imediato + prov_ferias + prov_decimo);

    const salario_liquido = round2(salario - inss_det.total - irrf_det.irrf);

    setResultado({
      salario, dependentes, pensao,
      inss_det, irrf_det,
      fgts, inss_patronal,
      prov_ferias, prov_decimo,
      custo_imediato, custo_provisionado,
      salario_liquido,
    });
  };

  if (loading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {config && (
        <div className="p-3 bg-primary/10/5 border border-blue-500/20 rounded-lg flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Regime ativo:</span>
          <span className="font-semibold text-blue-400 capitalize">{config.regime_tributario?.replace("_", " ")}</span>
          {config.regime_tributario === "simples_nacional" && (
            <span className="text-muted-foreground">· CPP no DAS: <span className={config.cpp_no_das ? "text-green-400" : "text-red-400"}>{config.cpp_no_das ? "Sim (INSS Patronal = R$ 0,00)" : "Não (20% s/ folha)"}</span></span>
          )}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Dados do Colaborador</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Salário Bruto (R$) *</label>
            <input type="number" step="0.01" min="0" value={form.salario} onChange={e => setForm(f => ({ ...f, salario: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Nº Dependentes</label>
            <input type="number" min="0" value={form.dependentes} onChange={e => setForm(f => ({ ...f, dependentes: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Pensão Alimentícia (R$)</label>
            <input type="number" step="0.01" min="0" value={form.pensao} onChange={e => setForm(f => ({ ...f, pensao: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Competência</label>
            <input type="month" value={form.competencia} onChange={e => setForm(f => ({ ...f, competencia: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
          </div>
        </div>
        <button onClick={calcular}
          className="mt-4 flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
          <Calculator size={16} /> Calcular Encargos
        </button>
      </div>

      {resultado && (
        <>
          {/* Resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Salário Bruto", value: fmt(resultado.salario), color: "text-foreground" },
              { label: "INSS Empregado", value: fmt(resultado.inss_det.total), color: "text-red-400" },
              { label: "IRRF", value: fmt(resultado.irrf_det.irrf), color: "text-yellow-400" },
              { label: "Salário Líquido", value: fmt(resultado.salario_liquido), color: "text-green-400" },
            ].map((c, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">{c.label}</p>
                <p className={`text-lg font-bold ${c.color}`}>{c.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border border-blue-500/20 rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Custo Mensal Imediato (Empresa)</p>
              <p className="text-xl font-bold text-blue-400">{fmt(resultado.custo_imediato)}</p>
              <p className="text-xs text-muted-foreground mt-1">Salário + FGTS + INSS Patronal</p>
            </div>
            <div className="bg-card border border-blue-500/20 rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Custo Real Provisionado (Empresa)</p>
              <p className="text-xl font-bold text-blue-400">{fmt(resultado.custo_provisionado)}</p>
              <p className="text-xs text-muted-foreground mt-1">+ Férias + 13º provisionados</p>
            </div>
          </div>

          {/* Botão Memória */}
          <div className="bg-card border border-border rounded-xl p-5">
            <button onClick={() => setShowMemoria(m => !m)} className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
              {showMemoria ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              Ver Memória de Cálculo Completa
            </button>
            {showMemoria && <MemoriaCalculo resultado={resultado} config={config} />}
          </div>
        </>
      )}
    </div>
  );
}