import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { fmt } from "./ObrasUtils";
import { Plus, Filter, Download, Upload, Pencil, Trash2, Package } from "lucide-react";

const CATEGORIAS = ["Estrutura", "Elétrica", "Hidráulica", "Acabamento", "Ferramentas", "EPI", "Outros"];

function MatForm({ item, obras, onSave, onCancel }) {
  const [form, setForm] = useState({
    obra_id: item?.obra_id || "",
    obra_nome: item?.obra_nome || "",
    data: item?.data || new Date().toISOString().slice(0, 10),
    fornecedor: item?.fornecedor || "",
    produto: item?.produto || "",
    quantidade: item?.quantidade || 1,
    valor_unitario: item?.valor_unitario || "",
    numero_nf: item?.numero_nf || "",
    categoria: item?.categoria || "",
  });
  const [saving, setSaving] = useState(false);

  const qty = parseFloat(form.quantidade) || 0;
  const vu = parseFloat(form.valor_unitario) || 0;
  const total = qty * vu;

  const handleObra = (id) => {
    const o = obras.find(o => o.id === id);
    setForm(f => ({ ...f, obra_id: id, obra_nome: o?.nome || "" }));
  };

  const inp = (field, type = "text") => ({
    type,
    value: form[field],
    onChange: e => setForm(f => ({ ...f, [field]: e.target.value })),
    className: "w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-yellow-500",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ ...form, quantidade: qty, valor_unitario: vu, valor_total: total });
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
          <div><label className="block text-xs text-muted-foreground mb-1.5">Data</label><input {...inp("data", "date")} /></div>
          <div><label className="block text-xs text-muted-foreground mb-1.5">Fornecedor</label><input {...inp("fornecedor")} /></div>
          <div><label className="block text-xs text-muted-foreground mb-1.5">Produto *</label><input required {...inp("produto")} /></div>
          <div><label className="block text-xs text-muted-foreground mb-1.5">Quantidade</label><input {...inp("quantidade", "number")} min="0" step="0.001" /></div>
          <div><label className="block text-xs text-muted-foreground mb-1.5">Valor Unitário</label><input {...inp("valor_unitario", "number")} step="0.01" /></div>
          <div><label className="block text-xs text-muted-foreground mb-1.5">Nº Nota Fiscal</label><input {...inp("numero_nf")} /></div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Categoria</label>
            <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-yellow-500">
              <option value="">Selecionar</option>
              {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        {total > 0 && (
          <div className="mb-4 p-3 bg-yellow-500/10/5 border border-yellow-500/20 rounded-lg">
            <span className="text-sm text-muted-foreground">Total: </span>
            <span className="text-sm font-bold text-yellow-400">{fmt(total)}</span>
          </div>
        )}
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="px-6 py-2.5 bg-yellow-500/10 text-white rounded-lg text-sm font-medium hover:bg-yellow-400 disabled:opacity-50">{saving ? "Salvando..." : "Salvar"}</button>
          <button type="button" onClick={onCancel} className="px-6 py-2.5 bg-muted text-muted-foreground rounded-lg text-sm">Cancelar</button>
        </div>
      </form>
    </div>
  );
}

export default function ObrasMateriaisTab() {
  const [items, setItems] = useState([]);
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filtroObra, setFiltroObra] = useState("");
  const [filtroCateg, setFiltroCateg] = useState("");
  const [dataIni, setDataIni] = useState("");
  const [dataFim, setDataFim] = useState("");
  const csvRef = useRef();

  const load = () => {
    setLoading(true);
    Promise.all([base44.entities.MaterialObra.list("-data"), base44.entities.Obra.list()]).then(([m, o]) => {
      setItems(m); setObras(o); setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (data) => {
    if (editItem) await base44.entities.MaterialObra.update(editItem.id, data);
    else await base44.entities.MaterialObra.create(data);
    setShowForm(false); setEditItem(null); load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir?")) return;
    await base44.entities.MaterialObra.delete(id);
    load();
  };

  const handleImport = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const text = await file.text();
    const lines = text.split("\n").filter(l => l.trim());
    for (const line of lines.slice(1)) {
      const [obra_nome, produto, fornecedor, quantidade, valor_unitario, categoria, numero_nf, data] = line.split(";");
      const obra = obras.find(o => o.nome?.toLowerCase() === obra_nome?.trim().toLowerCase());
      if (produto?.trim()) {
        const qty = parseFloat(quantidade) || 1;
        const vu = parseFloat(valor_unitario) || 0;
        await base44.entities.MaterialObra.create({ obra_id: obra?.id || "", obra_nome: obra_nome?.trim(), produto: produto.trim(), fornecedor: fornecedor?.trim(), quantidade: qty, valor_unitario: vu, valor_total: qty * vu, categoria: categoria?.trim(), numero_nf: numero_nf?.trim(), data: data?.trim() || new Date().toISOString().slice(0, 10) });
      }
    }
    load(); e.target.value = "";
  };

  const handleExport = () => {
    const rows = ["Obra;Produto;Fornecedor;Quantidade;Valor Unitário;Total;Categoria;NF;Data"].concat(
      filtered.map(i => `${i.obra_nome};${i.produto};${i.fornecedor || ""};${i.quantidade};${i.valor_unitario};${i.valor_total};${i.categoria || ""};${i.numero_nf || ""};${i.data}`)
    );
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "materiais.csv"; a.click();
  };

  const filtered = items.filter(i =>
    (!filtroObra || i.obra_id === filtroObra) &&
    (!filtroCateg || i.categoria === filtroCateg) &&
    (!dataIni || i.data >= dataIni) &&
    (!dataFim || i.data <= dataFim)
  );
  const totalFiltered = filtered.reduce((s, i) => s + (i.valor_total || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-base font-semibold text-foreground">Compras de Materiais</h2>
        <div className="flex gap-2">
          <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
          <button onClick={() => csvRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 bg-muted text-muted-foreground rounded-lg text-sm hover:text-foreground"><Upload size={14} /> Importar</button>
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 bg-muted text-muted-foreground rounded-lg text-sm hover:text-foreground"><Download size={14} /> Exportar</button>
          <button onClick={() => { setEditItem(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 text-white rounded-lg text-sm font-medium hover:bg-yellow-400">
            <Plus size={16} /> Registrar
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Filter size={13} className="text-muted-foreground" />
        <select value={filtroObra} onChange={e => setFiltroObra(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-yellow-500">
          <option value="">Todas as obras</option>
          {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
        </select>
        <select value={filtroCateg} onChange={e => setFiltroCateg(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-yellow-500">
          <option value="">Todas as categorias</option>
          {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
        </select>
        <input type="date" value={dataIni} onChange={e => setDataIni(e.target.value)} className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-yellow-500" />
        <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-yellow-500" />
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} registros · {fmt(totalFiltered)}</span>
      </div>

      {(showForm || editItem) && (
        <MatForm item={editItem} obras={obras} onSave={handleSave} onCancel={() => { setShowForm(false); setEditItem(null); }} />
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Obra", "Data", "Produto", "Fornecedor", "Qtd", "Unit.", "Total", "NF", "Categ.", "Ações"].map(h => (
                  <th key={h} className="text-xs text-muted-foreground px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="text-center py-8"><div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12 text-sm text-muted-foreground"><Package size={24} className="mx-auto mb-2 opacity-50" />Nenhum registro</td></tr>
              ) : filtered.map(i => (
                <tr key={i.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[120px] truncate">{i.obra_nome}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{i.data}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{i.produto}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{i.fornecedor || "—"}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{i.quantidade}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{fmt(i.valor_unitario)}</td>
                  <td className="px-4 py-3 text-sm font-bold text-foreground">{fmt(i.valor_total)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{i.numero_nf || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{i.categoria || "—"}</td>
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