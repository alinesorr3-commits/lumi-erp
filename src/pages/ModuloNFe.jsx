import { useState, useCallback } from "react";
import { FileText, BarChart2, Database, Download } from "lucide-react";
import NFeDashboard from "@/components/nfe/NFeDashboard";
import NFeEmissao from "@/components/nfe/NFeEmissao";
import NFeCadastros from "@/components/nfe/NFeCadastros";
import DocumentosRecebidos from "@/components/nfe/DocumentosRecebidos";
import NFeListaSaida from "@/components/nfe/NFeListaSaida";
import PrintButton from "@/components/shared/PrintButton";

const TABS = [
  { key: "dashboard", label: "Dashboard Fiscal", icon: BarChart2 },
  { key: "notas", label: "NF-e / NFS-e", icon: FileText },
  { key: "recebidas", label: "Documentos Recebidos", icon: Download },
  { key: "cadastros", label: "Cadastros", icon: Database },
];

export default function ModuloNFe() {
  const [tab, setTab] = useState("dashboard");
  const [emissaoOpen, setEmissaoOpen] = useState(false);
  const [editNota, setEditNota] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSaved = () => setRefreshKey(k => k + 1);

  const getHeaderIcon = () => {
    if (tab === "recebidas") return <Download size={18} className="text-green-400" />;
    return <FileText size={18} className="text-red-400" />;
  };

  const getHeaderColor = () => {
    if (tab === "recebidas") return "bg-green-500/10/20 border-green-500/30";
    return "bg-red-500/10/20 border-red-500/30";
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${getHeaderColor()}`}>
              {getHeaderIcon()}
            </div>
            <div>
              <h1 className="text-2xl font-bold font-heading text-foreground">{tab === "recebidas" ? "Documentos Recebidos" : "Emissão de Documentos Fiscais"}</h1>
              <p className="text-xs text-muted-foreground">{tab === "recebidas" ? "NF-e e NFS-e recebidas de terceiros" : "NF-e · NFS-e — Documentos Emitidos"}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PrintButton label="Imprimir" />
          {tab === "notas" && (
            <button
              onClick={() => { setEditNota(null); setEmissaoOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
            >
              <FileText size={15} />
              Emitir Nota Fiscal
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg mb-6 w-fit overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap
 ${tab === t.key ? "bg-red-500/10 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "dashboard" && (
        <NFeDashboard
          key={refreshKey}
          onNew={() => { setEditNota(null); setEmissaoOpen(true); setTab("notas"); }}
          onEdit={(nota) => { setEditNota(nota); setEmissaoOpen(true); }}
        />
      )}
      {tab === "notas" && (
        <NFeListaSaida
          key={refreshKey}
          onNew={() => { setEditNota(null); setEmissaoOpen(true); }}
          onEdit={(nota) => { setEditNota(nota); setEmissaoOpen(true); }}
        />
      )}
      {tab === "recebidas" && <DocumentosRecebidos />}
      {tab === "cadastros" && <NFeCadastros />}

      {emissaoOpen && (
        <NFeEmissao
          nota={editNota}
          onClose={() => { setEmissaoOpen(false); setEditNota(null); }}
          onSaved={() => { setEmissaoOpen(false); setEditNota(null); handleSaved(); }}
        />
      )}
    </div>
  );
}