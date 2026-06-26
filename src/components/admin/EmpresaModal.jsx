import { useState } from "react";
import { Building2, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";

const ALL_MODULES = [
  { key: "financeiro", label: "Financeiro", color: "bg-green-500/10/20 text-green-400 border-green-500/30",
    permissoes: ["Visualizar lançamentos", "Criar lançamentos", "Editar lançamentos", "Excluir lançamentos", "Conciliação bancária", "Fluxo de caixa", "Sócios", "Prestadores de serviço"] },
  { key: "comercial", label: "Comercial", color: "bg-primary/10/20 text-blue-400 border-blue-500/30",
    permissoes: ["Visualizar clientes", "Criar/editar clientes", "Excluir clientes", "Pipeline de vendas", "Orçamentos e pedidos", "Notas fiscais comerciais", "Relatórios comerciais"] },
  { key: "fiscal", label: "Fiscal & Tributário", color: "bg-yellow-500/10/20 text-yellow-400 border-yellow-500/30",
    permissoes: ["Dashboard fiscal", "Dívidas e parcelamentos", "Certificados digitais", "Tabela NCM", "Calculadora ICMS", "Simulador tributário", "Motor de encargos", "Configuração tributária"] },
  { key: "rh", label: "Recursos Humanos", color: "bg-primary/10/20 text-blue-400 border-blue-500/30",
    permissoes: ["Visualizar colaboradores", "Criar/editar colaboradores", "Excluir colaboradores", "Ponto eletrônico", "Folha de pagamento"] },
  { key: "veiculos", label: "Veículos", color: "bg-primary/10/20 text-blue-400 border-blue-500/30",
    permissoes: ["Dashboard veículos", "Cadastro de frota", "Abastecimento", "Manutenção", "Despesas de veículos"] },
  { key: "obras", label: "Obras", color: "bg-yellow-500/10/20 text-yellow-400 border-yellow-500/30",
    permissoes: ["Dashboard obras", "Cadastro de obras", "Materiais", "Mão de obra", "Despesas", "Resultado", "Negociação"] },
  { key: "agronegocio", label: "Agronegócio", color: "bg-green-500/10/20 text-green-400 border-green-500/30",
    permissoes: ["Dashboard agro", "Fazendas e talhões", "Safras", "Despesas e receitas", "Financiamentos", "Resultado agrícola"] },
  { key: "eng_financeira", label: "Engenharia Fin.", color: "bg-green-500/10/20 text-green-400 border-green-500/30",
    permissoes: ["Dashboard executivo", "Fluxo de caixa", "DRE", "Indicadores IA", "Relatório obras", "Relatório agro"] },
  { key: "bens_recebidos", label: "Análise Balanciê", color: "bg-yellow-500/10/20 text-yellow-400 border-yellow-500/30",
    permissoes: ["Dashboard bens", "Cadastro de bens", "Estoque", "Venda de bens", "Relatórios"] },
  { key: "simulador", label: "Simulador de Lucro", color: "bg-primary/10/20 text-blue-400 border-blue-500/30",
    permissoes: ["Acessar simulador", "Exportar demonstrativo"] },
  { key: "nfe", label: "Emissão NF-e/NFS-e", color: "bg-red-500/10/20 text-red-400 border-red-500/30",
    permissoes: ["Dashboard NF-e", "Emitir NF-e", "Cancelar NF-e", "Emitir NFS-e", "Cancelar NFS-e", "Download XML", "Download DANFE", "Cadastros fiscais"] },
  { key: "cte_mdfe", label: "CT-e / MDF-e", color: "bg-primary/10/20 text-blue-400 border-blue-500/30",
    permissoes: ["Emitir CT-e", "Cancelar CT-e", "Emitir MDF-e", "Encerrar MDF-e", "Transportadoras", "Veículos de transporte", "Motoristas"] },
];

function ModuloPermissoes({ modulo, ativo, permissoesSelecionadas, onToggleModulo, onTogglePermissao }) {
  const [expanded, setExpanded] = useState(false);
  const todasSelecionadas = modulo.permissoes.every(p => permissoesSelecionadas.includes(p));

  const toggleTodas = (e) => {
    e.stopPropagation();
    if (todasSelecionadas) {
      modulo.permissoes.forEach(p => onTogglePermissao(modulo.key, p, false));
    } else {
      modulo.permissoes.forEach(p => onTogglePermissao(modulo.key, p, true));
    }
  };

  return (
    <div className={`rounded-lg border transition-all ${ativo ? "border-border/80 bg-muted/30" : "border-border/40 bg-muted/10 opacity-60"}`}>
      {/* Cabeçalho do módulo */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={() => onToggleModulo(modulo.key)}
          className={`flex items-center gap-2 flex-1 min-w-0`}
        >
          <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-all
 ${ativo ? modulo.color + " border" : "border-border bg-muted"}`}>
            {ativo && <CheckCircle size={10} />}
          </div>
          <span className={`text-xs font-semibold truncate ${ativo ? "text-foreground" : "text-muted-foreground"}`}>
            {modulo.label}
          </span>
          {ativo && (
            <span className="text-[10px] text-muted-foreground ml-1 flex-shrink-0">
              {permissoesSelecionadas.length}/{modulo.permissoes.length}
            </span>
          )}
        </button>
        {ativo && (
          <button
            type="button"
            onClick={toggleTodas}
            className="text-[10px] text-primary hover:underline flex-shrink-0 px-1"
          >
            {todasSelecionadas ? "Desmarcar" : "Todas"}
          </button>
        )}
        {ativo && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-0.5 text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        )}
      </div>

      {/* Permissões expandidas */}
      {ativo && expanded && (
        <div className="px-3 pb-3 border-t border-border/40 pt-2 grid grid-cols-2 gap-1">
          {modulo.permissoes.map(perm => {
            const sel = permissoesSelecionadas.includes(perm);
            return (
              <button
                key={perm}
                type="button"
                onClick={() => onTogglePermissao(modulo.key, perm, !sel)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-left text-[11px] transition-all
 ${sel ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted text-muted-foreground hover:text-foreground border border-transparent"}`}
              >
                <div className={`w-3 h-3 rounded-sm border flex-shrink-0 flex items-center justify-center transition-all
 ${sel ? "bg-primary border-primary" : "border-muted-foreground/40"}`}>
                  {sel && <span className="text-white text-[8px] leading-none">✓</span>}
                </div>
                {perm}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { ALL_MODULES };

export default function EmpresaModal({ empresa, onClose, onSave }) {
  const [form, setForm] = useState({
    razao_social: empresa?.razao_social || "",
    nome_fantasia: empresa?.nome_fantasia || "",
    cnpj: empresa?.cnpj || "",
    inscricao_estadual: empresa?.inscricao_estadual || "",
    regime_tributario: empresa?.regime_tributario || "Simples Nacional",
    email: empresa?.email || "",
    telefone: empresa?.telefone || "",
    municipio: empresa?.municipio || "",
    uf: empresa?.uf || "",
    ambiente_nfe: empresa?.ambiente_nfe || "Homologação",
    plano: empresa?.plano || "Profissional",
    status: empresa?.status || "Ativo",
    modulos_ativos: empresa?.modulos_ativos || [],
    // permissoes_modulos: { financeiro: ["Visualizar lançamentos", ...], ... }
    permissoes_modulos: empresa?.permissoes_modulos || {},
  });
  const [saving, setSaving] = useState(false);

  const toggleModulo = (key) => {
    const ativo = form.modulos_ativos.includes(key);
    const mod = ALL_MODULES.find(m => m.key === key);
    setForm(f => ({
      ...f,
      modulos_ativos: ativo
        ? f.modulos_ativos.filter(m => m !== key)
        : [...f.modulos_ativos, key],
      permissoes_modulos: {
        ...f.permissoes_modulos,
        // Ao ativar módulo, seleciona todas as permissões por padrão
        [key]: ativo ? [] : (mod?.permissoes || []),
      }
    }));
  };

  const togglePermissao = (modKey, perm, add) => {
    setForm(f => ({
      ...f,
      permissoes_modulos: {
        ...f.permissoes_modulos,
        [modKey]: add
          ? [...(f.permissoes_modulos[modKey] || []), perm]
          : (f.permissoes_modulos[modKey] || []).filter(p => p !== perm),
      }
    }));
  };

  const toggleAll = () => {
    const allKeys = ALL_MODULES.map(m => m.key);
    const ativandoTodos = form.modulos_ativos.length !== allKeys.length;
    const novasPermissoes = {};
    if (ativandoTodos) {
      ALL_MODULES.forEach(m => { novasPermissoes[m.key] = [...m.permissoes]; });
    }
    setForm(f => ({
      ...f,
      modulos_ativos: ativandoTodos ? allKeys : [],
      permissoes_modulos: ativandoTodos ? novasPermissoes : {},
    }));
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
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Building2 size={18} className="text-primary" />
            {empresa ? "Editar Empresa Cliente" : "Nova Empresa Cliente"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Dados básicos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-muted-foreground mb-1.5">Razão Social *</label>
              <input required value={form.razao_social} onChange={e => setForm(f => ({ ...f, razao_social: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Nome Fantasia</label>
              <input value={form.nome_fantasia} onChange={e => setForm(f => ({ ...f, nome_fantasia: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">CNPJ *</label>
              <input required value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" placeholder="00.000.000/0001-00" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Inscrição Estadual</label>
              <input value={form.inscricao_estadual} onChange={e => setForm(f => ({ ...f, inscricao_estadual: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Regime Tributário</label>
              <select value={form.regime_tributario} onChange={e => setForm(f => ({ ...f, regime_tributario: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                {["Simples Nacional", "Lucro Presumido", "Lucro Real", "MEI"].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">E-mail</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Telefone</label>
              <input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Município</label>
              <input value={form.municipio} onChange={e => setForm(f => ({ ...f, municipio: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">UF</label>
              <input value={form.uf} onChange={e => setForm(f => ({ ...f, uf: e.target.value }))} maxLength={2}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Ambiente NF-e</label>
              <select value={form.ambiente_nfe} onChange={e => setForm(f => ({ ...f, ambiente_nfe: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                <option>Homologação</option>
                <option>Produção</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Plano</label>
              <select value={form.plano} onChange={e => setForm(f => ({ ...f, plano: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                {["Básico", "Profissional", "Enterprise"].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                <option>Ativo</option>
                <option>Inativo</option>
                <option>Suspenso</option>
              </select>
            </div>
          </div>

          {/* Módulos e Permissões */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Módulos & Permissões</label>
                <p className="text-[10px] text-muted-foreground mt-0.5">Ative o módulo e clique em ▾ para configurar permissões específicas</p>
              </div>
              <button type="button" onClick={toggleAll} className="text-xs text-primary hover:underline">
                {form.modulos_ativos.length === ALL_MODULES.length ? "Desmarcar todos" : "Selecionar todos"}
              </button>
            </div>
            <div className="space-y-1.5">
              {ALL_MODULES.map(m => (
                <ModuloPermissoes
                  key={m.key}
                  modulo={m}
                  ativo={form.modulos_ativos.includes(m.key)}
                  permissoesSelecionadas={form.permissoes_modulos[m.key] || []}
                  onToggleModulo={toggleModulo}
                  onTogglePermissao={togglePermissao}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {form.modulos_ativos.length} de {ALL_MODULES.length} módulos ativos
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm bg-muted text-muted-foreground">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm bg-primary text-primary-foreground disabled:opacity-50">
              {saving ? "Salvando..." : empresa ? "Salvar Alterações" : "Criar Empresa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}