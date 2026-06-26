import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Plus, Trash2, Upload, Calculator } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function FichaTecnicaModal({ ficha, onClose, onSave }) {
  const [form, setForm] = useState({
    produto_id:             ficha?.produto_id || "",
    produto_codigo:         ficha?.produto_codigo || "",
    produto_descricao:      ficha?.produto_descricao || "",
    versao:                 ficha?.versao || 1,
    insumos:                ficha?.insumos || [],
    
    valor_instalacao:       ficha?.valor_instalacao || 0,
    valor_munk:             ficha?.valor_munk || 0,
    valor_fundacao:         ficha?.valor_fundacao || 0,
    percentual_imposto:     ficha?.percentual_imposto || 0,
    margem_lucro:           ficha?.margem_lucro || 0,
    preco_venda_manual:     ficha?.preco_venda_manual || 0,

    planilha_engenheiro_url: ficha?.planilha_engenheiro_url || "",
    observacoes:            ficha?.observacoes || "",
  });
  const [produtos, setProdutos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    base44.entities.ProdutoServico.list().then(setProdutos);
  }, []);

  // ── Cálculos ────────────────────────────────────────────────────────
  const calcLinhaTotal = (insumo) => {
    const unit = parseFloat(insumo.valor_unitario) || 0;
    const qtd  = parseFloat(insumo.quantidade_por_unidade) || 0;
    const desp = parseFloat(insumo.desperdicio_percentual) || 0;
    return unit * qtd * (1 + desp / 100);
  };

  const custoProducao = form.insumos.reduce((s, i) => s + calcLinhaTotal(i), 0);
  
  const vInstalacao = parseFloat(form.valor_instalacao) || 0;
  const vMunk = parseFloat(form.valor_munk) || 0;
  const vFundacao = parseFloat(form.valor_fundacao) || 0;
  const pImposto = parseFloat(form.percentual_imposto) || 0;
  const pMargem = parseFloat(form.margem_lucro) || 0;
  const precoVendaManual = parseFloat(form.preco_venda_manual) || 0;

  const custoBase = custoProducao + vInstalacao + vMunk + vFundacao;
  
  // Cálculo do preço sugerido para atingir a margem desejada
  let divisor = 1 - (pImposto / 100) - (pMargem / 100);
  if (divisor <= 0.01) divisor = 0.01;
  const precoSugerido = custoBase / divisor;

  const valorImposto = precoVendaManual * (pImposto / 100);
  const custoTotalReal = custoBase + valorImposto;
  const lucroReal = precoVendaManual - custoTotalReal;

  // ── Insumos ──────────────────────────────────────────────────────────
  const addInsumo = () => {
    setForm(f => ({
      ...f,
      insumos: [...f.insumos, {
        insumo_id: "", insumo_descricao: "", unidade: "UN",
        quantidade_por_unidade: 1, valor_unitario: 0, desperdicio_percentual: 0, isGenerico: true,
      }],
    }));
  };

  const removeInsumo = (idx) =>
    setForm(f => ({ ...f, insumos: f.insumos.filter((_, i) => i !== idx) }));

  const updInsumo = (idx, field, value) =>
    setForm(f => {
      const arr = [...f.insumos];
      arr[idx] = { ...arr[idx], [field]: value };
      return { ...f, insumos: arr };
    });

  const selectProdutoInsumo = (idx, prodId) => {
    const p = produtos.find(x => x.id === prodId);
    setForm(f => {
      const arr = [...f.insumos];
      arr[idx] = {
        ...arr[idx],
        insumo_id: prodId,
        insumo_descricao: p?.descricao || "",
        unidade: p?.unidade || "UN",
        valor_unitario: p?.preco_custo || 0,
        isGenerico: false,
      };
      return { ...f, insumos: arr };
    });
  };

  const handleImportarComposicao = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const up = await base44.integrations.Core.UploadFile({ file });
      const ex = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: up.file_url,
        json_schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  descricao:      { type: "string" },
                  unidade:        { type: "string" },
                  quantidade:     { type: "number" },
                  valor_unitario: { type: "number" },
                },
              },
            },
          },
        },
      });
      if (ex.status === "success" && ex.output?.items?.length) {
        const novos = ex.output.items.map(item => ({
          insumo_id: "", insumo_descricao: item.descricao || "",
          unidade: item.unidade || "UN",
          quantidade_por_unidade: item.quantidade || 0,
          valor_unitario: item.valor_unitario || 0,
          desperdicio_percentual: 0,
          isGenerico: true,
        }));
        setForm(f => ({ ...f, insumos: [...f.insumos, ...novos] }));
        alert(`${novos.length} item(ns) importado(s)!`);
      } else {
        alert("Não foi possível extrair dados do arquivo.");
      }
    } catch (err) {
      alert("Erro ao importar: " + err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.produto_id && !form.produto_descricao) {
      alert("Selecione ou informe o produto.");
      return;
    }
    setSaving(true);
    const insumosSalvos = form.insumos.map(i => ({
      insumo_id:             i.insumo_id || "",
      insumo_descricao:      i.insumo_descricao || "",
      unidade:               i.unidade || "UN",
      quantidade_por_unidade: parseFloat(i.quantidade_por_unidade) || 0,
      valor_unitario:        parseFloat(i.valor_unitario) || 0,
      desperdicio_percentual: parseFloat(i.desperdicio_percentual) || 0,
      custo_unitario:        calcLinhaTotal(i),
      isGenerico:            !!i.isGenerico,
    }));
    await onSave({
      ...form,
      insumos:            insumosSalvos,
      custo_total_unitario: custoTotalReal,
    });
    setSaving(false);
  };

  const inputCls = "w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary";
  const tdInput = "w-full bg-card border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-5xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-base font-semibold text-foreground">{ficha ? "Editar" : "Nova"} Ficha Técnica de Produção</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-6">

          {/* Produto + Versão */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-muted-foreground mb-1.5">Produto a Fabricar *</label>
              <div className="relative">
                <input
                  type="text"
                  list="produtos-estoque-list"
                  value={form.produto_descricao}
                  onChange={e => {
                    const val = e.target.value;
                    const p = produtos.find(x => x.descricao === val);
                    setForm(f => ({
                      ...f,
                      produto_descricao: val,
                      produto_id: p ? p.id : "",
                      produto_codigo: p ? p.codigo : ""
                    }));
                  }}
                  placeholder="Ex: Pilar pré-moldado com cava 25x25x7,50"
                  className={inputCls}
                />
                <datalist id="produtos-estoque-list">
                  {produtos.map(p => <option key={p.id} value={p.descricao} />)}
                </datalist>
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Versão da Ficha</label>
              <input type="number" min="1" value={form.versao}
                onChange={e => setForm(f => ({ ...f, versao: parseInt(e.target.value) || 1 }))}
                className={inputCls} />
            </div>
          </div>

          {/* Composição / Insumos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Descrição dos Materiais e Mão de Obra</label>
              <div className="flex gap-3">
                <label className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer">
                  <Upload size={11} /> Importar planilha
                  <input type="file" onChange={handleImportarComposicao} accept=".csv,.xlsx,.xls,.pdf" className="hidden" disabled={uploading} />
                </label>
                <button type="button" onClick={addInsumo} className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Plus size={11} /> Adicionar Item
                </button>
              </div>
            </div>

            {form.insumos.length === 0 ? (
              <div className="p-5 text-center bg-muted/30 rounded-lg border border-dashed border-border">
                <p className="text-xs text-muted-foreground">Nenhum item adicionado. Adicione aço, concreto, tempo de armação, etc.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-border rounded-lg">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-primary/10/20 border-b border-border">
                      <th className="text-left px-3 py-2 text-foreground font-semibold">Descrição</th>
                      <th className="text-center px-2 py-2 text-foreground font-semibold w-16">Unidade</th>
                      <th className="text-right px-2 py-2 text-foreground font-semibold w-24">Quantidade</th>
                      <th className="text-right px-2 py-2 text-foreground font-semibold w-24">Valor Unit.</th>
                      <th className="text-right px-2 py-2 text-foreground font-semibold w-24">Valor Total</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.insumos.map((item, idx) => {
                      const total = calcLinhaTotal(item);
                      return (
                        <tr key={idx} className="border-b border-border/40 hover:bg-muted/20">
                          <td className="px-3 py-1.5">
                            {item.isGenerico ? (
                              <input type="text" value={item.insumo_descricao}
                                onChange={e => updInsumo(idx, "insumo_descricao", e.target.value)}
                                placeholder="Aço, Concreto, Tempo, etc..."
                                className={tdInput} />
                            ) : (
                              <select value={item.insumo_id}
                                onChange={e => selectProdutoInsumo(idx, e.target.value)}
                                className={tdInput}>
                                <option value="">Selecionar do estoque...</option>
                                {produtos.map(p => <option key={p.id} value={p.id}>{p.descricao}</option>)}
                              </select>
                            )}
                            <button type="button"
                              onClick={() => updInsumo(idx, "isGenerico", !item.isGenerico)}
                              className="text-[10px] text-muted-foreground/50 hover:text-primary mt-0.5 leading-none">
                              {item.isGenerico ? "↔ vincular estoque" : "↔ texto livre"}
                            </button>
                          </td>
                          <td className="px-2 py-1.5">
                            <input type="text" value={item.unidade || "UN"}
                              onChange={e => updInsumo(idx, "unidade", e.target.value)}
                              className={tdInput + " text-center"} />
                          </td>
                          <td className="px-2 py-1.5">
                            <input type="number" min="0" step="0.001" value={item.quantidade_por_unidade}
                              onChange={e => updInsumo(idx, "quantidade_por_unidade", parseFloat(e.target.value) || 0)}
                              className={tdInput + " text-right"} />
                          </td>
                          <td className="px-2 py-1.5">
                            <input type="number" min="0" step="0.001" value={item.valor_unitario}
                              onChange={e => updInsumo(idx, "valor_unitario", parseFloat(e.target.value) || 0)}
                              className={tdInput + " text-right"} />
                          </td>
                          <td className="px-2 py-1.5 text-right font-semibold text-foreground whitespace-nowrap bg-muted/30">
                            {fmt(total)}
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <button type="button" onClick={() => removeInsumo(idx)} className="text-red-400 hover:text-red-300">
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Formação de Preço e Custos (Estilo Planilha) */}
          <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl overflow-hidden">
            <div className="bg-yellow-400/20 px-4 py-2 border-b border-yellow-400/30 flex items-center gap-2">
              <Calculator size={14} className="text-yellow-600 dark:text-yellow-400" />
              <h3 className="text-sm font-semibold text-yellow-500 dark:text-yellow-400">Formação de Custos e Precificação</h3>
            </div>
            
            <div className="p-0">
              <table className="w-full text-sm">
                <tbody>
                  {/* Valor Vendido */}
                  <tr className="border-b border-yellow-400/20">
                    <td className="px-4 py-2.5 font-medium text-foreground">Valor unitário do pilar vendido</td>
                    <td className="px-4 py-2 w-48 bg-yellow-400/10">
                      <input type="number" step="0.01" value={form.preco_venda_manual}
                        onChange={e => setForm(f => ({ ...f, preco_venda_manual: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-background border border-yellow-400/30 rounded px-2 py-1 text-right font-bold focus:outline-none focus:border-yellow-500" />
                    </td>
                  </tr>
                  
                  {/* Custo Produção */}
                  <tr className="border-b border-yellow-400/20">
                    <td className="px-4 py-2.5 text-muted-foreground">Valor unitário do pilar de produção (Soma dos itens)</td>
                    <td className="px-4 py-2.5 text-right font-medium text-foreground bg-yellow-400/10">{fmt(custoProducao)}</td>
                  </tr>

                  {/* Instalação */}
                  <tr className="border-b border-yellow-400/20">
                    <td className="px-4 py-2.5 text-muted-foreground">Valor da instalação</td>
                    <td className="px-4 py-2 w-48 bg-yellow-400/10">
                      <input type="number" step="0.01" value={form.valor_instalacao}
                        onChange={e => setForm(f => ({ ...f, valor_instalacao: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-background border border-yellow-400/30 rounded px-2 py-1 text-right focus:outline-none focus:border-yellow-500" />
                    </td>
                  </tr>

                  {/* Munk */}
                  <tr className="border-b border-yellow-400/20">
                    <td className="px-4 py-2.5 text-muted-foreground">Valor do munk para instalação</td>
                    <td className="px-4 py-2 w-48 bg-yellow-400/10">
                      <input type="number" step="0.01" value={form.valor_munk}
                        onChange={e => setForm(f => ({ ...f, valor_munk: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-background border border-yellow-400/30 rounded px-2 py-1 text-right focus:outline-none focus:border-yellow-500" />
                    </td>
                  </tr>

                  {/* Fundação */}
                  <tr className="border-b border-yellow-400/20">
                    <td className="px-4 py-2.5 text-muted-foreground">Fundação tipo bolacha</td>
                    <td className="px-4 py-2 w-48 bg-yellow-400/10">
                      <input type="number" step="0.01" value={form.valor_fundacao}
                        onChange={e => setForm(f => ({ ...f, valor_fundacao: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-background border border-yellow-400/30 rounded px-2 py-1 text-right focus:outline-none focus:border-yellow-500" />
                    </td>
                  </tr>

                  {/* Imposto */}
                  <tr className="border-b border-yellow-400/20">
                    <td className="px-4 py-2.5 text-muted-foreground flex items-center justify-between">
                      <span>Imposto mensal sobre faturamento</span>
                      <div className="flex items-center gap-1 w-24">
                        <input type="number" step="0.1" value={form.percentual_imposto}
                          onChange={e => setForm(f => ({ ...f, percentual_imposto: parseFloat(e.target.value) || 0 }))}
                          className="w-full bg-background border border-yellow-400/30 rounded px-2 py-1 text-right text-xs focus:outline-none focus:border-yellow-500" />
                        <span className="text-xs">%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-red-400 bg-yellow-400/10">{fmt(valorImposto)}</td>
                  </tr>

                  {/* Custo Total */}
                  <tr className="bg-yellow-400/20">
                    <td className="px-4 py-3 font-bold text-foreground">Valor total de custo</td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">{fmt(custoTotalReal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Resultado e Sugestão IA */}
            <div className="bg-yellow-500/10/10 p-4 border-t border-yellow-400/30 flex justify-between items-center">
              <div>
                <p className="text-xs text-yellow-500 dark:text-yellow-400/70 mb-1">Margem Desejada (%)</p>
                <div className="flex items-center gap-2">
                  <input type="number" step="0.1" value={form.margem_lucro}
                    onChange={e => setForm(f => ({ ...f, margem_lucro: parseFloat(e.target.value) || 0 }))}
                    className="w-20 bg-background border border-yellow-400/30 rounded px-2 py-1 text-right focus:outline-none focus:border-yellow-500" />
                  <span className="text-xs font-medium text-yellow-500 dark:text-yellow-400">Sugestão: {fmt(precoSugerido)}</span>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-yellow-500 dark:text-yellow-400/70 mb-1">Lucro Projetado (R$)</p>
                <p className={`text-lg font-black ${lucroReal >= 0 ? "text-green-500" : "text-red-500"}`}>{fmt(lucroReal)}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-muted text-muted-foreground rounded-lg text-sm hover:bg-muted/70">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold disabled:opacity-50">
              {saving ? "Salvando..." : "Salvar Ficha Técnica"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}