import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, X, Trash2, Calculator, Search, AlertCircle, CheckCircle2 } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const fmtN = (v) => new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2 }).format(v || 0);

const UFs = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

const CFOPS_SAIDA = [
  { cfop: "5101", desc: "Venda produção própria (dentro do estado)" },
  { cfop: "5102", desc: "Venda de mercadoria adquirida (dentro do estado)" },
  { cfop: "5103", desc: "Venda prod. própria rural (dentro do estado)" },
  { cfop: "5405", desc: "Venda mercadoria com ST (dentro do estado)" },
  { cfop: "6101", desc: "Venda produção própria (fora do estado)" },
  { cfop: "6102", desc: "Venda de mercadoria adquirida (fora do estado)" },
  { cfop: "6108", desc: "Venda rural (fora do estado)" },
  { cfop: "5949", desc: "Outra saída (dentro do estado)" },
  { cfop: "6949", desc: "Outra saída (fora do estado)" },
];

function ItemRow({ item, onChange, onRemove, index }) {
  const total = (item.quantidade || 0) * (item.valor_unitario || 0);
  const valorIcms = total * ((item.aliq_icms || 0) / 100);
  const valorPis = total * ((item.aliq_pis || 0) / 100);
  const valorCofins = total * ((item.aliq_cofins || 0) / 100);
  const valorIpi = total * ((item.aliq_ipi || 0) / 100);

  const upd = (field, val) => onChange(index, { ...item, [field]: val });

  return (
    <div className="bg-muted/50 border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">ITEM {index + 1}</span>
        <button onClick={() => onRemove(index)} className="text-red-400 hover:text-red-300"><Trash2 size={13} /></button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="col-span-2">
          <label className="block text-xs text-muted-foreground mb-1">Descrição *</label>
          <input value={item.descricao || ""} onChange={e => upd("descricao", e.target.value)}
            className="w-full bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary" required />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">NCM</label>
          <input value={item.ncm || ""} onChange={e => upd("ncm", e.target.value)}
            className="w-full bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary" placeholder="00000000" />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">CFOP</label>
          <select value={item.cfop || "5102"} onChange={e => upd("cfop", e.target.value)}
            className="w-full bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary">
            {CFOPS_SAIDA.map(c => <option key={c.cfop} value={c.cfop}>{c.cfop} - {c.desc.slice(0, 30)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Unidade</label>
          <input value={item.unidade || "UN"} onChange={e => upd("unidade", e.target.value)}
            className="w-full bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary" />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Quantidade</label>
          <input type="number" min="0" step="0.001" value={item.quantidade || ""} onChange={e => upd("quantidade", parseFloat(e.target.value) || 0)}
            className="w-full bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary" />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Valor Unitário (R$)</label>
          <input type="number" min="0" step="0.01" value={item.valor_unitario || ""} onChange={e => upd("valor_unitario", parseFloat(e.target.value) || 0)}
            className="w-full bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary" />
        </div>
        <div className="flex items-end">
          <div className="w-full p-2 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-xs text-muted-foreground">Subtotal</p>
            <p className="text-sm font-bold text-primary">{fmt(total)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 pt-1 border-t border-border/50">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">CST/CSOSN</label>
          <input value={item.cst_icms || ""} onChange={e => upd("cst_icms", e.target.value)}
            className="w-full bg-card border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary" placeholder="400" />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">ICMS %</label>
          <input type="number" min="0" step="0.01" value={item.aliq_icms || ""} onChange={e => upd("aliq_icms", parseFloat(e.target.value) || 0)}
            className="w-full bg-card border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary" />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">PIS %</label>
          <input type="number" min="0" step="0.01" value={item.aliq_pis || ""} onChange={e => upd("aliq_pis", parseFloat(e.target.value) || 0)}
            className="w-full bg-card border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary" />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">COFINS %</label>
          <input type="number" min="0" step="0.01" value={item.aliq_cofins || ""} onChange={e => upd("aliq_cofins", parseFloat(e.target.value) || 0)}
            className="w-full bg-card border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary" />
        </div>
      </div>
    </div>
  );
}

export default function NFeEmissao({ onClose, onSaved, nota, pedidoOrigem }) {


  const [form, setForm] = useState({
    tipo_doc: nota?.tipo_doc || "NF-e",
    numero: nota?.numero || "",
    serie: nota?.serie || "1",
    data_emissao: nota?.data_emissao || new Date().toISOString().slice(0, 10),
    natureza_operacao: nota?.natureza_operacao || "Venda de Mercadorias",
    finalidade: nota?.finalidade || "1-Normal",
    destinatario_nome: pedidoOrigem?.cliente_nome || nota?.destinatario_nome || "",
    destinatario_cnpj_cpf: pedidoOrigem?.cliente_cpf_cnpj || nota?.destinatario_cnpj_cpf || "",
    destinatario_ie: nota?.destinatario_ie || "",
    destinatario_email: pedidoOrigem?.cliente_email || nota?.destinatario_email || "",
    destinatario_logradouro: nota?.destinatario_logradouro || "",
    destinatario_municipio: nota?.destinatario_municipio || "",
    destinatario_uf: nota?.destinatario_uf || "",
    destinatario_cep: nota?.destinatario_cep || "",
    modalidade_frete: nota?.modalidade_frete || "9-Sem frete",
    valor_frete: nota?.valor_frete || 0,
    valor_seguro: nota?.valor_seguro || 0,
    valor_desconto: nota?.valor_desconto || 0,
    valor_outros: nota?.valor_outros || 0,
    informacoes_adicionais: nota?.informacoes_adicionais || "",
    itens: pedidoOrigem?.itens || nota?.itens || [],
    valor_produtos: pedidoOrigem?.valor_total || nota?.valor_produtos || 0,
    ambiente: nota?.ambiente || "Homologação",
    situacao: nota?.situacao || "Rascunho",
  });
  const [saving, setSaving] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [empresaSel, setEmpresaSel] = useState(nota?.empresa_id || "");

  useEffect(() => {
    base44.entities.EmpresaCliente.list().then(setEmpresas);
  }, []);

  const addItem = () => {
    setForm(f => ({
      ...f,
      itens: [...f.itens, {
        descricao: "", ncm: "", cfop: "5102", unidade: "UN",
        quantidade: 1, valor_unitario: 0,
        cst_icms: "400", aliq_icms: 0, aliq_pis: 0.65, aliq_cofins: 3, aliq_ipi: 0
      }]
    }));
  };

  const updateItem = (index, updated) => {
    setForm(f => {
      const itens = [...f.itens];
      itens[index] = updated;
      return { ...f, itens };
    });
  };

  const removeItem = (index) => {
    setForm(f => ({ ...f, itens: f.itens.filter((_, i) => i !== index) }));
  };

  // Totais calculados automaticamente
  const totais = form.itens.reduce((acc, item) => {
    const sub = (item.quantidade || 0) * (item.valor_unitario || 0);
    acc.produtos += sub;
    acc.icms += sub * ((item.aliq_icms || 0) / 100);
    acc.pis += sub * ((item.aliq_pis || 0) / 100);
    acc.cofins += sub * ((item.aliq_cofins || 0) / 100);
    acc.ipi += sub * ((item.aliq_ipi || 0) / 100);
    return acc;
  }, { produtos: 0, icms: 0, pis: 0, cofins: 0, ipi: 0 });

  const totalNota = totais.produtos + totais.ipi + (form.valor_frete || 0) + (form.valor_seguro || 0) + (form.valor_outros || 0) - (form.valor_desconto || 0);

  const handleSave = async (situacao = "Rascunho") => {
    if (!empresaSel) { alert("Selecione a empresa emitente!"); return; }
    if (form.itens.length === 0) { alert("Adicione ao menos um item!"); return; }
    setSaving(true);
    const itensFull = form.itens.map(item => {
      const sub = (item.quantidade || 0) * (item.valor_unitario || 0);
      return {
        ...item,
        valor_total: sub,
        valor_icms: sub * ((item.aliq_icms || 0) / 100),
        valor_pis: sub * ((item.aliq_pis || 0) / 100),
        valor_cofins: sub * ((item.aliq_cofins || 0) / 100),
        valor_ipi: sub * ((item.aliq_ipi || 0) / 100),
      };
    });
    const payload = {
      ...form,
      empresa_id: empresaSel,
      itens: itensFull,
      valor_produtos: totais.produtos,
      valor_icms: totais.icms,
      valor_pis: totais.pis,
      valor_cofins: totais.cofins,
      valor_ipi: totais.ipi,
      valor_total: totalNota,
      situacao,
      tipo_operacao: "Saída"
    };
    
    try {
      let nfe_id = nota?.id;
      if (nota) {
        await base44.entities.NotaFiscalEletronica.update(nota.id, payload);
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
            itens: itensFull,
            valor_total: totalNota,
            natureza_operacao: form.natureza_operacao,
            serie: form.serie,
            numero: form.numero
          });
          
          if (res.data && res.data.success) {
            alert("NF-e transmitida com sucesso!");
          } else {
            alert("Erro ao transmitir NF-e: " + (res.data?.error || "Desconhecido"));
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
      alert("Erro ao salvar nota: " + err.message);
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
            <h2 className="text-base font-semibold text-foreground">{nota ? "Editar" : "Emitir"} {form.tipo_doc}</h2>
            <p className="text-xs text-muted-foreground">Preencha os dados e salve ou transmita para a SEFAZ</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg">✕</button>
        </div>

        <div className="p-5 space-y-6">
          {/* Emitente e tipo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-muted-foreground mb-1.5">Empresa Emitente *</label>
              <select value={empresaSel} onChange={e => setEmpresaSel(e.target.value)}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                <option value="">Selecionar empresa...</option>
                {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.razao_social} — {emp.cnpj}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Tipo de Documento *</label>
              <select value={form.tipo_doc} onChange={e => f("tipo_doc", e.target.value)}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                {["NF-e", "NFS-e", "CT-e", "MDF-e"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Finalidade</label>
              <select value={form.finalidade} onChange={e => f("finalidade", e.target.value)}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                {["1-Normal", "2-Complementar", "3-Ajuste", "4-Devolução/Retorno"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Número</label>
              <input value={form.numero} onChange={e => f("numero", e.target.value)}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" placeholder="Auto" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Série</label>
              <input value={form.serie} onChange={e => f("serie", e.target.value)}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Data de Emissão *</label>
              <input required type="date" value={form.data_emissao} onChange={e => f("data_emissao", e.target.value)}
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

          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Natureza da Operação</label>
            <input value={form.natureza_operacao} onChange={e => f("natureza_operacao", e.target.value)}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
          </div>

          {/* Destinatário */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-center text-xs font-bold flex items-center justify-center">D</span>
              Destinatário
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                <label className="block text-xs text-muted-foreground mb-1">Inscrição Estadual</label>
                <input value={form.destinatario_ie} onChange={e => f("destinatario_ie", e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">E-mail</label>
                <input type="email" value={form.destinatario_email} onChange={e => f("destinatario_email", e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Logradouro</label>
                <input value={form.destinatario_logradouro} onChange={e => f("destinatario_logradouro", e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Município</label>
                <input value={form.destinatario_municipio} onChange={e => f("destinatario_municipio", e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">UF</label>
                <select value={form.destinatario_uf} onChange={e => f("destinatario_uf", e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                  <option value="">—</option>
                  {UFs.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Itens */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-center text-xs font-bold flex items-center justify-center">I</span>
                Itens da Nota
              </p>
              <button onClick={addItem}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-medium hover:bg-primary/20">
                <Plus size={12} /> Adicionar Item
              </button>
            </div>
            {form.itens.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
                Nenhum item adicionado. Clique em "+ Adicionar Item" para começar.
              </div>
            ) : (
              <div className="space-y-3">
                {form.itens.map((item, i) => (
                  <ItemRow key={i} item={item} onChange={updateItem} onRemove={removeItem} index={i} />
                ))}
              </div>
            )}
          </div>

          {/* Totais e Frete */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Frete e Despesas</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Modalidade Frete</label>
                  <select value={form.modalidade_frete} onChange={e => f("modalidade_frete", e.target.value)}
                    className="w-full bg-muted border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary">
                    {["0-Por conta emitente", "1-Por conta destinatário", "2-Por conta terceiros", "9-Sem frete"].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Valor Frete (R$)</label>
                  <input type="number" min="0" step="0.01" value={form.valor_frete} onChange={e => f("valor_frete", parseFloat(e.target.value) || 0)}
                    className="w-full bg-muted border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Seguro (R$)</label>
                  <input type="number" min="0" step="0.01" value={form.valor_seguro} onChange={e => f("valor_seguro", parseFloat(e.target.value) || 0)}
                    className="w-full bg-muted border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Desconto (R$)</label>
                  <input type="number" min="0" step="0.01" value={form.valor_desconto} onChange={e => f("valor_desconto", parseFloat(e.target.value) || 0)}
                    className="w-full bg-muted border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary" />
                </div>
              </div>
            </div>

            <div className="bg-muted/50 border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Calculator size={12} /> Resumo Fiscal
              </p>
              <div className="space-y-1.5 text-xs">
                {[
                  { label: "Valor dos Produtos", value: totais.produtos, color: "text-foreground" },
                  { label: "Total ICMS", value: totais.icms, color: "text-yellow-400" },
                  { label: "Total PIS", value: totais.pis, color: "text-blue-400" },
                  { label: "Total COFINS", value: totais.cofins, color: "text-blue-400" },
                  { label: "Total IPI", value: totais.ipi, color: "text-yellow-400" },
                  { label: "Frete", value: form.valor_frete || 0, color: "text-muted-foreground" },
                  { label: "Desconto", value: -(form.valor_desconto || 0), color: "text-red-400" },
                ].map(row => (
                  <div key={row.label} className="flex justify-between">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className={`font-medium ${row.color}`}>{fmt(row.value)}</span>
                  </div>
                ))}
                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="font-semibold text-foreground">TOTAL DA NOTA</span>
                  <span className="font-bold text-primary text-sm">{fmt(totalNota)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Info adicional */}
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Informações Adicionais / Dados ao Fisco</label>
            <textarea value={form.informacoes_adicionais} onChange={e => f("informacoes_adicionais", e.target.value)} rows={2}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary resize-none" />
          </div>

          {/* Aviso SEFAZ */}
          <div className="flex items-start gap-3 p-3 bg-yellow-500/10/5 border border-yellow-500/20 rounded-lg">
            <AlertCircle size={14} className="text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-400/80">
              <strong>Integração SEFAZ:</strong> Para transmissão real à SEFAZ, é necessário configurar o certificado digital A1 da empresa e integrar com uma API homologada (ex: Focus NFe, NFe.io, Teknisa). O sistema armazena o XML estruturado e registra todos os logs de transmissão.
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
              className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5">
              <CheckCircle2 size={14} />
              {saving ? "Processando..." : "Transmitir para SEFAZ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}