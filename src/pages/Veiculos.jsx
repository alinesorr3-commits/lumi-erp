import { useState } from "react";
import VeiculosDashboard from "@/components/veiculos/VeiculosDashboard";
import VeiculosFrota from "@/components/veiculos/VeiculosFrota";
import VeiculosAbastecimento from "@/components/veiculos/VeiculosAbastecimento";
import VeiculosManutencao from "@/components/veiculos/VeiculosManutencao";
import VeiculosDespesas from "@/components/veiculos/VeiculosDespesas";
import { LayoutDashboard, Truck, Fuel, Wrench, Receipt } from "lucide-react";

const TABS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "frota", label: "Frota", icon: Truck },
  { key: "abastecimento", label: "Abastecimentos", icon: Fuel },
  { key: "manutencao", label: "Manutenções", icon: Wrench },
  { key: "despesas", label: "Despesas & NF", icon: Receipt },
];

export default function Veiculos() {
  const [tab, setTab] = useState("dashboard");

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-heading text-foreground">Gestão de Veículos</h1>
        <p className="text-muted-foreground text-sm mt-1">Frota, abastecimentos, manutenções e documentos fiscais vinculados</p>
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

      {tab === "dashboard" && <VeiculosDashboard onTabChange={setTab} />}
      {tab === "frota" && <VeiculosFrota />}
      {tab === "abastecimento" && <VeiculosAbastecimento />}
      {tab === "manutencao" && <VeiculosManutencao />}
      {tab === "despesas" && <VeiculosDespesas />}
    </div>
  );
}