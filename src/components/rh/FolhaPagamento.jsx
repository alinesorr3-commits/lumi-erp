import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, X, FileText, DollarSign, Eye, Printer, Download } from "lucide-react";
import { jsPDF } from "jspdf";
import MemoriaCalculoModal from "./MemoriaCalculoModal";
import PrintButton from "@/components/shared/PrintButton";
import { 
  calcularINSSEmpregado, 
  calcularIRRF, 
  calcularFGTS, 
  calcularINSSPatronal,
  calcularProvisoes,
  gerarMemoriaCalculo
} from "@/lib/calculoEncargos";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const statusConfig = {
  rascunho: { label: "Rascunho", color: "text-muted-foreground", bg: "bg-muted" },
  aprovada: { label: "Aprovada", color: "text-blue-400", bg: "bg-blue-400/10" },
  paga: { label: "Paga", color: "text-green-400", bg: "bg-green-400/10" },
};

function FolhaModal({ folha, colaboradores, onClose, onSave }) {
   const [form, setForm] = useState({
   colaborador_id: folha?.colaborador_id || "",
   colaborador_nome: folha?.colaborador_nome || "",
   mes_referencia: folha?.mes_referencia || new Date().toISOString().slice(0, 7),
   salario_base: folha?.salario_base || "",
   horas_extras_valor: folha?.horas_extras_valor || 0,
   adicional_noturno: folha?.adicional_noturno || 0,
   ferias_valor: folha?.ferias_valor || 0,
   rescisao_valor: folha?.rescisao_valor || 0,
   outros_adicionais: folha?.outros_adicionais || 0,
   inss: folha?.inss || 0,
   irrf: folha?.irrf || 0,
   vale_transporte: folha?.vale_transporte || 0,
   outros_descontos: folha?.outros_descontos || 0,
   adiantamento: folha?.adiantamento || 0,
   emprestimo_empresa: folha?.emprestimo_empresa || 0,
   emprestimo_governo: folha?.emprestimo_governo || 0,
   fgts: folha?.fgts || 0,
   inss_patronal: folha?.inss_patronal || 0,
   status: folha?.status || "rascunho",
   data_pagamento: folha?.data_pagamento || "",
   observacoes: folha?.observacoes || "",
   });
   const [saving, setSaving] = useState(false);
   const [configs, setConfigs] = useState({ map: {}, empresaRegime: "simples_nacional" });
   const [tabelaIRRF, setTabelaIRRF] = useState(null);
   const [memoria, setMemoria] = useState(null);
   const [showMemoria, setShowMemoria] = useState(false);

  useEffect(() => {
    const carregarConfigs = async () => {
      try {
        const cfgs = await base44.entities.ConfigEncargos.list();
        const configMap = {};
        cfgs.forEach(c => configMap[c.regime_tributario] = c);
        
        const empresas = await base44.entities.EmpresaCliente.list();
        const emp = empresas[0] || null;
        let regime = emp?.regime_tributario || "Simples Nacional";
        if (regime === "Simples Nacional") regime = "simples_nacional";
        else if (regime === "Lucro Presumido") regime = "lucro_presumido";
        else if (regime === "Lucro Real") regime = "lucro_real";
        else regime = "simples_nacional";

        setConfigs({ map: configMap, empresaRegime: regime });
      } catch (err) {
        console.error("Erro ao carregar configs:", err);
      }
    };
    carregarConfigs();
  }, []);

  const handleColaborador = (id) => {
    const col = colaboradores.find(c => c.id === id);
    setForm(f => ({
      ...f,
      colaborador_id: id,
      colaborador_nome: col?.nome || "",
      salario_base: col?.salario_base || "",
    }));
  };

  const calcularEncargos = async () => {
    try {
      const competencia = form.mes_referencia;
      const salarioBruto = parseFloat(form.salario_base) || 0;
      const totalAdics = (parseFloat(form.horas_extras_valor) || 0) + (parseFloat(form.adicional_noturno) || 0) + (parseFloat(form.ferias_valor) || 0) + (parseFloat(form.rescisao_valor) || 0) + (parseFloat(form.outros_adicionais) || 0);
      const baseCalculo = salarioBruto + totalAdics;

      if (!competencia) { alert("Informe a Competência antes de calcular."); return; }
      if (!salarioBruto) { alert("Informe o Salário Base antes de calcular."); return; }

      const regimeEmpresa = configs.empresaRegime || "simples_nacional";
      const configCustom = configs.map?.[regimeEmpresa];
      const config = configCustom || { 
        regime_tributario: regimeEmpresa, 
        cpp_no_das: true, 
        fgts_percentual: 8, 
        inss_patronal_percentual: 20 
      };
      
      if (!config.regime_tributario) { alert("Empresa sem Regime Tributário configurado."); return; }

      // Buscar tabela IRRF para a competência (lista tudo e procura para suportar o formato antigo ou o novo)
      const tabelas = await base44.entities.TabelaIRRF.list();
      const tabela = tabelas.find(t => t.competencia === competencia.substring(0, 7) || (t.competencia_inicio && t.competencia_inicio <= competencia.substring(0, 7))) || tabelas[0] || null;
      setTabelaIRRF(tabela);
      
      if (!tabela) {
        console.warn("Nenhuma Tabela IRRF encontrada para a competência " + competencia.substring(0, 7));
      }

      // Log
      try {
        const me = await base44.auth.me();
        await base44.entities.LogAcesso.create({
          user_id: me.id,
          user_email: me.email,
          user_nome: me.full_name || me.email,
          acao: "acesso_modulo",
          modulo: "Folha de Pagamento - Cálculo",
          timestamp: new Date().toISOString(),
          detalhes: `Cálculo de encargos | Competência: ${competencia} | Regime: ${config.regime_tributario} | Tabela IRRF: ${tabela ? tabela.competencia : 'Não encontrada'}`
        });
      } catch (err) {}

      // Calcular
      const col = colaboradores.find(c => c.id === form.colaborador_id);
      const retemIRRF = col?.retem_irrf !== false;
      
      const inssEmp = calcularINSSEmpregado(baseCalculo, competencia);
      const irrf = retemIRRF ? calcularIRRF(baseCalculo, inssEmp.total, tabela, 0, 0) : { total: 0, detalhes: { irrf: 0, faixa: "Isento (Não configurado)" } };
      const fgts = calcularFGTS(baseCalculo, config.fgts_percentual || 8);
      const inssPatronal = calcularINSSPatronal(baseCalculo, config);
      const provisoes = calcularProvisoes(salarioBruto); // Provisões costumam usar apenas salário base

      setForm(f => ({
        ...f,
        inss: inssEmp.total,
        irrf: irrf.total,
        fgts: fgts.total,
        inss_patronal: inssPatronal.total,
      }));

      setMemoria(gerarMemoriaCalculo(baseCalculo, inssEmp, irrf, fgts, inssPatronal, config, provisoes));
    } catch (err) {
      console.error("Erro ao calcular encargos:", err);
    }
  };

  const salario = parseFloat(form.salario_base) || 0;
  const totalAdicionais = (parseFloat(form.horas_extras_valor) || 0) + (parseFloat(form.adicional_noturno) || 0) + (parseFloat(form.ferias_valor) || 0) + (parseFloat(form.rescisao_valor) || 0) + (parseFloat(form.outros_adicionais) || 0);
  const baseCalculoImpostos = salario + totalAdicionais;
  const adiantamento = parseFloat(form.adiantamento) || 0;
  const emprestimoEmpresa = parseFloat(form.emprestimo_empresa) || 0;
  const emprestimoGoverno = parseFloat(form.emprestimo_governo) || 0;
  const totalDescontos = (parseFloat(form.inss) || 0) + (parseFloat(form.irrf) || 0) + (parseFloat(form.vale_transporte) || 0) + (parseFloat(form.outros_descontos) || 0) + adiantamento + emprestimoEmpresa + emprestimoGoverno;
  const liquido = salario + totalAdicionais - totalDescontos;
  const fgts = parseFloat(form.fgts) || 0;
  const inssPatronal = parseFloat(form.inss_patronal) || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const data = {
      ...form,
      salario_base: salario,
      horas_extras_valor: parseFloat(form.horas_extras_valor) || 0,
      adicional_noturno: parseFloat(form.adicional_noturno) || 0,
      ferias_valor: parseFloat(form.ferias_valor) || 0,
      rescisao_valor: parseFloat(form.rescisao_valor) || 0,
      outros_adicionais: parseFloat(form.outros_adicionais) || 0,
      inss: parseFloat(form.inss) || 0,
      irrf: parseFloat(form.irrf) || 0,
      vale_transporte: parseFloat(form.vale_transporte) || 0,
      outros_descontos: parseFloat(form.outros_descontos) || 0,
      adiantamento: parseFloat(form.adiantamento) || 0,
      emprestimo_empresa: parseFloat(form.emprestimo_empresa) || 0,
      emprestimo_governo: parseFloat(form.emprestimo_governo) || 0,
      fgts: parseFloat(form.fgts) || 0,
      inss_patronal: parseFloat(form.inss_patronal) || 0,
      salario_liquido: liquido,
    };
    
    if (!data.data_pagamento) delete data.data_pagamento;

    try {
      await onSave(data);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar folha: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, field, readOnly }) => (
    <div>
      <label className="block text-xs text-muted-foreground mb-1">{label}</label>
      <input type="number" step="0.01" readOnly={readOnly} value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
        className={`w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`} />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card">
          <h2 className="text-base font-semibold text-foreground">{folha ? "Editar Folha" : "Nova Folha de Pagamento"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-muted-foreground mb-1.5">Colaborador *</label>
              <select required value={form.colaborador_id} onChange={e => handleColaborador(e.target.value)}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                <option value="">Selecionar</option>
                {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Mês de Referência *</label>
              <input required type="month" value={form.mes_referencia} onChange={e => setForm(f => ({ ...f, mes_referencia: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          {/* Proventos */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Proventos</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Salário Base (R$) *" field="salario_base" />
              <Field label="Horas Extras (R$)" field="horas_extras_valor" />
              <Field label="Adicional Noturno (R$)" field="adicional_noturno" />
              <Field label="Férias (R$)" field="ferias_valor" />
              <Field label="Rescisão (R$)" field="rescisao_valor" />
              <Field label="Outros Adicionais (R$)" field="outros_adicionais" />
            </div>
          </div>

          {/* Descontos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Descontos e Encargos</p>
              <button type="button" onClick={calcularEncargos} className="text-xs text-primary hover:underline font-semibold">
                🧮 Calcular Automaticamente
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="INSS (R$)" field="inss" />
              <Field label="IRRF (R$)" field="irrf" />
              <Field label="Vale Transporte (R$)" field="vale_transporte" />
              <Field label="Outros Descontos (R$)" field="outros_descontos" />
              <Field label="Adiantamento (R$)" field="adiantamento" />
              <Field label="Empréstimo Empresa (R$)" field="emprestimo_empresa" />
              <Field label="Empréstimo Governo (R$)" field="emprestimo_governo" />
              <Field label="FGTS (R$)" field="fgts" />
              <Field label="INSS Patronal (R$)" field="inss_patronal" readOnly />
            </div>
          </div>

          {/* Resumo */}
          <div className="space-y-3">
            <div className="p-4 bg-muted rounded-xl space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Proventos</span>
                <span className="text-green-400 font-medium">{fmt(salario + totalAdicionais)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Descontos</span>
                <span className="text-red-400 font-medium">{fmt(totalDescontos)}</span>
              </div>
              <div className="flex justify-between text-base font-bold border-t border-border pt-2">
                <span className="text-foreground">Salário Líquido</span>
                <span className="text-foreground">{fmt(liquido)}</span>
              </div>
            </div>

            {/* Encargos Empresa */}
            <div className="p-4 bg-blue-400/10 border border-blue-400/30 rounded-xl space-y-2">
              <p className="text-xs font-semibold text-blue-400 uppercase">Encargos da Empresa (Não aparecem na folha)</p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">FGTS</span>
                <span className="text-blue-400 font-medium">{fmt(fgts)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">INSS Patronal</span>
                <span className="text-blue-400 font-medium">{fmt(inssPatronal)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-blue-400/30 pt-2">
                <span className="text-muted-foreground">Custo Empresa</span>
                <span className="text-blue-400">{fmt(salario + fgts + inssPatronal)}</span>
              </div>
            </div>

            {memoria && (
              <button onClick={() => setShowMemoria(true)} className="w-full py-2 px-3 bg-blue-400/20 text-blue-400 rounded-lg text-xs font-semibold hover:bg-blue-400/30 flex items-center justify-center gap-2">
                <Eye size={14} /> Ver Memória de Cálculo Detalhada
              </button>
            )}
          </div>

          {form.status === "paga" && (
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Data de Pagamento</label>
              <input type="date" value={form.data_pagamento} onChange={e => setForm(f => ({ ...f, data_pagamento: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm bg-muted text-muted-foreground">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm bg-primary text-primary-foreground disabled:opacity-50">
              {saving ? "Salvando..." : folha ? "Salvar" : "Gerar Folha"}
            </button>
          </div>
        </form>
        </div>

        {showMemoria && <MemoriaCalculoModal memoria={memoria} onClose={() => setShowMemoria(false)} />}
        </div>
        );
        }

export default function FolhaPagamento() {
   const [folhas, setFolhas] = useState([]);
   const [colaboradores, setColaboradores] = useState([]);
   const [loading, setLoading] = useState(true);
   const [modalOpen, setModalOpen] = useState(false);
   const [editItem, setEditItem] = useState(null);
   const [filtroMes, setFiltroMes] = useState(new Date().toISOString().slice(0, 7));
   const [filtroAno, setFiltroAno] = useState(new Date().getFullYear().toString());
   const [selected, setSelected] = useState(new Set());
   const [gerandoLote, setGerandoLote] = useState(false);
   const [mesLote, setMesLote] = useState(new Date().toISOString().slice(0, 7));

   const load = async () => {
     setLoading(true);
     const [fs, cols] = await Promise.all([
       base44.entities.Folha.list("-mes_referencia"),
       base44.entities.Colaborador.filter({ status: "ativo" }),
     ]);
     setFolhas(fs);
     setColaboradores(cols);
     setLoading(false);
   };

   useEffect(() => { load(); }, []);

   const handleSave = async (data) => {
     try {
       if (editItem) {
         await base44.entities.Folha.update(editItem.id, data);
       } else {
         await base44.entities.Folha.create(data);
       }
       
       if (data.status === "aprovada" || data.status === "paga") {
         await syncFinanceiro(data);
       }
       
       setModalOpen(false);
       setEditItem(null);
       load();
     } catch (err) {
       console.error("Erro em handleSave:", err);
       throw err;
     }
   };
   
   const syncFinanceiro = async (folhaData) => {
     const vencimentoPadrao = new Date();
     vencimentoPadrao.setDate(vencimentoPadrao.getDate() + 5); 
     const vencStr = folhaData.data_pagamento || vencimentoPadrao.toISOString().split("T")[0];
     
     // 1. Salário Líquido
     if (folhaData.salario_liquido > 0) {
       const descLiq = `Folha de Pagamento - ${folhaData.colaborador_nome} (${folhaData.mes_referencia})`;
       const existingLiq = await base44.entities.Lancamento.filter({ numero_documento: `FOLHA-${folhaData.colaborador_id}-${folhaData.mes_referencia}` });
       
       const payloadLiq = {
         descricao: descLiq,
         tipo: "despesa",
         valor: folhaData.salario_liquido,
         vencimento: vencStr,
         categoria: "Salários",
         cliente_fornecedor: folhaData.colaborador_nome,
         numero_documento: `FOLHA-${folhaData.colaborador_id}-${folhaData.mes_referencia}`,
         status: folhaData.status === "paga" ? "pago" : "pendente"
       };
       if (folhaData.status === "paga") payloadLiq.data_pagamento = vencStr;
       
       if (existingLiq.length === 0) {
         await base44.entities.Lancamento.create(payloadLiq);
       } else if (existingLiq[0].status !== "pago") {
         await base44.entities.Lancamento.update(existingLiq[0].id, {
           valor: folhaData.salario_liquido,
           status: folhaData.status === "paga" ? "pago" : "pendente",
           ...(folhaData.status === "paga" ? { data_pagamento: vencStr } : {})
         });
       }
     }

     // 2. INSS (Soma do empregado + patronal)
     const inssTotal = (folhaData.inss || 0) + (folhaData.inss_patronal || 0);
     if (inssTotal > 0) {
       const descINSS = `Guia INSS Mensal - Folha (${folhaData.mes_referencia})`;
       const existingINSS = await base44.entities.Lancamento.filter({ numero_documento: `INSS-${folhaData.mes_referencia}` });
       
       const payloadINSS = {
         descricao: descINSS,
         tipo: "despesa",
         valor: inssTotal,
         vencimento: vencStr,
         categoria: "Impostos",
         cliente_fornecedor: "Receita Federal",
         numero_documento: `INSS-${folhaData.mes_referencia}`,
         status: folhaData.status === "paga" ? "pago" : "pendente"
       };
       if (folhaData.status === "paga") payloadINSS.data_pagamento = vencStr;

       if (existingINSS.length === 0) {
         await base44.entities.Lancamento.create(payloadINSS);
       } else if (existingINSS[0].status !== "pago") {
         await base44.entities.Lancamento.update(existingINSS[0].id, {
           valor: existingINSS[0].valor + inssTotal, // Soma com INSS de outros funcionários
           status: folhaData.status === "paga" ? "pago" : "pendente",
           ...(folhaData.status === "paga" ? { data_pagamento: vencStr } : {})
         });
       }
     }
     
     // 3. IRRF
     if (folhaData.irrf > 0) {
       const descIRRF = `Guia IRRF - Folha (${folhaData.mes_referencia})`;
       const existingIRRF = await base44.entities.Lancamento.filter({ numero_documento: `IRRF-${folhaData.mes_referencia}` });
       
       const payloadIRRF = {
         descricao: descIRRF,
         tipo: "despesa",
         valor: folhaData.irrf,
         vencimento: vencStr,
         categoria: "Impostos",
         cliente_fornecedor: "Receita Federal",
         numero_documento: `IRRF-${folhaData.mes_referencia}`,
         status: folhaData.status === "paga" ? "pago" : "pendente"
       };
       if (folhaData.status === "paga") payloadIRRF.data_pagamento = vencStr;

       if (existingIRRF.length === 0) {
         await base44.entities.Lancamento.create(payloadIRRF);
       } else if (existingIRRF[0].status !== "pago") {
          await base44.entities.Lancamento.update(existingIRRF[0].id, {
           valor: existingIRRF[0].valor + folhaData.irrf,
           status: folhaData.status === "paga" ? "pago" : "pendente",
           ...(folhaData.status === "paga" ? { data_pagamento: vencStr } : {})
         });
       }
     }
     
     // 4. FGTS
     if (folhaData.fgts > 0) {
       const descFGTS = `Guia FGTS - Folha (${folhaData.mes_referencia})`;
       const existingFGTS = await base44.entities.Lancamento.filter({ numero_documento: `FGTS-${folhaData.mes_referencia}` });
       
       const payloadFGTS = {
         descricao: descFGTS,
         tipo: "despesa",
         valor: folhaData.fgts,
         vencimento: vencStr,
         categoria: "Impostos",
         cliente_fornecedor: "Caixa Econômica Federal",
         numero_documento: `FGTS-${folhaData.mes_referencia}`,
         status: folhaData.status === "paga" ? "pago" : "pendente"
       };
       if (folhaData.status === "paga") payloadFGTS.data_pagamento = vencStr;

       if (existingFGTS.length === 0) {
         await base44.entities.Lancamento.create(payloadFGTS);
       } else if (existingFGTS[0].status !== "pago") {
          await base44.entities.Lancamento.update(existingFGTS[0].id, {
           valor: existingFGTS[0].valor + folhaData.fgts,
           status: folhaData.status === "paga" ? "pago" : "pendente",
           ...(folhaData.status === "paga" ? { data_pagamento: vencStr } : {})
         });
       }
     }
   };

   const handleDelete = async (id) => {
     if (!confirm("Excluir esta folha?")) return;
     await base44.entities.Folha.delete(id);
     load();
   };

   const toggleSelect = (id) => {
     const newSet = new Set(selected);
     if (newSet.has(id)) newSet.delete(id);
     else newSet.add(id);
     setSelected(newSet);
   };

   const handleGerarLote = async () => {
     if (!mesLote) { alert("Selecione o mês"); return; }
     if (!confirm(`Gerar folhas para ${colaboradores.length} colaborador(es) em ${mesLote}?`)) return;

     setGerandoLote(true);
     
     let regimeEmpresa = "simples_nacional";
     let config = { regime_tributario: "simples_nacional", cpp_no_das: true, fgts_percentual: 8, inss_patronal_percentual: 20 };
     try {
       const empresas = await base44.entities.EmpresaCliente.list();
       const emp = empresas[0] || null;
       let regime = emp?.regime_tributario || "Simples Nacional";
       if (regime === "Simples Nacional") regime = "simples_nacional";
       else if (regime === "Lucro Presumido") regime = "lucro_presumido";
       else if (regime === "Lucro Real") regime = "lucro_real";
       else regime = "simples_nacional";
       regimeEmpresa = regime;

       const cfgs = await base44.entities.ConfigEncargos.list();
       const configCustom = cfgs.find(c => c.regime_tributario === regimeEmpresa);
       if (configCustom) config = configCustom;
     } catch (e) {
       console.error("Erro ao buscar regime/config:", e);
     }

     let tabela = null;
     try {
       const tabelas = await base44.entities.TabelaIRRF.list();
       tabela = tabelas.find(t => t.competencia === mesLote || (t.competencia_inicio && t.competencia_inicio <= mesLote)) || tabelas[0] || null;
     } catch (e) {
       console.error("Erro ao buscar tabela IRRF:", e);
     }

     let criadas = 0;
     for (const col of colaboradores) {
       const existe = folhas.some(f => f.colaborador_id === col.id && f.mes_referencia === mesLote);
       if (!existe) {
         try {
           const salarioBruto = col.salario_base || 0;
           
           // Busca horas extras do ponto eletrônico para este mês ANTES de calcular impostos
           let horasExtrasValor = 0;
           try {
             const pontos = await base44.entities.RegistroPonto.filter({ colaborador_id: col.id });
             const pontosMes = pontos.filter(p => p.data?.startsWith(mesLote));
             const totalExtrasHoras = pontosMes.reduce((s, p) => s + (p.horas_extras || 0), 0);
             if (totalExtrasHoras > 0) {
               const valorHoraExtra = (salarioBruto / 220) * 1.5;
               horasExtrasValor = parseFloat((totalExtrasHoras * valorHoraExtra).toFixed(2));
             }
           } catch (e) {
             console.error("Erro ao buscar ponto para", col.nome, e);
           }
           
           const baseCalculo = salarioBruto + horasExtrasValor;
           const retemIRRF = col.retem_irrf !== false;
           
           const inssEmp = calcularINSSEmpregado(baseCalculo, mesLote);
           const irrf = retemIRRF ? calcularIRRF(baseCalculo, inssEmp.total, tabela, 0, 0) : { total: 0, detalhes: { irrf: 0, faixa: "Isento" } };
           const fgts = calcularFGTS(baseCalculo, config.fgts_percentual || 8);
           const inssPatronal = calcularINSSPatronal(baseCalculo, config);
           
           const liquido = baseCalculo - inssEmp.total - irrf.total;
           
           const novaFolha = {
             colaborador_id: col.id,
             colaborador_nome: col.nome,
             mes_referencia: mesLote,
             salario_base: salarioBruto,
             horas_extras_valor: horasExtrasValor,
             inss: inssEmp.total,
             irrf: irrf.total,
             fgts: fgts.total,
             inss_patronal: inssPatronal.total,
             salario_liquido: liquido,
             status: "rascunho"
           };
           await base44.entities.Folha.create(novaFolha);
           criadas++;
         } catch (e) {
           console.error("Falha ao gerar folha para", col.nome, e);
         }
       }
     }
     setGerandoLote(false);
     alert(`${criadas} folha(s) criada(s) com descontos calculados automaticamente!`);
     load();
   };

   const handleExportPDF = async (folha) => {
     try {
       const empresas = await base44.entities.EmpresaCliente.list();
       const empresa = empresas[0] || { razao_social: "Empresa Padrão", cnpj: "00.000.000/0000-00" };
       const col = colaboradores.find(c => c.id === folha.colaborador_id) || {};

       const doc = new jsPDF();
       const fmtMoney = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
       
       const drawHolerite = (startY, titulo) => {
         // Box exterior principal
         doc.rect(10, startY, 190, 110);
         
         // Linhas horizontais do cabeçalho
         doc.line(10, startY + 12, 200, startY + 12);
         doc.line(10, startY + 24, 200, startY + 24);
         
         // Linha vertical do cabeçalho dividindo empresa e título
         doc.line(130, startY, 130, startY + 12);
         
         // Textos Cabeçalho
         doc.setFont("helvetica", "bold");
         doc.setFontSize(9);
         doc.text(empresa.razao_social, 12, startY + 5);
         doc.setFontSize(7);
         doc.setFont("helvetica", "normal");
         doc.text(`CNPJ: ${empresa.cnpj || 'Não informado'}`, 12, startY + 9);
         
         doc.setFont("helvetica", "bold");
         doc.setFontSize(10);
         doc.text("RECIBO DE PAGAMENTO", 165, startY + 5, { align: "center" });
         doc.setFontSize(8);
         doc.text(titulo, 165, startY + 10, { align: "center" });
         
         // Dados do Funcionário
         doc.setFontSize(7);
         doc.setFont("helvetica", "normal");
         doc.text("Código", 12, startY + 16);
         doc.text("Nome do Funcionário", 30, startY + 16);
         doc.text("Cargo", 120, startY + 16);
         doc.text("Mês/Ano", 170, startY + 16);
         
         doc.setFont("helvetica", "bold");
         doc.setFontSize(8);
         doc.text(folha.colaborador_id?.slice(-5).toUpperCase() || "00001", 12, startY + 21);
         doc.text(folha.colaborador_nome || "", 30, startY + 21);
         doc.text(col.cargo || "Não informado", 120, startY + 21);
         doc.text(folha.mes_referencia?.split('-').reverse().join('/') || "", 170, startY + 21);
         
         // Tabela - Cabeçalho
         doc.setFillColor(240, 240, 240);
         doc.rect(10, startY + 24, 190, 6, "F");
         doc.rect(10, startY + 24, 190, 6); // Borda do cabeçalho
         
         doc.setFont("helvetica", "bold");
         doc.setFontSize(7);
         doc.text("Cód", 12, startY + 28);
         doc.text("Descrição", 25, startY + 28);
         doc.text("Referência", 110, startY + 28, { align: "center" });
         doc.text("Vencimentos", 145, startY + 28, { align: "right" });
         doc.text("Descontos", 195, startY + 28, { align: "right" });
         
         // Linhas verticais da tabela
         doc.line(22, startY + 24, 22, startY + 80);
         doc.line(95, startY + 24, 95, startY + 80);
         doc.line(125, startY + 24, 125, startY + 80);
         doc.line(160, startY + 24, 160, startY + 80);
         
         // Itens
         let yItem = startY + 34;
         doc.setFont("helvetica", "normal");
         doc.setFontSize(8);
         
         const addRow = (cod, desc, ref, venc, descValue) => {
           doc.text(cod, 12, yItem);
           doc.text(desc, 25, yItem);
           if (ref) doc.text(ref, 110, yItem, { align: "center" });
           if (venc) doc.text(fmtMoney(venc), 158, yItem, { align: "right" });
           if (descValue) doc.text(fmtMoney(descValue), 198, yItem, { align: "right" });
           yItem += 4.5;
         };
         
         if (folha.salario_base) addRow("001", "Salário Base", "30d", folha.salario_base, null);
         if (folha.horas_extras_valor) addRow("002", "Horas Extras", "", folha.horas_extras_valor, null);
         if (folha.adicional_noturno) addRow("003", "Adicional Noturno", "", folha.adicional_noturno, null);
         if (folha.ferias_valor) addRow("004", "Férias", "", folha.ferias_valor, null);
         if (folha.rescisao_valor) addRow("005", "Rescisão", "", folha.rescisao_valor, null);
         if (folha.outros_adicionais) addRow("099", "Outros Adicionais", "", folha.outros_adicionais, null);
         
         if (folha.inss) addRow("101", "INSS", "", null, folha.inss);
         if (folha.irrf) addRow("102", "IRRF", "", null, folha.irrf);
         if (folha.vale_transporte) addRow("103", "Vale Transporte", "", null, folha.vale_transporte);
         if (folha.adiantamento) addRow("104", "Adiantamento", "", null, folha.adiantamento);
         if (folha.emprestimo_empresa) addRow("105", "Empréstimo Empresa", "", null, folha.emprestimo_empresa);
         if (folha.emprestimo_governo) addRow("106", "Empréstimo Governo", "", null, folha.emprestimo_governo);
         if (folha.outros_descontos) addRow("199", "Outros Descontos", "", null, folha.outros_descontos);
         
         // Rodapé Totais
         doc.line(10, startY + 80, 200, startY + 80);
         doc.setFontSize(8);
         doc.text("Total de Vencimentos", 125, startY + 84);
         doc.text("Total de Descontos", 162, startY + 84);
         
         const totalVenc = (folha.salario_base || 0) + (folha.horas_extras_valor || 0) + (folha.adicional_noturno || 0) + (folha.ferias_valor || 0) + (folha.rescisao_valor || 0) + (folha.outros_adicionais || 0);
         const totalDesc = (folha.inss || 0) + (folha.irrf || 0) + (folha.vale_transporte || 0) + (folha.outros_descontos || 0) + (folha.adiantamento || 0) + (folha.emprestimo_empresa || 0) + (folha.emprestimo_governo || 0);
         
         doc.setFont("helvetica", "bold");
         doc.text(fmtMoney(totalVenc), 158, startY + 89, { align: "right" });
         doc.text(fmtMoney(totalDesc), 198, startY + 89, { align: "right" });
         
         // Líquido
         doc.line(10, startY + 92, 200, startY + 92);
         doc.setFontSize(9);
         doc.text("Valor Líquido", 125, startY + 98);
         
         doc.setFillColor(230, 240, 230);
         doc.rect(160, startY + 92, 40, 9, "F");
         doc.setFontSize(10);
         doc.text(fmtMoney(folha.salario_liquido || 0), 198, startY + 98, { align: "right" });
         
         // Bases
         doc.line(10, startY + 101, 200, startY + 101);
         doc.setFont("helvetica", "normal");
         doc.setFontSize(7);
         doc.text("Salário Base", 12, startY + 104);
         doc.text("Base Calc. INSS", 45, startY + 104);
         doc.text("Base Calc. FGTS", 85, startY + 104);
         doc.text("FGTS do Mês", 125, startY + 104);
         doc.text("Base Calc. IRRF", 165, startY + 104);
         
         doc.line(40, startY + 101, 40, startY + 110);
         doc.line(80, startY + 101, 80, startY + 110);
         doc.line(120, startY + 101, 120, startY + 110);
         doc.line(160, startY + 101, 160, startY + 110);
         
         doc.setFont("helvetica", "bold");
         doc.setFontSize(8);
         doc.text(fmtMoney(folha.salario_base || 0), 12, startY + 108);
         doc.text(fmtMoney(totalVenc), 45, startY + 108); // Simplificando
         doc.text(fmtMoney(totalVenc), 85, startY + 108);
         doc.text(fmtMoney(folha.fgts || 0), 125, startY + 108);
         const baseIRRF = totalVenc - (folha.inss || 0);
         doc.text(fmtMoney(baseIRRF), 165, startY + 108);
         
         // Assinatura
         doc.setFont("helvetica", "normal");
         doc.setFontSize(7);
         doc.text("Declaro ter recebido a importância líquida discriminada neste recibo.", 10, startY + 116);
         doc.line(10, startY + 128, 60, startY + 128);
         doc.text("Data", 35, startY + 132, { align: "center" });
         doc.line(80, startY + 128, 190, startY + 128);
         doc.text("Assinatura do Funcionário", 135, startY + 132, { align: "center" });
       };
       
       // Imprimir duas vias na mesma folha (padrão de holerite)
       drawHolerite(10, "VIA DO EMPREGADOR");
       
       doc.setLineDashPattern([2, 2], 0);
       doc.line(10, 145, 200, 145); // Linha de corte
       doc.setLineDashPattern([], 0);
       
       drawHolerite(155, "VIA DO EMPREGADO");

       doc.save(`Holerite_${folha.colaborador_nome}_${folha.mes_referencia}.pdf`);
     } catch (e) {
       console.error(e);
       alert("Erro ao gerar PDF.");
     }
   };

   const handleDeletarLote = async () => {
     if (selected.size === 0) { alert("Selecione folhas"); return; }
     if (!confirm(`Excluir ${selected.size} folha(s)?`)) return;

     for (const id of selected) {
       await base44.entities.Folha.delete(id);
     }
     setSelected(new Set());
     load();
   };

   const handleAprovarLote = async () => {
     if (selected.size === 0) { alert("Selecione folhas"); return; }
     if (!confirm(`Aprovar ${selected.size} folha(s) e enviar para o financeiro?`)) return;

     let aprovadas = 0;
     for (const id of selected) {
       const folha = folhas.find(f => f.id === id);
       if (folha && (!folha.status || folha.status?.toLowerCase() === "rascunho")) {
         try {
           const folhaData = { ...folha, status: "aprovada" };
           await base44.entities.Folha.update(id, { status: "aprovada" });
           await syncFinanceiro(folhaData);
           aprovadas++;
         } catch (e) {
           console.error("Erro ao aprovar a folha:", folha.id, e);
         }
       }
     }
     setSelected(new Set());
     if (aprovadas > 0) {
       alert(`${aprovadas} folha(s) aprovada(s) e enviada(s) ao financeiro!`);
     } else {
       alert("Nenhuma folha em rascunho selecionada para aprovação ou ocorreu um erro.");
     }
     load();
   };

   const filtered = folhas.filter(f => !filtroMes || f.mes_referencia === filtroMes || f.mes_referencia?.startsWith(filtroMes));
   const totalFolha = filtered.filter(f => f.status === "paga").reduce((s, f) => s + (f.salario_liquido || 0), 0);
   const totalBruto = filtered.reduce((s, f) => s + (f.salario_base || 0), 0);
   const totalDescontos = filtered.reduce((s, f) => s + ((f.inss || 0) + (f.irrf || 0) + (f.vale_transporte || 0) + (f.outros_descontos || 0)), 0);
   const totalColaboradores = new Set(filtered.map(f => f.colaborador_id)).size;

   // Lógica de Impressão
   const printItems = selected.size > 0 ? filtered.filter(f => selected.has(f.id)) : filtered;
   const printTotalBruto = printItems.reduce((s, f) => s + (f.salario_base || 0), 0);
   const printTotalDesc = printItems.reduce((s, f) => s + ((f.inss || 0) + (f.irrf || 0) + (f.vale_transporte || 0) + (f.outros_descontos || 0) + (f.adiantamento || 0) + (f.emprestimo_empresa || 0) + (f.emprestimo_governo || 0)), 0);
   const printTotalLiq = printItems.reduce((s, f) => s + (f.salario_liquido || 0), 0);

  return (
    <div className="space-y-6">
      {/* Relatório de Impressão */}
      <div className="hidden print:block w-full text-black font-sans">
        <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wider">Relatório de Pagamentos - Folha</h1>
            <p className="text-sm mt-1 text-gray-700">Competência: {filtroMes.split("-").reverse().join("/")}</p>
          </div>
          <div className="text-right text-sm text-gray-700">
            <p>Emitido em: {new Date().toLocaleDateString('pt-BR')}</p>
            <p>Total de Registros: {printItems.length}</p>
          </div>
        </div>
        
        <div className="flex gap-8 mb-6 p-4 rounded-lg bg-gray-100 print:bg-gray-100 !print:bg-opacity-100" style={{ WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact' }}>
          <div>
            <p className="text-xs uppercase text-gray-600 font-semibold">Total Bruto</p>
            <p className="text-xl font-bold">{fmt(printTotalBruto)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-600 font-semibold">Total Descontos</p>
            <p className="text-xl font-bold text-red-600">-{fmt(printTotalDesc)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-600 font-semibold">Total a Pagar (Líquido)</p>
            <p className="text-xl font-bold text-green-500">{fmt(printTotalLiq)}</p>
          </div>
        </div>

        <table className="w-full border-collapse mt-4">
          <thead>
            <tr className="border-b-2 border-black bg-gray-100">
              <th className="py-2 px-2 text-left font-bold text-sm">Colaborador</th>
              <th className="py-2 px-2 text-center font-bold text-sm">Mês</th>
              <th className="py-2 px-2 text-right font-bold text-sm">Bruto</th>
              <th className="py-2 px-2 text-right font-bold text-sm">Descontos</th>
              <th className="py-2 px-2 text-right font-bold text-sm">Valor a Pagar</th>
              <th className="py-2 px-2 text-left font-bold text-sm pl-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {printItems.map((f, idx) => {
              const descontos = (f.inss || 0) + (f.irrf || 0) + (f.vale_transporte || 0) + (f.outros_descontos || 0) + (f.adiantamento || 0) + (f.emprestimo_empresa || 0) + (f.emprestimo_governo || 0);
              return (
                <tr key={f.id} className={`border-b border-gray-300 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50 print:bg-gray-50 !print:bg-opacity-100"}`} style={{ WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact' }}>
                  <td className="py-2 px-2 text-left text-sm font-medium">{f.colaborador_nome}</td>
                  <td className="py-2 px-2 text-center text-sm">{f.mes_referencia}</td>
                  <td className="py-2 px-2 text-right text-sm">{fmt(f.salario_base)}</td>
                  <td className="py-2 px-2 text-right text-sm text-red-600">-{fmt(descontos)}</td>
                  <td className="py-2 px-2 text-right text-sm font-bold">{fmt(f.salario_liquido)}</td>
                  <td className="py-2 px-2 text-left text-sm pl-4 uppercase">{f.status}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap bg-card border border-border rounded-lg p-4 print:hidden">
        <select value={filtroMes.split("-")[1] || new Date().getMonth() + 1} onChange={e => setFiltroMes(filtroAno + "-" + String(e.target.value).padStart(2, "0"))}
          className="bg-muted border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary">
          {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"].map((m, i) => (
            <option key={i} value={String(i + 1).padStart(2, "0")}>{m}</option>
          ))}
        </select>
        <input type="number" min="2020" max="2100" value={filtroAno} onChange={e => setFiltroAno(e.target.value)}
          className="bg-muted border border-border rounded-lg px-3 py-1.5 text-sm text-foreground w-20 focus:outline-none focus:border-primary" />
        <span className="text-xs text-muted-foreground">{filtered.length} registros</span>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 print:hidden">
        <div className="p-4 bg-card border border-border rounded-xl">
          <p className="text-xs text-muted-foreground mb-1">Total Colaboradores</p>
          <p className="text-2xl font-bold text-foreground">{totalColaboradores}</p>
          <p className="text-xs text-muted-foreground mt-1">{filtered.length} folhas</p>
        </div>
        <div className="p-4 bg-card border border-border rounded-xl">
          <p className="text-xs text-muted-foreground mb-1">Folha Salarial Total</p>
          <p className="text-2xl font-bold text-green-400">{fmt(totalBruto)}</p>
          <p className="text-xs text-muted-foreground mt-1">funcionários ativos</p>
        </div>
        <div className="p-4 bg-card border border-border rounded-xl">
          <p className="text-xs text-muted-foreground mb-1">Folha {filtroMes.split("-").reverse().join("/")}</p>
          <p className="text-2xl font-bold text-blue-400">{fmt(totalFolha)}</p>
          <p className="text-xs text-muted-foreground mt-1">Bruto: {fmt(totalBruto)}</p>
        </div>
        <div className="p-4 bg-card border border-border rounded-xl">
          <p className="text-xs text-muted-foreground mb-1">Pró-labore Mês</p>
          <p className="text-2xl font-bold text-yellow-400">{fmt(0)}</p>
          <p className="text-xs text-muted-foreground mt-1">INSS: R$ 0.00</p>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2 print:hidden">
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <>
              <button onClick={handleDeletarLote} className="px-3 py-2 bg-red-500/10/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/10/30">
                Excluir {selected.size}
              </button>
              <button onClick={handleAprovarLote} className="px-3 py-2 bg-primary/10/20 text-blue-400 rounded-lg text-sm font-medium hover:bg-primary/10/30">
                Aprovar {selected.size}
              </button>
              <span className="text-xs text-muted-foreground">{selected.size} selecionada{selected.size > 1 ? "s" : ""}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <PrintButton label={selected.size > 0 ? `Imprimir Selecionadas (${selected.size})` : "Imprimir Relatório Geral"} />
          <input type="month" value={mesLote} onChange={e => setMesLote(e.target.value)} 
            className="px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground" />
          <button onClick={handleGerarLote} disabled={gerandoLote} className="px-3 py-2 bg-green-500/10/20 text-green-400 rounded-lg text-sm font-medium hover:bg-green-500/10/30 disabled:opacity-50">
            {gerandoLote ? "Gerando..." : "Gerar Lote"}
          </button>
          <button onClick={() => { setEditItem(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
            <Plus size={16} /> Nova Folha
          </button>
        </div>
      </div>

      <div className={`bg-card border border-border rounded-xl overflow-hidden print:hidden`}>
        {loading ? <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
          : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign size={28} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma folha para este mês</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs text-muted-foreground px-4 py-3 w-8">
                      <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0}
                        onChange={() => {
                          if (selected.size === filtered.length) setSelected(new Set());
                          else setSelected(new Set(filtered.map(f => f.id)));
                        }}
                        className="cursor-pointer" />
                    </th>
                    <th className="text-left text-xs text-muted-foreground px-4 py-3">Colaborador</th>
                    <th className="text-left text-xs text-muted-foreground px-4 py-3">Mês</th>
                    <th className="text-right text-xs text-muted-foreground px-4 py-3">Salário Base</th>
                    <th className="text-right text-xs text-muted-foreground px-4 py-3">Descontos</th>
                    <th className="text-right text-xs text-muted-foreground px-4 py-3">Líquido</th>
                    <th className="text-left text-xs text-muted-foreground px-4 py-3">Status</th>
                    <th className="text-right text-xs text-muted-foreground px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(f => {
                    const s = statusConfig[f.status] || statusConfig.rascunho;
                    const descontos = (f.inss || 0) + (f.irrf || 0) + (f.vale_transporte || 0) + (f.outros_descontos || 0) + (f.adiantamento || 0) + (f.emprestimo_empresa || 0) + (f.emprestimo_governo || 0);
                    return (
                      <tr key={f.id} className={`border-b border-border/50 transition-colors ${selected.has(f.id) ? "bg-primary/10" : "hover:bg-muted/30"} ${!selected.has(f.id) ? "unselected-row" : ""}`}>
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={selected.has(f.id)} onChange={() => {
                            const newSet = new Set(selected);
                            if (newSet.has(f.id)) newSet.delete(f.id);
                            else newSet.add(f.id);
                            setSelected(newSet);
                          }} className="cursor-pointer" />
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-foreground">{f.colaborador_nome}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{f.mes_referencia}</td>
                        <td className="px-4 py-3 text-right text-sm text-foreground">{fmt(f.salario_base)}</td>
                        <td className="px-4 py-3 text-right text-sm text-red-400">-{fmt(descontos)}</td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-green-400">{fmt(f.salario_liquido)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>{s.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-3">
                            <button onClick={() => handleExportPDF(f)} title="Gerar PDF" className="text-muted-foreground hover:text-primary"><Download size={15}/></button>
                            <button onClick={() => {
                              setSelected(new Set([f.id]));
                              setTimeout(() => window.print(), 100);
                            }} title="Imprimir" className="text-muted-foreground hover:text-primary"><Printer size={15}/></button>
                            <button onClick={() => { setEditItem(f); setModalOpen(true); }} className="text-xs text-muted-foreground hover:text-foreground">Editar</button>
                            <button onClick={() => handleDelete(f.id)} className="text-xs text-red-400 hover:underline">Excluir</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {modalOpen && (
        <FolhaModal
          folha={editItem}
          colaboradores={colaboradores}
          onClose={() => { setModalOpen(false); setEditItem(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}