import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Plus, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const UFs = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export default function CTEmissao({ onClose, onSaved, cte }) {
  const [form, setForm] = useState({
    numero: cte?.numero || "",
    serie: cte?.serie || "1",
    data_emissao: cte?.data_emissao || new Date().toISOString().slice(0, 10),
    natureza_operacao: cte?.natureza_operacao || "Transporte de Carga",
    remetente_nome: cte?.remetente_nome || "",
    remetente_cnpj_cpf: cte?.remetente_cnpj_cpf || "",
    destinatario_nome: cte?.destinatario_nome || "",
    destinatario_cnpj_cpf: cte?.destinatario_cnpj_cpf || "",
    municipio_origem: cte?.municipio_origem || "",
    uf_origem: cte?.uf_origem || "",
    municipio_destino: cte?.municipio_destino || "",
    uf_destino: cte?.uf_destino || "",
    valor_total: cte?.valor_total || 0,
    descricao_carga: cte?.descricao_carga || "",
    peso_total: cte?.peso_total || 0,
    informacoes_adicionais: cte?.informacoes_adicionais || "",
    ambiente: cte?.ambiente || "Homologação",
    situacao: cte?.situacao || "Rascunho",
  });
  const [saving, setSaving] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [empresaSel, setEmpresaSel] = useState(cte?.empresa_id || "");

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
      let nfe_id = cte?.id;
      if (cte) {
        await base44.entities.NotaFiscalEletronica.update(cte.id, payload);
      } else {
        const created = await base44.entities.NotaFiscalEletronica.create(payload);
        nfe_id = created.id;
      }
      
      if (situacao === "Validando") {
        try {
          const res = await base44.functions.invoke("emitirNFe", {
            nfe_id: nfe_id,
            empresa_id: empresaSel,
            destinatario_cnpj: form.destinatario_cnpj_cpf,
            itens: [{ descricao: form.descricao_carga, quantidade: 1, valor_unitario: form.valor_total }],
            valor_total: form.valor_total,
            natureza_operacao: form.natureza_operacao,
            serie: form.serie,
            numero: form.numero
          });
          
          if (res.data && res.data.success) {
            alert("CT-e transmitido com sucesso!");
          } else {
            alert("Erro ao transmitir CT-e: " + (res.data?.error || "Desconhecido"));
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
      alert("Erro ao salvar CT-e: " + err.message);
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
              {cte ? "Editar" : "Emitir"} CT-e (Conhecimento de Transporte)
            </h2>
            <p className="text-xs text-muted-foreground">Transporte de mercadorias interestadual/intermunicipal</p>
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

          {/* Remetente */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Remetente (Origem)</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-muted-foreground mb-1">Nome/Razão Social *</label>
                <input value={form.remetente_nome} onChange={e => f("remetente_nome", e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" required />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">CNPJ/CPF *</label>
                <input value={form.remetente_cnpj_cpf} onChange={e => f("remetente_cnpj_cpf", e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Município</label>
                <input value={form.municipio_origem} onChange={e => f("municipio_origem", e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">UF</label>
                <select value={form.uf_origem} onChange={e => f("uf_origem", e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                  <option value="">—</option>
                  {UFs.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Destinatário */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Destinatário</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-muted-foreground mb-1">Nome/Razão Social *</label>
                <input value={form.destinatario_nome} onChange={e => f("destinatario_nome", e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" required />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">CNPJ/CPF *</label>
                <input value={form.destinatario_cnpj_cpf} onChange={e => f("destinatario_cnpj_cpf", e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Município</label>
                <input value={form.municipio_destino} onChange={e => f("municipio_destino", e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">UF</label>
                <select value={form.uf_destino} onChange={e => f("uf_destino", e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                  <option value="">—</option>
                  {UFs.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Carga */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Informações da Carga</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-muted-foreground mb-1">Descrição da Carga *</label>
                <input value={form.descricao_carga} onChange={e => f("descricao_carga", e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" required />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Peso Total (kg)</label>
                <input type="number" min="0" step="0.01" value={form.peso_total} onChange={e => f("peso_total", parseFloat(e.target.value) || 0)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
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
              <strong>CT-e:</strong> Conhecimento de Transporte Eletrônico para operações de transporte. Integração com Focus NFe ou similar necessária para transmissão à SEFAZ.
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