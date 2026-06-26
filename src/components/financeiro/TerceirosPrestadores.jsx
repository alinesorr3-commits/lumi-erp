import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import PrintButton from "@/components/shared/PrintButton";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function PrestadorForm({ item, onSave, onCancel }) {
  const [form, setForm] = useState({
    nome: item?.nome || "",
    cargo_funcao: item?.cargo_funcao || "",
    tipo_contrato: item?.tipo_contrato || "Autônomo",
    cpf_cnpj: item?.cpf_cnpj || "",
    chave_pix: item?.chave_pix || "",
    banco: item?.banco || "",
    valor_contrato: item?.valor_contrato || "",
    quantidade_parcelas: item?.quantidade_parcelas || "",
    descricao_contrato: item?.descricao_contrato || "",
    status: item?.status || "Ativo",
    observacoes: item?.observacoes || "",
  });
  const [saving, setSaving] = useState(false);
  const inp = (f, type = "text") => ({ type, value: form[f], onChange: e => setForm(p => ({ ...p, [f]: e.target.value })), className: "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" });
  const handleSubmit = async (e) => { e.preventDefault(); setSaving(true); await onSave({ ...form, valor_contrato: parseFloat(form.valor_contrato) || 0, quantidade_parcelas: parseInt(form.quantidade_parcelas) || null }); setSaving(false); };

  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-4">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div><label className="block text-xs text-muted-foreground mb-1">Nome *</label><input required {...inp("nome")} /></div>
          <div><label className="block text-xs text-muted-foreground mb-1">Cargo / Função</label><input {...inp("cargo_funcao")} /></div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Tipo de Contrato</label>
            <select value={form.tipo_contrato} onChange={e => setForm(p => ({ ...p, tipo_contrato: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
              {["Autônomo", "PJ", "Eventual", "Consultor"].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div><label className="block text-xs text-muted-foreground mb-1">CPF/CNPJ</label><input {...inp("cpf_cnpj")} /></div>
          <div><label className="block text-xs text-muted-foreground mb-1">Chave PIX</label><input {...inp("chave_pix")} /></div>
          <div><label className="block text-xs text-muted-foreground mb-1">Banco</label><input {...inp("banco")} /></div>
          <div><label className="block text-xs text-muted-foreground mb-1">Valor do Contrato (R$)</label><input {...inp("valor_contrato", "number")} step="0.01" /></div>
          <div><label className="block text-xs text-muted-foreground mb-1">Qtd. Parcelas do Contrato</label><input {...inp("quantidade_parcelas", "number")} /></div>
          <div className="col-span-2"><label className="block text-xs text-muted-foreground mb-1">Descrição do Contrato</label><input {...inp("descricao_contrato")} /></div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Status</label>
            <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
              <option>Ativo</option><option>Inativo</option>
            </select>
          </div>
          <div><label className="block text-xs text-muted-foreground mb-1">Observações</label><input {...inp("observacoes")} /></div>
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">{saving ? "Salvando..." : "Salvar"}</button>
          <button type="button" onClick={onCancel} className="px-5 py-2 bg-muted text-muted-foreground rounded-lg text-sm">Cancelar</button>
        </div>
      </form>
    </div>
  );
}

function PagamentoForm({ prestador, onSave, onCancel }) {
  const hoje = new Date();
  const [form, setForm] = useState({
    valor: "",
    valor_desconto: "",
    data_pagamento: hoje.toISOString().slice(0, 10),
    mes_ref: MESES[hoje.getMonth()],
    ano_ref: String(hoje.getFullYear()),
    descricao: "",
    via: "PIX",
    conta_bancaria_id: "",
    dados_cheque: "",
    beneficiario: "Titular",
    natureza_servico: "",
  });
  const [saving, setSaving] = useState(false);
  const [contas, setContas] = useState([]);
  
  useEffect(() => {
    base44.entities.ContaBancaria.list().then(setContas);
  }, []);
  const inp = (f, type = "text") => ({ type, value: form[f], onChange: e => setForm(p => ({ ...p, [f]: e.target.value })), className: "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" });
  const sel = (f, opts) => <select value={form[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">{opts.map(o => <option key={o}>{o}</option>)}</select>;

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    await onSave({ 
      ...form, 
      prestador_id: prestador.id, 
      prestador_nome: prestador.nome, 
      valor: parseFloat(form.valor) || 0,
      valor_desconto: parseFloat(form.valor_desconto) || 0
    });
    setSaving(false);
  };

  return (
    <div className="mt-3 border-t border-border pt-3">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-4 gap-3 mb-3">
          <div><label className="block text-xs text-muted-foreground mb-1">Valor Bruto (R$)</label><input required type="number" step="0.01" {...inp("valor", "number")} /></div>
          <div><label className="block text-xs text-muted-foreground mb-1">Desconto (R$)</label><input type="number" step="0.01" {...inp("valor_desconto", "number")} placeholder="Ex: adiantamento" /></div>
          <div><label className="block text-xs text-muted-foreground mb-1">Data Pagamento</label><input {...inp("data_pagamento", "date")} /></div>
          <div><label className="block text-xs text-muted-foreground mb-1">Mês Ref.</label>{sel("mes_ref", MESES)}</div>
          <div><label className="block text-xs text-muted-foreground mb-1">Ano Ref.</label><input {...inp("ano_ref")} /></div>
          <div><label className="block text-xs text-muted-foreground mb-1">Descrição</label><input {...inp("descricao")} /></div>
          <div><label className="block text-xs text-muted-foreground mb-1">Via</label>{sel("via", ["PIX", "TED", "DOC", "Boleto", "Dinheiro", "Cheque"])}</div>
          
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Conta (Vínculo Financeiro)</label>
            <select value={form.conta_bancaria_id} onChange={e => setForm(p => ({ ...p, conta_bancaria_id: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
              <option value="">Nenhuma / Pendente</option>
              {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          
          {form.via === "Cheque" && <div><label className="block text-xs text-muted-foreground mb-1">Dados do Cheque</label><input {...inp("dados_cheque")} placeholder="Banco, Agência, Conta, N°" /></div>}
          <div><label className="block text-xs text-muted-foreground mb-1">Beneficiário</label>{sel("beneficiario", ["Titular", "Cônjuge", "Empresa", "Outro"])}</div>
          <div className={form.via !== "Cheque" ? "col-span-2" : ""}><label className="block text-xs text-muted-foreground mb-1">Natureza Prestação de Serviço</label><input {...inp("natureza_servico")} placeholder="Consultoria, engenharia, mão de obra..." /></div>
        </div>
        <div className="flex gap-2 items-center">
          <button type="submit" disabled={saving} className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-500/10 disabled:opacity-50">{saving ? "Salvando..." : "Registrar Pagamento"}</button>
          <button type="button" onClick={onCancel} className="px-5 py-2 bg-muted text-muted-foreground rounded-lg text-sm">Cancelar</button>
          <div className="ml-auto text-sm">
            Líquido a Pagar: <span className="font-bold text-green-400">R$ {((parseFloat(form.valor) || 0) - (parseFloat(form.valor_desconto) || 0)).toFixed(2).replace('.', ',')}</span>
          </div>
        </div>
      </form>
    </div>
  );
}

function PrestadorCard({ prestador, pagamentos, onEdit, onDelete, onPago }) {
  const [showPag, setShowPag] = useState(false);
  const pags = pagamentos.filter(p => p.prestador_id === prestador.id);
  const total = pags.reduce((s, p) => s + ((p.valor || 0) - (p.valor_desconto || 0)), 0);
  const mesAtual = new Date().getMonth();
  const anoAtual = new Date().getFullYear();
  const pagoMes = pags.filter(p => {
    const d = new Date(p.data_pagamento + "T00:00:00");
    return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
  }).reduce((s, p) => s + ((p.valor || 0) - (p.valor_desconto || 0)), 0);

  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-semibold text-foreground">{prestador.nome}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${prestador.status === "Ativo" ? "bg-green-400/10 text-green-400" : "bg-muted text-muted-foreground"}`}>{prestador.status}</span>
          </div>
          <p className="text-xs text-muted-foreground">{prestador.cargo_funcao}{prestador.tipo_contrato ? ` · ${prestador.tipo_contrato}` : ""}</p>
          {prestador.cpf_cnpj && <p className="text-xs text-muted-foreground">CPF/CNPJ: {prestador.cpf_cnpj}{prestador.chave_pix ? ` · ${prestador.chave_pix}` : ""}</p>}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-base font-bold text-foreground">{fmt(total)}</p>
            <p className="text-xs text-muted-foreground">{pags.length} lançamentos</p>
          </div>
          <button onClick={() => setShowPag(!showPag)} className="px-3 py-1.5 bg-green-600/10 border border-green-600/30 text-green-400 rounded-lg text-xs font-medium hover:bg-green-600/20">+ Lançar</button>
          <button onClick={() => onEdit(prestador)} className="p-1.5 text-muted-foreground hover:text-foreground"><Pencil size={13} /></button>
          <button onClick={() => onDelete(prestador.id)} className="p-1.5 text-red-400 hover:text-red-300"><Trash2 size={13} /></button>
        </div>
      </div>
      {showPag && <PagamentoForm prestador={prestador} onSave={async (data) => { await onPago(data); setShowPag(false); }} onCancel={() => setShowPag(false)} />}
    </div>
  );
}

export default function TerceirosPrestadores() {
  const [prestadores, setPrestadores] = useState([]);
  const [pagamentos, setPagamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState("prestadores");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([base44.entities.PrestadorServico.list(), base44.entities.PagamentoPrestador.list("-data_pagamento")]).then(([p, pg]) => {
      setPrestadores(p); setPagamentos(pg); setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (data) => {
    if (editItem) await base44.entities.PrestadorServico.update(editItem.id, data);
    else await base44.entities.PrestadorServico.create(data);
    setShowForm(false); setEditItem(null); load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir prestador?")) return;
    await base44.entities.PrestadorServico.delete(id);
    load();
  };

  const syncFinanceiro = async (pagData) => {
    const vencStr = pagData.data_pagamento || new Date().toISOString().split("T")[0];
    const liquido = (pagData.valor || 0) - (pagData.valor_desconto || 0);
    
    if (liquido > 0 && (pagData.status === "aprovado" || pagData.status === "pago")) {
      const desc = `Serviço Prestador - ${pagData.prestador_nome} (${pagData.mes_ref}/${pagData.ano_ref})`;
      const existing = await base44.entities.Lancamento.filter({ numero_documento: `PREST-${pagData.id}` });
      
      const payload = {
        descricao: pagData.descricao ? `${desc} - ${pagData.descricao}` : desc,
        tipo: "despesa",
        valor: pagData.valor,
        valor_desconto: pagData.valor_desconto || 0,
        vencimento: vencStr,
        categoria: "Serviços",
        cliente_fornecedor: pagData.prestador_nome,
        numero_documento: `PREST-${pagData.id}`,
        status: pagData.status === "pago" ? "pago" : "pendente",
        conta_bancaria_id: pagData.conta_bancaria_id || "",
        dados_cheque: pagData.dados_cheque || ""
      };
      if (pagData.status === "pago") {
        payload.data_pagamento = vencStr;
        payload.valor_pago = liquido;
      }
      
      if (existing.length === 0) {
        await base44.entities.Lancamento.create(payload);
      } else if (existing[0].status !== "pago") {
        await base44.entities.Lancamento.update(existing[0].id, {
          valor: pagData.valor,
          valor_desconto: pagData.valor_desconto || 0,
          status: pagData.status === "pago" ? "pago" : "pendente",
          conta_bancaria_id: pagData.conta_bancaria_id || "",
          dados_cheque: pagData.dados_cheque || "",
          ...(pagData.status === "pago" ? { data_pagamento: vencStr, valor_pago: liquido } : {})
        });
      }
    }
  };

  const handlePago = async (data) => {
    const created = await base44.entities.PagamentoPrestador.create({ ...data, status: "pendente" });
    load();
  };

  const handleAprovarPag = async (pag) => {
    const updated = { ...pag, status: "aprovado" };
    await base44.entities.PagamentoPrestador.update(pag.id, { status: "aprovado" });
    await syncFinanceiro(updated);
    load();
  };

  const handleMarcarPagoPag = async (pag) => {
    const updated = { ...pag, status: "pago" };
    await base44.entities.PagamentoPrestador.update(pag.id, { status: "pago" });
    await syncFinanceiro(updated);
    load();
  };

  const handleDeletePag = async (pag) => {
    if (!confirm("Excluir pagamento?")) return;
    await base44.entities.PagamentoPrestador.delete(pag.id);
    // Also try to delete from Lancamento if it exists
    const existing = await base44.entities.Lancamento.filter({ numero_documento: `PREST-${pag.id}` });
    for (const ex of existing) {
      await base44.entities.Lancamento.delete(ex.id);
    }
    load();
  };

  const hoje = new Date();
  const pagoMesTotal = pagamentos.filter(p => {
    const d = new Date(p.data_pagamento + "T00:00:00");
    return p.status === 'pago' && d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear();
  }).reduce((s, p) => s + ((p.valor || 0) - (p.valor_desconto || 0)), 0);
  const totalAcumulado = pagamentos.reduce((s, p) => s + ((p.valor || 0) - (p.valor_desconto || 0)), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Terceiros / Prestadores</h2>
          <p className="text-xs text-muted-foreground">Engenheiros e prestadores em contrato de obra — fora da folha</p>
        </div>
        <button onClick={() => { setEditItem(null); setShowForm(true); setSubTab("prestadores"); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus size={15} /> Novo Prestador
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-card border border-border rounded-xl p-4"><p className="text-xs text-muted-foreground mb-1">Total de Prestadores</p><p className="text-2xl font-bold text-foreground">{prestadores.length}</p></div>
        <div className="bg-card border border-border rounded-xl p-4"><p className="text-xs text-muted-foreground mb-1">Pago no Mês</p><p className="text-2xl font-bold text-yellow-400">{fmt(pagoMesTotal)}</p></div>
        <div className="bg-card border border-border rounded-xl p-4"><p className="text-xs text-muted-foreground mb-1">Total Acumulado</p><p className="text-2xl font-bold text-yellow-400">{fmt(totalAcumulado)}</p></div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg mb-5 w-fit">
        {["prestadores", "pagamentos", "relatorio"].map(t => (
          <button key={t} onClick={() => setSubTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize ${subTab === t ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {t === "prestadores" ? "Prestadores" : t === "pagamentos" ? "Pagamentos" : "Relatório"}
          </button>
        ))}
      </div>

      {subTab === "prestadores" && (
        <>
          {(showForm || editItem) && <PrestadorForm item={editItem} onSave={handleSave} onCancel={() => { setShowForm(false); setEditItem(null); }} />}
          {loading ? <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
            : prestadores.length === 0 ? <div className="text-center py-12 text-muted-foreground"><Users size={28} className="mx-auto mb-2 opacity-40" /><p className="text-sm">Nenhum prestador cadastrado</p></div>
            : prestadores.map(p => <PrestadorCard key={p.id} prestador={p} pagamentos={pagamentos} onEdit={i => { setEditItem(i); setShowForm(true); }} onDelete={handleDelete} onPago={handlePago} />)}
        </>
      )}

      {subTab === "pagamentos" && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-border">{["Prestador", "Mês/Ano", "Via", "Beneficiário", "Natureza", "Valor", "Status", "Ações"].map(h => <th key={h} className="text-xs text-muted-foreground px-4 py-3 text-left">{h}</th>)}</tr></thead>
            <tbody>
              {pagamentos.length === 0
                ? <tr><td colSpan={8} className="text-center py-8 text-sm text-muted-foreground">Nenhum pagamento registrado</td></tr>
                : pagamentos.map(p => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{p.prestador_nome}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{p.mes_ref}/{p.ano_ref}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{p.via}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{p.beneficiario}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[150px] truncate">{p.natureza_servico || "—"}</td>
                    <td className="px-4 py-3 text-sm font-bold text-foreground">{fmt((p.valor || 0) - (p.valor_desconto || 0))}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-medium ${p.status === 'pago' ? 'bg-green-500/10/10 text-green-400' : p.status === 'aprovado' ? 'bg-primary/10/10 text-blue-400' : 'bg-yellow-500/10/10 text-yellow-400'}`}>{p.status || 'pendente'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {(!p.status || p.status === 'pendente') && <button onClick={() => handleAprovarPag(p)} className="text-blue-400 hover:text-blue-300 text-xs">Aprovar</button>}
                        {p.status === 'aprovado' && <button onClick={() => handleMarcarPagoPag(p)} className="text-green-400 hover:text-green-300 text-xs">Pagar</button>}
                        <button onClick={() => handleDeletePag(p)} className="text-red-400 hover:text-red-300 text-xs">Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {subTab === "relatorio" && (
        <div className="space-y-3">
          <div className="flex justify-end mb-2 no-print">
            <PrintButton />
          </div>
          
          <div className="print:block space-y-4">
            <h2 className="hidden print:block text-lg font-bold mb-4">Relatório de Terceiros e Prestadores</h2>
            {prestadores.map(p => {
              const pags = pagamentos.filter(pg => pg.prestador_id === p.id);
              const pagos = pags.filter(pg => pg.status === 'pago');
              const aPagar = pags.filter(pg => pg.status !== 'pago' && pg.status !== 'cancelado');
              
              const totalPago = pagos.reduce((s, pg) => s + ((pg.valor || 0) - (pg.valor_desconto || 0)), 0);
              const totalAPagar = aPagar.reduce((s, pg) => s + ((pg.valor || 0) - (pg.valor_desconto || 0)), 0);
              
              return (
                <div key={p.id} className="bg-card border border-border rounded-xl p-4 print:border-black print:mb-4 page-break-inside-avoid">
                  <div className="flex items-start justify-between border-b border-border print:border-black pb-3 mb-3">
                    <div>
                      <p className="text-base font-semibold text-foreground">{p.nome}</p>
                      <p className="text-xs text-muted-foreground mb-1">{p.cargo_funcao} {p.tipo_contrato ? `· ${p.tipo_contrato}` : ""}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Contrato:</span> {p.descricao_contrato || "Não especificado"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <span className="font-medium text-foreground">Valor:</span> {fmt(p.valor_contrato)} 
                        {p.quantidade_parcelas ? ` em ${p.quantidade_parcelas}x` : ""}
                      </p>
                    </div>
                    <div className="text-right flex gap-6">
                      <div>
                        <p className="text-xs text-muted-foreground">Já Pago</p>
                        <p className="text-sm font-bold text-green-500">{fmt(totalPago)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">A Pagar</p>
                        <p className="text-sm font-bold text-yellow-500">{fmt(totalAPagar)}</p>
                      </div>
                    </div>
                  </div>
                  
                  {pags.length > 0 ? (
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-border/50 text-muted-foreground">
                          <th className="py-1">Mês/Ano</th>
                          <th className="py-1">Data</th>
                          <th className="py-1">Natureza/Descrição</th>
                          <th className="py-1">Via</th>
                          <th className="py-1">Valor Líquido</th>
                          <th className="py-1">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pags.map(pg => (
                          <tr key={pg.id} className="border-b border-border/30">
                            <td className="py-1.5">{pg.mes_ref}/{pg.ano_ref}</td>
                            <td className="py-1.5">{new Date(pg.data_pagamento + "T12:00:00").toLocaleDateString('pt-BR')}</td>
                            <td className="py-1.5 truncate max-w-[200px]">{pg.natureza_servico || pg.descricao || "—"}</td>
                            <td className="py-1.5">{pg.via}</td>
                            <td className="py-1.5 font-medium">{fmt((pg.valor || 0) - (pg.valor_desconto || 0))}</td>
                            <td className="py-1.5 uppercase text-[10px]">{pg.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-xs text-muted-foreground italic text-center py-2">Nenhum pagamento registrado.</p>
                  )}
                </div>
              );
            })}
            {prestadores.length === 0 && <p className="text-center py-8 text-sm text-muted-foreground">Nenhum prestador cadastrado</p>}
          </div>
        </div>
      )}
    </div>
  );
}