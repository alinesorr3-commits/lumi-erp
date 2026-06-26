import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Pencil, Trash2, Lock, CheckCircle, AlertCircle, Upload } from "lucide-react";

const inp = (value, onChange, extra = {}) => ({
  value: value || "",
  onChange: e => onChange(e.target.value),
  className: "w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary",
  ...extra,
});

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Lock size={16} className="text-yellow-400" /> {title}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default function CertificadoA1() {
  const [certs, setCerts] = useState([]);
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [filePreview, setFilePreview] = useState(null);

  useEffect(() => { 
    base44.entities.CertificadoDigital.list().then(setCerts).catch(() => setCerts([]));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (edit) {
        await base44.entities.CertificadoDigital.update(edit.id, form);
      } else {
        await base44.entities.CertificadoDigital.create(form);
      }
      setModal(false);
      setEdit(null);
      setForm({});
      setFilePreview(null);
      base44.entities.CertificadoDigital.list().then(setCerts);
    } catch (e) {
      console.error("Erro ao salvar certificado:", e);
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setForm({ tipo: "A1", status: "Ativo", finalidade: "Múltipla" });
    setEdit(null);
    setModal(true);
  };

  const openEdit = (item) => {
    setForm({ ...item });
    setEdit(item);
    setModal(true);
  };

  const del = async (id) => {
    if (!confirm("Excluir este certificado?")) return;
    await base44.entities.CertificadoDigital.delete(id);
    base44.entities.CertificadoDigital.list().then(setCerts);
  };

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFilePreview(file.name);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await base44.integrations.Core.UploadFile({ file });
      f("certificado_url", res.file_url);
    } catch (err) {
      console.error("Erro ao fazer upload:", err);
      alert("Erro ao fazer upload do certificado");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      "Ativo": "bg-green-400/10 text-green-400 border-green-500/30",
      "Vencido": "bg-red-400/10 text-red-400 border-red-500/30",
      "Revogado": "bg-gray-400/10 text-gray-400 border-gray-500/30",
      "Renovação pendente": "bg-yellow-400/10 text-yellow-400 border-yellow-500/30"
    };
    return colors[status] || colors["Ativo"];
  };

  const isExpired = (date) => date && new Date(date) < new Date();

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Lock size={16} className="text-yellow-400" />
            Certificados Digitais A1
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Gerencie certificados para emissão de NF-e</p>
        </div>
        <button 
          onClick={openNew}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs hover:bg-primary/90"
        >
          <Plus size={12} /> Novo Certificado
        </button>
      </div>

      <div className="space-y-2">
        {certs.length === 0 && (
          <div className="text-center py-8 text-muted-foreground bg-card border border-border rounded-lg">
            <Lock size={28} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum certificado cadastrado</p>
            <p className="text-xs mt-1">Faça upload de certificados A1 para emitir NF-e</p>
          </div>
        )}

        {certs.map(cert => {
          const expired = isExpired(cert.data_validade);
          return (
            <div key={cert.id} className={`flex items-center justify-between p-4 rounded-lg border transition-all
 ${cert.status === "Ativo" && !expired ? "bg-card border-green-500/20" : "bg-muted border-border/50 opacity-60"}`}>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {expired ? (
                    <AlertCircle size={16} className="text-red-400" />
                  ) : (
                    <CheckCircle size={16} className="text-green-400" />
                  )}
                  <p className="text-sm font-medium text-foreground">{cert.razao_social}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(cert.status)}`}>
                    {expired ? "VENCIDO" : cert.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {cert.cnpj} · {cert.tipo} · {cert.emissor}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Válido até: <span className={expired ? "text-red-400" : "text-green-400"}>{cert.data_validade}</span>
                  {expired && " (EXPIRADO)"}
                </p>
                {cert.observacoes && <p className="text-xs text-muted-foreground mt-1">{cert.observacoes}</p>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(cert)} className="p-1 text-muted-foreground hover:text-foreground">
                  <Pencil size={13} />
                </button>
                <button onClick={() => del(cert.id)} className="p-1 text-red-400 hover:text-red-300">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <Modal title={edit ? "Editar Certificado A1" : "Novo Certificado A1"} onClose={() => setModal(false)}>
          <form onSubmit={save} className="space-y-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Razão Social *</label>
              <input required {...inp(form.razao_social, v => f("razao_social", v))} />
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">CNPJ/CPF *</label>
              <input required {...inp(form.cnpj, v => f("cnpj", v))} placeholder="00.000.000/0001-00" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Tipo</label>
                <select value={form.tipo || "A1"} onChange={e => f("tipo", e.target.value)} 
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none">
                  <option>A1</option>
                  <option>A3</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">Emissor</label>
                <select value={form.emissor || ""} onChange={e => f("emissor", e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none">
                  <option value="">— Selecione —</option>
                  {["Serpro", "Certisign", "Valid", "Soluti", "AC Caixa", "ICP-Brasil", "Outros"].map(e => (
                    <option key={e}>{e}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Data de Emissão</label>
                <input type="date" {...inp(form.data_emissao, v => f("data_emissao", v))} />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">Data de Validade *</label>
                <input type="date" required {...inp(form.data_validade, v => f("data_validade", v))} />
              </div>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Finalidade</label>
              <select value={form.finalidade || "Múltipla"} onChange={e => f("finalidade", e.target.value)}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none">
                {["NF-e", "NFC-e", "CT-e", "MDF-e", "eSocial", "EFD-Reinf", "SPED", "Múltipla"].map(f => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Status</label>
              <select value={form.status || "Ativo"} onChange={e => f("status", e.target.value)}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none">
                {["Ativo", "Vencido", "Revogado", "Renovação pendente"].map(s => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Upload size={12} /> Upload do Certificado (.p12, .pfx)
              </label>
              <div className="border-2 border-dashed border-border rounded-lg p-3 text-center">
                <input
                  type="file"
                  accept=".p12,.pfx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="cert-upload"
                />
                <label htmlFor="cert-upload" className="cursor-pointer">
                  <p className="text-xs text-muted-foreground">
                    {filePreview ? `✓ ${filePreview}` : "Clique ou arraste o arquivo"}
                  </p>
                </label>
              </div>
              {form.certificado_url && (
                <p className="text-xs text-green-400 mt-1">✓ Certificado carregado</p>
              )}
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Observações</label>
              <textarea 
                value={form.observacoes || ""}
                onChange={e => f("observacoes", e.target.value)}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                rows="2"
                placeholder="Ex: Renovar em XX/XX/XXXX"
              />
            </div>

            <div className="bg-yellow-500/10/10 border border-yellow-500/20 rounded-lg p-3 text-xs text-muted-foreground">
              <p className="font-medium text-yellow-400 mb-1">⚠️ Segurança</p>
              <p>Certificados digitais são criptografados e armazenados com segurança. Senhas são armazenadas criptografadas.</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(false)} className="flex-1 py-2 bg-muted text-muted-foreground rounded-lg text-sm">
                Cancelar
              </button>
              <button type="submit" disabled={loading} className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm disabled:opacity-50">
                {loading ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}