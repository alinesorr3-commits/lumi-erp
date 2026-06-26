import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, X, Fuel, Download } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const fmtN = (v, d = 2) => (v || 0).toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });

function AbastModal({ item, veiculos, notas, onClose, onSave }) {
  const [form, setForm] = useState({
    veiculo_id: item?.veiculo_id || "",
    veiculo_placa: item?.veiculo_placa || "",
    data: item?.data || new Date().toISOString().slice(0, 10),
    hodometro: item?.hodometro || "",
    litros: item?.litros || "",
    preco_litro: item?.preco_litro || "",
    valor_total: item?.valor_total || "",
    combustivel: item?.combustivel || "Diesel",
    posto: item?.posto || "",
    motorista: item?.motorista || "",
    nfe_id: item?.nfe_id || "",
    nfe_numero: item?.nfe_numero || "",
    observacoes: item?.observacoes || "",
  });
  const [saving, setSaving] = useState(false);

  const handleVeiculo = (id) => {
    const v = veiculos.find(v => v.id === id);
    setForm(f => ({ ...f, veiculo_id: id, veiculo_placa: v?.placa || "", combustivel: v?.combustivel !== "Flex" ? v?.combustivel : f.combustivel }));
  };

  const handleNota = (id) => {
    const n = notas.find(n => n.id === id);
    setForm(f => ({ ...f, nfe_id: id, nfe_numero: n ? `${n.tipo_doc} ${n.numero || ""}`.trim() : "", valor_total: n?.valor_total || f.valor_total }));
  };

  // Auto-calcular total
  const calcTotal = () => {
    const l = parseFloat(form.litros);
    const p = parseFloat(form.preco_litro);
    if (l && p) setForm(f => ({ ...f, valor_total: (l * p).toFixed(2) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      ...form,
      hodometro: parseFloat(form.hodometro) || 0,
      litros: parseFloat(form.litros) || 0,
      preco_litro: parseFloat(form.preco_litro) || 0,
      valor_total: parseFloat(form.valor_total) || 0,
    });
    setSaving(false);
  };

  const combustiveisNota = notas.filter(n =>
    n.natureza_operacao?.toLowerCase().includes("combust") ||
    n.natureza_operacao?.toLowerCase().includes("lubrif") ||
    n.observacoes?.toLowerCase().includes("combust") ||
    n.tipo_doc === "NF-e"
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card">
          <h2 className="text-base font-semibold text-foreground">{item ? "Editar Abastecimento" : "Registrar Abastecimento"}</h2>
          <button onClick={onClose}><X size={18} className="text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-muted-foreground mb-1.5">Veículo *</label>
              <select required value={form.veiculo_id} onChange={e => handleVeiculo(e.target.value)}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                <option value="">Selecionar veículo</option>
                {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} — {v.marca} {v.modelo}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Data *</label>
              <input required type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Combustível</label>
              <select value={form.combustivel} onChange={e => setForm(f => ({ ...f, combustivel: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                {["Gasolina", "Etanol", "Diesel", "GNV", "Arla 32", "Outro"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Hodômetro (km)</label>
              <input type="number" value={form.hodometro} onChange={e => setForm(f => ({ ...f, hodometro: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Litros *</label>
              <input required type="number" step="0.01" value={form.litros} onChange={e => { setForm(f => ({ ...f, litros: e.target.value })); }}
                onBlur={calcTotal}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Preço/Litro (R$)</label>
              <input type="number" step="0.001" value={form.preco_litro} onChange={e => setForm(f => ({ ...f, preco_litro: e.target.value }))}
                onBlur={calcTotal}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Total (R$) *</label>
              <input required type="number" step="0.01" value={form.valor_total} onChange={e => setForm(f => ({ ...f, valor_total: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Posto / Fornecedor</label>
              <input value={form.posto} onChange={e => setForm(f => ({ ...f, posto: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Motorista</label>
              <input value={form.motorista} onChange={e => setForm(f => ({ ...f, motorista: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
          </div>

          {/* Vínculo NF */}
          <div className="border border-border rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vincular NF-e de Combustível / Lubrificante</p>
            <select value={form.nfe_id} onChange={e => handleNota(e.target.value)}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
              <option value="">Sem vínculo</option>
              {notas.map(n => <option key={n.id} value={n.id}>{n.tipo_doc} {n.numero || ""} — {n.destinatario || "s/d"} — {fmt(n.valor_total)}</option>)}
            </select>
            {form.nfe_id && <p className="text-xs text-green-400">✓ NF vinculada: {form.nfe_numero}</p>}
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Observações</label>
            <textarea rows={2} value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm bg-muted text-muted-foreground">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm bg-primary text-primary-foreground disabled:opacity-50">
              {saving ? "Salvando..." : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VeiculosAbastecimento() {
  const [items, setItems] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filtroVeiculo, setFiltroVeiculo] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([
      base44.entities.AbastecimentoVeiculo.list("-data"),
      base44.entities.Veiculo.list(),
      base44.entities.NotaFiscalFiscal.list("-data_emissao", 200),
    ]).then(([a, v, n]) => { setItems(a); setVeiculos(v); setNotas(n); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (data) => {
    if (editItem) await base44.entities.AbastecimentoVeiculo.update(editItem.id, data);
    else await base44.entities.AbastecimentoVeiculo.create(data);
    setModal(false); setEditItem(null); load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir?")) return;
    await base44.entities.AbastecimentoVeiculo.delete(id);
    load();
  };

  const filtered = filtroVeiculo ? items.filter(i => i.veiculo_id === filtroVeiculo) : items;
  const totalLitros = filtered.reduce((s, i) => s + (i.litros || 0), 0);
  const totalValor = filtered.reduce((s, i) => s + (i.valor_total || 0), 0);

  const exportarCSV = () => {
    const rows = ["Placa,Data,Hodômetro,Combustível,Litros,Preço/L,Total,Posto,Motorista,NF"]
      .concat(filtered.map(i => `${i.veiculo_placa},${i.data},${i.hodometro},${i.combustivel},${i.litros},${i.preco_litro},${i.valor_total},${i.posto || ""},${i.motorista || ""},${i.nfe_numero || ""}`));
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "abastecimentos.csv"; a.click();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <select value={filtroVeiculo} onChange={e => setFiltroVeiculo(e.target.value)}
            className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
            <option value="">Todos os veículos</option>
            {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} — {v.modelo}</option>)}
          </select>
          <span className="text-xs text-muted-foreground">{fmtN(totalLitros)} L · {fmt(totalValor)}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={exportarCSV} className="flex items-center gap-1.5 px-3 py-2 bg-muted text-muted-foreground rounded-lg text-sm hover:text-foreground">
            <Download size={14} /> CSV
          </button>
          <button onClick={() => { setEditItem(null); setModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
            <Plus size={16} /> Registrar
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Veículo", "Data", "Km", "Combustível", "Litros", "R$/L", "Total", "Posto", "NF", "Ações"].map(h => (
                  <th key={h} className="text-xs text-muted-foreground px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="text-center py-8"><div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12 text-sm text-muted-foreground">
                  <Fuel size={24} className="mx-auto mb-2 opacity-50" />Nenhum abastecimento registrado
                </td></tr>
              ) : filtered.map(i => (
                <tr key={i.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono font-bold text-blue-400">{i.veiculo_placa}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{i.data}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{i.hodometro ? i.hodometro.toLocaleString("pt-BR") : "—"}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{i.combustivel}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{fmtN(i.litros)} L</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{i.preco_litro ? `R$ ${fmtN(i.preco_litro, 3)}` : "—"}</td>
                  <td className="px-4 py-3 text-sm font-bold text-foreground">{fmt(i.valor_total)}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{i.posto || "—"}</td>
                  <td className="px-4 py-3">
                    {i.nfe_numero ? (
                      <span className="text-xs bg-green-400/10 text-green-400 px-1.5 py-0.5 rounded">{i.nfe_numero}</span>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
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

      {modal && <AbastModal item={editItem} veiculos={veiculos} notas={notas} onClose={() => { setModal(false); setEditItem(null); }} onSave={handleSave} />}
    </div>
  );
}