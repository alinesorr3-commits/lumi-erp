import { useState } from "react";
import AgroDashboard from "@/components/agro/AgroDashboard";
import AgroCadastros from "@/components/agro/AgroCadastros";
import AgroSafras from "@/components/agro/AgroSafras";
import AgroDespesasReceitas from "@/components/agro/AgroDespesasReceitas";
import AgroFinanceiro from "@/components/agro/AgroFinanceiro";
import AgroResultado from "@/components/agro/AgroResultado";
import {
  LayoutDashboard, MapPin, Wheat, TrendingDown, CreditCard, BarChart2
} from "lucide-react";
import PrintButton from "@/components/shared/PrintButton";

const TABS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "cadastros", label: "Fazendas & Talhões", icon: MapPin },
  { key: "safras", label: "Gestão de Safras", icon: Wheat },
  { key: "movimentos", label: "Despesas & Receitas", icon: TrendingDown },
  { key: "financeiro", label: "Financ. & Investimentos", icon: CreditCard },
  { key: "resultado", label: "Resultado da Safra", icon: BarChart2 },
];

export default function Agronegocio() {
  const [tab, setTab] = useState("dashboard");

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-5">
        <h1 className="text-2xl font-bold font-heading text-foreground">Agronegócio</h1>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-muted-foreground text-sm">Gestão completa de safras, produção e resultado agrícola</p>
          <PrintButton label="Imprimir" className="ml-auto" />
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-muted rounded-lg mb-6 overflow-x-auto w-fit">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap
 ${tab === t.key
 ? "bg-green-600 text-white shadow-sm"
 : "text-muted-foreground hover:text-foreground"}`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "dashboard" && <AgroDashboard onTabChange={setTab} />}
      {tab === "cadastros" && <AgroCadastros />}
      {tab === "safras" && <AgroSafras />}
      {tab === "movimentos" && <AgroDespesasReceitas />}
      {tab === "financeiro" && <AgroFinanceiro />}
      {tab === "resultado" && <AgroResultado />}
    </div>
  );
}