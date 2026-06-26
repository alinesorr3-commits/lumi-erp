import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Plus, Trash2, Zap, BookOpen } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

// Extrai valores do Plano de Contas para pré-popular a análise
function extrairDadosPlano(contas) {
  const soma = (prefixos, nivel = 2) => contas
    .filter(c => prefixos.some(p => c.codigo?.startsWith(p)) && (c.hierarquia_nivel ?? (c.codigo?.split(".").length - 1)) >= nivel)
    .reduce((s, c) => s + (c.valor || 0), 0);

  const receitaBruta = soma(["4.1"]);
  const deducoes = soma(["4.2"]);
  const custos = soma(["5"]) + soma(["6.1"]) + soma(["6.2"]) + soma(["6.3"]);
  const recLiq = receitaBruta - deducoes;
  const lucro = recLiq - custos;

  return {
    lucro_acumulado: Math.max(0, lucro),
    saldo_acumulado: soma(["1.1.01"]),   // Disponibilidades
    caixa_imobilizado: soma(["1.1.01.01", "1.1.01.02", "1.2.01"]),
    passivo_circulante: soma(["2.1"]),
    passivo_nao_circulante: soma(["2.2"]),
    capital_social: soma(["3.1"]),
  };
}

export default function AnaliseTecnicaModal({ analise, onClose, onSave }) {
  const [form, setForm] = useState({
    titulo: analise?.titulo || "",
    data_analise: analise?.data_analise || new Date().toISOString().split("T")[0],
    periodo: analise?.periodo || "",
    lancamentos_manuais: analise?.lancamentos_manuais || [],
    lucro_acumulado: analise?.lucro_acumulado || 0,
    saldo_acumulado: analise?.saldo_acumulado || 0,
    caixa_imobilizado: analise?.caixa_imobilizado || 0,
    passivo_circulante: analise?.passivo_circulante || 0,
    passivo_nao_circulante: analise?.passivo_nao_circulante || 0,
    capital_social: analise?.capital_social || 0,
    imposto_diferido: analise?.imposto_diferido || 0,
    calculo_imposto: analise?.calculo_imposto || { rcpc: 0, pis: 0, cofins: 0, irpj: 0, csll: 0 },
    observacoes: analise?.observacoes || "",
  });
  const [uploading, setUploading] = useState(false);
  const [balanceUrl, setBalanceUrl] = useState(analise?.balancete_pdf || "");
  const [saving, setSaving] = useState(false);
  const [parecer, setParecer] = useState(analise?.parecer_ia || null);
  const [gerandoParacer, setGerandoParacer] = useState(false);
  const [planoDisponivel, setPlanoDisponivel] = useState(false);
  const { toast } = useToast();

  // Carrega Plano de Contas e pré-popula campos contábeis se for análise nova
  useEffect(() => {
    base44.entities.PlanoContas.list("codigo").then(contas => {
      if (!contas || contas.length === 0) return;
      setPlanoDisponivel(true);
      if (!analise) {
        // Só pré-popula em análise nova
        const dados = extrairDadosPlano(contas);
        setForm(f => ({ ...f, ...dados }));
      }
    });
  }, []);

  const addLancamento = () => {
    setForm(f => ({
      ...f,
      lancamentos_manuais: [...f.lancamentos_manuais, { conta: "", descricao: "", valor_dn: 0, valor_cr: 0 }]
    }));
  };

  const removeLancamento = (idx) => {
    setForm(f => ({
      ...f,
      lancamentos_manuais: f.lancamentos_manuais.filter((_, i) => i !== idx)
    }));
  };

  const updateLancamento = (idx, field, value) => {
    setForm(f => {
      const lancamentos = [...f.lancamentos_manuais];
      lancamentos[idx] = { ...lancamentos[idx], [field]: value };
      return { ...f, lancamentos_manuais: lancamentos };
    });
  };

  const updateImposto = (campo, value) => {
    setForm(f => ({
      ...f,
      calculo_imposto: { ...f.calculo_imposto, [campo]: parseFloat(value) || 0 }
    }));
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setBalanceUrl(res.file_url);
      toast({ title: "✓ Arquivo enviado", description: "Balancete carregado com sucesso" });
    } catch (err) {
      toast({ title: "✗ Erro", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const gerarParecer = async () => {
    if (!form.titulo || !form.periodo) {
      toast({ title: "✗ Erro", description: "Preencha título e período", variant: "destructive" });
      return;
    }

    setGerandoParacer(true);
    try {
      // Tenta enriquecer com dados do Plano de Contas
      let contextoPlano = "";
      try {
        const contas = await base44.entities.PlanoContas.list("codigo");
        if (contas && contas.length > 0) {
          const soma = (prefixos) => contas
            .filter(c => prefixos.some(p => c.codigo?.startsWith(p)) && (c.hierarquia_nivel ?? (c.codigo?.split(".").length - 1)) >= 2)
            .reduce((s, c) => s + (c.valor || 0), 0);
          const recBruta = soma(["4.1"]);
          const deducoes = soma(["4.2"]);
          const custos = soma(["5"]) + soma(["6.1"]) + soma(["6.2"]) + soma(["6.3"]);
          const recLiq = recBruta - deducoes;
          const lucro = recLiq - custos;
          contextoPlano = `\n\n**DRE do Plano de Contas:**\n- Receita Bruta: ${fmt(recBruta)}\n- Deduções: ${fmt(deducoes)}\n- Receita Líquida: ${fmt(recLiq)}\n- Total de Custos/Despesas: ${fmt(custos)}\n- Resultado Operacional: ${fmt(lucro)}\n- Margem Operacional: ${recLiq > 0 ? ((lucro/recLiq)*100).toFixed(1) : 0}%`;
        }
      } catch (_) {}

      const prompt = `Você é um analista financeiro experiente. Analise os seguintes dados de engenharia financeira e forneça um parecer técnico detalhado:

**Análise: ${form.titulo}**
Período: ${form.periodo}

**Dados Contábeis (Balanço):**
- Lucro Acumulado: ${fmt(form.lucro_acumulado)}
- Saldo Acumulado (Disponibilidades): ${fmt(form.saldo_acumulado)}
- Caixa/Imobilizado: ${fmt(form.caixa_imobilizado)}
- Passivo Circulante: ${fmt(form.passivo_circulante)}
- Passivo Não Circulante: ${fmt(form.passivo_nao_circulante)}
- Capital Social: ${fmt(form.capital_social)}
- Imposto Diferido: ${fmt(form.imposto_diferido)}${contextoPlano}

**Impostos Apurados:**
- RCPC: ${fmt(form.calculo_imposto.rcpc)}
- PIS: ${fmt(form.calculo_imposto.pis)}
- COFINS: ${fmt(form.calculo_imposto.cofins)}
- IRPJ: ${fmt(form.calculo_imposto.irpj)}
- CSLL: ${fmt(form.calculo_imposto.csll)}

Forneça:
1. Análise da situação financeira e patrimonial
2. Recomendações de otimização tributária baseadas nos dados
3. Alertas e pontos críticos (liquidez, endividamento, lucratividade)
4. Sugestões estratégicas de melhoria`;

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
        analise: res.analise,
        recomendacoes: res.recomendacoes,
        alertas: res.alertas,
        timestamp: new Date().toLocaleString("pt-BR")
      });

      toast({ title: "✓ Parecer Gerado", description: "Análise técnica completada" });
    } catch (err) {
      toast({ title: "✗ Erro", description: err.message, variant: "destructive" });
    } finally {
      setGerandoParacer(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      ...form,
      balancete_pdf: balanceUrl,
      parecer_ia: parecer,
      status: parecer ? "relatorio_gerado" : "analise_completa",
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-4xl shadow-2xl max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-base font-semibold text-foreground">{analise ? "Editar" : "Nova"} Análise Técnica</h2>
          <button onClick={onClose}><X size={18} className="text-muted-foreground" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Informações Básicas */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Título *</label>
              <input required value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Data da Análise *</label>
              <input type="date" required value={form.data_analise} onChange={e => setForm(f => ({ ...f, data_analise: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Período *</label>
              <input required value={form.periodo} onChange={e => setForm(f => ({ ...f, periodo: e.target.value }))} placeholder="Ex: 2026-Q1"
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
          </div>

          {/* Upload Balancete */}
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Balancete (PDF)</label>
            <div className="flex gap-2">
              <label className="flex-1 flex items-center gap-2 px-4 py-2 bg-muted border border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50">
                <Zap size={14} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{uploading ? "Enviando..." : "Clique para upload"}</span>
                <input type="file" onChange={handleUpload} disabled={uploading} accept=".pdf" className="hidden" />
              </label>
              {balanceUrl && <a href={balanceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline px-3 py-2">Ver arquivo</a>}
            </div>
          </div>

          {/* Dados Contábeis */}
          <div className="p-4 bg-muted/30 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Posição Contábil</p>
              {planoDisponivel && (
                <button type="button" onClick={async () => {
                  const contas = await base44.entities.PlanoContas.list("codigo");
                  const dados = extrairDadosPlano(contas);
                  setForm(f => ({ ...f, ...dados }));
                  toast({ title: "✓ Sincronizado", description: "Campos atualizados com o Plano de Contas" });
                }} className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                  <BookOpen size={11} /> Sincronizar com Plano de Contas
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Lucro Acumulado (R$)</label>
                <input type="number" step="0.01" value={form.lucro_acumulado} onChange={e => setForm(f => ({ ...f, lucro_acumulado: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-card border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Saldo Acumulado (R$)</label>
                <input type="number" step="0.01" value={form.saldo_acumulado} onChange={e => setForm(f => ({ ...f, saldo_acumulado: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-card border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Caixa/Imobilizado (R$)</label>
                <input type="number" step="0.01" value={form.caixa_imobilizado} onChange={e => setForm(f => ({ ...f, caixa_imobilizado: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-card border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Passivo Circulante (R$)</label>
                <input type="number" step="0.01" value={form.passivo_circulante} onChange={e => setForm(f => ({ ...f, passivo_circulante: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-card border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Passivo Não Circulante (R$)</label>
                <input type="number" step="0.01" value={form.passivo_nao_circulante} onChange={e => setForm(f => ({ ...f, passivo_nao_circulante: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-card border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Capital Social (R$)</label>
                <input type="number" step="0.01" value={form.capital_social} onChange={e => setForm(f => ({ ...f, capital_social: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-card border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
            </div>
          </div>

          {/* Cálculo de Impostos */}
          <div className="p-4 bg-blue-400/10 border border-blue-400/30 rounded-lg space-y-3">
            <p className="text-xs font-semibold text-blue-400 uppercase">Cálculo de Impostos</p>
            <div className="grid grid-cols-5 gap-2">
              {[
                { key: "rcpc", label: "RCPC" },
                { key: "pis", label: "PIS" },
                { key: "cofins", label: "COFINS" },
                { key: "irpj", label: "IRPJ" },
                { key: "csll", label: "CSLL" }
              ].map(imp => (
                <div key={imp.key}>
                  <label className="block text-xs text-muted-foreground mb-1">{imp.label}</label>
                  <input type="number" step="0.01" value={form.calculo_imposto[imp.key]} onChange={e => updateImposto(imp.key, e.target.value)}
                    className="w-full bg-card border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:border-primary" />
                </div>
              ))}
            </div>
          </div>

          {/* Lançamentos Manuais */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-muted-foreground">Lançamentos Manuais (estudo)</label>
              <button type="button" onClick={addLancamento} className="text-xs text-primary hover:underline flex items-center gap-1">
                <Plus size={12} /> Adicionar
              </button>
            </div>
            {form.lancamentos_manuais.length > 0 && (
              <div className="overflow-x-auto border border-border rounded-lg bg-card">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted border-b border-border">
                      <th className="text-left px-3 py-2 font-semibold">Conta</th>
                      <th className="text-left px-3 py-2 font-semibold">Descrição</th>
                      <th className="text-right px-3 py-2 font-semibold">Débito</th>
                      <th className="text-right px-3 py-2 font-semibold">Crédito</th>
                      <th className="text-center px-3 py-2 font-semibold">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.lancamentos_manuais.map((l, idx) => (
                      <tr key={idx} className="border-b border-border/50">
                        <td className="px-3 py-2"><input type="text" value={l.conta} onChange={e => updateLancamento(idx, "conta", e.target.value)} className="w-full bg-muted border border-border rounded px-2 py-1 text-xs" /></td>
                        <td className="px-3 py-2"><input type="text" value={l.descricao} onChange={e => updateLancamento(idx, "descricao", e.target.value)} className="w-full bg-muted border border-border rounded px-2 py-1 text-xs" /></td>
                        <td className="px-3 py-2"><input type="number" step="0.01" value={l.valor_dn} onChange={e => updateLancamento(idx, "valor_dn", parseFloat(e.target.value) || 0)} className="w-full bg-muted border border-border rounded px-2 py-1 text-xs text-right" /></td>
                        <td className="px-3 py-2"><input type="number" step="0.01" value={l.valor_cr} onChange={e => updateLancamento(idx, "valor_cr", parseFloat(e.target.value) || 0)} className="w-full bg-muted border border-border rounded px-2 py-1 text-xs text-right" /></td>
                        <td className="px-3 py-2 text-center"><button type="button" onClick={() => removeLancamento(idx)} className="text-red-400 hover:text-red-300"><Trash2 size={12} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Observações</label>
            <textarea rows={2} value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary resize-none" />
          </div>

          {/* Parecer IA */}
          {parecer && (
            <div className="p-4 bg-green-400/10 border border-green-400/30 rounded-lg space-y-2">
              <p className="text-xs font-semibold text-green-400">✓ Parecer Técnico Gerado</p>
              <p className="text-xs text-muted-foreground italic">{parecer.timestamp}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={gerarParecer} disabled={gerandoParacer || !form.titulo} className="flex-1 py-2.5 rounded-lg text-sm bg-primary/10/20 text-blue-400 font-medium hover:bg-primary/10/30 disabled:opacity-50 flex items-center justify-center gap-2">
              <Zap size={14} /> {gerandoParacer ? "Analisando..." : "Gerar Parecer IA"}
            </button>
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-muted text-muted-foreground rounded-lg text-sm">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm disabled:opacity-50">
              {saving ? "Salvando..." : "Salvar Análise"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}