import { ShieldOff, Phone, Mail, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function LicencaBloqueada({ motivo, user }) {
  const handleLogout = () => base44.auth.logout("/");

  return (
    <div className="fixed inset-0 bg-background z-[9999] flex items-center justify-center p-4">
      <div className="bg-card border border-red-500/30 rounded-2xl w-full max-w-md shadow-2xl text-center p-8">
        <div className="w-16 h-16 rounded-full bg-red-500/10/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
          <ShieldOff size={32} className="text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Acesso Bloqueado</h2>
        <p className="text-muted-foreground text-sm mb-4">
          {motivo || "Sua licença foi suspensa ou cancelada. Entre em contato com o suporte para regularizar sua situação."}
        </p>

        <div className="bg-muted rounded-xl p-4 mb-6 text-left space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Entre em contato</p>
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Mail size={14} className="text-primary" />
            <span>suporte@lumierp.com.br</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Phone size={14} className="text-primary" />
            <span>Disponível na plataforma oficial</span>
          </div>
        </div>

        <div className="bg-yellow-500/10/10 border border-yellow-500/20 rounded-xl p-3 mb-6">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-300 text-left">
              O Lumi ERP é um software licenciado de propriedade exclusiva de <strong>Aline Pereira de Souza</strong>. O acesso só é permitido mediante licença ativa e adimplência.
            </p>
          </div>
        </div>

        <button onClick={handleLogout}
          className="w-full py-2.5 bg-muted text-muted-foreground rounded-xl text-sm hover:text-foreground transition-colors">
          Sair do sistema
        </button>

        <p className="text-xs text-muted-foreground mt-4">
          © Lumi ERP — Todos os direitos reservados · Aline Pereira de Souza
        </p>
      </div>
    </div>
  );
}