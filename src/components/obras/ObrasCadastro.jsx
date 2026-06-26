import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { fmt, statusConfig } from "./ObrasUtils";
import { Plus, Search, Filter, Download, Upload, X, Building2, Pencil, Trash2 } from "lucide-react";
import PrintButton from "@/components/shared/PrintButton";

const ESTADOS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

function ObraForm({ obra, onSave, onCancel }) {
  const [form, setForm] = useState({
    codigo: obra?.codigo || "",
    nome: obra?.nome || "",
    cliente: obra?.cliente || "",
    valor_contrato: obra?.valor_contrato || "",
    endereco: obra?.endereco || "",
    cidade: obra?.cidade || "",
    estado: obra?.estado || "",
    responsavel: obra?.responsavel || "",
    data_inicio: obra?.data_inicio || "",
    data_previsao: obra?.data_previsao || "",
    status: obra?.status || "Planejamento",
    observacoes: obra?.observacoes || "",
  });
  const [saving, setSaving] = useState(false);

  const inp = (field, extra = {}) => ({
    value: form[field],
    onChange: e => setForm(f => ({ ...f, [field]: e.target.value })),
    className: "w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-yellow-500",
    ...extra,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ ...form, valor_contrato: parseFloat(form.valor_contrato) || 0 });
    setSaving(false);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 mb-5">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div><label className="block text-xs text-muted-foreground mb-1.5">Código da Obra</label><input {...inp("codigo")} /></div>
          <div><label className="block text-xs text-muted-foreground mb-1.5">Nome da Obra *</label><input required {...inp("nome")} /></div>
          <div><label className="block text-xs text-muted-foreground mb-1.5">Cliente</label><input {...inp("cliente")} /></div>
          <div><label className="block text-xs text-muted-foreground mb-1.5">Valor do Contrato</label><input type="number" step="0.01" {...inp("valor_contrato")} /></div>
          <div><label className="block text-xs text-muted-foreground mb-1.5">Endereço</label><input {...inp("endereco")} /></div>
          <div><label className="block text-xs text-muted-foreground mb-1.5">Cidade</label><input {...inp("cidade")} /></div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Estado</label>
            <select {...inp("estado")} className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-yellow-500">
              <option value="">Selecionar</option>
              {ESTADOS.map(e => <option key={e}>{e}</option>)}
            </select>
          </div>
          <div><label className="block text-xs text-muted-foreground mb-1.5">Responsável</label><input {...inp("responsavel")} /></div>
          <div><label className="block text-xs text-muted-foreground mb-1.5">Data de Início</label><input type="date" {...inp("data_inicio")} /></div>
          <div><label className="block text-xs text-muted-foreground mb-1.5">Previsão de Conclusão</label><input type="date" {...inp("data_previsao")} /></div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Status</label>
            <select {...inp("status")} className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-yellow-500">
              {["Planejamento", "Em Andamento", "Concluída", "Pausada", "Cancelada"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div><label className="block text-xs text-muted-foreground mb-1.5">Observações</label><input {...inp("observacoes")} /></div>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="px-6 py-2.5 bg-yellow-500/10 text-white rounded-lg text-sm font-medium hover:bg-yellow-400 disabled:opacity-50">
            {saving ? "Salvando..." : "Salvar"}
          </button>
          <button type="button" onClick={onCancel} className="px-6 py-2.5 bg-muted text-muted-foreground rounded-lg text-sm">Cancelar</button>
        </div>
      </form>
    </div>
  );
}

export default function ObrasCadastro() {
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroCidade, setFiltroCidade] = useState("");
  const csvRef = useRef();

  const load = () => {
    setLoading(true);
    base44.entities.Obra.list("-created_date").then(d => { setObras(d); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (data) => {
    if (editItem) await base44.entities.Obra.update(editItem.id, data);
    else await base44.entities.Obra.create(data);
    setShowForm(false); setEditItem(null); load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir esta obra?")) return;
    await base44.entities.Obra.delete(id);
    load();
  };

  const handleImport = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const text = await file.text();
    const lines = text.split("\n").filter(l => l.trim());
    for (const line of lines.slice(1)) {
      const [codigo, nome, cliente, valor_contrato, cidade, estado, responsavel, status] = line.split(";");
      if (nome?.trim()) await base44.entities.Obra.create({ codigo: codigo?.trim(), nome: nome?.trim(), cliente: cliente?.trim(), valor_contrato: parseFloat(valor_contrato) || 0, cidade: cidade?.trim(), estado: estado?.trim(), responsavel: responsavel?.trim(), status: status?.trim() || "Planejamento" });
    }
    load(); e.target.value = "";
  };

  const handleExport = () => {
    const rows = ["Código;Nome;Cliente;Valor Contrato;Cidade;Estado;Responsável;Status"].concat(
      obras.map(o => `${o.codigo || ""};${o.nome};${o.cliente || ""};${o.valor_contrato || 0};${o.cidade || ""};${o.estado || ""};${o.responsavel || ""};${o.status}`)
    );
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "obras.csv"; a.click();
  };

  const cidades = [...new Set(obras.map(o => o.cidade).filter(Boolean))];
  const filtered = obras.filter(o =>
    (!search || o.nome?.toLowerCase().includes(search.toLowerCase()) || o.cliente?.toLowerCase().includes(search.toLowerCase()) || o.responsavel?.toLowerCase().includes(search.toLowerCase())) &&
    (!filtroStatus || o.status === filtroStatus) &&
    (!filtroCidade || o.cidade === filtroCidade)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-base font-semibold text-foreground">Obras Cadastradas</h2>
        <div className="flex gap-2">
          <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
          <button onClick={() => csvRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 bg-muted text-muted-foreground rounded-lg text-sm hover:text-foreground"><Upload size={14} /> Importar</button>
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 bg-muted text-muted-foreground rounded-lg text-sm hover:text-foreground"><Download size={14} /> Exportar</button>
          <PrintButton label="Imprimir" />
          <button onClick={() => { setEditItem(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 text-white rounded-lg text-sm font-medium hover:bg-yellow-400">
            <Plus size={16} /> Nova Obra
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Filter size={14} className="text-muted-foreground" />
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nome, cliente, resp..."
            className="bg-card border border-border rounded-lg pl-8 pr-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-yellow-500 w-44" />
        </div>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-yellow-500">
          <option value="">Todos os status</option>
          {["Planejamento", "Em Andamento", "Concluída", "Pausada", "Cancelada"].map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filtroCidade} onChange={e => setFiltroCidade(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-yellow-500">
          <option value="">Todas as cidades</option>
          {cidades.map(c => <option key={c}>{c}</option>)}
        </select>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} de {obras.length}</span>
      </div>

      {(showForm || editItem) && (
        <ObraForm
          obra={editItem}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditItem(null); }}
        />
      )}

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground"><Building2 size={32} className="mx-auto mb-3 opacity-50" /><p className="text-sm">Nenhuma obra encontrada</p></div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Código", "Nome", "Cliente", "Cidade", "Responsável", "Contrato", "Status", "Ações"].map(h => (
                  <th key={h} className="text-xs text-muted-foreground px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => {
                const s = statusConfig[o.status] || statusConfig.Planejamento;
                return (
                  <tr key={o.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{o.codigo || "—"}</td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{o.nome}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{o.cliente || "—"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{o.cidade || "—"}{o.estado ? `/${o.estado}` : ""}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{o.responsavel || "—"}</td>
                    <td className="px-4 py-3 text-sm font-bold text-blue-400">{fmt(o.valor_contrato)}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>{o.status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => { setEditItem(o); setShowForm(true); }} className="p-1 text-muted-foreground hover:text-foreground"><Pencil size={13} /></button>
                        <button onClick={() => handleDelete(o.id)} className="p-1 text-red-400 hover:text-red-300"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}