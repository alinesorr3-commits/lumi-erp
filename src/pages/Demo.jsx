import { Check, ArrowRight, Zap, Shield, Users, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

const FEATURES = [
  { icon: BarChart3, title: "Dashboard Executivo", desc: "Panorama completo de financeiro, operações e resultados" },
  { icon: Zap, title: "Engenharia Financeira", desc: "Análise avançada de fluxo de caixa e resultados" },
  { icon: Users, title: "Gestão Completa", desc: "RH, Comercial, Fiscal, Operações integrados" },
  { icon: Shield, title: "Seguro & Auditável", desc: "Conformidade fiscal e rastreamento de operações" },
];

const MODULES = [
  "Panorama & Dashboard",
  "Financeiro & Fluxo de Caixa",
  "Comercial & CRM",
  "RH & Folha de Pagamento",
  "Fiscal & Tributário",
  "NF-e / NFS-e / CT-e / MDF-e",
  "Estoques & Produção",
  "Obras & Projetos",
  "Agronegócio",
  "Bens Recebidos",
  "Gestão de Veículos",
  "Engenharia Financeira",
];

export default function Demo() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-primary border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-16 lg:py-24">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs px-3 py-1.5 rounded-full font-medium mb-4">
              <Zap size={12} /> Demonstração - Lumi ERP
            </div>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-foreground mb-4">
            Sistema ERP Completo para sua Empresa
          </h1>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl">
            Gerenciamento integrado de financeiro, operações, fiscal e recursos humanos. Tudo em uma única plataforma.
          </p>
          <Link to="/planos" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors">
            Ver Planos e Preços <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-foreground mb-10">Principais Características</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon size={20} className="text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modules */}
      <div className="bg-card/30 border-y border-border">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-foreground mb-10">Módulos Inclusos</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {MODULES.map((mod, i) => (
              <div key={i} className="flex items-center gap-3">
                <Check size={18} className="text-green-400 flex-shrink-0" />
                <span className="text-foreground">{mod}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">Pronto para começar?</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Explore os planos disponíveis e escolha o que melhor se adapta ao seu negócio.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/planos" className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors">
              Ver Planos
            </Link>
            <a href="mailto:contato@lumiErp.com.br" className="px-6 py-3 border border-border rounded-xl font-semibold text-foreground hover:border-primary/50 transition-colors">
              Falar com vendas
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-card/30">
        <div className="max-w-5xl mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>🔒 Seguro · 📊 Auditável · 🇧🇷 Conforme à legislação brasileira</p>
        </div>
      </div>
    </div>
  );
}