import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * Botão de importação universal: aceita CSV, XLS, XLSX, XML, PDF
 * Usa ExtractDataFromUploadedFile para extrair dados estruturados.
 * Props:
 *   onData(rows): chamado com array de objetos extraídos
 *   schema: JSON schema dos campos esperados
 *   label: texto do botão
 *   accept: string de tipos (default todos suportados)
 */
export default function ImportButton({ onData, schema, label = "Importar", accept = ".csv,.xls,.xlsx,.xml,.pdf" }) {
  const ref = useRef();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // Para XML, usar função backend dedicada
      let result;
      if (file.name.endsWith(".xml")) {
        result = await base44.functions.invoke("extrairDadosNFe", { file_url });
      } else {
        // Para outros formatos, usar ExtractDataFromUploadedFile
        result = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url,
          json_schema: schema,
        });
      }

      if (result.status === "success") {
        let out = result.output;
        // Se a resposta for um objeto com a chave "items" (comum no schema de array), extrai o array
        if (out && typeof out === 'object' && !Array.isArray(out)) {
          if (Array.isArray(out.items)) {
            out = out.items;
          } else if (Array.isArray(out.rows)) {
            out = out.rows;
          }
        }
        const rows = Array.isArray(out) ? out : [out];
        onData(rows.filter(Boolean));
      } else {
        setError("Erro ao extrair dados: " + (result.details || "formato não reconhecido"));
      }
    } catch (err) {
      setError("Falha ao processar arquivo: " + err.message);
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={handle} />
      <button
        onClick={() => ref.current?.click()}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border text-muted-foreground rounded-lg text-xs hover:text-foreground hover:border-primary transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
        {loading ? "Processando..." : label}
      </button>
      {error && <p className="text-xs text-red-400 max-w-xs">{error}</p>}
    </div>
  );
}