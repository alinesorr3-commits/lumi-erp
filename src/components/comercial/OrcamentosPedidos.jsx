import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, X, FileText, ShoppingBag, Trash2, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import NFeEmissao from "@/components/nfe/NFeEmissao";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const fmtDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "-";

const orcStatusConfig = {
  rascunho: { label: "Rascunho", color: "text-muted-foreground", bg: "bg-muted" },
  enviado: { label: "Enviado", color: "text-blue-400", bg: "bg-blue-400/10" },
  aprovado: { label: "Aprovado", color: "text-green-400", bg: "bg-green-400/10" },
  recusado: { label: "Recusado", color: "text-red-400", bg: "bg-red-400/10" },
  convertido: { label: "Convertido", color: "text-blue-400", bg: "bg-blue-400/10" },
};

const pedStatusConfig = {
  aberto: { label: "Aberto", color: "text-blue-400", bg: "bg-blue-400/10" },
  confirmado: { label: "Confirmado", color: "text-yellow-400", bg: "bg-yellow-400/10" },
  em_producao: { label: "Em Produção", color: "text-yellow-400", bg: "bg-yellow-400/10" },
  entregue: { label: "Entregue", color: "text-green-400", bg: "bg-green-400/10" },
  cancelado: { label: "Cancelado", color: "text-red-400", bg: "bg-red-400/10" },
};

function OrcamentoModal({ orc, onClose, onSave }) {
  const [form, setForm] = useState({
    cliente_nome: orc?.cliente_nome || "",
    data_emissao: orc?.data_emissao || new Date().toISOString().split("T")[0],
    data_validade: orc?.data_validade || "",
    status: orc?.status || "rascunho",
    responsavel: orc?.responsavel || "",
    observacoes: orc?.observacoes || "",
    itens: orc?.itens || [{ descricao: "", quantidade: 1, valor_unitario: 0, desconto: 0, total: 0 }],
  });
  const [saving, setSaving] = useState(false);

  const calcTotal = (itens) => itens.reduce((s, i) => s + (i.total || 0), 0);

  const updateItem = (idx, field, value) => {
    setForm(f => {
      const itens = [...f.itens];
      itens[idx] = { ...itens[idx], [field]: value };
      const qty = parseFloat(itens[idx].quantidade) || 0;
      const unit = parseFloat(itens[idx].valor_unitario) || 0;
      const desc = parseFloat(itens[idx].desconto) || 0;
      itens[idx].total = qty * unit * (1 - desc / 100);
      return { ...f, itens };
    });
  };

  const addItem = () => setForm(f => ({ ...f, itens: [...f.itens, { descricao: "", quantidade: 1, valor_unitario: 0, desconto: 0, total: 0 }] }));
  const removeItem = (idx) => setForm(f => ({ ...f, itens: f.itens.filter((_, i) => i !== idx) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const total = calcTotal(form.itens);
    await onSave({ ...form, total, subtotal: total });
    setSaving(false);
  };

  const total = calcTotal(form.itens);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card">
          <h2 className="text-base font-semibold text-foreground">{orc ? "Editar Orçamento" : "Novo Orçamento"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Cliente *</label>
              <input required value={form.cliente_nome} onChange={e => setForm(f => ({ ...f, cliente_nome: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                {Object.entries(orcStatusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Emissão *</label>
              <input required type="date" value={form.data_emissao} onChange={e => setForm(f => ({ ...f, data_emissao: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Validade</label>
              <input type="date" value={form.data_validade} onChange={e => setForm(f => ({ ...f, data_validade: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Responsável</label>
              <input value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
          </div>

          {/* Itens */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-muted-foreground">Itens</label>
              <button type="button" onClick={addItem} className="text-xs text-primary hover:underline flex items-center gap-1">
                <Plus size={12} /> Adicionar item
              </button>
            </div>
            <div className="space-y-2">
              {form.itens.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <input value={item.descricao} onChange={e => updateItem(idx, "descricao", e.target.value)}
                    placeholder="Descrição" className="col-span-4 bg-muted border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary" />
                  <input type="number" min="1" value={item.quantidade} onChange={e => updateItem(idx, "quantidade", e.target.value)}
                    placeholder="Qtd" className="col-span-2 bg-muted border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary" />
                  <input type="number" step="0.01" value={item.valor_unitario} onChange={e => updateItem(idx, "valor_unitario", e.target.value)}
                    placeholder="R$ Unit." className="col-span-3 bg-muted border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary" />
                  <input type="number" min="0" max="100" value={item.desconto} onChange={e => updateItem(idx, "desconto", e.target.value)}
                    placeholder="Desc%" className="col-span-2 bg-muted border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary" />
                  <button type="button" onClick={() => removeItem(idx)} className="col-span-1 text-red-400 hover:text-red-300 flex justify-center">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-bold text-green-400">{fmt(total)}</p>
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Observações</label>
            <textarea rows={2} value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm bg-muted text-muted-foreground">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm bg-primary text-primary-foreground disabled:opacity-50">
              {saving ? "Salvando..." : orc ? "Salvar" : "Criar Orçamento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function OrcamentosPedidos() {
  const [subTab, setSubTab] = useState(0);
  const [orcamentos, setOrcamentos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [convertendoPedido, setConvertendoPedido] = useState(false);

  const load = async () => {
    setLoading(true);
    const [orcs, peds] = await Promise.all([
      base44.entities.Orcamento.list("-created_date"),
      base44.entities.Pedido.list("-created_date"),
    ]);
    setOrcamentos(orcs);
    setPedidos(peds);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (data) => {
    if (editItem) {
      await base44.entities.Orcamento.update(editItem.id, data);
    } else {
      const seq = orcamentos.length + 1;
      await base44.entities.Orcamento.create({ ...data, numero: `ORC-${String(seq).padStart(4, "0")}` });
    }
    setModalOpen(false);
    setEditItem(null);
    load();
  };

  const handleConvertir = async (orc) => {
    if (!confirm("Converter este orçamento em pedido?")) return;
    await base44.entities.Pedido.create({
      orcamento_id: orc.id,
      cliente_nome: orc.cliente_nome,
      data_pedido: new Date().toISOString().split("T")[0],
      itens: orc.itens,
      total: orc.total,
      status: "aberto",
      responsavel: orc.responsavel,
      numero: `PED-${String(pedidos.length + 1).padStart(4, "0")}`,
    });
    await base44.entities.Orcamento.update(orc.id, { status: "convertido" });
    load();
  };

  const handleDeleteOrc = async (id) => {
    if (!confirm("Excluir este orçamento?")) return;
    await base44.entities.Orcamento.delete(id);
    load();
  };

  const handleStatusPedido = async (ped, status) => {
    await base44.entities.Pedido.update(ped.id, { status });
    load();
  };

  const handleDeletePedido = async (id) => {
    if (!confirm("Excluir este pedido?")) return;
    await base44.entities.Pedido.delete(id);
    load();
  };

  return (
    <div>
      <div className="flex gap-1 p-1 bg-muted rounded-lg mb-4 w-fit">
        {["Orçamentos", "Pedidos"].map((t, i) => (
          <button key={i} onClick={() => setSubTab(i)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all
 ${subTab === i ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {subTab === 0 && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={() => { setEditItem(null); setModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
              <Plus size={16} /> Novo Orçamento
            </button>
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {loading ? <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
              : orcamentos.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText size={28} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum orçamento</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs text-muted-foreground px-4 py-3">Número</th>
                      <th className="text-left text-xs text-muted-foreground px-4 py-3">Cliente</th>
                      <th className="text-left text-xs text-muted-foreground px-4 py-3">Emissão</th>
                      <th className="text-right text-xs text-muted-foreground px-4 py-3">Total</th>
                      <th className="text-left text-xs text-muted-foreground px-4 py-3">Status</th>
                      <th className="text-right text-xs text-muted-foreground px-4 py-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orcamentos.map(o => {
                      const s = orcStatusConfig[o.status] || orcStatusConfig.rascunho;
                      return (
                        <tr key={o.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="px-4 py-3 text-sm font-mono text-foreground">{o.numero || "—"}</td>
                          <td className="px-4 py-3 text-sm text-foreground">{o.cliente_nome}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{fmtDate(o.data_emissao)}</td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-green-400">{fmt(o.total)}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>{s.label}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              {o.status !== "convertido" && (
                                <button onClick={() => handleConvertir(o)} className="text-xs text-blue-400 hover:underline">Converter</button>
                              )}
                              <button onClick={() => { setEditItem(o); setModalOpen(true); }} className="text-xs text-muted-foreground hover:text-foreground">Editar</button>
                              <button onClick={() => handleDeleteOrc(o.id)} className="text-xs text-red-400 hover:underline">Excluir</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
          </div>
        </>
      )}

      {subTab === 1 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {loading ? <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
            : pedidos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingBag size={28} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum pedido. Converta um orçamento para criar um pedido.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs text-muted-foreground px-4 py-3">Número</th>
                    <th className="text-left text-xs text-muted-foreground px-4 py-3">Cliente</th>
                    <th className="text-left text-xs text-muted-foreground px-4 py-3">Data</th>
                    <th className="text-right text-xs text-muted-foreground px-4 py-3">Total</th>
                    <th className="text-left text-xs text-muted-foreground px-4 py-3">Status</th>
                    <th className="text-right text-xs text-muted-foreground px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map(p => {
                    const s = pedStatusConfig[p.status] || pedStatusConfig.aberto;
                    return (
                      <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="px-4 py-3 text-sm font-mono text-foreground">{p.numero || "—"}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{p.cliente_nome}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{fmtDate(p.data_pedido)}</td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-green-400">{fmt(p.total)}</td>
                        <td className="px-4 py-3">
                          <select value={p.status} onChange={e => handleStatusPedido(p, e.target.value)}
                            className="bg-transparent border-none text-xs focus:outline-none cursor-pointer">
                            {Object.entries(pedStatusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {p.status === "confirmado" && (
                              <button onClick={() => { setEditItem(p); setConvertendoPedido(true); setModalOpen(true); }} className="text-xs text-red-400 hover:underline flex items-center gap-1">
                                <ArrowRight size={12} /> NF-e
                              </button>
                            )}
                            <button onClick={() => handleDeletePedido(p.id)} className="text-xs text-red-400 hover:underline">Excluir</button>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>{s.label}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
        </div>
      )}

      {modalOpen && convertendoPedido && editItem ? (
        <NFeEmissao
          pedidoOrigem={editItem}
          onClose={() => { setModalOpen(false); setEditItem(null); setConvertendoPedido(false); }}
          onSaved={() => { setModalOpen(false); setEditItem(null); setConvertendoPedido(false); load(); }}
        />
      ) : modalOpen ? (
        <OrcamentoModal
          orc={editItem}
          onClose={() => { setModalOpen(false); setEditItem(null); }}
          onSave={handleSave}
        />
      ) : null}
    </div>
  );
}