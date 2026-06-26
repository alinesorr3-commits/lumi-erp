import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { fmt } from "./ObrasUtils";
import { Plus, Filter, Download, Pencil, Trash2, DollarSign } from "lucide-react";

const TIPOS = ["Aluguel de Equipamento", "Transporte", "Alimentação", "Hospedagem", "Taxas/Licenças", "Projeto/Consultoria", "Comunicação", "Outros"];

function DespForm({ item, obras, onSave, onCancel }) {
  const [form, setForm] = useState({
    obra_id: item?.obra_id || "",
    obra_nome: item?.obra_nome || "",
    tipo: item?.tipo || "",
    data: item?.data || new Date().toISOString().slice(0, 10),
    valor: item?.valor || "",
    responsavel: item?.responsavel || "",
    descricao: item?.descricao || "",
  });
  const [saving, setSaving] = useState(false);

  const handleObra = (id) => {
    const o = obras.find(o => o.id === id);
    setForm(f => ({ ...f, obra_id: id, obra_nome: o?.nome || "" }));
  };

  const inp = (field, type = "text") => ({
    type, value: form[field],
    onChange: e => setForm(f => ({ ...f, [field]: e.target.value })),
    className: "w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-yellow-500",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ ...form, valor: parseFloat(form.valor) || 0 });
    setSaving(false);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 mb-5">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Obra *</label>
            <select required value={form.obra_id} onChange={e => handleObra(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-yellow-500">
              <option value="">Selecionar</option>
              {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Tipo de Despesa</label>
            <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-yellow-500">
              <option value="">Selecionar</option>
              {TIPOS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div><label className="block text-xs text-muted-foreground mb-1.5">Data</label><input {...inp("data", "date")} /></div>
          <div><label className="block text-xs text-muted-foreground mb-1.5">Valor</label><input {...inp("valor", "number")} step="0.01" /></div>
          <div><label className="block text-xs text-muted-foreground mb-1.5">Responsável</label><input {...inp("responsavel")} /></div>
          <div><label className="block text-xs text-muted-foreground mb-1.5">Descrição</label><input {...inp("descricao")} /></div>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="px-6 py-2.5 bg-yellow-500/10 text-white rounded-lg text-sm font-medium hover:bg-yellow-400 disabled:opacity-50">{saving ? "Salvando..." : "Salvar"}</button>
          <button type="button" onClick={onCancel} className="px-6 py-2.5 bg-muted text-muted-foreground rounded-lg text-sm">Cancelar</button>
        </div>
      </form>
    </div>
  );
}

export default function ObrasDespesasTab() {
  const [items, setItems] = useState([]);
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filtroObra, setFiltroObra] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [dataIni, setDataIni] = useState("");
  const [dataFim, setDataFim] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([base44.entities.DespesaObra.list("-data"), base44.entities.Obra.list()]).then(([d, o]) => {
      setItems(d); setObras(o); setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (data) => {
    if (editItem) await base44.entities.DespesaObra.update(editItem.id, data);
    else await base44.entities.DespesaObra.create(data);
    setShowForm(false); setEditItem(null); load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir?")) return;
    await base44.entities.DespesaObra.delete(id);
    load();
  };

  const handleExport = () => {
    const rows = ["Obra;Tipo;Data;Valor;Responsável;Descrição"].concat(
      filtered.map(i => `${i.obra_nome};${i.tipo};${i.data};${i.valor};${i.responsavel || ""};${i.descricao || ""}`)
    );
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "despesas_obras.csv"; a.click();
  };

  const filtered = items.filter(i =>
    (!filtroObra || i.obra_id === filtroObra) &&
    (!filtroTipo || i.tipo === filtroTipo) &&
    (!dataIni || i.data >= dataIni) &&
    (!dataFim || i.data <= dataFim)
  );
  const totalFiltered = filtered.reduce((s, i) => s + (i.valor || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-base font-semibold text-foreground">Despesas da Obra</h2>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 bg-muted text-muted-foreground rounded-lg text-sm hover:text-foreground"><Download size={14} /> Exportar</button>
          <button onClick={() => { setEditItem(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 text-white rounded-lg text-sm font-medium hover:bg-yellow-400">
            <Plus size={16} /> Nova Despesa
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Filter size={13} className="text-muted-foreground" />
        <select value={filtroObra} onChange={e => setFiltroObra(e.target.value)} className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none">
          <option value="">Todas as obras</option>
          {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
        </select>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none">
          <option value="">Todos os tipos</option>
          {TIPOS.map(t => <option key={t}>{t}</option>)}
        </select>
        <input type="date" value={dataIni} onChange={e => setDataIni(e.target.value)} className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none" />
        <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none" />
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} registros · {fmt(totalFiltered)}</span>
      </div>

      {(showForm || editItem) && (
        <DespForm item={editItem} obras={obras} onSave={handleSave} onCancel={() => { setShowForm(false); setEditItem(null); }} />
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Obra", "Tipo", "Data", "Valor", "Responsável", "Descrição", "Ações"].map(h => (
                  <th key={h} className="text-xs text-muted-foreground px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8"><div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-sm text-muted-foreground"><DollarSign size={24} className="mx-auto mb-2 opacity-50" />Nenhuma despesa</td></tr>
              ) : filtered.map(i => (
                <tr key={i.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[120px] truncate">{i.obra_nome}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{i.tipo}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{i.data}</td>
                  <td className="px-4 py-3 text-sm font-bold text-red-400">{fmt(i.valor)}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{i.responsavel || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[150px] truncate">{i.descricao || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => { setEditItem(i); setShowForm(true); }} className="p-1 text-muted-foreground hover:text-foreground"><Pencil size={13} /></button>
                      <button onClick={() => handleDelete(i.id)} className="p-1 text-red-400 hover:text-red-300"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}