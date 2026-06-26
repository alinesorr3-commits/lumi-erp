import { useState, useEffect } from "react";
import { X } from "lucide-react";

const inp = (value, onChange) => ({
  value: value || "",
  onChange: (e) => onChange(e.target.value),
  className: "w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary",
});

export default function ProdutoModal({ produto, classificacao, onClose, onSave }) {
  const [form, setForm] = useState({
    tipo: produto?.tipo || "Produto",
    codigo: produto?.codigo || "",
    descricao: produto?.descricao || "",
    unidade: produto?.unidade || "UN",
    preco_custo: produto?.preco_custo || 0,
    preco_venda: produto?.preco_venda || 0,
    estoque_minimo: produto?.estoque_minimo || 0,
    ncm: produto?.ncm || "",
    cfop_saida: produto?.cfop_saida || "5102",
    aliq_icms: produto?.aliq_icms || 12,
    mva: produto?.mva || 0,
  });
  const [saving, setSaving] = useState(false);
  const [buscandoMva, setBuscandoMva] = useState(false);

  const handleBuscarMVA = async () => {
    if (!form.ncm) {
      alert("Informe um NCM válido para buscar o MVA.");
      return;
    }
    setBuscandoMva(true);
    try {
      // Usamos a função de integração para buscar o MVA
      const base44 = (await import('@/api/base44Client')).base44;
      const res = await base44.functions.invoke("buscarMVASefaz", { codigo_ncm: form.ncm });
      if (res.data && res.data.sucesso) {
        setForm(f => ({ ...f, mva: res.data.mva_percentual }));
      } else {
        alert(res.data?.mensagem || "MVA não encontrado para este NCM. Insira manualmente.");
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao buscar MVA.");
    } finally {
      setBuscandoMva(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card">
          <h2 className="text-base font-semibold text-foreground">
            {produto ? "Editar Produto" : "Novo Produto"} - {classificacao}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Tipo</label>
              <select value={form.tipo} onChange={(e) => f("tipo", e.target.value)}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                <option>Produto</option>
                <option>Serviço</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Código</label>
              <input {...inp(form.codigo, v => f("codigo", v))} placeholder="SKU-001" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Descrição *</label>
            <input required {...inp(form.descricao, v => f("descricao", v))} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Unidade</label>
              <input {...inp(form.unidade, v => f("unidade", v))} placeholder="UN" maxLength={5} />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Estoque Mínimo</label>
              <input type="number" min="0" {...inp(form.estoque_minimo, v => f("estoque_minimo", parseFloat(v) || 0))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Preço de Custo (R$)</label>
              <input type="number" step="0.01" min="0" {...inp(form.preco_custo, v => f("preco_custo", parseFloat(v) || 0))} />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Preço de Venda (R$)</label>
              <input type="number" step="0.01" min="0" {...inp(form.preco_venda, v => f("preco_venda", parseFloat(v) || 0))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">NCM</label>
              <input {...inp(form.ncm, v => f("ncm", v))} placeholder="00000000" maxLength={8} />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">CFOP Saída</label>
              <input {...inp(form.cfop_saida, v => f("cfop_saida", v))} placeholder="5102" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Alíquota ICMS (%)</label>
              <input type="number" step="0.01" min="0" max="100" {...inp(form.aliq_icms, v => f("aliq_icms", parseFloat(v) || 0))} />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">MVA - ST (%)</label>
              <div className="flex gap-2">
                <input type="number" step="0.01" min="0" {...inp(form.mva, v => f("mva", parseFloat(v) || 0))} />
                <button 
                  type="button" 
                  onClick={handleBuscarMVA}
                  disabled={buscandoMva}
                  className="px-3 py-2 bg-primary/10 text-primary rounded-lg text-xs font-semibold hover:bg-primary/10/20 disabled:opacity-50 whitespace-nowrap"
                >
                  {buscandoMva ? "Buscando..." : "Buscar SEFAZ"}
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm bg-muted text-muted-foreground hover:bg-muted/80">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm bg-primary text-primary-foreground disabled:opacity-50">
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}