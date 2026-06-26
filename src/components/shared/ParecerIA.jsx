import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Loader2, AlertCircle, TrendingUp, DollarSign, Eye } from "lucide-react";

export default function ParecerIA({ title, prompt, onAnalysis, loading: externalLoading = false }) {
  const [parecer, setParecer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);

  const handleAnalisar = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            recomendacao: { type: "string" },
            pontos_fortes: {
              type: "array",
              items: { type: "string" }
            },
            pontos_de_atencao: {
              type: "array",
              items: { type: "string" }
            },
            acao_sugerida: { type: "string" },
            confianca: { type: "string", enum: ["Alta", "Média", "Baixa"] }
          }
        }
      });

      setParecer(response);
      if (onAnalysis) onAnalysis(response);
      setExpanded(true);
    } catch (err) {
      setError(err.message || "Erro ao gerar parecer");
    } finally {
      setLoading(false);
    }
  };

  const confiancaColor = {
    "Alta": "text-green-400",
    "Média": "text-yellow-400",
    "Baixa": "text-red-400"
  };

  const confiancaBg = {
    "Alta": "bg-green-400/10 border-green-400/30",
    "Média": "bg-yellow-400/10 border-yellow-400/30",
    "Baixa": "bg-red-400/10 border-red-400/30"
  };

  return (
    <div className="space-y-3">
      {!parecer ? (
        <>
          <button
            onClick={handleAnalisar}
            disabled={loading || externalLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover: hover: disabled:opacity-50 transition-all"
          >
            {loading || externalLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Analisando com IA...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Parecer de IA — {title}
              </>
            )}
          </button>
          {error && (
            <div className="bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2 flex gap-2">
              <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}
        </>
      ) : (
        <div className={`rounded-lg border transition-all ${confiancaBg[parecer.confianca]}`}>
          <div
            className="p-3 cursor-pointer"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2 flex-1">
                <Sparkles size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{parecer.recomendacao}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${confiancaColor[parecer.confianca]}`}>
                {parecer.confianca}
              </span>
            </div>
          </div>

          {expanded && (
            <div className="border-t border-current border-opacity-20 px-3 py-3 space-y-3">
              {/* Recomendação Principal */}
              <div>
                <p className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                  <TrendingUp size={13} className="text-blue-400" />
                  Recomendação
                </p>
                <p className="text-xs text-muted-foreground">{parecer.recomendacao}</p>
              </div>

              {/* Pontos Fortes */}
              {parecer.pontos_fortes && parecer.pontos_fortes.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                    <span className="text-green-400">✓</span>
                    Pontos Fortes
                  </p>
                  <ul className="space-y-1">
                    {parecer.pontos_fortes.map((ponto, idx) => (
                      <li key={idx} className="text-xs text-green-300 flex gap-2">
                        <span className="flex-shrink-0">•</span>
                        <span>{ponto}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Pontos de Atenção */}
              {parecer.pontos_de_atencao && parecer.pontos_de_atencao.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                    <span className="text-yellow-400">!</span>
                    Pontos de Atenção
                  </p>
                  <ul className="space-y-1">
                    {parecer.pontos_de_atencao.map((ponto, idx) => (
                      <li key={idx} className="text-xs text-yellow-300 flex gap-2">
                        <span className="flex-shrink-0">•</span>
                        <span>{ponto}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Ação Sugerida */}
              {parecer.acao_sugerida && (
                <div className="pt-2 border-t border-current border-opacity-20">
                  <p className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                    <DollarSign size={13} className="text-blue-400" />
                    Ação Sugerida
                  </p>
                  <p className="text-xs text-blue-300">{parecer.acao_sugerida}</p>
                </div>
              )}

              <button
                onClick={() => setParecer(null)}
                className="w-full py-2 text-xs text-muted-foreground hover:text-foreground border border-current border-opacity-20 rounded-lg transition-colors"
              >
                Novo Parecer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}