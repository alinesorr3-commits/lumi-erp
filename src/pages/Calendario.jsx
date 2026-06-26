import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Calendar, CheckCircle2, Clock, AlertTriangle, Trash2, Pencil, X, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const PRIORIDADE_CONFIG = {
  "Baixa":   { color: "text-muted-foreground", bg: "bg-muted",            border: "border-muted-foreground/20" },
  "Média":   { color: "text-blue-400",          bg: "bg-blue-400/10",      border: "border-blue-400/30" },
  "Alta":    { color: "text-yellow-400",         bg: "bg-yellow-400/10",    border: "border-yellow-400/30" },
  "Urgente": { color: "text-red-400",            bg: "bg-red-400/10",       border: "border-red-400/30" },
};

const STATUS_CONFIG = {
  "pendente":     { label: "Pendente",      color: "text-yellow-400",       bg: "bg-yellow-400/10" },
  "em_andamento": { label: "Em Andamento",  color: "text-blue-400",         bg: "bg-blue-400/10" },
  "concluida":    { label: "Concluída",     color: "text-green-400",      bg: "bg-green-400/10" },
  "cancelada":    { label: "Cancelada",     color: "text-muted-foreground", bg: "bg-muted" },
};

const TIPOS = ["Geral", "Financeiro", "Fiscal", "Contrato", "Certidão", "Imposto", "Reunião", "Outro"];
const HOJE = new Date().toISOString().split("T")[0];

function diasRestantes(data) {
  if (!data) return null;
  return Math.ceil((new Date(data + "T00:00:00") - new Date()) / (1000 * 60 * 60 * 24));
}

function TarefaModal({ tarefa, onClose, onSave }) {
  const [form, setForm] = useState({
    titulo: tarefa?.titulo || "",
    descricao: tarefa?.descricao || "",
    data_vencimento: tarefa?.data_vencimento || HOJE,
    hora_vencimento: tarefa?.hora_vencimento || "",
    prioridade: tarefa?.prioridade || "Média",
    status: tarefa?.status || "pendente",
    tipo: tarefa?.tipo || "Geral",
    departamento: tarefa?.departamento || "",
    responsavel: tarefa?.responsavel || "",
    empresa: tarefa?.empresa || "",
    whatsapp_contato: tarefa?.whatsapp_contato || "",
    avisar_modulo: tarefa?.avisar_modulo || false,
    recorrente: tarefa?.recorrente || false,
    frequencia_recorrencia: tarefa?.frequencia_recorrencia || "mensal",
    descricao: tarefa?.descricao || "",
    lembrete_dias: tarefa?.lembrete_dias ?? 3,
    observacoes: tarefa?.observacoes || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        titulo: form.titulo,
        data_vencimento: form.data_vencimento,
        prioridade: form.prioridade,
        status: form.status,
        tipo: form.tipo,
        lembrete_dias: form.lembrete_dias,
        recorrente: form.recorrente,
        ...(form.hora_vencimento ? { hora_vencimento: form.hora_vencimento } : {}),
        ...(form.departamento ? { departamento: form.departamento } : {}),
        ...(form.responsavel ? { responsavel: form.responsavel } : {}),
        ...(form.empresa ? { empresa: form.empresa } : {}),
        ...(form.whatsapp_contato ? { whatsapp_contato: form.whatsapp_contato } : {}),
        avisar_modulo: form.avisar_modulo,
        ...(form.observacoes ? { observacoes: form.observacoes } : {}),
        ...(form.descricao ? { descricao: form.descricao } : {}),
        ...(form.recorrente && form.frequencia_recorrencia ? { frequencia_recorrencia: form.frequencia_recorrencia } : {}),
      };
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card">
          <h2 className="text-base font-semibold text-foreground">{tarefa ? "Editar Tarefa" : "Nova Tarefa"}</h2>
          <button onClick={onClose}><X size={18} className="text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Título *</label>
            <input required value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
              placeholder="Ex: Pagar DARF IRPJ"
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Vencimento *</label>
              <input required type="date" value={form.data_vencimento} onChange={e => setForm(f => ({ ...f, data_vencimento: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Hora</label>
              <input type="time" value={form.hora_vencimento} onChange={e => setForm(f => ({ ...f, hora_vencimento: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Prioridade</label>
              <select value={form.prioridade} onChange={e => setForm(f => ({ ...f, prioridade: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                {Object.keys(PRIORIDADE_CONFIG).map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Tipo</label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                {TIPOS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Alertar (dias antes)</label>
              <select value={form.lembrete_dias} onChange={e => setForm(f => ({ ...f, lembrete_dias: Number(e.target.value) }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                {[1, 3, 7, 15, 30].map(d => <option key={d} value={d}>{d} dias antes</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Departamento</label>
              <input value={form.departamento} onChange={e => setForm(f => ({ ...f, departamento: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Responsável</label>
              <input value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Empresa</label>
              <input value={form.empresa} onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Contato WhatsApp</label>
              <input value={form.whatsapp_contato} onChange={e => setForm(f => ({ ...f, whatsapp_contato: e.target.value }))}
                placeholder="Ex: 5511999999999"
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
          </div>

          <div className="flex flex-col gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <input type="checkbox" id="avisar_modulo" checked={form.avisar_modulo} onChange={e => setForm(f => ({ ...f, avisar_modulo: e.target.checked }))}
                className="cursor-pointer" />
              <label htmlFor="avisar_modulo" className="text-sm text-foreground cursor-pointer flex items-center gap-1.5">
                Avisar pessoa que possui o módulo ativo
              </label>
            </div>
            
            <div className="flex items-center gap-3">
              <input type="checkbox" id="recorrente" checked={form.recorrente} onChange={e => setForm(f => ({ ...f, recorrente: e.target.checked }))}
                className="cursor-pointer" />
              <label htmlFor="recorrente" className="text-sm text-foreground cursor-pointer flex items-center gap-1.5">
                <RefreshCw size={13} /> Tarefa Recorrente
              </label>
              {form.recorrente && (
                <select value={form.frequencia_recorrencia} onChange={e => setForm(f => ({ ...f, frequencia_recorrencia: e.target.value }))}
                  className="ml-auto bg-muted border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none">
                  {["diária", "semanal", "quinzenal", "mensal", "anual"].map(fr => <option key={fr} value={fr}>{fr}</option>)}
                </select>
              )}
            </div>
          </div>

          <div className="hidden">
            <input type="checkbox" id="recorrente" checked={form.recorrente} onChange={e => setForm(f => ({ ...f, recorrente: e.target.checked }))}
              className="cursor-pointer" />
            <label htmlFor="recorrente" className="text-sm text-foreground cursor-pointer flex items-center gap-1.5">
              <RefreshCw size={13} /> Tarefa Recorrente
            </label>
            {form.recorrente && (
              <select value={form.frequencia_recorrencia} onChange={e => setForm(f => ({ ...f, frequencia_recorrencia: e.target.value }))}
                className="ml-auto bg-muted border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none">
                {["diária", "semanal", "quinzenal", "mensal", "anual"].map(fr => <option key={fr} value={fr}>{fr}</option>)}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">Descrição / Observações</label>
            <textarea rows={2} value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary resize-none" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-muted text-muted-foreground rounded-lg text-sm">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm disabled:opacity-50">
              {saving ? "Salvando..." : tarefa ? "Salvar" : "Criar Tarefa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Calendario() {
  const [tarefas, setTarefas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroPrioridade, setFiltroPrioridade] = useState("todas");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.Tarefa.list("data_vencimento");
    setTarefas(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (data) => {
    try {
      if (editItem) {
        await base44.entities.Tarefa.update(editItem.id, data);
      } else {
        await base44.entities.Tarefa.create(data);
      }
      setModal(false);
      setEditItem(null);
      toast({ title: "✓ Salvo", description: "Tarefa salva com sucesso" });
      load();
    } catch (err) {
      console.error("Erro ao salvar tarefa:", err);
      toast({ title: "Erro ao salvar", description: err?.message || "Tente novamente.", variant: "destructive" });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir esta tarefa?")) return;
    await base44.entities.Tarefa.delete(id);
    load();
  };

  const handleConcluir = async (tarefa) => {
    await base44.entities.Tarefa.update(tarefa.id, { status: "concluida" });
    load();
  };

  const tarefasFiltradas = tarefas.filter(t => {
    if (filtroStatus !== "todos" && t.status !== filtroStatus) return false;
    if (filtroPrioridade !== "todas" && t.prioridade !== filtroPrioridade) return false;
    if (filtroTipo !== "todos" && t.tipo !== filtroTipo) return false;
    return true;
  });

  // Alertas: vencendo em <= lembrete_dias
  const alertas = tarefas.filter(t => {
    if (t.status === "concluida" || t.status === "cancelada") return false;
    const dias = diasRestantes(t.data_vencimento);
    return dias !== null && dias <= (t.lembrete_dias ?? 3) && dias >= 0;
  });

  const vencidas = tarefas.filter(t => {
    if (t.status === "concluida" || t.status === "cancelada") return false;
    const dias = diasRestantes(t.data_vencimento);
    return dias !== null && dias < 0;
  });

  // Agrupa por data
  const grupos = {};
  tarefasFiltradas.forEach(t => {
    const data = t.data_vencimento || "Sem data";
    if (!grupos[data]) grupos[data] = [];
    grupos[data].push(t);
  });
  const datasOrdenadas = Object.keys(grupos).sort();

  const fmtData = (d) => {
    if (d === "Sem data") return "Sem data";
    const dt = new Date(d + "T00:00:00");
    return dt.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground flex items-center gap-2">
            <Calendar size={24} className="text-primary" /> Calendário de Tarefas
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{tarefas.filter(t => t.status !== "concluida" && t.status !== "cancelada").length} tarefas ativas</p>
        </div>
        <button onClick={() => { setEditItem(null); setModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus size={16} /> Nova Tarefa
        </button>
      </div>

      {/* Alertas de vencimento */}
      {(alertas.length > 0 || vencidas.length > 0) && (
        <div className="mb-5 space-y-2">
          {vencidas.length > 0 && (
            <div className="bg-red-500/10/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
              <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">
                <strong>{vencidas.length} tarefa(s) vencida(s):</strong>{" "}
                {vencidas.slice(0, 3).map(t => t.titulo).join(", ")}{vencidas.length > 3 ? "..." : ""}
              </p>
            </div>
          )}
          {alertas.length > 0 && (
            <div className="bg-yellow-500/10/10 border border-yellow-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
              <Clock size={16} className="text-yellow-400 flex-shrink-0" />
              <p className="text-sm text-yellow-400">
                <strong>{alertas.length} tarefa(s) vencendo em breve:</strong>{" "}
                {alertas.slice(0, 3).map(t => `${t.titulo} (${diasRestantes(t.data_vencimento)}d)`).join(", ")}
              </p>
            </div>
          )}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total", val: tarefas.length, color: "text-foreground" },
          { label: "Pendentes", val: tarefas.filter(t => t.status === "pendente").length, color: "text-yellow-400" },
          { label: "Urgentes", val: tarefas.filter(t => t.prioridade === "Urgente" && t.status !== "concluida").length, color: "text-red-400" },
          { label: "Concluídas", val: tarefas.filter(t => t.status === "concluida").length, color: "text-green-400" },
        ].map(k => (
          <div key={k.label} className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {[["todos", "Todos"], ["pendente", "Pendentes"], ["em_andamento", "Em Andamento"], ["concluida", "Concluídas"]].map(([k, l]) => (
            <button key={k} onClick={() => setFiltroStatus(k)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filtroStatus === k ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {l}
            </button>
          ))}
        </div>
        <select value={filtroPrioridade} onChange={e => setFiltroPrioridade(e.target.value)}
          className="bg-muted border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none">
          <option value="todas">Todas as prioridades</option>
          {Object.keys(PRIORIDADE_CONFIG).map(p => <option key={p}>{p}</option>)}
        </select>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
          className="bg-muted border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none">
          <option value="todos">Todos os tipos</option>
          {TIPOS.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {/* Lista por data */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
      ) : tarefasFiltradas.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <Calendar size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground text-sm">Nenhuma tarefa encontrada</p>
          <button onClick={() => { setEditItem(null); setModal(true); }} className="mt-3 text-primary text-sm hover:underline">Criar primeira tarefa</button>
        </div>
      ) : (
        <div className="space-y-5">
          {datasOrdenadas.map(data => {
            const isHoje = data === HOJE;
            const isPast = data < HOJE && data !== "Sem data";
            return (
              <div key={data}>
                <div className={`flex items-center gap-3 mb-2`}>
                  <div className={`h-px flex-1 ${isPast ? "bg-red-500/10/20" : isHoje ? "bg-primary/30" : "bg-border"}`} />
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${isPast ? "bg-red-500/10/10 text-red-400" : isHoje ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
                    {isHoje ? "🔴 HOJE" : fmtData(data)}
                  </span>
                  <div className={`h-px flex-1 ${isPast ? "bg-red-500/10/20" : isHoje ? "bg-primary/30" : "bg-border"}`} />
                </div>
                <div className="space-y-2">
                  {grupos[data].map(tarefa => {
                    const dias = diasRestantes(tarefa.data_vencimento);
                    const p = PRIORIDADE_CONFIG[tarefa.prioridade] || PRIORIDADE_CONFIG["Média"];
                    const s = STATUS_CONFIG[tarefa.status] || STATUS_CONFIG.pendente;
                    return (
                      <div key={tarefa.id} className={`bg-card border rounded-xl p-4 flex items-start gap-3 ${tarefa.status === "concluida" ? "opacity-60" : ""} ${p.border} border-l-4`}>
                        <button onClick={() => tarefa.status !== "concluida" && handleConcluir(tarefa)}
                          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
 ${tarefa.status === "concluida" ? "bg-green-400 border-green-400" : "border-border hover:border-primary"}`}>
                          {tarefa.status === "concluida" && <CheckCircle2 size={12} className="text-white" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`text-sm font-medium ${tarefa.status === "concluida" ? "line-through text-muted-foreground" : "text-foreground"}`}>{tarefa.titulo}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${p.bg} ${p.color}`}>{tarefa.prioridade}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${s.bg} ${s.color}`}>{s.label}</span>
                            {tarefa.recorrente && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"><RefreshCw size={9} className="inline mr-0.5" />{tarefa.frequencia_recorrencia}</span>}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                            {tarefa.tipo && <span className="bg-muted px-1.5 py-0.5 rounded">{tarefa.tipo}</span>}
                            {tarefa.responsavel && <span>👤 {tarefa.responsavel}</span>}
                            {tarefa.departamento && <span>🏢 {tarefa.departamento}</span>}
                            {tarefa.hora_vencimento && <span>🕐 {tarefa.hora_vencimento}</span>}
                            {dias !== null && dias >= 0 && dias <= 7 && tarefa.status !== "concluida" && (
                              <span className={`font-medium ${dias === 0 ? "text-red-400" : dias <= 3 ? "text-yellow-400" : "text-yellow-400"}`}>
                                ⚠ {dias === 0 ? "Vence hoje" : `${dias}d restantes`}
                              </span>
                            )}
                          </div>
                          {tarefa.observacoes && <p className="text-xs text-muted-foreground mt-1 truncate">{tarefa.observacoes}</p>}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => { setEditItem(tarefa); setModal(true); }} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => handleDelete(tarefa.id)} className="p-1.5 text-muted-foreground hover:text-red-400 rounded-lg hover:bg-muted">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && <TarefaModal tarefa={editItem} onClose={() => { setModal(false); setEditItem(null); }} onSave={handleSave} />}
    </div>
  );
}