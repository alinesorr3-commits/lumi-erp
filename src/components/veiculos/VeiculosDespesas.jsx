import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, X, Receipt } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const tipoColors = {
  IPVA: "text-red-400",
  Seguro: "text-yellow-400",
  Licenciamento: "text-yellow-400",
  Multa: "text-red-400",
  Pedágio: "text-muted-foreground",
  Lavagem: "text-blue-400",
  Lubrificante: "text-yellow-400",
  Ferramenta: "text-blue-400",
  Outros: "text-muted-foreground",
};

function DespesaModal({ item, veiculos, notas, onClose, onSave }) {
  const [form, setForm] = useState({
    veiculo_id: item?.veiculo_id || "",
    veiculo_placa: item?.veiculo_placa || "",
    tipo: item?.tipo || "Outros",
    descricao: item?.descricao || "",
    valor: item?.valor || "",
    data: item?.data || new Date().toISOString().slice(0, 10),
    fornecedor: item?.fornecedor || "",
    nfe_id: item?.nfe_id || "",
    nfe_numero: item?.nfe_numero || "",
    nfse_id: item?.nfse_id || "",
    nfse_numero: item?.nfse_numero || "",
    observacoes: item?.observacoes || "",
  });
  const [saving, setSaving] = useState(false);

  const handleVeiculo = (id) => {
    const v = veiculos.find(v => v.id === id);
    setForm(f => ({ ...f, veiculo_id: id, veiculo_placa: v?.placa || "" }));
  };

  const handleNota = (field, numField, id) => {
    const n = notas.find(n => n.id === id);
    setForm(f => ({ ...f, [field]: id, [numField]: n ? `${n.tipo_doc} ${n.numero || ""}`.trim() : "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ ...form, valor: parseFloat(form.valor) || 0 });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card">
          <h2 className="text-base font-semibold text-foreground">{item ? "Editar Despesa" : "Nova Despesa"}</h2>
          <button onClick={onClose}><X size={18} className="text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Veículo *</label>
            <select required value={form.veiculo_id} onChange={e => handleVeiculo(e.target.value)}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
              <option value="">Selecionar veículo</option>
              {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} — {v.marca} {v.modelo}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Tipo *</label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                {Object.keys(tipoColors).map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Data *</label>
              <input required type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Valor (R$) *</label>
              <input required type="number" step="0.01" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Fornecedor</label>
              <input value={form.fornecedor} onChange={e => setForm(f => ({ ...f, fornecedor: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-muted-foreground mb-1.5">Descrição</label>
              <input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
          </div>

          {/* Vínculos NF */}
          <div className="border border-border rounded-xl p-3 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Documentos Fiscais</p>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">NF-e vinculada (lubrificante, ferramenta, material)</label>
              <select value={form.nfe_id} onChange={e => handleNota("nfe_id", "nfe_numero", e.target.value)}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                <option value="">Sem vínculo</option>
                {notas.map(n => <option key={n.id} value={n.id}>{n.tipo_doc} {n.numero || ""} — {n.destinatario || "s/d"} — {fmt(n.valor_total)}</option>)}
              </select>
              {form.nfe_id && <p className="text-xs text-green-400 mt-1">✓ {form.nfe_numero}</p>}
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">NFS-e vinculada (serviço)</label>
              <select value={form.nfse_id} onChange={e => handleNota("nfse_id", "nfse_numero", e.target.value)}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                <option value="">Sem vínculo</option>
                {notas.map(n => <option key={n.id} value={n.id}>{n.tipo_doc} {n.numero || ""} — {n.destinatario || "s/d"} — {fmt(n.valor_total)}</option>)}
              </select>
              {form.nfse_id && <p className="text-xs text-green-400 mt-1">✓ {form.nfse_numero}</p>}
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
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VeiculosDespesas() {
  const [items, setItems] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filtroVeiculo, setFiltroVeiculo] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([
      base44.entities.DespesaVeiculo.list("-data"),
      base44.entities.Veiculo.list(),
      base44.entities.NotaFiscalFiscal.list("-data_emissao", 200),
    ]).then(([d, v, n]) => { setItems(d); setVeiculos(v); setNotas(n); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (data) => {
    if (editItem) await base44.entities.DespesaVeiculo.update(editItem.id, data);
    else await base44.entities.DespesaVeiculo.create(data);
    setModal(false); setEditItem(null); load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir?")) return;
    await base44.entities.DespesaVeiculo.delete(id);
    load();
  };

  const filtered = items
    .filter(i => !filtroVeiculo || i.veiculo_id === filtroVeiculo)
    .filter(i => !filtroTipo || i.tipo === filtroTipo);

  const totalGeral = filtered.reduce((s, i) => s + (i.valor || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <select value={filtroVeiculo} onChange={e => setFiltroVeiculo(e.target.value)}
            className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
            <option value="">Todos os veículos</option>
            {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} — {v.modelo}</option>)}
          </select>
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
            className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
            <option value="">Todos os tipos</option>
            {Object.keys(tipoColors).map(t => <option key={t}>{t}</option>)}
          </select>
          <span className="text-xs text-muted-foreground">Total: <span className="text-foreground font-medium">{fmt(totalGeral)}</span></span>
        </div>
        <button onClick={() => { setEditItem(null); setModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus size={16} /> Nova Despesa
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Veículo", "Tipo", "Descrição", "Data", "Fornecedor", "Valor", "NF-e", "NFS-e", "Ações"].map(h => (
                  <th key={h} className="text-xs text-muted-foreground px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-8"><div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-sm text-muted-foreground">
                  <Receipt size={24} className="mx-auto mb-2 opacity-50" />Nenhuma despesa registrada
                </td></tr>
              ) : filtered.map(i => (
                <tr key={i.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono font-bold text-blue-400">{i.veiculo_placa}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-medium ${tipoColors[i.tipo] || "text-muted-foreground"}`}>{i.tipo}</span></td>
                  <td className="px-4 py-3 text-sm text-foreground max-w-[150px] truncate">{i.descricao || "—"}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{i.data}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{i.fornecedor || "—"}</td>
                  <td className="px-4 py-3 text-sm font-bold text-foreground">{fmt(i.valor)}</td>
                  <td className="px-4 py-3">
                    {i.nfe_numero ? <span className="text-xs bg-blue-400/10 text-blue-400 px-1.5 py-0.5 rounded">{i.nfe_numero}</span> : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {i.nfse_numero ? <span className="text-xs bg-blue-400/10 text-blue-400 px-1.5 py-0.5 rounded">{i.nfse_numero}</span> : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditItem(i); setModal(true); }} className="text-xs text-muted-foreground hover:text-foreground">Editar</button>
                      <button onClick={() => handleDelete(i.id)} className="text-xs text-red-400 hover:underline">Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && <DespesaModal item={editItem} veiculos={veiculos} notas={notas} onClose={() => { setModal(false); setEditItem(null); }} onSave={handleSave} />}
    </div>
  );
}