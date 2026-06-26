import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Wallet, Target, Landmark } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function SaldosEMetas({ lancamentos }) {
  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metaMensal, setMetaMensal] = useState(100000); // Fixed for now or editable via localStorage
  const [editMeta, setEditMeta] = useState(false);
  const [novaMeta, setNovaMeta] = useState("");

  useEffect(() => {
    const savedMeta = localStorage.getItem("@lumi-meta-receita");
    if (savedMeta) setMetaMensal(Number(savedMeta));
    
    base44.entities.ContaBancaria.list().then((data) => {
      setContas(data.filter(c => c.ativa !== false));
      setLoading(false);
    });
  }, []);

  const handleSaveMeta = () => {
    const val = parseFloat(novaMeta);
    if (!isNaN(val) && val > 0) {
      setMetaMensal(val);
      localStorage.setItem("@lumi-meta-receita", val.toString());
    }
    setEditMeta(false);
  };

  const saldosContas = contas.map(conta => {
    const movs = (lancamentos || []).filter(m => m.conta_bancaria_id === conta.id && m.status === "pago");
    const receitas = movs.filter(m => m.tipo === "receita").reduce((s, m) => s + (m.valor_pago !== undefined && m.valor_pago !== null && m.valor_pago !== "" ? Number(m.valor_pago) : (Number(m.valor) || 0) + (Number(m.juros_multas) || 0)), 0);
    const despesas = movs.filter(m => m.tipo === "despesa").reduce((s, m) => s + (m.valor_pago !== undefined && m.valor_pago !== null && m.valor_pago !== "" ? Number(m.valor_pago) : (Number(m.valor) || 0) + (Number(m.juros_multas) || 0)), 0);
    return {
      ...conta,
      saldo: (conta.saldo_inicial || 0) + receitas - despesas
    };
  });

  const saldoTotal = saldosContas.reduce((s, c) => s + c.saldo, 0);

  const hoje = new Date();
  const inicio = format(startOfMonth(hoje), "yyyy-MM-dd");
  const fim = format(endOfMonth(hoje), "yyyy-MM-dd");

  const receitasMes = (lancamentos || [])
    .filter(l => l.tipo === "receita" && l.status === "pago" && l.data_pagamento >= inicio && l.data_pagamento <= fim)
    .reduce((s, l) => s + (l.valor_pago !== undefined && l.valor_pago !== null && l.valor_pago !== "" ? Number(l.valor_pago) : (Number(l.valor) || 0) + (Number(l.juros_multas) || 0)), 0);

  const progresso = metaMensal > 0 ? Math.min((receitasMes / metaMensal) * 100, 100) : 0;

  if (loading) {
    return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Saldo Total */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-lg text-primary">
              <Wallet size={24} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Saldo Total (Contas Ativas)</h2>
              <p className="text-xs text-muted-foreground">Soma de todas as contas cadastradas</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground mb-6">{fmt(saldoTotal)}</p>
          
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {saldosContas.map(conta => (
              <div key={conta.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="flex items-center gap-2">
                  <Landmark size={16} className="text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{conta.nome}</p>
                    <p className="text-xs text-muted-foreground">{conta.banco}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${conta.saldo >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {fmt(conta.saldo)}
                </span>
              </div>
            ))}
            {saldosContas.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhuma conta bancária ativa encontrada.</p>
            )}
          </div>
        </div>

        {/* Metas de Receita */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/10/10 rounded-lg text-green-500">
                <Target size={24} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Objetivo de Receita</h2>
                <p className="text-xs text-muted-foreground capitalize">{format(hoje, "MMMM 'de' yyyy", { locale: ptBR })}</p>
              </div>
            </div>
            {editMeta ? (
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Nova meta"
                  className="bg-muted border border-border rounded px-2 py-1 text-sm w-24 outline-none"
                  value={novaMeta}
                  onChange={e => setNovaMeta(e.target.value)}
                  autoFocus
                />
                <button onClick={handleSaveMeta} className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">Salvar</button>
              </div>
            ) : (
              <button onClick={() => { setNovaMeta(metaMensal); setEditMeta(true); }} className="text-xs text-muted-foreground hover:underline">
                Editar Meta
              </button>
            )}
          </div>
          
          <div className="mt-8">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Receita Atual</p>
                <p className="text-2xl font-bold text-green-500">{fmt(receitasMes)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">Meta</p>
                <p className="text-lg font-semibold text-foreground">{fmt(metaMensal)}</p>
              </div>
            </div>
            
            <div className="h-3 bg-muted rounded-full overflow-hidden mt-4">
              <div 
                className="h-full bg-green-500/10 rounded-full transition-all duration-500"
                style={{ width: `${progresso}%` }}
              />
            </div>
            <p className="text-xs text-right mt-2 text-muted-foreground font-medium">{progresso.toFixed(1)}% alcançado</p>
          </div>
        </div>
      </div>
    </div>
  );
}