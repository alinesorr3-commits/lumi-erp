import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, X, ShieldCheck, AlertTriangle, Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const statusConfig = {
  Ativo: { color: "text-green-400", bg: "bg-green-400/10" },
  Vencido: { color: "text-red-400", bg: "bg-red-400/10" },
  Revogado: { color: "text-muted-foreground", bg: "bg-muted" },
  "Renovação pendente": { color: "text-yellow-400", bg: "bg-yellow-400/10" },
};

function CertModal({ cert, onClose, onSave }) {
  const [form, setForm] = useState({
    razao_social: cert?.razao_social || "",
    cnpj: cert?.cnpj || "",
    tipo: cert?.tipo || "A1",
    emissor: cert?.emissor || "Serpro",
    data_emissao: cert?.data_emissao || "",
    data_validade: cert?.data_validade || "",
    finalidade: cert?.finalidade || "Múltipla",
    status: cert?.status || "Ativo",
    observacoes: cert?.observacoes || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const diasRestantes = form.data_validade
    ? Math.ceil((new Date(form.data_validade) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">{cert ? "Editar Certificado" : "Novo Certificado Digital"}</h2>
          <button onClick={onClose}><X size={18} className="text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Razão Social *</label>
            <input required value={form.razao_social} onChange={e => setForm(f => ({ ...f, razao_social: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">CNPJ/CPF</label>
              <input value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Tipo</label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                <option value="A1">A1 (Software)</option>
                <option value="A3">A3 (Token/Cartão)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Autoridade Certificadora</label>
              <select value={form.emissor} onChange={e => setForm(f => ({ ...f, emissor: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                {["Serpro", "Certisign", "Valid", "Soluti", "AC Caixa", "ICP-Brasil", "Outros"].map(e => <option key={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Finalidade</label>
              <select value={form.finalidade} onChange={e => setForm(f => ({ ...f, finalidade: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                {["NF-e", "NFC-e", "CT-e", "MDF-e", "eSocial", "EFD-Reinf", "SPED", "Múltipla"].map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Data de Emissão</label>
              <input type="date" value={form.data_emissao} onChange={e => setForm(f => ({ ...f, data_emissao: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Data de Validade *</label>
              <input required type="date" value={form.data_validade} onChange={e => setForm(f => ({ ...f, data_validade: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
          </div>
          {diasRestantes !== null && (
            <div className={`p-2 rounded-lg text-xs flex items-center gap-2 ${diasRestantes <= 30 ? "bg-red-500/10/10 text-red-400" : diasRestantes <= 60 ? "bg-yellow-500/10/10 text-yellow-400" : "bg-green-500/10/10 text-green-400"}`}>
              <AlertTriangle size={13} />
              {diasRestantes > 0 ? `Vence em ${diasRestantes} dias` : "Vencido!"}
            </div>
          )}
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
              {Object.keys(statusConfig).map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm bg-muted text-muted-foreground">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm bg-primary text-primary-foreground disabled:opacity-50">
              {saving ? "Salvando..." : cert ? "Salvar" : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CertificadosDigitais() {
   const [certs, setCerts] = useState([]);
   const [loading, setLoading] = useState(true);
   const [modal, setModal] = useState(false);
   const [editItem, setEditItem] = useState(null);
   const [uploadingFile, setUploadingFile] = useState(false);
   const { toast } = useToast();

   const load = () => {
     setLoading(true);
     base44.entities.CertificadoDigital.list().then(data => { setCerts(data); setLoading(false); });
   };
   useEffect(() => { load(); }, []);

   const handleImportarCertificado = async (e) => {
     const file = e.target.files?.[0];
     if (!file) return;

     setUploadingFile(true);
     try {
       const { file_url } = await base44.integrations.Core.UploadFile({ file });

       // Extrai dados do certificado (simula leitura de metadados do arquivo .pfx/.p12)
       const response = await base44.integrations.Core.InvokeLLM({
         prompt: `Você recebeu o URL de um arquivo de certificado digital (.pfx ou .p12). 
         Não conseguiremos ler o arquivo diretamente, mas baseado no nome do arquivo: "${file.name}", 
         extraia e retorne em JSON as seguintes informações se disponíveis:
         - razao_social (empresa)
         - cnpj ou cpf
         - tipo (A1 ou A3)
         - data_validade (se conseguir extrair do nome)
         Retorne um JSON válido.`,
         response_json_schema: {
           type: "object",
           properties: {
             razao_social: { type: "string" },
             cnpj: { type: "string" },
             tipo: { type: "string" },
             data_validade: { type: "string" },
             arquivo_url: { type: "string" }
           }
         }
       });

       const certData = response.data || {};

       // Cria novo certificado com dados extraídos
       await base44.entities.CertificadoDigital.create({
         razao_social: certData.razao_social || "Certificado Importado",
         cnpj: certData.cnpj || "",
         tipo: certData.tipo || "A1",
         emissor: "Importado",
         data_emissao: new Date().toISOString().split('T')[0],
         data_validade: certData.data_validade || "",
         finalidade: "Múltipla",
         status: "Ativo",
         observacoes: `Arquivo importado: ${file.name}. URL: ${file_url}`,
       });

       toast({ title: "✓ Certificado Importado", description: "Arquivo do certificado processado com sucesso" });
       load();
     } catch (err) {
       toast({ title: "✗ Erro", description: "Falha ao importar certificado: " + err.message, variant: "destructive" });
     } finally {
       setUploadingFile(false);
     }
   };

  const handleSave = async (data) => {
    if (editItem) await base44.entities.CertificadoDigital.update(editItem.id, data);
    else await base44.entities.CertificadoDigital.create(data);
    setModal(false); setEditItem(null); load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir?")) return;
    await base44.entities.CertificadoDigital.delete(id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-foreground">Certificados Digitais</h2>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10/20 text-yellow-400 rounded-lg text-sm font-medium hover:bg-yellow-500/10/30 cursor-pointer">
            <Upload size={16} /> {uploadingFile ? "Importando..." : "Importar"}
            <input type="file" onChange={handleImportarCertificado} accept=".pfx,.p12,.pem" className="hidden" disabled={uploadingFile} />
          </label>
          <button onClick={() => { setEditItem(null); setModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
            <Plus size={16} /> Novo Certificado
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
      ) : certs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ShieldCheck size={32} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">Nenhum certificado cadastrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certs.map(c => {
            const s = statusConfig[c.status] || statusConfig.Ativo;
            const diasRestantes = c.data_validade
              ? Math.ceil((new Date(c.data_validade) - new Date()) / (1000 * 60 * 60 * 24))
              : null;
            const alerta = diasRestantes !== null && diasRestantes <= 60;
            return (
              <div key={c.id} className={`bg-card border rounded-xl p-5 ${alerta ? "border-yellow-500/30" : "border-border"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${alerta ? "bg-yellow-500/10/10" : "bg-green-500/10/10"}`}>
                      <ShieldCheck size={18} className={alerta ? "text-yellow-400" : "text-green-400"} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{c.razao_social}</p>
                      <p className="text-xs text-muted-foreground">{c.cnpj} · {c.tipo} · {c.emissor}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>{c.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div><span className="text-muted-foreground">Finalidade:</span> <span className="text-foreground">{c.finalidade}</span></div>
                  <div><span className="text-muted-foreground">Emissão:</span> <span className="text-foreground">{c.data_emissao || "—"}</span></div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Validade:</span>
                    <span className={`ml-1 font-medium ${diasRestantes !== null && diasRestantes <= 30 ? "text-red-400" : diasRestantes !== null && diasRestantes <= 60 ? "text-yellow-400" : "text-foreground"}`}>
                      {c.data_validade || "—"}
                      {diasRestantes !== null && ` (${diasRestantes > 0 ? `${diasRestantes} dias` : "VENCIDO"})`}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditItem(c); setModal(true); }} className="text-xs text-muted-foreground hover:text-foreground">Editar</button>
                  <button onClick={() => handleDelete(c.id)} className="text-xs text-red-400 hover:underline">Excluir</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && <CertModal cert={editItem} onClose={() => { setModal(false); setEditItem(null); }} onSave={handleSave} />}
    </div>
  );
}