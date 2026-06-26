import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  FileText, CheckCircle2, XCircle, Clock, AlertCircle,
  TrendingUp, Activity, RefreshCw, Eye
} from "lucide-react";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const situacaoConfig = {
  Rascunho: { color: "text-muted-foreground", bg: "bg-muted", icon: Clock },
  Validando: { color: "text-blue-400", bg: "bg-blue-400/10", icon: RefreshCw },
  Autorizada: { color: "text-green-400", bg: "bg-green-400/10", icon: CheckCircle2 },
  Rejeitada: { color: "text-red-400", bg: "bg-red-400/10", icon: XCircle },
  Cancelada: { color: "text-red-400", bg: "bg-red-400/10", icon: XCircle },
  Inutilizada: { color: "text-yellow-400", bg: "bg-yellow-400/10", icon: AlertCircle },
  Denegada: { color: "text-yellow-400", bg: "bg-yellow-400/10", icon: AlertCircle },
};

export default function NFeDashboard({ onNew, onEdit }) {
  const [notas, setNotas] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [empresas, setEmpresas] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [filtroSituacao, setFiltroSituacao] = useState("Todos");
  const [filtroEmpresa, setFiltroEmpresa] = useState("Todos");
  const [selected, setSelected] = useState(new Set());

  const load = async () => {
    setLoading(true);
    const [ns, ls, emps] = await Promise.all([
      base44.entities.NotaFiscalEletronica.list("-data_emissao"),
      base44.entities.LogFiscal.list("-created_date", 50),
      base44.entities.EmpresaCliente.list(),
    ]);
    setNotas(ns);
    setLogs(ls);
    setEmpresas(emps);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = notas.filter(n => {
    if (filtroTipo !== "Todos" && n.tipo_doc !== filtroTipo) return false;
    if (filtroSituacao !== "Todos" && n.situacao !== filtroSituacao) return false;
    if (filtroEmpresa !== "Todos" && n.empresa_id !== filtroEmpresa) return false;
    return true;
  });

  const kpis = {
    total: notas.length,
    autorizadas: notas.filter(n => n.situacao === "Autorizada").length,
    rejeitadas: notas.filter(n => n.situacao === "Rejeitada").length,
    rascunhos: notas.filter(n => n.situacao === "Rascunho").length,
    valorTotal: notas.filter(n => n.situacao === "Autorizada").reduce((s, n) => s + (n.valor_total || 0), 0),
  };

  const handleCancelar = async (nota) => {
    const motivo = prompt("Informe o motivo do cancelamento (min. 15 caracteres):");
    if (!motivo || motivo.length < 15) { alert("Motivo inválido (mínimo 15 caracteres)."); return; }
    await base44.entities.NotaFiscalEletronica.update(nota.id, {
      situacao: "Cancelada",
      justificativa_cancelamento: motivo,
    });
    await base44.entities.LogFiscal.create({
      empresa_id: nota.empresa_id,
      nota_id: nota.id,
      tipo_doc: nota.tipo_doc,
      numero: nota.numero,
      acao: "Cancelamento",
      status: "Sucesso",
      mensagem: `Nota cancelada: ${motivo}`,
      ambiente: nota.ambiente,
    });
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir esta nota?")) return;
    await base44.entities.NotaFiscalEletronica.delete(id);
    load();
  };

  const handleDeleteBatch = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Excluir ${selected.size} nota(s) selecionada(s)?`)) return;
    for (const id of selected) {
      await base44.entities.NotaFiscalEletronica.delete(id);
    }
    setSelected(new Set());
    load();
  };

  const toggleSelect = (id) => {
    const newSet = new Set(selected);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelected(newSet);
  };

  const getEmpresaNome = (id) => empresas.find(e => e.id === id)?.razao_social || "—";

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total de Notas", value: kpis.total, color: "text-foreground", icon: FileText },
          { label: "Autorizadas", value: kpis.autorizadas, color: "text-green-400", icon: CheckCircle2 },
          { label: "Rejeitadas", value: kpis.rejeitadas, color: "text-red-400", icon: XCircle },
          { label: "Rascunhos", value: kpis.rascunhos, color: "text-muted-foreground", icon: Clock },
          { label: "Valor Autorizado", value: fmt(kpis.valorTotal), color: "text-primary", icon: TrendingUp },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-card border border-border rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Icon size={13} className={k.color} />
                <p className="text-xs text-muted-foreground">{k.label}</p>
              </div>
              <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
            </div>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <select value={filtroEmpresa} onChange={e => setFiltroEmpresa(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none">
          <option value="Todos">Todas as Empresas</option>
          {empresas.map(e => <option key={e.id} value={e.id}>{e.razao_social}</option>)}
        </select>
        {["Todos", "NF-e", "NFS-e", "CT-e", "MDF-e"].map(t => (
          <button key={t} onClick={() => setFiltroTipo(t)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all
 ${filtroTipo === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
        <span className="text-xs text-muted-foreground">|</span>
        {["Todos", "Rascunho", "Autorizada", "Rejeitada", "Cancelada"].map(s => (
          <button key={s} onClick={() => setFiltroSituacao(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all
 ${filtroSituacao === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            {s}
          </button>
        ))}
        <button onClick={load} className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <RefreshCw size={11} /> Atualizar
        </button>
      </div>

      {/* Ações em Lote */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between bg-muted/30 border border-border rounded-xl p-3">
          <span className="text-sm text-foreground font-medium">{selected.size} nota(s) selecionada(s)</span>
          <button 
            onClick={handleDeleteBatch} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10/20 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/10/30 transition-colors"
          >
            Excluir Selecionadas
          </button>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-xs text-muted-foreground px-4 py-3 w-8">
                  <input 
                    type="checkbox" 
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={() => {
                      if (selected.size === filtered.length) setSelected(new Set());
                      else setSelected(new Set(filtered.map(n => n.id)));
                    }}
                    className="cursor-pointer" 
                  />
                </th>
                {["Tipo", "Nº/Série", "Destinatário", "Emissão", "Valor Total", "Ambiente", "Situação", "Ações"].map(h => (
                  <th key={h} className={`text-xs text-muted-foreground px-4 py-3 ${h === "Valor Total" || h === "Ações" ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10"><div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">
                  <FileText size={24} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Nenhuma nota encontrada</p>
                </td></tr>
              ) : filtered.map(n => {
                const s = situacaoConfig[n.situacao] || situacaoConfig.Rascunho;
                const SIcon = s.icon;
                return (
                  <tr key={n.id} className={`border-b border-border/50 transition-colors ${selected.has(n.id) ? "bg-primary/5" : "hover:bg-muted/20"}`}>
                    <td className="px-4 py-3">
                      <input 
                        type="checkbox" 
                        checked={selected.has(n.id)} 
                        onChange={() => toggleSelect(n.id)} 
                        className="cursor-pointer" 
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{n.tipo_doc}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-mono text-foreground">{n.numero ? `Nº ${n.numero}` : "—"}{n.serie ? ` /S${n.serie}` : ""}</p>
                      <p className="text-xs text-muted-foreground">{getEmpresaNome(n.empresa_id)}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{n.destinatario_nome || "—"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{n.data_emissao || "—"}</td>
                    <td className="px-4 py-3 text-sm font-bold text-foreground text-right">{fmt(n.valor_total)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${n.ambiente === "Produção" ? "text-green-400 bg-green-400/10" : "text-yellow-400 bg-yellow-400/10"}`}>
                        {n.ambiente || "Homologação"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${s.bg} ${s.color}`}>
                        <SIcon size={10} /> {n.situacao}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => onEdit && onEdit(n)} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted">Editar</button>
                        {n.situacao === "Autorizada" && (
                          <>
                            {n.danfe_url && (
                              <a href={n.danfe_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline px-2 py-1 rounded hover:bg-blue-400/10">DANFE</a>
                            )}
                            {n.xml_url && (
                              <a href={n.xml_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline px-2 py-1 rounded hover:bg-blue-400/10">XML</a>
                            )}
                            <button onClick={() => handleCancelar(n)} className="text-xs text-red-400 hover:underline px-2 py-1 rounded hover:bg-red-400/10">Cancelar</button>
                          </>
                        )}
                        <button onClick={() => handleDelete(n.id)} className="text-xs text-red-400 hover:underline px-2 py-1 rounded hover:bg-red-400/10">Excluir</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Logs Fiscais */}
      {logs.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Activity size={14} className="text-primary" /> Logs Fiscais Recentes
          </h3>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Data", "Documento", "Ação", "Código", "Status", "Mensagem"].map(h => (
                      <th key={h} className="text-left text-xs text-muted-foreground px-4 py-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.slice(0, 10).map(log => (
                    <tr key={log.id} className="border-b border-border/40 hover:bg-muted/20">
                      <td className="px-4 py-2 text-xs text-muted-foreground">{log.created_date ? new Date(log.created_date).toLocaleString("pt-BR") : "—"}</td>
                      <td className="px-4 py-2 text-xs font-mono text-foreground">{log.tipo_doc} {log.numero || ""}</td>
                      <td className="px-4 py-2 text-xs text-foreground">{log.acao}</td>
                      <td className="px-4 py-2 text-xs font-mono text-muted-foreground">{log.codigo_retorno || "—"}</td>
                      <td className="px-4 py-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium
 ${log.status === "Sucesso" ? "text-green-400 bg-green-400/10" : log.status === "Erro" ? "text-red-400 bg-red-400/10" : "text-yellow-400 bg-yellow-400/10"}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground truncate max-w-48">{log.mensagem || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}