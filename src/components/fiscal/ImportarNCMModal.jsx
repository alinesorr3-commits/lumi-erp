import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, X, CheckCircle, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const MAPA_COLUNAS = {
  codigo: ["codigo", "código", "ncm", "ncm/sh"],
  descricao: ["descricao", "descrição", "nome", "produto"],
  finalidade_fiscal: ["finalidade", "finalidade_fiscal", "finalidade fiscal"],
  tipo_produto: ["tipo", "tipo_produto", "tipo de produto", "tipo produto"],
  cfop_entrada: ["cfop_entrada", "cfop entrada"],
  cfop_saida: ["cfop_saida", "cfop saída", "cfop saida"],
  ipi_percentual: ["ipi", "ipi_percentual", "ipi %", "aliq_ipi", "alíquota ipi"],
  ii_percentual: ["ii", "ii_percentual", "ii %", "aliq_ii"],
  icms_percentual: ["icms", "icms_percentual", "icms %", "aliq_icms", "alíquota icms"],
  fcp_percentual: ["fcp", "fcp_percentual", "fcp %", "aliq_fcp"],
  mva_percentual: ["mva", "mva_percentual", "mva %", "aliq_mva"],
  gera_difal: ["gera_difal", "gera difal", "difal"],
  possui_st: ["possui_st", "possui st", "st", "substituição tributária", "substituicao tributaria"],
  credito_icms: ["credito_icms", "crédito icms"],
  credito_pis_cofins: ["credito_pis_cofins", "crédito pis/cofins", "pis/cofins"],
  controla_estoque: ["controla_estoque", "controla estoque", "estoque"],
  participa_bloco_k: ["participa_bloco_k", "bloco k", "participa bloco k"],
  departamento: ["departamento", "depto", "setor"],
  conta_contabil: ["conta", "conta_contabil", "conta contábil", "conta contabil"],
  observacoes_fiscais: ["observacoes", "observações", "obs"],
};

function mapearColunas(headers) {
  const mapa = {};
  const headersNorm = headers.map(h => h?.toString().toLowerCase().trim().replace(/\s+/g, "_"));
  Object.entries(MAPA_COLUNAS).forEach(([campo, aliases]) => {
    const idx = headersNorm.findIndex(h => aliases.some(a => h.includes(a.replace(/\s+/g, "_"))));
    if (idx >= 0) mapa[campo] = idx;
  });
  return mapa;
}

function parseNumber(val) {
  if (!val) return 0;
  const s = val.toString().replace(/[R$\s%]/g, "").replace(/\./g, "").replace(",", ".");
  return parseFloat(s) || 0;
}

function parseBool(val) {
  if (!val) return false;
  const s = val.toString().toLowerCase().trim();
  return s === "sim" || s === "s" || s === "true" || s === "1" || s === "x";
}

export default function ImportarNCMModal({ onClose, onImportado }) {
  const [step, setStep] = useState("idle"); // idle | carregando | mapeando | revisao | importando | done
  const [arquivo, setArquivo] = useState(null);
  const [preview, setPreview] = useState([]);
  const [mapa, setMapa] = useState({});
  const [headers, setHeaders] = useState([]);
  const [linhasImportar, setLinhasImportar] = useState([]);
  const [resultados, setResultados] = useState({ ok: 0, erros: 0, duplicados: 0 });
  const { toast } = useToast();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setArquivo(file);
    setStep("carregando");

    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: res.file_url,
        json_schema: {
          type: "object",
          properties: {
            rows: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: true
              }
            }
          }
        }
      });

      if (extracted.status !== "success" || !extracted.output?.rows?.length) {
        toast({ title: "✗ Erro", description: "Não foi possível ler o arquivo. Use CSV ou XLSX.", variant: "destructive" });
        setStep("idle");
        return;
      }

      const rows = extracted.output.rows;
      const hs = Object.keys(rows[0] || {});
      setHeaders(hs);
      const mapaAuto = mapearColunas(hs);
      setMapa(mapaAuto);
      setPreview(rows.slice(0, 5));
      setLinhasImportar(rows);
      setStep("mapeando");
    } catch (err) {
      toast({ title: "✗ Erro", description: "Falha ao processar arquivo: " + err.message, variant: "destructive" });
      setStep("idle");
    }
  };

  const processarLinhas = () => {
    const processadas = linhasImportar.map((row, idx) => {
      const get = (campo) => {
        const key = mapa[campo] !== undefined ? headers[mapa[campo]] : null;
        return key ? row[key] : "";
      };
      
      return {
        _idx: idx,
        codigo: get("codigo")?.toString().trim() || "",
        descricao: get("descricao")?.toString().trim() || "",
        finalidade_fiscal: get("finalidade_fiscal")?.toString().trim() || "Comercialização",
        tipo_produto: get("tipo_produto")?.toString().trim() || "Mercadoria para Revenda",
        cfop_entrada: get("cfop_entrada")?.toString().trim() || "2102",
        cfop_saida: get("cfop_saida")?.toString().trim() || "5102",
        ipi_percentual: parseNumber(get("ipi_percentual")),
        ii_percentual: parseNumber(get("ii_percentual")),
        icms_percentual: get("icms_percentual") ? parseNumber(get("icms_percentual")) : 12,
        fcp_percentual: parseNumber(get("fcp_percentual")),
        mva_percentual: parseNumber(get("mva_percentual")),
        gera_difal: parseBool(get("gera_difal")),
        possui_st: parseBool(get("possui_st")),
        credito_icms: get("credito_icms") !== "" ? parseBool(get("credito_icms")) : true,
        credito_pis_cofins: get("credito_pis_cofins") !== "" ? parseBool(get("credito_pis_cofins")) : true,
        controla_estoque: get("controla_estoque") !== "" ? parseBool(get("controla_estoque")) : true,
        participa_bloco_k: parseBool(get("participa_bloco_k")),
        departamento: get("departamento")?.toString().trim() || "Produção",
        conta_contabil: get("conta_contabil")?.toString().trim() || "",
        observacoes_fiscais: get("observacoes_fiscais")?.toString().trim() || "",
      };
    }).filter(l => l.codigo);

    if (processadas.length === 0) {
      toast({ title: "✗ Aviso", description: "Nenhuma linha válida encontrada. Selecione a coluna 'codigo'.", variant: "destructive" });
      return;
    }

    setLinhasImportar(processadas);
    setStep("revisao");
  };

  const importar = async () => {
    setStep("importando");
    
    try {
      // Filtrar propriedades internas
      const dataToImport = linhasImportar.map(({ _idx, ...rest }) => rest);
      await base44.entities.TabelaNCM.bulkCreate(dataToImport);
      setResultados({ ok: dataToImport.length, erros: 0, duplicados: 0 });
      setStep("done");
      onImportado?.();
    } catch (err) {
      toast({ title: "✗ Erro na importação", description: err.message, variant: "destructive" });
      setStep("revisao");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <div>
            <h2 className="text-base font-semibold text-foreground">Importar Tabela NCM</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Importe planilhas Excel (.xlsx) ou CSV</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {step === "idle" && (
            <div className="text-center py-10 border-2 border-dashed border-border rounded-xl">
              <FileSpreadsheet size={36} className="mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground mb-4">Selecione seu arquivo com os NCMs</p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <label className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium cursor-pointer hover:bg-primary/90">
                  <Upload size={15} /> Escolher Arquivo
                  <input type="file" accept=".xlsx,.csv,.xls" onChange={handleFile} className="hidden" />
                </label>
              </div>
              <p className="text-xs text-muted-foreground mt-3">Campos mínimos recomendados: Código NCM e Descrição</p>
            </div>
          )}

          {step === "carregando" && (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Extraindo dados do arquivo...</p>
            </div>
          )}

          {step === "mapeando" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Mapeamento de Colunas</p>
                  <p className="text-xs text-muted-foreground">{linhasImportar.length} linhas encontradas em <strong>{arquivo?.name}</strong></p>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Colunas da Entidade</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(MAPA_COLUNAS).map(([campo, _]) => (
                    <div key={campo} className="flex flex-col gap-1">
                      <span className="text-[11px] font-medium text-muted-foreground">{campo}:</span>
                      <select
                        value={mapa[campo] ?? ""}
                        onChange={e => setMapa(m => ({ ...m, [campo]: e.target.value === "" ? undefined : Number(e.target.value) }))}
                        className="bg-background border border-border rounded px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary w-full"
                      >
                        <option value="">— ignorar —</option>
                        {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <p className="text-xs font-semibold text-muted-foreground uppercase px-4 py-2 border-b border-border">Prévia (5 primeiras linhas)</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-muted">{headers.map((h, i) => <th key={i} className="text-left px-3 py-2 text-muted-foreground whitespace-nowrap">{h}</th>)}</tr></thead>
                    <tbody>{preview.map((row, i) => (
                      <tr key={i} className="border-t border-border/50">{headers.map((h, j) => <td key={j} className="px-3 py-1.5 text-foreground whitespace-nowrap max-w-32 truncate">{row[h]}</td>)}</tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button onClick={() => setStep("idle")} className="flex-1 py-2.5 bg-muted text-muted-foreground rounded-lg text-sm">Cancelar</button>
                <button onClick={processarLinhas} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
                  Continuar → Revisar
                </button>
              </div>
            </div>
          )}

          {step === "revisao" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">{linhasImportar.length} NCMs para importar</p>
                <button onClick={() => setStep("mapeando")} className="text-xs text-primary hover:underline">← Voltar</button>
              </div>
              <div className="bg-card border border-border rounded-xl overflow-hidden max-h-[50vh] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted z-10">
                    <tr>
                      {["Código", "Descrição", "ICMS%", "IPI%", "MVA%", "Conta Contábil", "Departamento"].map(h => (
                        <th key={h} className="text-left px-3 py-2 text-muted-foreground whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {linhasImportar.slice(0, 100).map((l, i) => (
                      <tr key={i} className="border-t border-border/50 hover:bg-muted/20">
                        <td className="px-3 py-1.5 font-medium text-foreground">{l.codigo}</td>
                        <td className="px-3 py-1.5 text-foreground max-w-40 truncate">{l.descricao}</td>
                        <td className="px-3 py-1.5 text-foreground">{l.icms_percentual}%</td>
                        <td className="px-3 py-1.5 text-foreground">{l.ipi_percentual}%</td>
                        <td className="px-3 py-1.5 text-foreground">{l.mva_percentual}%</td>
                        <td className="px-3 py-1.5 text-foreground">{l.conta_contabil || "—"}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{l.departamento}</td>
                      </tr>
                    ))}
                    {linhasImportar.length > 100 && (
                      <tr><td colSpan={7} className="text-center py-2 text-muted-foreground">... e mais {linhasImportar.length - 100} registros</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep("idle")} className="flex-1 py-2.5 bg-muted text-muted-foreground rounded-lg text-sm">Cancelar</button>
                <button onClick={importar} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
                  ✓ Importar {linhasImportar.length} NCMs
                </button>
              </div>
            </div>
          )}

          {step === "importando" && (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-muted border-t-green-400 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Salvando no banco de dados...</p>
            </div>
          )}

          {step === "done" && (
            <div className="space-y-4 py-8">
              <div className="bg-green-500/10/10 border border-green-500/30 rounded-xl p-5 text-center max-w-sm mx-auto">
                <CheckCircle size={32} className="mx-auto mb-3 text-green-400" />
                <p className="text-base font-bold text-green-400 mb-2">Importação concluída!</p>
                <p className="text-sm text-foreground">{resultados.ok} NCMs importados com sucesso.</p>
              </div>
              <div className="flex justify-center mt-6">
                <button onClick={onClose} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
                  Concluir e Voltar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}