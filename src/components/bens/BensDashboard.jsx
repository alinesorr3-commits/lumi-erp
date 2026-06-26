import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Package, ShoppingBag, TrendingUp, DollarSign, BarChart2, Archive } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function BensDashboard({ refresh }) {
  const [bens, setBens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.BemRecebido.filter({ ativo: true }).then(data => {
      setBens(data);
      setLoading(false);
    });
  }, [refresh]);

  if (loading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;

  const emEstoque = bens.filter(b => b.status === "em_estoque");
  const vendidos = bens.filter(b => b.status === "vendido");

  const valorEstoque = emEstoque.reduce((s, b) => s + (b.valor_avaliacao || 0), 0);
  const valorVendido = vendidos.reduce((s, b) => s + (b.valor_venda || 0), 0);
  const lucroTotal = vendidos.reduce((s, b) => s + (b.lucro_prejuizo || 0), 0);
  const ticketMedio = vendidos.length > 0 ? valorVendido / vendidos.length : 0;

  const cards = [
    { label: "Bens em Estoque", value: emEstoque.length, unit: "bens", icon: Package, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Bens Vendidos", value: vendidos.length, unit: "bens", icon: ShoppingBag, color: "text-green-400", bg: "bg-green-400/10" },
    { label: "Valor em Estoque", value: fmt(valorEstoque), icon: Archive, color: "text-yellow-400", bg: "bg-yellow-400/10" },
    { label: "Total Vendido", value: fmt(valorVendido), icon: DollarSign, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Lucro nas Revendas", value: fmt(lucroTotal), icon: TrendingUp, color: lucroTotal >= 0 ? "text-green-400" : "text-red-400", bg: lucroTotal >= 0 ? "bg-green-400/10" : "bg-red-400/10" },
    { label: "Ticket Médio", value: fmt(ticketMedio), icon: BarChart2, color: "text-blue-400", bg: "bg-blue-400/10" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center`}>
                  <Icon size={18} className={c.color} />
                </div>
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </div>
              <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
            </div>
          );
        })}
      </div>

      {/* Últimas entradas */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Últimas Entradas de Bens</h3>
        {emEstoque.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhum bem em estoque</p>
        ) : (
          <div className="space-y-2">
            {emEstoque.slice(0, 5).map(b => (
              <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">{b.descricao}</p>
                  <p className="text-xs text-muted-foreground">{b.cliente_fornecedor} · Entrada: {b.data_entrada}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-yellow-400">{fmt(b.valor_avaliacao)}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-400/10 text-blue-400">Em Estoque</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Últimas vendas */}
      {vendidos.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Últimas Vendas</h3>
          <div className="space-y-2">
            {vendidos.slice(0, 5).map(b => (
              <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">{b.descricao}</p>
                  <p className="text-xs text-muted-foreground">{b.comprador} · Venda: {b.data_venda}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-400">{fmt(b.valor_venda)}</p>
                  <p className={`text-xs font-medium ${(b.lucro_prejuizo || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {(b.lucro_prejuizo || 0) >= 0 ? "+" : ""}{fmt(b.lucro_prejuizo)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}