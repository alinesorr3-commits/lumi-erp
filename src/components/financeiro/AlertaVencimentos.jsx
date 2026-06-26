import { useState } from "react";
import { AlertCircle, Clock, TriangleAlert, X } from "lucide-react";
import { differenceInDays, parseISO, format } from "date-fns";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const soma = (arr) => arr.reduce((acc, l) => acc + (l.valor || 0), 0);

function ModalLista({ bloco, onClose }) {
  if (!bloco) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative z-10 bg-card border border-border rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b border-border`}>
          <div className="flex items-center gap-2">
            {bloco.icon}
            <span className={`font-semibold text-sm ${bloco.cor.titulo}`}>{bloco.label}</span>
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${bloco.cor.badge}`}>{bloco.items.length}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className={`text-sm font-bold ${bloco.cor.valor}`}>Total: {fmt(soma(bloco.items))}</span>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Lista */}
        <div className="overflow-y-auto flex-1 divide-y divide-border">
          {bloco.items.map((l) => (
            <div key={l.id} className="px-5 py-3 flex items-start justify-between gap-4">
              <span className="text-sm text-foreground flex-1 leading-snug">{l.descricao}</span>
              <div className="text-right flex-shrink-0">
                <p className={`text-sm font-semibold ${bloco.cor.valor}`}>{fmt(l.valor)}</p>
                {l.vencimento && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {bloco.tipoData === "vencido"
                      ? `Venceu em ${format(parseISO(l.vencimento), "dd/MM/yyyy")}`
                      : bloco.tipoData === "hoje"
                      ? "Vence hoje"
                      : `Vence em ${format(parseISO(l.vencimento), "dd/MM/yyyy")}`}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AlertaVencimentos({ lancamentos }) {
  const [modalBloco, setModalBloco] = useState(null);

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
      items: vencidos,
      tipoData: "vencido",
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
      items: aVencerHoje,
      tipoData: "hoje",
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
      items: aVencerBreve,
      tipoData: "breve",
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
    <>
      <div className="mb-6 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {blocos.map((b, i) => (
            <button
              key={i}
              onClick={() => setModalBloco(b)}
              className={`rounded-xl border ${b.cor.borda} ${b.cor.bg} p-4 flex items-center gap-4 text-left w-full cursor-pointer hover:brightness-110 transition-all`}
            >
              <div className="flex-shrink-0">{b.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-semibold ${b.cor.titulo}`}>{b.label}</span>
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${b.cor.badge}`}>{b.items.length}</span>
                </div>
                <p className={`text-sm font-bold ${b.cor.valor}`}>{fmt(soma(b.items))}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <ModalLista bloco={modalBloco} onClose={() => setModalBloco(null)} />
    </>
  );
}