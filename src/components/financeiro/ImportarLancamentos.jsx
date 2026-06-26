import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, X, CheckCircle, AlertTriangle, FileSpreadsheet, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const MAPA_COLUNAS = {
  descricao:         ["descricao", "descrição", "historico", "histórico", "memo", "nome", "lancamento"],
  valor:             ["valor", "value", "amount", "vl", "vl_total"],
  vencimento:        ["vencimento", "data_vencimento", "data vencimento", "due_date", "prazo", "data"],
  tipo:              ["tipo", "type", "natureza"],
  categoria:         ["categoria", "category", "grupo", "classificacao"],
  cliente_fornecedor: ["cliente", "fornecedor", "cliente_fornecedor", "parceiro", "beneficiario"],
  numero_documento:  ["numero_documento", "numero", "documento", "nf", "doc"],
  status:            ["status", "situacao", "situação"],
};

function mapearColunas(headers) {
  const mapa = {};
  const headersNorm = headers.map(h => h?.toString().toLowerCase().trim().replace(/\s+/g, "_"));
  Object.entries(MAPA_COLUNAS).forEach(([campo, aliases]) => {
    const idx = headersNorm.findIndex(h => aliases.some(a => h.includes(a)));
    if (idx >= 0) mapa[campo] = idx;
  });
  return mapa;
}

function parseDateBR(val) {
  if (!val) return "";
  const s = val.toString().trim();
  // DD/MM/YYYY
  const m1 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m1) return `${m1[3]}-${m1[2].padStart(2, "0")}-${m1[1].padStart(2, "0")}`;
  // YYYY-MM-DD
  if (s.match(/^\d{4}-\d{2}-\d{2}$/)) return s;
  // Excel serial number
  const n = parseFloat(s);
  if (!isNaN(n) && n > 40000) {
    const d = new Date((n - 25569) * 86400 * 1000);
    return d.toISOString().split("T")[0];
  }
  return s;
}

function parseValor(val) {
  if (!val) return 0;
  const s = val.toString().replace(/[R$\s]/g, "").replace(/\./g, "").replace(",", ".");
  return Math.abs(parseFloat(s) || 0);
}

export default function ImportarLancamentos({ defaultTipo = "despesa", onImportado }) {
  const [step, setStep] = useState("idle"); // idle | mapeando | revisao | importando | done
  const [arquivo, setArquivo] = useState(null);
  const [preview, setPreview] = useState([]);
  const [mapa, setMapa] = useState({});
  const [headers, setHeaders] = useState([]);
  const [linhasImportar, setLinhasImportar] = useState([]);
  const [tipoGlobal, setTipoGlobal] = useState(defaultTipo);
  const [resultados, setResultados] = useState({ ok: 0, erros: 0, duplicados: 0 });
  const { toast } = useToast();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setArquivo(file);
    setStep("carregando");

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
  };

  const processarLinhas = () => {
    const processadas = linhasImportar.map((row, idx) => {
      const get = (campo) => {
        const key = mapa[campo] !== undefined ? headers[mapa[campo]] : null;
        return key ? row[key] : "";
      };
      const tipoVal = get("tipo")?.toString().toLowerCase();
      const tipo = tipoVal?.includes("recei") ? "receita" : tipoVal?.includes("despe") ? "despesa" : tipoGlobal;
      return {
        _idx: idx,
        descricao: get("descricao") || `Lançamento ${idx + 1}`,
        valor: parseValor(get("valor")),
        vencimento: parseDateBR(get("vencimento")),
        tipo,
        categoria: get("categoria") || "",
        cliente_fornecedor: get("cliente_fornecedor") || "",
        numero_documento: get("numero_documento") || "",
        status: get("status")?.toLowerCase() === "pago" ? "pago" : "pendente",
        _valido: true,
      };
    }).filter(l => l.valor > 0 || l.descricao);
    setLinhasImportar(processadas);
    setStep("revisao");
  };

  const importar = async () => {
    setStep("importando");
    let ok = 0, erros = 0, duplicados = 0;

    // Carrega lançamentos existentes para checar duplicidade
    const existentes = await base44.entities.Lancamento.list();
    const keyExistentes = new Set(existentes.map(l => `${l.descricao}|${l.valor}|${l.vencimento}`));

    for (const linha of linhasImportar) {
      const key = `${linha.descricao}|${linha.valor}|${linha.vencimento}`;
      if (keyExistentes.has(key)) { duplicados++; continue; }
      try {
        await base44.entities.Lancamento.create({
          descricao: linha.descricao,
          valor: linha.valor,
          vencimento: linha.vencimento,
          tipo: linha.tipo,
          categoria: linha.categoria,
          cliente_fornecedor: linha.cliente_fornecedor,
          numero_documento: linha.numero_documento,
          status: linha.status,
        });
        ok++;
      } catch { erros++; }
    }
    setResultados({ ok, erros, duplicados });
    setStep("done");
    onImportado?.();
  };

  return (
    <div className="space-y-4">
      {step === "idle" && (
        <div className="text-center py-10 border-2 border-dashed border-border rounded-xl">
          <FileSpreadsheet size={36} className="mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground mb-4">Importe lançamentos de planilhas Excel (.xlsx) ou CSV</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium cursor-pointer hover:bg-primary/90">
              <Upload size={15} /> Selecionar Arquivo
              <input type="file" accept=".xlsx,.csv,.xls" onChange={handleFile} className="hidden" />
            </label>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Colunas detectadas automaticamente: descrição, valor, vencimento, tipo, categoria, fornecedor/cliente</p>
        </div>
      )}

      {step === "carregando" && (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Processando arquivo...</p>
        </div>
      )}

      {step === "mapeando" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Mapeamento de Colunas</p>
              <p className="text-xs text-muted-foreground">{linhasImportar.length} linhas encontradas em <strong>{arquivo?.name}</strong></p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Tipo padrão:</label>
              <select value={tipoGlobal} onChange={e => setTipoGlobal(e.target.value)}
                className="bg-muted border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none">
                <option value="despesa">Despesa</option>
                <option value="receita">Receita</option>
              </select>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Colunas detectadas</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(MAPA_COLUNAS).map(([campo, _]) => (
                <div key={campo} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-32 flex-shrink-0">{campo}:</span>
                  <select
                    value={mapa[campo] ?? ""}
                    onChange={e => setMapa(m => ({ ...m, [campo]: e.target.value === "" ? undefined : Number(e.target.value) }))}
                    className="flex-1 bg-muted border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none"
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

          <div className="flex gap-3">
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
            <p className="text-sm font-semibold text-foreground">{linhasImportar.length} lançamentos para importar</p>
            <button onClick={() => setStep("mapeando")} className="text-xs text-primary hover:underline">← Voltar</button>
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden max-h-80 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted">
                <tr>
                  {["Descrição", "Valor", "Vencimento", "Tipo", "Status"].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {linhasImportar.map((l, i) => (
                  <tr key={i} className="border-t border-border/50 hover:bg-muted/20">
                    <td className="px-3 py-1.5 text-foreground max-w-40 truncate">{l.descricao}</td>
                    <td className="px-3 py-1.5 font-medium text-green-400">
                      R$ {(l.valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-1.5 text-foreground">{l.vencimento || "—"}</td>
                    <td className="px-3 py-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${l.tipo === "receita" ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>{l.tipo}</span>
                    </td>
                    <td className="px-3 py-1.5 text-muted-foreground">{l.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep("idle")} className="flex-1 py-2.5 bg-muted text-muted-foreground rounded-lg text-sm">Cancelar</button>
            <button onClick={importar} className="flex-1 py-2.5 bg-green-500/10 text-white rounded-lg text-sm font-medium hover:bg-green-600">
              ✓ Importar {linhasImportar.length} lançamentos
            </button>
          </div>
        </div>
      )}

      {step === "importando" && (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-muted border-t-green-400 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Importando lançamentos...</p>
        </div>
      )}

      {step === "done" && (
        <div className="space-y-4">
          <div className="bg-green-500/10/10 border border-green-500/30 rounded-xl p-5 text-center">
            <CheckCircle size={32} className="mx-auto mb-3 text-green-400" />
            <p className="text-base font-bold text-green-400">Importação concluída!</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{resultados.ok}</p>
              <p className="text-xs text-muted-foreground">Importados</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-yellow-400">{resultados.duplicados}</p>
              <p className="text-xs text-muted-foreground">Duplicados (ignorados)</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-red-400">{resultados.erros}</p>
              <p className="text-xs text-muted-foreground">Erros</p>
            </div>
          </div>
          <button onClick={() => setStep("idle")} className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
            Importar outro arquivo
          </button>
        </div>
      )}
    </div>
  );
}