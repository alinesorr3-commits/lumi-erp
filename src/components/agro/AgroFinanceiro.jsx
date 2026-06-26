import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { fmt, fmtDate, fmtNum } from "./AgroUtils";
import { Plus, X, Edit2, Trash2, AlertTriangle, CreditCard, TrendingUp } from "lucide-react";

function FinancModal({ item, fazendas, safras, onClose, onSave }) {
  const [form, setForm] = useState(item || {
    fazenda_id: fazendas[0]?.id || "", fazenda_nome: fazendas[0]?.nome || "",
    linha_credito: "Custeio Agrícola", banco: "", valor_contratado: 0, valor_parcela: 0,
    taxa_juros: 0, data_contratacao: "", data_vencimento: "", parcelas_total: 1, parcelas_pagas: 0,
    finalidade: "Custeio", status: "Ativo"
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const inp = "w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary";

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">{item ? "Editar" : "Novo"} Financiamento</h2>
          <button onClick={onClose}><X size={18} className="text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div><label className="text-xs text-muted-foreground">Fazenda *</label>
            <select className={inp} value={form.fazenda_id} onChange={e => { const f = fazendas.find(f => f.id === e.target.value); set("fazenda_id", e.target.value); set("fazenda_nome", f?.nome || ""); }}>
              {fazendas.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-muted-foreground">Linha de Crédito</label>
              <select className={inp} value={form.linha_credito} onChange={e => set("linha_credito", e.target.value)}>
                {["Pronamp","Custeio Agrícola","Investimento Rural","ABC+","Pronaf","FCO Rural","Moderinfra","BNDES","Outros"].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div><label className="text-xs text-muted-foreground">Banco/Instituição</label><input className={inp} value={form.banco} onChange={e => set("banco", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-muted-foreground">Valor Contratado (R$)</label><input type="number" className={inp} value={form.valor_contratado} onChange={e => set("valor_contratado", +e.target.value)} /></div>
            <div><label className="text-xs text-muted-foreground">Taxa Juros (% a.a.)</label><input type="number" className={inp} value={form.taxa_juros} onChange={e => set("taxa_juros", +e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-muted-foreground">Data Contratação</label><input type="date" className={inp} value={form.data_contratacao || ""} onChange={e => set("data_contratacao", e.target.value)} /></div>
            <div><label className="text-xs text-muted-foreground">Vencimento *</label><input type="date" className={inp} value={form.data_vencimento || ""} onChange={e => set("data_vencimento", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs text-muted-foreground">Parcelas Total</label><input type="number" className={inp} value={form.parcelas_total} onChange={e => set("parcelas_total", +e.target.value)} /></div>
            <div><label className="text-xs text-muted-foreground">Parcelas Pagas</label><input type="number" className={inp} value={form.parcelas_pagas} onChange={e => set("parcelas_pagas", +e.target.value)} /></div>
            <div><label className="text-xs text-muted-foreground">Valor Parcela</label><input type="number" className={inp} value={form.valor_parcela} onChange={e => set("valor_parcela", +e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-muted-foreground">Finalidade</label>
              <select className={inp} value={form.finalidade} onChange={e => set("finalidade", e.target.value)}>
                {["Custeio","Investimento","Comercialização","Industrialização"].map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div><label className="text-xs text-muted-foreground">Status</label>
              <select className={inp} value={form.status} onChange={e => set("status", e.target.value)}>
                {["Ativo","Quitado","Em atraso"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div><label className="text-xs text-muted-foreground">Observações</label><textarea className={inp} rows={2} value={form.observacoes || ""} onChange={e => set("observacoes", e.target.value)} /></div>
          <button onClick={() => onSave(form)} className="w-full py-2.5 bg-green-600 hover:bg-green-500/10 text-white rounded-lg text-sm font-medium">Salvar</button>
        </div>
      </div>
    </div>
  );
}

function InvModal({ item, fazendas, onClose, onSave }) {
  const [form, setForm] = useState(item || { fazenda_id: fazendas[0]?.id || "", fazenda_nome: fazendas[0]?.nome || "", tipo: "Máquinas/Tratores", descricao: "", valor: 0, data: "", vida_util_anos: 10, financiado: false });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const inp = "w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary";
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">{item ? "Editar" : "Novo"} Investimento</h2>
          <button onClick={onClose}><X size={18} className="text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-muted-foreground">Fazenda</label>
              <select className={inp} value={form.fazenda_id} onChange={e => { const f = fazendas.find(f => f.id === e.target.value); set("fazenda_id", e.target.value); set("fazenda_nome", f?.nome || ""); }}>
                {fazendas.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
            </div>
            <div><label className="text-xs text-muted-foreground">Tipo</label>
              <select className={inp} value={form.tipo} onChange={e => set("tipo", e.target.value)}>
                {["Máquinas/Tratores","Implementos","Irrigação","Armazém/Silo","Benfeitorias","Terra/Expansão","Tecnologia/Software","Outros"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div><label className="text-xs text-muted-foreground">Descrição *</label><input className={inp} value={form.descricao} onChange={e => set("descricao", e.target.value)} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs text-muted-foreground">Valor (R$)</label><input type="number" className={inp} value={form.valor} onChange={e => set("valor", +e.target.value)} /></div>
            <div><label className="text-xs text-muted-foreground">Data</label><input type="date" className={inp} value={form.data || ""} onChange={e => set("data", e.target.value)} /></div>
            <div><label className="text-xs text-muted-foreground">Vida Útil (anos)</label><input type="number" className={inp} value={form.vida_util_anos} onChange={e => set("vida_util_anos", +e.target.value)} /></div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.financiado} onChange={e => set("financiado", e.target.checked)} className="accent-green-500" />
            <label className="text-sm text-foreground">Financiado</label>
          </div>
          <div><label className="text-xs text-muted-foreground">Observações</label><textarea className={inp} rows={2} value={form.observacoes || ""} onChange={e => set("observacoes", e.target.value)} /></div>
          <button onClick={() => onSave(form)} className="w-full py-2.5 bg-green-600 hover:bg-green-500/10 text-white rounded-lg text-sm font-medium">Salvar</button>
        </div>
      </div>
    </div>
  );
}

export default function AgroFinanceiro() {
  const [sub, setSub] = useState("financiamentos");
  const [financiamentos, setFinanciamentos] = useState([]);
  const [investimentos, setInvestimentos] = useState([]);
  const [fazendas, setFazendas] = useState([]);
  const [safras, setSafras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      base44.entities.FinanciamentoAgricola.list(),
      base44.entities.InvestimentoAgricola.list(),
      base44.entities.Fazenda.list(),
      base44.entities.Safra.list(),
    ]).then(([fi, inv, f, s]) => { setFinanciamentos(fi); setInvestimentos(inv); setFazendas(f); setSafras(s); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const save = async (form) => {
    const entity = sub === "financiamentos" ? base44.entities.FinanciamentoAgricola : base44.entities.InvestimentoAgricola;
    if (editItem) await entity.update(editItem.id, form);
    else await entity.create(form);
    setModal(false); setEditItem(null); load();
  };
  const del = async (id) => {
    if (!confirm("Excluir?")) return;
    const entity = sub === "financiamentos" ? base44.entities.FinanciamentoAgricola : base44.entities.InvestimentoAgricola;
    await entity.delete(id); load();
  };

  const hoje = new Date();
  const em30 = new Date(); em30.setDate(hoje.getDate() + 30);
  const ativos = financiamentos.filter(f => f.status === "Ativo");
  const divida = ativos.reduce((s, f) => s + (f.valor_contratado || 0), 0);
  const totalInv = investimentos.reduce((s, i) => s + (i.valor || 0), 0);
  const depAnual = investimentos.reduce((s, i) => s + (i.vida_util_anos > 0 ? (i.valor || 0) / i.vida_util_anos : 0), 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Dívida Ativa</p>
          <p className="text-lg font-bold text-red-400">{fmt(divida)}</p>
          <p className="text-xs text-muted-foreground">{ativos.length} contratos</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Investido</p>
          <p className="text-lg font-bold text-blue-400">{fmt(totalInv)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Depreciação/Ano</p>
          <p className="text-lg font-bold text-yellow-400">{fmt(depAnual)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Venc. em 30 dias</p>
          <p className={`text-lg font-bold ${financiamentos.filter(f => f.status === "Ativo" && new Date(f.data_vencimento) <= em30).length > 0 ? "text-red-400" : "text-green-400"}`}>
            {financiamentos.filter(f => f.status === "Ativo" && new Date(f.data_vencimento) <= em30).length}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <button onClick={() => setSub("financiamentos")} className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${sub === "financiamentos" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            <CreditCard size={13} /> Financiamentos
          </button>
          <button onClick={() => setSub("investimentos")} className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${sub === "investimentos" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            <TrendingUp size={13} /> Investimentos
          </button>
        </div>
        <button onClick={() => { setEditItem(null); setModal(true); }} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-500/10 text-white rounded-lg text-sm font-medium ml-auto">
          <Plus size={14} /> Novo
        </button>
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-muted border-t-green-400 rounded-full animate-spin" /></div> : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {sub === "financiamentos" ? (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/30">
                {["Linha de Crédito", "Banco", "Fazenda", "Valor", "Taxa", "Vencimento", "Parcelas", "Status", ""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {financiamentos.length === 0 && <tr><td colSpan={9} className="text-center py-8 text-muted-foreground text-sm">Nenhum financiamento.</td></tr>}
                {financiamentos.map(f => {
                  const vencendo = f.status === "Ativo" && new Date(f.data_vencimento) <= em30;
                  const statusColor = f.status === "Ativo" ? "text-blue-400 bg-blue-400/10" : f.status === "Quitado" ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10";
                  return (
                    <tr key={f.id} className={`border-b border-border/50 hover:bg-muted/20 ${vencendo ? "bg-red-500/10/5" : ""}`}>
                      <td className="px-4 py-3 font-medium text-foreground">{f.linha_credito}</td>
                      <td className="px-4 py-3 text-muted-foreground">{f.banco || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{f.fazenda_nome}</td>
                      <td className="px-4 py-3 text-red-400 font-bold">{fmt(f.valor_contratado)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{f.taxa_juros}% a.a.</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {vencendo && <AlertTriangle size={12} className="text-red-400" />}
                          <span className={vencendo ? "text-red-400" : "text-muted-foreground"}>{fmtDate(f.data_vencimento)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{f.parcelas_pagas}/{f.parcelas_total}</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${statusColor}`}>{f.status}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { setEditItem(f); setModal(true); }} className="text-muted-foreground hover:text-foreground"><Edit2 size={13} /></button>
                          <button onClick={() => del(f.id)} className="text-red-400"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/30">
                {["Tipo", "Descrição", "Fazenda", "Valor", "Data", "Vida Útil", "Depreciação/Ano", "Financiado", ""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {investimentos.length === 0 && <tr><td colSpan={9} className="text-center py-8 text-muted-foreground text-sm">Nenhum investimento.</td></tr>}
                {investimentos.map(inv => (
                  <tr key={inv.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="px-4 py-3"><span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{inv.tipo}</span></td>
                    <td className="px-4 py-3 font-medium text-foreground">{inv.descricao}</td>
                    <td className="px-4 py-3 text-muted-foreground">{inv.fazenda_nome}</td>
                    <td className="px-4 py-3 text-blue-400 font-bold">{fmt(inv.valor)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(inv.data)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{inv.vida_util_anos} anos</td>
                    <td className="px-4 py-3 text-yellow-400">{fmt(inv.vida_util_anos > 0 ? inv.valor / inv.vida_util_anos : 0)}</td>
                    <td className="px-4 py-3">{inv.financiado ? <span className="text-xs text-blue-400">Sim</span> : <span className="text-xs text-muted-foreground">Não</span>}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setEditItem(inv); setModal(true); }} className="text-muted-foreground hover:text-foreground"><Edit2 size={13} /></button>
                        <button onClick={() => del(inv.id)} className="text-red-400"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {modal && sub === "financiamentos" && <FinancModal item={editItem} fazendas={fazendas} safras={safras} onClose={() => { setModal(false); setEditItem(null); }} onSave={save} />}
      {modal && sub === "investimentos" && <InvModal item={editItem} fazendas={fazendas} onClose={() => { setModal(false); setEditItem(null); }} onSave={save} />}
    </div>
  );
}