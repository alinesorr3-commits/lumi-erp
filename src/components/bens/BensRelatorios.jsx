import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 text-xs shadow-xl">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: {fmt(p.value)}</p>)}
    </div>
  );
};

export default function BensRelatorios({ refresh }) {
  const [bens, setBens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [relatorio, setRelatorio] = useState("estoque");

  useEffect(() => {
    base44.entities.BemRecebido.filter({ ativo: true }).then(data => {
      setBens(data);
      setLoading(false);
    });
  }, [refresh]);

  if (loading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;

  const estoque = bens.filter(b => b.status === "em_estoque");
  const vendidos = bens.filter(b => b.status === "vendido");

  // Agrupamento por categoria para gráfico
  const porCategoria = {};
  bens.forEach(b => {
    const cat = b.categoria || "outro";
    if (!porCategoria[cat]) porCategoria[cat] = { categoria: cat, estoque: 0, vendido: 0 };
    if (b.status === "em_estoque") porCategoria[cat].estoque += (b.valor_avaliacao || 0);
    if (b.status === "vendido") porCategoria[cat].vendido += (b.valor_venda || 0);
  });
  const chartData = Object.values(porCategoria);

  const relatorios = {
    estoque: {
      titulo: "Relatório de Estoque de Bens Disponíveis",
      dados: estoque,
      colunas: ["Descrição", "Categoria", "Qtd", "Valor Avaliação", "Entrada", "Origem", "Contrato"],
    },
    entradas: {
      titulo: "Relatório de Entrada de Bens",
      dados: [...bens].sort((a, b) => (a.data_entrada || "").localeCompare(b.data_entrada || "")),
      colunas: ["Descrição", "Categoria", "Valor Avaliação", "Data Entrada", "Origem", "Contrato", "Status"],
    },
    vendidos: {
      titulo: "Relatório de Bens Vendidos",
      dados: vendidos,
      colunas: ["Descrição", "Comprador", "Avaliação", "Venda", "Lucro/Prejuízo", "Margem", "Data Venda"],
    },
  };

  const rel = relatorios[relatorio];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {Object.entries({ estoque: "Estoque Disponível", entradas: "Entrada de Bens", vendidos: "Bens Vendidos" }).map(([k, v]) => (
          <button key={k} onClick={() => setRelatorio(k)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
 ${relatorio === k ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            {v}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Patrimônio por Categoria (Estoque × Vendido)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 25% 15%)" vertical={false} />
            <XAxis dataKey="categoria" tick={{ fill: "hsl(215 20% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(215 20% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="estoque" name="Em Estoque" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="vendido" name="Vendido" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabela */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">{rel.titulo}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{rel.dados.length} registros</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {rel.colunas.map(c => (
                  <th key={c} className="text-left text-xs text-muted-foreground px-4 py-3">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rel.dados.length === 0 ? (
                <tr><td colSpan={rel.colunas.length} className="text-center py-8 text-sm text-muted-foreground">Nenhum registro</td></tr>
              ) : rel.dados.map(b => (
                <tr key={b.id} className="border-b border-border/50 hover:bg-muted/30">
                  {relatorio === "estoque" && (
                    <>
                      <td className="px-4 py-3 text-sm text-foreground max-w-[200px] truncate">{b.descricao}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{b.categoria}</td>
                      <td className="px-4 py-3 text-xs text-foreground">{b.quantidade}</td>
                      <td className="px-4 py-3 text-sm font-bold text-yellow-400">{fmt(b.valor_avaliacao)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{b.data_entrada}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{b.cliente_fornecedor || "—"}</td>
                      <td className="px-4 py-3 text-xs text-blue-400">{b.contrato_origem_numero || "—"}</td>
                    </>
                  )}
                  {relatorio === "entradas" && (
                    <>
                      <td className="px-4 py-3 text-sm text-foreground max-w-[200px] truncate">{b.descricao}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{b.categoria}</td>
                      <td className="px-4 py-3 text-sm text-yellow-400">{fmt(b.valor_avaliacao)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{b.data_entrada}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{b.cliente_fornecedor || "—"}</td>
                      <td className="px-4 py-3 text-xs text-blue-400">{b.contrato_origem_numero || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${b.status === "em_estoque" ? "bg-blue-400/10 text-blue-400" : b.status === "vendido" ? "bg-green-400/10 text-green-400" : "bg-muted text-muted-foreground"}`}>
                          {b.status === "em_estoque" ? "Em Estoque" : b.status === "vendido" ? "Vendido" : "Cancelado"}
                        </span>
                      </td>
                    </>
                  )}
                  {relatorio === "vendidos" && (
                    <>
                      <td className="px-4 py-3 text-sm text-foreground max-w-[180px] truncate">{b.descricao}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{b.comprador}</td>
                      <td className="px-4 py-3 text-sm text-yellow-400">{fmt(b.valor_avaliacao)}</td>
                      <td className="px-4 py-3 text-sm text-green-400 font-bold">{fmt(b.valor_venda)}</td>
                      <td className={`px-4 py-3 text-sm font-bold ${(b.lucro_prejuizo || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {(b.lucro_prejuizo || 0) >= 0 ? "+" : ""}{fmt(b.lucro_prejuizo)}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{(b.margem || 0).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{b.data_venda || "—"}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}