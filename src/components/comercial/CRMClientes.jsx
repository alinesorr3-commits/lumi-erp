import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Users, X, Building2, User } from "lucide-react";
import ImportButton from "@/components/shared/ImportButton";

const statusConfig = {
  ativo: { label: "Ativo", color: "text-green-400", bg: "bg-green-400/10" },
  inativo: { label: "Inativo", color: "text-muted-foreground", bg: "bg-muted" },
  prospecto: { label: "Prospecto", color: "text-blue-400", bg: "bg-blue-400/10" },
};

function ClienteModal({ cliente, onClose, onSave }) {
  const [form, setForm] = useState({
    nome: cliente?.nome || "",
    tipo: cliente?.tipo || "PJ",
    cpf_cnpj: cliente?.cpf_cnpj || "",
    email: cliente?.email || "",
    telefone: cliente?.telefone || "",
    segmento: cliente?.segmento || "",
    responsavel: cliente?.responsavel || "",
    endereco: cliente?.endereco || "",
    cidade: cliente?.cidade || "",
    estado: cliente?.estado || "",
    status: cliente?.status || "ativo",
    observacoes: cliente?.observacoes || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card">
          <h2 className="text-base font-semibold text-foreground">{cliente ? "Editar Cliente" : "Novo Cliente"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex gap-2">
            {["PJ", "PF"].map(t => (
              <button key={t} type="button" onClick={() => setForm(f => ({ ...f, tipo: t }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
 ${form.tipo === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {t === "PJ" ? "Pessoa Jurídica" : "Pessoa Física"}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Nome / Razão Social *</label>
            <input required value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">{form.tipo === "PJ" ? "CNPJ" : "CPF"}</label>
              <input value={form.cpf_cnpj} onChange={e => setForm(f => ({ ...f, cpf_cnpj: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="prospecto">Prospecto</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">E-mail</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Telefone</label>
              <input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Segmento</label>
              <input value={form.segmento} onChange={e => setForm(f => ({ ...f, segmento: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" placeholder="Ex: Tecnologia" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Responsável</label>
              <input value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Endereço</label>
            <input value={form.endereco} onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Cidade</label>
              <input value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Estado</label>
              <input value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" placeholder="Ex: SP" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Observações</label>
            <textarea rows={2} value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm bg-muted text-muted-foreground">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm bg-primary text-primary-foreground disabled:opacity-50">
              {saving ? "Salvando..." : cliente ? "Salvar" : "Criar Cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CRMClientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.Cliente.list("-created_date");
    setClientes(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = clientes.filter(c =>
    c.nome?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.cpf_cnpj?.includes(search)
  );

  const handleSave = async (data) => {
    if (data.cpf_cnpj || data.nome) {
      const query = { $or: [] };
      if (data.cpf_cnpj) query.$or.push({ cpf_cnpj: data.cpf_cnpj });
      if (data.nome) query.$or.push({ nome: data.nome });
      
      if (query.$or.length > 0) {
        const existing = await base44.entities.Cliente.filter(query);
        const dup = existing.find(e => !editItem || e.id !== editItem.id);
        if (dup) {
          alert("Já existe um cliente/fornecedor cadastrado com este Nome ou CPF/CNPJ.");
          return;
        }
      }
    }

    if (editItem) {
      await base44.entities.Cliente.update(editItem.id, data);
    } else {
      await base44.entities.Cliente.create(data);
    }
    setModalOpen(false);
    setEditItem(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir este cliente?")) return;
    await base44.entities.Cliente.delete(id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar clientes..."
            className="bg-card border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary w-64"
          />
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
                      nome: { type: "string" },
                      cpf_cnpj: { type: "string" },
                      email: { type: "string" },
                      telefone: { type: "string" },
                      cidade: { type: "string" },
                      estado: { type: "string" },
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
                
                if (r.nome) {
                  await base44.entities.Cliente.create({
                    nome: r.nome,
                    tipo: (r.cpf_cnpj?.length > 14 || r.tipo === 'PJ') ? "PJ" : "PF",
                    cpf_cnpj: r.cpf_cnpj || "",
                    email: r.email || "",
                    telefone: r.telefone || "",
                    cidade: r.cidade || "",
                    estado: r.estado || "",
                    status: "ativo"
                  });
                }
              }
              load();
            }}
          />
          <button
            onClick={() => { setEditItem(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} /> Novo Cliente
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-muted rounded w-2/3 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-3 text-center py-16 text-muted-foreground">
            <Users size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nenhum cliente encontrado</p>
            <button onClick={() => { setEditItem(null); setModalOpen(true); }} className="mt-2 text-primary text-sm hover:underline">
              Cadastrar primeiro cliente
            </button>
          </div>
        ) : filtered.map(c => {
          const s = statusConfig[c.status] || statusConfig.ativo;
          return (
            <div key={c.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    {c.tipo === "PJ" ? <Building2 size={18} className="text-blue-400" /> : <User size={18} className="text-blue-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{c.nome}</p>
                    <p className="text-xs text-muted-foreground">{c.tipo} · {c.segmento || "Sem segmento"}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>{s.label}</span>
              </div>
              {c.email && <p className="text-xs text-muted-foreground mb-0.5">✉ {c.email}</p>}
              {c.telefone && <p className="text-xs text-muted-foreground mb-0.5">📞 {c.telefone}</p>}
              {c.cidade && <p className="text-xs text-muted-foreground">📍 {c.cidade}{c.estado ? ", " + c.estado : ""}</p>}
              <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                <button onClick={() => { setEditItem(c); setModalOpen(true); }} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Editar</button>
                <button onClick={() => handleDelete(c.id)} className="text-xs text-red-400 hover:underline">Excluir</button>
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <ClienteModal
          cliente={editItem}
          onClose={() => { setModalOpen(false); setEditItem(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}