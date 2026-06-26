import { AlertCircle, Clock, TriangleAlert } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const soma = (arr) => arr.reduce((acc, l) => acc + (l.valor || 0), 0);

export default function AlertaVencimentos({ lancamentos }) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const despesasPendentes = (lancamentos || []).filter(l => l.tipo === "despesa" && (l.status === "pendente" || l.status === "vencido"));

  const vencidos = [];
  const aVencerHoje = [];
  const aVencerBreve = [];

  despesasPendentes.forEach(l => {
    if (!l.vencimento) return;
    const dataVenc = parseISO(l.vencimento);
    dataVenc.setHours(0, 0, 0, 0);
    const diff = differenceInDays(dataVenc, hoje);
    if (diff < 0) vencidos.push(l);
    else if (diff === 0) aVencerHoje.push(l);
    else if (diff <= 5) aVencerBreve.push(l);
  });

  if (vencidos.length === 0 && aVencerHoje.length === 0 && aVencerBreve.length === 0) {
    return null;
  }

  const blocos = [
    vencidos.length > 0 && {
      icon: <AlertCircle size={18} className="text-red-500" />,
      label: "Vencidas",
      count: vencidos.length,
      total: soma(vencidos),
      cor: {
        borda: "border-red-500/30",
        bg: "bg-red-500/8",
        titulo: "text-red-500",
        valor: "text-red-400",
        badge: "bg-red-500/15 text-red-400",
      },
    },
    aVencerHoje.length > 0 && {
      icon: <TriangleAlert size={18} className="text-yellow-500" />,
      label: "Vencem Hoje",
      count: aVencerHoje.length,
      total: soma(aVencerHoje),
      cor: {
        borda: "border-yellow-500/30",
        bg: "bg-yellow-500/8",
        titulo: "text-yellow-500",
        valor: "text-yellow-400",
        badge: "bg-yellow-500/15 text-yellow-500",
      },
    },
    aVencerBreve.length > 0 && {
      icon: <Clock size={18} className="text-blue-400" />,
      label: "Próx. 5 dias",
      count: aVencerBreve.length,
      total: soma(aVencerBreve),
      cor: {
        borda: "border-blue-500/30",
        bg: "bg-blue-500/8",
        titulo: "text-blue-400",
        valor: "text-blue-300",
        badge: "bg-blue-500/15 text-blue-400",
      },
    },
  ].filter(Boolean);

  return (
    <div className="mb-6 no-print">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {blocos.map((b, i) => (
          <div key={i} className={`rounded-xl border ${b.cor.borda} ${b.cor.bg} p-4 flex items-center gap-4`}>
            <div className="flex-shrink-0">{b.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-semibold ${b.cor.titulo}`}>{b.label}</span>
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${b.cor.badge}`}>{b.count}</span>
              </div>
              <p className={`text-sm font-bold ${b.cor.valor}`}>{fmt(b.total)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}