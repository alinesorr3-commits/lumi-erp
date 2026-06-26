import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, X, Shield, AlertTriangle, CheckCircle, Upload, History, Download, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const TIPOS_CERTIDAO = ["FGTS", "INSS", "Trabalhista (CNDT)", "Receita Federal", "Estadual", "Municipal", "Outro"];

const SITUACAO_CONFIG = {
  "Regular":       { color: "text-green-400", bg: "bg-green-400/10" },
  "Irregular":     { color: "text-red-400",     bg: "bg-red-400/10" },
  "Vencida":       { color: "text-red-400",     bg: "bg-red-400/10" },
  "Em Renovação":  { color: "text-yellow-400",  bg: "bg-yellow-400/10" },
};

const LINKS_RAPIDOS = [
  { nome: "Certidão FGTS (CEF)",         url: "https://certificadofgts.caixa.gov.br/", icone: "🏦" },
  { nome: "Certidão INSS (Dataprev)",     url: "https://cnis.previdencia.gov.br/",     icone: "🛡" },
  { nome: "CNDT – Trabalhista",           url: "https://cndt.tst.jus.br/",             icone: "⚖️" },
  { nome: "Receita Federal – CND",        url: "https://www.receita.fazenda.gov.br/",  icone: "🏛" },
  { nome: "e-CAC",                        url: "https://cav.receita.fazenda.gov.br/",  icone: "💻" },
  { nome: "Gov.br",                       url: "https://www.gov.br/",                  icone: "🇧🇷" },
];

function diasRestantes(data) {
  if (!data) return null;
  return Math.ceil((new Date(data + "T00:00:00") - new Date()) / (1000 * 60 * 60 * 24));
}

function CertidaoModal({ certidao, onClose, onSave }) {
  const [form, setForm] = useState({
    tipo: certidao?.tipo || "Receita Federal",
    empresa: certidao?.empresa || "",
    numero: certidao?.numero || "",
    data_emissao: certidao?.data_emissao || "",
    data_validade: certidao?.data_validade || "",
    situacao: certidao?.situacao || "Regular",
    observacoes: certidao?.observacoes || "",
    historico: certidao?.historico || [],
  });
  const [uploading, setUploading] = useState(false);
  const [arquivoUrl, setArquivoUrl] = useState(certidao?.arquivo_url || "");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const res = await base44.integrations.Core.UploadFile({ file });
    setArquivoUrl(res.file_url);
    setUploading(false);
    toast({ title: "✓ PDF enviado" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ ...form, arquivo_url: arquivoUrl });
    setSaving(false);
  };

  const dias = diasRestantes(form.data_validade);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card">
          <h2 className="text-base font-semibold text-foreground">{certidao ? "Editar Certidão" : "Nova Certidão"}</h2>
          <button onClick={onClose}><X size={18} className="text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Tipo *</label>
              <select required value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                {TIPOS_CERTIDAO.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Situação</label>
              <select value={form.situacao} onChange={e => setForm(f => ({ ...f, situacao: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                {Object.keys(SITUACAO_CONFIG).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">Empresa / CNPJ</label>
            <input value={form.empresa} onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))}
              placeholder="Razão Social ou CNPJ"
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">Número / Código</label>
            <input value={form.numero} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Data de Emissão</label>
              <input type="date" value={form.data_emissao} onChange={e => setForm(f => ({ ...f, data_emissao: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Data de Validade *</label>
              <input required type="date" value={form.data_validade} onChange={e => setForm(f => ({ ...f, data_validade: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
          </div>

          {dias !== null && (
            <div className={`p-2 rounded-lg text-xs flex items-center gap-2 ${dias < 0 ? "bg-red-500/10/10 text-red-400" : dias <= 30 ? "bg-yellow-500/10/10 text-yellow-400" : dias <= 60 ? "bg-yellow-500/10/10 text-yellow-400" : "bg-green-500/10/10 text-green-400"}`}>
              <AlertTriangle size={12} />
              {dias < 0 ? "Certidão VENCIDA!" : dias === 0 ? "Vence HOJE!" : `Vence em ${dias} dias`}
            </div>
          )}

          {/* Upload PDF */}
          <div>
            <label className="block text-xs text-muted-foreground mb-1">PDF da Certidão</label>
            <div className="flex gap-2">
              <label className="flex-1 flex items-center gap-2 px-3 py-2 bg-muted border border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50">
                <Upload size={13} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{uploading ? "Enviando..." : arquivoUrl ? "Substituir PDF" : "Carregar PDF"}</span>
                <input type="file" accept=".pdf" onChange={handleUpload} disabled={uploading} className="hidden" />
              </label>
              {arquivoUrl && (
                <a href={arquivoUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 bg-primary/10/10 text-blue-400 rounded-lg text-xs hover:bg-primary/10/20">
                  <Download size={12} /> Ver PDF
                </a>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">Observações</label>
            <textarea rows={2} value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary resize-none" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-muted text-muted-foreground rounded-lg text-sm">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm disabled:opacity-50">
              {saving ? "Salvando..." : certidao ? "Salvar" : "Registrar Certidão"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Certidoes() {
  const [certidoes, setCertidoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.Certidao.list("-data_validade");
    setCertidoes(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (data) => {
    if (editItem) {
      setCertidoes(prev => prev.map(c => c.id === editItem.id ? { ...editItem, ...data } : c));
      setModal(false); setEditItem(null);
      base44.entities.Certidao.update(editItem.id, data);
    } else {
      setModal(false); setEditItem(null);
      const nova = await base44.entities.Certidao.create(data);
      setCertidoes(prev => [nova, ...prev]);
    }
    toast({ title: "✓ Salvo" });
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir esta certidão?")) return;
    setCertidoes(prev => prev.filter(c => c.id !== id));
    base44.entities.Certidao.delete(id);
  };

  const handleRenovar = async (cert) => {
    const novaValidade = prompt("Digite a nova data de validade (YYYY-MM-DD):", cert.data_validade);
    if (!novaValidade) return;
    const historico = [...(cert.historico || []), {
      data: new Date().toISOString().split("T")[0],
      validade_anterior: cert.data_validade,
      nova_validade: novaValidade,
      observacao: "Renovação manual",
    }];
    const patch = { data_validade: novaValidade, situacao: "Regular", historico };
    setCertidoes(prev => prev.map(c => c.id === cert.id ? { ...cert, ...patch } : c));
    base44.entities.Certidao.update(cert.id, patch);
    toast({ title: "✓ Renovada", description: "Certidão renovada com sucesso" });
  };

  const filtradas = certidoes.filter(c => filtroTipo === "todos" || c.tipo === filtroTipo);

  const vencidas = certidoes.filter(c => { const d = diasRestantes(c.data_validade); return d !== null && d < 0; });
  const aVencer30 = certidoes.filter(c => { const d = diasRestantes(c.data_validade); return d !== null && d >= 0 && d <= 30; });
  const regulares = certidoes.filter(c => { const d = diasRestantes(c.data_validade); return d !== null && d > 30; });

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground flex items-center gap-2">
            <Shield size={24} className="text-primary" /> Gestão de Certidões
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Controle de validade e renovação de certidões</p>
        </div>
        <button onClick={() => { setEditItem(null); setModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus size={16} /> Nova Certidão
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-card border border-green-500/20 rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Regulares</p>
          <p className="text-2xl font-bold text-green-400">{regulares.length}</p>
        </div>
        <div className="bg-card border border-yellow-500/20 rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Vence em 30 dias</p>
          <p className="text-2xl font-bold text-yellow-400">{aVencer30.length}</p>
        </div>
        <div className="bg-card border border-red-500/20 rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Vencidas</p>
          <p className="text-2xl font-bold text-red-400">{vencidas.length}</p>
        </div>
      </div>

      {/* Alertas */}
      {(vencidas.length > 0 || aVencer30.length > 0) && (
        <div className="mb-5 space-y-2">
          {vencidas.length > 0 && (
            <div className="bg-red-500/10/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
              <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400"><strong>ATENÇÃO:</strong> {vencidas.map(c => c.tipo).join(", ")} — certidões vencidas!</p>
            </div>
          )}
          {aVencer30.length > 0 && (
            <div className="bg-yellow-500/10/10 border border-yellow-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
              <AlertTriangle size={16} className="text-yellow-400 flex-shrink-0" />
              <p className="text-sm text-yellow-400">{aVencer30.map(c => `${c.tipo} (${diasRestantes(c.data_validade)}d)`).join(", ")} — vencendo em breve</p>
            </div>
          )}
        </div>
      )}

      {/* Links rápidos */}
      <div className="bg-card border border-border rounded-xl p-4 mb-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Links Rápidos — Emissão de Certidões</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {LINKS_RAPIDOS.map(l => (
            <a key={l.nome} href={l.url} target="_blank" rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 p-3 bg-muted hover:bg-muted/70 rounded-lg text-center transition-colors group">
              <span className="text-xl">{l.icone}</span>
              <span className="text-[10px] text-muted-foreground group-hover:text-foreground leading-tight text-center">{l.nome}</span>
              <ExternalLink size={9} className="text-muted-foreground/50" />
            </a>
          ))}
        </div>
      </div>

      {/* Filtro */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg mb-4 w-fit overflow-x-auto">
        <button onClick={() => setFiltroTipo("todos")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filtroTipo === "todos" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          Todas
        </button>
        {TIPOS_CERTIDAO.map(t => (
          <button key={t} onClick={() => setFiltroTipo(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${filtroTipo === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <Shield size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground text-sm">Nenhuma certidão cadastrada</p>
          <button onClick={() => { setEditItem(null); setModal(true); }} className="mt-3 text-primary text-sm hover:underline">Cadastrar certidão</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtradas.map(cert => {
            const dias = diasRestantes(cert.data_validade);
            const s = SITUACAO_CONFIG[cert.situacao] || SITUACAO_CONFIG.Regular;
            const urgente = dias !== null && dias < 0;
            const alerta = dias !== null && dias >= 0 && dias <= 30;
            return (
              <div key={cert.id} className={`bg-card border rounded-xl p-5 ${urgente ? "border-red-500/40" : alerta ? "border-yellow-500/30" : "border-border"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${urgente ? "bg-red-500/10/10" : alerta ? "bg-yellow-500/10/10" : "bg-green-500/10/10"}`}>
                      {urgente ? <AlertTriangle size={18} className="text-red-400" /> : <CheckCircle size={18} className="text-green-400" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{cert.tipo}</p>
                      <p className="text-xs text-muted-foreground">{cert.empresa || "—"}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.bg} ${s.color}`}>{cert.situacao}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  {cert.numero && <div><span className="text-muted-foreground">Número:</span> <span className="text-foreground font-mono">{cert.numero}</span></div>}
                  <div><span className="text-muted-foreground">Emissão:</span> <span className="text-foreground">{cert.data_emissao || "—"}</span></div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Validade:</span>
                    <span className={`ml-1 font-semibold ${urgente ? "text-red-400" : alerta ? "text-yellow-400" : "text-green-400"}`}>
                      {cert.data_validade ? new Date(cert.data_validade + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
                      {dias !== null && <span className="ml-1 font-normal text-xs">({dias < 0 ? "VENCIDA" : `${dias}d restantes`})</span>}
                    </span>
                  </div>
                </div>

                {cert.historico?.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                    <History size={11} /> {cert.historico.length} renovação(ões) no histórico
                  </div>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => handleRenovar(cert)} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-500/10/10 text-green-400 rounded-lg hover:bg-green-500/10/20">
                    <History size={11} /> Renovar
                  </button>
                  {cert.arquivo_url && (
                    <a href={cert.arquivo_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-1.5 text-xs bg-primary/10/10 text-blue-400 rounded-lg hover:bg-primary/10/20">
                      <Download size={11} /> PDF
                    </a>
                  )}
                  <button onClick={() => { setEditItem(cert); setModal(true); }} className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">Editar</button>
                  <button onClick={() => handleDelete(cert.id)} className="px-3 py-1.5 text-xs text-red-400 hover:underline">Excluir</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && <CertidaoModal certidao={editItem} onClose={() => { setModal(false); setEditItem(null); }} onSave={handleSave} />}
    </div>
  );
}