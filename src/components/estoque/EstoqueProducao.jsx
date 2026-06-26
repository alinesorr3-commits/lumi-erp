import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Pencil, Trash2, Zap, AlertCircle } from "lucide-react";
import FichaTecnicaModal from "./FichaTecnicaModal";
import OrdemProducaoModal from "./OrdemProducaoModal";
import MovimentacaoHistorico from "./MovimentacaoHistorico";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const fmtDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "-";

export default function EstoqueProducao({ refresh, onRefresh }) {
  const [subTab, setSubTab] = useState(0);
  const [fichas, setFichas] = useState([]);
  const [ordens, setOrdens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fichaModal, setFichaModal] = useState(false);
  const [ordemModal, setOrdemModal] = useState(false);
  const [editFicha, setEditFicha] = useState(null);
  const [editOrdem, setEditOrdem] = useState(null);
  const [histModal, setHistModal] = useState(false);
  const [selectedOrdem, setSelectedOrdem] = useState(null);

  const loadData = async () => {
    setLoading(true);
    const [f, o] = await Promise.all([
      base44.entities.FichaTecnica.list("-created_date"),
      base44.entities.OrdemProducao.list("-created_date"),
    ]);
    setFichas(f);
    setOrdens(o);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [refresh]);

  const handleSaveFicha = async (data) => {
    if (editFicha) {
      await base44.entities.FichaTecnica.update(editFicha.id, data);
    } else {
      await base44.entities.FichaTecnica.create(data);
    }
    setFichaModal(false);
    setEditFicha(null);
    loadData();
  };

  const handleSaveOrdem = async (data) => {
    if (editOrdem) {
      await base44.entities.OrdemProducao.update(editOrdem.id, data);
    } else {
      await base44.entities.OrdemProducao.create(data);
    }
    setOrdemModal(false);
    setEditOrdem(null);
    loadData();
  };

  const handleExecutarOrdem = async (ordem) => {
    if (!confirm(`Executar ordem ${ordem.numero}? Isso baixará os insumos do estoque.`)) return;
    try {
      const result = await base44.functions.invoke("executarProducao", { ordem_producao_id: ordem.id });
      if (result.data.sucesso) {
        alert(`Produção executada com sucesso!\nProduzido: ${result.data.dados.quantidade_produzida} unidades\nLote: ${result.data.dados.lote}\nCusto total: R$ ${result.data.dados.custo_total.toFixed(2)}`);
        loadData();
      } else {
        alert(`Erro: ${result.data.error}`);
      }
    } catch (e) {
      alert(`Erro ao executar: ${e.message}`);
    }
  };

  const handleDeleteFicha = async (id) => {
    if (!confirm("Excluir ficha técnica?")) return;
    await base44.entities.FichaTecnica.delete(id);
    loadData();
  };

  const handleDeleteOrdem = async (id) => {
    if (!confirm("Excluir ordem de produção?")) return;
    await base44.entities.OrdemProducao.delete(id);
    loadData();
  };

  const openFichaModal = (ficha = null) => {
    setEditFicha(ficha);
    setFichaModal(true);
  };

  const openOrdemModal = (ordem = null) => {
    setEditOrdem(ordem);
    setOrdemModal(true);
  };

  const openHistorico = (ordem) => {
    setSelectedOrdem(ordem);
    setHistModal(true);
  };

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        {["Fichas Técnicas", "Ordens de Produção", "Histórico"].map((t, i) => (
          <button
            key={i}
            onClick={() => setSubTab(i)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all
 ${subTab === i ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {subTab === 0 && (
        <>
          <div className="flex justify-end">
            <button
              onClick={() => openFichaModal()}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
            >
              <Plus size={16} /> Nova Ficha Técnica
            </button>
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {fichas.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">Nenhuma ficha técnica</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs text-muted-foreground px-4 py-3">Produto</th>
                    <th className="text-left text-xs text-muted-foreground px-4 py-3">Versão</th>
                    <th className="text-right text-xs text-muted-foreground px-4 py-3">Insumos</th>
                    <th className="text-right text-xs text-muted-foreground px-4 py-3">Custo Total</th>
                    <th className="text-right text-xs text-muted-foreground px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {fichas.map(f => (
                    <tr key={f.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm text-foreground">{f.produto_descricao}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">v{f.versao}</td>
                      <td className="px-4 py-3 text-right text-sm">{(f.insumos || []).length} itens</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-green-400">{fmt(f.custo_total_unitario)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openFichaModal(f)} className="text-xs text-muted-foreground hover:text-foreground"><Pencil size={14} /></button>
                          <button onClick={() => handleDeleteFicha(f.id)} className="text-xs text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {subTab === 1 && (
        <>
          <div className="flex justify-end">
            <button
              onClick={() => openOrdemModal()}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
            >
              <Plus size={16} /> Nova Ordem de Produção
            </button>
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {ordens.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">Nenhuma ordem de produção</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs text-muted-foreground px-4 py-3">OP</th>
                    <th className="text-left text-xs text-muted-foreground px-4 py-3">Produto</th>
                    <th className="text-right text-xs text-muted-foreground px-4 py-3">Qtd Plan.</th>
                    <th className="text-right text-xs text-muted-foreground px-4 py-3">Qtd Prod.</th>
                    <th className="text-left text-xs text-muted-foreground px-4 py-3">Status</th>
                    <th className="text-right text-xs text-muted-foreground px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {ordens.map(o => {
                    const statusColor = {
                      "Planejada": "text-blue-400",
                      "Em Produção": "text-yellow-400",
                      "Concluída": "text-green-400",
                      "Cancelada": "text-red-400",
                    }[o.status] || "text-muted-foreground";
                    return (
                      <tr key={o.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="px-4 py-3 text-sm font-mono text-foreground">{o.numero}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{o.produto_descricao}</td>
                        <td className="px-4 py-3 text-right text-sm">{o.quantidade_planejada}</td>
                        <td className="px-4 py-3 text-right text-sm font-semibold">{o.quantidade_produzida}</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full bg-muted ${statusColor}`}>{o.status}</span></td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {o.status === "Planejada" && (
                              <button onClick={() => handleExecutarOrdem(o)} className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1">
                                <Zap size={12} /> Executar
                              </button>
                            )}
                            <button onClick={() => openOrdemModal(o)} className="text-xs text-muted-foreground hover:text-foreground"><Pencil size={14} /></button>
                            <button onClick={() => openHistorico(o)} className="text-xs text-primary hover:underline">Hist.</button>
                            <button onClick={() => handleDeleteOrdem(o.id)} className="text-xs text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {subTab === 2 && (
        selectedOrdem
          ? <MovimentacaoHistorico ordemId={selectedOrdem.id} />
          : <div className="text-center py-12 text-sm text-muted-foreground">Clique em "Hist." em uma ordem de produção para ver o histórico.</div>
      )}

      {fichaModal && <FichaTecnicaModal ficha={editFicha} onClose={() => { setFichaModal(false); setEditFicha(null); }} onSave={handleSaveFicha} />}
      {ordemModal && <OrdemProducaoModal ordem={editOrdem} fichas={fichas} onClose={() => { setOrdemModal(false); setEditOrdem(null); }} onSave={handleSaveOrdem} />}
    </div>
  );
}