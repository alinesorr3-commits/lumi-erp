import { useState } from "react";
import ObrasPainelCentral from "@/components/obras/ObrasPainelCentral";
import ObrasCadastro from "@/components/obras/ObrasCadastro";
import ObrasMateriaisTab from "@/components/obras/ObrasMateriaisTab";
import ObrasMaoDeObraTab from "@/components/obras/ObrasMaoDeObraTab";
import ObrasDespesasTab from "@/components/obras/ObrasDespesasTab";
import ObrasResultado from "@/components/obras/ObrasResultado";
import ObrasNegociacao from "@/components/obras/ObrasNegociacao";
import { BarChart2, Building2, Package, Users, DollarSign, TrendingUp, HandshakeIcon } from "lucide-react";

const TABS = [
  { key: "dashboard", label: "Dashboard", icon: BarChart2 },
  { key: "cadastro", label: "Cadastro de Obras", icon: Building2 },
  { key: "materiais", label: "Materiais", icon: Package },
  { key: "mao_obra", label: "Mão de Obra", icon: Users },
  { key: "despesas", label: "Despesas", icon: DollarSign },
  { key: "resultado", label: "Resultado", icon: TrendingUp },
  { key: "negociacao", label: "Negociação", icon: DollarSign },
];

export default function Obras() {
  const [tab, setTab] = useState("dashboard");

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-5">
        <h1 className="text-2xl font-bold font-heading text-foreground">Gestão de Obras</h1>
        <p className="text-muted-foreground text-sm mt-1">Controle completo de projetos de construção</p>
      </div>

      <div className="flex gap-1 p-1 bg-muted rounded-lg mb-6 overflow-x-auto w-fit">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap
 ${tab === t.key ? "bg-yellow-500/10 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "dashboard" && <ObrasPainelCentral onTabChange={setTab} />}
      {tab === "cadastro" && <ObrasCadastro />}
      {tab === "materiais" && <ObrasMateriaisTab />}
      {tab === "mao_obra" && <ObrasMaoDeObraTab />}
      {tab === "despesas" && <ObrasDespesasTab />}
      {tab === "resultado" && <ObrasResultado />}
      {tab === "negociacao" && <ObrasNegociacao />}
    </div>
  );
}