import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, DollarSign, ShoppingCart, FileText,
  Users, Truck, HardHat, Sprout, TrendingUp, BarChart2,
  LogOut, Menu, X, Package, Calculator, Crown, Send, UserCircle,
  Calendar, Shield, Globe, BookOpen, WifiOff
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import TermosUso from "@/components/licenca/TermosUso";
import LicencaBloqueada from "@/components/licenca/LicencaBloqueada";
import BuscaGlobal from "@/components/shared/BuscaGlobal";

// Todos os módulos disponíveis, cada um com sua chave de assinatura
const ALL_NAV_ITEMS = [
  { label: "Panorama", icon: LayoutDashboard, path: "/", color: "text-blue-400", key: null }, // sempre visível
  { label: "Financeiro", icon: DollarSign, path: "/financeiro", color: "text-green-400", key: "financeiro" },
  { label: "Comercial", icon: ShoppingCart, path: "/comercial", color: "text-blue-400", key: "comercial" },
  { label: "Emissão NF-e/NFS-e", icon: Send, path: "/modulo-nfe", color: "text-red-400", key: "nfe" },
  { label: "Gestão de Estoques", icon: Package, path: "/estoques", color: "text-yellow-400", key: "estoques" },
  { label: "Fiscal & Tributário", icon: FileText, path: "/fiscal", color: "text-yellow-400", key: "fiscal" },
  { label: "Bens Recebidos", icon: Package, path: "/bens-recebidos", color: "text-yellow-400", key: "bens_recebidos" },
  { label: "Planej. Tributário", icon: Calculator, path: "/planejamento-tributario", color: "text-blue-400", key: "tributario" },
  { label: "Recursos Humanos", icon: Users, path: "/rh", color: "text-blue-400", key: "rh" },
  { label: "Veículos", icon: Truck, path: "/veiculos", color: "text-blue-400", key: "veiculos" },
  { label: "Gestão de Obras", icon: HardHat, path: "/obras", color: "text-yellow-400", key: "obras" },
  { label: "Agronegócio", icon: Sprout, path: "/agronegocio", color: "text-green-400", key: "agronegocio" },
  { label: "Eng. Financeira", icon: TrendingUp, path: "/eng-financeira", color: "text-green-400", key: "eng_financeira" },
  { label: "Simulador de Lucro", icon: BarChart2, path: "/simulador", color: "text-blue-400", key: "simulador" },
  { label: "Calendário de Tarefas", icon: Calendar, path: "/calendario", color: "text-blue-400", key: null },
  { label: "Certidões", icon: Shield, path: "/certidoes", color: "text-green-400", key: null },
  { label: "Links Governo", icon: Globe, path: "/links-governo", color: "text-blue-400", key: null },
  { label: "Integrações e APIs", icon: Globe, path: "/integracoes", color: "text-red-400", key: "fiscal" },
  { label: "Manual do Usuário", icon: BookOpen, path: "/manual", color: "text-blue-400", key: null },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [assinatura, setAssinatura] = useState(null);
  const [licenca, setLicenca] = useState(null);
  const [mostrarTermos, setMostrarTermos] = useState(false);
  const [licencaBloqueada, setLicencaBloqueada] = useState(false);
  const [motivoBloqueio, setMotivoBloqueio] = useState("");
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [empresa, setEmpresa] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const registrarLog = async (me, acao, detalhes = "") => {
    try {
      await base44.entities.LogAcesso.create({
        user_id: me.id,
        user_email: me.email,
        user_nome: me.full_name || me.email,
        acao,
        timestamp: new Date().toISOString(),
        detalhes,
        user_agent: navigator.userAgent.substring(0, 200),
      });
    } catch {}
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);

        if (me.role !== "admin") {
          // Carrega assinatura
          const todas = await base44.entities.AssinaturaCliente.filter({ user_email: me.email });
          const ativa = todas.find(a => a.status === "Ativa" || a.status === "Trial") || todas[0] || null;
          setAssinatura(ativa);

          // Carrega empresa do usuário
          const empresas = await base44.entities.EmpresaCliente.list();
          setEmpresa(empresas[0] || null);

          // Verificação de licença
          const licencas = await base44.entities.LicencaCliente.filter({ user_email: me.email });
          const lic = licencas[0] || null;
          setLicenca(lic);

          if (lic) {
            if (lic.status === "bloqueada" || lic.status === "cancelada") {
              setLicencaBloqueada(true);
              setMotivoBloqueio(lic.motivo_bloqueio || "Licença inativa.");
              await registrarLog(me, "bloqueio", lic.motivo_bloqueio || "Acesso bloqueado.");
              return;
            }
            if (lic.status === "suspensa") {
              setLicencaBloqueada(true);
              setMotivoBloqueio("Sua licença está suspensa. Regularize sua situação para continuar.");
              return;
            }
            if (!lic.termos_aceitos) {
              setMostrarTermos(true);
            }
          } else {
            // Sem licença: criar automaticamente ao primeiro acesso
            const novaLic = await base44.entities.LicencaCliente.create({
              user_email: me.email,
              user_id: me.id,
              empresa_nome: ativa?.empresa_nome || "",
              plano: ativa?.plano || "Profissional",
              status: "ativa",
              chave_licenca: `LIC-${me.id.substring(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
              data_ativacao: new Date().toISOString().split("T")[0],
              termos_aceitos: false,
              total_acessos: 0,
            });
            setLicenca(novaLic);
            setMostrarTermos(true);
          }

          // Atualiza último acesso e contagem
          if (lic?.id) {
            await base44.entities.LicencaCliente.update(lic.id, {
              ultimo_acesso: new Date().toISOString(),
              total_acessos: (lic.total_acessos || 0) + 1,
            });
          }

          await registrarLog(me, "login", `Acesso ao sistema — Plano: ${ativa?.plano || "N/A"}`);
        }
      } catch {}
    };
    loadUser();
  }, []);

  const handleLogout = () => {
    base44.auth.logout("/");
  };

  const isAdmin = user?.role === "admin";

  // Admin vê tudo
  // Cliente com assinatura ativa e módulos configurados: filtra pelos módulos contratados
  // Cliente sem assinatura ou sem módulos definidos: vê tudo (sem restrição até ser configurado)
  const modulosContratados = assinatura?.modulos_contratados || [];
  const temRestricao = modulosContratados.length > 0 && !modulosContratados.includes("all");

  const navItems = isAdmin
    ? ALL_NAV_ITEMS
    : temRestricao
      ? ALL_NAV_ITEMS.filter(item => item.key === null || modulosContratados.includes(item.key))
      : ALL_NAV_ITEMS;

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const NavLinks = () => (
    <nav className="flex-1 py-4 overflow-y-auto">
      {navItems.map((item) => { // eslint-disable-line
        const Icon = item.icon;
        const active = isActive(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg mb-0.5 transition-all duration-150 group
 ${active
 ? "bg-sidebar-accent text-foreground"
 : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
 }`}
          >
            <Icon size={18} className={`flex-shrink-0 ${active ? item.color : "text-sidebar-foreground group-hover:" + item.color.replace("text-", "")}`} />
            {!collapsed && (
              <span className="text-sm font-bold truncate">{item.label}</span>
            )}
            {active && !collapsed && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Termos de uso — primeiro acesso */}
      {mostrarTermos && (
        <TermosUso
          user={user}
          licenca={licenca}
          onAceite={() => setMostrarTermos(false)}
        />
      )}
      {/* Licença bloqueada */}
      {licencaBloqueada && (
        <LicencaBloqueada motivo={motivoBloqueio} user={user} />
      )}
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar desktop */}
      <aside
        className={`hidden lg:flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 flex-shrink-0
 ${collapsed ? "w-16" : "w-56"}`}
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-4 border-b border-sidebar-border ${collapsed ? "justify-center flex-col" : ""}`}>
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">L</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-foreground font-semibold text-sm leading-tight">LUMI GFE</p>
              <p className="text-sidebar-foreground text-xs truncate" title={empresa ? `${empresa.razao_social} - ${empresa.cnpj}` : (user?.full_name || user?.email)}>
                {empresa ? `${empresa.razao_social} ${empresa.cnpj ? `(${empresa.cnpj})` : ''}` : (user?.full_name || user?.email || "Sistema de Gestão")}
              </p>
            </div>
          )}
          {!collapsed && isAdmin && (
            <span className="flex items-center gap-1 text-xs bg-yellow-500/10/15 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-500/30 flex-shrink-0">
              <Crown size={10} /> Admin
            </span>
          )}
        </div>

        <NavLinks />

        {/* Bottom */}
        <div className="p-3 border-t border-sidebar-border space-y-1">
          <Link
            to="/meu-painel"
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all
 ${location.pathname === "/meu-painel"
 ? "bg-primary/20 text-primary"
 : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"}`}
          >
            <UserCircle size={16} />
            {!collapsed && <span className="text-xs font-bold">Meu Painel</span>}
          </Link>
          {isAdmin && (
            <Link
              to="/admin-master"
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all
 ${location.pathname === "/admin-master"
 ? "bg-yellow-500/10/20 text-yellow-400"
 : "text-yellow-500/70 hover:bg-yellow-500/10/10 hover:text-yellow-400"}`}
            >
              <Crown size={16} />
              {!collapsed && <span className="text-xs font-bold">Admin Master</span>}
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground transition-all"
          >
            <Menu size={16} />
            {!collapsed && <span className="text-xs font-bold">Recolher</span>}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-red-500/10/10 hover:text-red-400 transition-all"
          >
            <LogOut size={16} />
            {!collapsed && <span className="text-xs font-bold">Sair</span>}
          </button>
          {!collapsed && (
            <div className="pt-2 border-t border-sidebar-border/50 mt-1">
              <p className="text-[9px] text-muted-foreground/40 leading-tight text-center px-1">
                © ERP LUMI GFE - Propriedade intelectual exclusiva de A.P.S.<br />
                Proibida cópia, revenda ou comercialização.
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Sidebar mobile */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-sidebar border-r border-sidebar-border z-50 flex flex-col
 lg:hidden transform transition-transform duration-300
 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-4 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-foreground font-semibold text-sm leading-tight">LUMI GFE</p>
              <p className="text-sidebar-foreground text-xs truncate" title={empresa ? `${empresa.razao_social} - ${empresa.cnpj}` : (user?.full_name || user?.email)}>
                {empresa ? `${empresa.razao_social} ${empresa.cnpj ? `(${empresa.cnpj})` : ''}` : (user?.full_name || user?.email || "Sistema de Gestão")}
              </p>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="text-sidebar-foreground">
            <X size={18} />
          </button>
        </div>
        <NavLinks />
        <div className="p-3 border-t border-sidebar-border space-y-1">
          <Link
            to="/meu-painel"
            onClick={() => setMobileOpen(false)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground transition-all"
          >
            <UserCircle size={16} />
            <span className="text-xs font-bold">Meu Painel</span>
          </Link>
          {isAdmin && (
            <Link
              to="/admin-master"
              onClick={() => setMobileOpen(false)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-yellow-500/70 hover:bg-yellow-500/10/10 hover:text-yellow-400 transition-all"
            >
              <Crown size={16} />
              <span className="text-xs font-bold">Admin Master</span>
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-red-500/10/10 hover:text-red-400 transition-all"
          >
            <LogOut size={16} />
            <span className="text-xs font-bold">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {isOffline && (
          <div className="bg-yellow-500/10/10 border-b border-yellow-500/20 text-yellow-500 px-4 py-1.5 flex items-center justify-center gap-2 text-xs font-medium z-50">
            <WifiOff size={14} /> 
            Você está operando em Modo Offline. Lançamentos serão salvos localmente e sincronizados depois.
          </div>
        )}
        {/* Top bar (desktop + mobile) */}
        <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-3 lg:hidden">
            <button onClick={() => setMobileOpen(true)} className="text-foreground">
              <Menu size={20} />
            </button>
            <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
              <span className="text-white font-bold text-xs">L</span>
            </div>
            <span className="text-foreground font-semibold text-sm">LUMI GFE</span>
            <BuscaGlobal />
          </div>
          <div className="hidden lg:flex flex-1 max-w-sm mx-4">
            <BuscaGlobal />
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <span className="flex items-center gap-1.5 text-xs bg-yellow-500/10/15 text-yellow-400 px-3 py-1.5 rounded-full border border-yellow-500/30 font-medium">
                <Crown size={12} /> Administrador
              </span>
            )}
            {user && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <span className="text-primary text-xs font-bold">{(empresa?.razao_social || user.full_name || user.email || "U")[0].toUpperCase()}</span>
                </div>
                <span className="text-sm text-muted-foreground hidden sm:block">
                  {empresa ? `${empresa.razao_social} ${empresa.cnpj ? `(${empresa.cnpj})` : ''}` : (user.full_name || user.email)}
                </span>
              </div>
            )}
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-400 transition-colors px-2 py-1.5 rounded hover:bg-red-400/10">
              <LogOut size={14} /> <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}