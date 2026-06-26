import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, X, Truck, Search } from "lucide-react";
import ImportButton from "@/components/shared/ImportButton";

const statusConfig = {
  Ativo: { color: "text-green-400", bg: "bg-green-400/10" },
  Manutenção: { color: "text-yellow-400", bg: "bg-yellow-400/10" },
  Inativo: { color: "text-muted-foreground", bg: "bg-muted" },
  Vendido: { color: "text-red-400", bg: "bg-red-400/10" },
};

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

function VeiculoModal({ veiculo, onClose, onSave }) {
  const [form, setForm] = useState({
    placa: veiculo?.placa || "",
    descricao: veiculo?.descricao || "",
    marca: veiculo?.marca || "",
    modelo: veiculo?.modelo || "",
    ano_fabricacao: veiculo?.ano_fabricacao || new Date().getFullYear(),
    ano_modelo: veiculo?.ano_modelo || new Date().getFullYear(),
    cor: veiculo?.cor || "",
    tipo: veiculo?.tipo || "Carro",
    combustivel: veiculo?.combustivel || "Flex",
    renavam: veiculo?.renavam || "",
    chassi: veiculo?.chassi || "",
    hodometro_atual: veiculo?.hodometro_atual || 0,
    km_proxima_revisao: veiculo?.km_proxima_revisao || "",
    data_proxima_revisao: veiculo?.data_proxima_revisao || "",
    vencimento_ipva: veiculo?.vencimento_ipva || "",
    vencimento_seguro: veiculo?.vencimento_seguro || "",
    vencimento_licenciamento: veiculo?.vencimento_licenciamento || "",
    motorista_responsavel: veiculo?.motorista_responsavel || "",
    departamento: veiculo?.departamento || "",
    valor_compra: veiculo?.valor_compra || "",
    data_compra: veiculo?.data_compra || "",
    status: veiculo?.status || "Ativo",
    observacoes: veiculo?.observacoes || "",
  });
  const [saving, setSaving] = useState(false);

  const f = (field) => ({
    value: form[field],
    onChange: e => setForm(p => ({ ...p, [field]: e.target.value })),
    className: "w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      ...form,
      hodometro_atual: parseFloat(form.hodometro_atual) || 0,
      valor_compra: parseFloat(form.valor_compra) || 0,
      km_proxima_revisao: parseFloat(form.km_proxima_revisao) || 0,
      ano_fabricacao: parseInt(form.ano_fabricacao) || 0,
      ano_modelo: parseInt(form.ano_modelo) || 0,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card">
          <h2 className="text-base font-semibold text-foreground">{veiculo ? "Editar Veículo" : "Novo Veículo"}</h2>
          <button onClick={onClose}><X size={18} className="text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-5">

          {/* Identificação */}
          <section>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Identificação</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs text-muted-foreground mb-1.5">Placa *</label><input required {...f("placa")} placeholder="ABC-1D23" className={f("placa").className + " uppercase"} /></div>
              <div><label className="block text-xs text-muted-foreground mb-1.5">Apelido / Descrição</label><input {...f("descricao")} placeholder="Ex: Truck da obra" /></div>
              <div><label className="block text-xs text-muted-foreground mb-1.5">Marca</label><input {...f("marca")} /></div>
              <div><label className="block text-xs text-muted-foreground mb-1.5">Modelo *</label><input required {...f("modelo")} /></div>
              <div><label className="block text-xs text-muted-foreground mb-1.5">Ano Fabricação</label><input type="number" {...f("ano_fabricacao")} /></div>
              <div><label className="block text-xs text-muted-foreground mb-1.5">Ano Modelo</label><input type="number" {...f("ano_modelo")} /></div>
              <div><label className="block text-xs text-muted-foreground mb-1.5">Tipo</label>
                <select {...f("tipo")}><option>Carro</option><option>Caminhão</option><option>Moto</option><option>Van</option><option>Ônibus</option><option>Trator</option><option>Implemento</option><option>Outro</option></select></div>
              <div><label className="block text-xs text-muted-foreground mb-1.5">Combustível</label>
                <select {...f("combustivel")}><option>Gasolina</option><option>Etanol</option><option>Flex</option><option>Diesel</option><option>GNV</option><option>Elétrico</option><option>Híbrido</option></select></div>
              <div><label className="block text-xs text-muted-foreground mb-1.5">Cor</label><input {...f("cor")} /></div>
              <div><label className="block text-xs text-muted-foreground mb-1.5">Status</label>
                <select {...f("status")}><option>Ativo</option><option>Manutenção</option><option>Inativo</option><option>Vendido</option></select></div>
            </div>
          </section>

          {/* Documentação */}
          <section>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Documentação</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs text-muted-foreground mb-1.5">RENAVAM</label><input {...f("renavam")} /></div>
              <div><label className="block text-xs text-muted-foreground mb-1.5">Chassi</label><input {...f("chassi")} /></div>
              <div><label className="block text-xs text-muted-foreground mb-1.5">Venc. IPVA</label><input type="date" {...f("vencimento_ipva")} /></div>
              <div><label className="block text-xs text-muted-foreground mb-1.5">Venc. Seguro</label><input type="date" {...f("vencimento_seguro")} /></div>
              <div className="col-span-2"><label className="block text-xs text-muted-foreground mb-1.5">Venc. Licenciamento</label><input type="date" {...f("vencimento_licenciamento")} /></div>
            </div>
          </section>

          {/* Operacional */}
          <section>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Operacional</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs text-muted-foreground mb-1.5">Hodômetro Atual (km)</label><input type="number" {...f("hodometro_atual")} /></div>
              <div><label className="block text-xs text-muted-foreground mb-1.5">Km Próxima Revisão</label><input type="number" {...f("km_proxima_revisao")} /></div>
              <div><label className="block text-xs text-muted-foreground mb-1.5">Data Próxima Revisão</label><input type="date" {...f("data_proxima_revisao")} /></div>
              <div><label className="block text-xs text-muted-foreground mb-1.5">Motorista Responsável</label><input {...f("motorista_responsavel")} /></div>
              <div><label className="block text-xs text-muted-foreground mb-1.5">Departamento</label><input {...f("departamento")} /></div>
            </div>
          </section>

          {/* Aquisição */}
          <section>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Aquisição</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs text-muted-foreground mb-1.5">Valor de Compra (R$)</label><input type="number" step="0.01" {...f("valor_compra")} /></div>
              <div><label className="block text-xs text-muted-foreground mb-1.5">Data de Compra</label><input type="date" {...f("data_compra")} /></div>
            </div>
          </section>

          <div><label className="block text-xs text-muted-foreground mb-1.5">Observações</label>
            <textarea rows={2} {...f("observacoes")} className={f("observacoes").className + " resize-none"} /></div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm bg-muted text-muted-foreground">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm bg-primary text-primary-foreground disabled:opacity-50">
              {saving ? "Salvando..." : veiculo ? "Salvar" : "Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VeiculosFrota() {
  const [veiculos, setVeiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const load = () => {
    setLoading(true);
    base44.entities.Veiculo.list("-created_date").then(d => { setVeiculos(d); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (data) => {
    if (editItem) await base44.entities.Veiculo.update(editItem.id, data);
    else await base44.entities.Veiculo.create(data);
    setModal(false); setEditItem(null); load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir este veículo?")) return;
    await base44.entities.Veiculo.delete(id);
    load();
  };

  const filtered = veiculos.filter(v =>
    !search || v.placa?.toUpperCase().includes(search.toUpperCase()) ||
    v.modelo?.toLowerCase().includes(search.toLowerCase()) ||
    v.marca?.toLowerCase().includes(search.toLowerCase())
  );

  const hoje = new Date().toISOString().slice(0, 10);
  const em30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar placa, modelo..."
            className="bg-card border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary w-52" />
        </div>
        <div className="flex items-center gap-2">
          <ImportButton
            label="Importar XLS/CSV/PDF"
            accept=".csv,.xls,.xlsx,.pdf"
            schema={{
              type: "object",
              properties: {
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      placa: { type: "string" },
                      modelo: { type: "string" },
                      marca: { type: "string" },
                      ano: { type: "number" },
                      combustivel: { type: "string" },
                      responsavel: { type: "string" },
                    }
                  }
                }
              }
            }}
            onData={async (rows) => {
              const list = rows[0]?.items || rows;
              for (const row of list) {
                const r = {};
                if (row && typeof row === 'object') {
                  for (const k in row) r[k.toLowerCase()] = row[k];
                }
                
                if (r.placa) {
                  await base44.entities.Veiculo.create({
                    placa: r.placa,
                    modelo: r.modelo || "",
                    marca: r.marca || "",
                    ano: r.ano ? Number(r.ano) : new Date().getFullYear(),
                    tipo_combustivel: r.combustivel || "Flex",
                    responsavel: r.responsavel || "",
                    status: "Ativo"
                  });
                }
              }
              load();
            }}
          />
          <button onClick={() => { setEditItem(null); setModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
            <Plus size={16} /> Novo Veículo
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Truck size={32} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">Nenhum veículo cadastrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(v => {
            const s = statusConfig[v.status] || statusConfig.Ativo;
            const docAlerta = (v.vencimento_ipva && v.vencimento_ipva <= em30) ||
              (v.vencimento_seguro && v.vencimento_seguro <= em30) ||
              (v.vencimento_licenciamento && v.vencimento_licenciamento <= em30);
            return (
              <div key={v.id} className={`bg-card border rounded-xl p-5 ${docAlerta ? "border-yellow-500/30" : "border-border"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-base font-bold font-mono text-foreground">{v.placa}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>{v.status}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{v.marca} {v.modelo} {v.ano_modelo ? `(${v.ano_modelo})` : ""}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${docAlerta ? "bg-yellow-500/10/10" : "bg-primary/10/10"}`}>
                    <Truck size={18} className={docAlerta ? "text-yellow-400" : "text-blue-400"} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-xs mb-3">
                  <div><span className="text-muted-foreground">Tipo:</span> <span className="text-foreground">{v.tipo}</span></div>
                  <div><span className="text-muted-foreground">Comb.:</span> <span className="text-foreground">{v.combustivel}</span></div>
                  {v.hodometro_atual > 0 && <div><span className="text-muted-foreground">Km:</span> <span className="text-foreground">{v.hodometro_atual.toLocaleString("pt-BR")}</span></div>}
                  {v.motorista_responsavel && <div><span className="text-muted-foreground">Motorista:</span> <span className="text-foreground truncate">{v.motorista_responsavel}</span></div>}
                </div>
                {docAlerta && (
                  <div className="text-xs text-yellow-400 mb-3 flex items-center gap-1">
                    ⚠ Documentação vencendo em breve
                  </div>
                )}
                {v.valor_compra > 0 && (
                  <div className="text-xs text-muted-foreground mb-3">Valor compra: <span className="text-foreground font-medium">{fmt(v.valor_compra)}</span></div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => { setEditItem(v); setModal(true); }} className="text-xs text-muted-foreground hover:text-foreground">Editar</button>
                  <button onClick={() => handleDelete(v.id)} className="text-xs text-red-400 hover:underline">Excluir</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && <VeiculoModal veiculo={editItem} onClose={() => { setModal(false); setEditItem(null); }} onSave={handleSave} />}
    </div>
  );
}