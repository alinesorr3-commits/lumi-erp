import { useState } from "react";
import EngFinDashboard from "@/components/engfin/EngFinDashboard";
import EngFinFluxo from "@/components/engfin/EngFinFluxo";
import EngFinObras from "@/components/engfin/EngFinObras";
import EngFinAgro from "@/components/engfin/EngFinAgro";
import EngFinDRE from "@/components/engfin/EngFinDRE";
import EngFinIndicadores from "@/components/engfin/EngFinIndicadores";
import BalanceteDashboard from "@/components/engfin/BalanceteDashboard";
import {
  LayoutDashboard, TrendingUp, Building2, Wheat,
  FileText, Activity, Zap, Briefcase
} from "lucide-react";
import PrintButton from "@/components/shared/PrintButton";
import AssistenteBalancete from "@/components/engfin/AssistenteBalancete";

const TABS = [
  { key: "dashboard", label: "Dashboard Executivo", icon: LayoutDashboard },
  { key: "fluxo", label: "Fluxo de Caixa", icon: TrendingUp },
  { key: "obras", label: "Eng. Obras", icon: Building2 },
  { key: "agro", label: "Eng. Agrícola", icon: Wheat },
  { key: "dre", label: "DRE", icon: FileText },
  { key: "analise", label: "Análise Técnica", icon: Briefcase },
  { key: "indicadores", label: "Indicadores & IA", icon: Activity },
];

export default function EngFinanceira() {
  const [tab, setTab] = useState("dashboard");

  return (
    <div className="p-6 lg:p-8">
      {/* Header premium */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap size={16} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold font-heading text-foreground">Engenharia Financeira</h1>
        </div>
        <div className="flex items-center justify-between ml-11">
          <p className="text-muted-foreground text-sm">
            Inteligência financeira estratégica integrada — Obras · Agronegócio · Financeiro · Indicadores
          </p>
          <PrintButton label="Imprimir Relatório" />
        </div>
      </div>

      {/* Banner de aviso de integração */}
      <div className="mb-5 px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl text-xs text-muted-foreground flex items-center gap-2">
        <Zap size={12} className="text-primary shrink-0" />
        Os dados são consolidados automaticamente de todos os módulos: Financeiro, Obras, Agronegócio e RH.
        Cadastre dados nos módulos para visualizar análises completas aqui.
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg mb-6 overflow-x-auto w-fit">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap
 ${tab === t.key
 ? "bg-primary text-primary-foreground shadow-sm"
 : "text-muted-foreground hover:text-foreground"}`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "dashboard" && <EngFinDashboard />}
      {tab === "fluxo" && <EngFinFluxo />}
      {tab === "obras" && <EngFinObras />}
      {tab === "agro" && <EngFinAgro />}
      {tab === "dre" && <EngFinDRE />}
      {tab === "analise" && <BalanceteDashboard />}
      {tab === "indicadores" && <EngFinIndicadores />}

      {/* Assistente IA Flutuante */}
      <AssistenteBalancete />
    </div>
  );
}