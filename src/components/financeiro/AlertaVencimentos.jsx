import { AlertCircle, Clock } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function AlertaVencimentos({ lancamentos }) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const despesasPendentes = (lancamentos || []).filter(l => l.tipo === "despesa" && (l.status === "pendente" || l.status === "vencido"));

  const vencidos = [];
  const aVencerHoje = [];
  const aVencerBreve = []; // próximos 5 dias

  despesasPendentes.forEach(l => {
    if (!l.vencimento) return;
    const dataVenc = parseISO(l.vencimento);
    dataVenc.setHours(0,0,0,0);
    
    const diff = differenceInDays(dataVenc, hoje);
    
    if (diff < 0) {
      vencidos.push(l);
    } else if (diff === 0) {
      aVencerHoje.push(l);
    } else if (diff > 0 && diff <= 5) {
      aVencerBreve.push({ ...l, dias: diff });
    }
  });

  if (vencidos.length === 0 && aVencerHoje.length === 0 && aVencerBreve.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 space-y-3 no-print">
      {vencidos.length > 0 && (
        <div className="bg-red-500/10/10 border border-red-500/20 rounded-xl p-4 flex gap-3">
          <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
          <div>
            <h3 className="text-sm font-bold text-red-500 mb-1">Contas Vencidas ({vencidos.length})</h3>
            <div className="space-y-1">
              {vencidos.slice(0, 3).map(l => (
                <p key={l.id} className="text-xs text-red-400">
                  <span className="font-semibold">{l.descricao}</span> — {fmt(l.valor)} (Venceu em {format(parseISO(l.vencimento), "dd/MM/yyyy")})
                </p>
              ))}
              {vencidos.length > 3 && (
                <p className="text-xs text-red-400 font-medium">E mais {vencidos.length - 3} conta(s)...</p>
              )}
            </div>
          </div>
        </div>
      )}

      {aVencerHoje.length > 0 && (
        <div className="bg-yellow-500/10/10 border border-yellow-500/20 rounded-xl p-4 flex gap-3">
          <Clock className="text-yellow-500 flex-shrink-0" size={20} />
          <div>
            <h3 className="text-sm font-bold text-yellow-500 mb-1">Vencendo Hoje ({aVencerHoje.length})</h3>
            <div className="space-y-1">
              {aVencerHoje.slice(0, 3).map(l => (
                <p key={l.id} className="text-xs text-yellow-500">
                  <span className="font-semibold">{l.descricao}</span> — {fmt(l.valor)}
                </p>
              ))}
              {aVencerHoje.length > 3 && (
                <p className="text-xs text-yellow-500 font-medium">E mais {aVencerHoje.length - 3} conta(s)...</p>
              )}
            </div>
          </div>
        </div>
      )}

      {aVencerBreve.length > 0 && (
        <div className="bg-primary/10/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
          <Clock className="text-blue-400 flex-shrink-0" size={20} />
          <div>
            <h3 className="text-sm font-bold text-blue-400 mb-1">Próximos Vencimentos (Até 5 dias)</h3>
            <div className="space-y-1">
              {aVencerBreve.slice(0, 3).map(l => (
                <p key={l.id} className="text-xs text-blue-400/80">
                  <span className="font-semibold">{l.descricao}</span> — {fmt(l.valor)} (em {l.dias} dias)
                </p>
              ))}
              {aVencerBreve.length > 3 && (
                <p className="text-xs text-blue-400/80 font-medium">E mais {aVencerBreve.length - 3} conta(s)...</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}