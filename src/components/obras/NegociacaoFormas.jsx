import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Pencil, Trash2, X } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const CLASSIFICACOES = [
  "Integração de Capital",
  "Recebimento de Venda",
  "Contrato Negociado",
  "Permuta",
  "Retirada de Sócio",
  "Outros"
];

const FORMAS_RECEBIMENTO = [
  "Cheque de Terceiro",
  "Veículo",
  "Imóvel",
  "Terreno",
  "Máquina Agrícola",
  "Transferência Bancária",
  "PIX",
  "Outros"
];

function NegociacaoModal({ negociacao, obras, onClose, onSave }) {
  const [form, setForm] = useState({
    obra_id: negociacao?.obra_id || "",
    classificacao_operacao: negociacao?.classificacao_operacao || "",
    integracao_com: negociacao?.integracao_com || "",
    forma_recebimento: negociacao?.forma_recebimento || "",
    descricao: negociacao?.descricao || "",
    valor: negociacao?.valor || 0,
    observacoes: negociacao?.observacoes || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const obraName = obras.find(o => o.id === form.obra_id)?.nome || "";
      const payload = { ...form, obra_nome: obraName };
      
      // Limpar campos vazios que possam dar erro no schema
      if (!payload.obra_id) delete payload.obra_id;
      if (!payload.integracao_com) delete payload.integracao_com;
      if (!payload.descricao) delete payload.descricao;
      if (!payload.observacoes) delete payload.observacoes;

      await onSave(payload);
    } catch (err) {
      alert("Erro ao salvar negociação: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card">
          <h2 className="text-base font-semibold text-foreground">{negociacao ? "Editar" : "Nova"} Negociação</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Obra Vinculada</label>
              <select value={form.obra_id} onChange={e => setForm(f => ({ ...f, obra_id: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                <option value="">Sem vínculo</option>
                {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Classificação da Operação *</label>
              <select required value={form.classificacao_operacao} onChange={e => setForm(f => ({ ...f, classificacao_operacao: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                <option value="">Selecionar</option>
                {CLASSIFICACOES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Integração com</label>
              <input value={form.integracao_com} onChange={e => setForm(f => ({ ...f, integracao_com: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Forma de Recebimento *</label>
              <select required value={form.forma_recebimento} onChange={e => setForm(f => ({ ...f, forma_recebimento: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                <option value="">Selecionar</option>
                {FORMAS_RECEBIMENTO.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Descrição</label>
            <input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Valor (R$)</label>
            <input type="number" step="0.01" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: parseFloat(e.target.value) || 0 }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Observações</label>
            <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={2}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-muted text-muted-foreground rounded-lg text-sm">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm disabled:opacity-50">
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NegociacaoFormas() {
  const [negociacoes, setNegociacoes] = useState([]);
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const load = async () => {
    setLoading(true);
    const [negs, obs] = await Promise.all([
      base44.entities.NegociacaoObra.list("-created_date"),
      base44.entities.Obra.list(),
    ]);
    setNegociacoes(negs);
    setObras(obs);
    setLoading(false);
  };

  const handleSave = async (data) => {
    if (editItem) {
      await base44.entities.NegociacaoObra.update(editItem.id, data);
    } else {
      await base44.entities.NegociacaoObra.create(data);
    }
    setModalOpen(false);
    setEditItem(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir esta negociação?")) return;
    await base44.entities.NegociacaoObra.delete(id);
    load();
  };

  const openNew = () => {
    setEditItem(null);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setModalOpen(true);
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Formas de Negociação em Obras</h2>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus size={16} /> Novo Registro
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {negociacoes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">Nenhuma negociação registrada</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs text-muted-foreground px-4 py-3">Obra</th>
                <th className="text-left text-xs text-muted-foreground px-4 py-3">Classificação</th>
                <th className="text-left text-xs text-muted-foreground px-4 py-3">Forma Recebimento</th>
                <th className="text-left text-xs text-muted-foreground px-4 py-3">Descrição</th>
                <th className="text-right text-xs text-muted-foreground px-4 py-3">Valor</th>
                <th className="text-right text-xs text-muted-foreground px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {negociacoes.map(neg => (
                <tr key={neg.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3 text-sm text-foreground">{neg.obra_nome || "—"}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{neg.classificacao_operacao}</td>
                  <td className="px-4 py-3"><span className="inline-block px-2 py-1 bg-primary/20 text-primary rounded text-xs">{neg.forma_recebimento}</span></td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{neg.descricao || "—"}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-green-400">{fmt(neg.valor)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(neg)} className="p-1 text-muted-foreground hover:text-foreground"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(neg.id)} className="p-1 text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && <NegociacaoModal negociacao={editItem} obras={obras} onClose={() => { setModalOpen(false); setEditItem(null); }} onSave={handleSave} />}
    </div>
  );
}