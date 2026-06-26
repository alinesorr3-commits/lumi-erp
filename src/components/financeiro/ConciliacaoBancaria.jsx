import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, CheckCircle2, Circle, Landmark, X, Upload, Pencil, Trash2 } from "lucide-react";
import ImportarRelatorioModal from "./ImportarRelatorioModal";
import MovimentacoesImportadas from "./MovimentacoesImportadas";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

function ContaModal({ conta, onClose, onSave }) {
  const [form, setForm] = useState({
    nome: conta?.nome || "",
    banco: conta?.banco || "",
    agencia: conta?.agencia || "",
    conta: conta?.conta || "",
    tipo: conta?.tipo || "corrente",
    saldo_inicial: conta?.saldo_inicial || 0,
    ativa: conta?.ativa !== false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ ...form, saldo_inicial: parseFloat(form.saldo_inicial) || 0 });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">{conta ? "Editar Conta" : "Nova Conta Bancária"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Nome da Conta *</label>
            <input required value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Banco *</label>
              <input required value={form.banco} onChange={e => setForm(f => ({ ...f, banco: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" placeholder="Ex: Bradesco" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Tipo</label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                <option value="corrente">Corrente</option>
                <option value="poupanca">Poupança</option>
                <option value="investimento">Investimento</option>
                <option value="caixa">Caixa</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Agência</label>
              <input value={form.agencia} onChange={e => setForm(f => ({ ...f, agencia: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Conta</label>
              <input value={form.conta} onChange={e => setForm(f => ({ ...f, conta: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Saldo Inicial (R$)</label>
            <input type="number" step="0.01" value={form.saldo_inicial} onChange={e => setForm(f => ({ ...f, saldo_inicial: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm bg-muted text-muted-foreground">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm bg-primary text-primary-foreground disabled:opacity-50">
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ConciliacaoBancaria({ lancamentos, onRefresh }) {
  const [contas, setContas] = useState([]);
  const [contaSelecionada, setContaSelecionada] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editConta, setEditConta] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [saldosConciliados, setSaldosConciliados] = useState({});

  const loadContas = async () => {
    const data = await base44.entities.ContaBancaria.list();
    setContas(data);
    
    // Calcular saldos conciliados
    const saldos = {};
    data.forEach(conta => {
      let saldo = conta.saldo_inicial || 0;
      const movsConta = (lancamentos || []).filter(m => m.conta_bancaria_id === conta.id && m.status === "pago" && m.conciliado);
      
      movsConta.forEach(mov => {
        if (mov.tipo === "receita") saldo += (mov.valor || 0) + (mov.juros_multas || 0);
        else saldo -= ((mov.valor || 0) + (mov.juros_multas || 0));
      });
      saldos[conta.id] = saldo;
    });
    setSaldosConciliados(saldos);

    if (data.length > 0 && !contaSelecionada) setContaSelecionada(data[0].id);
  };

  useEffect(() => { loadContas(); }, []);

  const handleSaveConta = async (data) => {
    if (editConta) {
      await base44.entities.ContaBancaria.update(editConta.id, data);
    } else {
      await base44.entities.ContaBancaria.create(data);
    }
    setModalOpen(false);
    setEditConta(null);
    loadContas();
  };

  const handleConciliar = async (lancamento) => {
    await base44.entities.Lancamento.update(lancamento.id, { conciliado: !lancamento.conciliado });
    onRefresh();
    loadContas();
  };

  const handleDeleteConta = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Excluir esta conta bancária?")) return;
    try {
      await base44.entities.ContaBancaria.delete(id);
      if (contaSelecionada === id) setContaSelecionada("");
      loadContas();
    } catch (err) {
      alert("Erro ao excluir conta");
    }
  };

  const conta = contas.find(c => c.id === contaSelecionada);
  const lancamentosConta = lancamentos.filter(l => l.conta_bancaria_id === contaSelecionada);
  const conciliados = lancamentosConta.filter(l => l.conciliado);
  const pendentes = lancamentosConta.filter(l => !l.conciliado);

  const saldoCalculado = (conta?.saldo_inicial || 0) +
    lancamentosConta.filter(l => l.tipo === "receita" && l.status === "pago").reduce((s, l) => s + (l.valor || 0), 0) -
    lancamentosConta.filter(l => l.tipo === "despesa" && l.status === "pago").reduce((s, l) => s + (l.valor || 0), 0);

  return (
    <div className="space-y-6">
      {/* Contas list */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Contas Bancárias</h3>
          <button
            onClick={() => { setEditConta(null); setModalOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={13} /> Nova Conta
          </button>
        </div>

        {contas.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Landmark size={28} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma conta cadastrada</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {contas.map(c => (
              <div
                key={c.id}
                onClick={() => setContaSelecionada(c.id)}
                className={`text-left p-4 rounded-xl border transition-all cursor-pointer group
 ${contaSelecionada === c.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Landmark size={16} className="text-blue-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-foreground truncate">{c.nome}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditConta(c); setModalOpen(true); }}
                      title="Editar"
                      className="p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-muted transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteConta(c.id, e)}
                      title="Excluir"
                      className="p-1.5 text-muted-foreground hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{c.banco} · {c.tipo}</p>
                {c.agencia && <p className="text-xs text-muted-foreground">Ag: {c.agencia} | Cc: {c.conta}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Movimentações Importadas */}
      {conta && (
        <MovimentacoesImportadas 
          contaId={contaSelecionada} 
          conta={conta}
          saldoSistema={saldoCalculado}
          lancamentosDisponiveis={lancamentosConta} 
          onRefresh={() => {
            onRefresh();
            loadContas();
          }} 
        />
      )}

      {/* Lançamentos da conta */}
      {conta && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Conciliação — {conta.nome}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Saldo calculado: <span className="text-green-400 font-medium">{fmt(saldoCalculado)}</span>
                {" · "}
                {conciliados.length} conciliados, {pendentes.length} pendentes
              </p>
            </div>
            <button
              onClick={() => setImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors"
            >
              <Upload size={13} /> Importar Relatório
            </button>
          </div>

          {lancamentosConta.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum lançamento vinculado a esta conta
            </p>
          ) : (
            <div className="space-y-2">
              {lancamentosConta.map(l => (
                <div key={l.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-all
 ${l.conciliado ? "border-green-500/20 bg-green-500/10/5" : "border-border hover:border-primary/20"}`}>
                  <button onClick={() => handleConciliar(l)} className="flex-shrink-0">
                    {l.conciliado
                      ? <CheckCircle2 size={18} className="text-green-400" />
                      : <Circle size={18} className="text-muted-foreground" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{l.descricao}</p>
                    <p className="text-xs text-muted-foreground">{l.vencimento} · {l.categoria || "Sem categoria"}</p>
                  </div>
                  <span className={`text-sm font-semibold ${l.tipo === "receita" ? "text-green-400" : "text-red-400"}`}>
                    {l.tipo === "receita" ? "+" : "-"}{fmt(l.valor)}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${l.conciliado ? "bg-green-500/10/20 text-green-400" : "bg-yellow-500/10/20 text-yellow-400"}`}>
                    {l.conciliado ? "Conciliado" : "Pendente"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <ContaModal
          conta={editConta}
          onClose={() => { setModalOpen(false); setEditConta(null); }}
          onSave={handleSaveConta}
        />
      )}

      {importModalOpen && (
        <ImportarRelatorioModal
          contaId={contaSelecionada}
          lancamentos={lancamentos}
          onClose={() => setImportModalOpen(false)}
          onImportSuccess={() => {
            setImportModalOpen(false);
            onRefresh();
          }}
        />
      )}
      </div>
      );
      }