import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { fmt, statusConfig } from "./ObrasUtils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from "recharts";
import {
  Building2, Package, AlertTriangle, CheckCircle2, Clock,
  TrendingUp, TrendingDown, Calendar, ChevronRight
} from "lucide-react";
import ParecerIA from "@/components/shared/ParecerIA";

function ProgressBar({ value, max, color = "bg-primary/10" }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full bg-muted rounded-full h-2">
      <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function diasRestantes(dataPrevisao) {
  if (!dataPrevisao) return null;
  const diff = new Date(dataPrevisao) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function ObrasPainelCentral({ onTabChange }) {
  const [obras, setObras] = useState([]);
  const [materiais, setMateriais] = useState([]);
  const [mao, setMao] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [obraFoco, setObraFoco] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.entities.Obra.list(),
      base44.entities.MaterialObra.list(),
      base44.entities.MaoDeObraObra.list(),
      base44.entities.DespesaObra.list(),
    ]).then(([o, m, mo, d]) => {
      setObras(o); setMateriais(m); setMao(mo); setDespesas(d);
      if (o.length > 0) setObraFoco(o[0].id);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-muted border-t-yellow-400 rounded-full animate-spin" /></div>;

  const obraAtiva = obras.find(o => o.id === obraFoco);

  // Por obra: calcula custo realizado e previsto (contrato)
  const obrasData = obras.map(o => {
    const matCusto = materiais.filter(m => m.obra_id === o.id).reduce((s, m) => s + (m.valor_total || 0), 0);
    const maoCusto = mao.filter(m => m.obra_id === o.id).reduce((s, m) => s + (m.valor_total || 0), 0);
    const despCusto = despesas.filter(d => d.obra_id === o.id).reduce((s, d) => s + (d.valor || 0), 0);
    const realizado = matCusto + maoCusto + despCusto;
    const previsto = o.valor_contrato || 0;
    const matItens = materiais.filter(m => m.obra_id === o.id);
    const dias = diasRestantes(o.data_previsao);
    return { ...o, matCusto, maoCusto, despCusto, realizado, previsto, matItens, dias };
  });

  // KPIs globais
  const totalContratos = obrasData.reduce((s, o) => s + o.previsto, 0);
  const totalRealizado = obrasData.reduce((s, o) => s + o.realizado, 0);
  const totalMargem = totalContratos - totalRealizado;
  const emAndamento = obrasData.filter(o => o.status === "Em Andamento");
  const atrasadas = emAndamento.filter(o => o.dias !== null && o.dias < 0);

  // Gráfico custo previsto vs realizado por obra (top 6)
  const chartData = obrasData.slice(0, 6).map(o => ({
    name: o.nome?.length > 14 ? o.nome.slice(0, 14) + "…" : o.nome,
    Previsto: o.previsto,
    Realizado: o.realizado,
  }));

  // Obra em foco
  const focoData = obrasData.find(o => o.id === obraFoco);

  // Estoque de materiais por obra (categoria)
  const estoqueCategoria = focoData
    ? focoData.matItens.reduce((acc, m) => {
        const cat = m.categoria || "Outros";
        acc[cat] = (acc[cat] || 0) + (m.valor_total || 0);
        return acc;
      }, {})
    : {};

  return (
    <div className="space-y-6">
      {/* KPIs Globais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Contratos", value: fmt(totalContratos), color: "text-blue-400", icon: Building2 },
          { label: "Custo Realizado", value: fmt(totalRealizado), color: "text-yellow-400", icon: TrendingDown },
          { label: "Margem Bruta", value: fmt(totalMargem), color: totalMargem >= 0 ? "text-green-400" : "text-red-400", icon: TrendingUp },
          { label: "Obras Atrasadas", value: atrasadas.length, color: atrasadas.length > 0 ? "text-red-400" : "text-green-400", icon: AlertTriangle, plain: true },
        ].map(({ label, value, color, icon: Icon, plain }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">{label}</p>
              <Icon size={14} className={color} />
            </div>
            <p className={`text-xl font-bold ${color}`}>{plain ? value : value}</p>
          </div>
        ))}
      </div>

      {/* Gráfico Custo Previsto vs Realizado */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Custo Previsto vs Realizado por Obra</h3>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma obra cadastrada.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                formatter={(v) => fmt(v)}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }} />
              <Bar dataKey="Previsto" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Realizado" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Cronograma + Estoque */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Cronograma */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Calendar size={14} className="text-yellow-400" /> Cronograma das Obras</h3>
            <button onClick={() => onTabChange("cadastro")} className="text-xs text-primary hover:underline flex items-center gap-1">Ver todas <ChevronRight size={12} /></button>
          </div>
          <div className="space-y-4">
            {obrasData.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma obra.</p>}
            {obrasData.map(o => {
              const s = statusConfig[o.status] || statusConfig.Planejamento;
              const pct = o.previsto > 0 ? Math.min((o.realizado / o.previsto) * 100, 100) : 0;
              const vencido = o.dias !== null && o.dias < 0;
              const proximo = o.dias !== null && o.dias >= 0 && o.dias <= 7;
              return (
                <div key={o.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>{o.status}</span>
                      <p className="text-sm font-medium text-foreground truncate max-w-[160px]">{o.nome}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {vencido && <AlertTriangle size={12} className="text-red-400" />}
                      {proximo && !vencido && <Clock size={12} className="text-yellow-400" />}
                      <span className={`text-xs font-medium ${vencido ? "text-red-400" : proximo ? "text-yellow-400" : "text-muted-foreground"}`}>
                        {o.data_previsao ? (vencido ? `${Math.abs(o.dias)}d atrasada` : `${o.dias}d restantes`) : "—"}
                      </span>
                    </div>
                  </div>
                  <ProgressBar
                    value={o.realizado}
                    max={o.previsto}
                    color={pct > 90 ? "bg-red-500/10" : pct > 70 ? "bg-yellow-500/10" : "bg-primary/10"}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Realizado: {fmt(o.realizado)}</span>
                    <span>Previsto: {fmt(o.previsto)} ({pct.toFixed(0)}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Estoque de Materiais */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Package size={14} className="text-green-400" /> Estoque de Materiais</h3>
            <button onClick={() => onTabChange("materiais")} className="text-xs text-primary hover:underline flex items-center gap-1">Detalhar <ChevronRight size={12} /></button>
          </div>

          {/* Seletor de obra */}
          <select
            value={obraFoco || ""}
            onChange={e => setObraFoco(e.target.value)}
            className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground mb-4"
          >
            <option value="">Todas as obras</option>
            {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
          </select>

          {Object.keys(estoqueCategoria).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum material registrado para esta obra.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(estoqueCategoria).sort((a, b) => b[1] - a[1]).map(([cat, val]) => (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-foreground font-medium">{cat}</span>
                    <span className="text-muted-foreground">{fmt(val)}</span>
                  </div>
                  <ProgressBar
                    value={val}
                    max={Object.values(estoqueCategoria).reduce((s, v) => s + v, 0)}
                    color="bg-green-500/10"
                  />
                </div>
              ))}
              <div className="pt-2 border-t border-border flex justify-between text-xs">
                <span className="text-muted-foreground">Total materiais</span>
                <span className="font-bold text-foreground">{fmt(Object.values(estoqueCategoria).reduce((s, v) => s + v, 0))}</span>
              </div>
            </div>
          )}

          {/* Detalhes dos itens */}
          {focoData && focoData.matItens.length > 0 && (
            <div className="mt-4 border-t border-border pt-3 space-y-1 max-h-40 overflow-y-auto">
              <p className="text-xs font-medium text-muted-foreground mb-2">Itens de material</p>
              {focoData.matItens.map((m, i) => (
                <div key={i} className="flex justify-between text-xs py-1 border-b border-border/30">
                  <span className="text-foreground truncate max-w-[60%]">{m.produto}</span>
                  <span className="text-muted-foreground">{m.quantidade} × {fmt(m.valor_unitario)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Parecer de IA para a obra em foco */}
      {obraAtiva && (
        <div className="mb-4">
          <ParecerIA 
            title="Análise e Gestão da Obra"
            prompt={`Analise a seguinte obra em progresso e forneça parecer sobre riscos, otimizações e recomendações:

Obra: ${obraAtiva.nome || "Sem nome"}
Cliente: ${obraAtiva.cliente || "N/A"}
Data Início: ${obraAtiva.data_inicio || "N/A"}
Data Previsão: ${obraAtiva.data_conclusao_prevista || "N/A"}
Status: ${obraAtiva.status || "N/A"}
Contrato: R$ ${obraAtiva.valor_contrato || 0}
Gasto Atual: R$ ${focoData?.custoRealizado || 0}

Materiais: R$ ${focoData?.matCusto || 0}
Mão de Obra: R$ ${focoData?.maoCusto || 0}
Despesas: R$ ${focoData?.despesasCusto || 0}

Análise: 1) Saúde orçamentária, 2) Riscos de estouro de prazo/orçamento, 3) Oportunidades de eficiência, 4) Recomendações de ação imediata`}
          />
        </div>
      )}

      {/* Alertas de prazo */}
      {atrasadas.length > 0 && (
        <div className="bg-red-500/10/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-red-400" />
            <h3 className="text-sm font-semibold text-red-400">Obras com prazo vencido</h3>
          </div>
          <div className="space-y-2">
            {atrasadas.map(o => (
              <div key={o.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{o.nome}</p>
                  <p className="text-xs text-muted-foreground">{o.cliente}</p>
                </div>
                <span className="text-xs text-red-400 font-medium">{Math.abs(o.dias)} dias em atraso</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}