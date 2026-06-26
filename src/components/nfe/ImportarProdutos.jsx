import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ImportarProdutos({ onImportSuccess }) {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");

  const processarComIA = async (produtos) => {
    try {
      const prompt = `Analise a seguinte lista de produtos/serviços e corrija/valide os dados com base em conhecimento de NCM, CFOP e precificação ideal para venda no Brasil:

${JSON.stringify(produtos, null, 2)}

Para cada produto:
1. Valide e corrija o NCM (deve ter 8 dígitos)
2. Corrija o CFOP padrão para saída (5xxx para comércio, 5xxx para indústria)
3. Calcule precificação ideal de venda baseado em: preco_custo * (1 + margem recomendada)
   - Produtos de varejo: 40-60% de margem
   - Serviços: 50-100% de margem
   - Produtos industrializados: 30-50% de margem
4. Mantenha outros campos intactos

Retorne um JSON com array "produtos_corrigidos" contendo todos os produtos com os campos corrigidos.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            produtos_corrigidos: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  codigo: { type: "string" },
                  descricao: { type: "string" },
                  tipo: { type: "string" },
                  ncm: { type: "string" },
                  cfop_saida: { type: "string" },
                  preco_custo: { type: "number" },
                  preco_venda: { type: "number" },
                  aliq_icms: { type: "number" },
                  aliq_pis: { type: "number" },
                  aliq_cofins: { type: "number" },
                  unidade: { type: "string" },
                  ativo: { type: "boolean" }
                }
              }
            }
          }
        }
      });

      return response.produtos_corrigidos || [];
    } catch (err) {
      console.error("Erro na análise de IA:", err);
      return produtos; // Retorna originais se IA falhar
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");
    setResultado(null);

    try {
      // Upload do arquivo
      const uploadRes = await base44.integrations.Core.UploadPrivateFile({ file });

      // Extração dos dados
      const extractRes = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: uploadRes.file_uri,
        json_schema: {
          type: "object",
          properties: {
            produtos: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  codigo: { type: "string" },
                  descricao: { type: "string" },
                  tipo: { type: "string" },
                  ncm: { type: "string" },
                  cfop_saida: { type: "string" },
                  preco_custo: { type: "number" },
                  preco_venda: { type: "number" },
                  aliq_icms: { type: "number" },
                  aliq_pis: { type: "number" },
                  aliq_cofins: { type: "number" },
                  unidade: { type: "string" },
                  ativo: { type: "boolean" }
                }
              }
            }
          }
        }
      });

      if (!extractRes.output?.produtos || extractRes.output.produtos.length === 0) {
        setError("Nenhum produto encontrado no arquivo");
        setLoading(false);
        return;
      }

      // Processar com IA
      const produtosCorrigidos = await processarComIA(extractRes.output.produtos);

      // Salvar produtos
      let importados = 0;
      const detalhes = [];
      for (const prod of produtosCorrigidos) {
        try {
          await base44.entities.ProdutoServico.create({
            codigo: prod.codigo || "",
            descricao: prod.descricao,
            tipo: prod.tipo || "Produto",
            ncm: prod.ncm || "",
            cfop_saida: prod.cfop_saida || "5102",
            unidade: prod.unidade || "UN",
            preco_custo: parseFloat(prod.preco_custo) || 0,
            preco_venda: parseFloat(prod.preco_venda) || 0,
            aliq_icms: parseFloat(prod.aliq_icms) || 12,
            aliq_pis: parseFloat(prod.aliq_pis) || 0.65,
            aliq_cofins: parseFloat(prod.aliq_cofins) || 3,
            aliq_ipi: 0,
            ativo: prod.ativo !== false
          });
          importados++;
          detalhes.push({
            descricao: prod.descricao,
            ncm: prod.ncm,
            cfop: prod.cfop_saida,
            preco: prod.preco_venda,
            status: "✓"
          });
        } catch (err) {
          console.error("Erro ao salvar produto:", err);
          detalhes.push({
            descricao: prod.descricao,
            status: "✗ Erro"
          });
        }
      }

      setResultado({
        total: extractRes.output.produtos.length,
        importados,
        detalhes
      });

      if (onImportSuccess) onImportSuccess();
    } catch (err) {
      console.error("Erro no import:", err);
      setError(err.message || "Erro ao processar arquivo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {!resultado && (
        <div
          className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer bg-muted/20"
          onClick={() => document.getElementById("file-input-produtos").click()}
        >
          <Upload size={28} className="mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">Clique para importar planilha</p>
          <p className="text-xs text-muted-foreground mt-1">XLS, XLSX ou PDF · IA corrigirá NCM, CFOP e precificação</p>
          <input
            id="file-input-produtos"
            type="file"
            accept=".xls,.xlsx,.pdf"
            onChange={handleFileUpload}
            disabled={loading}
            className="hidden"
          />
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 size={32} className="mx-auto mb-3 text-primary animate-spin" />
            <p className="text-sm text-foreground font-medium">Processando com IA...</p>
            <p className="text-xs text-muted-foreground mt-1">Analisando e corrigindo dados</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-400/10 border border-red-400/30 rounded-lg px-4 py-3 flex gap-2">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-red-400">Erro na importação</p>
            <p className="text-xs text-red-300 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {resultado && (
        <div className="space-y-4">
          <div className={`rounded-lg px-4 py-3 border ${resultado.importados === resultado.total ? "border-green-400/30 bg-green-400/10" : "border-yellow-400/30 bg-yellow-400/10"}`}>
            <div className="flex items-start gap-2">
              <CheckCircle2 size={16} className={resultado.importados === resultado.total ? "text-green-400" : "text-yellow-400"} />
              <div>
                <p className={`text-sm font-medium ${resultado.importados === resultado.total ? "text-green-400" : "text-yellow-400"}`}>
                  {resultado.importados} de {resultado.total} produtos importados
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  IA analisou e corrigiu NCM, CFOP e precificação automaticamente
                </p>
              </div>
            </div>
          </div>

          {resultado.detalhes.length > 0 && (
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b border-border">
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Produto</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">NCM</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">CFOP</th>
                    <th className="text-right px-3 py-2 text-muted-foreground font-medium">Preço</th>
                    <th className="text-center px-3 py-2 text-muted-foreground font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {resultado.detalhes.map((detalhe, idx) => (
                    <tr key={idx} className="border-b border-border/50">
                      <td className="px-3 py-2 text-foreground truncate">{detalhe.descricao}</td>
                      <td className="px-3 py-2 font-mono text-muted-foreground">{detalhe.ncm || "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{detalhe.cfop || "—"}</td>
                      <td className="px-3 py-2 text-right font-medium text-green-400">
                        {detalhe.preco ? `R$ ${detalhe.preco.toFixed(2)}` : "—"}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${detalhe.status === "✓" ? "bg-green-400/20 text-green-400" : "bg-red-400/20 text-red-400"}`}>
                          {detalhe.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setResultado(null)}
              className="flex-1 py-2.5 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Importar Mais
            </button>
          </div>
        </div>
      )}
    </div>
  );
}