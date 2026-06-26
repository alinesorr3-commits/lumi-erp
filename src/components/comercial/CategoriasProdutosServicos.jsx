import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, X, Trash2, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

function CategoriaModal({ categoria, onClose, onSave }) {
  const [form, setForm] = useState({
    nome: categoria?.nome || "",
    tipo: categoria?.tipo || "Ambos",
    cnae_vinculos: categoria?.cnae_vinculos || [],
    descricao: categoria?.descricao || "",
    margem_padrao: categoria?.margem_padrao || 0,
    ativa: categoria?.ativa !== false,
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
      <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">{categoria ? "Editar" : "Nova"} Categoria</h2>
          <button onClick={onClose}><X size={18} className="text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Nome *</label>
            <input required value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Tipo</label>
            <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
              <option>Produto</option>
              <option>Serviço</option>
              <option>Ambos</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Margem Padrão (%)</label>
            <input type="number" step="0.01" value={form.margem_padrao} onChange={e => setForm(f => ({ ...f, margem_padrao: parseFloat(e.target.value) || 0 }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Descrição</label>
            <textarea rows="2" value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary resize-none" />
          </div>

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.ativa} onChange={e => setForm(f => ({ ...f, ativa: e.target.checked }))} className="cursor-pointer" />
            <span className="text-xs text-muted-foreground">Ativa</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-muted text-muted-foreground rounded-lg text-sm">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm disabled:opacity-50">
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CategoriasProdutosServicos() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.CategoriaProdutoServico.list("nome");
      setCategorias(data);
    } catch (err) {
      toast({ title: "✗ Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data) => {
    try {
      if (editItem) {
        await base44.entities.CategoriaProdutoServico.update(editItem.id, data);
      } else {
        await base44.entities.CategoriaProdutoServico.create(data);
      }
      setModal(false);
      setEditItem(null);
      load();
      toast({ title: "✓ Salvo" });
    } catch (err) {
      toast({ title: "✗ Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir?")) return;
    try {
      await base44.entities.CategoriaProdutoServico.delete(id);
      load();
    } catch (err) {
      toast({ title: "✗ Erro", description: err.message, variant: "destructive" });
    }
  };

  const filtered = categorias.filter(c => !search || c.nome.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-base font-semibold text-foreground">Categorias de Produtos/Serviços</h2>
        <button onClick={() => { setEditItem(null); setModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus size={16} /> Nova Categoria
        </button>
      </div>

      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar categoria..."
          className="w-full bg-card border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Nenhuma categoria encontrada</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="text-left text-xs text-muted-foreground px-4 py-3">Nome</th>
                  <th className="text-left text-xs text-muted-foreground px-4 py-3">Tipo</th>
                  <th className="text-right text-xs text-muted-foreground px-4 py-3">Margem %</th>
                  <th className="text-center text-xs text-muted-foreground px-4 py-3">Status</th>
                  <th className="text-right text-xs text-muted-foreground px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{c.nome}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.tipo}</td>
                    <td className="px-4 py-3 text-right text-sm text-foreground">{c.margem_padrao}%</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${c.ativa ? "bg-green-400/20 text-green-400" : "bg-muted text-muted-foreground"}`}>
                        {c.ativa ? "Ativa" : "Inativa"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setEditItem(c); setModal(true); }} className="text-xs text-muted-foreground hover:text-foreground">Editar</button>
                        <button onClick={() => handleDelete(c.id)} className="text-xs text-red-400 hover:underline">Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && <CategoriaModal categoria={editItem} onClose={() => { setModal(false); setEditItem(null); }} onSave={handleSave} />}
    </div>
  );
}