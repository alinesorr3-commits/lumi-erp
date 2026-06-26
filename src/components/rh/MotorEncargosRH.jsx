import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, X, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const REGIMES = [
  { id: "simples_nacional", nome: "Simples Nacional", cor: "text-blue-400" },
  { id: "mei", nome: "MEI", cor: "text-green-400" },
  { id: "lucro_presumido", nome: "Lucro Presumido", cor: "text-yellow-400" },
  { id: "lucro_real", nome: "Lucro Real", cor: "text-blue-400" },
];

function ConfigModal({ config, onClose, onSave }) {
  const [form, setForm] = useState({
    regime_tributario: config?.regime_tributario || "simples_nacional",
    cpp_no_das: config?.cpp_no_das ?? true,
    inss_patronal_percentual: config?.inss_patronal_percentual ?? 20,
    rat_percentual: config?.rat_percentual ?? 2,
    terceiros_percentual: config?.terceiros_percentual ?? 5.8,
    fgts_percentual: config?.fgts_percentual ?? 8,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      ...form,
      inss_patronal_percentual: parseFloat(form.inss_patronal_percentual) || 0,
      rat_percentual: parseFloat(form.rat_percentual) || 0,
      terceiros_percentual: parseFloat(form.terceiros_percentual) || 0,
      fgts_percentual: parseFloat(form.fgts_percentual) || 0,
    });
    setSaving(false);
  };

  const NumField = ({ label, field, help }) => (
    <div>
      <label className="block text-xs text-muted-foreground mb-1.5">{label}</label>
      <input type="number" step="0.01" value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
      {help && <p className="text-xs text-muted-foreground mt-0.5">{help}</p>}
    </div>
  );

  const SN = ({ label, field }) => (
    <div>
      <label className="block text-xs text-muted-foreground mb-1.5">{label}</label>
      <select value={form[field] ? "Sim" : "Não"} onChange={e => setForm(f => ({ ...f, [field]: e.target.value === "Sim" }))}
        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
        <option>Sim</option>
        <option>Não</option>
      </select>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card">
          <h2 className="text-base font-semibold text-foreground">Configurar Encargos - {REGIMES.find(r => r.id === form.regime_tributario)?.nome}</h2>
          <button onClick={onClose}><X size={18} className="text-muted-foreground" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 bg-yellow-500/10/10 border border-yellow-500/30 rounded-lg flex gap-2">
            <AlertCircle size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <strong>Fator R:</strong> Utilize a tabela do <strong>Motor de Encargos</strong> conforme seu regime tributário. O FGTS é recolhido sobre a folha de pagamento em todos os regimes.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <NumField label="INSS Patronal (%)" field="inss_patronal_percentual" help="Varia por regime: SN 20%, MEI 0%, LP/LR ~15%" />
            <NumField label="RAT (%)" field="rat_percentual" help="Risco de Acidente do Trabalho (0-2%)" />
            <NumField label="Terceiros (%)" field="terceiros_percentual" help="Contribuição de Terceiros (MEI ~1.4%)" />
            <NumField label="FGTS (%)" field="fgts_percentual" help="Fundo de Garantia (padrão 8%)" />
          </div>

          {form.regime_tributario === "simples_nacional" && (
            <SN label="CPP recolhida no DAS?" field="cpp_no_das" />
          )}

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

export default function MotorEncargosRH() {
  const [configs, setConfigs] = useState({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRegime, setEditRegime] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.ConfigEncargos.list();
      const configMap = {};
      data.forEach(c => {
        configMap[c.regime_tributario || "simples_nacional"] = c;
      });
      setConfigs(configMap);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSave = async (data) => {
    try {
      const existing = configs[data.regime_tributario];
      if (existing) {
        await base44.entities.ConfigEncargos.update(existing.id, data);
      } else {
        await base44.entities.ConfigEncargos.create(data);
      }
      toast({ title: "✓ Salvo", description: "Configuração de encargos atualizada" });
      setModalOpen(false);
      setEditRegime(null);
      loadConfigs();
    } catch (err) {
      toast({ title: "✗ Erro", description: err.message, variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Motor de Encargos por Regime Tributário</h3>
          <p className="text-xs text-muted-foreground mt-1">Configure percentuais de INSS, RAT, Terceiros e FGTS por regime</p>
        </div>
        <button onClick={() => { setEditRegime(null); setModalOpen(true); }} 
          className="flex items-center gap-2 px-3 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
          <Plus size={14} /> Novo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {REGIMES.map(regime => {
          const cfg = configs[regime.id];
          const cppLabel = regime.id === "simples_nacional" ? (cfg?.cpp_no_das ? "CPP no DAS" : "CPP Separada") : "—";
          
          return (
            <div key={regime.id} className="p-4 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className={`text-sm font-semibold ${regime.cor}`}>{regime.nome}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{cppLabel}</p>
                </div>
                <button onClick={() => { setEditRegime(regime.id); setModalOpen(true); }} 
                  className="text-xs text-muted-foreground hover:text-foreground">Editar</button>
              </div>

              {cfg ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">INSS Patronal</span>
                    <span className="text-foreground font-medium">{cfg.inss_patronal_percentual}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">RAT</span>
                    <span className="text-foreground font-medium">{cfg.rat_percentual}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Terceiros</span>
                    <span className="text-foreground font-medium">{cfg.terceiros_percentual}%</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="text-muted-foreground">FGTS</span>
                    <span className="text-foreground font-medium">{cfg.fgts_percentual}%</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">Não configurado</p>
              )}
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <ConfigModal 
          config={editRegime ? configs[editRegime] : null} 
          onClose={() => { setModalOpen(false); setEditRegime(null); }} 
          onSave={handleSave} 
        />
      )}
    </div>
  );
}