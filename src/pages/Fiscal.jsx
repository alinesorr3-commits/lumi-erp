import { useState } from "react";
import FiscalDashboard from "@/components/fiscal/FiscalDashboard";
import NotasFiscais from "@/components/fiscal/NotasFiscais";
import DividasParcelamentos from "@/components/fiscal/DividasParcelamentos";
import CertificadosDigitais from "@/components/fiscal/CertificadosDigitais";
import TabelaNCMComponent from "@/components/fiscal/TabelaNCMComponent";
import CalculadoraICMS from "@/components/fiscal/CalculadoraICMS";
import { BarChart2, FileText, DollarSign, ShieldCheck, BookOpen, Calculator } from "lucide-react";

const TABS = [
  { key: "dashboard", label: "Dashboard", icon: BarChart2 },
  { key: "notas", label: "Notas Fiscais", icon: FileText },
  { key: "dividas", label: "Dívidas & Parcelamentos", icon: DollarSign },
  { key: "certificados", label: "Certificados Digitais", icon: ShieldCheck },
  { key: "ncm", label: "Tabela NCM", icon: BookOpen },
  { key: "calculadora", label: "Calculadora ICMS", icon: Calculator },
];

export default function Fiscal() {
  const [tab, setTab] = useState("dashboard");

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-heading text-foreground">Fiscal & Tributário</h1>
        <p className="text-muted-foreground text-sm mt-1">Notas fiscais, tributos, certificados e dívidas</p>
      </div>

      <div className="flex gap-1 p-1 bg-muted rounded-lg mb-6 overflow-x-auto w-fit">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap
 ${tab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "dashboard" && <FiscalDashboard onTabChange={setTab} />}
      {tab === "notas" && <NotasFiscais />}
      {tab === "dividas" && <DividasParcelamentos />}
      {tab === "certificados" && <CertificadosDigitais />}
      {tab === "ncm" && <TabelaNCMComponent />}
      {tab === "calculadora" && <CalculadoraICMS />}
    </div>
  );
}