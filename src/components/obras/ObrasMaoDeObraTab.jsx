import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { fmt } from "./ObrasUtils";
import { Plus, Filter, Download, Upload, Pencil, Trash2, Users } from "lucide-react";

const FUNCOES = ["Pedreiro", "Eletricista", "Encanador", "Carpinteiro", "Pintor", "Servente", "Mestre de Obras", "Engenheiro", "Arquiteto", "Terceirizado", "Outro"];

function MaoForm({ item, obras, onSave, onCancel }) {
  const [form, setForm] = useState({
    obra_id: item?.obra_id || "",
    obra_nome: item?.obra_nome || "",
    funcionario: item?.funcionario || "",
    funcao: item?.funcao || "",
    data: item?.data || new Date().toISOString().slice(0, 10),
    horas_trabalhadas: item?.horas_trabalhadas || "",
    valor_hora: item?.valor_hora || "",
    terceirizado: item?.terceirizado || false,
  });
  const [saving, setSaving] = useState(false);

  const horas = parseFloat(form.horas_trabalhadas) || 0;
  const vh = parseFloat(form.valor_hora) || 0;
  const total = horas * vh;

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
    await onSave({ ...form, horas_trabalhadas: horas, valor_hora: vh, valor_total: total });
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
          <div><label className="block text-xs text-muted-foreground mb-1.5">Funcionário / Nome</label><input {...inp("funcionario")} /></div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Função</label>
            <select value={form.funcao} onChange={e => setForm(f => ({ ...f, funcao: e.target.value }))}
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-yellow-500">
              <option value="">Selecionar</option>
              {FUNCOES.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div><label className="block text-xs text-muted-foreground mb-1.5">Data</label><input {...inp("data", "date")} /></div>
          <div><label className="block text-xs text-muted-foreground mb-1.5">Horas Trabalhadas</label><input {...inp("horas_trabalhadas", "number")} step="0.5" /></div>
          <div><label className="block text-xs text-muted-foreground mb-1.5">Valor por Hora (R$)</label><input {...inp("valor_hora", "number")} step="0.01" /></div>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <input type="checkbox" id="terceirizado" checked={form.terceirizado} onChange={e => setForm(f => ({ ...f, terceirizado: e.target.checked }))} className="accent-yellow-500" />
          <label htmlFor="terceirizado" className="text-sm text-muted-foreground">Terceirizado</label>
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

export default function ObrasMaoDeObraTab() {
  const [items, setItems] = useState([]);
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filtroObra, setFiltroObra] = useState("");
  const [filtroFuncao, setFiltroFuncao] = useState("");
  const [dataIni, setDataIni] = useState("");
  const [dataFim, setDataFim] = useState("");
  const csvRef = useRef();

  const load = () => {
    setLoading(true);
    Promise.all([base44.entities.MaoDeObraObra.list("-data"), base44.entities.Obra.list()]).then(([m, o]) => {
      setItems(m); setObras(o); setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (data) => {
    if (editItem) await base44.entities.MaoDeObraObra.update(editItem.id, data);
    else await base44.entities.MaoDeObraObra.create(data);
    setShowForm(false); setEditItem(null); load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir?")) return;
    await base44.entities.MaoDeObraObra.delete(id);
    load();
  };

  const handleExport = () => {
    const rows = ["Obra;Funcionário;Função;Data;Horas;R$/H;Total;Terceirizado"].concat(
      filtered.map(i => `${i.obra_nome};${i.funcionario || ""};${i.funcao};${i.data};${i.horas_trabalhadas};${i.valor_hora};${i.valor_total};${i.terceirizado ? "Sim" : "Não"}`)
    );
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "mao_de_obra.csv"; a.click();
  };

  const filtered = items.filter(i =>
    (!filtroObra || i.obra_id === filtroObra) &&
    (!filtroFuncao || i.funcao === filtroFuncao) &&
    (!dataIni || i.data >= dataIni) &&
    (!dataFim || i.data <= dataFim)
  );
  const totalFiltered = filtered.reduce((s, i) => s + (i.valor_total || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-base font-semibold text-foreground">Controle de Mão de Obra</h2>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 bg-muted text-muted-foreground rounded-lg text-sm hover:text-foreground"><Download size={14} /> Exportar</button>
          <button onClick={() => { setEditItem(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 text-white rounded-lg text-sm font-medium hover:bg-yellow-400">
            <Plus size={16} /> Novo Registro
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Filter size={13} className="text-muted-foreground" />
        <select value={filtroObra} onChange={e => setFiltroObra(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none">
          <option value="">Todas as obras</option>
          {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
        </select>
        <select value={filtroFuncao} onChange={e => setFiltroFuncao(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none">
          <option value="">Todas as funções</option>
          {FUNCOES.map(f => <option key={f}>{f}</option>)}
        </select>
        <input type="date" value={dataIni} onChange={e => setDataIni(e.target.value)} className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none" />
        <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none" />
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} registros · {fmt(totalFiltered)}</span>
      </div>

      {(showForm || editItem) && (
        <MaoForm item={editItem} obras={obras} onSave={handleSave} onCancel={() => { setShowForm(false); setEditItem(null); }} />
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Obra", "Funcionário", "Função", "Data", "Horas", "R$/H", "Total", "Terc.", "Ações"].map(h => (
                  <th key={h} className="text-xs text-muted-foreground px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-8"><div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-sm text-muted-foreground"><Users size={24} className="mx-auto mb-2 opacity-50" />Nenhum registro</td></tr>
              ) : filtered.map(i => (
                <tr key={i.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[120px] truncate">{i.obra_nome}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{i.funcionario || "—"}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{i.funcao}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{i.data}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{i.horas_trabalhadas}h</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{fmt(i.valor_hora)}</td>
                  <td className="px-4 py-3 text-sm font-bold text-foreground">{fmt(i.valor_total)}</td>
                  <td className="px-4 py-3">{i.terceirizado ? <span className="text-xs bg-yellow-400/10 text-yellow-400 px-1.5 py-0.5 rounded">Sim</span> : <span className="text-xs text-muted-foreground">Não</span>}</td>
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