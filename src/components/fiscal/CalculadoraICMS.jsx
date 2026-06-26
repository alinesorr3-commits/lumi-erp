import { useState } from "react";
import { Calculator, Info } from "lucide-react";
import ImportButton from "@/components/shared/ImportButton";
import PrintButton from "@/components/shared/PrintButton";
import ParecerIA from "@/components/shared/ParecerIA";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const round2 = (v) => Math.round((v || 0) * 100) / 100;

// Alíquotas interestaduais vigentes conforme Resolução SF 22/1989 e Emenda Constitucional 87/2015
const ALIQ_INTERESTADUAL = {
  // Sul e Sudeste (exceto ES) para Norte/Nordeste/Centro-Oeste/ES: 7%
  // Sul e Sudeste (exceto ES) para Sul e Sudeste: 12%
  // Norte/Nordeste/Centro-Oeste/ES para qualquer: 12%
};

const UFS_SUDESTE_SUL = ["SP", "RJ", "MG", "ES", "PR", "SC", "RS"];
const UFS_NORTE_NE_CO = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "GO", "MA", "MT", "MS", "PA", "PB", "PE", "PI", "RN", "RO", "RR", "SE", "TO"];

function getAliqInterestadual(ufOrigem, ufDestino) {
  if (ufOrigem === ufDestino) return 0;
  const origemSulSudeste = UFS_SUDESTE_SUL.includes(ufOrigem);
  const destinoNortNECO = UFS_NORTE_NE_CO.includes(ufDestino);
  if (origemSulSudeste && destinoNortNECO) return 7;
  return 12;
}

// Alíquotas internas por UF (2024) — simplificadas
const ALIQ_INTERNA = {
  SP: 18, RJ: 20, MG: 18, ES: 17, PR: 19, SC: 17, RS: 17,
  BA: 19, PE: 18, CE: 18, MA: 20, PA: 19, AM: 20, GO: 17,
  DF: 20, MT: 17, MS: 17, TO: 18, PI: 18, AL: 17, PB: 18,
  RN: 18, SE: 18, AC: 17, AP: 18, RO: 17, RR: 17,
};

// FCP por UF — estados que aplicam (lista exemplificativa)
const UFS_FCP = {
  MG: 2, BA: 2, CE: 2, RJ: 2, MA: 2, PA: 2, AM: 2, GO: 2,
  MT: 2, AL: 2, PB: 2, RN: 2, PI: 2, SE: 2, TO: 2,
};

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export default function CalculadoraICMS() {
  const [form, setForm] = useState({
    finalidade: "Revenda",
    regime: "Simples Nacional",
    tipo_empresa: "comércio",
    beneficio_fiscal: "Não",
    ncm: "",
    uf_origem: "SP",
    uf_destino: "MT",
    cfop: "2102",
    cst_csosn: "",
    mercadoria: "10000",
    frete: "0",
    seguro: "0",
    despesas: "0",
    ipi_base: "0",
    mva: "0",
    fcp_pct: "0",
  });
  const [resultado, setResultado] = useState(null);

  const n = (f) => parseFloat(form[f]) || 0;

  const calcular = () => {
    const mercadoria = n("mercadoria");
    const frete = n("frete");
    const seguro = n("seguro");
    const despesas = n("despesas");
    const ipi_base_pct = n("ipi_base");
    const mva_pct = n("mva");
    const fcp_pct_form = n("fcp_pct");

    const baseCalculo = round2(mercadoria + frete + seguro + despesas);
    const ipi = round2(baseCalculo * ipi_base_pct / 100);

    const aliq_interestadual = getAliqInterestadual(form.uf_origem, form.uf_destino);
    const aliq_interna_destino = ALIQ_INTERNA[form.uf_destino] || 18;
    const aliq_interna_origem = ALIQ_INTERNA[form.uf_origem] || 18;
    const fcp_pct_destino = fcp_pct_form || UFS_FCP[form.uf_destino] || 0;

    // ICMS do fornecedor (crédito)
    const icms_fornecedor = round2(baseCalculo * aliq_interestadual / 100);

    // DIFAL (EC 87/2015) — apenas para consumidor final não contribuinte ou contribuinte com DIFAL contratual
    const interestadual = form.uf_origem !== form.uf_destino;
    const aliq_difal = interestadual ? round2(aliq_interna_destino - aliq_interestadual) : 0;
    const difal = interestadual && form.finalidade !== "Revenda"
      ? round2(baseCalculo * aliq_difal / 100)
      : 0;
    // FCP-ST
    const fcp_st_pct = fcp_pct_destino;

    // ICMS-ST (Substituição Tributária)
    let icms_st = 0;
    let fcp_st = 0;
    if (mva_pct > 0) {
      const base_st = round2(baseCalculo * (1 + mva_pct / 100));
      const icms_st_bruto = round2(base_st * aliq_interna_destino / 100);
      icms_st = round2(Math.max(0, icms_st_bruto - icms_fornecedor));
      fcp_st = round2(base_st * fcp_st_pct / 100);
    }

    // ICMS antecipado (MT e outros estados — base: mercadoria + frete × alíquota interna)
    let icms_antecipado = 0;
    const estados_antecipado = ["MT", "MS", "GO", "BA", "CE", "MA", "PA"];
    if (estados_antecipado.includes(form.uf_destino) && form.regime !== "Simples Nacional") {
      icms_antecipado = round2((baseCalculo * aliq_interna_destino / 100) - icms_fornecedor);
    }

    // Garantido integral (MT — regime especial)
    let garantido_integral = 0;
    if (form.uf_destino === "MT" && form.finalidade === "Revenda") {
      garantido_integral = round2(baseCalculo * 0.03);
    }

    // ICMS recuperável (crédito de ICMS na entrada — apenas Lucro Real/Presumido)
    const icms_recuperavel = form.regime !== "Simples Nacional"
      ? icms_fornecedor
      : 0;

    // ICMS custo (quanto entra como custo)
    const icms_custo = round2(icms_fornecedor + difal + icms_st + icms_antecipado + garantido_integral - icms_recuperavel);

    const total_tributario = round2(icms_fornecedor + difal + icms_st + fcp_st + icms_antecipado + garantido_integral);

    setResultado({
      baseCalculo,
      ipi,
      aliq_interestadual,
      aliq_interna_destino,
      aliq_difal,
      icms_fornecedor,
      difal,
      icms_st,
      fcp_st,
      fcp_pct_destino,
      icms_antecipado,
      garantido_integral,
      icms_recuperavel,
      icms_custo,
      total_tributario,
    });
  };

  const ResultCard = ({ label, value, destaque }) => (
    <div className={`bg-card border rounded-xl p-4 ${destaque ? "border-primary/30" : "border-border"}`}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-lg font-bold ${destaque ? "text-primary" : "text-foreground"}`}>{fmt(value)}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-foreground">Calculadora Tributária Inteligente</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Análise por NCM, UF, regime, finalidade, CFOP, CST/CSOSN e benefício fiscal. Base calculada conforme EC 87/2015, Res. SF 22/1989 e legislação estadual vigente.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Finalidade da compra *</label>
            <select value={form.finalidade} onChange={e => setForm(f => ({ ...f, finalidade: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
              {["Revenda", "Industrialização", "Uso e Consumo", "Ativo Imobilizado", "Outros"].map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Regime Tributário *</label>
            <select value={form.regime} onChange={e => setForm(f => ({ ...f, regime: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
              {["Simples Nacional", "Lucro Presumido", "Lucro Real"].map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Tipo de empresa</label>
            <select value={form.tipo_empresa} onChange={e => setForm(f => ({ ...f, tipo_empresa: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
              {["comércio", "indústria", "serviços", "transporte"].map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Benefício fiscal?</label>
            <select value={form.beneficio_fiscal} onChange={e => setForm(f => ({ ...f, beneficio_fiscal: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
              <option>Não</option><option>Sim</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">NCM</label>
            <input value={form.ncm} onChange={e => setForm(f => ({ ...f, ncm: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              placeholder="00000000" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Estado origem</label>
            <select value={form.uf_origem} onChange={e => setForm(f => ({ ...f, uf_origem: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
              {UFS.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Estado destino</label>
            <select value={form.uf_destino} onChange={e => setForm(f => ({ ...f, uf_destino: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
              {UFS.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">CFOP</label>
            <input value={form.cfop} onChange={e => setForm(f => ({ ...f, cfop: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">CST/CSOSN</label>
            <input value={form.cst_csosn} onChange={e => setForm(f => ({ ...f, cst_csosn: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              placeholder="102, 400, 00..." />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Mercadoria (R$)</label>
            <input type="number" step="0.01" value={form.mercadoria} onChange={e => setForm(f => ({ ...f, mercadoria: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Frete</label>
            <input type="number" step="0.01" value={form.frete} onChange={e => setForm(f => ({ ...f, frete: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">IPI base (%)</label>
            <input type="number" step="0.01" value={form.ipi_base} onChange={e => setForm(f => ({ ...f, ipi_base: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">MVA %</label>
            <input type="number" step="0.01" value={form.mva} onChange={e => setForm(f => ({ ...f, mva: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">FCP % (0 = automático)</label>
            <input type="number" step="0.01" value={form.fcp_pct} onChange={e => setForm(f => ({ ...f, fcp_pct: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Seguro</label>
            <input type="number" step="0.01" value={form.seguro} onChange={e => setForm(f => ({ ...f, seguro: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Despesas</label>
            <input type="number" step="0.01" value={form.despesas} onChange={e => setForm(f => ({ ...f, despesas: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3 flex-wrap">
          <button onClick={calcular}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
            <Calculator size={16} /> Calcular
          </button>
          <ImportButton
            label="Importar NF-e/XML/XLS"
            accept=".xml,.xls,.xlsx,.csv,.pdf"
            schema={{
              type: "object",
              properties: {
                ncm: { type: "string" },
                valor_mercadoria: { type: "number" },
                valor_frete: { type: "number" },
                valor_seguro: { type: "number" },
                ipi_percentual: { type: "number" },
                mva: { type: "number" },
                uf_origem: { type: "string" },
                uf_destino: { type: "string" },
                cfop: { type: "string" },
                cst_csosn: { type: "string" },
              }
            }}
            onData={(rows) => {
              const r = rows[0];
              if (!r) return;
              setForm(f => ({
                ...f,
                ncm: r.ncm || f.ncm,
                mercadoria: r.valor_mercadoria?.toString() || f.mercadoria,
                frete: r.valor_frete?.toString() || f.frete,
                seguro: r.valor_seguro?.toString() || f.seguro,
                ipi_base: r.ipi_percentual?.toString() || f.ipi_base,
                mva: r.mva?.toString() || f.mva,
                uf_origem: r.uf_origem || f.uf_origem,
                uf_destino: r.uf_destino || f.uf_destino,
                cfop: r.cfop || f.cfop,
                cst_csosn: r.cst_csosn || f.cst_csosn,
              }));
            }}
          />
          {resultado && <PrintButton label="Imprimir Cálculo" />}
        </div>
      </div>

      {resultado && (
        <>
          <div className="mb-6">
            <ParecerIA 
              title="Otimização Tributária e Conformidade"
              prompt={`Analise este cálculo ICMS e forneça parecer sobre otimizações fiscais e compliance:

Dados da operação:
- Finalidade: ${form.finalidade}
- Regime: ${form.regime}
- UF Origem → Destino: ${form.uf_origem} → ${form.uf_destino}
- Valor: R$ ${(resultado.baseCalculo).toFixed(2)}
- Alíquota Interestadual: ${resultado.aliq_interestadual}%
- Alíquota Interna Destino: ${resultado.aliq_interna_destino}%
- Tipo Empresa: ${form.tipo_empresa}

Resultados:
- ICMS Fornecedor: R$ ${resultado.icms_fornecedor.toFixed(2)}
- DIFAL: R$ ${resultado.difal.toFixed(2)}
- ICMS-ST: R$ ${resultado.icms_st.toFixed(2)}
- Total Tributário: R$ ${resultado.total_tributario.toFixed(2)}

Analise oportunidades de: 1) Diferencial de alíquotas, 2) Substituição tributária, 3) Créditos disponíveis, 4) Conformidade com legislação estadual, 5) Planejamento fiscal.`}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <ResultCard label="ICMS fornecedor" value={resultado.icms_fornecedor} />
            <ResultCard label="DIFAL" value={resultado.difal} />
            <ResultCard label="ICMS-ST" value={resultado.icms_st} />
            <ResultCard label="FCP-ST" value={resultado.fcp_st} />
            <ResultCard label="ICMS antecipado" value={resultado.icms_antecipado} />
            <ResultCard label="Garantido Integral MT" value={resultado.garantido_integral} />
            <ResultCard label="ICMS recuperável" value={resultado.icms_recuperavel} />
            <ResultCard label="ICMS custo" value={resultado.icms_custo} />
            <ResultCard label="Total tributário" value={resultado.total_tributario} destaque />
          </div>

          {/* Memória de cálculo */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Info size={14} className="text-blue-400" />
              <h3 className="text-sm font-semibold text-foreground">Memória de Cálculo</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {[
                { label: "Base de Cálculo", value: fmt(resultado.baseCalculo) },
                { label: `Alíq. Interestadual (${form.uf_origem}→${form.uf_destino})`, value: `${resultado.aliq_interestadual}%` },
                { label: `Alíq. Interna ${form.uf_destino}`, value: `${resultado.aliq_interna_destino}%` },
                { label: "Alíq. DIFAL", value: `${resultado.aliq_difal}%` },
                { label: `FCP ${form.uf_destino}`, value: `${resultado.fcp_pct_destino}%` },
                { label: "IPI calculado", value: fmt(resultado.ipi) },
              ].map(({ label, value }) => (
                <div key={label} className="p-2 bg-muted rounded-lg">
                  <p className="text-muted-foreground mb-0.5">{label}</p>
                  <p className="font-bold text-foreground">{value}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Base: EC 87/2015 · Res. SF 22/1989 · Convênio ICMS 142/2018 (ST) · Legislação estadual vigente em 2024.
            </p>
          </div>
        </>
      )}
    </div>
  );
}