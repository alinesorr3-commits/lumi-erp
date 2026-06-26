import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Download, Eye } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function RelatorioPrecos() {
  const [fichas, setFichas] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.entities.FichaTecnica.list("-created_date"),
      base44.entities.ProdutoServico.list()
    ]).then(([f, i]) => {
      setFichas(f);
      setInsumos(i);
      setLoading(false);
    });
  }, []);

  const calcularCustoInsumos = (ficha) => {
    return (ficha.insumos || []).reduce((sum, item) => {
      // Como os valores unitários agora estão sendo salvos em cada item da ficha técnica, 
      // usaremos eles em vez de consultar apenas o estoque.
      const valorUnitario = item.valor_unitario || 0;
      const custo = valorUnitario * (item.quantidade_por_unidade || 0) * (1 + (item.desperdicio_percentual || 0) / 100);
      return sum + custo;
    }, 0);
  };

  const calcularCustoTotal = (ficha) => {
    // Calculo do novo layout de Custo Total Real
    const custoProducao = calcularCustoInsumos(ficha);
    const vInstalacao = parseFloat(ficha.valor_instalacao) || 0;
    const vMunk = parseFloat(ficha.valor_munk) || 0;
    const vFundacao = parseFloat(ficha.valor_fundacao) || 0;
    const custoBase = custoProducao + vInstalacao + vMunk + vFundacao;
    
    // Imposto é calculado sobre o preço de venda manual
    const precoVendido = parseFloat(ficha.preco_venda_manual) || 0;
    const pImposto = parseFloat(ficha.percentual_imposto) || 0;
    const valorImposto = precoVendido * (pImposto / 100);
    
    return custoBase + valorImposto;
  };

  const calcularPrecoVenda = (ficha) => {
    return parseFloat(ficha.preco_venda_manual) || 0; // Usando o Preço Vendido da Ficha
  };

  const calcularLucro = (ficha) => {
    return calcularPrecoVenda(ficha) - calcularCustoTotal(ficha);
  };

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-foreground">Relatório de Precificação</h3>
        <button className="flex items-center gap-2 px-3 py-1.5 text-xs bg-muted text-muted-foreground rounded-lg hover:bg-muted/80">
          <Download size={14} /> Exportar
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {fichas.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">Nenhuma ficha técnica para precificar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Produto</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Custo Insumos</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Imposto</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Custo Total</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Preço Vendido</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Lucro/Un</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground">Ação</th>
                </tr>
              </thead>
              <tbody>
                {fichas.map((ficha) => {
                  const custoInsumos = calcularCustoInsumos(ficha);
                  const custoTotal = calcularCustoTotal(ficha);
                  const precoVenda = calcularPrecoVenda(ficha);
                  const lucro = calcularLucro(ficha);
                  const margem = ficha.margem_lucro || 30;

                  return (
                    <tr key={ficha.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">{ficha.nome_venda || ficha.produto_descricao}</p>
                          <p className="text-xs text-muted-foreground">{ficha.produto_codigo}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{fmt(custoInsumos)}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground text-red-400">{fmt((precoVenda * ((ficha.percentual_imposto || 0) / 100)))}</td>
                      <td className="px-4 py-3 text-right font-semibold text-yellow-400">{fmt(custoTotal)}</td>
                      <td className="px-4 py-3 text-right font-bold text-green-400">{fmt(precoVenda)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-green-500">{fmt(lucro)}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setExpandedId(expandedId === ficha.id ? null : ficha.id)}
                          className="text-primary hover:text-primary/80"
                        >
                          <Eye size={16} />
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

      {expandedId && fichas.find(f => f.id === expandedId) && (
        <DetalheFicha
          ficha={fichas.find(f => f.id === expandedId)}
          insumos={insumos}
          onClose={() => setExpandedId(null)}
        />
      )}
    </div>
  );
}

function DetalheFicha({ ficha, insumos, onClose }) {
  const custoInsumos = (ficha.insumos || []).reduce((sum, item) => {
    const valorUnitario = item.valor_unitario || 0;
    const custo = valorUnitario * (item.quantidade_por_unidade || 0) * (1 + (item.desperdicio_percentual || 0) / 100);
    return sum + custo;
  }, 0);

  const vInstalacao = parseFloat(ficha.valor_instalacao) || 0;
  const vMunk = parseFloat(ficha.valor_munk) || 0;
  const vFundacao = parseFloat(ficha.valor_fundacao) || 0;
  const custoBase = custoInsumos + vInstalacao + vMunk + vFundacao;
  
  const precoVenda = parseFloat(ficha.preco_venda_manual) || 0;
  const pImposto = parseFloat(ficha.percentual_imposto) || 0;
  const valorImposto = precoVenda * (pImposto / 100);
  
  const custoTotal = custoBase + valorImposto;
  const margem = ficha.margem_lucro || 0;
  const lucro = precoVenda - custoTotal;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-card border-b border-border p-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">{ficha.nome_venda || ficha.produto_descricao}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        <div className="p-5 space-y-6">
          {/* Detalhes da composição */}
          {ficha.insumos && ficha.insumos.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase">Insumos Utilizados (Produção)</h3>
              <div className="overflow-x-auto border border-border rounded-lg bg-muted/20">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-3 py-2 text-muted-foreground font-semibold">Insumo</th>
                      <th className="text-right px-3 py-2 text-muted-foreground font-semibold">Qtd</th>
                      <th className="text-right px-3 py-2 text-muted-foreground font-semibold">Unitário</th>
                      <th className="text-right px-3 py-2 text-muted-foreground font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ficha.insumos.map((item, idx) => {
                      const valorUnit = item.valor_unitario || 0;
                      const qtdComDesperdicio = (item.quantidade_por_unidade || 0) * (1 + (item.desperdicio_percentual || 0) / 100);
                      const valorTotal = valorUnit * qtdComDesperdicio;
                      return (
                        <tr key={idx} className="border-b border-border/30">
                          <td className="px-3 py-2 text-muted-foreground">{item.insumo_descricao}</td>
                          <td className="text-right px-3 py-2 text-foreground">{item.quantidade_por_unidade} {item.unidade}</td>
                          <td className="text-right px-3 py-2 text-foreground">{fmt(valorUnit)}</td>
                          <td className="text-right px-3 py-2 font-semibold text-foreground">{fmt(valorTotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Composição de custos */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase">Formação de Custos e Precificação</h3>
            <div className="space-y-2 bg-card border border-border rounded-lg p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor Vendido:</span>
                <span className="font-semibold text-foreground">{fmt(precoVenda)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Custo de Produção (Soma Insumos):</span>
                <span className="font-semibold text-foreground">{fmt(custoInsumos)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Instalação:</span>
                <span className="font-semibold text-foreground">{fmt(vInstalacao)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Munk:</span>
                <span className="font-semibold text-foreground">{fmt(vMunk)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fundação:</span>
                <span className="font-semibold text-foreground">{fmt(vFundacao)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Imposto ({ficha.percentual_imposto || 0}%):</span>
                <span className="font-semibold text-red-400">{fmt(valorImposto)}</span>
              </div>
              <div className="border-t border-border pt-2 mt-2 flex justify-between text-sm font-bold">
                <span className="text-foreground">Custo Total:</span>
                <span className="text-yellow-400">{fmt(custoTotal)}</span>
              </div>
            </div>
          </div>

          {/* Precificação / Resultado Final */}
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Margem Planejada</p>
                <p className="text-2xl font-bold text-primary">{margem}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Lucro Real / Unidade</p>
                <p className={`text-2xl font-bold ${lucro >= 0 ? "text-green-400" : "text-red-400"}`}>{fmt(lucro)}</p>
              </div>
            </div>
          </div>

          {/* Link para planilha */}
          {ficha.planilha_engenheiro_url && (
            <div className="bg-muted/30 border border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-2">Planilha do Engenheiro</p>
              <a href={ficha.planilha_engenheiro_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                Ver arquivo completo →
              </a>
            </div>
          )}

          {ficha.observacoes && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Observações</p>
              <p className="text-sm text-foreground">{ficha.observacoes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}