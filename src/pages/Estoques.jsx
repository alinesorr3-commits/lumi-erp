import { useState } from "react";
import EstoqueRevenda from "@/components/estoque/EstoqueRevenda";
import EstoqueProducao from "@/components/estoque/EstoqueProducao";
import EstoqueConsumo from "@/components/estoque/EstoqueConsumo";
import EstoqueSocios from "@/components/estoque/EstoqueSocios";
import RelatorioPrecos from "@/components/estoque/RelatorioPrecos";

const TABS = [
  { label: "Revenda", key: "revenda" },
  { label: "Produção", key: "producao" },
  { label: "Uso e Consumo", key: "consumo" },
  { label: "Sócios", key: "socios" },
  { label: "Precificação", key: "precos" },
];

export default function Estoques() {
  const [tab, setTab] = useState("revenda");
  const [refresh, setRefresh] = useState(0);

  const doRefresh = () => setRefresh(r => r + 1);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-heading text-foreground">Gestão de Estoques</h1>
        <p className="text-muted-foreground text-sm mt-1">Controle de estoques por tipo: revenda, produção, uso/consumo e patrimônio de sócios</p>
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

      {tab === "revenda" && <EstoqueRevenda refresh={refresh} onRefresh={doRefresh} />}
      {tab === "producao" && <EstoqueProducao refresh={refresh} onRefresh={doRefresh} />}
      {tab === "consumo" && <EstoqueConsumo refresh={refresh} onRefresh={doRefresh} />}
      {tab === "socios" && <EstoqueSocios refresh={refresh} onRefresh={doRefresh} />}
      {tab === "precos" && <RelatorioPrecos />}
    </div>
  );
}