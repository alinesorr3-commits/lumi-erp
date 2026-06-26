import { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

const UFs = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export default function MovimentacaoModal({ movimentacao, onClose, onSave }) {
  const [lancamentos, setLancamentos] = useState([]);

  useEffect(() => {
    base44.entities.Lancamento.list().then(setLancamentos);
  }, []);
  const [form, setForm] = useState({
    data_transacao: movimentacao?.data_transacao || "",
    tipo: movimentacao?.tipo || "receita",
    descricao: movimentacao?.descricao || "",
    valor: movimentacao?.valor || 0,
    cnpj_cpf: movimentacao?.cnpj_cpf || "",
    numero_documento: movimentacao?.numero_documento || "",
    lancamento_id: movimentacao?.lancamento_id || "",
    observacoes: movimentacao?.observacoes || ""
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const dataToSave = { ...form };
    if (form.lancamento_id) {
      const lancamento = lancamentos.find(l => l.id === form.lancamento_id);
      if (lancamento) {
        dataToSave.lancamento_descricao = lancamento.descricao;
        dataToSave.vinculado = true;
        
        // Update the lancamento as well
        await base44.entities.Lancamento.update(lancamento.id, {
          conciliado: true,
          status: "pago",
          data_pagamento: form.data_transacao,
          conta_bancaria_id: movimentacao?.conta_bancaria_id
        });
      }
    } else {
      dataToSave.lancamento_descricao = "";
      dataToSave.vinculado = false;
    }
    
    await onSave(dataToSave);
    setSaving(false);
  };

  const f = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Editar Movimentação</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Data *</label>
              <input
                required
                type="date"
                value={form.data_transacao}
                onChange={e => f("data_transacao", e.target.value)}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Tipo</label>
              <select
                value={form.tipo}
                onChange={e => f("tipo", e.target.value)}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              >
                <option value="receita">Receita</option>
                <option value="despesa">Despesa</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Descrição *</label>
            <input
              required
              value={form.descricao}
              onChange={e => f("descricao", e.target.value)}
              placeholder="Ex: Transferência bancária"
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Valor (R$) *</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={form.valor}
                onChange={e => f("valor", parseFloat(e.target.value) || 0)}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">CNPJ/CPF</label>
              <input
                value={form.cnpj_cpf}
                onChange={e => f("cnpj_cpf", e.target.value)}
                placeholder="Ex: 12.345.678/0001-90"
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Número do Documento</label>
              <input
                value={form.numero_documento}
                onChange={e => f("numero_documento", e.target.value)}
                placeholder="Ex: NF-e, boleto, etc"
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Vincular a Lançamento</label>
              <select
                value={form.lancamento_id}
                onChange={e => f("lancamento_id", e.target.value)}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              >
                <option value="">Não vincular</option>
                {lancamentos
                  .filter(l => l.tipo === form.tipo)
                  .map(l => (
                    <option key={l.id} value={l.id}>
                      {l.descricao} (R$ {(l.valor_pago !== undefined && l.valor_pago !== null && l.valor_pago !== "" ? Number(l.valor_pago) : (Number(l.valor) || 0) + (Number(l.valor_por_fora) || 0) + (Number(l.juros_multas) || 0)).toFixed(2)})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Observações</label>
            <textarea
              value={form.observacoes}
              onChange={e => f("observacoes", e.target.value)}
              rows={2}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm bg-muted text-muted-foreground hover:bg-muted/80"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg text-sm bg-primary text-primary-foreground disabled:opacity-50 hover:bg-primary/90"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}