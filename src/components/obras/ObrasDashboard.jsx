import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { fmt, statusConfig } from "./ObrasUtils";
import { Building2, TrendingUp, TrendingDown, DollarSign, Package } from "lucide-react";

export default function ObrasDashboard({ onTabChange }) {
  const [obras, setObras] = useState([]);
  const [materiais, setMateriais] = useState([]);
  const [mao, setMao] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Obra.list(),
      base44.entities.MaterialObra.list(),
      base44.entities.MaoDeObraObra.list(),
      base44.entities.DespesaObra.list(),
    ]).then(([o, m, mo, d]) => {
      setObras(o); setMateriais(m); setMao(mo); setDespesas(d); setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;

  const totalContratos = obras.reduce((s, o) => s + (o.valor_contrato || 0), 0);
  const totalMat = materiais.reduce((s, m) => s + (m.valor_total || 0), 0);
  const totalMao = mao.reduce((s, m) => s + (m.valor_total || 0), 0);
  const totalDesp = despesas.reduce((s, d) => s + (d.valor || 0), 0);
  const custoTotal = totalMat + totalMao + totalDesp;
  const lucroTotal = totalContratos - custoTotal;
  const emAndamento = obras.filter(o => o.status === "Em Andamento").length;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Obras", value: obras.length, color: "text-foreground", onClick: () => onTabChange("cadastro"), plain: true },
          { label: "Em Andamento", value: emAndamento, color: "text-yellow-400", onClick: () => onTabChange("cadastro"), plain: true },
          { label: "Total Contratos", value: fmt(totalContratos), color: "text-blue-400", onClick: () => onTabChange("cadastro") },
          { label: "Custo Total", value: fmt(custoTotal), color: "text-red-400", onClick: () => onTabChange("materiais") },
          { label: "Lucro Total", value: fmt(lucroTotal), color: lucroTotal >= 0 ? "text-green-400" : "text-red-400", onClick: () => onTabChange("resultado") },
        ].map(({ label, value, color, onClick, plain }) => (
          <button key={label} onClick={onClick} className="bg-card border border-border rounded-xl p-5 text-left hover:border-primary/30 transition-all">
            <p className="text-xs text-muted-foreground mb-2">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </button>
        ))}
      </div>

      {/* Lista de obras por status */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Obras por Status</h3>
        {obras.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhuma obra cadastrada. <button onClick={() => onTabChange("cadastro")} className="text-primary underline">Cadastrar</button>
          </p>
        ) : (
          <div className="space-y-2">
            {obras.map(o => {
              const s = statusConfig[o.status] || statusConfig.Planejamento;
              const matObra = materiais.filter(m => m.obra_id === o.id).reduce((s, m) => s + (m.valor_total || 0), 0);
              const maoObra = mao.filter(m => m.obra_id === o.id).reduce((s, m) => s + (m.valor_total || 0), 0);
              const despObra = despesas.filter(d => d.obra_id === o.id).reduce((s, d) => s + (d.valor || 0), 0);
              const custo = matObra + maoObra + despObra;
              const lucro = (o.valor_contrato || 0) - custo;
              return (
                <div key={o.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>{o.status}</span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{o.nome}</p>
                      <p className="text-xs text-muted-foreground">{o.cliente}{o.cidade ? ` · ${o.cidade}` : ""}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-blue-400">{fmt(o.valor_contrato)}</p>
                    <p className={`text-xs font-medium ${lucro >= 0 ? "text-green-400" : "text-red-400"}`}>Lucro: {fmt(lucro)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}