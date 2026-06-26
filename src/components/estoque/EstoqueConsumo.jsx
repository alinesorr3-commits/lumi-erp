import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import ProdutoModal from "./ProdutoModal";
import ImportButton from "@/components/shared/ImportButton";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function EstoqueConsumo({ refresh, onRefresh }) {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduto, setEditProduto] = useState(null);

  const loadProdutos = async () => {
    setLoading(true);
    const data = await base44.entities.ProdutoServico.filter(
      { classificacao: "Uso e Consumo", ativo: true },
      "-created_date"
    );
    setProdutos(data);
    setLoading(false);
  };

  useEffect(() => { loadProdutos(); }, [refresh]);

  const filtered = produtos.filter(p => 
    !search || 
    p.descricao?.toLowerCase().includes(search.toLowerCase()) || 
    p.codigo?.includes(search)
  );

  const handleSave = async (data) => {
    if (editProduto) {
      await base44.entities.ProdutoServico.update(editProduto.id, data);
    } else {
      await base44.entities.ProdutoServico.create({ ...data, classificacao: "Uso e Consumo" });
    }
    setModalOpen(false);
    setEditProduto(null);
    loadProdutos();
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir este item?")) return;
    await base44.entities.ProdutoServico.delete(id);
    loadProdutos();
  };

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Buscar por código ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <ImportButton
            label="Importar"
            accept=".csv,.xls,.xlsx,.pdf"
            schema={{
              type: "object",
              properties: {
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      codigo: { type: "string" },
                      descricao: { type: "string" },
                      preco_custo: { type: "number" },
                      estoque_atual: { type: "number" },
                      unidade: { type: "string" }
                    }
                  }
                }
              }
            }}
            onData={async (rows) => {
              for (const row of rows) {
                const r = {};
                if (row && typeof row === 'object') {
                  for (const k in row) r[k.toLowerCase()] = row[k];
                }
                if (r.descricao) {
                  await base44.entities.ProdutoServico.create({
                    classificacao: "Uso e Consumo",
                    tipo: "Produto",
                    codigo: r.codigo || "",
                    descricao: r.descricao,
                    preco_custo: parseFloat(r.preco_custo?.toString().replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
                    estoque_atual: parseFloat(r.estoque_atual?.toString().replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
                    unidade: r.unidade || "UN",
                    ativo: true
                  });
                }
              }
              loadProdutos();
              if (onRefresh) onRefresh();
            }}
          />
          <button
            onClick={() => { setEditProduto(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
          >
            <Plus size={16} /> Novo Item
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">Nenhum item de uso e consumo cadastrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs text-muted-foreground px-4 py-3">Código</th>
                  <th className="text-left text-xs text-muted-foreground px-4 py-3">Descrição</th>
                  <th className="text-right text-xs text-muted-foreground px-4 py-3">Quantidade</th>
                  <th className="text-right text-xs text-muted-foreground px-4 py-3">Preço Unitário</th>
                  <th className="text-right text-xs text-muted-foreground px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{p.codigo || "—"}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{p.descricao}</td>
                    <td className="px-4 py-3 text-right text-sm">{p.estoque_atual || 0} {p.unidade}</td>
                    <td className="px-4 py-3 text-right text-sm text-green-400">{fmt(p.preco_custo)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setEditProduto(p); setModalOpen(true); }} className="text-muted-foreground hover:text-foreground"><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <ProdutoModal
          produto={editProduto}
          classificacao="Uso e Consumo"
          onClose={() => { setModalOpen(false); setEditProduto(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}