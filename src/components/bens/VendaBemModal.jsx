import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function VendaBemModal({ bem, onClose, onSave }) {
  const [form, setForm] = useState({
    data_venda: new Date().toISOString().slice(0, 10),
    valor_venda: "",
    comprador: "",
  });
  const [saving, setSaving] = useState(false);

  if (!bem) return null;

  const valorVenda = parseFloat(form.valor_venda) || 0;
  const lucro = valorVenda - (bem.valor_avaliacao || 0);
  const margem = bem.valor_avaliacao > 0 ? ((lucro / bem.valor_avaliacao) * 100) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.comprador.trim()) return alert("Informe o comprador.");
    if (valorVenda <= 0) return alert("Informe um valor de venda válido.");
    setSaving(true);
    await onSave({
      status: "vendido",
      data_venda: form.data_venda,
      valor_venda: valorVenda,
      comprador: form.comprador,
      lucro_prejuizo: Math.round(lucro * 100) / 100,
      margem: Math.round(margem * 100) / 100,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Registrar Venda do Bem</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Bem info */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Bem a ser vendido</p>
            <p className="text-sm font-medium text-foreground">{bem.descricao}</p>
            <p className="text-xs text-muted-foreground mt-1">Valor de avaliação: <span className="text-yellow-400 font-medium">{fmt(bem.valor_avaliacao)}</span></p>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Comprador *</label>
            <input required value={form.comprador} onChange={e => setForm(f => ({ ...f, comprador: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              placeholder="Nome do comprador" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Valor de Venda (R$) *</label>
              <input required type="number" step="0.01" min="0.01" value={form.valor_venda}
                onChange={e => setForm(f => ({ ...f, valor_venda: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Data da Venda *</label>
              <input required type="date" value={form.data_venda} onChange={e => setForm(f => ({ ...f, data_venda: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
          </div>

          {/* Preview resultado */}
          {valorVenda > 0 && (
            <div className={`p-3 rounded-lg border ${lucro >= 0 ? "bg-green-500/10/5 border-green-500/20" : "bg-red-500/10/5 border-red-500/20"}`}>
              <p className="text-xs text-muted-foreground mb-2">Resultado da operação</p>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Avaliação</span>
                <span>{fmt(bem.valor_avaliacao)}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Valor de Venda</span>
                <span className="text-green-400">{fmt(valorVenda)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-border pt-1 mt-1">
                <span>{lucro >= 0 ? "Lucro" : "Prejuízo"}</span>
                <span className={lucro >= 0 ? "text-green-400" : "text-red-400"}>
                  {lucro >= 0 ? "+" : ""}{fmt(lucro)} ({margem.toFixed(1)}%)
                </span>
              </div>
            </div>
          )}

          {bem.status === "vendido" && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10/10 border border-red-500/20 rounded-lg">
              <AlertTriangle size={16} className="text-red-400" />
              <p className="text-xs text-red-400">Este bem já foi vendido. Operação bloqueada.</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm bg-muted text-muted-foreground">Cancelar</button>
            <button type="submit" disabled={saving || bem.status === "vendido"}
              className="flex-1 py-2.5 rounded-lg text-sm bg-green-600 text-white hover:bg-green-500/10 disabled:opacity-50 transition-colors">
              {saving ? "Registrando..." : "Confirmar Venda"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}