import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Filter, CheckCircle2, Clock, AlertCircle, XCircle, TrendingUp, TrendingDown, Wallet, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import LancamentoModal from "@/components/financeiro/LancamentoModal";
import FluxoCaixa from "@/components/financeiro/FluxoCaixa";
import ConciliacaoBancaria from "@/components/financeiro/ConciliacaoBancaria";
import TerceirosPrestadores from "@/components/financeiro/TerceirosPrestadores";
import Socios from "@/components/financeiro/Socios";
import HistoricoApuracoes from "@/components/financeiro/HistoricoApuracoes";
import PlanoContas from "@/components/financeiro/PlanoContas";
import ImportarLancamentos from "@/components/financeiro/ImportarLancamentos";
import PrintButton from "@/components/shared/PrintButton";
import SaldosEMetas from "@/components/financeiro/SaldosEMetas";
import AlertaVencimentos from "@/components/financeiro/AlertaVencimentos";

const TABS = ["Painel Geral", "Contas a Pagar", "Contas a Receber", "Fluxo de Caixa", "Conciliação Bancária", "Histórico de Apurações", "Terceiros / Prestadores", "Sócios", "Plano de Contas", "Importar Planilha"];

const statusConfig = {
  pendente: { label: "Pendente", icon: Clock, color: "text-yellow-400", bg: "bg-yellow-400/10" },
  pago: { label: "Pago", icon: CheckCircle2, color: "text-green-400", bg: "bg-green-400/10" },
  vencido: { label: "Vencido", icon: AlertCircle, color: "text-red-400", bg: "bg-red-400/10" },
  cancelado: { label: "Cancelado", icon: XCircle, color: "text-muted-foreground", bg: "bg-muted" },
};

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const fmtDate = (d) => d ? format(new Date(d + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR }) : "-";

export default function Financeiro() {
  const [tab, setTab] = useState(0);
  const [lancamentos, setLancamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterDataInicio, setFilterDataInicio] = useState("");
  const [filterDataFim, setFilterDataFim] = useState("");
  const [filterFornecedor, setFilterFornecedor] = useState("");
  const [filterValor, setFilterValor] = useState("");
  const [selected, setSelected] = useState(new Set());

  const loadLancamentos = async () => {
    setLoading(true);
    const data = await base44.entities.Lancamento.list("-vencimento");
    // Auto update vencido
    const today = new Date().toISOString().split("T")[0];
    const updated = data.map(l => {
      if (l.status === "pendente" && l.vencimento < today) return { ...l, status: "vencido" };
      return l;
    });
    setLancamentos(updated);
    setLoading(false);
  };

  useEffect(() => { loadLancamentos(); }, []);

  const tipo = tab === 1 ? "despesa" : "receita";
  const filtered = lancamentos.filter(l => {
    if (tab === 1 && l.tipo !== "despesa") return false;
    if (tab === 2 && l.tipo !== "receita") return false;
    if (filterStatus !== "todos" && l.status !== filterStatus) return false;
    if (filterDataInicio && l.vencimento < filterDataInicio) return false;
    if (filterDataFim && l.vencimento > filterDataFim) return false;
    if (filterFornecedor && !l.cliente_fornecedor?.toLowerCase().includes(filterFornecedor.toLowerCase())) return false;
    if (filterValor && Math.abs(l.valor - parseFloat(filterValor)) > 0.01) return false;
    return true;
  });

  const total = filtered.reduce((s, l) => s + (l.valor || 0), 0);
  const totalPago = filtered.filter(l => l.status === "pago").reduce((s, l) => s + (l.valor_pago !== undefined && l.valor_pago !== null && l.valor_pago !== "" ? Number(l.valor_pago) : (Number(l.valor) || 0) + (Number(l.valor_por_fora) || 0) + (Number(l.juros_multas) || 0) - (Number(l.valor_desconto) || 0)), 0);
  const totalPendente = filtered.filter(l => l.status !== "pago" && l.status !== "cancelado").reduce((s, l) => s + (l.valor || 0), 0);

  const handleSave = async (data, isMulti = false) => {
    if (editItem) {
      // Atualização otimista: reflete na tela imediatamente
      const updated = { ...editItem, ...data };
      setLancamentos(prev => prev.map(l => l.id === editItem.id ? updated : l));
      setModalOpen(false);
      setEditItem(null);
      base44.entities.Lancamento.update(editItem.id, data);
    } else {
      setModalOpen(false);
      setEditItem(null);
      
      if (isMulti) {
        await base44.entities.Lancamento.bulkCreate(data);
        loadLancamentos();
      } else {
        const novo = await base44.entities.Lancamento.create(data);
        setLancamentos(prev => [novo, ...prev]);
      }
    }
  };

  const handleMarcarPago = async (item) => {
    const patch = { status: "pago", data_pagamento: new Date().toISOString().split("T")[0] };
    setLancamentos(prev => prev.map(l => l.id === item.id ? { ...l, ...patch } : l));
    base44.entities.Lancamento.update(item.id, patch);
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir este lançamento?")) return;
    setLancamentos(prev => prev.filter(l => l.id !== id));
    base44.entities.Lancamento.delete(id);
  };

  const handleDeleteBatch = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Excluir ${selected.size} lançamento(s)?`)) return;
    const ids = [...selected];
    setLancamentos(prev => prev.filter(l => !ids.includes(l.id)));
    setSelected(new Set());
    ids.forEach(id => base44.entities.Lancamento.delete(id));
  };

  const toggleSelect = (id) => {
    const newSet = new Set(selected);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelected(newSet);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6 no-print">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">Financeiro</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestão de contas, fluxo e conciliação bancária</p>
        </div>
          <div className="flex items-center gap-2">
            <PrintButton label="Imprimir" />
            {(tab === 1 || tab === 2) && (
              <button
                onClick={() => { setEditItem(null); setModalOpen(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus size={16} />
                Novo Lançamento
              </button>
            )}
          </div>
      </div>

      {/* Relatório de Impressão (Fiel ao Anexo) */}
      <div className="hidden print:block w-full text-[10px] font-sans">
        <h2 className="text-lg font-bold mb-2">{tab === 1 ? "Contas a Pagar" : "Contas a Receber"}</h2>
        <table className="w-full border-collapse mb-4 !border-none">
          <thead>
            <tr className="border-y border-black">
              <th className="py-1 px-1 text-left font-bold !border-none">Nº Seq.</th>
              <th className="py-1 px-1 text-left font-bold !border-none">Tp Título/Doc.</th>
              <th className="py-1 px-1 text-left font-bold !border-none">Descrição</th>
              <th className="py-1 px-1 text-left font-bold !border-none">Nº Documento</th>
              <th className="py-1 px-1 text-left font-bold !border-none">Cliente</th>
              <th className="py-1 px-1 text-center font-bold !border-none">Emissão</th>
              <th className="py-1 px-1 text-center font-bold !border-none">Venc</th>
              <th className="py-1 px-1 text-right font-bold !border-none">Vl Doc.</th>
              <th className="py-1 px-1 text-right font-bold !border-none">Vl Cob</th>
              <th className="py-1 px-1 text-right font-bold !border-none">Vl Pago</th>
              <th className="py-1 px-1 text-center font-bold !border-none">Data Pgto</th>
              <th className="py-1 px-1 text-right font-bold !border-none">Vl Dif</th>
              <th className="py-1 px-1 text-left font-bold pl-2 !border-none">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, idx) => {
              const numSeq = String(idx + 1).padStart(5, '0') + "/" + new Date().getFullYear();
              const isPago = item.status === 'pago';
              return (
                <tr key={item.id} className={idx % 2 === 0 ? "bg-card" : "bg-muted print:bg-muted !print:bg-opacity-100"} style={{ WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact' }}>
                  <td className="py-1 px-1 text-left !border-none">{numSeq}</td>
                  <td className="py-1 px-1 text-left !border-none">{item.categoria || "Comercial"}</td>
                  <td className="py-1 px-1 text-left truncate max-w-[150px] !border-none">{item.descricao}</td>
                  <td className="py-1 px-1 text-left !border-none">{item.numero_documento || "(Comercial)"}</td>
                  <td className="py-1 px-1 text-left truncate max-w-[200px] !border-none">{item.cliente_fornecedor || "—"}</td>
                  <td className="py-1 px-1 text-center !border-none">-</td>
                  <td className="py-1 px-1 text-center !border-none">{fmtDate(item.vencimento)}</td>
                  <td className="py-1 px-1 text-right !border-none">{item.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  <td className="py-1 px-1 text-right !border-none">{item.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  <td className="py-1 px-1 text-right !border-none">{isPago ? (item.valor_pago !== undefined && item.valor_pago !== null && item.valor_pago !== "" ? Number(item.valor_pago) : item.valor).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : "0,00"}</td>
                  <td className="py-1 px-1 text-center !border-none">{isPago ? fmtDate(item.data_pagamento) : ""}</td>
                  <td className="py-1 px-1 text-right !border-none">0,00</td>
                  <td className="py-1 px-1 text-left pl-2 uppercase !border-none">{item.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        <div className="border border-black mb-2">
          <div className="bg-gray-100 print:bg-gray-100 text-center font-bold py-1 border-b border-black" style={{ WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact' }}>TOTAIS</div>
          <div className="grid grid-cols-4 p-2 gap-y-2">
            <div><span className="font-bold">Valor Documento:</span> {total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
            <div><span className="font-bold">Desconto:</span> 0,00</div>
            <div><span className="font-bold">Deduções:</span> 0,00</div>
            <div><span className="font-bold">Multa:</span> 0,00</div>
            
            <div><span className="font-bold">Acréscimo:</span> 0,00</div>
            <div><span className="font-bold">Valor cobrado:</span> {total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
            <div><span className="font-bold">Valor Pago:</span> {totalPago.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
            <div><span className="font-bold">Diferença:</span> 0,00</div>
          </div>
        </div>
        <div className="font-bold text-xs mt-2">
          Total de Registros: {filtered.length}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg mb-6 w-fit overflow-x-auto no-print">
        {TABS.map((t, i) => (
          <button
            key={i}
            onClick={() => setTab(i)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap
 ${tab === i ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <>
          <AlertaVencimentos lancamentos={lancamentos} />
          <SaldosEMetas lancamentos={lancamentos} />
        </>
      )}
      {tab === 3 && <FluxoCaixa lancamentos={lancamentos} />}
      {tab === 4 && <ConciliacaoBancaria lancamentos={lancamentos} onRefresh={loadLancamentos} />}
      {tab === 5 && <HistoricoApuracoes contaId={lancamentos[0]?.conta_bancaria_id || ""} />}
      {tab === 6 && <TerceirosPrestadores />}
      {tab === 7 && <Socios />}
      {tab === 8 && <PlanoContas />}
      {tab === 9 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-base font-semibold text-foreground mb-1">Importar Lançamentos de Planilha</h2>
          <p className="text-xs text-muted-foreground mb-5">Importe contas a pagar ou receber de arquivos .xlsx ou .csv. Duplicatas são detectadas automaticamente.</p>
          <ImportarLancamentos defaultTipo="despesa" onImportado={loadLancamentos} />
        </div>
      )}

      {(tab === 1 || tab === 2) && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4 mb-6 no-print">
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Total</p>
              <p className="text-xl font-bold text-foreground">{fmt(total)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">{tab === 1 ? "Pago" : "Recebido"}</p>
              <p className="text-xl font-bold text-green-400">{fmt(totalPago)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Pendente/Vencido</p>
              <p className="text-xl font-bold text-yellow-400">{fmt(totalPendente)}</p>
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center justify-between gap-2 mb-4 flex-wrap no-print">
            <div className="flex items-center gap-4 flex-wrap w-full">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Filter size={14} className="text-muted-foreground" />
                <input 
                  placeholder="Fornecedor/Cliente..." 
                  value={filterFornecedor}
                  onChange={e => setFilterFornecedor(e.target.value)}
                  className="bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-foreground outline-none w-48"
                />
                <input 
                  placeholder="Valor (R$)" 
                  type="number"
                  step="0.01"
                  value={filterValor}
                  onChange={e => setFilterValor(e.target.value)}
                  className="bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-foreground outline-none w-28"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Status:</span>
                {["todos", "pendente", "pago", "vencido"].map(s => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all
 ${filterStatus === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                  >
                    {s === "todos" ? "Todos" : statusConfig[s]?.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 bg-muted/50 px-3 py-1 rounded-full">
                <span className="text-xs text-muted-foreground">Vencimento:</span>
                <input 
                  type="date" 
                  value={filterDataInicio} 
                  onChange={(e) => setFilterDataInicio(e.target.value)}
                  className="bg-transparent text-foreground text-xs outline-none cursor-pointer" 
                />
                <span className="text-xs text-muted-foreground">até</span>
                <input 
                  type="date" 
                  value={filterDataFim} 
                  onChange={(e) => setFilterDataFim(e.target.value)}
                  className="bg-transparent text-foreground text-xs outline-none cursor-pointer" 
                />
              </div>
            </div>
            {selected.size > 0 && (
              <button onClick={handleDeleteBatch} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10/20 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/10/30">
                Excluir {selected.size}
              </button>
            )}
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden print:hidden">
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Wallet size={32} className="mb-3 opacity-50" />
                <p className="text-sm">Nenhum lançamento encontrado</p>
                <button
                  onClick={() => { setEditItem(null); setModalOpen(true); }}
                  className="mt-3 text-primary text-sm hover:underline"
                >
                  Adicionar primeiro lançamento
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 w-8 no-print">
                        <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0}
                          onChange={() => {
                            if (selected.size === filtered.length) setSelected(new Set());
                            else setSelected(new Set(filtered.map(l => l.id)));
                          }}
                          className="cursor-pointer" />
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider">Documento</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider">Descrição</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider">Categoria</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider">Vencimento</th>
                      <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider">Valor</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider">Status</th>
                      <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3 w-32 no-print">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item) => {
                      const s = statusConfig[item.status] || statusConfig.pendente;
                      const SIcon = s.icon;
                      return (
                        <tr key={item.id} className={`border-b border-border/50 transition-colors ${selected.has(item.id) ? "bg-primary/10" : "hover:bg-muted/30"}`}>
                          <td className="px-4 py-3 no-print">
                            <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleSelect(item.id)} className="cursor-pointer" />
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-semibold text-foreground">{item.numero_documento || "—"}</span>
                            {item.tipo_documento && item.tipo_documento !== "Outro" && (
                              <p className="text-[10px] text-muted-foreground">{item.tipo_documento}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-foreground">{item.descricao}</p>
                            {item.cliente_fornecedor && (
                              <p className="text-xs text-muted-foreground">{item.cliente_fornecedor}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-muted-foreground">{item.categoria || "—"}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-foreground">{fmtDate(item.vencimento)}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`text-sm font-semibold ${tab === 1 ? "text-red-400" : "text-green-400"}`}>
                              {fmt(item.valor)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.color} print:border print:border-border print:bg-transparent print:text-foreground`}>
                              <SIcon size={11} className="no-print" />
                              {s.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 no-print">
                            <div className="flex items-center justify-end gap-2">
                              {item.status !== "pago" && (
                                <button
                                  onClick={() => handleMarcarPago(item)}
                                  className="text-xs text-green-400 hover:underline"
                                >
                                  Marcar pago
                                </button>
                              )}
                              <button
                                onClick={async () => {
                                  if (!item.numero_documento) {
                                    alert("Este lançamento não possui um número de documento vinculado.");
                                    return;
                                  }
                                  const notas = await base44.entities.NotaFiscalEletronica.filter({ numero: item.numero_documento });
                                  if (notas.length > 0 && notas[0].xml_url) {
                                    window.open(notas[0].xml_url, "_blank");
                                  } else {
                                    alert("Documento da nota fiscal não encontrado no sistema.");
                                  }
                                }}
                                className="text-xs text-blue-400 hover:underline"
                              >
                                Visualizar Nota
                              </button>
                              <button
                                onClick={() => { setEditItem(item); setModalOpen(true); }}
                                className="text-xs text-muted-foreground hover:text-foreground"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="text-xs text-red-400 hover:underline"
                              >
                                Excluir
                              </button>
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
        </>
      )}

      {modalOpen && (
        <LancamentoModal
          item={editItem}
          defaultTipo={tipo}
          onClose={() => { setModalOpen(false); setEditItem(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}