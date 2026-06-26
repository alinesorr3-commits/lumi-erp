import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp, TrendingDown } from "lucide-react";
import HistoricoModal from "./HistoricoModal";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function BensVendidos({ refresh }) {
  const [bens, setBens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historicoModal, setHistoricoModal] = useState(null);

  useEffect(() => {
    base44.entities.BemRecebido.filter({ ativo: true, status: "vendido" }).then(data => {
      setBens(data);
      setLoading(false);
    });
  }, [refresh]);

  const totalVendido = bens.reduce((s, b) => s + (b.valor_venda || 0), 0);
  const totalAvaliacao = bens.reduce((s, b) => s + (b.valor_avaliacao || 0), 0);
  const lucroTotal = bens.reduce((s, b) => s + (b.lucro_prejuizo || 0), 0);

  if (loading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Vendido</p>
          <p className="text-xl font-bold text-green-400">{fmt(totalVendido)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Avaliação</p>
          <p className="text-xl font-bold text-yellow-400">{fmt(totalAvaliacao)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Resultado Total</p>
          <p className={`text-xl font-bold ${lucroTotal >= 0 ? "text-green-400" : "text-red-400"}`}>
            {lucroTotal >= 0 ? "+" : ""}{fmt(lucroTotal)}
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {bens.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-sm">Nenhum bem vendido registrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Descrição", "Comprador", "Avaliação", "Venda", "Lucro/Prejuízo", "Margem", "Data Venda", "Contrato", "Histórico"].map(h => (
                    <th key={h} className="text-left text-xs text-muted-foreground px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bens.map(b => {
                  const positivo = (b.lucro_prejuizo || 0) >= 0;
                  return (
                    <tr key={b.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-foreground max-w-[180px] truncate">{b.descricao}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{b.comprador}</td>
                      <td className="px-4 py-3 text-sm text-yellow-400">{fmt(b.valor_avaliacao)}</td>
                      <td className="px-4 py-3 text-sm text-green-400 font-bold">{fmt(b.valor_venda)}</td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1 text-sm font-bold ${positivo ? "text-green-400" : "text-red-400"}`}>
                          {positivo ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                          {positivo ? "+" : ""}{fmt(b.lucro_prejuizo)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{(b.margem || 0).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{b.data_venda || "—"}</td>
                      <td className="px-4 py-3 text-xs text-blue-400">{b.contrato_origem_numero || "—"}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setHistoricoModal(b)} className="text-xs text-blue-400 hover:underline">Ver</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {historicoModal && <HistoricoModal bem={historicoModal} onClose={() => setHistoricoModal(null)} />}
    </div>
  );
}