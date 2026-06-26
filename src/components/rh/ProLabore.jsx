import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, X, DollarSign, Printer, Download, Users, Pencil, Trash2 } from "lucide-react";
import { jsPDF } from "jspdf";
import PrintButton from "@/components/shared/PrintButton";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const statusConfig = {
  rascunho: { label: "Rascunho", color: "text-muted-foreground", bg: "bg-muted" },
  aprovado: { label: "Aprovado", color: "text-blue-400", bg: "bg-blue-400/10" },
  pago: { label: "Pago", color: "text-green-400", bg: "bg-green-400/10" },
};

function ProLaboreModal({ proLabore, socios, onClose, onSave, onOpenSocios }) {
  const [form, setForm] = useState({
    socio_id: proLabore?.socio_id || "",
    socio_nome: proLabore?.socio_nome || "",
    mes_referencia: proLabore?.mes_referencia || new Date().toISOString().slice(0, 7),
    valor_bruto: proLabore?.valor_bruto || "",
    inss: proLabore?.inss || 0,
    irrf: proLabore?.irrf || 0,
    valor_liquido: proLabore?.valor_liquido || 0,
    status: proLabore?.status || "rascunho",
    data_pagamento: proLabore?.data_pagamento || "",
  });
  const [saving, setSaving] = useState(false);
  const [tabelaIRRF, setTabelaIRRF] = useState(null);

  useEffect(() => {
    const carregarTabela = async () => {
      try {
        const tabelas = await base44.entities.TabelaIRRF.list();
        const comp = form.mes_referencia || new Date().toISOString().slice(0, 7);
        const tabela = tabelas.find(t => t.competencia === comp || (t.competencia_inicio && t.competencia_inicio <= comp)) || tabelas[0] || null;
        setTabelaIRRF(tabela);
      } catch (err) {
        console.error(err);
      }
    };
    carregarTabela();
  }, [form.mes_referencia]);

  const handleSocio = (id) => {
    const s = socios.find(x => x.id === id);
    setForm(f => ({ ...f, socio_id: id, socio_nome: s?.nome || "" }));
  };

  const calcular = () => {
    const bruto = parseFloat(form.valor_bruto) || 0;
    if (!bruto) return;
    
    // INSS Sócio is flat 11% up to the max ceiling of the year. 
    // In 2024, ceiling is 7786.02, max INSS is 856.46 (11% of ceiling). 
    // Let's do 11% with a standard max for now.
    const tetoINSS = 7786.02;
    const baseINSS = Math.min(bruto, tetoINSS);
    const inss = Math.round(baseINSS * 0.11 * 100) / 100;

    // IRRF
    const socioSelecionado = socios.find(s => s.id === form.socio_id);
    const retemIRRF = socioSelecionado?.retem_irrf !== false;

    let irrf = 0;
    if (retemIRRF) {
      const descontoSimplificado = tabelaIRRF?.desconto_simplificado || 564.80; 
      const deducaoLegal = inss;
      const usarSimplificado = descontoSimplificado > deducaoLegal;
      const deducaoAplicada = usarSimplificado ? descontoSimplificado : deducaoLegal;
      const baseIRRF = Math.max(0, bruto - deducaoAplicada);

      const faixas = tabelaIRRF?.faixas && tabelaIRRF.faixas.length > 0 ? tabelaIRRF.faixas : [
        { faixa_inicial: 0, faixa_final: 2259.20, aliquota: 0, parcela_deduzir: 0 },
        { faixa_inicial: 2259.21, faixa_final: 2826.65, aliquota: 7.5, parcela_deduzir: 169.44 },
        { faixa_inicial: 2826.66, faixa_final: 3751.05, aliquota: 15.0, parcela_deduzir: 381.44 },
        { faixa_inicial: 3751.06, faixa_final: 4664.68, aliquota: 22.5, parcela_deduzir: 662.77 },
        { faixa_inicial: 4664.69, faixa_final: 999999999, aliquota: 27.5, parcela_deduzir: 896.00 }
      ];

      let faixaAplicada = null;
      for (const faixa of faixas) {
        if (baseIRRF >= faixa.faixa_inicial && baseIRRF <= faixa.faixa_final) {
          faixaAplicada = faixa; break;
        }
      }
      if (!faixaAplicada) faixaAplicada = faixas[faixas.length - 1];

      if (faixaAplicada.aliquota > 0) {
        irrf = Math.max(0, Math.round(((baseIRRF * (faixaAplicada.aliquota / 100)) - faixaAplicada.parcela_deduzir) * 100) / 100);
      }
    }

    const liquido = bruto - inss - irrf;

    setForm(f => ({
      ...f,
      inss,
      irrf,
      valor_liquido: Math.round(liquido * 100) / 100
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const bruto = parseFloat(form.valor_bruto) || 0;
    const inss = parseFloat(form.inss) || 0;
    const irrf = parseFloat(form.irrf) || 0;
    const data = {
      ...form,
      valor_bruto: bruto,
      inss,
      irrf,
      valor_liquido: bruto - inss - irrf
    };
    try {
      await onSave(data);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card">
          <h2 className="text-base font-semibold text-foreground">{proLabore ? "Editar Pró-labore" : "Lançar Pró-labore"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs text-muted-foreground">Sócio *</label>
                <button type="button" onClick={onOpenSocios} className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Plus size={12} /> Novo Sócio
                </button>
              </div>
              <select required value={form.socio_id} onChange={e => handleSocio(e.target.value)}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                <option value="">Selecionar</option>
                {socios.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Mês de Referência *</label>
              <input required type="month" value={form.mes_referencia} onChange={e => setForm(f => ({ ...f, mes_referencia: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Valor Bruto (R$) *</label>
              <input required type="number" step="0.01" value={form.valor_bruto} onChange={e => setForm(f => ({ ...f, valor_bruto: e.target.value }))}
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

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Descontos</p>
            <button type="button" onClick={calcular} className="text-xs text-primary hover:underline font-semibold">
              🧮 Calcular
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">INSS (11%)</label>
              <input type="number" step="0.01" value={form.inss} onChange={e => setForm(f => ({ ...f, inss: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">IRRF</label>
              <input type="number" step="0.01" value={form.irrf} onChange={e => setForm(f => ({ ...f, irrf: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
          </div>

          <div className="p-4 bg-muted rounded-xl mt-4">
            <div className="flex justify-between text-base font-bold text-green-400">
              <span>Líquido a Receber</span>
              <span>{fmt((parseFloat(form.valor_bruto)||0) - (parseFloat(form.inss)||0) - (parseFloat(form.irrf)||0))}</span>
            </div>
          </div>

          {form.status === "pago" && (
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Data de Pagamento</label>
              <input type="date" value={form.data_pagamento} onChange={e => setForm(f => ({ ...f, data_pagamento: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm bg-muted text-muted-foreground">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm bg-primary text-primary-foreground disabled:opacity-50">
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SociosModal({ socios, onClose, onSave, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [editSocio, setEditSocio] = useState(null);
  const [form, setForm] = useState({ nome: "", cpf: "", participacao: "", cargo: "", retem_irrf: false });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(editSocio ? editSocio.id : null, { ...form, participacao: parseFloat(form.participacao) || 0 });
      setShowForm(false);
      setEditSocio(null);
      setForm({ nome: "", cpf: "", participacao: "", cargo: "" });
    } catch (err) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (s) => {
    setEditSocio(s);
    setForm({ nome: s.nome || "", cpf: s.cpf || "", participacao: s.participacao || "", cargo: s.cargo || "", retem_irrf: s.retem_irrf || false });
    setShowForm(true);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Gerenciar Sócios</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {!showForm ? (
            <>
              <div className="flex justify-end">
                <button onClick={() => { setEditSocio(null); setForm({ nome: "", cpf: "", participacao: "", cargo: "" }); setShowForm(true); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
                  <Plus size={14} /> Novo Sócio
                </button>
              </div>
              
              {socios.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users size={24} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum sócio cadastrado</p>
                </div>
              ) : (
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-4 py-2 text-muted-foreground font-medium">Nome</th>
                        <th className="px-4 py-2 text-muted-foreground font-medium">CPF</th>
                        <th className="px-4 py-2 text-muted-foreground font-medium">Cargo</th>
                        <th className="px-4 py-2 text-right text-muted-foreground font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {socios.map(s => (
                        <tr key={s.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-2 text-foreground">{s.nome}</td>
                          <td className="px-4 py-2 text-muted-foreground">{s.cpf || "—"}</td>
                          <td className="px-4 py-2 text-muted-foreground">{s.cargo || "—"}</td>
                          <td className="px-4 py-2">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => handleEdit(s)} className="p-1.5 text-muted-foreground hover:text-foreground"><Pencil size={13} /></button>
                              <button onClick={() => { if(confirm("Excluir sócio?")) onDelete(s.id); }} className="p-1.5 text-red-400 hover:text-red-300"><Trash2 size={13} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 bg-muted/20 p-4 rounded-lg border border-border">
              <h3 className="text-sm font-semibold mb-2">{editSocio ? "Editar Sócio" : "Cadastrar Sócio"}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs text-muted-foreground mb-1">Nome *</label>
                  <input required value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">CPF</label>
                  <input value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Cargo</label>
                  <input value={form.cargo} onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                </div>
                <div className="col-span-2 flex items-center gap-2 mt-2">
                  <input type="checkbox" id="retem_irrf_socio" checked={form.retem_irrf} onChange={e => setForm(f => ({ ...f, retem_irrf: e.target.checked }))} className="cursor-pointer" />
                  <label htmlFor="retem_irrf_socio" className="text-xs text-muted-foreground cursor-pointer">Reter IRPF</label>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">{saving ? "Salvando..." : "Salvar"}</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm hover:bg-muted/80">Cancelar</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProLabore() {
  const [registros, setRegistros] = useState([]);
  const [socios, setSocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [sociosModalOpen, setSociosModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  
  const [filtroMes, setFiltroMes] = useState(new Date().toISOString().slice(0, 7));
  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear().toString());
  const [selected, setSelected] = useState(new Set());

  const load = async () => {
    setLoading(true);
    try {
      const socs = await base44.entities.Socio.list().catch(() => []);
      setSocios(socs);
      
      const regs = await base44.entities.ProLabore.list("-mes_referencia").catch(() => []);
      setRegistros(regs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (data) => {
    if (editItem) {
      await base44.entities.ProLabore.update(editItem.id, data);
    } else {
      await base44.entities.ProLabore.create(data);
    }
    
    if (data.status === "aprovado" || data.status === "pago") {
      await syncFinanceiro(data);
    }
    
    setModalOpen(false);
    setEditItem(null);
    load();
  };
  
  const syncFinanceiro = async (proLaboreData) => {
     const vencimentoPadrao = new Date();
     vencimentoPadrao.setDate(vencimentoPadrao.getDate() + 5); 
     const vencStr = proLaboreData.data_pagamento || vencimentoPadrao.toISOString().split("T")[0];
     
     // 1. Líquido Pró-labore
     if (proLaboreData.valor_liquido > 0) {
       const descLiq = `Pró-labore - ${proLaboreData.socio_nome} (${proLaboreData.mes_referencia})`;
       const existingLiq = await base44.entities.Lancamento.filter({ numero_documento: `PROLABORE-${proLaboreData.socio_id}-${proLaboreData.mes_referencia}` });
       if (existingLiq.length === 0) {
         await base44.entities.Lancamento.create({
           descricao: descLiq,
           tipo: "despesa",
           valor: proLaboreData.valor_liquido,
           vencimento: vencStr,
           categoria: "Salários",
           cliente_fornecedor: proLaboreData.socio_nome,
           numero_documento: `PROLABORE-${proLaboreData.socio_id}-${proLaboreData.mes_referencia}`,
           status: "pendente"
         });
       } else if (existingLiq[0].status !== "pago") {
         await base44.entities.Lancamento.update(existingLiq[0].id, {
           valor: proLaboreData.valor_liquido
         });
       }
     }

     // 2. INSS Pró-labore
     if (proLaboreData.inss > 0) {
       const descINSS = `Guia INSS Pró-labore (${proLaboreData.mes_referencia})`;
       const existingINSS = await base44.entities.Lancamento.filter({ numero_documento: `INSS-PROLABORE-${proLaboreData.mes_referencia}` });
       if (existingINSS.length === 0) {
         await base44.entities.Lancamento.create({
           descricao: descINSS,
           tipo: "despesa",
           valor: proLaboreData.inss,
           vencimento: vencStr,
           categoria: "Impostos",
           cliente_fornecedor: "Receita Federal",
           numero_documento: `INSS-PROLABORE-${proLaboreData.mes_referencia}`,
           status: "pendente"
         });
       } else if (existingINSS[0].status !== "pago") {
         await base44.entities.Lancamento.update(existingINSS[0].id, {
           valor: existingINSS[0].valor + proLaboreData.inss 
         });
       }
     }
     
     // 3. IRRF Pró-labore
     if (proLaboreData.irrf > 0) {
       const descIRRF = `Guia IRRF Pró-labore (${proLaboreData.mes_referencia})`;
       const existingIRRF = await base44.entities.Lancamento.filter({ numero_documento: `IRRF-PROLABORE-${proLaboreData.mes_referencia}` });
       if (existingIRRF.length === 0) {
         await base44.entities.Lancamento.create({
           descricao: descIRRF,
           tipo: "despesa",
           valor: proLaboreData.irrf,
           vencimento: vencStr,
           categoria: "Impostos",
           cliente_fornecedor: "Receita Federal",
           numero_documento: `IRRF-PROLABORE-${proLaboreData.mes_referencia}`,
           status: "pendente"
         });
       } else if (existingIRRF[0].status !== "pago") {
          await base44.entities.Lancamento.update(existingIRRF[0].id, {
           valor: existingIRRF[0].valor + proLaboreData.irrf
         });
       }
     }
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir este lançamento de pró-labore?")) return;
    await base44.entities.ProLabore.delete(id);
    load();
  };

  const handleSaveSocio = async (id, data) => {
    if (id) {
      await base44.entities.Socio.update(id, data);
    } else {
      await base44.entities.Socio.create(data);
    }
    load();
  };

  const handleDeleteSocio = async (id) => {
    await base44.entities.Socio.delete(id);
    load();
  };

  const handleDeletarLote = async () => {
    if (selected.size === 0) { alert("Selecione lançamentos"); return; }
    if (!confirm(`Excluir ${selected.size} lançamento(s)?`)) return;

    for (const id of selected) {
      await base44.entities.ProLabore.delete(id);
    }
    setSelected(new Set());
    load();
  };

  const handleAprovarLote = async () => {
    if (selected.size === 0) { alert("Selecione lançamentos"); return; }
    if (!confirm(`Aprovar ${selected.size} lançamento(s) e enviar para o financeiro?`)) return;

    let aprovadas = 0;
    for (const id of selected) {
      const p = registros.find(r => r.id === id);
      if (p && (!p.status || p.status?.toLowerCase() === "rascunho")) {
        try {
          const pData = { ...p, status: "aprovado" };
          await base44.entities.ProLabore.update(id, { status: "aprovado" });
          await syncFinanceiro(pData);
          aprovadas++;
        } catch (e) {
          console.error("Erro ao aprovar pró-labore:", p.id, e);
        }
      }
    }
    setSelected(new Set());
    if (aprovadas > 0) {
      alert(`${aprovadas} lançamento(s) aprovado(s) e enviado(s) ao financeiro!`);
    } else {
      alert("Nenhum lançamento em rascunho selecionado para aprovação.");
    }
    load();
  };

  const filtered = registros.filter(r => !filtroMes || r.mes_referencia === filtroMes);
  const totalBruto = filtered.reduce((acc, r) => acc + (r.valor_bruto || 0), 0);
  const totalLiquido = filtered.reduce((acc, r) => acc + (r.valor_liquido || 0), 0);

  // Lógica de Impressão
  const printTotalDesc = filtered.reduce((acc, r) => acc + (r.inss || 0) + (r.irrf || 0), 0);

  return (
    <div className="space-y-6">
      {/* Relatório de Impressão */}
      <div className="hidden print:block w-full text-black font-sans">
        <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wider">Relatório de Pró-labore</h1>
            <p className="text-sm mt-1 text-gray-700">Competência: {filtroMes.split("-").reverse().join("/")}</p>
          </div>
          <div className="text-right text-sm text-gray-700">
            <p>Emitido em: {new Date().toLocaleDateString('pt-BR')}</p>
            <p>Total de Registros: {filtered.length}</p>
          </div>
        </div>
        
        <div className="flex gap-8 mb-6 p-4 rounded-lg bg-gray-100 print:bg-gray-100 !print:bg-opacity-100" style={{ WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact' }}>
          <div>
            <p className="text-xs uppercase text-gray-600 font-semibold">Total Bruto</p>
            <p className="text-xl font-bold">{fmt(totalBruto)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-600 font-semibold">Total Descontos (Guias)</p>
            <p className="text-xl font-bold text-red-600">-{fmt(printTotalDesc)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-600 font-semibold">Total a Pagar (Líquido)</p>
            <p className="text-xl font-bold text-green-500">{fmt(totalLiquido)}</p>
          </div>
        </div>

        <table className="w-full border-collapse mt-4">
          <thead>
            <tr className="border-b-2 border-black bg-gray-100">
              <th className="py-2 px-2 text-left font-bold text-sm">Sócio (Colaborador)</th>
              <th className="py-2 px-2 text-center font-bold text-sm">Mês</th>
              <th className="py-2 px-2 text-right font-bold text-sm">Bruto</th>
              <th className="py-2 px-2 text-right font-bold text-sm">Descontos</th>
              <th className="py-2 px-2 text-right font-bold text-sm">Valor a Pagar</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, idx) => {
              const descontos = (r.inss || 0) + (r.irrf || 0);
              return (
                <tr key={r.id} className={`border-b border-gray-300 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50 print:bg-gray-50 !print:bg-opacity-100"}`} style={{ WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact' }}>
                  <td className="py-2 px-2 text-left text-sm font-medium">{r.socio_nome}</td>
                  <td className="py-2 px-2 text-center text-sm">{r.mes_referencia}</td>
                  <td className="py-2 px-2 text-right text-sm">{fmt(r.valor_bruto)}</td>
                  <td className="py-2 px-2 text-right text-sm text-red-600">-{fmt(descontos)}</td>
                  <td className="py-2 px-2 text-right text-sm font-bold">{fmt(r.valor_liquido)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 print:hidden">
        <div className="p-4 bg-card border border-border rounded-xl">
          <p className="text-xs text-muted-foreground mb-1">Total Bruto</p>
          <p className="text-2xl font-bold text-foreground">{fmt(totalBruto)}</p>
        </div>
        <div className="p-4 bg-card border border-border rounded-xl">
          <p className="text-xs text-muted-foreground mb-1">Total Líquido</p>
          <p className="text-2xl font-bold text-green-400">{fmt(totalLiquido)}</p>
        </div>
        <div className="p-4 bg-card border border-border rounded-xl">
          <p className="text-xs text-muted-foreground mb-1">Guias (INSS + IRRF)</p>
          <p className="text-2xl font-bold text-yellow-400">{fmt(filtered.reduce((acc, r) => acc + (r.inss || 0) + (r.irrf || 0), 0))}</p>
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
              <span className="text-xs text-muted-foreground">{selected.size} selecionado{selected.size > 1 ? "s" : ""}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <PrintButton label="Imprimir" />
          <button onClick={() => setSociosModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:text-foreground">
            <Users size={16} /> Gerenciar Sócios
          </button>
          <button onClick={() => { setEditItem(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
            <Plus size={16} /> Lançar Pró-labore
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden print:hidden">
        {loading ? <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
          : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign size={28} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum pró-labore lançado neste mês</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left text-xs text-muted-foreground px-4 py-3 w-8">
                      <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0}
                        onChange={() => {
                          if (selected.size === filtered.length) setSelected(new Set());
                          else setSelected(new Set(filtered.map(f => f.id)));
                        }}
                        className="cursor-pointer" />
                    </th>
                    <th className="text-left text-xs text-muted-foreground px-4 py-3">Sócio</th>
                    <th className="text-left text-xs text-muted-foreground px-4 py-3">Mês</th>
                    <th className="text-right text-xs text-muted-foreground px-4 py-3">Bruto</th>
                    <th className="text-right text-xs text-muted-foreground px-4 py-3">INSS</th>
                    <th className="text-right text-xs text-muted-foreground px-4 py-3">IRRF</th>
                    <th className="text-right text-xs text-muted-foreground px-4 py-3">Líquido</th>
                    <th className="text-left text-xs text-muted-foreground px-4 py-3">Status</th>
                    <th className="text-right text-xs text-muted-foreground px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => {
                    const s = statusConfig[r.status] || statusConfig.rascunho;
                    return (
                      <tr key={r.id} className={`border-b border-border/50 transition-colors ${selected.has(r.id) ? "bg-primary/10" : "hover:bg-muted/30"}`}>
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={selected.has(r.id)} onChange={() => {
                            const newSet = new Set(selected);
                            if (newSet.has(r.id)) newSet.delete(r.id);
                            else newSet.add(r.id);
                            setSelected(newSet);
                          }} className="cursor-pointer" />
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-foreground">{r.socio_nome}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{r.mes_referencia}</td>
                        <td className="px-4 py-3 text-right text-sm text-foreground">{fmt(r.valor_bruto)}</td>
                        <td className="px-4 py-3 text-right text-sm text-yellow-400">-{fmt(r.inss)}</td>
                        <td className="px-4 py-3 text-right text-sm text-yellow-400">-{fmt(r.irrf)}</td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-green-400">{fmt(r.valor_liquido)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>{s.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-3">
                            <button onClick={() => { setEditItem(r); setModalOpen(true); }} className="text-xs text-muted-foreground hover:text-foreground">Editar</button>
                            <button onClick={() => handleDelete(r.id)} className="text-xs text-red-400 hover:underline">Excluir</button>
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

      {modalOpen && <ProLaboreModal proLabore={editItem} socios={socios} onClose={() => { setModalOpen(false); setEditItem(null); }} onSave={handleSave} onOpenSocios={() => setSociosModalOpen(true)} />}
      {sociosModalOpen && <SociosModal socios={socios} onClose={() => setSociosModalOpen(false)} onSave={handleSaveSocio} onDelete={handleDeleteSocio} />}
    </div>
  );
}