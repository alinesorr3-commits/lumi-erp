import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function OrdemProducaoModal({ ordem, fichas, onClose, onSave }) {
   const [form, setForm] = useState({
      numero: ordem?.numero || `OP-${Date.now()}`,
      produto_id: ordem?.produto_id || "",
      produto_codigo: ordem?.produto_codigo || "",
      produto_descricao: ordem?.produto_descricao || "",
      nome_venda: ordem?.nome_venda || "",
      ficha_tecnica_id: ordem?.ficha_tecnica_id || "",
      quantidade_planejada: ordem?.quantidade_planejada || 1,
      data_emissao: ordem?.data_emissao || new Date().toISOString().split("T")[0],
      data_prevista_inicio: ordem?.data_prevista_inicio || "",
      data_prevista_conclusao: ordem?.data_prevista_conclusao || "",
      status: ordem?.status || "Planejada",
      responsavel: ordem?.responsavel || "",
      custo_real_insumos: ordem?.custo_real_insumos || 0,
      custo_real_mao_obra: ordem?.custo_real_mao_obra || 0,
      custo_total_realizado: ordem?.custo_total_realizado || 0,
      observacoes: ordem?.observacoes || "",
    });
   const [produtos, setProdutos] = useState([]);
   const [fichaAtiva, setFichaAtiva] = useState(null);
   const [saving, setSaving] = useState(false);

   useEffect(() => {
     base44.entities.ProdutoServico.list().then(setProdutos);
   }, []);

   const handleSelectFicha = (fichaId) => {
     const ficha = fichas.find(f => f.id === fichaId);
     if (ficha) {
       setFichaAtiva(ficha);
       setForm(f => ({
         ...f,
         ficha_tecnica_id: fichaId,
         produto_id: ficha.produto_id,
         produto_codigo: ficha.produto_codigo,
         produto_descricao: ficha.produto_descricao,
         nome_venda: ficha.nome_venda || ficha.produto_descricao,
         custo_real_insumos: ficha.custo_total_unitario || 0,
         custo_real_mao_obra: ficha.custo_mao_obra || 0,
       }));
     }
   };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-base font-semibold text-foreground">{ordem ? "Editar" : "Nova"} Ordem de Produção</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Número</label>
              <input disabled value={form.numero}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground opacity-50" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Ficha Técnica *</label>
              <select required value={form.ficha_tecnica_id} onChange={e => handleSelectFicha(e.target.value)}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                <option value="">Selecionar ficha</option>
                {fichas && fichas.map(f => <option key={f.id} value={f.id}>{f.produto_descricao || "Sem nome"} v{f.versao || 1}</option>)}
              </select>
            </div>
          </div>

          {fichaAtiva && (
            <div className="p-3 bg-blue-400/10 border border-blue-400/30 rounded-lg text-xs">
              <p className="text-blue-600 font-medium mb-2">📋 Ficha Técnica Selecionada</p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-muted-foreground">Custo Unit. Insumos</p>
                  <p className="font-bold text-foreground">{fmt(fichaAtiva.custo_total_unitario || 0)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Custo Mão de Obra</p>
                  <p className="font-bold text-foreground">{fmt(fichaAtiva.custo_mao_obra || 0)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Overhead</p>
                  <p className="font-bold text-foreground">{fmt(fichaAtiva.custo_overhead || 0)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Produto</label>
              <input disabled value={form.produto_descricao}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground opacity-50" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Quantidade Planejada *</label>
              <input type="number" required min="1" step="0.01" value={form.quantidade_planejada} onChange={e => setForm(f => ({ ...f, quantidade_planejada: parseFloat(e.target.value) || 1 }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Emissão *</label>
              <input type="date" required value={form.data_emissao} onChange={e => setForm(f => ({ ...f, data_emissao: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary placeholder-muted-foreground" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Prev. Início</label>
              <input type="date" value={form.data_prevista_inicio} onChange={e => setForm(f => ({ ...f, data_prevista_inicio: e.target.value }))}
                placeholder="dd/mm/aaaa"
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary placeholder-muted-foreground" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Prev. Conclusão</label>
              <input type="date" value={form.data_prevista_conclusao} onChange={e => setForm(f => ({ ...f, data_prevista_conclusao: e.target.value }))}
                placeholder="dd/mm/aaaa"
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary placeholder-muted-foreground" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Custo Insumos (R$/un)</label>
              <input type="number" step="0.01" value={form.custo_real_insumos} onChange={e => setForm(f => ({ ...f, custo_real_insumos: parseFloat(e.target.value) || 0 }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Mão de Obra (R$/un)</label>
              <input type="number" step="0.01" value={form.custo_real_mao_obra} onChange={e => setForm(f => ({ ...f, custo_real_mao_obra: parseFloat(e.target.value) || 0 }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Custo Total Realizado</label>
              <input disabled value={fmt((form.custo_real_insumos + form.custo_real_mao_obra) * form.quantidade_planejada)}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground opacity-50 font-semibold" />
            </div>
          </div>

           <div className="grid grid-cols-2 gap-3">
             <div>
               <label className="block text-xs text-muted-foreground mb-1.5">Status</label>
               <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                 className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                 <option>Planejada</option>
                 <option>Em Produção</option>
                 <option>Concluída</option>
                 <option>Cancelada</option>
               </select>
             </div>
             <div>
               <label className="block text-xs text-muted-foreground mb-1.5">Responsável</label>
               <input value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))}
                 className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
             </div>
           </div>

           <div>
             <label className="block text-xs text-muted-foreground mb-1.5">Observações</label>
             <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={2}
               className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary resize-none" />
           </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-muted text-muted-foreground rounded-lg text-sm">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm disabled:opacity-50">
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}