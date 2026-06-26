import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, X, Wrench } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const statusConfig = {
  Agendada: { color: "text-blue-400", bg: "bg-blue-400/10" },
  "Em andamento": { color: "text-yellow-400", bg: "bg-yellow-400/10" },
  Concluída: { color: "text-green-400", bg: "bg-green-400/10" },
  Cancelada: { color: "text-muted-foreground", bg: "bg-muted" },
};

function ManutModal({ item, veiculos, notas, onClose, onSave }) {
  const [form, setForm] = useState({
    veiculo_id: item?.veiculo_id || "",
    veiculo_placa: item?.veiculo_placa || "",
    tipo: item?.tipo || "Preventiva",
    descricao: item?.descricao || "",
    oficina: item?.oficina || "",
    data: item?.data || new Date().toISOString().slice(0, 10),
    hodometro: item?.hodometro || "",
    valor_pecas: item?.valor_pecas || 0,
    valor_servico: item?.valor_servico || 0,
    valor_total: item?.valor_total || 0,
    status: item?.status || "Concluída",
    nfe_manutencao_id: item?.nfe_manutencao_id || "",
    nfe_manutencao_numero: item?.nfe_manutencao_numero || "",
    nfse_manutencao_id: item?.nfse_manutencao_id || "",
    nfse_manutencao_numero: item?.nfse_manutencao_numero || "",
    nfe_pecas_id: item?.nfe_pecas_id || "",
    nfe_pecas_numero: item?.nfe_pecas_numero || "",
    garantia_km: item?.garantia_km || "",
    garantia_data: item?.garantia_data || "",
    proxima_revisao_km: item?.proxima_revisao_km || "",
    observacoes: item?.observacoes || "",
  });
  const [saving, setSaving] = useState(false);

  const pecas = parseFloat(form.valor_pecas) || 0;
  const servico = parseFloat(form.valor_servico) || 0;
  const total = pecas + servico;

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
    await onSave({
      ...form,
      hodometro: parseFloat(form.hodometro) || 0,
      valor_pecas: pecas,
      valor_servico: servico,
      valor_total: total,
      garantia_km: parseFloat(form.garantia_km) || 0,
      proxima_revisao_km: parseFloat(form.proxima_revisao_km) || 0,
    });
    setSaving(false);
  };

  const notasNFe = notas.filter(n => n.tipo_doc !== "NFS-e");
  const notasNFSe = notas.filter(n => n.tipo_doc === "NFS-e");

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card">
          <h2 className="text-base font-semibold text-foreground">{item ? "Editar Manutenção" : "Registrar Manutenção"}</h2>
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
              <label className="block text-xs text-muted-foreground mb-1.5">Tipo *</label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                {["Preventiva", "Corretiva", "Revisão", "Troca de óleo", "Pneus", "Funilaria/Pintura", "Elétrica", "Outro"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                {Object.keys(statusConfig).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Data *</label>
              <input required type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Hodômetro (km)</label>
              <input type="number" value={form.hodometro} onChange={e => setForm(f => ({ ...f, hodometro: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-muted-foreground mb-1.5">Descrição do Serviço</label>
              <textarea rows={2} value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary resize-none" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-muted-foreground mb-1.5">Oficina / Fornecedor</label>
              <input value={form.oficina} onChange={e => setForm(f => ({ ...f, oficina: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
          </div>

          {/* Valores */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Valor Peças (R$)</label>
              <input type="number" step="0.01" value={form.valor_pecas} onChange={e => setForm(f => ({ ...f, valor_pecas: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Valor Serviço (R$)</label>
              <input type="number" step="0.01" value={form.valor_servico} onChange={e => setForm(f => ({ ...f, valor_servico: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div className="flex items-end">
              <div className="w-full p-2 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-sm font-bold text-primary">{fmt(total)}</p>
              </div>
            </div>
          </div>

          {/* Vínculos NF */}
          <div className="border border-border rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Documentos Fiscais Vinculados</p>
            
            <div>
              <label className="block text-xs text-muted-foreground mb-1">NF-e de Peças / Ferramentas</label>
              <select value={form.nfe_pecas_id} onChange={e => handleNota("nfe_pecas_id", "nfe_pecas_numero", e.target.value)}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                <option value="">Sem vínculo</option>
                {notasNFe.map(n => <option key={n.id} value={n.id}>{n.tipo_doc} {n.numero || ""} — {n.destinatario || "s/d"} — {fmt(n.valor_total)}</option>)}
              </select>
              {form.nfe_pecas_id && <p className="text-xs text-green-400 mt-1">✓ {form.nfe_pecas_numero}</p>}
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">NF-e de Manutenção (mercadorias)</label>
              <select value={form.nfe_manutencao_id} onChange={e => handleNota("nfe_manutencao_id", "nfe_manutencao_numero", e.target.value)}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                <option value="">Sem vínculo</option>
                {notasNFe.map(n => <option key={n.id} value={n.id}>{n.tipo_doc} {n.numero || ""} — {n.destinatario || "s/d"} — {fmt(n.valor_total)}</option>)}
              </select>
              {form.nfe_manutencao_id && <p className="text-xs text-green-400 mt-1">✓ {form.nfe_manutencao_numero}</p>}
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">NFS-e de Serviço de Manutenção</label>
              <select value={form.nfse_manutencao_id} onChange={e => handleNota("nfse_manutencao_id", "nfse_manutencao_numero", e.target.value)}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                <option value="">Sem vínculo</option>
                {notas.map(n => <option key={n.id} value={n.id}>{n.tipo_doc} {n.numero || ""} — {n.destinatario || "s/d"} — {fmt(n.valor_total)}</option>)}
              </select>
              {form.nfse_manutencao_id && <p className="text-xs text-green-400 mt-1">✓ {form.nfse_manutencao_numero}</p>}
            </div>
          </div>

          {/* Garantia / Próxima revisão */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Garantia (km)</label>
              <input type="number" value={form.garantia_km} onChange={e => setForm(f => ({ ...f, garantia_km: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Garantia até</label>
              <input type="date" value={form.garantia_data} onChange={e => setForm(f => ({ ...f, garantia_data: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Próxima Revisão (km)</label>
              <input type="number" value={form.proxima_revisao_km} onChange={e => setForm(f => ({ ...f, proxima_revisao_km: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
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
              {saving ? "Salvando..." : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VeiculosManutencao() {
  const [items, setItems] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filtroVeiculo, setFiltroVeiculo] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([
      base44.entities.ManutencaoVeiculo.list("-data"),
      base44.entities.Veiculo.list(),
      base44.entities.NotaFiscalFiscal.list("-data_emissao", 200),
    ]).then(([m, v, n]) => { setItems(m); setVeiculos(v); setNotas(n); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (data) => {
    if (editItem) await base44.entities.ManutencaoVeiculo.update(editItem.id, data);
    else await base44.entities.ManutencaoVeiculo.create(data);
    setModal(false); setEditItem(null); load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir?")) return;
    await base44.entities.ManutencaoVeiculo.delete(id);
    load();
  };

  const filtered = items
    .filter(i => !filtroVeiculo || i.veiculo_id === filtroVeiculo)
    .filter(i => !filtroStatus || i.status === filtroStatus);

  const totalGeral = filtered.reduce((s, i) => s + (i.valor_total || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <select value={filtroVeiculo} onChange={e => setFiltroVeiculo(e.target.value)}
            className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
            <option value="">Todos os veículos</option>
            {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} — {v.modelo}</option>)}
          </select>
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
            className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
            <option value="">Todos status</option>
            {Object.keys(statusConfig).map(s => <option key={s}>{s}</option>)}
          </select>
          <span className="text-xs text-muted-foreground">Total: <span className="text-foreground font-medium">{fmt(totalGeral)}</span></span>
        </div>
        <button onClick={() => { setEditItem(null); setModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus size={16} /> Registrar
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground"><Wrench size={32} className="mx-auto mb-3 opacity-50" /><p className="text-sm">Nenhuma manutenção registrada</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(i => {
            const s = statusConfig[i.status] || statusConfig.Concluída;
            return (
              <div key={i.id} className={`bg-card border rounded-xl p-4 ${i.status === "Em andamento" ? "border-yellow-500/30" : "border-border"}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-mono font-bold text-blue-400">{i.veiculo_placa}</span>
                      <span className="text-sm font-semibold text-foreground">{i.tipo}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>{i.status}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{i.data} · {i.oficina || "Oficina não informada"}{i.hodometro ? ` · ${i.hodometro.toLocaleString("pt-BR")} km` : ""}</p>
                    {i.descricao && <p className="text-xs text-foreground mt-1">{i.descricao}</p>}
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-lg font-bold text-yellow-400">{fmt(i.valor_total)}</p>
                    <p className="text-xs text-muted-foreground">P: {fmt(i.valor_pecas)} · S: {fmt(i.valor_servico)}</p>
                  </div>
                </div>
                {/* NFs vinculadas */}
                {(i.nfe_pecas_numero || i.nfe_manutencao_numero || i.nfse_manutencao_numero) && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {i.nfe_pecas_numero && <span className="text-xs bg-blue-400/10 text-blue-400 px-1.5 py-0.5 rounded">NF Peças: {i.nfe_pecas_numero}</span>}
                    {i.nfe_manutencao_numero && <span className="text-xs bg-green-400/10 text-green-400 px-1.5 py-0.5 rounded">NF Manut.: {i.nfe_manutencao_numero}</span>}
                    {i.nfse_manutencao_numero && <span className="text-xs bg-blue-400/10 text-blue-400 px-1.5 py-0.5 rounded">NFS-e: {i.nfse_manutencao_numero}</span>}
                  </div>
                )}
                {i.proxima_revisao_km > 0 && (
                  <p className="text-xs text-blue-400 mb-2">Próxima revisão: {i.proxima_revisao_km.toLocaleString("pt-BR")} km</p>
                )}
                <div className="flex gap-2">
                  <button onClick={() => { setEditItem(i); setModal(true); }} className="text-xs text-muted-foreground hover:text-foreground">Editar</button>
                  <button onClick={() => handleDelete(i.id)} className="text-xs text-red-400 hover:underline">Excluir</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && <ManutModal item={editItem} veiculos={veiculos} notas={notas} onClose={() => { setModal(false); setEditItem(null); }} onSave={handleSave} />}
    </div>
  );
}