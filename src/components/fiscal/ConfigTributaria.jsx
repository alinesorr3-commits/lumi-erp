import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Save, Settings } from "lucide-react";

export default function ConfigTributaria() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    empresa_nome: "",
    cnpj: "",
    regime_tributario: "simples_nacional",
    cpp_no_das: true,
    inss_patronal_percentual: 20,
    rat_percentual: 2,
    terceiros_percentual: 5.8,
    fgts_percentual: 8,
    ativa: true,
  });

  const load = async () => {
    const data = await base44.entities.ConfigEncargos.filter({ ativa: true });
    if (data[0]) {
      setConfig(data[0]);
      setForm({ ...data[0] });
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const data = {
      ...form,
      inss_patronal_percentual: parseFloat(form.inss_patronal_percentual) || 20,
      rat_percentual: parseFloat(form.rat_percentual) || 2,
      terceiros_percentual: parseFloat(form.terceiros_percentual) || 5.8,
      fgts_percentual: parseFloat(form.fgts_percentual) || 8,
    };
    if (config) {
      await base44.entities.ConfigEncargos.update(config.id, data);
    } else {
      await base44.entities.ConfigEncargos.create(data);
    }
    setSaving(false);
    load();
    alert("Configuração salva com sucesso!");
  };

  if (loading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <Settings size={18} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Cadastro da Empresa e Regime Tributário</h3>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs text-muted-foreground mb-1.5">Razão Social *</label>
              <input required value={form.empresa_nome} onChange={e => setForm(f => ({ ...f, empresa_nome: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">CNPJ</label>
              <input value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                placeholder="00.000.000/0001-00" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Regime Tributário *</label>
              <select value={form.regime_tributario} onChange={e => setForm(f => ({ ...f, regime_tributario: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                <option value="simples_nacional">Simples Nacional</option>
                <option value="lucro_presumido">Lucro Presumido</option>
                <option value="lucro_real">Lucro Real</option>
              </select>
            </div>
          </div>

          {form.regime_tributario === "simples_nacional" && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Configuração Simples Nacional</p>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="cpp_das" checked={form.cpp_no_das} onChange={e => setForm(f => ({ ...f, cpp_no_das: e.target.checked }))}
                  className="w-4 h-4 rounded border-border" />
                <label htmlFor="cpp_das" className="text-sm text-foreground">
                  CPP (INSS Patronal) recolhida no DAS
                  <span className="text-xs text-muted-foreground ml-1">{form.cpp_no_das ? "(INSS Patronal = R$ 0,00)" : "(INSS Patronal = 20% s/ folha)"}</span>
                </label>
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Percentuais de Encargos (CONFIG_ENCARGOS)</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "INSS Patronal (%)", field: "inss_patronal_percentual", disabled: form.regime_tributario === "simples_nacional" && form.cpp_no_das },
                { label: "RAT (%)", field: "rat_percentual" },
                { label: "Terceiros (%)", field: "terceiros_percentual" },
                { label: "FGTS (%)", field: "fgts_percentual" },
              ].map(({ label, field, disabled }) => (
                <div key={field}>
                  <label className="block text-xs text-muted-foreground mb-1.5">{label}</label>
                  <input type="number" step="0.01" min="0" max="100" disabled={disabled}
                    value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    className={`w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary ${disabled ? "opacity-40 cursor-not-allowed" : ""}`} />
                  {disabled && <p className="text-xs text-green-400 mt-0.5">Zerado (CPP no DAS)</p>}
                </div>
              ))}
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            <Save size={16} /> {saving ? "Salvando..." : "Salvar Configuração"}
          </button>
        </form>
      </div>
    </div>
  );
}