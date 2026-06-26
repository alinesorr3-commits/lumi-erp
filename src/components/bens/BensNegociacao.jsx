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

function BemModal({ bem, onClose, onSave }) {
  const [form, setForm] = useState({
    descricao: bem?.descricao || "",
    categoria: bem?.categoria || "outro",
    quantidade: bem?.quantidade || 1,
    valor_avaliacao: bem?.valor_avaliacao || 0,
    data_entrada: bem?.data_entrada || new Date().toISOString().split("T")[0],
    cliente_fornecedor: bem?.cliente_fornecedor || "",
    contrato_origem_numero: bem?.contrato_origem_numero || "",
    classificacao_operacao: bem?.classificacao_operacao || "",
    observacoes: bem?.observacoes || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card">
          <h2 className="text-base font-semibold text-foreground">{bem ? "Editar" : "Novo"} Bem</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-muted-foreground mb-1.5">Descrição *</label>
              <input required value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Categoria</label>
              <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                <option value="imovel">Imóvel</option>
                <option value="veiculo">Veículo</option>
                <option value="maquina">Máquina</option>
                <option value="equipamento">Equipamento</option>
                <option value="mercadoria">Mercadoria</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Quantidade</label>
              <input type="number" min="1" step="0.01" value={form.quantidade} onChange={e => setForm(f => ({ ...f, quantidade: parseFloat(e.target.value) || 1 }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Valor Avaliação (R$) *</label>
              <input type="number" step="0.01" required value={form.valor_avaliacao} onChange={e => setForm(f => ({ ...f, valor_avaliacao: parseFloat(e.target.value) || 0 }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Data Entrada *</label>
              <input type="date" required value={form.data_entrada} onChange={e => setForm(f => ({ ...f, data_entrada: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Cliente/Fornecedor</label>
              <input value={form.cliente_fornecedor} onChange={e => setForm(f => ({ ...f, cliente_fornecedor: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Contrato Origem</label>
              <input value={form.contrato_origem_numero} onChange={e => setForm(f => ({ ...f, contrato_origem_numero: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Classificação da Operação</label>
            <select value={form.classificacao_operacao} onChange={e => setForm(f => ({ ...f, classificacao_operacao: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
              <option value="">Selecionar</option>
              {CLASSIFICACOES.map(c => <option key={c}>{c}</option>)}
            </select>
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

export default function BensNegociacao() {
  const [bens, setBens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.BemRecebido.filter({ status: "em_estoque" }, "-created_date");
    setBens(data);
    setLoading(false);
  };

  const handleSave = async (data) => {
    if (editItem) {
      await base44.entities.BemRecebido.update(editItem.id, data);
    } else {
      await base44.entities.BemRecebido.create(data);
    }
    setModalOpen(false);
    setEditItem(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir este bem?")) return;
    await base44.entities.BemRecebido.delete(id);
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
        <h2 className="text-base font-semibold text-foreground">Bens em Negociação</h2>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus size={16} /> Novo Bem
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {bens.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">Nenhum bem em estoque</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs text-muted-foreground px-4 py-3">Descrição</th>
                <th className="text-left text-xs text-muted-foreground px-4 py-3">Categoria</th>
                <th className="text-left text-xs text-muted-foreground px-4 py-3">Classificação</th>
                <th className="text-right text-xs text-muted-foreground px-4 py-3">Qtd</th>
                <th className="text-right text-xs text-muted-foreground px-4 py-3">Valor</th>
                <th className="text-right text-xs text-muted-foreground px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {bens.map(bem => (
                <tr key={bem.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3 text-sm text-foreground">{bem.descricao}</td>
                  <td className="px-4 py-3"><span className="inline-block px-2 py-1 bg-muted rounded text-xs">{bem.categoria}</span></td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{bem.classificacao_operacao || "—"}</td>
                  <td className="px-4 py-3 text-right text-sm">{bem.quantidade}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-green-400">{fmt(bem.valor_avaliacao)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(bem)} className="p-1 text-muted-foreground hover:text-foreground"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(bem.id)} className="p-1 text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && <BemModal bem={editItem} onClose={() => { setModalOpen(false); setEditItem(null); }} onSave={handleSave} />}
    </div>
  );
}