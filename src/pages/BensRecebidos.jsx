import { useState } from "react";
import BensDashboard from "@/components/bens/BensDashboard";
import BensEstoque from "@/components/bens/BensEstoque";
import BensNegociacao from "@/components/bens/BensNegociacao";
import BensVendidos from "@/components/bens/BensVendidos";
import BensRelatorios from "@/components/bens/BensRelatorios";

const TABS = [
  { label: "Dashboard", key: "dashboard" },
  { label: "Estoque de Bens", key: "estoque" },
  { label: "Em Negociação", key: "negociacao" },
  { label: "Bens Vendidos", key: "vendidos" },
  { label: "Relatórios", key: "relatorios" },
];

export default function BensRecebidos() {
  const [tab, setTab] = useState("dashboard");
  const [refresh, setRefresh] = useState(0);

  const doRefresh = () => setRefresh(r => r + 1);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-heading text-foreground">Bens Recebidos em Negociação</h1>
        <p className="text-muted-foreground text-sm mt-1">Controle de bens recebidos como parte de pagamento, permuta ou entrada em contratos</p>
      </div>

      <div className="flex gap-1 p-1 bg-muted rounded-lg mb-6 w-fit overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap
 ${tab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && <BensDashboard refresh={refresh} />}
      {tab === "estoque" && <BensEstoque refresh={refresh} onRefresh={doRefresh} />}
      {tab === "negociacao" && <BensNegociacao />}
      {tab === "vendidos" && <BensVendidos refresh={refresh} />}
      {tab === "relatorios" && <BensRelatorios refresh={refresh} />}
    </div>
  );
}