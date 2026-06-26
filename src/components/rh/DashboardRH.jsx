import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart3 } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function DashboardRH() {
  const [folhas, setFolhas] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filtroMes, setFiltroMes] = useState(new Date().toISOString().slice(0, 7));
  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear().toString());

  const [proLabores, setProLabores] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const fs = await base44.entities.Folha.list("-mes_referencia").catch(() => []);
      const cols = await base44.entities.Colaborador.list().catch(() => []);
      const pl = await base44.entities.ProLabore.list("-mes_referencia").catch(() => []);
      
      setFolhas(fs);
      setColaboradores(cols);
      setProLabores(pl);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const getMesNome = (mesStr) => {
    const m = parseInt(mesStr, 10);
    const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    return meses[m - 1] || "";
  };

  const currentMesNome = getMesNome(filtroMes.split("-")[1]);
  const currentAno = filtroMes.split("-")[0];

  const filteredFolhas = folhas.filter(f => f.mes_referencia === filtroMes);
  
  // Totals calculations
  const ativos = colaboradores.filter(c => c.status === "ativo");
  
  const folhaBruto = filteredFolhas.reduce((acc, f) => acc + (f.salario_base || 0) + (f.horas_extras_valor || 0) + (f.adicional_noturno || 0) + (f.ferias_valor || 0) + (f.outros_adicionais || 0), 0);
  const folhaLiquido = filteredFolhas.reduce((acc, f) => acc + (f.salario_liquido || 0), 0);
  
  const inssEmpregado = filteredFolhas.reduce((acc, f) => acc + (f.inss || 0), 0);
  const irpfFolha = filteredFolhas.reduce((acc, f) => acc + (f.irrf || 0), 0);
  const fgts = filteredFolhas.reduce((acc, f) => acc + (f.fgts || 0), 0);
  const inssPatronal = filteredFolhas.reduce((acc, f) => acc + (f.inss_patronal || 0), 0);

  const filteredPL = proLabores.filter(pl => pl.mes_referencia === filtroMes);
  const proLaboreBruto = filteredPL.reduce((acc, pl) => acc + (pl.valor_bruto || 0), 0);
  const inssProLabore = filteredPL.reduce((acc, pl) => acc + (pl.inss || 0), 0);
  const irpfProLabore = filteredPL.reduce((acc, pl) => acc + (pl.irrf || 0), 0);
  
  const emprestimosConsignados = filteredFolhas.reduce((acc, f) => acc + (f.emprestimo_governo || 0) + (f.emprestimo_empresa || 0), 0);

  const guiaUnificada = inssEmpregado + irpfFolha + inssProLabore + irpfProLabore;
  const totalGuias = fgts + guiaUnificada + emprestimosConsignados;

  // By Dept
  const deptCount = colaboradores.reduce((acc, c) => {
    if (c.status !== "ativo") return acc;
    const d = c.departamento || "NÃO INFORMADO";
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});

  const typeCount = colaboradores.reduce((acc, c) => {
    if (c.status !== "ativo") return acc;
    const t = c.tipo_contrato || "CLT";
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-4 w-fit">
        <span className="text-sm text-muted-foreground">Apuração:</span>
        <select 
          value={filtroMes.split("-")[1]} 
          onChange={e => setFiltroMes(filtroAno + "-" + String(e.target.value).padStart(2, "0"))}
          className="bg-muted border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary"
        >
          {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"].map((m, i) => (
            <option key={i} value={String(i + 1).padStart(2, "0")}>{m}</option>
          ))}
        </select>
        <input 
          type="number" 
          value={filtroAno} 
          onChange={e => {
            setFiltroAno(e.target.value);
            setFiltroMes(e.target.value + "-" + filtroMes.split("-")[1]);
          }}
          className="bg-muted border border-border rounded-lg px-3 py-1.5 text-sm text-foreground w-20 focus:outline-none focus:border-primary" 
        />
        <span className="text-xs text-muted-foreground ml-2">{filteredFolhas.length} registros</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground mb-1">Total Colaboradores</p>
          <p className="text-2xl font-bold text-green-500">{colaboradores.length}</p>
          <p className="text-xs text-muted-foreground mt-1">{ativos.length} ativos</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground mb-1">Folha Salarial Total</p>
          <p className="text-2xl font-bold text-green-400">{fmt(folhaBruto)}</p>
          <p className="text-xs text-muted-foreground mt-1">funcionários ativos</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground mb-1">Folha {currentMesNome}/{currentAno}</p>
          <p className="text-2xl font-bold text-blue-400">{fmt(folhaLiquido)}</p>
          <p className="text-xs text-muted-foreground mt-1">Bruto: {fmt(folhaBruto)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground mb-1">Pró-labore {currentMesNome}</p>
          <p className="text-2xl font-bold text-yellow-400">{fmt(proLaboreBruto)}</p>
          <p className="text-xs text-muted-foreground mt-1">INSS: {fmt(inssProLabore)} · IRPF: {fmt(irpfProLabore)}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-sm font-semibold text-foreground mb-1">Guias Apuradas — {currentMesNome}/{currentAno}</h3>
        <p className="text-xs text-muted-foreground mb-6">Competência: {filtroMes.split("-")[1]}/{currentAno}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-muted/30 border border-border rounded-xl p-5 relative overflow-hidden flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-blue-400">GUIA FGTS — SEPARADA</span>
              <span className="text-[10px] bg-primary/10/10 text-blue-400 px-2 py-0.5 rounded-full">SEFIP/GFIP</span>
            </div>
            <p className="text-3xl font-bold text-blue-400 mb-auto">{fmt(fgts)}</p>
            <div className="flex justify-between text-xs text-muted-foreground mt-6">
              <span>FGTS 8% sobre bruto ({fmt(folhaBruto)})</span>
              <span className="font-semibold text-foreground">{fmt(fgts)}</span>
            </div>
          </div>

          <div className="bg-muted/30 border border-border rounded-xl p-5 relative overflow-hidden flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-green-400">GUIA UNIFICADA — GPS/DARF</span>
              <span className="text-[10px] bg-green-500/10/10 text-green-400 px-2 py-0.5 rounded-full">INSS + IRPF</span>
            </div>
            <p className="text-3xl font-bold text-green-400 mb-6">{fmt(guiaUnificada)}</p>
            
            <div className="space-y-2 mt-auto">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>INSS Empregado</span>
                <span className="font-semibold text-green-400">{fmt(inssEmpregado)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>IRPF (folha)</span>
                <span className="font-semibold text-green-400">{fmt(irpfFolha)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>INSS Pró-labore</span>
                <span className="font-semibold text-green-400">{fmt(inssProLabore)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>IRPF Pró-labore</span>
                <span className="font-semibold text-green-400">{fmt(irpfProLabore)}</span>
              </div>
            </div>
          </div>

          <div className="bg-muted/30 border border-border rounded-xl p-5 relative overflow-hidden flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-blue-400">EMPRÉSTIMOS CONSIGNADOS</span>
              <span className="text-[10px] bg-primary/10/10 text-blue-400 px-2 py-0.5 rounded-full">Bancos</span>
            </div>
            <p className="text-3xl font-bold text-blue-400 mb-auto">{fmt(emprestimosConsignados)}</p>
            <div className="flex justify-between text-xs text-muted-foreground mt-6">
              <span>Desconto de Consignados</span>
              <span className="font-semibold text-foreground">{fmt(emprestimosConsignados)}</span>
            </div>
          </div>
        </div>

        <div className="bg-muted/30 border border-border rounded-xl p-4 flex justify-between items-center mb-6">
          <div>
            <p className="text-sm font-semibold text-foreground">INSS Patronal (20%) — Informativo</p>
            <p className="text-xs text-muted-foreground mt-0.5">Incluído no custo total da folha, não é guia separada se Simples Nacional</p>
          </div>
          <p className="text-lg font-bold text-yellow-400">{fmt(inssPatronal)}</p>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-border">
          <p className="text-sm text-foreground">Total retenções a repassar (FGTS + DARF + Bancos)</p>
          <p className="text-xl font-bold text-foreground">{fmt(totalGuias)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-6">Por Departamento</h3>
          <div className="space-y-4">
            {Object.entries(deptCount).sort((a,b) => b[1] - a[1]).map(([dept, count]) => (
              <div key={dept}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-foreground uppercase">{dept}</span>
                  <span className="text-muted-foreground">{count}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div className="bg-green-500/10 h-1.5 rounded-full" style={{ width: `${(count / ativos.length) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-6">Por Tipo de Contrato</h3>
          <div className="space-y-4">
            {Object.entries(typeCount).sort((a,b) => b[1] - a[1]).map(([tipo, count]) => (
              <div key={tipo} className="flex justify-between items-center border-b border-border/50 pb-2 last:border-0">
                <span className="text-xs text-foreground uppercase">{tipo}</span>
                <span className="text-[10px] bg-green-500/10/10 text-green-500 px-2 py-1 rounded-full">{count} colaboradores</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}