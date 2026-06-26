import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Plus, Trash2, AlertCircle } from "lucide-react";

const MODULOS = [
  { id: "financeiro", label: "Financeiro", color: "bg-blue-400/10 text-blue-400" },
  { id: "administrativo", label: "Administrativo", color: "bg-gray-400/10 text-gray-400" },
  { id: "estoque", label: "Estoque", color: "bg-green-400/10 text-green-400" },
  { id: "obras", label: "Obras", color: "bg-yellow-400/10 text-yellow-400" },
  { id: "frota", label: "Frota", color: "bg-blue-400/10 text-blue-400" },
  { id: "gerencial", label: "Gerencial", color: "bg-blue-400/10 text-blue-400" },
  { id: "insumos", label: "Insumos", color: "bg-yellow-400/10 text-yellow-400" },
  { id: "socios", label: "Sócios", color: "bg-red-400/10 text-red-400" },
];

export default function RateioModal({ documento, onClose, onConfirm }) {
  const [rateios, setRateios] = useState([]);
  const docs = Array.isArray(documento) ? documento : (documento ? [documento] : []);
  const isLote = docs.length > 1;
  const valorTotalLote = docs.reduce((sum, d) => sum + (d.valor_total || 0), 0);
  const [saving, setSaving] = useState(false);
  const [numParcelas, setNumParcelas] = useState(1);
  const [parcelas, setParcelas] = useState([]);

  useEffect(() => {
    // Inicializar com um rateio 100% para Financeiro
    setRateios([{ modulo: "financeiro", percentual: 100 }]);
  }, []);

  useEffect(() => {
    if (numParcelas < 1) return;
    const arr = [];
    const valorBase = valorTotalLote / numParcelas;
    let sum = 0;
    const dataBase = docs[0]?.data_emissao ? new Date(docs[0].data_emissao + "T12:00:00") : new Date();
    for (let i = 0; i < numParcelas; i++) {
      const val = i === numParcelas - 1 ? valorTotalLote - sum : parseFloat(valorBase.toFixed(2));
      sum += val;
      const d = new Date(dataBase);
      d.setMonth(d.getMonth() + i);
      arr.push({ vencimento: d.toISOString().split("T")[0], valor: val });
    }
    setParcelas(arr);
  }, [numParcelas, valorTotalLote]);

  const updateParcela = (idx, field, value) => {
    const novas = [...parcelas];
    novas[idx][field] = value;
    setParcelas(novas);
  };

  const totalParcelas = parcelas.reduce((acc, p) => acc + (parseFloat(p.valor) || 0), 0);
  const diffParcelas = Math.abs(totalParcelas - valorTotalLote);
  const parcelasValidas = diffParcelas < 0.05;

  const addRateio = () => {
    const modulosUsados = rateios.map(r => r.modulo);
    const proximoModulo = MODULOS.find(m => !modulosUsados.includes(m.id));
    if (proximoModulo) {
      setRateios([...rateios, { modulo: proximoModulo.id, percentual: 0 }]);
    }
  };

  const removeRateio = (idx) => {
    setRateios(rateios.filter((_, i) => i !== idx));
  };

  const updateRateio = (idx, field, value) => {
    const novo = [...rateios];
    novo[idx][field] = value;
    setRateios(novo);
  };

  const totalPercentual = rateios.reduce((s, r) => s + (parseFloat(r.percentual) || 0), 0);
  const isValido = totalPercentual === 100 && rateios.length > 0;

  const handleConfirm = async () => {
    if (!isValido) {
      alert("O rateio deve somar 100%");
      return;
    }
    if (!parcelasValidas) {
      alert("A soma das parcelas deve ser igual ao valor total da nota.");
      return;
    }

    setSaving(true);
    try {
      const rateioEstoque = rateios.find(r => r.modulo === "estoque");
      
      for (const doc of docs) {
        // Processar itens de estoque se houver rateio para estoque e se a nota tiver itens
        if (rateioEstoque && doc.itens && doc.itens.length > 0) {
          for (const item of doc.itens) {
            // Procurar produto existente por descrição
            const produtosExistentes = await base44.entities.ProdutoServico.filter({
              descricao: item.descricao,
              classificacao: "Revenda"
            });

            let produtoId;
            if (produtosExistentes.length > 0) {
              produtoId = produtosExistentes[0].id;
              // Atualizar estoque e preço
              await base44.entities.ProdutoServico.update(produtoId, {
                estoque_atual: (produtosExistentes[0].estoque_atual || 0) + (item.quantidade || 0),
                preco_custo: item.valor_unitario || produtosExistentes[0].preco_custo,
              });
            } else {
              // Criar novo produto
              const novoProduto = await base44.entities.ProdutoServico.create({
                descricao: item.descricao,
                tipo: "Produto",
                classificacao: "Revenda",
                unidade: item.unidade || "UN",
                preco_custo: item.valor_unitario || 0,
                preco_venda: item.valor_unitario || 0,
                estoque_atual: item.quantidade || 0,
                ncm: item.ncm || "",
                cfop_saida: "5102",
              });
              produtoId = novoProduto.id;
            }

            // Registrar movimentação de estoque
            await base44.entities.MovimentacaoEstoque.create({
              produto_id: produtoId,
              produto_codigo: item.codigo || "",
              produto_descricao: item.descricao,
              tipo_movimento: "Entrada",
              quantidade: item.quantidade || 0,
              preco_unitario: item.valor_unitario || 0,
              valor_total: (item.quantidade || 0) * (item.valor_unitario || 0),
              saldo_anterior: produtosExistentes?.length > 0 ? produtosExistentes[0].estoque_atual : 0,
              saldo_novo: (produtosExistentes?.length > 0 ? produtosExistentes[0].estoque_atual : 0) + (item.quantidade || 0),
              data_movimento: doc.data_emissao,
              referencia_documento: `NF-e ${doc.numero}`,
              responsavel: doc.destinatario_nome,
            });
          }
        }

        // Criar lançamentos contábeis para cada rateio e parcela
        for (const rateio of rateios) {
          for (let i = 0; i < parcelas.length; i++) {
            const p = parcelas[i];
            const propDoc = valorTotalLote > 0 ? (doc.valor_total || 0) / valorTotalLote : 0;
            const valorParcelaDoc = p.valor * propDoc;
            const valorFinal = valorParcelaDoc * (rateio.percentual / 100);
            
            const descParc = parcelas.length > 1 ? ` - Parc ${i + 1}/${parcelas.length}` : "";
            
            await base44.entities.Lancamento.create({
              descricao: `NF-e ${doc.numero || "S/N"} - ${doc.destinatario_nome || "Lote"}${descParc} (${rateio.percentual}% - ${MODULOS.find(m => m.id === rateio.modulo)?.label})`,
              tipo: "despesa",
              valor: parseFloat(valorFinal.toFixed(2)),
              vencimento: p.vencimento,
              status: "pendente",
              categoria: MODULOS.find(m => m.id === rateio.modulo)?.label,
              numero_documento: doc.numero,
              cliente_fornecedor: doc.destinatario_nome,
            });
          }
        }

        // Atualizar status do documento
        await base44.entities.NotaFiscalEletronica.update(doc.id, {
          situacao: "Autorizada",
        });
      }

      onConfirm();
    } catch (err) {
      console.error("Erro ao confirmar rateio:", err);
      alert("Erro ao processar rateio");
    } finally {
      setSaving(false);
    }
  };

  const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-base font-semibold text-foreground">Rateio entre Módulos</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Info Documento */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {isLote ? (
                <>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Lote Selecionado</p>
                    <p className="text-foreground font-semibold">{docs.length} documentos selecionados</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Valor Total do Lote</p>
                    <p className="text-green-400 font-semibold">{fmt(valorTotalLote)}</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground">Número</p>
                    <p className="text-foreground font-semibold">{docs[0].numero}/{docs[0].serie}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fornecedor</p>
                    <p className="text-foreground">{docs[0].destinatario_nome}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Data de Emissão</p>
                    <p className="text-foreground">{new Date((docs[0].data_emissao || new Date().toISOString().slice(0,10)) + "T00:00:00").toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Valor Total</p>
                    <p className="text-green-400 font-semibold">{fmt(valorTotalLote)}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Parcelamento */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">Condições de Pagamento</h3>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Qtd Parcelas:</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={numParcelas}
                  onChange={e => setNumParcelas(parseInt(e.target.value) || 1)}
                  className="w-16 bg-card border border-border rounded px-2 py-1 text-sm text-center focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            
            {parcelas.length > 0 && (
              <div className="border border-border rounded-lg overflow-hidden bg-card/50">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Parcela</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Vencimento</th>
                      <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Valor (R$)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parcelas.map((p, idx) => (
                      <tr key={idx} className="border-b border-border/50 last:border-0">
                        <td className="py-2 px-3 text-xs font-medium text-foreground">
                          {idx + 1} / {parcelas.length}
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="date"
                            value={p.vencimento}
                            onChange={e => updateParcela(idx, "vencimento", e.target.value)}
                            className="bg-transparent border border-border rounded px-2 py-1 focus:outline-none focus:border-primary w-full text-xs"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            step="0.01"
                            value={p.valor}
                            onChange={e => updateParcela(idx, "valor", parseFloat(e.target.value) || 0)}
                            className="bg-transparent border border-border rounded px-2 py-1 focus:outline-none focus:border-primary w-full text-right text-xs"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {parcelas.length > 1 && (
                    <tfoot className="bg-muted/30">
                      <tr>
                        <td colSpan="2" className="py-2 px-3 text-right text-xs font-medium text-muted-foreground">Soma das Parcelas:</td>
                        <td className={`py-2 px-3 text-right text-xs font-bold ${parcelasValidas ? 'text-green-400' : 'text-red-400'}`}>
                          {fmt(totalParcelas)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
            {!parcelasValidas && (
              <p className="text-xs text-red-400">A soma das parcelas difere do total da nota ({fmt(valorTotalLote)}).</p>
            )}
          </div>

          {/* Rateios */}
          <div className="space-y-3 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">Rateio por Módulo</h3>
              <button
                type="button"
                onClick={addRateio}
                disabled={rateios.length >= MODULOS.length}
                className="flex items-center gap-1 text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
              >
                <Plus size={12} /> Adicionar
              </button>
            </div>

            {rateios.map((r, idx) => {
              const modulo = MODULOS.find(m => m.id === r.modulo);
              const valor = valorTotalLote * ((parseFloat(r.percentual) || 0) / 100);
              return (
                <div key={idx} className="flex items-end gap-2 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <label className="block text-xs text-muted-foreground mb-1">Módulo</label>
                    <select
                      value={r.modulo}
                      onChange={e => updateRateio(idx, "modulo", e.target.value)}
                      className="w-full bg-card border border-border rounded px-2 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary"
                    >
                      {MODULOS.map(m => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="block text-xs text-muted-foreground mb-1">%</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={r.percentual}
                      onChange={e => updateRateio(idx, "percentual", parseFloat(e.target.value) || 0)}
                      className="w-full bg-card border border-border rounded px-2 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="w-32 text-right">
                    <p className="text-xs text-muted-foreground mb-1">Valor</p>
                    <p className="text-sm font-semibold text-green-400">{fmt(valor)}</p>
                  </div>
                  {rateios.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRateio(idx)}
                      className="p-2 text-red-400 hover:text-red-300 mb-0.5"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className={`flex items-center justify-between p-3 rounded-lg ${totalPercentual === 100 ? "bg-green-400/10 border border-green-400/30" : "bg-yellow-400/10 border border-yellow-400/30"}`}>
            <p className={`text-sm font-medium ${totalPercentual === 100 ? "text-green-400" : "text-yellow-400"}`}>
              Total Rateado
            </p>
            <p className={`text-sm font-semibold ${totalPercentual === 100 ? "text-green-400" : "text-yellow-400"}`}>
              {totalPercentual.toFixed(1)}%
            </p>
          </div>

          {!isValido && (
            <div className="bg-yellow-400/10 border border-yellow-400/30 rounded px-3 py-2 flex gap-2">
              <AlertCircle size={14} className="text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-300">O rateio deve somar exatamente 100%</p>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm bg-muted text-muted-foreground hover:text-foreground transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!isValido || saving}
              className="flex-1 py-2.5 rounded-lg text-sm bg-primary text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition"
            >
              {saving ? "Processando..." : "Confirmar Entrada"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}