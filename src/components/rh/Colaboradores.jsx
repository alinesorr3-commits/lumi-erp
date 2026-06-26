import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Users, X, User, Printer } from "lucide-react";
import ImportButton from "@/components/shared/ImportButton";
import PrintButton from "@/components/shared/PrintButton";

const statusConfig = {
  ativo: { label: "Ativo", color: "text-green-400", bg: "bg-green-400/10" },
  inativo: { label: "Inativo", color: "text-muted-foreground", bg: "bg-muted" },
  ferias: { label: "Férias", color: "text-blue-400", bg: "bg-blue-400/10" },
  afastado: { label: "Afastado", color: "text-yellow-400", bg: "bg-yellow-400/10" },
};

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const fmtDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "-";

function ColaboradorModal({ colaborador, onClose, onSave }) {
  const [form, setForm] = useState({
    nome: colaborador?.nome || "",
    cargo: colaborador?.cargo || "",
    departamento: colaborador?.departamento || "",
    tipo_contrato: colaborador?.tipo_contrato || "CLT",
    data_admissao: colaborador?.data_admissao || "",
    status: colaborador?.status || "ativo",
    cpf: colaborador?.cpf || "",
    email: colaborador?.email || "",
    telefone: colaborador?.telefone || "",
    endereco: colaborador?.endereco || "",
    salario_base: colaborador?.salario_base || "",
    banco: colaborador?.banco || "",
    agencia_banco: colaborador?.agencia_banco || "",
    conta_banco: colaborador?.conta_banco || "",
    jornada_horas: colaborador?.jornada_horas || 8,
    retem_irrf: colaborador?.retem_irrf || false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ ...form, salario_base: parseFloat(form.salario_base) || 0, jornada_horas: parseInt(form.jornada_horas) || 8 });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card">
          <h2 className="text-base font-semibold text-foreground">{colaborador ? "Editar Colaborador" : "Novo Colaborador"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Dados Pessoais</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-muted-foreground mb-1.5">Nome Completo *</label>
                <input required value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">CPF</label>
                <input value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" placeholder="000.000.000-00" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Telefone</label>
                <input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-muted-foreground mb-1.5">E-mail</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-muted-foreground mb-1.5">Endereço</label>
                <input value={form.endereco} onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Dados Contratuais</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Cargo *</label>
                <input required value={form.cargo} onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Departamento</label>
                <input value={form.departamento} onChange={e => setForm(f => ({ ...f, departamento: e.target.value }))}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Tipo Contrato</label>
                <select value={form.tipo_contrato} onChange={e => setForm(f => ({ ...f, tipo_contrato: e.target.value }))}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                  <option value="CLT">CLT</option>
                  <option value="PJ">PJ</option>
                  <option value="estagio">Estágio</option>
                  <option value="temporario">Temporário</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                  <option value="ferias">Férias</option>
                  <option value="afastado">Afastado</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Data Admissão</label>
                <input type="date" value={form.data_admissao} onChange={e => setForm(f => ({ ...f, data_admissao: e.target.value }))}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <input type="checkbox" id="retem_irrf" checked={form.retem_irrf} onChange={e => setForm(f => ({ ...f, retem_irrf: e.target.checked }))} className="cursor-pointer" />
                <label htmlFor="retem_irrf" className="text-xs text-muted-foreground cursor-pointer">Reter IRPF na Folha</label>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Salário Base (R$)</label>
                <input type="number" step="0.01" value={form.salario_base} onChange={e => setForm(f => ({ ...f, salario_base: e.target.value }))}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Jornada (h/dia)</label>
                <input type="number" min="1" max="24" value={form.jornada_horas} onChange={e => setForm(f => ({ ...f, jornada_horas: e.target.value }))}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Dados Bancários</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Banco</label>
                <input value={form.banco} onChange={e => setForm(f => ({ ...f, banco: e.target.value }))}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Agência</label>
                <input value={form.agencia_banco} onChange={e => setForm(f => ({ ...f, agencia_banco: e.target.value }))}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Conta</label>
                <input value={form.conta_banco} onChange={e => setForm(f => ({ ...f, conta_banco: e.target.value }))}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm bg-muted text-muted-foreground">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm bg-primary text-primary-foreground disabled:opacity-50">
              {saving ? "Salvando..." : colaborador ? "Salvar" : "Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Colaboradores() {
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [selected, setSelected] = useState(new Set());

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.Colaborador.list("-created_date");
    setColaboradores(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = colaboradores.filter(c => {
    const matchSearch = c.nome?.toLowerCase().includes(search.toLowerCase()) || c.cargo?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "todos" || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleSave = async (data) => {
    if (data.cpf || data.nome) {
      let isDup = false;
      
      if (data.cpf && data.cpf.trim() !== "") {
        const byCpf = await base44.entities.Colaborador.filter({ cpf: data.cpf.trim() });
        if (byCpf.some(e => !editItem || e.id !== editItem.id)) {
          isDup = true;
        }
      }
      
      if (!isDup && data.nome && data.nome.trim() !== "") {
        const byNome = await base44.entities.Colaborador.filter({ nome: data.nome.trim() });
        if (byNome.some(e => !editItem || e.id !== editItem.id)) {
          isDup = true;
        }
      }
      
      if (isDup) {
        alert("Já existe um colaborador cadastrado com este Nome ou CPF.");
        return;
      }
    }

    if (editItem) {
      await base44.entities.Colaborador.update(editItem.id, data);
    } else {
      await base44.entities.Colaborador.create(data);
    }
    setModalOpen(false);
    setEditItem(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir este colaborador?")) return;
    await base44.entities.Colaborador.delete(id);
    load();
  };

  const ativos = colaboradores.filter(c => c.status === "ativo").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar colaborador..."
              className="bg-card border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary w-56" />
          </div>
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            {["todos", "ativo", "ferias", "afastado", "inativo"].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all capitalize
 ${filterStatus === s ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {s === "todos" ? "Todos" : s === "ferias" ? "Férias" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {selected.size > 0 && (
            <span className="text-xs text-muted-foreground mr-2">{selected.size} selecionado(s)</span>
          )}
          <ImportButton
            label="Importar XLS/CSV/PDF"
            accept=".csv,.xls,.xlsx,.pdf"
            schema={{
              type: "object",
              properties: {
                items: {
                  type: "array",
                  description: "Lista de colaboradores ou funcionários",
                  items: {
                    type: "object",
                    properties: {
                      nome: { type: "string", description: "Nome completo do colaborador" },
                      cargo: { type: "string" },
                      departamento: { type: "string" },
                      cpf: { type: "string" },
                      email: { type: "string" },
                      telefone: { type: "string" },
                      salario_base: { type: "number" },
                      tipo_contrato: { type: "string" },
                      data_admissao: { type: "string" },
                    },
                    required: ["nome"]
                  }
                }
              }
            }}
            onData={async (rows) => {
              try {
                if (!rows || rows.length === 0) {
                  alert("Nenhum dado encontrado no arquivo.");
                  return;
                }
                
                // Extração super agressiva para achar os registros
                let list = [];
                const searchList = (obj) => {
                  if (Array.isArray(obj)) {
                    obj.forEach(searchList);
                  } else if (obj && typeof obj === 'object') {
                    const keys = Object.keys(obj).map(x => x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
                    if (keys.some(x => x.includes('nome') || x.includes('funcionario') || x.includes('colaborador'))) {
                      list.push(obj);
                    } else {
                      Object.values(obj).forEach(searchList);
                    }
                  }
                };
                searchList(rows);

                if (list.length === 0) {
                   list = Array.isArray(rows) ? rows : (rows.items || [rows]);
                }

                let count = 0;
                for (const row of list) {
                  const r = {};
                  if (row && typeof row === 'object') {
                    for (const k in row) {
                      if(typeof row[k] !== 'object') {
                        const cleanKey = k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
                        r[cleanKey] = row[k];
                      }
                    }
                  }
                  
                  const nomeVal = r.nome || r.nome_completo || r.funcionario || r.colaborador;
                  const cargoVal = r.cargo || r.funcao || "Não informado";
                  const deptoVal = r.departamento || r.setor || r.area || "";
                  const salarioVal = r.salario_base || r.salario || r.remuneracao || r.vencimento;
                  
                  if (nomeVal) {
                    const salarioParsed = typeof salarioVal === "number" ? salarioVal : (parseFloat(salarioVal?.toString().replace(/[^\d.,]/g, '').replace(',', '.')) || 0);

                    await base44.entities.Colaborador.create({
                      nome: String(nomeVal),
                      cargo: String(cargoVal),
                      departamento: String(deptoVal),
                      cpf: String(r.cpf || r.documento || ""),
                      email: String(r.email || ""),
                      telefone: String(r.telefone || r.celular || ""),
                      salario_base: salarioParsed,
                      tipo_contrato: String(r.tipo_contrato || "CLT"),
                      data_admissao: String(r.data_admissao || ""),
                      status: "ativo",
                      retem_irrf: !!String(nomeVal).toUpperCase().match(/ANCELMO|GECIOMAR/),
                    });
                    count++;
                  }
                }
                if (count > 0) {
                  alert(`${count} colaborador(es) importado(s) com sucesso.`);
                } else {
                  alert("Nenhum colaborador importado.\nA planilha deve conter uma coluna com o título 'Nome'.\n\nDica: Baixe a planilha modelo para usar como base.");
                  console.log("Dados brutos não reconhecidos:", rows);
                }
                load();
              } catch (err) {
                alert("Erro ao importar: " + err.message);
                console.error(err);
              }
            }}
          />
          <button onClick={() => {
            const csv = "Nome,Cargo,Departamento,CPF,Email,Telefone,Salario_Base,Tipo_Contrato,Data_Admissao\nJoão Silva,Vendedor,Comercial,12345678900,joao@email.com,11999999999,2500.00,CLT,2024-01-15\nMaria Souza,Gerente,Administrativo,09876543211,maria@email.com,11988888888,5000.00,PJ,2023-06-01";
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'modelo_importacao_colaboradores.csv';
            a.click();
          }} className="px-3 py-1.5 bg-muted border border-border text-muted-foreground rounded-lg text-xs hover:text-foreground transition-colors">
            Baixar Modelo
          </button>
          <PrintButton label={selected.size > 0 ? `Imprimir Selecionados (${selected.size})` : "Imprimir Relatório Geral"} />
          <button onClick={() => { setEditItem(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
            <Plus size={16} /> Novo Colaborador
          </button>
        </div>
      </div>

      <div className="mb-4 text-xs text-muted-foreground">
        {ativos} colaborador{ativos !== 1 ? "es" : ""} ativo{ativos !== 1 ? "s" : ""}
      </div>

      <style>{`
        @media print {
          .print-hide-unselected .unselected-row { display: none !important; }
        }
      `}</style>
      <div className={`bg-card border border-border rounded-xl overflow-hidden ${selected.size > 0 ? 'print-hide-unselected' : ''}`}>
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users size={28} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum colaborador encontrado</p>
            <button onClick={() => { setEditItem(null); setModalOpen(true); }} className="mt-2 text-primary text-sm hover:underline">Cadastrar primeiro colaborador</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs text-muted-foreground px-4 py-3 w-8">
                    <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0}
                      onChange={() => {
                        if (selected.size === filtered.length) setSelected(new Set());
                        else setSelected(new Set(filtered.map(c => c.id)));
                      }}
                      className="cursor-pointer" />
                  </th>
                  <th className="text-left text-xs text-muted-foreground px-4 py-3">Colaborador</th>
                  <th className="text-left text-xs text-muted-foreground px-4 py-3">Cargo / Dept.</th>
                  <th className="text-left text-xs text-muted-foreground px-4 py-3">Contrato</th>
                  <th className="text-left text-xs text-muted-foreground px-4 py-3">Admissão</th>
                  <th className="text-right text-xs text-muted-foreground px-4 py-3">Salário</th>
                  <th className="text-left text-xs text-muted-foreground px-4 py-3">Status</th>
                  <th className="text-right text-xs text-muted-foreground px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const s = statusConfig[c.status] || statusConfig.ativo;
                  return (
                    <tr key={c.id} className={`border-b border-border/50 transition-colors ${selected.has(c.id) ? "bg-primary/10" : "hover:bg-muted/30"} ${!selected.has(c.id) ? "unselected-row" : ""}`}>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selected.has(c.id)} onChange={() => {
                          const newSet = new Set(selected);
                          if (newSet.has(c.id)) newSet.delete(c.id);
                          else newSet.add(c.id);
                          setSelected(newSet);
                        }} className="cursor-pointer" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <User size={14} className="text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{c.nome}</p>
                            {c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-foreground">{c.cargo}</p>
                        {c.departamento && <p className="text-xs text-muted-foreground">{c.departamento}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{c.tipo_contrato || "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{fmtDate(c.data_admissao)}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-foreground">{c.salario_base ? fmt(c.salario_base) : "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>{s.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-3">
                          <button onClick={() => {
                            setSelected(new Set([c.id]));
                            setTimeout(() => window.print(), 100);
                          }} title="Imprimir" className="text-muted-foreground hover:text-primary"><Printer size={15}/></button>
                          <button onClick={() => { setEditItem(c); setModalOpen(true); }} className="text-xs text-muted-foreground hover:text-foreground">Editar</button>
                          <button onClick={() => handleDelete(c.id)} className="text-xs text-red-400 hover:underline">Excluir</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <ColaboradorModal
          colaborador={editItem}
          onClose={() => { setModalOpen(false); setEditItem(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}