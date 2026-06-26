import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Plus, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const UFs = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export default function MDFEmissao({ onClose, onSaved, mdfe }) {
  const [form, setForm] = useState({
    numero: mdfe?.numero || "",
    serie: mdfe?.serie || "1",
    data_emissao: mdfe?.data_emissao || new Date().toISOString().slice(0, 10),
    contratante_nome: mdfe?.contratante_nome || "",
    contratante_cnpj_cpf: mdfe?.contratante_cnpj_cpf || "",
    municipio_origem: mdfe?.municipio_origem || "",
    uf_origem: mdfe?.uf_origem || "",
    municipio_destino: mdfe?.municipio_destino || "",
    uf_destino: mdfe?.uf_destino || "",
    valor_total: mdfe?.valor_total || 0,
    peso_total: mdfe?.peso_total || 0,
    quantidade_volumes: mdfe?.quantidade_volumes || 0,
    tipo_veiculo: mdfe?.tipo_veiculo || "01-Caminhão",
    placa_veiculo: mdfe?.placa_veiculo || "",
    informacoes_adicionais: mdfe?.informacoes_adicionais || "",
    ambiente: mdfe?.ambiente || "Homologação",
    situacao: mdfe?.situacao || "Rascunho",
  });
  const [saving, setSaving] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [empresaSel, setEmpresaSel] = useState(mdfe?.empresa_id || "");

  useEffect(() => {
    base44.entities.EmpresaCliente.list().then(setEmpresas);
  }, []);

  const handleSave = async (situacao = "Rascunho") => {
    if (!empresaSel) { alert("Selecione a empresa emitente!"); return; }
    setSaving(true);
    const payload = {
      ...form,
      empresa_id: empresaSel,
      situacao,
    };
    try {
      let nfe_id = mdfe?.id;
      if (mdfe) {
        await base44.entities.NotaFiscalEletronica.update(mdfe.id, payload);
      } else {
        const created = await base44.entities.NotaFiscalEletronica.create(payload);
        nfe_id = created.id;
      }
      
      if (situacao === "Validando") {
        try {
          const res = await base44.functions.invoke("emitirNFe", {
            nfe_id: nfe_id,
            empresa_id: empresaSel,
            destinatario_cnpj: form.contratante_cnpj_cpf,
            itens: [{ descricao: "Serviço de Transporte", quantidade: 1, valor_unitario: form.valor_total }],
            valor_total: form.valor_total,
            natureza_operacao: "Prestação de Serviço de Transporte",
            serie: form.serie,
            numero: form.numero
          });
          
          if (res.data && res.data.success) {
            alert("MDF-e transmitido com sucesso!");
          } else {
            alert("Erro ao transmitir MDF-e: " + (res.data?.error || "Desconhecido"));
            await base44.entities.NotaFiscalEletronica.update(nfe_id, { situacao: "Rejeitada", motivo_rejeicao: res.data?.error || "Erro desconhecido" });
          }
        } catch (apiErr) {
          alert("Erro de comunicação ao transmitir: " + apiErr.message);
          await base44.entities.NotaFiscalEletronica.update(nfe_id, { situacao: "Rejeitada", motivo_rejeicao: apiErr.message });
        }
      }
      
      setSaving(false);
      onSaved && onSaved();
      onClose && onClose();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar MDF-e: " + err.message);
      setSaving(false);
    }
  };

  const f = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-xl w-full max-w-4xl shadow-2xl my-4">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10 rounded-t-xl">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {mdfe ? "Editar" : "Emitir"} MDF-e (Manifesto de Documentos Fiscais)
            </h2>
            <p className="text-xs text-muted-foreground">Transporte de carga própria ou de terceiros</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg">✕</button>
        </div>

        <div className="p-5 space-y-6">
          {/* Emitente */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs text-muted-foreground mb-1.5">Empresa Emitente *</label>
              <select value={empresaSel} onChange={e => setEmpresaSel(e.target.value)}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                <option value="">Selecionar empresa...</option>
                {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.razao_social}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Número</label>
              <input value={form.numero} onChange={e => f("numero", e.target.value)}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Série</label>
              <input value={form.serie} onChange={e => f("serie", e.target.value)}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Data Emissão *</label>
              <input type="date" required value={form.data_emissao} onChange={e => f("data_emissao", e.target.value)}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Ambiente</label>
              <select value={form.ambiente} onChange={e => f("ambiente", e.target.value)}
                className={`w-full bg-muted border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary
 ${form.ambiente === "Produção" ? "border-green-500/50 text-green-400" : "border-yellow-500/50 text-yellow-400"}`}>
                <option>Homologação</option>
                <option>Produção</option>
              </select>
            </div>
          </div>

          {/* Contratante */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Contratante (Quem contrata o transporte)</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-muted-foreground mb-1">Nome/Razão Social *</label>
                <input value={form.contratante_nome} onChange={e => f("contratante_nome", e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" required />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">CNPJ/CPF *</label>
                <input value={form.contratante_cnpj_cpf} onChange={e => f("contratante_cnpj_cpf", e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
            </div>
          </div>

          {/* Origem e Destino */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Localização</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Município Origem</label>
                <input value={form.municipio_origem} onChange={e => f("municipio_origem", e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">UF Origem</label>
                <select value={form.uf_origem} onChange={e => f("uf_origem", e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                  <option value="">—</option>
                  {UFs.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Município Destino</label>
                <input value={form.municipio_destino} onChange={e => f("municipio_destino", e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">UF Destino</label>
                <select value={form.uf_destino} onChange={e => f("uf_destino", e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                  <option value="">—</option>
                  {UFs.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Veículo e Carga */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Veículo e Carga</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Tipo de Veículo</label>
                <select value={form.tipo_veiculo} onChange={e => f("tipo_veiculo", e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                  {["01-Caminhão", "02-Cavalo", "03-Reboque", "04-Semi-Reboque", "05-Outros"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Placa Veículo</label>
                <input value={form.placa_veiculo} onChange={e => f("placa_veiculo", e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" placeholder="ABC1234" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Peso Total (kg)</label>
                <input type="number" min="0" step="0.01" value={form.peso_total} onChange={e => f("peso_total", parseFloat(e.target.value) || 0)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Qtd. Volumes</label>
                <input type="number" min="0" value={form.quantidade_volumes} onChange={e => f("quantidade_volumes", parseInt(e.target.value) || 0)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div className="md:col-span-4">
                <label className="block text-xs text-muted-foreground mb-1">Valor Total (R$) *</label>
                <input type="number" min="0" step="0.01" required value={form.valor_total} onChange={e => f("valor_total", parseFloat(e.target.value) || 0)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
            </div>
          </div>

          {/* Info adicional */}
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Informações Adicionais</label>
            <textarea value={form.informacoes_adicionais} onChange={e => f("informacoes_adicionais", e.target.value)} rows={2}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary resize-none" />
          </div>

          {/* Aviso */}
          <div className="flex items-start gap-3 p-3 bg-primary/10/5 border border-blue-500/20 rounded-lg">
            <AlertCircle size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-400/80">
              <strong>MDF-e:</strong> Manifesto de Documentos Fiscais para empresas de transporte. Agrupa múltiplos CT-e/NF-e em um único documento. Integração com Focus NFe necessária.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-border bg-muted/30 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm hover:text-foreground">Cancelar</button>
          <div className="flex gap-2">
            <button onClick={() => handleSave("Rascunho")} disabled={saving}
              className="px-4 py-2 bg-muted border border-border text-foreground rounded-lg text-sm hover:bg-card disabled:opacity-50">
              {saving ? "Salvando..." : "Salvar Rascunho"}
            </button>
            <button onClick={() => handleSave("Validando")} disabled={saving}
              className="px-5 py-2 bg-primary/10 text-white rounded-lg text-sm font-medium hover:bg-blue-400 disabled:opacity-50 flex items-center gap-1.5">
              <CheckCircle2 size={14} />
              {saving ? "Processando..." : "Transmitir para SEFAZ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}