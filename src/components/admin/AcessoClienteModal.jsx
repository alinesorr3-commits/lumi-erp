import { useState } from "react";
import { X, ChevronDown, ChevronUp, CheckCircle, Building2, Lock, AlertCircle } from "lucide-react";

const MODULOS_SISTEMA = [
  { key: "financeiro", label: "Financeiro", color: "bg-green-500/10/20 text-green-400 border-green-500/30",
    permissoes: ["Dashboard", "Lançamentos", "Conciliação bancária", "Fluxo de caixa", "Sócios", "Prestadores"] },
  { key: "comercial", label: "Comercial/CRM", color: "bg-primary/10/20 text-blue-400 border-blue-500/30",
    permissoes: ["Clientes", "Pipeline de vendas", "Orçamentos", "Pedidos", "Relatórios"] },
  { key: "fiscal", label: "Fiscal & Tributário", color: "bg-yellow-500/10/20 text-yellow-400 border-yellow-500/30",
    permissoes: ["Dashboard fiscal", "Dívidas", "Certificados", "Tabela NCM", "Simulador", "Motor de encargos"] },
  { key: "rh", label: "Recursos Humanos", color: "bg-primary/10/20 text-blue-400 border-blue-500/30",
    permissoes: ["Colaboradores", "Ponto eletrônico", "Folha de pagamento"] },
  { key: "nfe", label: "Emissão NF-e/NFS-e", color: "bg-red-500/10/20 text-red-400 border-red-500/30",
    permissoes: ["Emissão NF-e", "Cancelamento", "Emissão NFS-e", "Downloads", "Cadastros"] },
  { key: "veiculos", label: "Gestão de Veículos", color: "bg-primary/10/20 text-blue-400 border-blue-500/30",
    permissoes: ["Frota", "Abastecimento", "Manutenção", "Despesas"] },
  { key: "obras", label: "Gestão de Obras", color: "bg-yellow-500/10/20 text-yellow-400 border-yellow-500/30",
    permissoes: ["Projetos", "Materiais", "Mão de obra", "Despesas", "Resultado"] },
  { key: "agronegocio", label: "Agronegócio", color: "bg-green-500/10/20 text-green-400 border-green-500/30",
    permissoes: ["Fazendas", "Safras", "Financiamento", "Despesas", "Receitas"] },
];

function ModuloAcesso({ modulo, ativo, permissoes, onChange }) {
  const [expanded, setExpanded] = useState(ativo);

  const toggleModulo = () => {
    onChange(modulo.key, !ativo, ativo ? [] : [...modulo.permissoes]);
  };

  const toggleTodas = (e) => {
    e.stopPropagation();
    const todasSelecionadas = modulo.permissoes.every(p => permissoes.includes(p));
    onChange(modulo.key, ativo, todasSelecionadas ? [] : [...modulo.permissoes]);
  };

  const togglePermissao = (perm) => {
    const novasPerms = permissoes.includes(perm)
      ? permissoes.filter(p => p !== perm)
      : [...permissoes, perm];
    onChange(modulo.key, novasPerms.length > 0 ? true : ativo, novasPerms);
  };

  const todasSelecionadas = modulo.permissoes.every(p => permissoes.includes(p));

  return (
    <div className={`rounded-xl border transition-all ${ativo ? "border-border/80 bg-muted/30" : "border-border/40 bg-muted/5"}`}>
      <button
        type="button"
        onClick={toggleModulo}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors"
      >
        <div className={`w-5 h-5 rounded-lg flex items-center justify-center border-2 flex-shrink-0 transition-all
 ${ativo ? modulo.color + " border" : "border-border bg-muted"}`}>
          {ativo && <CheckCircle size={14} />}
        </div>
        <span className={`text-sm font-semibold flex-1 text-left ${ativo ? "text-foreground" : "text-muted-foreground"}`}>
          {modulo.label}
        </span>
        {ativo && (
          <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded-md">
            {permissoes.length}/{modulo.permissoes.length}
          </span>
        )}
        {ativo && (
          <div className="flex-shrink-0 p-1 text-muted-foreground">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        )}
      </button>

      {ativo && expanded && (
        <div className="px-4 pb-4 border-t border-border/40 pt-3 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Funcionalidades permitidas</span>
            <button
              type="button"
              onClick={toggleTodas}
              className="text-xs text-primary hover:underline"
            >
              {todasSelecionadas ? "Desmarcar tudo" : "Marcar tudo"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {modulo.permissoes.map(perm => {
              const sel = permissoes.includes(perm);
              return (
                <button
                  key={perm}
                  type="button"
                  onClick={() => togglePermissao(perm)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs font-medium transition-all border
 ${sel 
 ? "bg-primary/15 text-primary border-primary/30" 
 : "bg-background text-muted-foreground hover:text-foreground border-border hover:border-border/60"}`}
                >
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 transition-all
 ${sel ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>
                    {sel && <span className="text-white text-[10px] leading-none font-bold">✓</span>}
                  </div>
                  {perm}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AcessoClienteModal({ empresa, onClose, onSave }) {
  const [form, setForm] = useState({
    empresa_id: empresa?.id || "",
    empresa_nome: empresa?.razao_social || "",
    modulos_acessiveis: empresa?.modulos_acessiveis || {},
  });
  const [saving, setSaving] = useState(false);

  const handleChangeAcesso = (modKey, ativo, perms) => {
    setForm(f => ({
      ...f,
      modulos_acessiveis: {
        ...f.modulos_acessiveis,
        [modKey]: ativo ? perms : [],
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      modulos_acessiveis: form.modulos_acessiveis,
    });
    setSaving(false);
  };

  const modulosAtivos = Object.values(form.modulos_acessiveis).filter(arr => arr.length > 0).length;
  const totalPermissoes = Object.values(form.modulos_acessiveis).reduce((s, arr) => s + arr.length, 0);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Building2 size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Controle de Acesso</h2>
              <p className="text-xs text-muted-foreground">{form.empresa_nome || "Cliente"}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Resumo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/40 rounded-lg px-4 py-3">
              <p className="text-[10px] text-muted-foreground uppercase font-semibold">Módulos ativos</p>
              <p className="text-2xl font-bold text-foreground mt-1">{modulosAtivos}/{MODULOS_SISTEMA.length}</p>
            </div>
            <div className="bg-muted/40 rounded-lg px-4 py-3">
              <p className="text-[10px] text-muted-foreground uppercase font-semibold">Funcionalidades</p>
              <p className="text-2xl font-bold text-primary mt-1">{totalPermissoes}</p>
            </div>
          </div>

          {/* Aviso */}
          <div className="bg-primary/10/10 border border-blue-500/20 rounded-lg px-4 py-3 flex items-start gap-3">
            <AlertCircle size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-300">
              <p className="font-medium text-blue-400 mb-0.5">Restrição de acesso ativa</p>
              <p>Selecione quais módulos e funcionalidades este cliente pode acessar. As mudanças refletem imediatamente.</p>
            </div>
          </div>

          {/* Módulos */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">
              Módulos e Funcionalidades Permitidas
            </label>
            <div className="space-y-2">
              {MODULOS_SISTEMA.map(m => (
                <ModuloAcesso
                  key={m.key}
                  modulo={m}
                  ativo={(form.modulos_acessiveis[m.key] || []).length > 0}
                  permissoes={form.modulos_acessiveis[m.key] || []}
                  onChange={handleChangeAcesso}
                />
              ))}
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm bg-muted text-muted-foreground hover:bg-muted/80 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg text-sm bg-primary text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors font-medium"
            >
              {saving ? "Salvando..." : "Salvar Acesso"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}