import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Pencil, Trash2, Users } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const TIPOS_BEM = ["Imóvel", "Veículo", "Investimento", "Empresa", "Terreno", "Equipamento", "Outro"];
const VINCULOS = ["Empresa (CNPJ)", "CPF Pessoal", "Holding", "Outro"];
const TIPOS_MOV = ["Retirada", "Aporte", "Pró-labore", "Dividendo", "Empréstimo", "Devolução"];

function SocioForm({ item, onSave, onCancel }) {
  const [form, setForm] = useState({ nome: item?.nome || "", cpf: item?.cpf || "", participacao: item?.participacao || "", cargo: item?.cargo || "", email: item?.email || "", telefone: item?.telefone || "", status: item?.status || "Ativo" });
  const [saving, setSaving] = useState(false);
  const inp = (f) => ({ value: form[f], onChange: e => setForm(p => ({ ...p, [f]: e.target.value })), className: "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" });
  const handleSubmit = async (e) => { e.preventDefault(); setSaving(true); try { await onSave({ ...form, participacao: parseFloat(form.participacao) || 0 }); } catch (error) { alert("Erro ao salvar: " + error.message); } finally { setSaving(false); } };
  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-4">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div><label className="block text-xs text-muted-foreground mb-1">Nome *</label><input required {...inp("nome")} /></div>
          <div><label className="block text-xs text-muted-foreground mb-1">CPF</label><input {...inp("cpf")} /></div>
          <div><label className="block text-xs text-muted-foreground mb-1">Participação (%)</label><input type="number" step="0.01" {...inp("participacao")} /></div>
          <div><label className="block text-xs text-muted-foreground mb-1">Cargo / Função</label><input {...inp("cargo")} /></div>
          <div><label className="block text-xs text-muted-foreground mb-1">E-mail</label><input type="email" {...inp("email")} /></div>
          <div><label className="block text-xs text-muted-foreground mb-1">Telefone</label><input {...inp("telefone")} /></div>
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">{saving ? "Salvando..." : "Salvar"}</button>
          <button type="button" onClick={onCancel} className="px-5 py-2 bg-muted text-muted-foreground rounded-lg text-sm">Cancelar</button>
        </div>
      </form>
    </div>
  );
}

function PatrimonioForm({ socios, item, onSave, onCancel }) {
  const [form, setForm] = useState({ socio_id: item?.socio_id || "", socio_nome: item?.socio_nome || "", tipo_bem: item?.tipo_bem || "", descricao: item?.descricao || "", registro: item?.registro || "", valor_aquisicao: item?.valor_aquisicao || "", valor_atual: item?.valor_atual || "", vinculacao: item?.vinculacao || "Empresa (CNPJ)", observacoes: item?.observacoes || "" });
  const [saving, setSaving] = useState(false);
  const inp = (f, type = "text") => ({ type, value: form[f], onChange: e => setForm(p => ({ ...p, [f]: e.target.value })), className: "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" });
  const handleSocio = (id) => { const s = socios.find(s => s.id === id); setForm(p => ({ ...p, socio_id: id, socio_nome: s?.nome || "" })); };
  const handleSubmit = async (e) => { e.preventDefault(); setSaving(true); try { await onSave({ ...form, valor_aquisicao: parseFloat(form.valor_aquisicao) || 0, valor_atual: parseFloat(form.valor_atual) || 0 }); } catch (error) { alert("Erro ao salvar: " + error.message); } finally { setSaving(false); } };
  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-4">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Sócio *</label>
            <select required value={form.socio_id} onChange={e => handleSocio(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
              <option value="">Selecionar</option>
              {socios.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Tipo do Bem</label>
            <select value={form.tipo_bem} onChange={e => setForm(p => ({ ...p, tipo_bem: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
              <option value="">Selecionar</option>
              {TIPOS_BEM.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="col-span-2"><label className="block text-xs text-muted-foreground mb-1">Descrição *</label><input required {...inp("descricao")} /></div>
          <div><label className="block text-xs text-muted-foreground mb-1">Registro / Placa / Matrícula</label><input {...inp("registro")} /></div>
          <div><label className="block text-xs text-muted-foreground mb-1">Valor de Aquisição</label><input {...inp("valor_aquisicao", "number")} step="0.01" /></div>
          <div><label className="block text-xs text-muted-foreground mb-1">Valor Atual</label><input {...inp("valor_atual", "number")} step="0.01" /></div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Vinculação</label>
            <select value={form.vinculacao} onChange={e => setForm(p => ({ ...p, vinculacao: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
              {VINCULOS.map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div className="col-span-2"><label className="block text-xs text-muted-foreground mb-1">Observações</label><input {...inp("observacoes")} /></div>
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-500/10 disabled:opacity-50">{saving ? "Salvando..." : "Salvar"}</button>
          <button type="button" onClick={onCancel} className="px-5 py-2 bg-muted text-muted-foreground rounded-lg text-sm">Cancelar</button>
        </div>
      </form>
    </div>
  );
}

function MovimentacaoForm({ socios, onSave, onCancel }) {
  const hoje = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ socio_id: "", socio_nome: "", tipo: "", descricao: "", valor: "", data: hoje, vinculacao: "Empresa (CNPJ)", nome_terceiro: "", observacoes: "" });
  const [saving, setSaving] = useState(false);
  const inp = (f, type = "text") => ({ type, value: form[f], onChange: e => setForm(p => ({ ...p, [f]: e.target.value })), className: "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" });
  const handleSocio = (id) => { const s = socios.find(s => s.id === id); setForm(p => ({ ...p, socio_id: id, socio_nome: s?.nome || "" })); };
  const handleSubmit = async (e) => { e.preventDefault(); setSaving(true); try { await onSave({ ...form, valor: parseFloat(form.valor) || 0 }); } catch (error) { alert("Erro ao salvar: " + error.message); } finally { setSaving(false); } };
  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-4">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Sócio *</label>
            <select required value={form.socio_id} onChange={e => handleSocio(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
              <option value="">Selecionar</option>
              {socios.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Tipo de Movimentação</label>
            <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
              <option value="">Selecionar</option>
              {TIPOS_MOV.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="col-span-2"><label className="block text-xs text-muted-foreground mb-1">Descrição *</label><input required {...inp("descricao")} /></div>
          <div><label className="block text-xs text-muted-foreground mb-1">Valor (R$)</label><input {...inp("valor", "number")} step="0.01" /></div>
          <div><label className="block text-xs text-muted-foreground mb-1">Data</label><input {...inp("data", "date")} /></div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Vinculação</label>
            <select value={form.vinculacao} onChange={e => setForm(p => ({ ...p, vinculacao: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
              {VINCULOS.map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div><label className="block text-xs text-muted-foreground mb-1">Nome Terceiro</label><input placeholder="CPF/CNPJ ou nome" {...inp("nome_terceiro")} /></div>
          <div className="col-span-2"><label className="block text-xs text-muted-foreground mb-1">Observações</label><input {...inp("observacoes")} /></div>
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-500/10 disabled:opacity-50">{saving ? "Salvando..." : "Salvar"}</button>
          <button type="button" onClick={onCancel} className="px-5 py-2 bg-muted text-muted-foreground rounded-lg text-sm">Cancelar</button>
        </div>
      </form>
    </div>
  );
}

export default function Socios() {
  const [socios, setSocios] = useState([]);
  const [patrimonios, setPatrimonios] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState("socios");
  const [showForm, setShowForm] = useState(false);
  const [editSocio, setEditSocio] = useState(null);
  const [editPatrim, setEditPatrim] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      base44.entities.Socio.list(),
      base44.entities.PatrimonioFamiliar.list(),
      base44.entities.MovimentacaoSocio.list("-data"),
    ]).then(([s, p, m]) => { setSocios(s); setPatrimonios(p); setMovimentacoes(m); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const handleSaveSocio = async (data) => { if (editSocio) await base44.entities.Socio.update(editSocio.id, data); else await base44.entities.Socio.create(data); setShowForm(false); setEditSocio(null); load(); };
  const handleDeleteSocio = async (id) => { if (!confirm("Excluir sócio?")) return; await base44.entities.Socio.delete(id); load(); };
  const handleSavePatrim = async (data) => { if (editPatrim) await base44.entities.PatrimonioFamiliar.update(editPatrim.id, data); else await base44.entities.PatrimonioFamiliar.create(data); setShowForm(false); setEditPatrim(null); load(); };
  const handleDeletePatrim = async (id) => { if (!confirm("Excluir bem?")) return; await base44.entities.PatrimonioFamiliar.delete(id); load(); };
  const handleSaveMov = async (data) => { await base44.entities.MovimentacaoSocio.create(data); setShowForm(false); load(); };
  const handleDeleteMov = async (id) => { if (!confirm("Excluir movimentação?")) return; await base44.entities.MovimentacaoSocio.delete(id); load(); };

  const totalPatrim = patrimonios.reduce((s, p) => s + (p.valor_atual || 0), 0);
  const totalRetiradas = movimentacoes.filter(m => m.tipo === "Retirada" || m.tipo === "Pró-labore" || m.tipo === "Dividendo").reduce((s, m) => s + (m.valor || 0), 0);
  const totalAportes = movimentacoes.filter(m => m.tipo === "Aporte").reduce((s, m) => s + (m.valor || 0), 0);

  return (
    <div>
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-card border border-border rounded-xl p-4"><p className="text-xs text-muted-foreground mb-1">Patrimônio Total</p><p className="text-2xl font-bold text-green-400">{fmt(totalPatrim)}</p></div>
        <div className="bg-card border border-border rounded-xl p-4"><p className="text-xs text-muted-foreground mb-1">Total Retiradas</p><p className="text-2xl font-bold text-red-400">{fmt(totalRetiradas)}</p></div>
        <div className="bg-card border border-border rounded-xl p-4"><p className="text-xs text-muted-foreground mb-1">Total Aportes</p><p className="text-2xl font-bold text-green-400">{fmt(totalAportes)}</p></div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg mb-5 w-fit">
        {[["socios", "Sócios", "👤"], ["patrimonio", "Patrimônio Familiar", "🏠"], ["movimentacoes", "Movimentações", "📋"]].map(([k, label]) => (
          <button key={k} onClick={() => { setSubTab(k); setShowForm(false); setEditSocio(null); setEditPatrim(null); }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${subTab === k ? "bg-green-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* SÓCIOS */}
      {subTab === "socios" && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-foreground">Quadro Societário</h3>
            <button onClick={() => { setEditSocio(null); setShowForm(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"><Plus size={14} /> Novo Sócio</button>
          </div>
          {showForm && <SocioForm item={editSocio} onSave={handleSaveSocio} onCancel={() => { setShowForm(false); setEditSocio(null); }} />}
          {loading ? <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
            : socios.length === 0 ? <div className="text-center py-12 text-muted-foreground"><Users size={28} className="mx-auto mb-2 opacity-40" /><p className="text-sm">Nenhum sócio cadastrado</p></div>
            : socios.map(s => (
              <div key={s.id} className="bg-card border border-border rounded-xl p-4 mb-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2"><p className="text-sm font-semibold text-foreground">{s.nome}</p><span className={`text-xs px-1.5 py-0.5 rounded-full ${s.status === "Ativo" ? "bg-green-400/10 text-green-400" : "bg-muted text-muted-foreground"}`}>{s.status}</span></div>
                  <p className="text-xs text-muted-foreground">{s.cargo}{s.participacao ? ` · ${s.participacao}%` : ""}{s.cpf ? ` · CPF: ${s.cpf}` : ""}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditSocio(s); setShowForm(true); }} className="p-1.5 text-muted-foreground hover:text-foreground"><Pencil size={13} /></button>
                  <button onClick={() => handleDeleteSocio(s.id)} className="p-1.5 text-red-400 hover:text-red-300"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
        </>
      )}

      {/* PATRIMÔNIO FAMILIAR */}
      {subTab === "patrimonio" && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-foreground">Patrimônio Familiar</h3>
            <button onClick={() => { setEditPatrim(null); setShowForm(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-500/10"><Plus size={14} /> Novo Bem</button>
          </div>
          {showForm && <PatrimonioForm socios={socios} item={editPatrim} onSave={handleSavePatrim} onCancel={() => { setShowForm(false); setEditPatrim(null); }} />}
          {loading ? <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
            : patrimonios.length === 0 ? <div className="text-center py-12 text-muted-foreground"><p className="text-sm">Nenhum bem patrimonial registrado</p></div>
            : (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead><tr className="border-b border-border">{["Sócio", "Tipo", "Descrição", "Registro", "Valor Aquisição", "Valor Atual", "Vinculação", "Ações"].map(h => <th key={h} className="text-xs text-muted-foreground px-4 py-3 text-left">{h}</th>)}</tr></thead>
                  <tbody>
                    {patrimonios.map(p => (
                      <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="px-4 py-3 text-sm text-foreground">{p.socio_nome}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{p.tipo_bem || "—"}</td>
                        <td className="px-4 py-3 text-sm font-medium text-foreground">{p.descricao}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{p.registro || "—"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{fmt(p.valor_aquisicao)}</td>
                        <td className="px-4 py-3 text-sm font-bold text-green-400">{fmt(p.valor_atual)}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{p.vinculacao}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button onClick={() => { setEditPatrim(p); setShowForm(true); }} className="p-1 text-muted-foreground hover:text-foreground"><Pencil size={13} /></button>
                            <button onClick={() => handleDeletePatrim(p.id)} className="p-1 text-red-400 hover:text-red-300"><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </>
      )}

      {/* MOVIMENTAÇÕES */}
      {subTab === "movimentacoes" && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-foreground">Movimentações</h3>
            <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-500/10"><Plus size={14} /> Nova Movimentação</button>
          </div>
          {showForm && <MovimentacaoForm socios={socios} onSave={handleSaveMov} onCancel={() => setShowForm(false)} />}
          {loading ? <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
            : movimentacoes.length === 0 ? <div className="text-center py-12 text-muted-foreground"><p className="text-sm">Nenhuma movimentação registrada</p></div>
            : (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead><tr className="border-b border-border">{["Sócio", "Tipo", "Descrição", "Data", "Vinculação", "Valor", "Ações"].map(h => <th key={h} className="text-xs text-muted-foreground px-4 py-3 text-left">{h}</th>)}</tr></thead>
                  <tbody>
                    {movimentacoes.map(m => (
                      <tr key={m.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="px-4 py-3 text-sm text-foreground">{m.socio_nome}</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${m.tipo === "Aporte" ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>{m.tipo}</span></td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{m.descricao}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{m.data}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{m.vinculacao}</td>
                        <td className="px-4 py-3 text-sm font-bold text-foreground">{fmt(m.valor)}</td>
                        <td className="px-4 py-3"><button onClick={() => handleDeleteMov(m.id)} className="text-red-400 hover:text-red-300 text-xs">Excluir</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </>
      )}
    </div>
  );
}