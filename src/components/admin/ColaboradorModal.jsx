import { useState } from "react";
import { X, Users, Lock, Mail, Briefcase, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";

const MODULOS_COMPLETOS = [
  { key: "financeiro", label: "Financeiro", color: "bg-green-500/10/20 text-green-400 border-green-500/30",
    permissoes: ["Visualizar lançamentos", "Criar lançamentos", "Editar lançamentos", "Excluir lançamentos", "Conciliação bancária", "Fluxo de caixa", "Sócios", "Prestadores de serviço"] },
  { key: "comercial", label: "Comercial", color: "bg-primary/10/20 text-blue-400 border-blue-500/30",
    permissoes: ["Visualizar clientes", "Criar/editar clientes", "Excluir clientes", "Pipeline de vendas", "Orçamentos e pedidos", "Notas fiscais comerciais", "Relatórios comerciais"] },
  { key: "fiscal", label: "Fiscal & Tributário", color: "bg-yellow-500/10/20 text-yellow-400 border-yellow-500/30",
    permissoes: ["Dashboard fiscal", "Dívidas e parcelamentos", "Certificados digitais", "Tabela NCM", "Calculadora ICMS", "Simulador tributário", "Motor de encargos", "Configuração tributária"] },
  { key: "rh", label: "Recursos Humanos", color: "bg-primary/10/20 text-blue-400 border-blue-500/30",
    permissoes: ["Visualizar colaboradores", "Criar/editar colaboradores", "Excluir colaboradores", "Ponto eletrônico", "Folha de pagamento"] },
  { key: "nfe", label: "Emissão NF-e/NFS-e", color: "bg-red-500/10/20 text-red-400 border-red-500/30",
    permissoes: ["Dashboard NF-e", "Emitir NF-e", "Cancelar NF-e", "Emitir NFS-e", "Cancelar NFS-e", "Download XML", "Download DANFE", "Cadastros fiscais"] },
  { key: "veiculos", label: "Gestão de Veículos", color: "bg-primary/10/20 text-blue-400 border-blue-500/30",
    permissoes: ["Dashboard", "Frota", "Abastecimento", "Manutenção", "Despesas"] },
  { key: "obras", label: "Gestão de Obras", color: "bg-yellow-500/10/20 text-yellow-400 border-yellow-500/30",
    permissoes: ["Dashboard", "Projetos", "Materiais", "Mão de obra", "Despesas", "Resultado"] },
  { key: "agronegocio", label: "Agronegócio", color: "bg-green-500/10/20 text-green-400 border-green-500/30",
    permissoes: ["Dashboard", "Fazendas", "Safras", "Financiamento", "Despesas", "Receitas"] },
];

function ModuloPermissoesList({ modulo, permissoes, onChange }) {
  const [expanded, setExpanded] = useState(false);
  const todasSelecionadas = modulo.permissoes.every(p => permissoes.includes(p));

  const toggleTodas = (e) => {
    e.stopPropagation();
    if (todasSelecionadas) {
      onChange(modulo.key, []);
    } else {
      onChange(modulo.key, [...modulo.permissoes]);
    }
  };

  const togglePermissao = (perm) => {
    if (permissoes.includes(perm)) {
      onChange(modulo.key, permissoes.filter(p => p !== perm));
    } else {
      onChange(modulo.key, [...permissoes, perm]);
    }
  };

  return (
    <div className={`rounded-lg border transition-all ${permissoes.length > 0 ? "border-border/80 bg-muted/30" : "border-border/40 bg-muted/10"}`}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-muted/20 transition-colors"
      >
        <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-all
 ${permissoes.length > 0 ? modulo.color + " border" : "border-border bg-muted"}`}>
          {permissoes.length > 0 && <CheckCircle size={10} />}
        </div>
        <span className={`text-xs font-semibold truncate ${permissoes.length > 0 ? "text-foreground" : "text-muted-foreground"}`}>
          {modulo.label}
        </span>
        {permissoes.length > 0 && (
          <span className="text-[10px] text-muted-foreground ml-auto flex-shrink-0">
            {permissoes.length}/{modulo.permissoes.length}
          </span>
        )}
        {permissoes.length > 0 && (
          <button
            type="button"
            onClick={toggleTodas}
            className="text-[10px] text-primary hover:underline flex-shrink-0 px-1 ml-1"
          >
            {todasSelecionadas ? "Desmarcar" : "Todas"}
          </button>
        )}
        {permissoes.length > 0 && (
          <div className="flex-shrink-0 p-0.5 text-muted-foreground">
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </div>
        )}
      </button>

      {permissoes.length > 0 && expanded && (
        <div className="px-4 pb-3 border-t border-border/40 pt-3 grid grid-cols-2 gap-1">
          {modulo.permissoes.map(perm => {
            const sel = permissoes.includes(perm);
            return (
              <button
                key={perm}
                type="button"
                onClick={() => togglePermissao(perm)}
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

export default function ColaboradorModal({ colaborador, onClose, onSave }) {
  const [form, setForm] = useState({
    nome: colaborador?.nome || "",
    email: colaborador?.email || "",
    cargo: colaborador?.cargo || "",
    departamento: colaborador?.departamento || "",
    status: colaborador?.status || "ativo",
    permissoes_modulos: colaborador?.permissoes_modulos || {},
  });
  const [saving, setSaving] = useState(false);

  const handleChangePermissoes = (modKey, perms) => {
    setForm(f => ({
      ...f,
      permissoes_modulos: {
        ...f.permissoes_modulos,
        [modKey]: perms,
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome || !form.email) {
      alert("Nome e e-mail são obrigatórios");
      return;
    }
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const totalPermissoes = Object.values(form.permissoes_modulos).reduce((s, arr) => s + (arr?.length || 0), 0);
  const modulosAtivos = Object.values(form.permissoes_modulos).filter(arr => arr.length > 0).length;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Users size={18} className="text-primary" />
            {colaborador ? "Editar Colaborador" : "Cadastrar Colaborador"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Dados Pessoais */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Informações Básicas</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="João Silva"
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">E-mail *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="joao@empresa.com"
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Cargo</label>
                <input
                  type="text"
                  value={form.cargo}
                  onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))}
                  placeholder="Ex: Gerente Financeiro"
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Departamento</label>
                <input
                  type="text"
                  value={form.departamento}
                  onChange={e => setForm(f => ({ ...f, departamento: e.target.value }))}
                  placeholder="Ex: Financeiro"
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-muted-foreground mb-1.5">Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                  <option value="ferias">Férias</option>
                  <option value="afastado">Afastado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Permissões por Módulo */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Permissões por Módulo</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Selecione quais funcionalidades este colaborador pode acessar</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-primary/10 text-primary rounded-full font-medium">{modulosAtivos}/{MODULOS_COMPLETOS.length} módulos</span>
              </div>
            </div>

            <div className="space-y-1.5">
              {MODULOS_COMPLETOS.map(m => (
                <ModuloPermissoesList
                  key={m.key}
                  modulo={m}
                  permissoes={form.permissoes_modulos[m.key] || []}
                  onChange={handleChangePermissoes}
                />
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 flex items-start gap-3">
            <Lock size={16} className="text-primary flex-shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-0.5">Restrição de acesso ativa</p>
              <p>Este colaborador poderá acessar apenas os módulos e funcionalidades selecionadas. Mudanças entram em vigor imediatamente.</p>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm bg-muted text-muted-foreground">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm bg-primary text-primary-foreground disabled:opacity-50">
              {saving ? "Salvando..." : colaborador ? "Atualizar" : "Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}