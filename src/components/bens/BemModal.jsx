import { useState, useEffect } from "react";
import { X } from "lucide-react";

const categorias = [
  { value: "imovel", label: "Imóvel" },
  { value: "veiculo", label: "Veículo" },
  { value: "maquina", label: "Máquina" },
  { value: "equipamento", label: "Equipamento" },
  { value: "mercadoria", label: "Mercadoria" },
  { value: "outro", label: "Outro" },
];

export default function BemModal({ bem, onClose, onSave }) {
  const [form, setForm] = useState({
    descricao: bem?.descricao || "",
    categoria: bem?.categoria || "outro",
    quantidade: bem?.quantidade || 1,
    valor_avaliacao: bem?.valor_avaliacao || "",
    data_entrada: bem?.data_entrada || new Date().toISOString().slice(0, 10),
    cliente_fornecedor: bem?.cliente_fornecedor || "",
    contrato_origem_numero: bem?.contrato_origem_numero || "",
    observacoes: bem?.observacoes || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      ...form,
      quantidade: parseFloat(form.quantidade) || 1,
      valor_avaliacao: parseFloat(form.valor_avaliacao) || 0,
      status: bem?.status || "em_estoque",
      ativo: true,
      historico: bem?.historico || [],
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card">
          <h2 className="text-base font-semibold text-foreground">{bem ? "Editar Bem" : "Registrar Bem Recebido"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Descrição Completa do Bem *</label>
            <textarea required rows={2} value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary resize-none"
              placeholder="Descreva o bem detalhadamente..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Categoria</label>
              <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                {categorias.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Quantidade</label>
              <input type="number" min="0.001" step="0.001" value={form.quantidade} onChange={e => setForm(f => ({ ...f, quantidade: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Valor de Avaliação (R$) *</label>
              <input required type="number" step="0.01" min="0" value={form.valor_avaliacao} onChange={e => setForm(f => ({ ...f, valor_avaliacao: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Data de Entrada *</label>
              <input required type="date" value={form.data_entrada} onChange={e => setForm(f => ({ ...f, data_entrada: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Cliente/Fornecedor de Origem</label>
            <input value={form.cliente_fornecedor} onChange={e => setForm(f => ({ ...f, cliente_fornecedor: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              placeholder="Nome do cliente ou fornecedor" />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Contrato de Origem (Nº)</label>
            <input value={form.contrato_origem_numero} onChange={e => setForm(f => ({ ...f, contrato_origem_numero: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              placeholder="Ex: CONTR-2026-001" />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Observações</label>
            <textarea rows={2} value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm bg-muted text-muted-foreground">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm bg-primary text-primary-foreground disabled:opacity-50">
              {saving ? "Salvando..." : bem ? "Salvar" : "Registrar Bem"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}