import { useState } from "react";
import { Link } from "react-router-dom";
import CRMClientes from "@/components/comercial/CRMClientes";
import Pipeline from "@/components/comercial/Pipeline";
import OrcamentosPedidos from "@/components/comercial/OrcamentosPedidos";
import NotasFiscais from "@/components/comercial/NotasFiscais";
import RelatoriosComerciais from "@/components/comercial/RelatoriosComerciais";
import PrecificacaoIndustrial from "@/components/comercial/PrecificacaoIndustrial";
import CategoriasProdutosServicos from "@/components/comercial/CategoriasProdutosServicos";

const TABS = ["Clientes", "Categorias", "Precificação", "Pipeline de Vendas", "Orçamentos & Pedidos", "Notas Fiscais", "Relatórios"];

export default function Comercial() {
  const [tab, setTab] = useState(0);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-heading text-foreground">Comercial</h1>
        <p className="text-muted-foreground text-sm mt-1">CRM, orçamentos, pedidos, notas fiscais e relatórios</p>
      </div>

      <div className="flex gap-1 p-1 bg-muted rounded-lg mb-6 overflow-x-auto w-fit">
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

      {tab === 0 && <CRMClientes />}
      {tab === 1 && <CategoriasProdutosServicos />}
      {tab === 2 && <PrecificacaoIndustrial />}
      {tab === 3 && <Pipeline />}
      {tab === 4 && <OrcamentosPedidos />}
      {tab === 5 && <NotasFiscais />}
      {tab === 6 && <RelatoriosComerciais />}
    </div>
  );
}