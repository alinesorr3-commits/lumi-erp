import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, X, DollarSign, CheckCircle } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const statusConfig = {
  Ativo: { color: "text-blue-400", bg: "bg-blue-400/10" },
  Quitado: { color: "text-green-400", bg: "bg-green-400/10" },
  Inadimplente: { color: "text-red-400", bg: "bg-red-400/10" },
  Suspenso: { color: "text-yellow-400", bg: "bg-yellow-400/10" },
};

function DividaModal({ divida, onClose, onSave }) {
  const [form, setForm] = useState({
    descricao: divida?.descricao || "",
    tipo: divida?.tipo || "Parcelamento",
    credor: divida?.credor || "",
    status: divida?.status || "Ativo",
    valor_original: divida?.valor_original || "",
    valor_entrada: divida?.valor_entrada || "",
    parcelas_entrada: divida?.parcelas_entrada || "1",
    valor_restante: divida?.valor_restante || "",
    parcelas_restantes: divida?.parcelas_restantes || "",
    juros: divida?.juros || "0",
    valor_parcela: divida?.valor_parcela || "",
    parcelas_pagas: divida?.parcelas_pagas || "0",
    data_inicio: divida?.data_inicio || new Date().toISOString().slice(0, 10),
    vencimento_final: divida?.vencimento_final || "",
    observacoes: divida?.observacoes || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      ...form,
      valor_original: parseFloat(form.valor_original) || 0,
      valor_entrada: parseFloat(form.valor_entrada) || 0,
      parcelas_entrada: parseInt(form.parcelas_entrada) || 1,
      valor_restante: parseFloat(form.valor_restante) || 0,
      parcelas_restantes: parseInt(form.parcelas_restantes) || 0,
      juros: parseFloat(form.juros) || 0,
      valor_parcela: parseFloat(form.valor_parcela) || 0,
      parcelas_pagas: parseInt(form.parcelas_pagas) || 0,
      // Mapping the "Valor Restante" to "valor_atual" conceptually so it aligns with old logic
      valor_atual: parseFloat(form.valor_restante) || 0,
      total_parcelas: parseInt(form.parcelas_restantes) || 0,
    });
    setSaving(false);
  };

  const vTotal = parseFloat(form.valor_original) || 0;
  const vEntrada = parseFloat(form.valor_entrada) || 0;
  const parcRestantes = parseInt(form.parcelas_restantes) || 0;
  const vParcela = parseFloat(form.valor_parcela) || 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card">
          <h2 className="text-base font-semibold text-foreground">{divida ? "Editar" : "Novo Registro"}</h2>
          <button onClick={onClose}><X size={18} className="text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] text-muted-foreground mb-1.5">Descrição *</label>
            <input required value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              placeholder="Ex: PARCELAMENTO SIMPLES NACIONAL 2025" />
          </div>
          
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-5">
              <label className="block text-[11px] text-muted-foreground mb-1.5">Credor</label>
              <input value={form.credor} onChange={e => setForm(f => ({ ...f, credor: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                placeholder="Ex: Receita Federal" />
            </div>
            <div className="col-span-4">
              <label className="block text-[11px] text-muted-foreground mb-1.5">Tipo</label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                {["Empréstimo", "Parcelamento", "Outros"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-span-3">
              <label className="block text-[11px] text-muted-foreground mb-1.5">Status</label>
              <input value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
          </div>

          <div className="border border-border rounded-lg p-4 bg-muted/10 space-y-4 mt-2">
            <h3 className="text-[11px] font-semibold text-red-400 uppercase tracking-wide">Estrutura do Parcelamento</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] text-muted-foreground mb-1.5">Valor Total (R$)</label>
                <input type="number" step="0.01" value={form.valor_original} onChange={e => setForm(f => ({ ...f, valor_original: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground mb-1.5">Valor de Entrada (R$)</label>
                <input type="number" step="0.01" value={form.valor_entrada} onChange={e => setForm(f => ({ ...f, valor_entrada: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground mb-1.5">Parcelas da Entrada</label>
                <input type="number" min="1" value={form.parcelas_entrada} onChange={e => setForm(f => ({ ...f, parcelas_entrada: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] text-muted-foreground mb-1.5">Valor Restante (R$)</label>
                <input type="number" step="0.01" value={form.valor_restante} onChange={e => setForm(f => ({ ...f, valor_restante: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground mb-1.5">Parcelas Restantes</label>
                <input type="number" min="0" value={form.parcelas_restantes} onChange={e => setForm(f => ({ ...f, parcelas_restantes: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground mb-1.5">Juros (% a.m.)</label>
                <input type="number" step="0.01" value={form.juros} onChange={e => setForm(f => ({ ...f, juros: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] text-muted-foreground mb-1.5">Valor Parcela (R$)</label>
                <input type="number" step="0.01" value={form.valor_parcela} onChange={e => setForm(f => ({ ...f, valor_parcela: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground mb-1.5">Parcelas Pagas</label>
                <input type="number" min="0" value={form.parcelas_pagas} onChange={e => setForm(f => ({ ...f, parcelas_pagas: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
            </div>

            <div className="text-[11px] text-muted-foreground pt-3 border-t border-border">
              Resumo: <strong>R$ {fmt(vTotal)}</strong> total → entrada <strong className="text-yellow-400">R$ {fmt(vEntrada)}</strong> + <strong className="text-red-400">{parcRestantes}x</strong> de <strong>R$ {fmt(vParcela)}</strong>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1.5">Data Início</label>
              <input type="date" value={form.data_inicio} onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1.5">Vencimento Final</label>
              <input type="date" value={form.vencimento_final} onChange={e => setForm(f => ({ ...f, vencimento_final: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-muted-foreground mb-1.5">Observações</label>
            <textarea rows={2} value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary resize-none" />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {saving ? "Salvando..." : "Salvar"}
            </button>
            <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-lg text-sm bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DividasParcelamentos() {
  const [dividas, setDividas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [pagandoId, setPagandoId] = useState(null);

  const load = () => {
    setLoading(true);
    base44.entities.DividaFiscal.list("-created_date").then(data => { setDividas(data); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (data) => {
    if (editItem) await base44.entities.DividaFiscal.update(editItem.id, data);
    else await base44.entities.DividaFiscal.create(data);
    setModal(false); setEditItem(null); load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir este registro?")) return;
    await base44.entities.DividaFiscal.delete(id);
    load();
  };

  const [confirmarPagamento, setConfirmarPagamento] = useState(null);
  const [pagamentoData, setPagamentoData] = useState(new Date().toISOString().slice(0, 10));
  const [pagamentoVia, setPagamentoVia] = useState("PIX");

  const handlePagarParcela = async (d) => {
    setPagandoId(d.id);
    const novasPagas = (d.parcelas_pagas || 0) + 1;
    const novoSaldo = Math.max(0, (d.valor_atual || 0) - (d.valor_parcela || 0));
    const novoStatus = novasPagas >= (d.total_parcelas || 1) ? "Quitado" : d.status;
    
    // Create financial record (DRE)
    await base44.entities.Lancamento.create({
      descricao: `Parcela ${novasPagas}/${d.total_parcelas} - ${d.descricao}`,
      tipo: "despesa",
      valor: d.valor_parcela || 0,
      vencimento: pagamentoData,
      status: "pago",
      data_pagamento: pagamentoData,
      categoria: "Impostos",
      cliente_fornecedor: d.credor || "Governo",
      observacoes: `Pagamento via ${pagamentoVia}`
    });

    await base44.entities.DividaFiscal.update(d.id, {
      parcelas_pagas: novasPagas,
      valor_atual: Math.round(novoSaldo * 100) / 100,
      status: novoStatus,
    });
    setPagandoId(null);
    setConfirmarPagamento(null);
    load();
  };

  const totalAtivo = dividas.filter(d => d.status === "Ativo").reduce((s, d) => s + (d.valor_atual || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-foreground">Dívidas & Parcelamentos</h2>
          <p className="text-sm text-red-400 mt-0.5">Total a pagar: <span className="font-bold">{fmt(totalAtivo)}</span></p>
        </div>
        <button onClick={() => { setEditItem(null); setModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus size={16} /> Novo Registro
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
      ) : dividas.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <DollarSign size={32} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">Nenhuma dívida registrada</p>
        </div>
      ) : (
        <div className="space-y-4">
          {dividas.map(d => {
            const s = statusConfig[d.status] || statusConfig.Ativo;
            const pct = d.total_parcelas > 0 ? Math.round(((d.parcelas_pagas || 0) / d.total_parcelas) * 100) : 0;
            return (
              <div key={d.id} className={`bg-card border rounded-xl p-5 ${d.status === "Inadimplente" ? "border-red-500/30" : "border-border"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-sm font-bold text-foreground">{d.descricao}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground`}>{d.tipo}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>{d.status}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Credor: {d.credor || d.descricao}</p>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="text-xl font-bold text-red-400">{fmt(d.valor_atual)}</p>
                    {d.valor_original && d.valor_original !== d.valor_atual && (
                      <p className="text-xs text-muted-foreground">de {fmt(d.valor_original)}</p>
                    )}
                    {d.valor_parcela > 0 && (
                      <p className="text-xs text-muted-foreground">{fmt(d.valor_parcela)}/mês</p>
                    )}
                  </div>
                </div>

                {d.total_parcelas > 0 && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>{d.parcelas_pagas || 0}/{d.total_parcelas} parcelas pagas</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full">
                      <div className="h-1.5 bg-blue-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )}

                {confirmarPagamento === d.id && (
                  <div className="border border-border rounded-lg p-4 bg-muted/10 mt-3 mb-3">
                    <h4 className="text-sm font-semibold text-foreground mb-3">
                      Pagar Parcela {(d.parcelas_pagas || 0) + 1}/{d.total_parcelas} — {fmt(d.valor_parcela)}
                    </h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1.5">Pagar via</label>
                        <select 
                          value={pagamentoVia}
                          onChange={e => setPagamentoVia(e.target.value)}
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                        >
                          <option value="PIX">PIX</option>
                          <option value="Boleto">Boleto</option>
                          <option value="Banco">Banco / Transferência</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1.5">Data do Pagamento</label>
                        <input 
                          type="date" 
                          value={pagamentoData}
                          onChange={e => setPagamentoData(e.target.value)}
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" 
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handlePagarParcela(d)} 
                        disabled={pagandoId === d.id}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        {pagandoId === d.id ? "Processando..." : "Confirmar Pagamento → DRE"}
                      </button>
                      <button 
                        onClick={() => setConfirmarPagamento(null)} 
                        className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm hover:text-foreground transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-3">
                  {d.status === "Ativo" && d.valor_parcela > 0 && confirmarPagamento !== d.id && (
                    <button onClick={() => setConfirmarPagamento(d.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600/10 border border-green-600/20 text-green-400 rounded-lg text-xs hover:bg-green-600/20 disabled:opacity-50">
                      <DollarSign size={12} /> Pagar Parcela
                    </button>
                  )}
                  <button onClick={() => { setEditItem(d); setModal(true); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-xs text-muted-foreground hover:text-foreground">
                    <CheckCircle size={12} className="opacity-0 w-0 h-0" style={{ display: 'none' }} /> Editar
                  </button>
                  <button onClick={() => handleDelete(d.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10/10 rounded-lg text-xs text-red-400 hover:bg-red-500/10/20">
                    <X size={12} className="opacity-0 w-0 h-0" style={{ display: 'none' }} /> Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && <DividaModal divida={editItem} onClose={() => { setModal(false); setEditItem(null); }} onSave={handleSave} />}
    </div>
  );
}