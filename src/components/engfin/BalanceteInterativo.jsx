import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Plus, Trash2, Zap, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function BalanceteInterativo({ balancete, contas, onClose, onSave }) {
  const [form, setForm] = useState({
    titulo: balancete?.titulo || "",
    data_balancete: balancete?.data_balancete || new Date().toISOString().split("T")[0],
    periodo: balancete?.periodo || "",
    movimentacoes: balancete?.movimentacoes || [],
    observacoes: balancete?.observacoes || "",
  });
  const [gerando, setGerando] = useState(false);
  const [parecer, setParecer] = useState(balancete?.parecer_ia || null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const contasAgrupadas = contas.reduce((acc, c) => {
    if (!acc[c.tipo]) acc[c.tipo] = [];
    acc[c.tipo].push(c);
    return acc;
  }, {});

  const addLinha = () => {
    setForm(f => ({
      ...f,
      movimentacoes: [...f.movimentacoes, {
        conta_id: "",
        conta_codigo: "",
        conta_nome: "",
        tipo_conta: "",
        grupo: "",
        saldo_inicial_debito: 0,
        saldo_inicial_credito: 0,
        debito_periodo: 0,
        credito_periodo: 0,
        saldo_final_debito: 0,
        saldo_final_credito: 0
      }]
    }));
  };

  const removeLinha = (idx) => {
    setForm(f => ({
      ...f,
      movimentacoes: f.movimentacoes.filter((_, i) => i !== idx)
    }));
  };

  const updateLinha = (idx, field, value) => {
    setForm(f => {
      const movs = [...f.movimentacoes];
      movs[idx] = { ...movs[idx], [field]: value };
      
      // Recalcular saldo final
      if (field.includes("inicial") || field.includes("periodo")) {
        const ini_deb = parseFloat(movs[idx].saldo_inicial_debito) || 0;
        const ini_cred = parseFloat(movs[idx].saldo_inicial_credito) || 0;
        const per_deb = parseFloat(movs[idx].debito_periodo) || 0;
        const per_cred = parseFloat(movs[idx].credito_periodo) || 0;
        
        movs[idx].saldo_final_debito = Math.round((ini_deb + per_deb) * 100) / 100;
        movs[idx].saldo_final_credito = Math.round((ini_cred + per_cred) * 100) / 100;
      }
      
      return { ...f, movimentacoes: movs };
    });
  };

  const selectConta = (idx, contaId) => {
    const conta = contas.find(c => c.id === contaId);
    if (conta) {
      updateLinha(idx, "conta_id", conta.id);
      updateLinha(idx, "conta_codigo", conta.codigo);
      updateLinha(idx, "conta_nome", conta.nome);
      updateLinha(idx, "tipo_conta", conta.tipo);
      updateLinha(idx, "grupo", conta.grupo);
    }
  };

  const calcularTotais = () => {
    let totais = {
      total_debito_inicial: 0,
      total_credito_inicial: 0,
      total_debito_periodo: 0,
      total_credito_periodo: 0,
      total_debito_final: 0,
      total_credito_final: 0
    };

    form.movimentacoes.forEach(m => {
      totais.total_debito_inicial += parseFloat(m.saldo_inicial_debito) || 0;
      totais.total_credito_inicial += parseFloat(m.saldo_inicial_credito) || 0;
      totais.total_debito_periodo += parseFloat(m.debito_periodo) || 0;
      totais.total_credito_periodo += parseFloat(m.credito_periodo) || 0;
      totais.total_debito_final += parseFloat(m.saldo_final_debito) || 0;
      totais.total_credito_final += parseFloat(m.saldo_final_credito) || 0;
    });

    Object.keys(totais).forEach(k => {
      totais[k] = Math.round(totais[k] * 100) / 100;
    });

    return totais;
  };

  const gerarParecer = async () => {
    if (!form.titulo || form.movimentacoes.length === 0) {
      toast({ title: "✗ Erro", description: "Preencha título e adicione contas", variant: "destructive" });
      return;
    }

    setGerando(true);
    try {
      const totais = calcularTotais();
      const prompt = `Analise este balancete de ${form.periodo} e forneça parecer técnico:

Título: ${form.titulo}

**Saldos Iniciais:**
- Débito: ${fmt(totais.total_debito_inicial)}
- Crédito: ${fmt(totais.total_credito_inicial)}

**Movimentação do Período:**
- Débito: ${fmt(totais.total_debito_periodo)}
- Crédito: ${fmt(totais.total_credito_periodo)}

**Saldos Finais:**
- Débito: ${fmt(totais.total_debito_final)}
- Crédito: ${fmt(totais.total_credito_final)}

Contas registradas: ${form.movimentacoes.length}
Equilíbrio: Débito ${totais.total_debito_final === totais.total_credito_final ? "=" : "≠"} Crédito

Forneça: análise da posição, alertas contábeis e recomendações.`;

      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            analise: { type: "string" },
            recomendacoes: { type: "array", items: { type: "string" } },
            alertas: { type: "array", items: { type: "string" } }
          }
        }
      });

      setParecer({
        ...res,
        timestamp: new Date().toLocaleString("pt-BR")
      });

      toast({ title: "✓ Parecer Gerado" });
    } catch (err) {
      toast({ title: "✗ Erro", description: err.message, variant: "destructive" });
    } finally {
      setGerando(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const totais = calcularTotais();
    await onSave({
      ...form,
      totais,
      parecer_ia: parecer,
      status: parecer ? "analisado" : "balancete_gerado"
    });
    setSaving(false);
  };

  const totais = calcularTotais();

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-6xl shadow-2xl max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-base font-semibold text-foreground">{balancete ? "Editar" : "Novo"} Balancete</h2>
          <button onClick={onClose}><X size={18} className="text-muted-foreground" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Header */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Título *</label>
              <input required value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Data *</label>
              <input type="date" required value={form.data_balancete} onChange={e => setForm(f => ({ ...f, data_balancete: e.target.value }))}
                className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Período *</label>
              <input required value={form.periodo} onChange={e => setForm(f => ({ ...f, periodo: e.target.value }))} placeholder="Ex: 2026-06"
                className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
          </div>

          {/* Tabela Balancete */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Movimentações por Conta</p>
              <button type="button" onClick={addLinha} className="text-xs text-primary hover:underline flex items-center gap-1">
                <Plus size={12} /> Adicionar Conta
              </button>
            </div>

            <div className="overflow-x-auto border border-border rounded-lg bg-card">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted border-b border-border sticky top-0">
                    <th className="text-left px-2 py-2 font-semibold">Código</th>
                    <th className="text-left px-2 py-2 font-semibold">Conta</th>
                    <th className="text-right px-2 py-2 font-semibold">S.Ini Deb</th>
                    <th className="text-right px-2 py-2 font-semibold">S.Ini Cre</th>
                    <th className="text-right px-2 py-2 font-semibold">Deb.Per</th>
                    <th className="text-right px-2 py-2 font-semibold">Cre.Per</th>
                    <th className="text-right px-2 py-2 font-semibold">S.Fin Deb</th>
                    <th className="text-right px-2 py-2 font-semibold">S.Fin Cre</th>
                    <th className="text-center px-2 py-2 font-semibold w-6">✕</th>
                  </tr>
                </thead>
                <tbody>
                  {form.movimentacoes.map((m, idx) => (
                    <tr key={idx} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="px-2 py-1">
                        <select value={m.conta_id} onChange={e => selectConta(idx, e.target.value)} className="w-full bg-card border border-border rounded px-1 py-0.5 text-xs focus:outline-none focus:border-primary">
                          <option value="">Selecionar...</option>
                          {Object.entries(contasAgrupadas).map(([tipo, cs]) => (
                            <optgroup key={tipo} label={tipo}>
                              {cs.map(c => <option key={c.id} value={c.id}>{c.codigo}</option>)}
                            </optgroup>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1 text-left text-xs text-muted-foreground">{m.conta_nome}</td>
                      <td className="px-2 py-1"><input type="number" step="0.01" value={m.saldo_inicial_debito} onChange={e => updateLinha(idx, "saldo_inicial_debito", parseFloat(e.target.value) || 0)} className="w-full bg-card border border-border rounded px-1 py-0.5 text-xs text-right" /></td>
                      <td className="px-2 py-1"><input type="number" step="0.01" value={m.saldo_inicial_credito} onChange={e => updateLinha(idx, "saldo_inicial_credito", parseFloat(e.target.value) || 0)} className="w-full bg-card border border-border rounded px-1 py-0.5 text-xs text-right" /></td>
                      <td className="px-2 py-1"><input type="number" step="0.01" value={m.debito_periodo} onChange={e => updateLinha(idx, "debito_periodo", parseFloat(e.target.value) || 0)} className="w-full bg-card border border-border rounded px-1 py-0.5 text-xs text-right" /></td>
                      <td className="px-2 py-1"><input type="number" step="0.01" value={m.credito_periodo} onChange={e => updateLinha(idx, "credito_periodo", parseFloat(e.target.value) || 0)} className="w-full bg-card border border-border rounded px-1 py-0.5 text-xs text-right" /></td>
                      <td className="px-2 py-1 text-right text-xs font-semibold text-green-400">{fmt(m.saldo_final_debito)}</td>
                      <td className="px-2 py-1 text-right text-xs font-semibold text-blue-400">{fmt(m.saldo_final_credito)}</td>
                      <td className="px-2 py-1 text-center"><button type="button" onClick={() => removeLinha(idx)} className="text-red-400 hover:text-red-300"><Trash2 size={12} /></button></td>
                    </tr>
                  ))}
                  <tr className="bg-primary/10 border-t-2 border-primary">
                    <td colSpan="2" className="px-2 py-2 font-bold text-foreground">TOTAIS</td>
                    <td className="px-2 py-2 text-right font-bold text-green-400">{fmt(totais.total_debito_inicial)}</td>
                    <td className="px-2 py-2 text-right font-bold text-blue-400">{fmt(totais.total_credito_inicial)}</td>
                    <td className="px-2 py-2 text-right font-bold text-green-400">{fmt(totais.total_debito_periodo)}</td>
                    <td className="px-2 py-2 text-right font-bold text-blue-400">{fmt(totais.total_credito_periodo)}</td>
                    <td className="px-2 py-2 text-right font-bold text-green-400">{fmt(totais.total_debito_final)}</td>
                    <td className="px-2 py-2 text-right font-bold text-blue-400">{fmt(totais.total_credito_final)}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {totais.total_debito_final !== totais.total_credito_final && (
              <div className="p-2 bg-yellow-400/10 border border-yellow-400/30 rounded text-xs text-yellow-600">
                ⚠️ Balancete desbalanceado: Débito {fmt(totais.total_debito_final)} ≠ Crédito {fmt(totais.total_credito_final)}
              </div>
            )}
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Observações</label>
            <textarea rows="2" value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary resize-none" />
          </div>

          {parecer && (
            <div className="p-3 bg-green-400/10 border border-green-400/30 rounded text-xs text-green-600">
              ✓ Parecer gerado em {parecer.timestamp}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={gerarParecer} disabled={gerando} className="flex-1 py-2 rounded text-sm bg-primary/10/20 text-blue-400 font-medium hover:bg-primary/10/30 disabled:opacity-50 flex items-center justify-center gap-2">
              <Zap size={14} /> {gerando ? "Analisando..." : "Gerar Parecer IA"}
            </button>
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-muted text-muted-foreground rounded text-sm">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 bg-primary text-primary-foreground rounded text-sm disabled:opacity-50">
              {saving ? "Salvando..." : "Salvar Balancete"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}