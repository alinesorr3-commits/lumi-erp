import { useState } from "react";
import Colaboradores from "@/components/rh/Colaboradores";
import PontoEletronico from "@/components/rh/PontoEletronico";
import FolhaPagamento from "@/components/rh/FolhaPagamento";
import MotorEncargosRH from "@/components/rh/MotorEncargosRH";
import RelatorioCustoRH from "@/components/rh/RelatorioCustoRH";
import DashboardRH from "@/components/rh/DashboardRH";
import ProLabore from "@/components/rh/ProLabore";

const TABS = ["Dashboard RH", "Colaboradores", "Ponto Eletrônico", "Folha de Pagamento", "Pró-Labore", "Motor de Encargos", "Relatório de Custos"];

export default function RH() {
  const [tab, setTab] = useState(0);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-heading text-foreground">Recursos Humanos</h1>
        <p className="text-muted-foreground text-sm mt-1">Gestão completa de colaboradores, folha e ponto</p>
      </div>

      <div className="flex gap-1 p-1 bg-muted rounded-lg mb-6 w-fit overflow-x-auto">
        {TABS.map((t, i) => (
          <button
            key={i}
            onClick={() => setTab(i)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap
 ${tab === i ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && <DashboardRH />}
      {tab === 1 && <Colaboradores />}
      {tab === 2 && <PontoEletronico />}
      {tab === 3 && <FolhaPagamento />}
      {tab === 4 && <ProLabore />}
      {tab === 5 && <MotorEncargosRH />}
      {tab === 6 && <RelatorioCustoRH />}
    </div>
  );
}