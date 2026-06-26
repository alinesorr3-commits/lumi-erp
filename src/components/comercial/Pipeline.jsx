import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Plus, X, DollarSign } from "lucide-react";

const ETAPAS = [
  { key: "prospeccao", label: "Prospecção", color: "border-blue-500/50 bg-primary/10/5" },
  { key: "qualificacao", label: "Qualificação", color: "border-yellow-500/50 bg-yellow-500/10/5" },
  { key: "proposta", label: "Proposta", color: "border-blue-500/50 bg-primary/10/5" },
  { key: "negociacao", label: "Negociação", color: "border-yellow-500/50 bg-yellow-500/10/5" },
  { key: "fechado_ganho", label: "Fechado ✓", color: "border-green-500/50 bg-green-500/10/5" },
  { key: "fechado_perdido", label: "Perdido ✗", color: "border-red-500/50 bg-red-500/10/5" },
];

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v || 0);

function OportunidadeModal({ oportunidade, onClose, onSave }) {
  const [form, setForm] = useState({
    titulo: oportunidade?.titulo || "",
    cliente_nome: oportunidade?.cliente_nome || "",
    valor: oportunidade?.valor || "",
    etapa: oportunidade?.etapa || "prospeccao",
    responsavel: oportunidade?.responsavel || "",
    data_fechamento: oportunidade?.data_fechamento || "",
    probabilidade: oportunidade?.probabilidade || 50,
    descricao: oportunidade?.descricao || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ ...form, valor: parseFloat(form.valor) || 0, probabilidade: parseInt(form.probabilidade) || 50 });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">{oportunidade ? "Editar Oportunidade" : "Nova Oportunidade"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Título *</label>
            <input required value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Cliente</label>
              <input value={form.cliente_nome} onChange={e => setForm(f => ({ ...f, cliente_nome: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Valor Estimado (R$)</label>
              <input type="number" step="0.01" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Etapa</label>
              <select value={form.etapa} onChange={e => setForm(f => ({ ...f, etapa: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                {ETAPAS.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Probabilidade ({form.probabilidade}%)</label>
              <input type="range" min="0" max="100" value={form.probabilidade}
                onChange={e => setForm(f => ({ ...f, probabilidade: e.target.value }))}
                className="w-full" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Responsável</label>
              <input value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Previsão Fechamento</label>
              <input type="date" value={form.data_fechamento} onChange={e => setForm(f => ({ ...f, data_fechamento: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Descrição</label>
            <textarea rows={2} value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm bg-muted text-muted-foreground">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm bg-primary text-primary-foreground disabled:opacity-50">
              {saving ? "Salvando..." : oportunidade ? "Salvar" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Pipeline() {
  const [oportunidades, setOportunidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.Oportunidade.list("-created_date");
    setOportunidades(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDragEnd = async ({ source, destination, draggableId }) => {
    if (!destination || source.droppableId === destination.droppableId) return;
    setOportunidades(prev => prev.map(o => o.id === draggableId ? { ...o, etapa: destination.droppableId } : o));
    await base44.entities.Oportunidade.update(draggableId, { etapa: destination.droppableId });
  };

  const handleSave = async (data) => {
    if (editItem) {
      await base44.entities.Oportunidade.update(editItem.id, data);
    } else {
      await base44.entities.Oportunidade.create(data);
    }
    setModalOpen(false);
    setEditItem(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir esta oportunidade?")) return;
    await base44.entities.Oportunidade.delete(id);
    load();
  };

  if (loading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => { setEditItem(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} /> Nova Oportunidade
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {ETAPAS.map(etapa => {
            const cards = oportunidades.filter(o => o.etapa === etapa.key);
            const totalValor = cards.reduce((s, o) => s + (o.valor || 0), 0);
            return (
              <div key={etapa.key} className="flex-shrink-0 w-64">
                <div className={`rounded-xl border ${etapa.color} p-3 mb-3`}>
                  <p className="text-xs font-semibold text-foreground">{etapa.label}</p>
                  <p className="text-xs text-muted-foreground">{cards.length} oport. · {fmt(totalValor)}</p>
                </div>
                <Droppable droppableId={etapa.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-24 space-y-2 rounded-lg p-1 transition-colors ${snapshot.isDraggingOver ? "bg-muted/50" : ""}`}
                    >
                      {cards.map((op, index) => (
                        <Draggable key={op.id} draggableId={op.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all
 ${snapshot.isDragging ? "shadow-lg border-primary/50 rotate-1" : "hover:border-primary/30"}`}
                            >
                              <p className="text-xs font-semibold text-foreground mb-1 leading-tight">{op.titulo}</p>
                              {op.cliente_nome && <p className="text-xs text-muted-foreground mb-2">{op.cliente_nome}</p>}
                              {op.valor > 0 && (
                                <div className="flex items-center gap-1 mb-2">
                                  <DollarSign size={11} className="text-green-400" />
                                  <span className="text-xs text-green-400 font-medium">{fmt(op.valor)}</span>
                                </div>
                              )}
                              {op.probabilidade !== undefined && (
                                <div className="mb-2">
                                  <div className="h-1 bg-muted rounded-full">
                                    <div className="h-1 bg-blue-400 rounded-full" style={{ width: `${op.probabilidade}%` }} />
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-0.5">{op.probabilidade}% prob.</p>
                                </div>
                              )}
                              {op.responsavel && <p className="text-xs text-muted-foreground">👤 {op.responsavel}</p>}
                              <div className="flex gap-2 mt-2 pt-2 border-t border-border">
                                <button onClick={() => { setEditItem(op); setModalOpen(true); }} className="text-xs text-muted-foreground hover:text-foreground">Editar</button>
                                <button onClick={() => handleDelete(op.id)} className="text-xs text-red-400 hover:underline">Excluir</button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {modalOpen && (
        <OportunidadeModal
          oportunidade={editItem}
          onClose={() => { setModalOpen(false); setEditItem(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}