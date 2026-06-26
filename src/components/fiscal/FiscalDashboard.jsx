import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { FileText, DollarSign, ShieldCheck, AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function FiscalDashboard({ onTabChange }) {
  const [notas, setNotas] = useState([]);
  const [dividas, setDividas] = useState([]);
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hoje = new Date().toISOString().slice(0, 10);
    const mesAtual = hoje.slice(0, 7);
    Promise.all([
      base44.entities.NotaFiscalFiscal.list(),
      base44.entities.DividaFiscal.list(),
      base44.entities.CertificadoDigital.list(),
    ]).then(([n, d, c]) => {
      setNotas(n);
      setDividas(d);
      setCerts(c);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;

  const hoje = new Date();
  const mesAtual = hoje.toISOString().slice(0, 7);
  const em60dias = new Date(hoje.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const notasMes = notas.filter(n => n.data_emissao?.startsWith(mesAtual));
  const totalNotasMes = notasMes.reduce((s, n) => s + (n.valor_total || 0), 0);
  const dividasAtivas = dividas.filter(d => d.status === "Ativo");
  const totalDividas = dividasAtivas.reduce((s, d) => s + (d.valor_atual || 0), 0);
  const certsExpirando = certs.filter(c => c.data_validade <= em60dias && c.status === "Ativo");

  const notasPorStatus = {
    Rascunho: notas.filter(n => n.situacao === "Rascunho").length,
    Emitida: notas.filter(n => ["Emitida", "Autorizada"].includes(n.situacao)).length,
    Cancelada: notas.filter(n => ["Cancelada", "Rejeitada", "Denegada"].includes(n.situacao)).length,
  };

  const dividasPorTipo = {
    Empréstimo: dividasAtivas.filter(d => d.tipo === "Empréstimo").reduce((s, d) => s + (d.valor_atual || 0), 0),
    Parcelamento: dividasAtivas.filter(d => d.tipo === "Parcelamento").reduce((s, d) => s + (d.valor_atual || 0), 0),
    Outros: dividasAtivas.filter(d => d.tipo === "Outros").reduce((s, d) => s + (d.valor_atual || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button onClick={() => onTabChange("notas")} className="bg-card border border-border rounded-xl p-5 text-left hover:border-primary/30 transition-all">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={16} className="text-blue-400" />
            <span className="text-xs text-muted-foreground">Notas Emitidas (mês)</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">{notasMes.length}</p>
          <p className="text-xs text-muted-foreground mt-1">{fmt(totalNotasMes)}</p>
        </button>

        <button onClick={() => onTabChange("notas")} className="bg-card border border-border rounded-xl p-5 text-left hover:border-primary/30 transition-all">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={16} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Total Notas</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{notas.length}</p>
          <p className="text-xs text-muted-foreground mt-1">todas as notas</p>
        </button>

        <button onClick={() => onTabChange("dividas")} className="bg-card border border-border rounded-xl p-5 text-left hover:border-primary/30 transition-all">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={16} className="text-red-400" />
            <span className="text-xs text-muted-foreground">Dívidas Ativas</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{fmt(totalDividas)}</p>
          <p className="text-xs text-muted-foreground mt-1">{dividasAtivas.length} registro(s)</p>
        </button>

        <button onClick={() => onTabChange("certificados")} className="bg-card border border-border rounded-xl p-5 text-left hover:border-primary/30 transition-all">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck size={16} className={certsExpirando.length > 0 ? "text-yellow-400" : "text-green-400"} />
            <span className="text-xs text-muted-foreground">Certificados Expirando</span>
          </div>
          <p className={`text-2xl font-bold ${certsExpirando.length > 0 ? "text-yellow-400" : "text-foreground"}`}>{certsExpirando.length}</p>
          <p className="text-xs text-muted-foreground mt-1">próximos 60 dias</p>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notas por Status */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Notas por Status</h3>
          <div className="space-y-3">
            {[
              { label: "Rascunho", value: notasPorStatus.Rascunho, color: "text-muted-foreground", Icon: Clock },
              { label: "Emitidas", value: notasPorStatus.Emitida, color: "text-blue-400", Icon: CheckCircle },
              { label: "Canceladas", value: notasPorStatus.Cancelada, color: "text-red-400", Icon: XCircle },
            ].map(({ label, value, color, Icon }) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-2">
                  <Icon size={14} className={color} /> {/* Icon is destructured above */}
                  <span className="text-sm text-foreground">{label}</span>
                </div>
                <span className={`text-sm font-bold ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dívidas por Tipo */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Dívidas por Tipo</h3>
          <div className="space-y-3">
            {Object.entries(dividasPorTipo).map(([tipo, valor]) => (
              <div key={tipo} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                <span className="text-sm text-foreground">{tipo}s</span>
                <span className={`text-sm font-bold ${valor > 0 ? "text-red-400" : "text-muted-foreground"}`}>{fmt(valor)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alertas */}
      {certsExpirando.length > 0 && (
        <div className="bg-yellow-500/10/5 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-400">Certificados Digitais prestes a vencer</p>
            <p className="text-xs text-muted-foreground mt-1">
              {certsExpirando.map(c => `${c.razao_social} — vence em ${c.data_validade}`).join(" | ")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}