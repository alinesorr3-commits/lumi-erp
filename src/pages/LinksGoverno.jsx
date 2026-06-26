import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ExternalLink, Star, Plus, X, Globe, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const LINKS_PADRAO = [
  { nome: "Gov.br",                       url: "https://www.gov.br/",                                    categoria: "Federal",         descricao: "Portal do Governo Federal" },
  { nome: "e-CAC – Receita Federal",      url: "https://cav.receita.fazenda.gov.br/",                    categoria: "Federal",         descricao: "Centro Virtual de Atendimento" },
  { nome: "Conectividade Social – FGTS",  url: "https://conectividade.caixa.gov.br/",                    categoria: "Previdenciário",  descricao: "FGTS e transmissão SEFIP" },
  { nome: "Receita Federal",              url: "https://www.gov.br/receitafederal/",                      categoria: "Federal",         descricao: "Consultas e serviços fiscais" },
  { nome: "Portal NF-e",                  url: "https://www.nfe.fazenda.gov.br/",                         categoria: "Fiscal",          descricao: "Nota Fiscal Eletrônica" },
  { nome: "Portal CT-e",                  url: "https://www.cte.fazenda.gov.br/",                         categoria: "Fiscal",          descricao: "Conhecimento de Transporte Eletrônico" },
  { nome: "Portal MDF-e",                 url: "https://www.mdfe.fazenda.gov.br/",                        categoria: "Fiscal",          descricao: "Manifesto Eletrônico de Documentos Fiscais" },
  { nome: "CNDT – Certidão Trabalhista",  url: "https://cndt.tst.jus.br/",                               categoria: "Trabalhista",     descricao: "Certidão Negativa de Débitos Trabalhistas" },
  { nome: "Certidão FGTS (CND)",          url: "https://certificadofgts.caixa.gov.br/",                  categoria: "Previdenciário",  descricao: "Certidão de Regularidade do FGTS" },
  { nome: "Simples Nacional – DAS",       url: "https://www8.receita.fazenda.gov.br/simplesnacional/",    categoria: "Federal",         descricao: "Gestão do Simples Nacional" },
  { nome: "eSocial",                      url: "https://www.gov.br/esocial/",                             categoria: "Trabalhista",     descricao: "Sistema de escrituração digital" },
  { nome: "SPED / EFD",                   url: "https://www.gov.br/receitafederal/sped",                  categoria: "Fiscal",          descricao: "Escrituração Fiscal Digital" },
  { nome: "Junta Comercial Online",       url: "https://www.gov.br/empresas-e-negocios/junta-comercial", categoria: "Federal",         descricao: "Registro e alteração de empresas" },
  { nome: "Nota Fiscal Paulistana (SP)",  url: "https://nfe.prefeitura.sp.gov.br/",                       categoria: "Municipal",       descricao: "NFS-e do município de SP" },
  { nome: "Previdência Social (INSS)",    url: "https://meu.inss.gov.br/",                                categoria: "Previdenciário",  descricao: "Serviços do INSS" },
];

const CAT_COLOR = {
  "Federal":        "text-blue-400 bg-blue-400/10",
  "Estadual":       "text-blue-400 bg-blue-400/10",
  "Municipal":      "text-blue-400 bg-blue-400/10",
  "Previdenciário": "text-green-400 bg-green-400/10",
  "Fiscal":         "text-yellow-400 bg-yellow-400/10",
  "Trabalhista":    "text-yellow-400 bg-yellow-400/10",
  "Outro":          "text-muted-foreground bg-muted",
};

function LinkModal({ link, onClose, onSave }) {
  const [form, setForm] = useState({
    nome: link?.nome || "",
    url: link?.url || "",
    categoria: link?.categoria || "Federal",
    descricao: link?.descricao || "",
    empresa: link?.empresa || "",
    favorito: link?.favorito || false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">{link ? "Editar Link" : "Novo Link"}</h2>
          <button onClick={onClose}><X size={18} className="text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Nome *</label>
            <input required value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">URL *</label>
            <input required type="url" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              placeholder="https://"
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Categoria</label>
              <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                {Object.keys(CAT_COLOR).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Empresa</label>
              <input value={form.empresa} onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Descrição</label>
            <input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.favorito} onChange={e => setForm(f => ({ ...f, favorito: e.target.checked }))} />
            <span className="text-sm text-foreground flex items-center gap-1.5"><Star size={13} className="text-yellow-400" /> Marcar como favorito</span>
          </label>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-muted text-muted-foreground rounded-lg text-sm">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm disabled:opacity-50">
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LinksGoverno() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filtroCategoria, setFiltroCategoria] = useState("todos");
  const [importando, setImportando] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.LinkGoverno.list("nome");
    setLinks(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const importarPadrao = async () => {
    if (!confirm(`Importar ${LINKS_PADRAO.length} links governamentais padrão?`)) return;
    setImportando(true);
    for (const l of LINKS_PADRAO) {
      await base44.entities.LinkGoverno.create(l);
    }
    await load();
    setImportando(false);
    toast({ title: "✓ Links importados" });
  };

  const handleSave = async (data) => {
    if (editItem) await base44.entities.LinkGoverno.update(editItem.id, data);
    else await base44.entities.LinkGoverno.create(data);
    setModal(false);
    setEditItem(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir este link?")) return;
    await base44.entities.LinkGoverno.delete(id);
    load();
  };

  const toggleFavorito = async (link) => {
    await base44.entities.LinkGoverno.update(link.id, { favorito: !link.favorito });
    load();
  };

  const filtrados = links.filter(l => filtroCategoria === "todos" || l.categoria === filtroCategoria);
  const favoritos = filtrados.filter(l => l.favorito);
  const outros = filtrados.filter(l => !l.favorito);
  const categorias = [...new Set(links.map(l => l.categoria))];

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground flex items-center gap-2">
            <Globe size={24} className="text-primary" /> Acessos Governamentais
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Links rápidos para portais oficiais e sistemas fiscais</p>
        </div>
        <div className="flex items-center gap-2">
          {links.length === 0 && (
            <button onClick={importarPadrao} disabled={importando}
              className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg text-sm border border-border hover:bg-muted/70 disabled:opacity-50">
              {importando ? "Importando..." : "📥 Importar Padrão"}
            </button>
          )}
          <button onClick={() => { setEditItem(null); setModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
            <Plus size={16} /> Novo Link
          </button>
        </div>
      </div>

      {/* Filtro categoria */}
      {categorias.length > 0 && (
        <div className="flex gap-1 p-1 bg-muted rounded-lg mb-5 w-fit overflow-x-auto">
          <button onClick={() => setFiltroCategoria("todos")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filtroCategoria === "todos" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            Todos ({links.length})
          </button>
          {categorias.map(c => (
            <button key={c} onClick={() => setFiltroCategoria(c)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${filtroCategoria === c ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {c}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
      ) : links.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <Globe size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground text-sm mb-3">Nenhum link cadastrado</p>
          <button onClick={importarPadrao} disabled={importando} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
            {importando ? "Importando..." : "Importar Links Padrão"}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {favoritos.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Star size={12} className="text-yellow-400" /> Favoritos
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {favoritos.map(l => <LinkCard key={l.id} link={l} onEdit={() => { setEditItem(l); setModal(true); }} onDelete={() => handleDelete(l.id)} onToggleFav={() => toggleFavorito(l)} />)}
              </div>
            </div>
          )}
          {outros.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Todos os Links</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {outros.map(l => <LinkCard key={l.id} link={l} onEdit={() => { setEditItem(l); setModal(true); }} onDelete={() => handleDelete(l.id)} onToggleFav={() => toggleFavorito(l)} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {modal && <LinkModal link={editItem} onClose={() => { setModal(false); setEditItem(null); }} onSave={handleSave} />}
    </div>
  );
}

function LinkCard({ link, onEdit, onDelete, onToggleFav }) {
  const catStyle = CAT_COLOR[link.categoria] || CAT_COLOR["Outro"];
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 hover:border-primary/30 transition-all group">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{link.nome}</p>
          {link.descricao && <p className="text-xs text-muted-foreground mt-0.5 truncate">{link.descricao}</p>}
          {link.empresa && <p className="text-xs text-primary mt-0.5">{link.empresa}</p>}
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ml-2 flex-shrink-0 ${catStyle}`}>{link.categoria}</span>
      </div>
      <div className="flex items-center gap-2">
        <a href={link.url} target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors">
          <ExternalLink size={12} /> Acessar
        </a>
        <button onClick={onToggleFav} className={`p-2 rounded-lg transition-colors ${link.favorito ? "bg-yellow-400/10 text-yellow-400" : "bg-muted text-muted-foreground hover:text-yellow-400"}`}>
          <Star size={13} fill={link.favorito ? "currentColor" : "none"} />
        </button>
        <button onClick={onEdit} className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-foreground">
          <Globe size={13} />
        </button>
        <button onClick={onDelete} className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-red-400">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}