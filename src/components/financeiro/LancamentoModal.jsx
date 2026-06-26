import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";

const categoriasPagar = ["Fornecedores", "Salários", "Aluguel", "Serviços", "Impostos", "Equipamentos", "Manutenção", "Outros"];
const categoriasReceber = ["Vendas", "Serviços Prestados", "Comissões", "Juros", "Reembolsos", "Outros"];

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "decimal", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0);

export default function LancamentoModal({ item, defaultTipo, onClose, onSave }) {
  const [form, setForm] = useState({
    descricao: "",
    tipo: defaultTipo || "despesa",
    valor: "",
    vencimento: "",
    categoria: "",
    cliente_fornecedor: "",
    tipo_documento: "Outro",
    numero_documento: "",
    observacoes: "",
    status: "pendente",
    conta_bancaria_id: "",
    parcelas: 1,
    valor_entrada: "",
    valor_desconto: "",
    dados_cheque: "",
  });
  const [contas, setContas] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.ContaBancaria.list().then(setContas);
    if (item) {
      setForm({
        descricao: item.descricao || "",
        tipo: item.tipo || defaultTipo || "despesa",
        valor: item.valor || "",
        vencimento: item.vencimento || "",
        categoria: item.categoria || "",
        cliente_fornecedor: item.cliente_fornecedor || "",
        tipo_documento: item.tipo_documento || "Outro",
        numero_documento: item.numero_documento || "",
        observacoes: item.observacoes || "",
        status: item.status || "pendente",
        conta_bancaria_id: item.conta_bancaria_id || "",
        juros_multas: item.juros_multas || 0,
        valor_pago: item.valor_pago || "",
        valor_por_fora: item.valor_por_fora || "",
        valor_desconto: item.valor_desconto || "",
        dados_cheque: item.dados_cheque || "",
        });
        }
        }, [item]);

  const categorias = form.tipo === "despesa" ? categoriasPagar : categoriasReceber;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.numero_documento) {
      const existing = await base44.entities.Lancamento.filter({ 
        numero_documento: form.numero_documento,
        cliente_fornecedor: form.cliente_fornecedor || ""
      });
      const dup = existing.find(ex => !item || ex.id !== item.id);
      if (dup) {
        alert("Já existe um lançamento (boleto/documento) com este número para este cliente/fornecedor.");
        return;
      }
    }

    setSaving(true);
    const valorBase = parseFloat(form.valor) || 0;
    const valorEntrada = parseFloat(form.valor_entrada) || 0;
    
    if (form.parcelas > 1 && !item) {
      const gerados = [];
      const valorRestante = Math.max(0, valorBase - valorEntrada);
      const valorParcela = parseFloat((valorRestante / form.parcelas).toFixed(2));
      let restante = valorRestante - (valorParcela * (form.parcelas - 1));
      
      if (valorEntrada > 0) {
        const payloadEntrada = { ...form };
        delete payloadEntrada.parcelas;
        delete payloadEntrada.valor_entrada;
        gerados.push({
          ...payloadEntrada,
          descricao: `${form.descricao} (Entrada)`,
          valor: valorEntrada,
          vencimento: form.vencimento
        });
      }
      
      for (let i = 0; i < form.parcelas; i++) {
        const dataVencimento = new Date(form.vencimento + "T12:00:00");
        const shift = valorEntrada > 0 ? i + 1 : i;
        dataVencimento.setMonth(dataVencimento.getMonth() + shift);
        const vencStr = dataVencimento.toISOString().split("T")[0];
        
        const descParcela = `${form.descricao} (${i + 1}/${form.parcelas})`;
        const payload = { ...form };
        delete payload.parcelas;
        delete payload.valor_entrada;
        
        gerados.push({
          ...payload,
          descricao: descParcela,
          valor: i === form.parcelas - 1 ? restante : valorParcela,
          vencimento: vencStr
        });
      }
      await onSave(gerados, true);
    } else {
      const payload = { ...form };
      delete payload.parcelas;
      delete payload.valor_entrada;
      await onSave({ ...payload, valor: valorBase }, false);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">
            {item ? "Editar Lançamento" : "Novo Lançamento"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Tipo */}
          <div className="flex gap-2">
            {["despesa", "receita"].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setForm(f => ({ ...f, tipo: t }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
 ${form.tipo === t
 ? t === "despesa" ? "bg-red-500/10/20 text-red-400 border border-red-500/30" : "bg-green-500/10/20 text-green-400 border border-green-500/30"
 : "bg-muted text-muted-foreground border border-transparent"}`}
              >
                {t === "despesa" ? "Despesa" : "Receita"}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Descrição *</label>
            <input
              required
              value={form.descricao}
              onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
              placeholder="Descrição do lançamento"
            />
          </div>

          <div className={`grid ${!item ? "grid-cols-3" : "grid-cols-2"} gap-3`}>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">{!item && form.parcelas > 1 ? "Valor Total (R$) *" : "Valor Principal (R$) *"}</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={form.valor}
                onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                placeholder="0,00"
              />
            </div>
            {!item && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Parcelas</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={form.parcelas}
                  onChange={e => setForm(f => ({ ...f, parcelas: parseInt(e.target.value) || 1 }))}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">{!item && form.parcelas > 1 ? "1º Vencimento *" : "Vencimento *"}</label>
              <input
                required
                type="date"
                value={form.vencimento}
                onChange={e => setForm(f => ({ ...f, vencimento: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {!item && form.parcelas > 1 && (
            <div className="p-4 border border-border rounded-lg bg-card/50 space-y-4">
              <h3 className="text-xs font-semibold text-red-400">Estrutura do Parcelamento</h3>
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-medium text-muted-foreground mb-1">Valor de Entrada (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.valor_entrada}
                    onChange={e => setForm(f => ({ ...f, valor_entrada: e.target.value }))}
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-muted-foreground mb-1">Parcelas Restantes</label>
                  <input
                    readOnly
                    value={form.parcelas}
                    className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-muted-foreground mb-1">Juros (% a.m.)</label>
                  <input
                    readOnly
                    value="0"
                    className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-medium text-muted-foreground mb-1">Valor Restante (R$)</label>
                  <input
                    readOnly
                    value={fmt(Math.max(0, (parseFloat(form.valor) || 0) - (parseFloat(form.valor_entrada) || 0)))}
                    className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-muted-foreground mb-1">Valor Parcela (R$)</label>
                  <input
                    readOnly
                    value={fmt(form.parcelas > 0 ? Math.max(0, (parseFloat(form.valor) || 0) - (parseFloat(form.valor_entrada) || 0)) / form.parcelas : 0)}
                    className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                Resumo: <strong>R$ {fmt(parseFloat(form.valor) || 0)}</strong> total → entrada <strong className="text-yellow-400">R$ {fmt(parseFloat(form.valor_entrada) || 0)}</strong> + <strong className="text-red-400">{form.parcelas}x</strong> de <strong>R$ {fmt(form.parcelas > 0 ? Math.max(0, (parseFloat(form.valor) || 0) - (parseFloat(form.valor_entrada) || 0)) / form.parcelas : 0)}</strong>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Categoria</label>
              <select
                value={form.categoria}
                onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              >
                <option value="">Selecionar</option>
                {categorias.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              >
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="vencido">Vencido</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              {form.tipo === "despesa" ? "Fornecedor" : "Cliente"}
            </label>
            <input
              value={form.cliente_fornecedor}
              onChange={e => setForm(f => ({ ...f, cliente_fornecedor: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
              placeholder={form.tipo === "despesa" ? "Nome do fornecedor" : "Nome do cliente"}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tp. Documento</label>
              <select
                value={form.tipo_documento}
                onChange={e => setForm(f => ({ ...f, tipo_documento: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              >
                <option value="Outro">Outro</option>
                <option value="Recibo">Recibo</option>
                <option value="NF-e">NF-e</option>
                <option value="NFS-e">NFS-e</option>
                <option value="Pedido">Pedido</option>
                <option value="Boleto">Boleto</option>
                <option value="Contrato">Contrato</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nº Documento</label>
              <input
                value={form.numero_documento}
                onChange={e => setForm(f => ({ ...f, numero_documento: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                placeholder="Ex: 1234"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Conta (Extrato)</label>
              <select
                value={form.conta_bancaria_id}
                onChange={e => setForm(f => ({ ...f, conta_bancaria_id: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              >
                <option value="">Nenhuma / Pendente</option>
                <option value="cheque_proprio">Cheque Próprio</option>
                <option value="cheque_terceiros">Cheque Terceiros</option>
                <option value="transferencia">Transferência</option>
                {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
          </div>

          {(form.conta_bancaria_id === "cheque_proprio" || form.conta_bancaria_id === "cheque_terceiros") && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Dados do Cheque</label>
              <input
                value={form.dados_cheque}
                onChange={e => setForm(f => ({ ...f, dados_cheque: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                placeholder="Ex: Banco 001, Agência 1234, Conta 5678, Cheque 987654"
              />
            </div>
          )}

          {form.status === "pago" && (
            <div className="grid grid-cols-3 gap-3 p-3 border border-border rounded-lg bg-card/50">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Valor Pago (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.valor_pago !== undefined && form.valor_pago !== null ? form.valor_pago : ""}
                  onChange={e => {
                    const v = e.target.value;
                    const numV = parseFloat(v);
                    const principal = parseFloat(form.valor) || 0;
                    if (isNaN(numV)) {
                      setForm(f => ({ ...f, valor_pago: v, valor_por_fora: "", valor_desconto: "" }));
                    } else {
                      const diff = numV - principal;
                      setForm(f => ({ 
                        ...f, 
                        valor_pago: v,
                        valor_por_fora: diff > 0 ? parseFloat(diff.toFixed(2)) : "",
                        valor_desconto: diff < 0 ? parseFloat(Math.abs(diff).toFixed(2)) : ""
                      }));
                    }
                  }}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                  placeholder="0,00"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Acréscimo/Extra (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.valor_por_fora !== undefined && form.valor_por_fora !== null ? form.valor_por_fora : ""}
                  onChange={e => {
                    const v = e.target.value;
                    const numV = parseFloat(v) || 0;
                    const principal = parseFloat(form.valor) || 0;
                    const desc = parseFloat(form.valor_desconto) || 0;
                    setForm(f => ({ 
                      ...f, 
                      valor_por_fora: v, 
                      valor_pago: parseFloat((principal + numV - desc).toFixed(2))
                    }));
                  }}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                  placeholder="0,00"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Desconto (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.valor_desconto !== undefined && form.valor_desconto !== null ? form.valor_desconto : ""}
                  onChange={e => {
                    const v = e.target.value;
                    const numV = parseFloat(v) || 0;
                    const principal = parseFloat(form.valor) || 0;
                    const extras = parseFloat(form.valor_por_fora) || 0;
                    setForm(f => ({ 
                      ...f, 
                      valor_desconto: v, 
                      valor_pago: parseFloat((principal + extras - numV).toFixed(2))
                    }));
                  }}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                  placeholder="0,00"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Observações</label>
            <textarea
              value={form.observacoes}
              onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
              rows={2}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? "Salvando..." : item ? "Salvar" : "Criar Lançamento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}