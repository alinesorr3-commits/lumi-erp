import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { FileText, DollarSign, Activity, Printer } from "lucide-react";
import PrintButton from "@/components/shared/PrintButton";
import { 
  calcularINSSEmpregado, 
  calcularIRRF, 
  calcularFGTS, 
  calcularINSSPatronal,
  calcularProvisoes,
  calcularCustos
} from "@/lib/calculoEncargos";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function RelatorioCustoRH() {
  const [folhas, setFolhas] = useState([]);
  const [tabelasIRRF, setTabelasIRRF] = useState([]);
  const [configEncargos, setConfigEncargos] = useState({ map: {}, empresaRegime: "simples_nacional" });
  const [loading, setLoading] = useState(true);
  const [mesFiltro, setMesFiltro] = useState(new Date().toISOString().slice(0, 7));
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [todasFolhas, tabelas, cfgs, empresas] = await Promise.all([
          base44.entities.Folha.list("-mes_referencia"),
          base44.entities.TabelaIRRF.list(),
          base44.entities.ConfigEncargos.list(),
          base44.entities.EmpresaCliente.list()
        ]);
        
        setFolhas(todasFolhas);
        setTabelasIRRF(tabelas);

        const configMap = {};
        cfgs.forEach(c => configMap[c.regime_tributario] = c);
        const emp = empresas[0] || null;
        let regime = emp?.regime_tributario || "Simples Nacional";
        if (regime === "Simples Nacional") regime = "simples_nacional";
        else if (regime === "Lucro Presumido") regime = "lucro_presumido";
        else if (regime === "Lucro Real") regime = "lucro_real";
        else regime = "simples_nacional";

        setConfigEncargos({ map: configMap, empresaRegime: regime });
      } catch (err) {
        console.error("Erro ao carregar relatório:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const folhasMes = folhas.filter(f => f.mes_referencia === mesFiltro);

  const getTabelaIRRF = (competencia) => {
    return tabelasIRRF.find(t => t.competencia === competencia.substring(0, 7) || (t.competencia_inicio && t.competencia_inicio <= competencia.substring(0, 7))) || tabelasIRRF[0] || null;
  };

  const getRegimeConfig = () => {
    const regimeEmpresa = configEncargos.empresaRegime || "simples_nacional";
    return configEncargos.map?.[regimeEmpresa] || { 
      regime_tributario: regimeEmpresa, 
      cpp_no_das: true, 
      fgts_percentual: 8, 
      inss_patronal_percentual: 20 
    };
  };

  const relatorio = folhasMes.map(folha => {
    const baseCalculo = (folha.salario_base || 0) + (folha.horas_extras_valor || 0) + (folha.adicional_noturno || 0) + (folha.ferias_valor || 0) + (folha.rescisao_valor || 0) + (folha.outros_adicionais || 0);
    const salarioBruto = folha.salario_base || 0;
    
    const config = getRegimeConfig();
    const tabelaIRRF = getTabelaIRRF(folha.mes_referencia);

    const inssEmp = calcularINSSEmpregado(baseCalculo, folha.mes_referencia);
    const irrf = calcularIRRF(baseCalculo, inssEmp.total, tabelaIRRF, 0, 0);
    const fgts = calcularFGTS(baseCalculo, config.fgts_percentual || 8);
    const inssPatronal = calcularINSSPatronal(baseCalculo, config);
    const provisoes = calcularProvisoes(salarioBruto);
    const custos = calcularCustos(salarioBruto, fgts.total, inssPatronal.total, provisoes);

    return {
      id: folha.id,
      colaborador: folha.colaborador_nome,
      salarioBruto,
      baseCalculo,
      inssEmpregado: inssEmp.total,
      irrf: irrf.total,
      fgts: fgts.total,
      inssPatronal: inssPatronal.total,
      provisaoFerias: provisoes.ferias.total,
      provisao13: provisoes.decimo.total,
      custoImediato: custos.custoMensalImediato.total,
      custoProvisionado: custos.custoRealProvisionado.total
    };
  });

  const totais = relatorio.reduce((acc, curr) => ({
    salarioBruto: acc.salarioBruto + curr.salarioBruto,
    inssEmpregado: acc.inssEmpregado + curr.inssEmpregado,
    irrf: acc.irrf + curr.irrf,
    fgts: acc.fgts + curr.fgts,
    inssPatronal: acc.inssPatronal + curr.inssPatronal,
    provisaoFerias: acc.provisaoFerias + curr.provisaoFerias,
    provisao13: acc.provisao13 + curr.provisao13,
    custoImediato: acc.custoImediato + curr.custoImediato,
    custoProvisionado: acc.custoProvisionado + curr.custoProvisionado,
  }), { salarioBruto: 0, inssEmpregado: 0, irrf: 0, fgts: 0, inssPatronal: 0, provisaoFerias: 0, provisao13: 0, custoImediato: 0, custoProvisionado: 0 });

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-6 h-6 border-4 border-muted border-t-primary rounded-full animate-spin"></div></div>;
  }

  return (
  <div className="space-y-6">
    <style>{`
      @media print {
        .print-hide-unselected .unselected-row { display: none !important; }
      }
    `}</style>
    <div className="flex items-center justify-between gap-4 bg-card border border-border p-4 rounded-xl flex-wrap">
      <div className="flex items-center gap-3">
        <FileText className="text-primary" />
        <h2 className="font-bold text-foreground">Relatório de Custo Real do RH</h2>
      </div>
      <div className="flex items-center gap-3">
        <PrintButton label={selected.size > 0 ? `Imprimir Selecionados (${selected.size})` : "Imprimir Relatório"} />
        <input 
          type="month" 
          value={mesFiltro}
          onChange={(e) => {
            setMesFiltro(e.target.value);
            setSelected(new Set());
          }}
          className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
        />
      </div>
    </div>

      {folhasMes.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
          Nenhuma folha encontrada para o período selecionado.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-border p-5 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={18} className="text-blue-400" />
                <p className="text-sm font-semibold text-muted-foreground">Custo Imediato Total</p>
              </div>
              <h3 className="text-3xl font-bold text-foreground">{fmt(totais.custoImediato)}</h3>
              <p className="text-xs text-muted-foreground mt-1">Soma de salários, FGTS e INSS Patronal</p>
            </div>
            <div className="bg-card border border-border p-5 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Activity size={64} className="text-blue-400" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Activity size={18} className="text-blue-400" />
                <p className="text-sm font-semibold text-blue-400">Custo Real Provisionado</p>
              </div>
              <h3 className="text-3xl font-bold text-foreground">{fmt(totais.custoProvisionado)}</h3>
              <p className="text-xs text-blue-400/80 mt-1">Custo Imediato + Provisões de 13º e Férias</p>
            </div>
          </div>

          <div className={`bg-card border border-border rounded-xl overflow-hidden ${selected.size > 0 ? 'print-hide-unselected' : ''}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 w-8">
                      <input type="checkbox" checked={selected.size === relatorio.length && relatorio.length > 0}
                        onChange={() => {
                          if (selected.size === relatorio.length) setSelected(new Set());
                          else setSelected(new Set(relatorio.map(r => r.id)));
                        }}
                        className="cursor-pointer" />
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground whitespace-nowrap">Colaborador</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground whitespace-nowrap">Salário/Base</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground whitespace-nowrap">INSS Emp.</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground whitespace-nowrap">IRRF Emp.</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground whitespace-nowrap">FGTS (8%)</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground whitespace-nowrap">INSS Patr.</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground whitespace-nowrap">Prov. Férias</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground whitespace-nowrap">Prov. 13º</th>
                    <th className="px-4 py-3 text-right font-bold text-blue-400 bg-blue-400/5 whitespace-nowrap">Custo Imediato</th>
                    <th className="px-4 py-3 text-right font-bold text-blue-400 bg-blue-400/5 whitespace-nowrap">Custo Real</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {relatorio.map(item => (
                    <tr key={item.id} className={`hover:bg-muted/30 ${selected.has(item.id) ? 'bg-primary/5' : ''} ${!selected.has(item.id) ? 'unselected-row' : ''}`}>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selected.has(item.id)} onChange={() => {
                          const newSet = new Set(selected);
                          if (newSet.has(item.id)) newSet.delete(item.id);
                          else newSet.add(item.id);
                          setSelected(newSet);
                        }} className="cursor-pointer" />
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap flex items-center gap-2">
                        {item.colaborador}
                        <button onClick={() => {
                          setSelected(new Set([item.id]));
                          setTimeout(() => window.print(), 100);
                        }} className="text-muted-foreground hover:text-primary no-print"><Printer size={13}/></button>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">{fmt(item.baseCalculo)}</td>
                      <td className="px-4 py-3 text-right text-red-400/80 whitespace-nowrap">{fmt(item.inssEmpregado)}</td>
                      <td className="px-4 py-3 text-right text-red-400/80 whitespace-nowrap">{fmt(item.irrf)}</td>
                      <td className="px-4 py-3 text-right text-yellow-400 whitespace-nowrap">{fmt(item.fgts)}</td>
                      <td className="px-4 py-3 text-right text-yellow-400 whitespace-nowrap">{fmt(item.inssPatronal)}</td>
                      <td className="px-4 py-3 text-right text-green-400 whitespace-nowrap">{fmt(item.provisaoFerias)}</td>
                      <td className="px-4 py-3 text-right text-green-400 whitespace-nowrap">{fmt(item.provisao13)}</td>
                      <td className="px-4 py-3 text-right font-bold text-blue-400 bg-blue-400/5 whitespace-nowrap">{fmt(item.custoImediato)}</td>
                      <td className="px-4 py-3 text-right font-bold text-blue-400 bg-blue-400/5 whitespace-nowrap">{fmt(item.custoProvisionado)}</td>
                    </tr>
                  ))}
                  <tr className="bg-muted/50 font-bold border-t-2 border-border">
                    <td className="px-4 py-4 text-foreground whitespace-nowrap">TOTAIS</td>
                    <td className="px-4 py-4 text-right text-foreground whitespace-nowrap">{fmt(totais.salarioBruto)}</td>
                    <td className="px-4 py-4 text-right text-red-400/80 whitespace-nowrap">{fmt(totais.inssEmpregado)}</td>
                    <td className="px-4 py-4 text-right text-red-400/80 whitespace-nowrap">{fmt(totais.irrf)}</td>
                    <td className="px-4 py-4 text-right text-yellow-400 whitespace-nowrap">{fmt(totais.fgts)}</td>
                    <td className="px-4 py-4 text-right text-yellow-400 whitespace-nowrap">{fmt(totais.inssPatronal)}</td>
                    <td className="px-4 py-4 text-right text-green-400 whitespace-nowrap">{fmt(totais.provisaoFerias)}</td>
                    <td className="px-4 py-4 text-right text-green-400 whitespace-nowrap">{fmt(totais.provisao13)}</td>
                    <td className="px-4 py-4 text-right text-blue-400 bg-blue-400/10 whitespace-nowrap">{fmt(totais.custoImediato)}</td>
                    <td className="px-4 py-4 text-right text-blue-400 bg-blue-400/10 whitespace-nowrap">{fmt(totais.custoProvisionado)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}