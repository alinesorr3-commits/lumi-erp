import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Pencil, Trash2, Search, Check, X, ChevronRight } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

// Plano de contas padrão baseado nos anexos
const PLANO_PADRAO = [
  { codigo: "1", nome: "ATIVO", tipo: "Ativo Circulante", nivel: 0 },
  { codigo: "1.1", nome: "Ativo Circulante", tipo: "Ativo Circulante", nivel: 1 },
  { codigo: "1.1.01", nome: "Disponibilidades", tipo: "Ativo Circulante", nivel: 2 },
  { codigo: "1.1.01.01", nome: "Caixa", tipo: "Ativo Circulante", nivel: 3 },
  { codigo: "1.1.01.02", nome: "Bancos Conta Movimento", tipo: "Ativo Circulante", nivel: 3 },
  { codigo: "1.1.01.03", nome: "Aplicações Financeiras", tipo: "Ativo Circulante", nivel: 3 },
  { codigo: "1.1.02", nome: "Créditos", tipo: "Ativo Circulante", nivel: 2 },
  { codigo: "1.1.02.01", nome: "Clientes", tipo: "Ativo Circulante", nivel: 3 },
  { codigo: "1.1.02.02", nome: "Adiantamentos a Fornecedores", tipo: "Ativo Circulante", nivel: 3 },
  { codigo: "1.1.02.03", nome: "Impostos a Recuperar", tipo: "Ativo Circulante", nivel: 3 },
  { codigo: "1.1.03", nome: "Estoques", tipo: "Ativo Circulante", nivel: 2 },
  { codigo: "1.2", nome: "Ativo Não Circulante", tipo: "Ativo Não Circulante", nivel: 1 },
  { codigo: "1.2.01", nome: "Imobilizado", tipo: "Ativo Não Circulante", nivel: 2 },
  { codigo: "1.2.01.01", nome: "Máquinas e Equipamentos", tipo: "Ativo Não Circulante", nivel: 3 },
  { codigo: "1.2.01.02", nome: "Móveis e Utensílios", tipo: "Ativo Não Circulante", nivel: 3 },
  { codigo: "1.2.01.03", nome: "Veículos", tipo: "Ativo Não Circulante", nivel: 3 },
  { codigo: "1.2.01.04", nome: "Imóveis", tipo: "Ativo Não Circulante", nivel: 3 },
  { codigo: "2", nome: "PASSIVO", tipo: "Passivo Circulante", nivel: 0 },
  { codigo: "2.1", nome: "Passivo Circulante", tipo: "Passivo Circulante", nivel: 1 },
  { codigo: "2.1.01", nome: "Fornecedores", tipo: "Passivo Circulante", nivel: 2 },
  { codigo: "2.1.02", nome: "Obrigações Fiscais", tipo: "Passivo Circulante", nivel: 2 },
  { codigo: "2.1.02.01", nome: "ICMS a Recolher", tipo: "Passivo Circulante", nivel: 3 },
  { codigo: "2.1.02.02", nome: "PIS/COFINS a Recolher", tipo: "Passivo Circulante", nivel: 3 },
  { codigo: "2.1.02.03", nome: "ISS a Recolher", tipo: "Passivo Circulante", nivel: 3 },
  { codigo: "2.1.03", nome: "Obrigações Trabalhistas", tipo: "Passivo Circulante", nivel: 2 },
  { codigo: "2.1.03.01", nome: "Salários a Pagar", tipo: "Passivo Circulante", nivel: 3 },
  { codigo: "2.1.03.02", nome: "INSS a Recolher", tipo: "Passivo Circulante", nivel: 3 },
  { codigo: "2.1.03.03", nome: "FGTS a Recolher", tipo: "Passivo Circulante", nivel: 3 },
  { codigo: "2.1.04", nome: "Empréstimos e Financiamentos", tipo: "Passivo Circulante", nivel: 2 },
  { codigo: "2.2", nome: "Passivo Não Circulante", tipo: "Passivo Não Circulante", nivel: 1 },
  { codigo: "2.2.01", nome: "Empréstimos e Financiamentos LP", tipo: "Passivo Não Circulante", nivel: 2 },
  { codigo: "3", nome: "PATRIMÔNIO LÍQUIDO", tipo: "Patrimônio Líquido", nivel: 0 },
  { codigo: "3.1", nome: "Capital Social", tipo: "Patrimônio Líquido", nivel: 1 },
  { codigo: "3.2", nome: "Reservas de Capital", tipo: "Patrimônio Líquido", nivel: 1 },
  { codigo: "3.3", nome: "Lucros/Prejuízos Acumulados", tipo: "Patrimônio Líquido", nivel: 1 },
  { codigo: "4", nome: "RECEITAS DRE", tipo: "Receita", nivel: 0 },
  { codigo: "4.1", nome: "Receita Bruta de Vendas", tipo: "Receita", nivel: 1 },
  { codigo: "4.1.01", nome: "Receita de Produtos", tipo: "Receita", nivel: 2 },
  { codigo: "4.1.02", nome: "Receita de Serviços", tipo: "Receita", nivel: 2 },
  { codigo: "4.2", nome: "Deduções da Receita", tipo: "Receita", nivel: 1 },
  { codigo: "4.2.01", nome: "Devoluções e Abatimentos", tipo: "Receita", nivel: 2 },
  { codigo: "4.2.02", nome: "Impostos sobre Vendas", tipo: "Receita", nivel: 2 },
  { codigo: "4.3", nome: "Receitas Financeiras", tipo: "Receita", nivel: 1 },
  { codigo: "4.4", nome: "Outras Receitas Operacionais", tipo: "Receita", nivel: 1 },
  { codigo: "5", nome: "CUSTOS DRE", tipo: "Despesa", nivel: 0 },
  { codigo: "5.1", nome: "CMV - Custo das Mercadorias Vendidas", tipo: "Despesa", nivel: 1 },
  { codigo: "5.2", nome: "CSP - Custo dos Serviços Prestados", tipo: "Despesa", nivel: 1 },
  { codigo: "5.3", nome: "Matéria-Prima e Insumos", tipo: "Despesa", nivel: 1 },
  { codigo: "6", nome: "DESPESAS DRE", tipo: "Despesa", nivel: 0 },
  { codigo: "6.1", nome: "Despesas Administrativas", tipo: "Despesa", nivel: 1 },
  { codigo: "6.1.01", nome: "Salários e Encargos", tipo: "Despesa", nivel: 2 },
  { codigo: "6.1.02", nome: "Aluguéis", tipo: "Despesa", nivel: 2 },
  { codigo: "6.1.03", nome: "Energia Elétrica", tipo: "Despesa", nivel: 2 },
  { codigo: "6.1.04", nome: "Telefone e Internet", tipo: "Despesa", nivel: 2 },
  { codigo: "6.1.05", nome: "Material de Escritório", tipo: "Despesa", nivel: 2 },
  { codigo: "6.2", nome: "Despesas Comerciais", tipo: "Despesa", nivel: 1 },
  { codigo: "6.2.01", nome: "Comissões de Vendas", tipo: "Despesa", nivel: 2 },
  { codigo: "6.2.02", nome: "Marketing e Publicidade", tipo: "Despesa", nivel: 2 },
  { codigo: "6.3", nome: "Despesas Financeiras", tipo: "Despesa", nivel: 1 },
  { codigo: "6.3.01", nome: "Juros Bancários", tipo: "Despesa", nivel: 2 },
  { codigo: "6.3.02", nome: "Tarifas Bancárias", tipo: "Despesa", nivel: 2 },
  { codigo: "6.4", nome: "Depreciação e Amortização", tipo: "Despesa", nivel: 1 },
  { codigo: "7", nome: "INVESTIMENTOS CAPEX", tipo: "Despesa", nivel: 0 },
  { codigo: "7.1", nome: "Aquisição de Imobilizado", tipo: "Despesa", nivel: 1 },
  { codigo: "7.1.01", nome: "Equipamentos", tipo: "Despesa", nivel: 2 },
  { codigo: "7.1.02", nome: "Veículos", tipo: "Despesa", nivel: 2 },
  { codigo: "7.1.03", nome: "Obras e Benfeitorias", tipo: "Despesa", nivel: 2 },
  { codigo: "8", nome: "SÓCIOS", tipo: "Patrimônio Líquido", nivel: 0 },
  { codigo: "8.1", nome: "Pró-Labore", tipo: "Patrimônio Líquido", nivel: 1 },
  { codigo: "8.2", nome: "Distribuição de Lucros", tipo: "Patrimônio Líquido", nivel: 1 },
  { codigo: "8.3", nome: "Aportes de Capital", tipo: "Patrimônio Líquido", nivel: 1 },
  { codigo: "8.4", nome: "Retiradas de Capital", tipo: "Patrimônio Líquido", nivel: 1 },
];

function getNivelCor(nivel, codigo) {
  if (nivel === 0) return "text-foreground font-bold text-sm uppercase tracking-wide";
  if (nivel === 1) return "text-blue-400 font-semibold text-sm pl-6";
  if (nivel === 2) return "text-foreground font-medium text-sm pl-12";
  return "text-muted-foreground text-sm pl-20";
}

function getCodCor(nivel) {
  if (nivel === 0) return "text-foreground font-bold";
  if (nivel === 1) return "text-blue-400 font-semibold";
  if (nivel === 2) return "text-blue-300";
  return "text-muted-foreground";
}

function ContaRow({ conta, onEdit, onDelete }) {
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({ nome: conta.nome, valor: conta.valor || 0 });
  const [saving, setSaving] = useState(false);

  const salvar = async () => {
    setSaving(true);
    await onEdit(conta.id, form);
    setEditando(false);
    setSaving(false);
  };

  const padding = conta.nivel === 0 ? "" : conta.nivel === 1 ? "pl-6" : conta.nivel === 2 ? "pl-12" : "pl-20";

  return (
    <div className={`flex items-center justify-between py-2.5 border-b border-border/30 group hover:bg-muted/20 transition-colors ${conta.nivel === 0 ? "bg-muted/30" : ""}`}>
      <div className={`flex items-center gap-3 flex-1 min-w-0 ${padding}`}>
        <span className={`text-xs font-mono w-24 flex-shrink-0 ${getCodCor(conta.nivel)}`}>{conta.codigo}</span>
        {editando ? (
          <input
            value={form.nome}
            onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
            className="flex-1 bg-muted border border-primary rounded px-2 py-0.5 text-sm text-foreground focus:outline-none"
            autoFocus
          />
        ) : (
          <span className={getNivelCor(conta.nivel, conta.codigo)}>{conta.nome}</span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {editando ? (
          <>
            <input
              type="number"
              value={form.valor}
              onChange={e => setForm(f => ({ ...f, valor: parseFloat(e.target.value) || 0 }))}
              className="w-32 bg-muted border border-primary rounded px-2 py-0.5 text-sm text-right text-foreground focus:outline-none"
              placeholder="0,00"
            />
            <button onClick={salvar} disabled={saving} className="p-1 text-green-400 hover:text-green-300">
              <Check size={14} />
            </button>
            <button onClick={() => setEditando(false)} className="p-1 text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          </>
        ) : (
          <>
            <span className="text-xs font-mono text-muted-foreground w-24 text-right">{fmt(conta.valor || 0)}</span>
            <button onClick={() => setEditando(true)} className="p-1 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              <Pencil size={13} />
            </button>
            <button onClick={() => onDelete(conta.id)} className="p-1 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function NovaContaModal({ onClose, onSave }) {
  const [form, setForm] = useState({ codigo: "", nome: "", tipo: "Despesa", nivel: 3, valor: 0 });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.codigo || !form.nome) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  const niveis = form.codigo.split(".").length - 1;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-foreground">Nova Conta</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Código *</label>
            <input
              value={form.codigo}
              onChange={e => setForm(f => ({ ...f, codigo: e.target.value, nivel: e.target.value.split(".").length - 1 }))}
              placeholder="Ex: 6.1.06"
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            />
            <p className="text-[10px] text-muted-foreground mt-1">Nível detectado: {niveis} (0=grupo, 1=subgrupo, 2=conta, 3=subconta)</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Nome *</label>
            <input
              value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              placeholder="Ex: Combustíveis"
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Tipo</label>
            <select
              value={form.tipo}
              onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            >
              {["Ativo Circulante", "Ativo Não Circulante", "Passivo Circulante", "Passivo Não Circulante", "Patrimônio Líquido", "Receita", "Despesa"].map(t => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Valor Inicial (R$)</label>
            <input
              type="number"
              value={form.valor}
              onChange={e => setForm(f => ({ ...f, valor: parseFloat(e.target.value) || 0 }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 bg-muted text-muted-foreground rounded-lg text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={saving || !form.codigo || !form.nome}
            className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm disabled:opacity-50">
            {saving ? "Salvando..." : "Adicionar Conta"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PlanoContas() {
  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [novaContaModal, setNovaContaModal] = useState(false);
  const [importando, setImportando] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.PlanoContas.list("codigo");
    setContas(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const importarPadrao = async () => {
    if (!confirm("Isso importará o plano de contas padrão. Continuar?")) return;
    setImportando(true);
    for (const c of PLANO_PADRAO) {
      await base44.entities.PlanoContas.create({ codigo: c.codigo, nome: c.nome, tipo: c.tipo, hierarquia_nivel: c.nivel, ativa: true });
    }
    await load();
    setImportando(false);
  };

  const handleEdit = async (id, data) => {
    await base44.entities.PlanoContas.update(id, { nome: data.nome, valor: data.valor });
    await load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir esta conta?")) return;
    await base44.entities.PlanoContas.delete(id);
    await load();
  };

  const handleNova = async (data) => {
    await base44.entities.PlanoContas.create({
      codigo: data.codigo,
      nome: data.nome,
      tipo: data.tipo,
      hierarquia_nivel: data.nivel,
      ativa: true,
      valor: data.valor || 0,
    });
    await load();
  };

  // Ordena por código e filtra
  const contasFiltradas = contas
    .filter(c => !busca || c.codigo?.includes(busca) || c.nome?.toLowerCase().includes(busca.toLowerCase()))
    .sort((a, b) => {
      const pa = a.codigo?.split(".").map(n => n.padStart(4, "0")).join(".");
      const pb = b.codigo?.split(".").map(n => n.padStart(4, "0")).join(".");
      return pa < pb ? -1 : 1;
    })
    .map(c => ({ ...c, nivel: c.hierarquia_nivel ?? (c.codigo?.split(".").length - 1) }));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-foreground">Plano de Contas</h2>
          <p className="text-xs text-muted-foreground">{contas.length} contas cadastradas</p>
        </div>
        <div className="flex items-center gap-2">
          {contas.length === 0 && (
            <button onClick={importarPadrao} disabled={importando}
              className="flex items-center gap-2 px-3 py-2 bg-muted text-foreground rounded-lg text-sm border border-border hover:bg-muted/70 disabled:opacity-50">
              {importando ? "Importando..." : "📥 Importar Padrão"}
            </button>
          )}
          <button onClick={() => setNovaContaModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
            <Plus size={14} /> Nova Conta
          </button>
        </div>
      </div>

      {/* Busca */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por código ou nome..."
          className="w-full bg-muted border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
        />
      </div>

      {/* Lista */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
        ) : contasFiltradas.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-sm mb-3">Nenhuma conta cadastrada</p>
            <button onClick={importarPadrao} disabled={importando}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
              {importando ? "Importando..." : "Importar Plano Padrão"}
            </button>
          </div>
        ) : (
          <div className="px-4 py-2">
            {contasFiltradas.map(conta => (
              <ContaRow key={conta.id} conta={conta} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {novaContaModal && (
        <NovaContaModal onClose={() => setNovaContaModal(false)} onSave={handleNova} />
      )}
    </div>
  );
}