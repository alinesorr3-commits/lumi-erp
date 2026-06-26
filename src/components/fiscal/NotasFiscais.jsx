import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Download, Upload, X, FileText } from "lucide-react";
import PrintButton from "@/components/shared/PrintButton";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const TIPOS = ["NF-e", "NFC-e", "NFS-e", "CT-e", "MDF-e", "Carta Correção", "Recebidas"];

const situacaoConfig = {
  Rascunho: { color: "text-muted-foreground", bg: "bg-muted" },
  Emitida: { color: "text-blue-400", bg: "bg-blue-400/10" },
  Autorizada: { color: "text-green-400", bg: "bg-green-400/10" },
  Rejeitada: { color: "text-red-400", bg: "bg-red-400/10" },
  Cancelada: { color: "text-red-400", bg: "bg-red-400/10" },
  Denegada: { color: "text-yellow-400", bg: "bg-yellow-400/10" },
};

function NotaModal({ nota, onClose, onSave }) {
  const [form, setForm] = useState({
    tipo_doc: nota?.tipo_doc || "NF-e",
    numero: nota?.numero || "",
    serie: nota?.serie || "1",
    destinatario: nota?.destinatario || "",
    cnpj_destinatario: nota?.cnpj_destinatario || "",
    uf_destinatario: nota?.uf_destinatario || "",
    cfop: nota?.cfop || "",
    natureza_operacao: nota?.natureza_operacao || "Venda de Mercadorias",
    data_emissao: nota?.data_emissao || new Date().toISOString().slice(0, 10),
    valor_produtos: nota?.valor_produtos || 0,
    valor_frete: nota?.valor_frete || 0,
    valor_desconto: nota?.valor_desconto || 0,
    valor_ipi: nota?.valor_ipi || 0,
    valor_icms: nota?.valor_icms || 0,
    valor_icms_st: nota?.valor_icms_st || 0,
    valor_pis: nota?.valor_pis || 0,
    valor_cofins: nota?.valor_cofins || 0,
    chave_acesso: nota?.chave_acesso || "",
    protocolo: nota?.protocolo || "",
    situacao: nota?.situacao || "Rascunho",
    observacoes: nota?.observacoes || "",
  });
  const [saving, setSaving] = useState(false);

  const n = (f) => parseFloat(form[f]) || 0;
  const total = n("valor_produtos") + n("valor_frete") + n("valor_ipi") + n("valor_icms_st") - n("valor_desconto");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    let payload = { ...form, valor_total: Math.round(total * 100) / 100 };
    
    // Simulate transmission if saving as not Rascunho
    if (form.situacao !== "Rascunho") {
      try {
        const nfeData = {
          destinatario_cnpj: form.cnpj_destinatario,
          valor_total: payload.valor_total,
          numero: form.numero
        };
        const res = await base44.functions.invoke("emitirNFe", nfeData);
        if (res.data && res.data.success) {
          alert("Documento transmitido com sucesso!");
          payload.situacao = "Autorizada";
          payload.chave_acesso = res.data.chave_acesso;
          payload.protocolo = res.data.protocolo;
        } else {
          alert("Erro ao transmitir documento: " + (res.data?.error || "Desconhecido"));
          payload.situacao = "Rejeitada";
        }
      } catch (err) {
        alert("Erro de comunicação ao transmitir: " + err.message);
        payload.situacao = "Rejeitada";
      }
    }
    
    await onSave(payload);
    setSaving(false);
  };

  const UFs = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card">
          <h2 className="text-base font-semibold text-foreground">{nota ? "Editar Nota Fiscal" : "Nova Nota Fiscal"}</h2>
          <button onClick={onClose}><X size={18} className="text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Tipo e situação */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Tipo *</label>
              <select value={form.tipo_doc} onChange={e => setForm(f => ({ ...f, tipo_doc: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Situação</label>
              <select value={form.situacao} onChange={e => setForm(f => ({ ...f, situacao: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                {Object.keys(situacaoConfig).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Data Emissão *</label>
              <input required type="date" value={form.data_emissao} onChange={e => setForm(f => ({ ...f, data_emissao: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Número</label>
              <input value={form.numero} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" placeholder="000000001" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Série</label>
              <input value={form.serie} onChange={e => setForm(f => ({ ...f, serie: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">CFOP</label>
              <input value={form.cfop} onChange={e => setForm(f => ({ ...f, cfop: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" placeholder="5102" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Natureza da Operação</label>
            <input value={form.natureza_operacao} onChange={e => setForm(f => ({ ...f, natureza_operacao: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-muted-foreground mb-1.5">Destinatário / Remetente</label>
              <input value={form.destinatario} onChange={e => setForm(f => ({ ...f, destinatario: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">UF Dest.</label>
              <select value={form.uf_destinatario} onChange={e => setForm(f => ({ ...f, uf_destinatario: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                <option value="">—</option>
                {UFs.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Valores */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valores</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Valor Produtos (R$)", field: "valor_produtos" },
              { label: "Frete (R$)", field: "valor_frete" },
              { label: "Desconto (R$)", field: "valor_desconto" },
              { label: "IPI (R$)", field: "valor_ipi" },
              { label: "ICMS (R$)", field: "valor_icms" },
              { label: "ICMS-ST (R$)", field: "valor_icms_st" },
              { label: "PIS (R$)", field: "valor_pis" },
              { label: "COFINS (R$)", field: "valor_cofins" },
            ].map(({ label, field }) => (
              <div key={field}>
                <label className="block text-xs text-muted-foreground mb-1">{label}</label>
                <input type="number" step="0.01" min="0" value={form[field]}
                  onChange={e => setForm(f => ({ ...f, [field]: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
            ))}
            <div className="flex items-end">
              <div className="w-full p-2 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-sm font-bold text-primary">{fmt(total)}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Chave de Acesso (44 dígitos)</label>
            <input value={form.chave_acesso} onChange={e => setForm(f => ({ ...f, chave_acesso: e.target.value }))}
              maxLength={44}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary font-mono text-xs" placeholder="00000000000000000000000000000000000000000000" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Protocolo SEFAZ</label>
              <input value={form.protocolo} onChange={e => setForm(f => ({ ...f, protocolo: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Observações</label>
              <input value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm bg-muted text-muted-foreground">Cancelar</button>
            <button type="button" onClick={(e) => {
              e.preventDefault();
              setForm(f => ({ ...f, situacao: "Rascunho" }));
              handleSubmit(e);
            }} disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm bg-muted border border-border text-foreground hover:bg-card disabled:opacity-50">
              {saving ? "Salvando..." : "Salvar Rascunho"}
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm bg-primary text-primary-foreground disabled:opacity-50 flex items-center justify-center gap-1.5">
              {saving ? "Processando..." : "Transmitir para SEFAZ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NotasFiscais() {
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tipoFiltro, setTipoFiltro] = useState("NF-e");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [progresso, setProgresso] = useState(null);
  const xmlInputRef = useRef();

  const load = () => {
    setLoading(true);
    base44.entities.NotaFiscalFiscal.list("-data_emissao").then(data => { setNotas(data); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (data) => {
    if (editItem) {
      setNotas(prev => prev.map(n => n.id === editItem.id ? { ...editItem, ...data } : n));
      setModal(false); setEditItem(null);
      base44.entities.NotaFiscalFiscal.update(editItem.id, data);
    } else {
      setModal(false); setEditItem(null);
      const nova = await base44.entities.NotaFiscalFiscal.create(data);
      setNotas(prev => [nova, ...prev]);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir esta nota?")) return;
    setNotas(prev => prev.filter(n => n.id !== id));
    base44.entities.NotaFiscalFiscal.delete(id);
  };

  const parseXML = async (file) => {
    const text = await file.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "text/xml");
    const get = (tag) => xml.getElementsByTagName(tag)[0]?.textContent || "";
    return {
      tipo_doc: "Recebida",
      numero: get("nNF"),
      serie: get("serie"),
      chave_acesso: get("chNFe"),
      data_emissao: get("dhEmi")?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      destinatario: get("xNome"),
      cnpj_destinatario: get("CNPJ") || get("CPF"),
      cfop: get("CFOP"),
      natureza_operacao: get("natOp"),
      valor_produtos: parseFloat(get("vProd")) || 0,
      valor_total: parseFloat(get("vNF")) || 0,
      valor_icms: parseFloat(get("vICMS")) || 0,
      valor_pis: parseFloat(get("vPIS")) || 0,
      valor_cofins: parseFloat(get("vCOFINS")) || 0,
      valor_ipi: parseFloat(get("vIPI")) || 0,
      situacao: "Autorizada",
    };
  };

  const handleImportXML = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setProgresso({ atual: 0, total: files.length, nomeArquivo: "" });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgresso({ atual: i + 1, total: files.length, nomeArquivo: file.name });
      const dados = await parseXML(file);
      await base44.entities.NotaFiscalFiscal.create(dados);
    }

    setProgresso(null);
    load();
    e.target.value = "";
  };

  const filtrados = notas.filter(n => {
    if (tipoFiltro === "Recebidas") return n.tipo_doc === "Recebida";
    return n.tipo_doc === tipoFiltro;
  }).filter(n =>
    !search || n.destinatario?.toLowerCase().includes(search.toLowerCase()) ||
    n.numero?.includes(search) || n.chave_acesso?.includes(search)
  );

  const exportarCSV = () => {
    const header = "Tipo,Número,Série,Destinatário,CFOP,Data,Total,Situação,Chave\n";
    const rows = filtrados.map(n =>
      `${n.tipo_doc},${n.numero || ""},${n.serie || ""},${n.destinatario || ""},${n.cfop || ""},${n.data_emissao || ""},${n.valor_total || 0},${n.situacao || ""},${n.chave_acesso || ""}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "notas_fiscais.csv"; a.click();
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-base font-semibold text-foreground">Notas Fiscais</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
              className="bg-card border border-border rounded-lg pl-8 pr-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary w-48" />
          </div>
          <button onClick={exportarCSV} className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-muted-foreground rounded-lg text-xs hover:text-foreground">
            <Download size={13} /> Exportar
          </button>
          <PrintButton label="Imprimir" />
          <input ref={xmlInputRef} type="file" accept=".xml" multiple className="hidden" onChange={handleImportXML} />
          <button onClick={() => xmlInputRef.current?.click()} disabled={!!progresso}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs hover:bg-primary/90 disabled:opacity-50">
            <Upload size={13} /> Importar XML{progresso ? ` (${progresso.atual}/${progresso.total})` : " em lote"}
          </button>
          <button onClick={() => { setEditItem(null); setModal(true); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs hover:bg-primary/90">
            <Plus size={13} /> Nova Nota
          </button>
        </div>
      </div>

      {/* Progresso importação em lote */}
      {progresso && (
        <div className="bg-card border border-border rounded-xl p-4 mb-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-foreground font-medium">Importando XMLs em lote...</span>
            <span className="text-muted-foreground">{progresso.atual} / {progresso.total}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-green-500/10 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progresso.atual / progresso.total) * 100}%` }} />
          </div>
          <p className="text-xs text-muted-foreground truncate">📄 {progresso.nomeArquivo}</p>
        </div>
      )}

      {/* Filtros tipo */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {TIPOS.map(t => (
          <button key={t} onClick={() => setTipoFiltro(t)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all
 ${tipoFiltro === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["NF-e", "Destinatário", "CFOP", "Emissão", "Total", "Situação", "Ações"].map(h => (
                  <th key={h} className={`text-xs text-muted-foreground px-4 py-3 ${h === "Total" || h === "Ações" ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8"><div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin mx-auto" /></td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-sm text-muted-foreground">
                  <FileText size={24} className="mx-auto mb-2 opacity-50" />
                  Nenhuma nota encontrada
                </td></tr>
              ) : filtrados.map(n => {
                const s = situacaoConfig[n.situacao] || situacaoConfig.Rascunho;
                return (
                  <tr key={n.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-xs font-medium text-foreground">{n.tipo_doc} {n.numero ? `nº ${n.numero}` : ""}{n.serie ? `/S${n.serie}` : ""}</p>
                        {n.chave_acesso && <p className="text-xs text-muted-foreground font-mono">{n.chave_acesso.slice(0, 20)}...</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{n.destinatario || "—"}{n.uf_destinatario ? ` / ${n.uf_destinatario}` : ""}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{n.cfop || "—"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{n.data_emissao || "—"}</td>
                    <td className="px-4 py-3 text-sm font-bold text-foreground text-right">{fmt(n.valor_total)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>{n.situacao}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setEditItem(n); setModal(true); }} className="text-xs text-muted-foreground hover:text-foreground">Editar</button>
                        <button onClick={() => handleDelete(n.id)} className="text-xs text-red-400 hover:underline">Excluir</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal && <NotaModal nota={editItem} onClose={() => { setModal(false); setEditItem(null); }} onSave={handleSave} />}
    </div>
  );
}