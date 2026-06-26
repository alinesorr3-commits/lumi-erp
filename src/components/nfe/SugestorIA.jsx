import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Loader2, AlertCircle, Check } from "lucide-react";

export default function SugestorIA({ descricao, tipo = "Produto", onSuggestion }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestion, setSuggestion] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const handleSugerir = async () => {
    if (!descricao || descricao.trim().length < 5) {
      setError("Digite uma descrição com pelo menos 5 caracteres");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const [ncmTable, configEncargos] = await Promise.all([
        base44.entities.TabelaNCM.list(),
        base44.entities.ConfigEncargos.list(),
      ]);

      const ncmContext = ncmTable.map(n => `${n.codigo}: ${n.descricao} (CFOP Saída: ${n.cfop_saida}, ICMS: ${n.icms_percentual}%)`).join("\n");

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise a descrição do produto e sugira a melhor classificação fiscal:

DESCRIÇÃO DO PRODUTO: "${descricao}"
TIPO: ${tipo}

BASE DE DADOS NCM (cadastrados):
${ncmContext}

Tarefa:
1. Sugerir o código NCM mais apropriado (8 dígitos)
2. Sugerir CFOP de saída (4 dígitos - considere operações dentro/fora do estado)
3. Sugerir alíquota de ICMS base (%)
4. Sugerir se precisa Substituição Tributária (ST)
5. Sugerir se gera DIFAL (para operações interestaduais)

Retorne APENAS um JSON válido (sem markdown ou explicações adicionais) com:
{
  "ncm_sugerido": "00000000",
  "ncm_descricao": "descrição do NCM",
  "cfop_sagerido": "5102",
  "icms_percentual": 12,
  "possui_st": false,
  "gera_difal": false,
  "margem_sugerida_percentual": 40,
  "motivo": "breve explicação"
}`,
        response_json_schema: {
          type: "object",
          properties: {
            ncm_sugerido: { type: "string" },
            ncm_descricao: { type: "string" },
            cfop_sugerido: { type: "string" },
            icms_percentual: { type: "number" },
            possui_st: { type: "boolean" },
            gera_difal: { type: "boolean" },
            margem_sugerida_percentual: { type: "number" },
            motivo: { type: "string" },
          },
        },
      });

      setSuggestion(response);
      setExpanded(true);
      if (onSuggestion) onSuggestion(response);
    } catch (err) {
      setError(err.message || "Erro ao gerar sugestão");
    } finally {
      setLoading(false);
    }
  };

  if (suggestion) {
    return (
      <div className="border border-blue-400/30 bg-blue-400/5 rounded-lg p-3 space-y-2">
        <div
          className="flex items-start justify-between cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-start gap-2 flex-1">
            <Check size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-foreground">Sugestão de IA</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                NCM {suggestion.ncm_sugerido} | CFOP {suggestion.cfop_sugerido} | ICMS {suggestion.icms_percentual}%
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSuggestion(null);
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {expanded && (
          <div className="space-y-2 pt-2 border-t border-blue-400/20">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-muted-foreground">NCM Sugerido</p>
                <p className="text-sm font-semibold text-blue-400">{suggestion.ncm_sugerido}</p>
                <p className="text-xs text-muted-foreground">{suggestion.ncm_descricao}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">CFOP Sugerido</p>
                <p className="text-sm font-semibold text-blue-400">{suggestion.cfop_sugerido}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">ICMS %</p>
                <p className="text-sm font-semibold text-yellow-400">{suggestion.icms_percentual}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Margem Sugerida</p>
                <p className="text-sm font-semibold text-green-400">{suggestion.margem_sugerida_percentual}%</p>
              </div>
            </div>
            {(suggestion.possui_st || suggestion.gera_difal) && (
              <div className="bg-yellow-400/10 border border-yellow-400/30 rounded px-2 py-1.5 space-y-1">
                {suggestion.possui_st && (
                  <p className="text-xs text-yellow-300">✓ Possui Substituição Tributária (ST)</p>
                )}
                {suggestion.gera_difal && (
                  <p className="text-xs text-yellow-300">✓ Gera DIFAL (operações interestaduais)</p>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground italic">{suggestion.motivo}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleSugerir}
        disabled={loading || !descricao || descricao.trim().length < 5}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-xs font-medium hover: hover: disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {loading ? (
          <>
            <Loader2 size={13} className="animate-spin" />
            Analisando...
          </>
        ) : (
          <>
            <Sparkles size={13} />
            Sugerir NCM, CFOP & Precificação
          </>
        )}
      </button>
      {error && (
        <div className="bg-red-400/10 border border-red-400/30 rounded px-2 py-1.5 flex gap-2">
          <AlertCircle size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}
    </div>
  );
}