import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const fmtDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "-";

export default function MovimentacaoHistorico({ ordemId }) {
  const [movs, setMovs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await base44.entities.MovimentacaoEstoque.filter({ ordem_producao_id: ordemId }, "-created_date");
      setMovs(data);
      setLoading(false);
    };
    load();
  }, [ordemId]);

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  const gruposMovimento = movs.reduce((acc, m) => {
    const key = m.tipo_movimento;
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(gruposMovimento).map(([tipo, ms]) => (
        <div key={tipo} className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/50">
            <h3 className="font-semibold text-sm text-foreground">{tipo}</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs text-muted-foreground px-4 py-3">Produto</th>
                <th className="text-right text-xs text-muted-foreground px-4 py-3">Qtd</th>
                <th className="text-right text-xs text-muted-foreground px-4 py-3">Preço Unit.</th>
                <th className="text-right text-xs text-muted-foreground px-4 py-3">Total</th>
                <th className="text-left text-xs text-muted-foreground px-4 py-3">Data</th>
              </tr>
            </thead>
            <tbody>
              {ms.map(m => (
                <tr key={m.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3 text-sm text-foreground">{m.produto_descricao}</td>
                  <td className="px-4 py-3 text-right text-sm">{m.quantidade}</td>
                  <td className="px-4 py-3 text-right text-sm">{fmt(m.preco_unitario)}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-green-400">{fmt(m.valor_total)}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{fmtDate(m.data_movimento)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      {movs.length === 0 && (
        <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-xl">
          <p className="text-sm">Nenhuma movimentação registrada</p>
        </div>
      )}
    </div>
  );
}