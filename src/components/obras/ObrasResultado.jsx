import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { fmt } from "./ObrasUtils";
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react";

export default function ObrasResultado() {
  const [obras, setObras] = useState([]);
  const [materiais, setMateriais] = useState([]);
  const [mao, setMao] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [obraId, setObraId] = useState("");
  const [loadingIA, setLoadingIA] = useState(false);
  const [parecer, setParecer] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Obra.list(),
      base44.entities.MaterialObra.list(),
      base44.entities.MaoDeObraObra.list(),
      base44.entities.DespesaObra.list(),
    ]).then(([o, m, mo, d]) => {
      setObras(o); setMateriais(m); setMao(mo); setDespesas(d);
      setLoading(false);
      if (o.length > 0) setObraId(o[0].id);
    });
  }, []);

  const obra = obras.find(o => o.id === obraId);
  const mat = materiais.filter(m => m.obra_id === obraId).reduce((s, m) => s + (m.valor_total || 0), 0);
  const maoTotal = mao.filter(m => m.obra_id === obraId).reduce((s, m) => s + (m.valor_total || 0), 0);
  const desp = despesas.filter(d => d.obra_id === obraId).reduce((s, d) => s + (d.valor || 0), 0);
  const contrato = obra?.valor_contrato || 0;
  const custo = mat + maoTotal + desp;
  const lucro = contrato - custo;
  const margem = contrato > 0 ? ((lucro / contrato) * 100).toFixed(1) : 0;

  const gerarParecer = async () => {
    if (!obra) return;
    setLoadingIA(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Analise o resultado financeiro desta obra de construção civil e dê um parecer objetivo em 2-3 frases:
Obra: ${obra.nome}
Valor do Contrato: ${fmt(contrato)}
Custo de Materiais: ${fmt(mat)}
Mão de Obra: ${fmt(maoTotal)}
Outras Despesas: ${fmt(desp)}
Custo Total: ${fmt(custo)}
Lucro: ${fmt(lucro)}
Margem: ${margem}%
Status: ${obra.status}

Responda de forma direta, prática e em português, avaliando se a margem é saudável, quais riscos existem e o que deve ser monitorado.`,
    });
    setParecer(result);
    setLoadingIA(false);
  };

  if (loading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-base font-semibold text-foreground">Resultado da Obra</h2>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">com lucro/prejuízo e parecer IA</span>
      </div>

      {obras.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground"><p className="text-sm">Nenhuma obra cadastrada</p></div>
      ) : (
        <>
          <select value={obraId} onChange={e => { setObraId(e.target.value); setParecer(""); }}
            className="w-80 bg-card border-2 border-yellow-500 rounded-lg px-4 py-2.5 text-sm font-semibold text-foreground focus:outline-none mb-6">
            {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
          </select>

          {obra && (
            <div className="space-y-4">
              {/* Resultado principal */}
              <div className="bg-card border border-border rounded-xl p-6">
                <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">{obra.nome}</p>
                <p className="text-xs text-muted-foreground mb-3">Resultado final</p>
                <div className="flex items-baseline gap-3">
                  <span className={`text-4xl font-bold ${lucro >= 0 ? "text-green-400" : "text-red-400"}`}>{fmt(lucro)}</span>
                  <span className={`text-lg font-medium ${parseFloat(margem) >= 0 ? "text-green-400" : "text-red-400"}`}>{margem}% margem</span>
                  {lucro >= 0 ? <TrendingUp size={24} className="text-green-400" /> : <TrendingDown size={24} className="text-red-400" />}
                </div>
              </div>

              {/* Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Receita (Contrato)", value: contrato, color: "text-green-400" },
                  { label: "Custo de Materiais", value: mat, color: "text-red-400" },
                  { label: "Mão de Obra", value: maoTotal, color: "text-yellow-400" },
                  { label: "Outras Despesas", value: desp, color: "text-yellow-400" },
                  { label: "Custo Total", value: custo, color: "text-red-400" },
                  { label: "Valor de Lucro", value: lucro > 0 ? lucro : 0, color: "text-green-400" },
                  { label: "Valor de Prejuízo", value: lucro < 0 ? Math.abs(lucro) : 0, color: "text-red-400" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-card border border-border rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-1">{label}</p>
                    <p className={`text-base font-bold ${color}`}>{fmt(value)}</p>
                  </div>
                ))}
              </div>

              {/* Parecer IA */}
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-blue-400">Parecer de IA</h3>
                  <button onClick={gerarParecer} disabled={loadingIA}
                    className="flex items-center gap-2 px-4 py-1.5 bg-blue-600/10 border border-blue-600/20 text-blue-400 rounded-lg text-xs hover:bg-blue-600/20 disabled:opacity-50">
                    {loadingIA ? <><Loader2 size={12} className="animate-spin" /> Gerando...</> : "Gerar Parecer"}
                  </button>
                </div>
                {parecer ? (
                  <p className="text-sm text-muted-foreground leading-relaxed">{parecer}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Clique em "Gerar Parecer" para obter uma análise de IA sobre o resultado desta obra.</p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}