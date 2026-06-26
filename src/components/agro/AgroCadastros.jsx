import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { fmtNum } from "./AgroUtils";
import { Plus, Edit2, Trash2, MapPin, Layers, X } from "lucide-react";

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <button onClick={onClose}><X size={18} className="text-muted-foreground" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function FazendaModal({ item, onClose, onSave }) {
  const [form, setForm] = useState(item || { nome: "", proprietario: "", area_total: 0, area_agricola: 0, municipio: "", estado: "", status: "Ativa" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const inp = "w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary";
  return (
    <Modal title={item ? "Editar Fazenda" : "Nova Fazenda"} onClose={onClose}>
      <div className="space-y-3">
        <div><label className="text-xs text-muted-foreground">Nome *</label><input className={inp} value={form.nome} onChange={e => set("nome", e.target.value)} /></div>
        <div><label className="text-xs text-muted-foreground">Proprietário</label><input className={inp} value={form.proprietario || ""} onChange={e => set("proprietario", e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-muted-foreground">Área Total (ha)</label><input type="number" className={inp} value={form.area_total || 0} onChange={e => set("area_total", +e.target.value)} /></div>
          <div><label className="text-xs text-muted-foreground">Área Agrícola (ha)</label><input type="number" className={inp} value={form.area_agricola || 0} onChange={e => set("area_agricola", +e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-muted-foreground">Município</label><input className={inp} value={form.municipio || ""} onChange={e => set("municipio", e.target.value)} /></div>
          <div><label className="text-xs text-muted-foreground">Estado</label><input className={inp} value={form.estado || ""} onChange={e => set("estado", e.target.value)} /></div>
        </div>
        <div><label className="text-xs text-muted-foreground">Matrícula / CAR</label><input className={inp} value={form.matricula || ""} onChange={e => set("matricula", e.target.value)} /></div>
        <div><label className="text-xs text-muted-foreground">Status</label>
          <select className={inp} value={form.status} onChange={e => set("status", e.target.value)}>
            {["Ativa", "Inativa", "Arrendada"].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div><label className="text-xs text-muted-foreground">Observações</label><textarea className={inp} rows={2} value={form.observacoes || ""} onChange={e => set("observacoes", e.target.value)} /></div>
        <button onClick={() => onSave(form)} className="w-full py-2.5 bg-green-600 hover:bg-green-500/10 text-white rounded-lg text-sm font-medium transition-colors">Salvar</button>
      </div>
    </Modal>
  );
}

function TalhaoModal({ item, fazendas, onClose, onSave }) {
  const [form, setForm] = useState(item || { fazenda_id: fazendas[0]?.id || "", fazenda_nome: fazendas[0]?.nome || "", nome: "", area: 0, irrigado: false });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const inp = "w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary";
  return (
    <Modal title={item ? "Editar Talhão" : "Novo Talhão"} onClose={onClose}>
      <div className="space-y-3">
        <div><label className="text-xs text-muted-foreground">Fazenda *</label>
          <select className={inp} value={form.fazenda_id} onChange={e => {
            const f = fazendas.find(f => f.id === e.target.value);
            set("fazenda_id", e.target.value); set("fazenda_nome", f?.nome || "");
          }}>
            {fazendas.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
        </div>
        <div><label className="text-xs text-muted-foreground">Nome do Talhão *</label><input className={inp} value={form.nome} onChange={e => set("nome", e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-muted-foreground">Área (ha) *</label><input type="number" className={inp} value={form.area || 0} onChange={e => set("area", +e.target.value)} /></div>
          <div><label className="text-xs text-muted-foreground">Tipo de Solo</label><input className={inp} value={form.tipo_solo || ""} onChange={e => set("tipo_solo", e.target.value)} /></div>
        </div>
        <div><label className="text-xs text-muted-foreground">Cultura Atual</label><input className={inp} value={form.cultura_atual || ""} onChange={e => set("cultura_atual", e.target.value)} /></div>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={form.irrigado} onChange={e => set("irrigado", e.target.checked)} className="accent-green-500" />
          <label className="text-sm text-foreground">Irrigado</label>
        </div>
        <div><label className="text-xs text-muted-foreground">Observações</label><textarea className={inp} rows={2} value={form.observacoes || ""} onChange={e => set("observacoes", e.target.value)} /></div>
        <button onClick={() => onSave(form)} className="w-full py-2.5 bg-green-600 hover:bg-green-500/10 text-white rounded-lg text-sm font-medium transition-colors">Salvar</button>
      </div>
    </Modal>
  );
}

export default function AgroCadastros() {
  const [sub, setSub] = useState("fazendas");
  const [fazendas, setFazendas] = useState([]);
  const [talhoes, setTalhoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [editItem, setEditItem] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([base44.entities.Fazenda.list(), base44.entities.Talhao.list()]).then(([f, t]) => {
      setFazendas(f); setTalhoes(t); setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  const saveFazenda = async (form) => {
    if (editItem) await base44.entities.Fazenda.update(editItem.id, form);
    else await base44.entities.Fazenda.create(form);
    setModal(null); setEditItem(null); load();
  };
  const saveTalhao = async (form) => {
    if (editItem) await base44.entities.Talhao.update(editItem.id, form);
    else await base44.entities.Talhao.create(form);
    setModal(null); setEditItem(null); load();
  };
  const delFazenda = async (id) => { if (confirm("Excluir fazenda?")) { await base44.entities.Fazenda.delete(id); load(); } };
  const delTalhao = async (id) => { if (confirm("Excluir talhão?")) { await base44.entities.Talhao.delete(id); load(); } };

  const inp = "px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {[["fazendas", MapPin, "Fazendas"], ["talhoes", Layers, "Talhões"]].map(([k, Icon, label]) => (
            <button key={k} onClick={() => setSub(k)} className={`flex items-center gap-1.5 ${inp} ${sub === k ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              <Icon size={13} />{label}
            </button>
          ))}
        </div>
        <button onClick={() => { setEditItem(null); setModal(sub); }} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-500/10 text-white rounded-lg text-sm font-medium ml-auto">
          <Plus size={14} /> Novo
        </button>
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-muted border-t-green-400 rounded-full animate-spin" /></div> : (
        sub === "fazendas" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {fazendas.length === 0 && <p className="text-muted-foreground text-sm col-span-3 text-center py-8">Nenhuma fazenda cadastrada.</p>}
            {fazendas.map(f => {
              const tlhs = talhoes.filter(t => t.fazenda_id === f.id);
              return (
                <div key={f.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{f.nome}</p>
                      <p className="text-xs text-muted-foreground">{f.municipio}{f.estado ? `, ${f.estado}` : ""}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${f.status === "Ativa" ? "bg-green-500/10/10 text-green-400" : "bg-muted text-muted-foreground"}`}>{f.status}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-muted rounded-lg p-2"><p className="text-muted-foreground">Área Total</p><p className="font-bold text-foreground">{fmtNum(f.area_total)} ha</p></div>
                    <div className="bg-muted rounded-lg p-2"><p className="text-muted-foreground">Área Agrícola</p><p className="font-bold text-green-400">{fmtNum(f.area_agricola)} ha</p></div>
                  </div>
                  <div className="text-xs text-muted-foreground">{tlhs.length} talhão(ões) cadastrado(s)</div>
                  <div className="flex justify-end gap-2 pt-1 border-t border-border">
                    <button onClick={() => { setEditItem(f); setModal("fazendas"); }} className="text-xs text-muted-foreground hover:text-foreground"><Edit2 size={13} /></button>
                    <button onClick={() => delFazenda(f.id)} className="text-xs text-red-400"><Trash2 size={13} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/30">
                {["Talhão", "Fazenda", "Área (ha)", "Solo", "Cultura Atual", "Irrigado", ""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {talhoes.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-muted-foreground text-sm">Nenhum talhão cadastrado.</td></tr>}
                {talhoes.map(t => (
                  <tr key={t.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium text-foreground">{t.nome}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.fazenda_nome}</td>
                    <td className="px-4 py-3 text-blue-400 font-bold">{fmtNum(t.area)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.tipo_solo || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.cultura_atual || "—"}</td>
                    <td className="px-4 py-3">{t.irrigado ? <span className="text-xs text-blue-400">Sim</span> : <span className="text-xs text-muted-foreground">Não</span>}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setEditItem(t); setModal("talhoes"); }} className="text-muted-foreground hover:text-foreground"><Edit2 size={13} /></button>
                        <button onClick={() => delTalhao(t.id)} className="text-red-400"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {modal === "fazendas" && <FazendaModal item={editItem} onClose={() => { setModal(null); setEditItem(null); }} onSave={saveFazenda} />}
      {modal === "talhoes" && <TalhaoModal item={editItem} fazendas={fazendas} onClose={() => { setModal(null); setEditItem(null); }} onSave={saveTalhao} />}
    </div>
  );
}