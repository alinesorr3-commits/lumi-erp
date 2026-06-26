import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { fmt, fmtDate, CATEGORIAS_DESPESA } from "./AgroUtils";
import { Plus, X, Trash2, Edit2, TrendingUp, TrendingDown } from "lucide-react";

function ItemModal({ item, tipo, safras, fazendas, onClose, onSave }) {
  const [form, setForm] = useState(item || {
    safra_id: safras[0]?.id || "", safra_nome: safras[0]?.nome || "",
    fazenda_id: safras[0]?.fazenda_id || "", fazenda_nome: safras[0]?.fazenda_nome || "",
    ...(tipo === "despesa" ? { categoria: "Sementes", descricao: "", data: "", valor_total: 0, quantidade: 1, valor_unitario: 0, pago: false } :
      { tipo: "Venda de Grãos", descricao: "", data: "", valor_total: 0, quantidade: 0, preco_unitario: 0, recebido: false }),
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const inp = "w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary";

  const calcTotal = (q, u) => {
    const t = (q || 0) * (u || 0);
    if (tipo === "despesa") set("valor_total", t);
    else set("valor_total", t);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">{item ? "Editar" : "Nova"} {tipo === "despesa" ? "Despesa" : "Receita"}</h2>
          <button onClick={onClose}><X size={18} className="text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div><label className="text-xs text-muted-foreground">Safra</label>
            <select className={inp} value={form.safra_id} onChange={e => {
              const s = safras.find(s => s.id === e.target.value);
              set("safra_id", e.target.value); set("safra_nome", s?.nome || "");
              set("fazenda_id", s?.fazenda_id || ""); set("fazenda_nome", s?.fazenda_nome || "");
            }}>
              {safras.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
          </div>
          {tipo === "despesa" ? (
            <div><label className="text-xs text-muted-foreground">Categoria</label>
              <select className={inp} value={form.categoria} onChange={e => set("categoria", e.target.value)}>
                {CATEGORIAS_DESPESA.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          ) : (
            <div><label className="text-xs text-muted-foreground">Tipo</label>
              <select className={inp} value={form.tipo} onChange={e => set("tipo", e.target.value)}>
                {["Venda de Grãos","Venda de Subproduto","Arrendamento Recebido","Prêmio/Bonificação","Seguro Recebido","Outro"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          )}
          <div><label className="text-xs text-muted-foreground">Descrição *</label><input className={inp} value={form.descricao} onChange={e => set("descricao", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-muted-foreground">Data *</label><input type="date" className={inp} value={form.data} onChange={e => set("data", e.target.value)} /></div>
            <div><label className="text-xs text-muted-foreground">{tipo === "despesa" ? "Fornecedor" : "Comprador"}</label>
              <input className={inp} value={form[tipo === "despesa" ? "fornecedor" : "comprador"] || ""} onChange={e => set(tipo === "despesa" ? "fornecedor" : "comprador", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs text-muted-foreground">Qtd</label><input type="number" className={inp} value={form.quantidade || 0}
              onChange={e => { set("quantidade", +e.target.value); calcTotal(+e.target.value, tipo === "despesa" ? form.valor_unitario : form.preco_unitario); }} /></div>
            <div><label className="text-xs text-muted-foreground">Preço Unit. (R$)</label><input type="number" className={inp} value={tipo === "despesa" ? (form.valor_unitario || 0) : (form.preco_unitario || 0)}
              onChange={e => { const k = tipo === "despesa" ? "valor_unitario" : "preco_unitario"; set(k, +e.target.value); calcTotal(form.quantidade, +e.target.value); }} /></div>
            <div><label className="text-xs text-muted-foreground">Total (R$) *</label><input type="number" className={inp} value={form.valor_total} onChange={e => set("valor_total", +e.target.value)} /></div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={tipo === "despesa" ? form.pago : form.recebido}
              onChange={e => set(tipo === "despesa" ? "pago" : "recebido", e.target.checked)} className="accent-green-500" />
            <label className="text-sm text-foreground">{tipo === "despesa" ? "Pago" : "Recebido"}</label>
          </div>
          <button onClick={() => onSave(form)} className="w-full py-2.5 bg-green-600 hover:bg-green-500/10 text-white rounded-lg text-sm font-medium">Salvar</button>
        </div>
      </div>
    </div>
  );
}

export default function AgroDespesasReceitas() {
  const [sub, setSub] = useState("despesas");
  const [despesas, setDespesas] = useState([]);
  const [receitas, setReceitas] = useState([]);
  const [safras, setSafras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filtroSafra, setFiltroSafra] = useState("todas");

  const load = () => {
    setLoading(true);
    Promise.all([
      base44.entities.DespesaAgricola.list("-data"),
      base44.entities.ReceitaAgricola.list("-data"),
      base44.entities.Safra.list(),
    ]).then(([d, r, s]) => { setDespesas(d); setReceitas(r); setSafras(s); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const save = async (form) => {
    const entity = sub === "despesas" ? base44.entities.DespesaAgricola : base44.entities.ReceitaAgricola;
    if (editItem) await entity.update(editItem.id, form);
    else await entity.create(form);
    setModal(false); setEditItem(null); load();
  };
  const del = async (id) => {
    if (!confirm("Excluir?")) return;
    const entity = sub === "despesas" ? base44.entities.DespesaAgricola : base44.entities.ReceitaAgricola;
    await entity.delete(id); load();
  };

  const lista = sub === "despesas" ? despesas : receitas;
  const filtrada = filtroSafra === "todas" ? lista : lista.filter(i => i.safra_id === filtroSafra);
  const total = filtrada.reduce((s, i) => s + (i.valor_total || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <button onClick={() => setSub("despesas")} className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${sub === "despesas" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            <TrendingDown size={13} className="text-red-400" /> Despesas
          </button>
          <button onClick={() => setSub("receitas")} className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${sub === "receitas" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            <TrendingUp size={13} className="text-green-400" /> Receitas
          </button>
        </div>
        <select value={filtroSafra} onChange={e => setFiltroSafra(e.target.value)}
          className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground">
          <option value="todas">Todas as safras</option>
          {safras.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
        </select>
        <div className="ml-auto flex items-center gap-3">
          <div className="bg-muted rounded-lg px-3 py-2 text-sm">
            <span className="text-muted-foreground">Total: </span>
            <span className={`font-bold ${sub === "despesas" ? "text-red-400" : "text-green-400"}`}>{fmt(total)}</span>
          </div>
          <button onClick={() => { setEditItem(null); setModal(true); }} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-500/10 text-white rounded-lg text-sm font-medium">
            <Plus size={14} /> Novo
          </button>
        </div>
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-muted border-t-green-400 rounded-full animate-spin" /></div> : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/30">
              {["Data", sub === "despesas" ? "Categoria" : "Tipo", "Descrição", "Safra", sub === "despesas" ? "Fornecedor" : "Comprador", "Total", "Status", ""].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtrada.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-muted-foreground text-sm">Nenhum registro encontrado.</td></tr>}
              {filtrada.map(item => (
                <tr key={item.id} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{fmtDate(item.data)}</td>
                  <td className="px-4 py-3"><span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{item.categoria || item.tipo}</span></td>
                  <td className="px-4 py-3 font-medium text-foreground max-w-[180px] truncate">{item.descricao}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{item.safra_nome || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{item.fornecedor || item.comprador || "—"}</td>
                  <td className="px-4 py-3 font-bold whitespace-nowrap"><span className={sub === "despesas" ? "text-red-400" : "text-green-400"}>{fmt(item.valor_total)}</span></td>
                  <td className="px-4 py-3">
                    {(sub === "despesas" ? item.pago : item.recebido)
                      ? <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">✓ {sub === "despesas" ? "Pago" : "Recebido"}</span>
                      : <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">Pendente</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setEditItem(item); setModal(true); }} className="text-muted-foreground hover:text-foreground"><Edit2 size={13} /></button>
                      <button onClick={() => del(item.id)} className="text-red-400"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <ItemModal item={editItem} tipo={sub === "despesas" ? "despesa" : "receita"} safras={safras} onClose={() => { setModal(false); setEditItem(null); }} onSave={save} />
      )}
    </div>
  );
}