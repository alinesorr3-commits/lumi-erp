import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { FileText, RefreshCw, CheckCircle2, XCircle, Clock, AlertCircle, Trash2 } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const fmtDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";

const situacaoConfig = {
  Rascunho: { color: "text-muted-foreground", bg: "bg-muted", icon: Clock },
  Validando: { color: "text-blue-400", bg: "bg-blue-400/10", icon: RefreshCw },
  Autorizada: { color: "text-green-400", bg: "bg-green-400/10", icon: CheckCircle2 },
  Rejeitada: { color: "text-red-400", bg: "bg-red-400/10", icon: XCircle },
  Cancelada: { color: "text-red-400", bg: "bg-red-400/10", icon: XCircle },
  Devolvida: { color: "text-orange-400", bg: "bg-orange-400/10", icon: AlertCircle },
  Inutilizada: { color: "text-yellow-400", bg: "bg-yellow-400/10", icon: AlertCircle },
};

export default function NFeListaSaida({ onNew, onEdit }) {
  const [notas, setNotas] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroSituacao, setFiltroSituacao] = useState("Todos");
  const [selected, setSelected] = useState(new Set());

  const load = async () => {
    setLoading(true);
    const [ns, emps] = await Promise.all([
      base44.entities.NotaFiscalEletronica.filter({ tipo_operacao: { $ne: "Entrada" } }, "-data_emissao"),
      base44.entities.EmpresaCliente.list(),
    ]);
    setNotas(ns);
    setEmpresas(emps);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getEmpresaNome = (id) => empresas.find(e => e.id === id)?.razao_social || "—";

  const filtered = notas.filter(n => filtroSituacao === "Todos" || n.situacao === filtroSituacao);

  const handleDelete = async (id) => {
    if (!confirm("Excluir esta nota fiscal?")) return;
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

  const handleCancelar = async (nota) => {
    const motivo = prompt("Informe o motivo do cancelamento (mínimo 15 caracteres):");
    if (!motivo || motivo.length < 15) {
      alert("Motivo inválido — mínimo 15 caracteres.");
      return;
    }
    await base44.entities.NotaFiscalEletronica.update(nota.id, {
      situacao: "Cancelada",
      justificativa_cancelamento: motivo,
    });
    load();
  };

  const handleDevolucao = async (nota) => {
    if (!confirm(`Registrar devolução da NF-e ${nota.numero || "S/N"}? Uma nota de devolução será criada automaticamente.`)) return;
    await base44.entities.NotaFiscalEletronica.update(nota.id, { situacao: "Devolvida" });
    await base44.entities.NotaFiscalEletronica.create({
      empresa_id: nota.empresa_id,
      tipo_doc: nota.tipo_doc,
      tipo_operacao: "Saída",
      numero: "",
      serie: nota.serie,
      data_emissao: new Date().toISOString().slice(0, 10),
      natureza_operacao: "Devolução de Mercadorias",
      finalidade: "4-Devolução/Retorno",
      destinatario_nome: nota.destinatario_nome,
      destinatario_cnpj_cpf: nota.destinatario_cnpj_cpf,
      destinatario_uf: nota.destinatario_uf,
      itens: nota.itens || [],
      valor_produtos: nota.valor_produtos || 0,
      valor_total: nota.valor_total || 0,
      valor_icms: nota.valor_icms || 0,
      valor_pis: nota.valor_pis || 0,
      valor_cofins: nota.valor_cofins || 0,
      valor_ipi: nota.valor_ipi || 0,
      situacao: "Rascunho",
      ambiente: nota.ambiente,
      informacoes_adicionais: `Devolução ref. NF-e nº ${nota.numero || "S/N"} — Chave: ${nota.chave_acesso || "N/A"}`,
    });
    alert("Nota de devolução criada como rascunho. Edite e transmita quando estiver pronta.");
    load();
  };

  const toggleSelect = (id) => {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id); else s.add(id);
    setSelected(s);
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        {["Todos", "Rascunho", "Autorizada", "Cancelada", "Devolvida", "Rejeitada"].map(s => (
          <button key={s} onClick={() => setFiltroSituacao(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${filtroSituacao === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            {s}
          </button>
        ))}
        <button onClick={load} className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <RefreshCw size={11} /> Atualizar
        </button>
      </div>

      {/* Ações em lote */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between bg-muted/30 border border-border rounded-xl p-3">
          <span className="text-sm text-foreground font-medium">{selected.size} nota(s) selecionada(s)</span>
          <button onClick={handleDeleteBatch}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-400/10 text-red-400 rounded-lg text-xs font-medium hover:bg-red-400/20">
            <Trash2 size={12} /> Excluir Selecionadas
          </button>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 w-8">
                  <input type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={() => {
                      if (selected.size === filtered.length) setSelected(new Set());
                      else setSelected(new Set(filtered.map(n => n.id)));
                    }}
                    className="cursor-pointer" />
                </th>
                {["Tipo", "Nº/Série", "Destinatário", "Emissão", "Valor Total", "Situação", "Ações"].map(h => (
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
                      <input type="checkbox" checked={selected.has(n.id)} onChange={() => toggleSelect(n.id)} className="cursor-pointer" />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{n.tipo_doc}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-mono text-foreground">{n.numero ? `Nº ${n.numero}` : "—"}{n.serie ? ` /S${n.serie}` : ""}</p>
                      <p className="text-xs text-muted-foreground">{getEmpresaNome(n.empresa_id)}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{n.destinatario_nome || "—"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{fmtDate(n.data_emissao)}</td>
                    <td className="px-4 py-3 text-sm font-bold text-foreground text-right">{fmt(n.valor_total)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${s.bg} ${s.color}`}>
                        <SIcon size={10} /> {n.situacao}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <button onClick={() => onEdit && onEdit(n)} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted">Editar</button>
                        {n.situacao === "Autorizada" && (
                          <>
                            {n.danfe_url && <a href={n.danfe_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline px-2 py-1">DANFE</a>}
                            {n.xml_url && <a href={n.xml_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline px-2 py-1">XML</a>}
                            <button onClick={() => handleCancelar(n)} className="text-xs text-yellow-400 hover:underline px-2 py-1">Cancelar</button>
                            <button onClick={() => handleDevolucao(n)} className="text-xs text-orange-400 hover:underline px-2 py-1">Devolução</button>
                          </>
                        )}
                        <button onClick={() => handleDelete(n.id)} className="text-xs text-red-400 hover:underline px-2 py-1">Excluir</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}