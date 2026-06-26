import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Package, ShoppingCart, History } from "lucide-react";
import ImportButton from "@/components/shared/ImportButton";
import BemModal from "./BemModal";
import VendaBemModal from "./VendaBemModal";
import HistoricoModal from "./HistoricoModal";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const catLabel = { imovel: "Imóvel", veiculo: "Veículo", maquina: "Máquina", equipamento: "Equipamento", mercadoria: "Mercadoria", outro: "Outro" };

export default function BensEstoque({ refresh, onRefresh }) {
  const [bens, setBens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalBem, setModalBem] = useState(false);
  const [editBem, setEditBem] = useState(null);
  const [vendaModal, setVendaModal] = useState(null);
  const [historicoModal, setHistoricoModal] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.BemRecebido.filter({ ativo: true, status: "em_estoque" });
    setBens(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [refresh]);

  const handleSaveBem = async (data) => {
    const agora = new Date().toISOString();
    if (editBem) {
      const historico = editBem.historico || [];
      historico.push({ acao: "Edição cadastral", data: agora, dados: data });
      await base44.entities.BemRecebido.update(editBem.id, { ...data, historico });
    } else {
      const historico = [{ acao: "Entrada do bem", data: agora, dados: data }];
      await base44.entities.BemRecebido.create({ ...data, historico });
    }
    setModalBem(false);
    setEditBem(null);
    load();
    onRefresh();
  };

  const handleVenda = async (dadosVenda) => {
    const agora = new Date().toISOString();
    const historico = vendaModal.historico || [];
    historico.push({ acao: "Venda realizada", data: agora, dados: dadosVenda });
    await base44.entities.BemRecebido.update(vendaModal.id, { ...dadosVenda, historico });
    setVendaModal(null);
    load();
    onRefresh();
  };

  const handleExclusaoLogica = async (bem) => {
    if (!confirm(`Cancelar o bem "${bem.descricao}"? Esta ação não pode ser desfeita.`)) return;
    const historico = bem.historico || [];
    historico.push({ acao: "Cancelamento (exclusão lógica)", data: new Date().toISOString() });
    await base44.entities.BemRecebido.update(bem.id, { ativo: false, status: "cancelado", historico });
    load();
    onRefresh();
  };

  const filtered = bens.filter(b =>
    b.descricao?.toLowerCase().includes(search.toLowerCase()) ||
    b.cliente_fornecedor?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar bens..."
            className="bg-card border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary w-64" />
        </div>
        <div className="flex items-center gap-2">
          <ImportButton
            label="Importar XLS/CSV/PDF"
            accept=".csv,.xls,.xlsx,.pdf"
            schema={{
              type: "object",
              properties: {
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      descricao: { type: "string" },
                      categoria: { type: "string" },
                      quantidade: { type: "number" },
                      valor_avaliacao: { type: "number" },
                      cliente_fornecedor: { type: "string" },
                      data_entrada: { type: "string" }
                    }
                  }
                }
              }
            }}
            onData={async (rows) => {
              const list = rows[0]?.items || rows;
              for (const row of list) {
                const r = {};
                if (row && typeof row === 'object') {
                  for (const k in row) r[k.toLowerCase()] = row[k];
                }
                
                if (r.descricao) {
                  await base44.entities.BemRecebido.create({
                    descricao: r.descricao,
                    categoria: r.categoria || "Outro",
                    quantidade: r.quantidade ? Number(r.quantidade) : 1,
                    valor_avaliacao: r.valor_avaliacao ? parseFloat(r.valor_avaliacao.toString().replace(/[^\d.,]/g, '').replace(',', '.')) : 0,
                    cliente_fornecedor: r.cliente_fornecedor || "",
                    data_entrada: r.data_entrada || new Date().toISOString().slice(0, 10),
                    status: "Em Estoque",
                    origem_transacao: "Importação"
                  });
                }
              }
              load();
            }}
          />
          <button onClick={() => { setEditBem(null); setModalBem(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
            <Plus size={16} /> Registrar Bem
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Package size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nenhum bem em estoque</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Descrição", "Categoria", "Qtd", "Valor Avaliação", "Entrada", "Origem", "Contrato", "Ações"].map(h => (
                    <th key={h} className="text-left text-xs text-muted-foreground px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-foreground max-w-xs truncate">{b.descricao}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{catLabel[b.categoria] || b.categoria}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{b.quantidade || 1}</td>
                    <td className="px-4 py-3 text-sm font-bold text-yellow-400">{fmt(b.valor_avaliacao)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{b.data_entrada}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[120px] truncate">{b.cliente_fornecedor || "—"}</td>
                    <td className="px-4 py-3 text-xs text-blue-400">{b.contrato_origem_numero || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setVendaModal(b)}
                          className="flex items-center gap-1 text-xs px-2 py-1 bg-green-500/10/10 text-green-400 rounded hover:bg-green-500/10/20">
                          <ShoppingCart size={11} /> Vender
                        </button>
                        <button onClick={() => { setEditBem(b); setModalBem(true); }} className="text-xs text-muted-foreground hover:text-foreground">Editar</button>
                        <button onClick={() => setHistoricoModal(b)} className="text-xs text-blue-400 hover:underline">
                          <History size={13} />
                        </button>
                        <button onClick={() => handleExclusaoLogica(b)} className="text-xs text-red-400 hover:underline">Cancelar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalBem && <BemModal bem={editBem} onClose={() => { setModalBem(false); setEditBem(null); }} onSave={handleSaveBem} />}
      {vendaModal && <VendaBemModal bem={vendaModal} onClose={() => setVendaModal(null)} onSave={handleVenda} />}
      {historicoModal && <HistoricoModal bem={historicoModal} onClose={() => setHistoricoModal(null)} />}
    </div>
  );
}