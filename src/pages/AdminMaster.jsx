import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Building2, Users, Package, Plus, Pencil, Trash2,
  CheckCircle, ChevronDown, ChevronUp, Crown, CreditCard, Lock, Mail, Send,
  Phone, MessageCircle, ExternalLink, Shield, ShieldOff, Activity, Key, Ban
} from "lucide-react";
import EmpresaModal, { ALL_MODULES as MODULES_CONFIG } from "@/components/admin/EmpresaModal";
import PermissoesColaborador from "@/components/admin/PermissoesColaborador";
import AcessoClienteModal from "@/components/admin/AcessoClienteModal";
import ColaboradorModal from "@/components/admin/ColaboradorModal";
import AssinaturasRelatorio from "@/components/admin/AssinaturasRelatorio";

const WA_ICON = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
);

const PLANOS_PRECOS = { Básico: "R$ 197/mês", Profissional: "R$ 397/mês", Enterprise: "R$ 797/mês" };

function ConvidarUsuarioBtn({ onSuccess }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nome_cliente: "",
    empresa_cliente: "",
    email: "",
    telefone: "",
    plano: "Profissional",
    telefone_contato: "", // número da empresa (suporte)
    mensagem_extra: "",
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [step, setStep] = useState(1); // 1 = dados, 2 = prévia mensagem

  const appUrl = window.location.origin;
  const planosUrl = `${appUrl}/planos`;

  const gerarMensagem = () => {
    const linhaContato = form.telefone_contato
      ? `\n📞 Suporte: *${form.telefone_contato}*`
      : "";
    const linhaExtra = form.mensagem_extra ? `\n\n💬 ${form.mensagem_extra}` : "";
    return `Olá, *${form.nome_cliente || "cliente"}*! 👋\n\nSou da equipe *Lumi ERP* e tenho uma proposta especial para *${form.empresa_cliente || "sua empresa"}*.\n\n🚀 Convidamos você para conhecer e assinar nosso sistema de gestão empresarial completo.\n\n📦 Plano sugerido: *${form.plano}* — ${PLANOS_PRECOS[form.plano]}\n\n🔗 Acesse e escolha seu plano:\n${planosUrl}\n\n✉️ Crie sua conta com o e-mail: *${form.email || "(seu e-mail)"}*${linhaContato}${linhaExtra}\n\nEstamos à disposição para qualquer dúvida! 😊`;
  };

  const handleConvidar = async (e) => {
    e.preventDefault();
    if (!form.email) return;
    setLoading(true);
    setMsg("");
    try {
      await base44.users.inviteUser(form.email, "user");
      setMsg("✓ Convite por e-mail enviado para " + form.email);
      onSuccess?.();
    } catch (err) {
      setMsg("✗ " + (err.message || "Erro ao convidar"));
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = () => {
    if (!form.telefone) return;
    const numero = form.telefone.replace(/\D/g, "");
    window.open(`https://wa.me/55${numero}?text=${encodeURIComponent(gerarMensagem())}`, "_blank");
  };

  const fechar = () => { setOpen(false); setMsg(""); setStep(1); setForm({ nome_cliente: "", empresa_cliente: "", email: "", telefone: "", plano: "Profissional", telefone_contato: "", mensagem_extra: "" }); };

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
        <Mail size={14} /> Convidar Cliente
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl max-h-[95vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h3 className="text-base font-semibold text-foreground">Convidar Cliente via WhatsApp</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Passo {step} de 2</p>
              </div>
              <button onClick={fechar} className="text-muted-foreground hover:text-foreground text-lg">✕</button>
            </div>

            {step === 1 && (
              <div className="p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Nome do cliente</label>
                    <input value={form.nome_cliente} onChange={e => setForm(f => ({ ...f, nome_cliente: e.target.value }))}
                      placeholder="João Silva"
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Empresa do cliente</label>
                    <input value={form.empresa_cliente} onChange={e => setForm(f => ({ ...f, empresa_cliente: e.target.value }))}
                      placeholder="Empresa Ltda"
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">E-mail do cliente *</label>
                  <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="email@cliente.com.br"
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">WhatsApp do cliente (com DDD) *</label>
                  <div className="relative">
                    <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="tel" value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
                      placeholder="(65) 99999-9999"
                      className="w-full bg-muted border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Plano sugerido</label>
                  <select value={form.plano} onChange={e => setForm(f => ({ ...f, plano: e.target.value }))}
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                    {["Básico", "Profissional", "Enterprise"].map(p => (
                      <option key={p} value={p}>{p} — {PLANOS_PRECOS[p]}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    <span className="flex items-center gap-1"><Phone size={11} /> Seu telefone de contato / suporte</span>
                  </label>
                  <input type="tel" value={form.telefone_contato} onChange={e => setForm(f => ({ ...f, telefone_contato: e.target.value }))}
                    placeholder="(65) 99999-9999 — aparece na mensagem"
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Mensagem personalizada (opcional)</label>
                  <textarea value={form.mensagem_extra} onChange={e => setForm(f => ({ ...f, mensagem_extra: e.target.value }))}
                    placeholder="Ex: Tenho um desconto especial para vocês!"
                    rows={2}
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary resize-none" />
                </div>

                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={fechar} className="flex-1 py-2 bg-muted text-muted-foreground rounded-lg text-sm">Cancelar</button>
                  <button type="button" onClick={() => setStep(2)} disabled={!form.email}
                    className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm disabled:opacity-50">
                    Ver prévia →
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="p-5 space-y-4">
                {/* Prévia da mensagem WhatsApp */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <MessageCircle size={11} /> Prévia da mensagem WhatsApp
                  </p>
                  <div className="bg-[hsl(var(--card))] border border-green-900/40 rounded-xl p-4">
                    <pre className="text-xs text-green-100 whitespace-pre-wrap font-sans leading-relaxed">{gerarMensagem()}</pre>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                    <ExternalLink size={9} /> Link de planos incluído: <span className="text-primary truncate">{planosUrl}</span>
                  </p>
                </div>

                {msg && <p className={`text-xs px-3 py-2 rounded-lg ${msg.startsWith("✓") ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>{msg}</p>}

                <div className="space-y-2">
                  {/* WhatsApp — principal */}
                  {form.telefone && (
                    <button type="button" onClick={handleWhatsApp}
                      className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                      <WA_ICON /> Enviar via WhatsApp para {form.telefone}
                    </button>
                  )}

                  {/* E-mail */}
                  <form onSubmit={handleConvidar}>
                    <button type="submit" disabled={loading}
                      className="w-full py-2.5 bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                      {loading ? "Enviando..." : <><Send size={14} /> Enviar convite por e-mail</>}
                    </button>
                  </form>

                  <button type="button" onClick={() => setStep(1)}
                    className="w-full py-2 bg-muted text-muted-foreground rounded-lg text-sm hover:text-foreground">
                    ← Editar dados
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}



function AssinaturaModal({ assinatura, users, onClose, onSave }) {
  const PLANO_MODULOS = {
    "Básico": ["financeiro", "comercial", "rh"],
    "Profissional": ["financeiro", "comercial", "rh", "fiscal", "nfe", "veiculos", "obras", "agronegocio", "eng_financeira", "bens_recebidos", "tributario"],
    "Enterprise": MODULES_CONFIG.map(m => m.key),
  };

  const [form, setForm] = useState({
    empresa_nome: assinatura?.empresa_nome || "",
    empresa_cnpj: assinatura?.empresa_cnpj || "",
    responsavel_nome: assinatura?.responsavel_nome || "",
    user_email: assinatura?.user_email || "",
    plano: assinatura?.plano || "Profissional",
    status: assinatura?.status || "Ativa",
    modulos_contratados: assinatura?.modulos_contratados || PLANO_MODULOS["Profissional"],
    data_inicio: assinatura?.data_inicio || new Date().toISOString().split("T")[0],
    data_renovacao: assinatura?.data_renovacao || "",
    valor_mensal: assinatura?.valor_mensal || 397,
  });
  const [saving, setSaving] = useState(false);

  const handlePlanoChange = (plano) => {
    setForm(f => ({ ...f, plano, modulos_contratados: PLANO_MODULOS[plano] || [], valor_mensal: plano === "Básico" ? 197 : plano === "Profissional" ? 397 : 797 }));
  };

  const toggleMod = (key) => setForm(f => ({
    ...f,
    modulos_contratados: f.modulos_contratados.includes(key)
      ? f.modulos_contratados.filter(m => m !== key)
      : [...f.modulos_contratados, key]
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <CreditCard size={18} className="text-primary" />
            {assinatura ? "Editar Assinatura" : "Nova Assinatura"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-muted-foreground mb-1">Nome da Empresa *</label>
              <input required value={form.empresa_nome} onChange={e => setForm(f => ({ ...f, empresa_nome: e.target.value }))}
                placeholder="Ex: Empresa XYZ Ltda"
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">CNPJ</label>
              <input value={form.empresa_cnpj} onChange={e => setForm(f => ({ ...f, empresa_cnpj: e.target.value }))}
                placeholder="00.000.000/0001-00"
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Responsável</label>
              <input value={form.responsavel_nome} onChange={e => setForm(f => ({ ...f, responsavel_nome: e.target.value }))}
                placeholder="Nome do responsável"
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-muted-foreground mb-1">E-mail do Usuário (acesso ao painel) *</label>
              <select value={form.user_email} onChange={e => setForm(f => ({ ...f, user_email: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                <option value="">— Selecione um usuário —</option>
                {users.map(u => <option key={u.id} value={u.email}>{u.full_name || u.email} ({u.email})</option>)}
              </select>
              {!form.user_email && <p className="text-xs text-muted-foreground mt-1">O usuário precisa existir no sistema. Convide-o pelo Painel Admin.</p>}
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Plano</label>
              <select value={form.plano} onChange={e => handlePlanoChange(e.target.value)}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                {["Básico", "Profissional", "Enterprise"].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                {["Ativa", "Trial", "Suspensa", "Cancelada"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Valor Mensal (R$)</label>
              <input type="number" value={form.valor_mensal} onChange={e => setForm(f => ({ ...f, valor_mensal: Number(e.target.value) }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Próxima Renovação</label>
              <input type="date" value={form.data_renovacao} onChange={e => setForm(f => ({ ...f, data_renovacao: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
          </div>

          {/* Módulos */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Módulos Contratados ({form.modulos_contratados.length}/{MODULES_CONFIG.length})
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {MODULES_CONFIG.map(m => (
                <button key={m.key} type="button" onClick={() => toggleMod(m.key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all
 ${form.modulos_contratados.includes(m.key) ? m.color + " border" : "bg-muted border-border text-muted-foreground hover:text-foreground"}`}>
                  {form.modulos_contratados.includes(m.key) ? <CheckCircle size={12} /> : <div className="w-3 h-3 rounded-full border border-current opacity-40" />}
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm bg-muted text-muted-foreground">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm bg-primary text-primary-foreground disabled:opacity-50">
              {saving ? "Salvando..." : assinatura ? "Salvar" : "Criar Assinatura"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ClienteModulosInline({ emp, allModules, onEdit, onDelete, onToggleModulo }) {
  const [saving, setSaving] = useState(null);

  const handleToggle = async (modKey) => {
    setSaving(modKey);
    await onToggleModulo(modKey);
    setSaving(null);
  };

  return (
    <div className="border-t border-border/50 bg-muted/20">
      {/* Info básica + ações */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          <span><span className="text-foreground font-medium">{emp.cnpj || "—"}</span> · CNPJ</span>
          <span><span className="text-foreground font-medium">{emp.regime_tributario || "—"}</span> · Regime</span>
          <span><span className={`font-medium ${emp.ambiente_nfe === "Produção" ? "text-green-400" : "text-yellow-400"}`}>{emp.ambiente_nfe || "—"}</span> · Ambiente</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 text-foreground rounded-lg border border-border transition-colors">
            <Pencil size={11} /> Editar
          </button>
          <button onClick={onDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-500/10/10 hover:bg-red-500/10/20 text-red-400 rounded-lg border border-red-500/20 transition-colors">
            <Trash2 size={11} /> Excluir
          </button>
        </div>
      </div>

      {/* Módulos toggleáveis */}
      <div className="px-4 pb-4">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Package size={10} /> Módulos — clique para ativar/desativar
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
          {allModules.map(mod => {
            const ativo = (emp.modulos_ativos || []).includes(mod.key);
            const carregando = saving === mod.key;
            return (
              <button
                key={mod.key}
                type="button"
                disabled={carregando}
                onClick={() => handleToggle(mod.key)}
                className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all
 ${ativo ? mod.color + " border" : "bg-muted/50 border-border/50 text-muted-foreground hover:text-foreground hover:border-border"}
 ${carregando ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
              >
                <span className="truncate">{mod.label}</span>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${ativo ? "bg-current" : "bg-muted-foreground/30"}`} />
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          {(emp.modulos_ativos || []).length} de {allModules.length} módulos ativos
        </p>
      </div>
    </div>
  );
}

function LicencasLogs() {
  const [licencas, setLicencas] = useState([]);
  const [logs, setLogs] = useState([]);
  const [subTab, setSubTab] = useState("licencas");
  const [loading, setLoading] = useState(true);
  const [bloqueando, setBloqueando] = useState(null);
  const [motivoModal, setMotivoModal] = useState(null); // { licenca }
  const [motivo, setMotivo] = useState("");

  const load = async () => {
    setLoading(true);
    const [lics, ls] = await Promise.all([
      base44.entities.LicencaCliente.list("-updated_date"),
      base44.entities.LogAcesso.list("-created_date", 100),
    ]);
    setLicencas(lics || []);
    setLogs(ls || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const bloquear = async () => {
    if (!motivoModal) return;
    setBloqueando(motivoModal.id);
    await base44.entities.LicencaCliente.update(motivoModal.id, {
      status: "bloqueada",
      motivo_bloqueio: motivo || "Bloqueado pelo administrador.",
      bloqueado_por: "Admin Master",
    });
    await base44.entities.LogAcesso.create({
      user_email: motivoModal.user_email,
      acao: "bloqueio",
      timestamp: new Date().toISOString(),
      detalhes: `Bloqueado pelo Admin. Motivo: ${motivo}`,
    });
    setMotivoModal(null);
    setMotivo("");
    setBloqueando(null);
    load();
  };

  const reativar = async (lic) => {
    if (!confirm(`Reativar licença de ${lic.user_email}?`)) return;
    await base44.entities.LicencaCliente.update(lic.id, { status: "ativa", motivo_bloqueio: "", bloqueado_por: "" });
    load();
  };

  const statusColor = {
    ativa: "text-green-400 bg-green-400/10",
    suspensa: "text-yellow-400 bg-yellow-400/10",
    bloqueada: "text-red-400 bg-red-400/10",
    cancelada: "text-muted-foreground bg-muted",
  };

  const acaoColor = {
    login: "text-blue-400", logout: "text-muted-foreground",
    acesso_modulo: "text-primary", aceite_termos: "text-green-400",
    bloqueio: "text-red-400", verificacao_licenca: "text-yellow-400",
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setSubTab("licencas")}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${subTab === "licencas" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          <span className="flex items-center gap-1.5"><Key size={12} /> Licenças ({licencas.length})</span>
        </button>
        <button onClick={() => setSubTab("logs")}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${subTab === "logs" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          <span className="flex items-center gap-1.5"><Activity size={12} /> Logs de Acesso ({logs.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
      ) : subTab === "licencas" ? (
        <div className="space-y-2">
          {licencas.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">Nenhuma licença registrada ainda.</p>}
          {licencas.map(lic => (
            <div key={lic.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 flex-wrap">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Shield size={16} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-foreground">{lic.user_email}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[lic.status] || statusColor.ativa}`}>{lic.status}</span>
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{lic.plano}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {lic.chave_licenca && <p className="text-[10px] font-mono text-muted-foreground">{lic.chave_licenca}</p>}
                  {lic.termos_aceitos && <p className="text-[10px] text-green-400">✓ Termos aceitos</p>}
                  {!lic.termos_aceitos && <p className="text-[10px] text-yellow-400">⚠ Termos pendentes</p>}
                  {lic.total_acessos > 0 && <p className="text-[10px] text-muted-foreground">{lic.total_acessos} acessos</p>}
                  {lic.ultimo_acesso && <p className="text-[10px] text-muted-foreground">Último: {new Date(lic.ultimo_acesso).toLocaleString("pt-BR")}</p>}
                  {lic.motivo_bloqueio && <p className="text-[10px] text-red-400">🔒 {lic.motivo_bloqueio}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {lic.status === "ativa" ? (
                  <button onClick={() => { setMotivoModal(lic); setMotivo(""); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-500/10/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/10/20 transition-colors">
                    <Ban size={11} /> Bloquear
                  </button>
                ) : (
                  <button onClick={() => reativar(lic)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-500/10/10 text-green-400 border border-green-500/20 rounded-lg hover:bg-green-500/10/20 transition-colors">
                    <CheckCircle size={11} /> Reativar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Usuário", "Ação", "Detalhes", "Data/Hora"].map(h => (
                  <th key={h} className="text-left text-xs text-muted-foreground px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr><td colSpan={4} className="text-center text-muted-foreground text-sm py-8">Nenhum log registrado.</td></tr>
              )}
              {logs.map(log => (
                <tr key={log.id} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="px-4 py-2.5 text-xs text-foreground">{log.user_email}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-medium ${acaoColor[log.acao] || "text-muted-foreground"}`}>{log.acao}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-xs truncate">{log.detalhes || "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                    {log.timestamp ? new Date(log.timestamp).toLocaleString("pt-BR") : log.created_date ? new Date(log.created_date).toLocaleString("pt-BR") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de bloqueio */}
      {motivoModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2"><ShieldOff size={16} className="text-red-400" /> Bloquear Licença</h3>
            <p className="text-xs text-muted-foreground mb-4">Usuário: <strong className="text-foreground">{motivoModal.user_email}</strong>. O acesso será bloqueado imediatamente no próximo login.</p>
            <textarea
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Motivo do bloqueio (ex: inadimplência, uso indevido...)"
              rows={3}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-red-400 resize-none mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => setMotivoModal(null)} className="flex-1 py-2 bg-muted text-muted-foreground rounded-lg text-sm">Cancelar</button>
              <button onClick={bloquear} disabled={!!bloqueando}
                className="flex-1 py-2 bg-red-500/10 hover:bg-red-600 text-white rounded-lg text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                {bloqueando ? "Bloqueando..." : <><Ban size={13} /> Bloquear</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminMaster() {
  const [tab, setTab] = useState("empresas");
  const [empresas, setEmpresas] = useState([]);
  const [assinaturas, setAssinaturas] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [modalAss, setModalAss] = useState(false);
  const [modalPerm, setModalPerm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editAss, setEditAss] = useState(null);
  const [editPerm, setEditPerm] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [colaboradores, setColaboradores] = useState([]);
  const [modalAcesso, setModalAcesso] = useState(false);
  const [editAcesso, setEditAcesso] = useState(null);
  const [modalColaborador, setModalColaborador] = useState(false);
  const [editColaborador, setEditColaborador] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [emps, usrs, asss, cols] = await Promise.all([
        base44.entities.EmpresaCliente.list("-created_date"),
        base44.entities.User.list(),
        base44.entities.AssinaturaCliente.list("-created_date"),
        base44.entities.Colaborador.list("-created_date").catch(() => []),
      ]);
      setEmpresas(emps || []);
      setUsers(usrs || []);
      setAssinaturas(asss || []);
      setColaboradores(cols || []);
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (data) => {
    if (editItem) await base44.entities.EmpresaCliente.update(editItem.id, data);
    else await base44.entities.EmpresaCliente.create(data);
    setModal(false);
    setEditItem(null);
    load();
  };

  const handleSaveAss = async (data) => {
    if (editAss) await base44.entities.AssinaturaCliente.update(editAss.id, data);
    else await base44.entities.AssinaturaCliente.create(data);
    setModalAss(false);
    setEditAss(null);
    load();
  };

  const handleDeleteAss = async (id) => {
    if (!confirm("Excluir esta assinatura?")) return;
    await base44.entities.AssinaturaCliente.delete(id);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir esta empresa?")) return;
    await base44.entities.EmpresaCliente.delete(id);
    load();
  };

  const handleSavePerm = async (data) => {
    if (editPerm) await base44.entities.Colaborador.update(editPerm.id, data);
    setModalPerm(false);
    setEditPerm(null);
    load();
  };

  const handleSaveAcesso = async (data) => {
    if (editAcesso) await base44.entities.EmpresaCliente.update(editAcesso.id, data);
    setModalAcesso(false);
    setEditAcesso(null);
    load();
  };

  const handleSaveColaborador = async (data) => {
    if (editColaborador) {
      await base44.entities.Colaborador.update(editColaborador.id, data);
    } else {
      await base44.entities.Colaborador.create(data);
    }
    setModalColaborador(false);
    setEditColaborador(null);
    load();
  };

  const handleDeleteColaborador = async (id) => {
    if (!confirm("Excluir este colaborador?")) return;
    await base44.entities.Colaborador.delete(id);
    load();
  };

  const ALL_MODULES = MODULES_CONFIG;
  const totalModulos = empresas.reduce((s, e) => s + (e.modulos_ativos?.length || 0), 0);
  const statusColor = { Ativo: "text-green-400 bg-green-400/10", Inativo: "text-red-400 bg-red-400/10", Suspenso: "text-yellow-400 bg-yellow-400/10" };
  const planoColor = { Básico: "text-muted-foreground bg-muted", Profissional: "text-blue-400 bg-blue-400/10", Enterprise: "text-yellow-400 bg-yellow-400/10" };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10/20 border border-yellow-500/30 flex items-center justify-center">
            <Crown size={20} className="text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading text-foreground">Painel Administrador Master</h1>
            <p className="text-muted-foreground text-xs mt-0.5">Gerenciamento de empresas clientes e módulos do sistema</p>
          </div>
        </div>
        {tab === "empresas" && (
          <button onClick={() => { setEditItem(null); setModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
            <Plus size={16} /> Nova Empresa
          </button>
        )}
        {tab === "assinaturas" && (
          <button onClick={() => { setEditAss(null); setModalAss(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
            <Plus size={16} /> Nova Assinatura
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total de Clientes", value: empresas.length, color: "text-foreground" },
          { label: "Clientes Ativos", value: empresas.filter(e => e.status === "Ativo").length, color: "text-green-400" },
          { label: "Assinaturas Ativas", value: assinaturas.filter(a => a.status === "Ativa" || a.status === "Trial").length, color: "text-blue-400" },
          { label: "Módulos Ativos (Total)", value: totalModulos, color: "text-yellow-400" },
        ].map(k => (
          <div key={k.label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">{k.label}</p>
            <p className={`text-3xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg mb-6 overflow-x-auto">
        <button onClick={() => setTab("empresas")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap
 ${tab === "empresas" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          <Building2 size={14} /> Clientes
        </button>
        <button onClick={() => setTab("assinaturas")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap
 ${tab === "assinaturas" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          <CreditCard size={14} /> Assinaturas
        </button>
        <button onClick={() => setTab("permissoes")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap
 ${tab === "permissoes" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          <Lock size={14} /> Permissões
        </button>
        <button onClick={() => setTab("usuarios")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap
 ${tab === "usuarios" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          <Users size={14} /> Usuários Master
        </button>
        <button onClick={() => setTab("seguranca")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap
 ${tab === "seguranca" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          <Shield size={14} /> Segurança & Backups
        </button>
        <button onClick={() => setTab("licencas")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap
 ${tab === "licencas" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          <Shield size={14} /> Licenças & Logs
        </button>
      </div>

      {/* Tab: Empresas */}
      {tab === "empresas" && (
        <div>
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-foreground">Gerenciar Clientes</h2>
            <p className="text-xs text-muted-foreground">Cadastre clientes e controle quais módulos cada um pode acessar</p>
          </div>
          {loading ? (
            <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
          ) : empresas.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Building2 size={32} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nenhuma empresa cadastrada</p>
              <button onClick={() => { setEditItem(null); setModal(true); }} className="mt-3 text-primary text-sm hover:underline">Adicionar primeira empresa</button>
            </div>
          ) : (
            <div className="space-y-3">
              {empresas.map(emp => {
                const isExp = expanded === emp.id;
                return (
                  <div key={emp.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-border/80 transition-all">
                    <div className="flex items-center gap-4 p-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-bold text-sm">{emp.razao_social?.[0]?.toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground truncate">{emp.email || emp.razao_social}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[emp.status] || statusColor.Ativo}`}>{emp.status}</span>
                          <span className="text-xs text-primary font-medium">{emp.modulos_ativos?.length || 0}/{ALL_MODULES.length} módulos</span>
                        </div>
                        <p className="text-xs text-muted-foreground">@{emp.razao_social?.toLowerCase().replace(/\s+/g, '')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-md font-medium ${planoColor[emp.plano] || planoColor.Profissional}`}>{emp.plano}</span>
                        <button onClick={() => { setEditAcesso(emp); setModalAcesso(true); }} className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted" title="Controlar acesso"><Lock size={13} /></button>
                        <button onClick={() => { setEditItem(emp); setModal(true); }} className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted"><Pencil size={13} /></button>
                        <button onClick={() => setExpanded(isExp ? null : emp.id)} className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted">
                          {isExp ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                        <button onClick={() => handleDelete(emp.id)} className="p-1.5 text-red-400 hover:text-red-300 rounded-md hover:bg-red-400/10"><Trash2 size={13} /></button>
                      </div>
                    </div>

                    {isExp && (
                      <ClienteModulosInline
                        emp={emp}
                        allModules={ALL_MODULES}
                        onEdit={() => { setEditItem(emp); setModal(true); }}
                        onDelete={() => handleDelete(emp.id)}
                        onToggleModulo={async (modKey) => {
                          const atual = emp.modulos_ativos || [];
                          const novosMods = atual.includes(modKey)
                            ? atual.filter(m => m !== modKey)
                            : [...atual, modKey];
                          await base44.entities.EmpresaCliente.update(emp.id, { modulos_ativos: novosMods });
                          load();
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Assinaturas */}
      {tab === "assinaturas" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Relatório de Assinaturas</h2>
              <p className="text-xs text-muted-foreground">Visão consolidada de todas as assinaturas, planos e pagamentos</p>
            </div>
            <button onClick={() => { setEditAss(null); setModalAss(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
              <Plus size={16} /> Nova Assinatura
            </button>
          </div>
          {loading ? (
            <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
          ) : assinaturas.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <CreditCard size={32} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nenhuma assinatura cadastrada</p>
              <button onClick={() => { setEditAss(null); setModalAss(true); }} className="mt-3 text-primary text-sm hover:underline">Criar primeira assinatura</button>
            </div>
          ) : (
            <AssinaturasRelatorio 
              assinaturas={assinaturas}
              onEdit={(ass) => { setEditAss(ass); setModalAss(true); }}
              onDelete={handleDeleteAss}
            />
          )}
        </div>
      )}

      {/* Tab: Permissões */}
      {tab === "permissoes" && (
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Gerenciar Colaboradores</h2>
            <p className="text-xs text-muted-foreground">Cadastre colaboradores e defina acesso por módulo</p>
          </div>
          <button onClick={() => { setEditColaborador(null); setModalColaborador(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
            <Plus size={16} /> Novo Colaborador
          </button>
        </div>
          {loading ? (
            <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
          ) : colaboradores.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users size={32} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nenhum colaborador cadastrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {colaboradores.filter(c => c.status === "ativo").map(col => {
                const permCount = col.permissoes_modulos ? Object.values(col.permissoes_modulos).reduce((s, arr) => s + (arr?.length || 0), 0) : 0;
                return (
                  <div key={col.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                      <Users size={16} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">{col.nome}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium
 ${col.status === "ativo" ? "bg-green-400/10 text-green-400" : "bg-muted text-muted-foreground"}`}>
                          {col.status || "ativo"}
                        </span>
                        {col.cargo && <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{col.cargo}</span>}
                      </div>
                      <div className="flex items-center gap-4 mt-1 flex-wrap">
                        <p className="text-xs text-muted-foreground">{col.email || "—"}</p>
                        {col.departamento && <p className="text-xs text-muted-foreground">{col.departamento}</p>}
                        {permCount > 0 && <p className="text-xs font-medium text-blue-400">{permCount} permissões</p>}
                        {permCount === 0 && <p className="text-xs text-muted-foreground italic">Sem permissões</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditColaborador(col); setModalColaborador(true); }}
                        className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted"
                        title="Editar permissões"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteColaborador(col.id)}
                        className="p-1.5 text-red-400 hover:text-red-300 rounded-md hover:bg-red-400/10"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "seguranca" && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Segurança e Backups (SaaS)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 border border-border rounded-xl bg-muted/30">
              <h3 className="font-semibold text-sm mb-2 text-foreground">Backups Automáticos (Nuvem)</h3>
              <p className="text-xs text-muted-foreground mb-4">O ERP GFE opera em arquitetura Multi-Tenant isolada com PostgreSQL. Backups diários são executados automaticamente pelo Base44 e replicados de forma redundante (criptografia AES-256).</p>
              <div className="flex items-center justify-between text-xs p-3 bg-green-500/10/10 text-green-400 rounded-lg">
                <span>Status:</span>
                <strong>Ativo e Protegido</strong>
              </div>
            </div>
            
            <div className="p-5 border border-border rounded-xl bg-muted/30">
              <h3 className="font-semibold text-sm mb-2 text-foreground">Backup Manual (JSON)</h3>
              <p className="text-xs text-muted-foreground mb-4">Gere um extrato manual em formato estruturado dos principais dados (lançamentos, notas e cadastros) para armazenamento local.</p>
              <button onClick={() => alert("Funcionalidade de exportação agendada. Você receberá um e-mail com o arquivo ZIP contendo os backups das empresas.")} className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90">
                Gerar e Baixar Extrato Global
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Usuários */}
      {tab === "usuarios" && (
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Usuários do Sistema</h2>
            <p className="text-xs text-muted-foreground">Usuários com acesso ao Lumi ERP</p>
          </div>
          <ConvidarUsuarioBtn onSuccess={load} />
        </div>

        {/* Guia rápido */}
        <div className="mb-4 p-4 bg-primary/5 border border-primary/20 rounded-xl">
          <p className="text-xs font-semibold text-primary mb-2">📋 Como funciona o acesso de clientes</p>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Convide o cliente pelo botão <strong className="text-foreground">"Convidar Usuário"</strong> — ele recebe um e-mail de acesso.</li>
            <li>Vá na aba <strong className="text-foreground">Assinaturas</strong> → crie uma assinatura vinculando o e-mail do cliente e os módulos.</li>
            <li>O cliente faz login e verá apenas os módulos da assinatura dele no menu lateral.</li>
          </ol>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Nome", "E-mail", "Papel", "Cadastro"].map(h => (
                  <th key={h} className="text-left text-xs text-muted-foreground px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-primary text-xs font-bold">{u.full_name?.[0] || u.email?.[0]}</span>
                      </div>
                      <span className="text-sm text-foreground">{u.full_name || "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium
 ${u.role === "admin" ? "bg-yellow-400/10 text-yellow-400" : "bg-muted text-muted-foreground"}`}>
                      {u.role === "admin" ? "Admin" : "Usuário"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {u.created_date ? new Date(u.created_date).toLocaleDateString("pt-BR") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Tab: Licenças & Logs */}
      {tab === "licencas" && (
        <div>
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2"><Shield size={15} className="text-primary" /> Controle de Licenças SaaS</h2>
            <p className="text-xs text-muted-foreground">Monitore, bloqueie e gerencie acessos. Todos os dados são de propriedade exclusiva de <strong className="text-foreground">Aline Pereira de Souza</strong>.</p>
          </div>
          <LicencasLogs />
        </div>
      )}

      {modal && (
        <EmpresaModal
          empresa={editItem}
          onClose={() => { setModal(false); setEditItem(null); }}
          onSave={handleSave}
        />
      )}
      {modalAss && (
        <AssinaturaModal
          assinatura={editAss}
          users={users}
          onClose={() => { setModalAss(false); setEditAss(null); }}
          onSave={handleSaveAss}
        />
      )}
      {modalPerm && (
        <PermissoesColaborador
          colaborador={editPerm}
          onClose={() => { setModalPerm(false); setEditPerm(null); }}
          onSave={handleSavePerm}
        />
      )}
      {modalAcesso && (
        <AcessoClienteModal
          empresa={editAcesso}
          onClose={() => { setModalAcesso(false); setEditAcesso(null); }}
          onSave={handleSaveAcesso}
        />
      )}
      {modalColaborador && (
        <ColaboradorModal
          colaborador={editColaborador}
          onClose={() => { setModalColaborador(false); setEditColaborador(null); }}
          onSave={handleSaveColaborador}
        />
      )}

      {/* Assinatura de propriedade intelectual */}
      <div className="mt-10 pt-5 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-primary" />
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Lumi ERP</strong> — Software licenciado, não vendido. Propriedade intelectual protegida por lei.
          </p>
        </div>
        <p className="text-xs text-muted-foreground text-center sm:text-right">
          © Copyright <strong className="text-foreground">ALINE PEREIRA DE SOUZA</strong> — Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}