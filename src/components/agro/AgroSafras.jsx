import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { fmt, fmtNum, fmtDate, STATUS_SAFRA, CULTURAS, calcSafra } from "./AgroUtils";
import { Plus, Edit2, Trash2, X, Wheat, TrendingUp, TrendingDown } from "lucide-react";

function SafraModal({ item, fazendas, talhoes, onClose, onSave }) {
  const [form, setForm] = useState(item || {
    nome: "", cultura: "Soja", fazenda_id: fazendas[0]?.id || "", fazenda_nome: fazendas[0]?.nome || "",
    area_plantada: 0, ano: new Date().getFullYear().toString(), status: "Planejamento",
    produtividade_prev: 0, preco_venda: 0, producao_total: 0, receita_bruta: 0
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const inp = "w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary";
  const fazTalhoes = talhoes.filter(t => t.fazenda_id === form.fazenda_id);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">{item ? "Editar Safra" : "Nova Safra"}</h2>
          <button onClick={onClose}><X size={18} className="text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-muted-foreground">Nome da Safra *</label><input className={inp} value={form.nome} onChange={e => set("nome", e.target.value)} placeholder="Ex: Soja 24/25" /></div>
            <div><label className="text-xs text-muted-foreground">Ano/Período</label><input className={inp} value={form.ano} onChange={e => set("ano", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-muted-foreground">Cultura *</label>
              <select className={inp} value={form.cultura} onChange={e => set("cultura", e.target.value)}>
                {CULTURAS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="text-xs text-muted-foreground">Status</label>
              <select className={inp} value={form.status} onChange={e => set("status", e.target.value)}>
                {["Planejamento","Plantio","Desenvolvimento","Colheita","Concluída","Cancelada"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div><label className="text-xs text-muted-foreground">Fazenda *</label>
            <select className={inp} value={form.fazenda_id} onChange={e => {
              const f = fazendas.find(f => f.id === e.target.value);
              set("fazenda_id", e.target.value); set("fazenda_nome", f?.nome || ""); set("talhao_id", ""); set("talhao_nome", "");
            }}>
              {fazendas.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-muted-foreground">Talhão</label>
              <select className={inp} value={form.talhao_id || ""} onChange={e => {
                const t = talhoes.find(t => t.id === e.target.value);
                set("talhao_id", e.target.value); set("talhao_nome", t?.nome || "");
                if (t?.area) set("area_plantada", t.area);
              }}>
                <option value="">Selecionar...</option>
                {fazTalhoes.map(t => <option key={t.id} value={t.id}>{t.nome} ({fmtNum(t.area)} ha)</option>)}
              </select>
            </div>
            <div><label className="text-xs text-muted-foreground">Área Plantada (ha) *</label><input type="number" className={inp} value={form.area_plantada} onChange={e => set("area_plantada", +e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-muted-foreground">Data de Plantio</label><input type="date" className={inp} value={form.data_plantio || ""} onChange={e => set("data_plantio", e.target.value)} /></div>
            <div><label className="text-xs text-muted-foreground">Previsão Colheita</label><input type="date" className={inp} value={form.data_colheita_prev || ""} onChange={e => set("data_colheita_prev", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs text-muted-foreground">Prod. Prevista (sc/ha)</label><input type="number" className={inp} value={form.produtividade_prev} onChange={e => set("produtividade_prev", +e.target.value)} /></div>
            <div><label className="text-xs text-muted-foreground">Prod. Real (sc/ha)</label><input type="number" className={inp} value={form.produtividade_real || 0} onChange={e => set("produtividade_real", +e.target.value)} /></div>
            <div><label className="text-xs text-muted-foreground">Preço Venda (R$/sc)</label><input type="number" className={inp} value={form.preco_venda} onChange={e => set("preco_venda", +e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-muted-foreground">Produção Total (sc)</label><input type="number" className={inp} value={form.producao_total} onChange={e => set("producao_total", +e.target.value)} /></div>
            <div><label className="text-xs text-muted-foreground">Data Colheita Real</label><input type="date" className={inp} value={form.data_colheita_real || ""} onChange={e => set("data_colheita_real", e.target.value)} /></div>
          </div>
          <div><label className="text-xs text-muted-foreground">Observações</label><textarea className={inp} rows={2} value={form.observacoes || ""} onChange={e => set("observacoes", e.target.value)} /></div>
          <button onClick={() => onSave(form)} className="w-full py-2.5 bg-green-600 hover:bg-green-500/10 text-white rounded-lg text-sm font-medium transition-colors">Salvar Safra</button>
        </div>
      </div>
    </div>
  );
}

export default function AgroSafras() {
  const [safras, setSafras] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [receitas, setReceitas] = useState([]);
  const [fazendas, setFazendas] = useState([]);
  const [talhoes, setTalhoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState("todos");

  const load = () => {
    setLoading(true);
    Promise.all([
      base44.entities.Safra.list("-created_date"),
      base44.entities.DespesaAgricola.list(),
      base44.entities.ReceitaAgricola.list(),
      base44.entities.Fazenda.list(),
      base44.entities.Talhao.list(),
    ]).then(([s, d, r, f, t]) => { setSafras(s); setDespesas(d); setReceitas(r); setFazendas(f); setTalhoes(t); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const save = async (form) => {
    if (editItem) await base44.entities.Safra.update(editItem.id, form);
    else await base44.entities.Safra.create(form);
    setModal(false); setEditItem(null); load();
  };
  const del = async (id) => { if (confirm("Excluir safra?")) { await base44.entities.Safra.delete(id); load(); } };

  const filtered = filtroStatus === "todos" ? safras : safras.filter(s => s.status === filtroStatus);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 p-1 bg-muted rounded-lg overflow-x-auto">
          {["todos", "Planejamento", "Plantio", "Desenvolvimento", "Colheita", "Concluída"].map(s => (
            <button key={s} onClick={() => setFiltroStatus(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${filtroStatus === s ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {s === "todos" ? "Todas" : s}
            </button>
          ))}
        </div>
        <button onClick={() => { setEditItem(null); setModal(true); }} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-500/10 text-white rounded-lg text-sm font-medium ml-auto">
          <Plus size={14} /> Nova Safra
        </button>
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-muted border-t-green-400 rounded-full animate-spin" /></div> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.length === 0 && <p className="text-muted-foreground text-sm col-span-3 text-center py-8">Nenhuma safra encontrada.</p>}
          {filtered.map(s => {
            const st = STATUS_SAFRA[s.status] || STATUS_SAFRA.Planejamento;
            const calc = calcSafra(s, despesas, receitas);
            return (
              <div key={s.id} className="bg-card border border-border rounded-xl p-4 space-y-3 hover:border-green-500/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Wheat size={14} className="text-yellow-400" />
                      <p className="font-semibold text-foreground">{s.nome}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{s.cultura} · {s.fazenda_nome}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${st.bg} ${st.color}`}>{s.status}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-muted rounded-lg p-2 text-center">
                    <p className="text-muted-foreground">Área</p>
                    <p className="font-bold text-blue-400">{fmtNum(s.area_plantada)} ha</p>
                  </div>
                  <div className="bg-muted rounded-lg p-2 text-center">
                    <p className="text-muted-foreground">Produtiv.</p>
                    <p className="font-bold text-yellow-400">{fmtNum(s.produtividade_real || s.produtividade_prev)} sc/ha</p>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Receita Bruta</span><span className="text-green-400 font-bold">{fmt(calc.receitaBruta)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Custo Total</span><span className="text-red-400 font-bold">{fmt(calc.custoTotal)}</span></div>
                  <div className="flex justify-between border-t border-border pt-1 mt-1"><span className="text-foreground font-semibold">Lucro</span><span className={`font-bold ${calc.lucro >= 0 ? "text-green-400" : "text-red-400"}`}>{fmt(calc.lucro)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Margem</span><span className={calc.margem >= 20 ? "text-green-400" : "text-yellow-400"}>{calc.margem.toFixed(1)}%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Custo/ha</span><span className="text-muted-foreground">{fmt(calc.custoPorHa)}</span></div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
                  <span>Plantio: {fmtDate(s.data_plantio)}</span>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditItem(s); setModal(true); }} className="text-muted-foreground hover:text-foreground"><Edit2 size={13} /></button>
                    <button onClick={() => del(s.id)} className="text-red-400"><Trash2 size={13} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && <SafraModal item={editItem} fazendas={fazendas} talhoes={talhoes} onClose={() => { setModal(false); setEditItem(null); }} onSave={save} />}
    </div>
  );
}