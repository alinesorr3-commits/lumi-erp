import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { FileText, Filter, Plus } from "lucide-react";
import NFeEmissao from "@/components/nfe/NFeEmissao";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const fmtDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "-";

const statusConfig = {
  Rascunho: { label: "Rascunho", color: "text-yellow-400", bg: "bg-yellow-400/10" },
  Autorizada: { label: "Autorizada", color: "text-green-400", bg: "bg-green-400/10" },
  Cancelada: { label: "Cancelada", color: "text-red-400", bg: "bg-red-400/10" },
  Rejeitada: { label: "Rejeitada", color: "text-yellow-400", bg: "bg-yellow-400/10" },
};

export default function NotasFiscais() {
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("todos");
  const [emissaoOpen, setEmissaoOpen] = useState(false);
  const [editNota, setEditNota] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.NotaFiscalEletronica.filter({ tipo_operacao: { $ne: "Entrada" } }, "-data_emissao");
    setNotas(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm("Excluir esta nota fiscal?")) return;
    await base44.entities.NotaFiscalEletronica.delete(id);
    load();
  };

  const filtered = notas.filter(n => {
    if (filterStatus !== "todos" && n.situacao !== filterStatus) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-muted-foreground" />
          {["todos", "Rascunho", "Autorizada", "Cancelada"].map(t => (
            <button key={t} onClick={() => setFilterStatus(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all
 ${filterStatus === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
              {t === "todos" ? "Todos" : t}
            </button>
          ))}
        </div>
        <button onClick={() => { setEditNota(null); setEmissaoOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus size={16} /> Emitir NF-e
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
          : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText size={28} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma nota fiscal registrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs text-muted-foreground px-4 py-3">Número/Série</th>
                    <th className="text-left text-xs text-muted-foreground px-4 py-3">Tipo Doc</th>
                    <th className="text-left text-xs text-muted-foreground px-4 py-3">Destinatário</th>
                    <th className="text-left text-xs text-muted-foreground px-4 py-3">Emissão</th>
                    <th className="text-right text-xs text-muted-foreground px-4 py-3">Valor Total</th>
                    <th className="text-left text-xs text-muted-foreground px-4 py-3">Situação</th>
                    <th className="text-right text-xs text-muted-foreground px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(n => {
                    const s = statusConfig[n.situacao] || statusConfig.Rascunho;
                    return (
                      <tr key={n.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono text-sm text-foreground">{n.numero}/{n.serie}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full bg-blue-400/10 text-blue-400`}>
                            {n.tipo_doc}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">{n.destinatario_nome || "—"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{fmtDate(n.data_emissao)}</td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-green-400">{fmt(n.valor_total)}</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>{s.label}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleDelete(n.id)} className="text-xs text-red-400 hover:underline">Excluir</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {emissaoOpen && (
        <NFeEmissao
          nota={editNota}
          onClose={() => { setEmissaoOpen(false); setEditNota(null); }}
          onSaved={() => { setEmissaoOpen(false); setEditNota(null); load(); }}
        />
      )}
    </div>
  );
}