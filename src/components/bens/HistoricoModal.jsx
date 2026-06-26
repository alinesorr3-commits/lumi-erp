import { X, Clock, ArrowRight } from "lucide-react";

export default function HistoricoModal({ bem, onClose }) {
  if (!bem) return null;
  const historico = bem.historico || [];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card">
          <div>
            <h2 className="text-base font-semibold text-foreground">Histórico de Auditoria</h2>
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{bem.descricao}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>

        <div className="p-5">
          {/* Rastreabilidade */}
          <div className="flex items-center gap-2 mb-5 p-3 bg-muted rounded-lg text-xs text-muted-foreground flex-wrap">
            <span className="font-medium text-foreground">Contrato: {bem.contrato_origem_numero || "—"}</span>
            <ArrowRight size={12} />
            <span className="font-medium text-foreground">Bem: {bem.id?.slice(0, 8)}...</span>
            {bem.status === "vendido" && (
              <>
                <ArrowRight size={12} />
                <span className="font-medium text-green-400">Vendido para: {bem.comprador}</span>
              </>
            )}
          </div>

          {historico.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum histórico registrado</p>
          ) : (
            <div className="space-y-3">
              {historico.map((h, i) => (
                <div key={i} className="flex gap-3 p-3 bg-muted/50 rounded-lg border border-border">
                  <div className="w-7 h-7 rounded-full bg-blue-400/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Clock size={13} className="text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{h.acao}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{h.data ? new Date(h.data).toLocaleString("pt-BR") : "—"}</p>
                    {h.dados && (
                      <details className="mt-1">
                        <summary className="text-xs text-blue-400 cursor-pointer hover:underline">Ver dados</summary>
                        <pre className="text-xs text-muted-foreground mt-1 overflow-x-auto bg-background p-2 rounded">
                          {JSON.stringify(h.dados, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}