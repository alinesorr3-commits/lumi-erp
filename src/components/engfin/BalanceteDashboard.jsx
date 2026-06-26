import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, FileText, Download, Upload } from "lucide-react";
import BalanceteInterativo from "./BalanceteInterativo";
import { useToast } from "@/components/ui/use-toast";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function BalanceteDashboard() {
  const [balancetes, setBalancetes] = useState([]);
  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [importModal, setImportModal] = useState(false);
  const [importArquivoModal, setImportArquivoModal] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState("");
  const [empresasBalancetes, setEmpresasBalancetes] = useState([]);
  const [uploadandoArquivo, setUploadandoArquivo] = useState(false);
  const { toast } = useToast();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bal, cont, emps] = await Promise.all([
        base44.entities.Balancete.list("-data_balancete"),
        base44.entities.PlanoContas.filter({ ativa: true }, "codigo"),
        base44.entities.EmpresaCliente.list()
      ]);
      setBalancetes(bal);
      setContas(cont);
      setEmpresas(emps);
    } catch (err) {
      toast({ title: "✗ Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCarregarBalanceetes = async (empresaId) => {
    try {
      const bals = await base44.entities.Balancete.list("-data_balancete");
      setEmpresasBalancetes(bals);
    } catch (err) {
      toast({ title: "✗ Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleImportarBalancete = (balanceteOrigem) => {
    const novoBalancete = {
      ...balanceteOrigem,
      id: undefined,
      titulo: `${balanceteOrigem.titulo} (Importado)`
    };
    setEditItem(novoBalancete);
    setImportModal(false);
    setModal(true);
  };

  const handleImportarArquivo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadandoArquivo(true);
    try {
      // Upload do arquivo
      const uploadRes = await base44.integrations.Core.UploadFile({ file });
      
      // Extrair dados do balancete
      const importRes = await base44.functions.invoke('importarBalanceteArquivo', {
        arquivo_url: uploadRes.file_url,
        titulo: file.name.split('.')[0],
        periodo: new Date().toISOString().slice(0, 7)
      });

      if (importRes.data.sucesso) {
        setEditItem(importRes.data.balancete);
        setImportArquivoModal(false);
        setModal(true);
        toast({ 
          title: "✓ Balancete Importado", 
          description: `${importRes.data.contas_importadas} contas com sucesso` 
        });
      } else {
        toast({ title: "✗ Erro", description: importRes.data.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "✗ Erro", description: err.message, variant: "destructive" });
    } finally {
      setUploadandoArquivo(false);
    }
  };

  const handleSave = async (data) => {
    try {
      if (editItem) {
        await base44.entities.Balancete.update(editItem.id, data);
      } else {
        await base44.entities.Balancete.create(data);
      }
      setModal(false);
      setEditItem(null);
      loadData();
      toast({ title: "✓ Salvo" });
    } catch (err) {
      toast({ title: "✗ Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir?")) return;
    try {
      await base44.entities.Balancete.delete(id);
      loadData();
    } catch (err) {
      toast({ title: "✗ Erro", description: err.message, variant: "destructive" });
    }
  };

  const gerarHTML = (b) => {
    const html = `<html><head><meta charset="UTF-8"><title>${b.titulo}</title><style>
      body{font-family:Arial;color:#333;margin:20px}h1{color:hsl(var(--primary));border-bottom:3px solid hsl(var(--primary))}table{width:100%;border-collapse:collapse;margin:15px 0}
      th,td{padding:10px;text-align:left;border-bottom:1px solid #ddd}th{background:hsl(var(--primary));color:#fff}.total{background:#f3f4f6;font-weight:bold}
    </style></head><body><h1>${b.titulo}</h1><p><strong>Período:</strong> ${b.periodo}</p>
    <table><tr><th>Conta</th><th>S.Ini Deb</th><th>S.Ini Cre</th><th>Deb.Per</th><th>Cre.Per</th><th>S.Fin Deb</th><th>S.Fin Cre</th></tr>
    ${b.movimentacoes.map(m => `<tr><td>${m.conta_nome}</td><td>${fmt(m.saldo_inicial_debito)}</td><td>${fmt(m.saldo_inicial_credito)}</td><td>${fmt(m.debito_periodo)}</td><td>${fmt(m.credito_periodo)}</td><td>${fmt(m.saldo_final_debito)}</td><td>${fmt(m.saldo_final_credito)}</td></tr>`).join("")}
    <tr class="total"><td>TOTAIS</td><td>${fmt(b.totais.total_debito_inicial)}</td><td>${fmt(b.totais.total_credito_inicial)}</td><td>${fmt(b.totais.total_debito_periodo)}</td><td>${fmt(b.totais.total_credito_periodo)}</td><td>${fmt(b.totais.total_debito_final)}</td><td>${fmt(b.totais.total_credito_final)}</td></tr>
    </table>${b.parecer_ia ? `<h2>Parecer</h2><p>${b.parecer_ia.analise}</p>` : ""}</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `balancete-${b.id}.html`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-base font-semibold text-foreground">Balancete Interativo</h2>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setImportArquivoModal(true)} className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10/20 text-yellow-400 rounded-lg text-sm font-medium hover:bg-yellow-500/10/30">
            <Upload size={16} /> Importar Arquivo
          </button>
          <button onClick={() => setImportModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary/10/20 text-blue-400 rounded-lg text-sm font-medium hover:bg-primary/10/30">
            ↓ Duplicar Balancete
          </button>
          <button onClick={() => { setEditItem(null); setModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
            <Plus size={16} /> Novo
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
      ) : balancetes.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <FileText size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-muted-foreground text-sm">Nenhum balancete cadastrado</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {balancetes.map(b => (
            <div key={b.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{b.titulo}</h3>
                  <p className="text-xs text-muted-foreground">{b.periodo} • {new Date(b.data_balancete).toLocaleDateString("pt-BR")}</p>
                </div>
                <div className="flex gap-1">
                  {b.parecer_ia && <span className="text-xs bg-green-400/20 text-green-400 px-2 py-1 rounded-full">✓</span>}
                  {b.totais.total_debito_final === b.totais.total_credito_final ? (
                    <span className="text-xs bg-green-400/20 text-green-400 px-2 py-1 rounded-full">✓ Balanceado</span>
                  ) : (
                    <span className="text-xs bg-yellow-400/20 text-yellow-600 px-2 py-1 rounded-full">⚠ Desbalanceado</span>
                  )}
                </div>
              </div>

              {expandedId === b.id && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                    <div><p className="text-muted-foreground">Débito Final</p><p className="font-bold text-green-400">{fmt(b.totais.total_debito_final)}</p></div>
                    <div><p className="text-muted-foreground">Crédito Final</p><p className="font-bold text-blue-400">{fmt(b.totais.total_credito_final)}</p></div>
                    <div><p className="text-muted-foreground">Contas</p><p className="font-bold">{b.movimentacoes.length}</p></div>
                  </div>
                  {b.parecer_ia && (
                    <div className="p-2 bg-green-400/10 rounded text-xs">
                      <p className="text-muted-foreground line-clamp-2">{b.parecer_ia.analise}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 mt-3">
                <button onClick={() => setExpandedId(expandedId === b.id ? null : b.id)} className="flex-1 text-xs text-muted-foreground hover:text-foreground">
                  {expandedId === b.id ? "Ocultar" : "Detalhes"}
                </button>
                <button onClick={() => gerarHTML(b)} className="px-3 py-1 text-xs bg-primary/10/20 text-blue-400 rounded hover:bg-primary/10/30 flex items-center gap-1">
                  <Download size={12} /> Relatório
                </button>
                <button onClick={() => { setEditItem(b); setModal(true); }} className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground">Editar</button>
                <button onClick={() => handleDelete(b.id)} className="px-3 py-1 text-xs text-red-400 hover:underline">Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && <BalanceteInterativo balancete={editItem} contas={contas} onClose={() => { setModal(false); setEditItem(null); }} onSave={handleSave} />}

      {/* Modal: Importar Arquivo */}
      {importArquivoModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-2xl shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">Importar Balancete de Arquivo</h2>
              <button onClick={() => setImportArquivoModal(false)} className="text-muted-foreground hover:text-foreground"><Upload size={18} className="rotate-45" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-4 bg-blue-400/10 border border-blue-400/30 rounded-lg">
                <p className="text-sm text-blue-600 font-medium mb-2">📋 Formatos Suportados</p>
                <p className="text-xs text-muted-foreground">PDF, Excel (XLSX), CSV com colunas: código, nome, tipo, saldo_inicial_debito, saldo_inicial_credito, debito_periodo, credito_periodo</p>
              </div>

              <label className="block">
                <div className="border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:border-primary/50 transition-colors text-center">
                  <Upload size={32} className="mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground mb-1">Clique para selecionar arquivo</p>
                  <p className="text-xs text-muted-foreground">ou arraste o arquivo aqui</p>
                  <input 
                    type="file" 
                    onChange={handleImportarArquivo} 
                    disabled={uploadandoArquivo}
                    accept=".pdf,.xlsx,.xls,.csv" 
                    className="hidden" 
                  />
                </div>
              </label>

              <button onClick={() => setImportArquivoModal(false)} className="w-full py-2 bg-muted text-muted-foreground rounded-lg text-sm hover:bg-muted/80">
                {uploadandoArquivo ? "Processando..." : "Cancelar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Duplicar Balancete */}
      {importModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-2xl shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card">
              <h2 className="text-base font-semibold text-foreground">Duplicar Balancete Existente</h2>
              <button onClick={() => setImportModal(false)} className="text-muted-foreground hover:text-foreground"><FileText size={18} className="rotate-45" /></button>
            </div>
            <div className="p-5 space-y-4">
              {balancetes.length === 0 ? (
                <div className="p-4 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
                  <p className="text-sm text-yellow-600 font-medium mb-2">📝 Nenhum balancete disponível</p>
                  <p className="text-xs text-muted-foreground mb-3">Para importar um balancete, você precisa criar um primeiro. Clique no botão "Novo" para criar um balancete.</p>
                  <button onClick={() => { setImportModal(false); setEditItem(null); setModal(true); }} className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
                    ➕ Criar Primeiro Balancete
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-3 uppercase">Selecione um balancete para duplicar:</label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {balancetes.map(b => (
                      <div key={b.id} className="p-3 bg-muted/50 border border-border rounded-lg hover:border-primary/50 hover:bg-muted transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{b.titulo}</p>
                            <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                              <span>📅 {new Date(b.data_balancete).toLocaleDateString("pt-BR")}</span>
                              <span>📊 {b.movimentacoes?.length || 0} contas</span>
                              {b.parecer_ia && <span>✓ Com parecer</span>}
                            </div>
                          </div>
                          <button onClick={() => handleImportarBalancete(b)} className="flex-shrink-0 ml-2 px-3 py-1.5 text-xs bg-primary/10/20 text-blue-400 rounded-lg hover:bg-primary/10/30 font-medium whitespace-nowrap">
                            Importar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={() => setImportModal(false)} className="w-full py-2 bg-muted text-muted-foreground rounded-lg text-sm hover:bg-muted/80 transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}