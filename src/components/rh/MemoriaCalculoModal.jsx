import { X, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function MemoriaCalculoModal({ memoria, onClose }) {
  const [expandedSections, setExpandedSections] = useState({
    inss: true,
    irrf: true,
    fgts: true,
    patronal: true,
    provisoes: true,
    custos: true,
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const Section = ({ title, icon, section, children }) => (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => toggleSection(section)}
        className="w-full px-4 py-3 bg-muted hover:bg-muted/80 flex items-center justify-between transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
        {expandedSections[section] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {expandedSections[section] && (
        <div className="p-4 space-y-2">
          {children}
        </div>
      )}
    </div>
  );

  const Row = ({ label, value, highlight, color }) => (
    <div className="flex justify-between text-sm">
      <span className={`text-muted-foreground ${highlight ? "font-semibold" : ""}`}>{label}</span>
      <span className={`font-medium ${color || "text-foreground"} ${highlight ? "text-base" : ""}`}>
        {typeof value === "number" ? fmt(value) : value}
      </span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card">
          <h2 className="text-base font-semibold text-foreground">Memória de Cálculo Detalhada</h2>
          <button onClick={onClose}><X size={18} className="text-muted-foreground" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* INSS Empregado */}
          <Section title="INSS Empregado (Desconto na Folha)" section="inss">
            {memoria.inssEmpregado?.detalhes?.map((d, i) => (
              <div key={i} className="bg-muted/30 p-2 rounded text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{d.faixa}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Valor</p>
                    <p className="font-semibold text-foreground">{fmt(d.valor)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Alíquota</p>
                    <p className="font-semibold text-foreground">{d.aliquota}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Resultado</p>
                    <p className="font-semibold text-green-400">{fmt(d.resultado)}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-border">
              <Row label="Total INSS" value={memoria.inssEmpregado?.total} highlight color="text-green-400" />
            </div>
          </Section>

          {/* IRRF */}
          <Section title="IRRF (Cálculo Progressivo)" section="irrf">
            <Row label="Salário Bruto" value={memoria.irrf?.detalhes?.salarioBruto} />
            <Row label="Dedução Legal (INSS + Dep)" value={memoria.irrf?.detalhes?.deducaoLegal} />
            <Row label="Desconto Simplificado (Máx)" value={memoria.irrf?.detalhes?.descontoSimplificado} />
            <div className="pt-2 pb-2">
              <Row label="Método Utilizado" value={memoria.irrf?.detalhes?.usouSimplificado ? "Simplificado" : "Legal"} highlight color="text-blue-400" />
            </div>
            <Row label="(-) Dedução Aplicada" value={memoria.irrf?.detalhes?.deducaoAplicada} />
            <div className="pt-2 border-t border-border">
              <Row label="Base IRRF" value={memoria.irrf?.detalhes?.baseIRRF} highlight />
            </div>
            <div className="pt-2 border-t border-border space-y-1">
              <Row label="Faixa Aplicada" value={memoria.irrf?.detalhes?.faixa || "Isento"} />
              <Row label="Alíquota" value={memoria.irrf?.detalhes?.aliquota || "—"} />
              <Row label="Parcela a Deduzir" value={memoria.irrf?.detalhes?.parcelaDeduzir || 0} />
            </div>
            <div className="pt-2 border-t border-border space-y-1">
              <Row label="IRRF Antes Redução" value={memoria.irrf?.detalhes?.irrfAntesReducao || 0} />
              <Row label="Redução Mensal 2026" value={memoria.irrf?.detalhes?.reducaoMensal || 0} color="text-red-400" />
            </div>
            <div className="pt-2 border-t border-border">
              <Row label="IRRF Devido" value={memoria.irrf?.total} highlight color="text-yellow-400" />
            </div>
          </Section>

          {/* FGTS */}
          <Section title="FGTS (Fundo de Garantia)" section="fgts">
            <Row label="Base FGTS" value={memoria.fgts?.detalhes?.baseFGTS} />
            <Row label="Alíquota" value={memoria.fgts?.detalhes?.aliquota} />
            <div className="pt-2 border-t border-border">
              <Row label="Valor FGTS" value={memoria.fgts?.total} highlight color="text-blue-400" />
            </div>
          </Section>

          {/* INSS Patronal */}
          <Section title="INSS Patronal (Encargo Empresa)" section="patronal">
            <Row label="Regime Tributário" value={memoria.inssPatronal?.detalhes?.regime} />
            <Row label="Percentual Utilizado" value={memoria.inssPatronal?.detalhes?.percentual + "%"} />
            <Row label="Base de Cálculo" value={memoria.inssPatronal?.detalhes?.baseCalculo} />
            <div className="pt-2 border-t border-border">
              <Row label="Valor Calculado (INSS Patronal)" value={memoria.inssPatronal?.total} highlight color="text-blue-400" />
            </div>
          </Section>

          {/* Provisões */}
          <Section title="Provisões Mensais" section="provisoes">
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">Provisão de Férias</p>
              <Row label="Cálculo" value={memoria.provisoes?.ferias?.calculo} />
              <Row label="Valor Provisionado" value={memoria.provisoes?.ferias?.total} highlight color="text-green-400" />
            </div>
            <div className="pt-3 border-t border-border">
              <p className="text-sm font-semibold text-foreground mb-2">Provisão de 13º Salário</p>
              <Row label="Cálculo" value={memoria.provisoes?.decimo?.calculo} />
              <Row label="Valor Provisionado" value={memoria.provisoes?.decimo?.total} highlight color="text-green-400" />
            </div>
          </Section>

          {/* Indicadores de Custo */}
          <Section title="Indicadores de Custo" section="custos">
            <div className="bg-blue-400/10 border border-blue-400/30 p-3 rounded-lg space-y-2 mb-3">
              <p className="text-sm font-semibold text-blue-400">1. CUSTO MENSAL IMEDIATO</p>
              <Row label="Salário" value={memoria.custos?.custoMensalImediato?.salario} />
              <Row label="+ FGTS" value={memoria.custos?.custoMensalImediato?.fgts} />
              <Row label="+ INSS Patronal" value={memoria.custos?.custoMensalImediato?.inssPatronal} />
              <div className="pt-2 border-t border-blue-400/30">
                <Row label="Total" value={memoria.custos?.custoMensalImediato?.total} highlight color="text-blue-400" />
              </div>
            </div>

            <div className="bg-blue-400/10 border border-blue-400/30 p-3 rounded-lg space-y-2">
              <p className="text-sm font-semibold text-blue-400">2. CUSTO REAL PROVISIONADO</p>
              <Row label="Salário" value={memoria.custos?.custoRealProvisionado?.salario} />
              <Row label="+ FGTS" value={memoria.custos?.custoRealProvisionado?.fgts} />
              <Row label="+ INSS Patronal" value={memoria.custos?.custoRealProvisionado?.inssPatronal} />
              <Row label="+ Provisão Férias" value={memoria.custos?.custoRealProvisionado?.provisaoFerias} />
              <Row label="+ Provisão 13º" value={memoria.custos?.custoRealProvisionado?.provisao13} />
              <div className="pt-2 border-t border-blue-400/30">
                <Row label="Total" value={memoria.custos?.custoRealProvisionado?.total} highlight color="text-blue-400" />
              </div>
            </div>
          </Section>

          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Gerado:</strong> {memoria.timestamp}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm bg-primary text-primary-foreground">
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}