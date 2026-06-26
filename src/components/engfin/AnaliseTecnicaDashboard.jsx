import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, FileText, Zap, Download } from "lucide-react";
import AnaliseTecnicaModal from "./AnaliseTecnicaModal";
import { useToast } from "@/components/ui/use-toast";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function AnaliseTecnicaDashboard() {
  const [analises, setAnalises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const { toast } = useToast();

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.AnaliseTecnica.list("-data_analise");
      setAnalises(data);
    } catch (err) {
      toast({ title: "✗ Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data) => {
    try {
      if (editItem) {
        await base44.entities.AnaliseTecnica.update(editItem.id, data);
      } else {
        await base44.entities.AnaliseTecnica.create(data);
      }
      setModal(false);
      setEditItem(null);
      load();
      toast({ title: "✓ Salvo", description: "Análise armazenada com sucesso" });
    } catch (err) {
      toast({ title: "✗ Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir esta análise?")) return;
    try {
      await base44.entities.AnaliseTecnica.delete(id);
      load();
      toast({ title: "✓ Excluído" });
    } catch (err) {
      toast({ title: "✗ Erro", description: err.message, variant: "destructive" });
    }
  };

  const gerarRelatorio = (analise) => {
    const html = `
      <html dir="ltr">
        <head>
          <meta charset="UTF-8">
          <title>Análise Técnica - ${analise.titulo}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #333; margin: 20px; }
            h1 { color: hsl(var(--primary)); border-bottom: 3px solid hsl(var(--primary)); padding-bottom: 10px; }
            h2 { color: hsl(var(--primary)); margin-top: 20px; }
            .card { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .value { font-weight: bold; color: hsl(var(--chart-3)); }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background: hsl(var(--primary)); color: white; }
            .alerta { background: hsl(var(--chart-4) / 0.1); padding: 10px; border-left: 4px solid hsl(var(--chart-4)); margin: 10px 0; }
            .recomendacao { background: hsl(var(--chart-3) / 0.1); padding: 10px; border-left: 4px solid #10b981; margin: 10px 0; }
          </style>
        </head>
        <body>
          <h1>Relatório de Análise Técnica</h1>
          <p><strong>Título:</strong> ${analise.titulo}</p>
          <p><strong>Período:</strong> ${analise.periodo}</p>
          <p><strong>Data da Análise:</strong> ${new Date(analise.data_analise).toLocaleDateString("pt-BR")}</p>

          <h2>Posição Contábil</h2>
          <div class="grid">
            <div class="card">
              <p><strong>Lucro Acumulado</strong><br><span class="value">${fmt(analise.lucro_acumulado)}</span></p>
            </div>
            <div class="card">
              <p><strong>Saldo Acumulado</strong><br><span class="value">${fmt(analise.saldo_acumulado)}</span></p>
            </div>
            <div class="card">
              <p><strong>Caixa/Imobilizado</strong><br><span class="value">${fmt(analise.caixa_imobilizado)}</span></p>
            </div>
            <div class="card">
              <p><strong>Capital Social</strong><br><span class="value">${fmt(analise.capital_social)}</span></p>
            </div>
            <div class="card">
              <p><strong>Passivo Circulante</strong><br><span class="value">${fmt(analise.passivo_circulante)}</span></p>
            </div>
            <div class="card">
              <p><strong>Passivo Não Circulante</strong><br><span class="value">${fmt(analise.passivo_nao_circulante)}</span></p>
            </div>
          </div>

          <h2>Cálculo de Impostos</h2>
          <table>
            <tr>
              <th>Descrição</th>
              <th>Valor</th>
            </tr>
            <tr>
              <td>RCPC</td>
              <td>${fmt(analise.calculo_imposto?.rcpc || 0)}</td>
            </tr>
            <tr>
              <td>PIS</td>
              <td>${fmt(analise.calculo_imposto?.pis || 0)}</td>
            </tr>
            <tr>
              <td>COFINS</td>
              <td>${fmt(analise.calculo_imposto?.cofins || 0)}</td>
            </tr>
            <tr>
              <td>IRPJ</td>
              <td>${fmt(analise.calculo_imposto?.irpj || 0)}</td>
            </tr>
            <tr>
              <td>CSLL</td>
              <td>${fmt(analise.calculo_imposto?.csll || 0)}</td>
            </tr>
          </table>

          ${analise.parecer_ia ? `
            <h2>Parecer Técnico</h2>
            <div class="card">
              <p>${analise.parecer_ia.analise}</p>
            </div>
            
            ${analise.parecer_ia.alertas && analise.parecer_ia.alertas.length > 0 ? `
              <h3>Alertas</h3>
              ${analise.parecer_ia.alertas.map(a => `<div class="alerta">${a}</div>`).join("")}
            ` : ""}

            ${analise.parecer_ia.recomendacoes && analise.parecer_ia.recomendacoes.length > 0 ? `
              <h3>Recomendações</h3>
              ${analise.parecer_ia.recomendacoes.map(r => `<div class="recomendacao">${r}</div>`).join("")}
            ` : ""}
          ` : ""}

          ${analise.observacoes ? `<h2>Observações</h2><p>${analise.observacoes}</p>` : ""}
        </body>
      </html>
    `;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `analise-${analise.id}.html`;
    link.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Análise Técnica de Balanços</h2>
        <button onClick={() => { setEditItem(null); setModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus size={16} /> Nova Análise
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
      ) : analises.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <FileText size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-muted-foreground text-sm">Nenhuma análise técnica cadastrada</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {analises.map(a => (
            <div key={a.id} className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-foreground">{a.titulo}</h3>
                  <p className="text-xs text-muted-foreground">{a.periodo} • {new Date(a.data_analise).toLocaleDateString("pt-BR")}</p>
                </div>
                <div className="flex items-center gap-2">
                  {a.parecer_ia && <span className="text-xs bg-green-400/20 text-green-400 px-2 py-1 rounded-full">✓ Com Parecer</span>}
                  <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">{a.status}</span>
                </div>
              </div>

              {expandedId === a.id && (
                <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                  <div className="grid grid-cols-2 text-xs">
                    <div><p className="text-muted-foreground">Lucro Acumulado</p><p className="font-semibold text-green-400">{fmt(a.lucro_acumulado)}</p></div>
                    <div><p className="text-muted-foreground">Capital Social</p><p className="font-semibold text-blue-400">{fmt(a.capital_social)}</p></div>
                  </div>
                  {a.parecer_ia && (
                    <div className="p-2 bg-green-400/10 rounded text-xs">
                      <p className="text-muted-foreground line-clamp-3">{a.parecer_ia.analise}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 mt-3">
                <button onClick={() => setExpandedId(expandedId === a.id ? null : a.id)} className="flex-1 text-xs text-muted-foreground hover:text-foreground">
                  {expandedId === a.id ? "Ocultar" : "Detalhes"}
                </button>
                <button onClick={() => gerarRelatorio(a)} className="flex items-center gap-1 px-3 py-1 text-xs bg-primary/10/20 text-blue-400 rounded hover:bg-primary/10/30">
                  <Download size={12} /> Relatório
                </button>
                <button onClick={() => { setEditItem(a); setModal(true); }} className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground">Editar</button>
                <button onClick={() => handleDelete(a.id)} className="px-3 py-1 text-xs text-red-400 hover:underline">Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && <AnaliseTecnicaModal analise={editItem} onClose={() => { setModal(false); setEditItem(null); }} onSave={handleSave} />}
    </div>
  );
}