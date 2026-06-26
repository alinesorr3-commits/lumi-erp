import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, X, Search, BookOpen, Upload } from "lucide-react";
import PrintButton from "@/components/shared/PrintButton";
import ParecerIA from "@/components/shared/ParecerIA";
import ImportarNCMModal from "@/components/fiscal/ImportarNCMModal";
import { useToast } from "@/components/ui/use-toast";

function NCMModal({ ncm, onClose, onSave }) {
  const [form, setForm] = useState({
    codigo: ncm?.codigo || "",
    descricao: ncm?.descricao || "",
    finalidade_fiscal: ncm?.finalidade_fiscal || "Comercialização",
    tipo_produto: ncm?.tipo_produto || "Mercadoria para Revenda",
    cfop_entrada: ncm?.cfop_entrada || "2102",
    cfop_saida: ncm?.cfop_saida || "5102",
    ipi_percentual: ncm?.ipi_percentual ?? 0,
    ii_percentual: ncm?.ii_percentual ?? 0,
    icms_percentual: ncm?.icms_percentual ?? 12,
    fcp_percentual: ncm?.fcp_percentual ?? 0,
    mva_percentual: ncm?.mva_percentual ?? 0,
    possui_st: ncm?.possui_st ?? false,
    gera_difal: ncm?.gera_difal ?? false,
    credito_icms: ncm?.credito_icms ?? true,
    credito_pis_cofins: ncm?.credito_pis_cofins ?? true,
    controla_estoque: ncm?.controla_estoque ?? true,
    participa_bloco_k: ncm?.participa_bloco_k ?? false,
    conta_contabil: ncm?.conta_contabil || "",
    departamento: ncm?.departamento || "Produção",
    observacoes_fiscais: ncm?.observacoes_fiscais || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      ...form,
      ipi_percentual: parseFloat(form.ipi_percentual) || 0,
      ii_percentual: parseFloat(form.ii_percentual) || 0,
      icms_percentual: parseFloat(form.icms_percentual) || 0,
      fcp_percentual: parseFloat(form.fcp_percentual) || 0,
      mva_percentual: parseFloat(form.mva_percentual) || 0,
    });
    setSaving(false);
  };

  const SN = ({ label, field }) => (
    <div>
      <label className="block text-xs text-muted-foreground mb-1.5">{label}</label>
      <select value={form[field] ? "Sim" : "Não"} onChange={e => setForm(f => ({ ...f, [field]: e.target.value === "Sim" }))}
        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
        <option>Sim</option><option>Não</option>
      </select>
    </div>
  );

  const NumField = ({ label, field }) => (
    <div>
      <label className="block text-xs text-muted-foreground mb-1.5">{label}</label>
      <input type="number" step="0.01" min="0" value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card">
          <h2 className="text-base font-semibold text-foreground">{ncm ? "Editar NCM" : "Novo NCM"}</h2>
          <button onClick={onClose}><X size={18} className="text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Código NCM *</label>
              <input required value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                placeholder="0000.00.00" maxLength={10} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-muted-foreground mb-1.5">Descrição *</label>
              <input required value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Finalidade Fiscal</label>
              <select value={form.finalidade_fiscal} onChange={e => setForm(f => ({ ...f, finalidade_fiscal: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                {["Industrialização", "Comercialização", "Uso e Consumo", "Ativo Imobilizado", "Serviços"].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Tipo de Produto</label>
              <select value={form.tipo_produto} onChange={e => setForm(f => ({ ...f, tipo_produto: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                {["Insumo", "Produto Acabado", "Mercadoria para Revenda", "Material de Uso e Consumo", "Ativo Imobilizado", "Serviço"].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <SN label="Gera DIFAL" field="gera_difal" />
            <SN label="Possui ST" field="possui_st" />
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">CFOP Entrada</label>
              <input value={form.cfop_entrada} onChange={e => setForm(f => ({ ...f, cfop_entrada: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">CFOP Saída</label>
              <input value={form.cfop_saida} onChange={e => setForm(f => ({ ...f, cfop_saida: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <SN label="Crédito ICMS" field="credito_icms" />
            <SN label="Crédito PIS/COFINS" field="credito_pis_cofins" />
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Conta Contábil</label>
              <input value={form.conta_contabil} onChange={e => setForm(f => ({ ...f, conta_contabil: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Departamento</label>
              <input value={form.departamento} onChange={e => setForm(f => ({ ...f, departamento: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <SN label="Controla Estoque" field="controla_estoque" />
            <SN label="Participa Bloco K" field="participa_bloco_k" />
            <NumField label="IPI (%)" field="ipi_percentual" />
            <NumField label="II (%)" field="ii_percentual" />
          </div>

          <div className="grid grid-cols-4 gap-3">
            <NumField label="ICMS (%)" field="icms_percentual" />
            <NumField label="FCP (%)" field="fcp_percentual" />
            <NumField label="MVA (%)" field="mva_percentual" />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Observações Fiscais</label>
            <textarea rows={2} value={form.observacoes_fiscais} onChange={e => setForm(f => ({ ...f, observacoes_fiscais: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm bg-muted text-muted-foreground">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm bg-primary text-primary-foreground disabled:opacity-50">
              {saving ? "Salvando..." : ncm ? "Salvar" : "Criar NCM"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TabelaNCMComponent() {
  const [ncms, setNcms] = useState([]);
  const [regime, setRegime] = useState("Simples Nacional");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [importando, setImportando] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    base44.entities.TabelaNCM.list().then(data => { setNcms(data); setLoading(false); });
    base44.entities.ConfigEncargos.list().then(configs => {
      if (configs && configs.length > 0 && configs[0].regime_tributario) {
        const regimes = {
          "simples_nacional": "Simples Nacional",
          "lucro_presumido": "Lucro Presumido",
          "lucro_real": "Lucro Real"
        };
        setRegime(regimes[configs[0].regime_tributario] || "Simples Nacional");
      }
    });
  };
  useEffect(() => { load(); }, []);

  const handleImportarMVASefaz = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv,.xlsx,.xls,.pdf";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      setImportando(true);
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        const result = await base44.functions.invoke("importarMVASefaz", { arquivo_url: file_url });
        
        if (result.data.sucesso) {
          toast({ title: "✓ MVA Atualizado", description: result.data.mensagem });
          load();
        } else {
          toast({ title: "✗ Erro", description: result.data.error, variant: "destructive" });
        }
      } catch (err) {
        toast({ title: "✗ Erro", description: err.message, variant: "destructive" });
      } finally {
        setImportando(false);
      }
    };
    input.click();
  };

  const handleSave = async (data) => {
    if (editItem) {
      await base44.entities.TabelaNCM.update(editItem.id, data);
    } else {
      // Busca MVA da SEFAZ para novo NCM
      try {
        const mvaSefaz = await base44.functions.invoke('buscarMVASefaz', { codigo_ncm: data.codigo });
        if (mvaSefaz.data.sucesso) {
          data.mva_percentual = mvaSefaz.data.mva_percentual;
          data.observacoes_fiscais = `MVA SEFAZ Portaria 195/2019 - ${mvaSefaz.data.mva_percentual}% - Atualizado em ${new Date().toLocaleDateString('pt-BR')}`;
          toast({ title: "✓ MVA Vinculado", description: `MVA de ${mvaSefaz.data.mva_percentual}% aplicado automaticamente` });
        }
      } catch (err) {
        console.log('Aviso: Não foi possível buscar MVA SEFAZ automaticamente');
      }
      await base44.entities.TabelaNCM.create(data);
    }
    setModal(false); setEditItem(null); load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir este NCM?")) return;
    try {
      await base44.entities.TabelaNCM.delete(id);
      toast({ title: "✓ Sucesso", description: "NCM excluído com sucesso" });
    } catch (err) {
      toast({ title: "✗ Erro ao excluir", description: err.message, variant: "destructive" });
    }
    load();
  };

  const handleDeleteBatch = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Excluir ${selected.size} NCM(s)?`)) return;

    setLoading(true);
    // Convertendo o Set para Array para deletar de forma síncrona
    const ids = Array.from(selected);
    try {
      // Deletando em lote por id para maior confiabilidade
      await Promise.all(ids.map(id => base44.entities.TabelaNCM.delete(id)));
      toast({ title: "✓ Sucesso", description: `${ids.length} NCM(s) excluído(s)` });
    } catch (err) {
      toast({ title: "✗ Erro ao excluir", description: err.message, variant: "destructive" });
    } finally {
      setSelected(new Set());
      load();
    }
  };

  const toggleSelect = (id) => {
    const newSet = new Set(selected);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelected(newSet);
  };



  const filtered = ncms.filter(n =>
    !search || n.codigo?.includes(search) || n.descricao?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-foreground">Tabela NCM Inteligente</h2>
          {selected.size > 0 && (
            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
              {selected.size} selecionado{selected.size > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
           {selected.size > 0 && (
             <button onClick={handleDeleteBatch} className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/10/30">
               Excluir {selected.size}
             </button>
           )}
           <button onClick={() => setShowImportModal(true)} className="flex items-center gap-1.5 px-3 py-2 bg-muted border border-border text-muted-foreground rounded-lg text-sm hover:text-foreground hover:border-primary transition-colors">
             <Upload size={14} /> Importar Arquivo
           </button>
           <button onClick={handleImportarMVASefaz} disabled={importando} className="flex items-center gap-1.5 px-3 py-2 bg-yellow-500/10/20 text-yellow-400 rounded-lg text-sm font-medium hover:bg-yellow-500/10/30 disabled:opacity-50" title="Importa MVA da SEFAZ Portaria 195/2019">
             <BookOpen size={14} /> {importando ? "Processando..." : "MVA SEFAZ"}
           </button>
           <PrintButton label="Imprimir Tabela" />
           <button onClick={() => { setEditItem(null); setModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
             <Plus size={16} /> Novo NCM
           </button>
         </div>
      </div>
      <p className="text-xs text-muted-foreground mb-4">Importação inteligente: PDF, XLS, XLSX, XML, CSV com extração automática via IA</p>

      <div className="relative mb-4">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por código ou descrição..."
          className="w-full bg-card border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
      </div>

      <div className="mb-4">
        <ParecerIA 
          title="Consultoria e Regras NCM com IA"
          prompt={`Atuando como um Consultor Fiscal Especialista:
1. Analise os NCMs cadastrados listados abaixo e forneça a opção correta para TODOS os dados (IPI, ICMS, CFOP de entrada/saída, MVA, ST, DIFAL) de acordo com o regime tributário atual da empresa (${regime}) e a finalidade fiscal informada (ex: Revenda, Industrialização, Uso e Consumo).
2. Identifique inconsistências, riscos ou falta de compliance tributário nos registros atuais.
3. Forneça um MODELO PRONTO (em formato de tabela markdown ou CSV) para que o usuário possa preencher novos dados em Excel e ter sua importação automática aceita com sucesso pelo sistema.
Importante: Os cabeçalhos que a importação do sistema reconhece perfeitamente são: "Código NCM", "Descrição", "Finalidade Fiscal", "Tipo de Produto", "CFOP Entrada", "CFOP Saída", "IPI (%)", "II (%)", "ICMS (%)", "FCP (%)", "MVA (%)", "Gera DIFAL", "Possui ST", "Controla Estoque". Inclua 2 exemplos reais no modelo com base no regime ${regime}.

NCMs atuais (amostra):
${JSON.stringify(filtered.slice(0, 10).map(n => ({ codigo: n.codigo, descricao: n.descricao, finalidade: n.finalidade_fiscal, tipo: n.tipo_produto, cfop_entrada: n.cfop_entrada, cfop_saida: n.cfop_saida, icms: n.icms_percentual, ipi: n.ipi_percentual, mva: n.mva_percentual, st: n.possui_st, difal: n.gera_difal })), null, 2)}`}
        />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs text-muted-foreground px-4 py-3 w-8">
                  <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={() => {
                      if (selected.size === filtered.length) setSelected(new Set());
                      else setSelected(new Set(filtered.map(n => n.id)));
                    }}
                    className="cursor-pointer" />
                </th>
                {["Código NCM", "Descrição", "Tipo Produto", "CFOP E/S", "IPI%", "ICMS%", "MVA%", "ST", "DIFAL", "Ações"].map(h => (
                  <th key={h} className="text-left text-xs text-muted-foreground px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="text-center py-8"><div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12 text-sm text-muted-foreground">
                  <BookOpen size={24} className="mx-auto mb-2 opacity-50" />
                  Nenhum NCM cadastrado
                </td></tr>
              ) : filtered.map(n => (
               <tr key={n.id} className={`border-b border-border/50 transition-colors ${selected.has(n.id) ? "bg-primary/10" : "hover:bg-muted/30"}`}>
                 <td className="px-4 py-3">
                   <input type="checkbox" checked={selected.has(n.id)} onChange={() => toggleSelect(n.id)} className="cursor-pointer" />
                 </td>
                 <td className="px-4 py-3 text-sm font-mono font-bold text-blue-400">{n.codigo}</td>
                  <td className="px-4 py-3 text-sm text-foreground max-w-[200px] truncate">{n.descricao}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{n.tipo_produto}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{n.cfop_entrada}/{n.cfop_saida}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{n.ipi_percentual}%</td>
                  <td className="px-4 py-3 text-sm text-foreground">{n.icms_percentual}%</td>
                  <td className="px-4 py-3 text-sm text-foreground">{n.mva_percentual}%</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${n.possui_st ? "bg-yellow-400/10 text-yellow-400" : "bg-muted text-muted-foreground"}`}>
                      {n.possui_st ? "Sim" : "Não"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${n.gera_difal ? "bg-blue-400/10 text-blue-400" : "bg-muted text-muted-foreground"}`}>
                      {n.gera_difal ? "Sim" : "Não"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditItem(n); setModal(true); }} className="text-xs text-muted-foreground hover:text-foreground">Editar</button>
                      <button onClick={() => handleDelete(n.id)} className="text-xs text-red-400 hover:underline">Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && <NCMModal ncm={editItem} onClose={() => { setModal(false); setEditItem(null); }} onSave={handleSave} />}
      
      {showImportModal && (
        <ImportarNCMModal 
          onClose={() => setShowImportModal(false)} 
          onImportado={() => {
            setShowImportModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}