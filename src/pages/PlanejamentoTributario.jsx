import { useState } from "react";
import SimuladorTributario from "@/components/fiscal/SimuladorTributario";
import MotorEncargos from "@/components/fiscal/MotorEncargos";
import ConfigTributaria from "@/components/fiscal/ConfigTributaria";
import ParecerIA from "@/components/shared/ParecerIA";

const TABS = [
  { label: "Simulador de Regime", key: "simulador" },
  { label: "Motor de Encargos", key: "encargos" },
  { label: "Configurações", key: "config" },
];

export default function PlanejamentoTributario() {
  const [tab, setTab] = useState("simulador");

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-heading text-foreground">Planejamento Tributário</h1>
        <p className="text-muted-foreground text-sm mt-1">Comparativo de regimes tributários, motor de encargos e inteligência fiscal</p>
      </div>

      <div className="mb-6 p-4 bg-primary/10/5 border border-blue-500/20 rounded-lg">
        <ParecerIA 
          title="Parecer Estratégico de Planejamento"
          prompt="Como especialista em planejamento tributário, analise a estratégia geral de otimização fiscal da empresa considerando: 1) Escolha ótima de regime tributário, 2) Estrutura operacional mais eficiente, 3) Oportunidades de benefícios fiscais, 4) Cronograma de implementação de mudanças, 5) Riscos de compliance a monitorar. Forneça recomendações práticas e priorizadas."
        />
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

      {tab === "simulador" && <SimuladorTributario />}
      {tab === "encargos" && <MotorEncargos />}
      {tab === "config" && <ConfigTributaria />}
    </div>
  );
}