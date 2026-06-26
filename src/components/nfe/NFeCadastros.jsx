import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Pencil, Trash2, Package, Truck, User, Car, Building2, Search, Lock, Upload } from "lucide-react";
import VeiculosFrota from "@/components/veiculos/VeiculosFrota";
import CertificadoA1 from "./CertificadoA1";
import ImportarProdutos from "./ImportarProdutos";
import SugestorIA from "./SugestorIA";
import ParecerIA from "@/components/shared/ParecerIA";

const inp = (value, onChange, extra = {}) => ({
  value: value || "",
  onChange: e => onChange(e.target.value),
  className: "w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary",
  ...extra,
});

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function EmpresasTab() {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => { base44.entities.EmpresaCliente.list().then(setItems); }, []);

  const save = async (e) => {
    e.preventDefault();
    if (edit) await base44.entities.EmpresaCliente.update(edit.id, form);
    else await base44.entities.EmpresaCliente.create(form);
    setModal(false); setEdit(null);
    base44.entities.EmpresaCliente.list().then(setItems);
  };

  const openNew = () => {
    setForm({ razao_social: "", cnpj: "", regime_tributario: "Simples Nacional", ambiente_nfe: "Homologação", status: "Ativo" });
    setEdit(null); setModal(true);
  };
  const openEdit = (item) => { setForm({ ...item }); setEdit(item); setModal(true); };
  const del = async (id) => { if (!confirm("Excluir?")) return; await base44.entities.EmpresaCliente.delete(id); base44.entities.EmpresaCliente.list().then(setItems); };
  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-foreground">Empresas Emitentes</h3>
        <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs hover:bg-primary/90">
          <Plus size={12} /> Nova Empresa
        </button>
      </div>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
            <div>
              <p className="text-sm font-medium text-foreground">{item.razao_social}</p>
              <p className="text-xs text-muted-foreground">{item.cnpj} · {item.regime_tributario} · {item.municipio}/{item.uf}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${item.ambiente_nfe === "Produção" ? "bg-green-400/10 text-green-400" : "bg-yellow-400/10 text-yellow-400"}`}>{item.ambiente_nfe}</span>
              <button onClick={() => openEdit(item)} className="p-1 text-muted-foreground hover:text-foreground"><Pencil size={13} /></button>
              <button onClick={() => del(item.id)} className="p-1 text-red-400 hover:text-red-300"><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma empresa cadastrada</p>}
      </div>
      {modal && (
        <Modal title={edit ? "Editar Empresa" : "Nova Empresa"} onClose={() => setModal(false)}>
          <form onSubmit={save} className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="block text-xs text-muted-foreground mb-1">Razão Social *</label><input required {...inp(form.razao_social, v => f("razao_social", v))} /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">CNPJ *</label><input required {...inp(form.cnpj, v => f("cnpj", v))} placeholder="00.000.000/0001-00" /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">Insc. Estadual</label><input {...inp(form.inscricao_estadual, v => f("inscricao_estadual", v))} /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">Insc. Municipal</label><input {...inp(form.inscricao_municipal, v => f("inscricao_municipal", v))} /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">Cód. IBGE Município</label><input {...inp(form.codigo_municipio_ibge, v => f("codigo_municipio_ibge", v))} placeholder="5103403" /></div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Regime Tributário</label>
              <select value={form.regime_tributario || "Simples Nacional"} onChange={e => f("regime_tributario", e.target.value)} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                {["Simples Nacional", "Lucro Presumido", "Lucro Real", "MEI"].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Ambiente NF-e</label>
              <select value={form.ambiente_nfe || "Homologação"} onChange={e => f("ambiente_nfe", e.target.value)} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                <option>Homologação</option><option>Produção</option>
              </select>
            </div>
            <div><label className="block text-xs text-muted-foreground mb-1">E-mail</label><input type="email" {...inp(form.email, v => f("email", v))} /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">Telefone</label><input {...inp(form.telefone, v => f("telefone", v))} /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">Município</label><input {...inp(form.municipio, v => f("municipio", v))} /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">UF</label><input maxLength={2} {...inp(form.uf, v => f("uf", v))} /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">Validade Certificado</label><input type="date" {...inp(form.certificado_validade, v => f("certificado_validade", v))} /></div>
            <div className="col-span-2 flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(false)} className="flex-1 py-2 bg-muted text-muted-foreground rounded-lg text-sm">Cancelar</button>
              <button type="submit" className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm">Salvar</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function ProdutosTab() {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({});
  const [search, setSearch] = useState("");
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => { base44.entities.ProdutoServico.list().then(setItems); }, []);

  const save = async (e) => {
    e.preventDefault();
    if (edit) await base44.entities.ProdutoServico.update(edit.id, form);
    else await base44.entities.ProdutoServico.create(form);
    setModal(false); setEdit(null);
    base44.entities.ProdutoServico.list().then(setItems);
  };
  const openNew = () => { setForm({ tipo: "Produto", unidade: "UN", aliq_icms: 12, aliq_pis: 0.65, aliq_cofins: 3, ativo: true }); setEdit(null); setModal(true); };
  const openEdit = (item) => { setForm({ ...item }); setEdit(item); setModal(true); };
  const del = async (id) => { if (!confirm("Excluir?")) return; await base44.entities.ProdutoServico.delete(id); base44.entities.ProdutoServico.list().then(setItems); };
  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const filtered = items.filter(i => !search || i.descricao?.toLowerCase().includes(search.toLowerCase()) || i.codigo?.includes(search));

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-foreground">Produtos e Serviços</h3>
        <div className="flex gap-2">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
              className="bg-card border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary w-40" />
          </div>
          <button onClick={() => setImportOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-white rounded-lg text-xs hover:bg-blue-600 transition-colors">
            <Upload size={12} /> Importar
          </button>
          <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs hover:bg-primary/90">
            <Plus size={12} /> Novo
          </button>
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-border">
            {["Cód", "Descrição", "Tipo", "Unidade", "NCM", "CFOP", "Preço Venda", "ICMS%", "Ações"].map(h => (
              <th key={h} className="text-left text-xs text-muted-foreground px-3 py-2">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item.id} className="border-b border-border/50 hover:bg-muted/20">
                <td className="px-3 py-2 text-xs font-mono text-muted-foreground">{item.codigo || "—"}</td>
                <td className="px-3 py-2 text-sm text-foreground">{item.descricao}</td>
                <td className="px-3 py-2"><span className={`text-xs px-1.5 py-0.5 rounded ${item.tipo === "Serviço" ? "bg-blue-400/10 text-blue-400" : "bg-blue-400/10 text-blue-400"}`}>{item.tipo}</span></td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{item.unidade}</td>
                <td className="px-3 py-2 text-xs font-mono text-muted-foreground">{item.ncm || "—"}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{item.cfop_saida || "—"}</td>
                <td className="px-3 py-2 text-sm font-medium text-foreground">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.preco_venda || 0)}</td>
                <td className="px-3 py-2 text-xs text-yellow-400">{item.aliq_icms || 0}%</td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(item)} className="p-1 text-muted-foreground hover:text-foreground"><Pencil size={12} /></button>
                    <button onClick={() => del(item.id)} className="p-1 text-red-400 hover:text-red-300"><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={9} className="text-center py-8 text-sm text-muted-foreground">Nenhum produto cadastrado</td></tr>}
          </tbody>
        </table>
      </div>

      {importOpen && (
        <Modal title="Importar Produtos com Análise de IA" onClose={() => { setImportOpen(false); base44.entities.ProdutoServico.list().then(setItems); }}>
          <ImportarProdutos onImportSuccess={() => base44.entities.ProdutoServico.list().then(setItems)} />
        </Modal>
      )}

      {filtered.length > 0 && (
        <div className="mt-4">
          <div className="mb-4">
            <ParecerIA 
              title="Otimização de Precificação e Margem"
              prompt={`Analise a seguinte lista de produtos cadastrados e forneça parecer sobre estratégia de preços e margens:

${JSON.stringify(filtered.map(p => ({ codigo: p.codigo, descricao: p.descricao, tipo: p.tipo, custo: p.preco_custo, venda: p.preco_venda, icms: p.aliq_icms, margem: p.preco_venda > 0 ? (((p.preco_venda - p.preco_custo) / p.preco_venda) * 100).toFixed(1) : 0 })), null, 2)}

Análise: 1) Competitividade de preços por tipo de produto, 2) Margens adequadas, 3) Impacto de alíquotas (ICMS/PIS/COFINS), 4) Recomendações de ajuste por categoria, 5) Potencial de receita incremental`}
            />
          </div>
        </div>
      )}

      {modal && (
        <Modal title={edit ? "Editar Produto/Serviço" : "Novo Produto/Serviço"} onClose={() => setModal(false)}>
          <form onSubmit={save} className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Tipo</label>
              <select value={form.tipo || "Produto"} onChange={e => f("tipo", e.target.value)} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none">
                <option>Produto</option><option>Serviço</option>
              </select>
            </div>
            <div><label className="block text-xs text-muted-foreground mb-1">Código</label><input {...inp(form.codigo, v => f("codigo", v))} /></div>
            <div className="col-span-2"><label className="block text-xs text-muted-foreground mb-1">Descrição *</label><input required {...inp(form.descricao, v => f("descricao", v))} /></div>
            <div className="col-span-2">
              <SugestorIA descricao={form.descricao} tipo={form.tipo} onSuggestion={(sugg) => {
                f("ncm", sugg.ncm_sugerido);
                f("cfop_saida", sugg.cfop_sugerido);
                f("aliq_icms", sugg.icms_percentual);
              }} />
            </div>
            <div><label className="block text-xs text-muted-foreground mb-1">NCM</label><input {...inp(form.ncm, v => f("ncm", v))} placeholder="00000000" /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">CFOP Saída</label><input {...inp(form.cfop_saida, v => f("cfop_saida", v))} placeholder="5102" /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">Unidade</label><input {...inp(form.unidade, v => f("unidade", v))} placeholder="UN" /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">CST/CSOSN</label><input {...inp(form.cst_icms, v => f("cst_icms", v))} placeholder="400" /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">Preço de Venda (R$)</label><input type="number" step="0.01" {...inp(form.preco_venda, v => f("preco_venda", parseFloat(v) || 0))} /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">Preço de Custo (R$)</label><input type="number" step="0.01" {...inp(form.preco_custo, v => f("preco_custo", parseFloat(v) || 0))} /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">Alíq. ICMS (%)</label><input type="number" step="0.01" {...inp(form.aliq_icms, v => f("aliq_icms", parseFloat(v) || 0))} /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">Alíq. PIS (%)</label><input type="number" step="0.01" {...inp(form.aliq_pis, v => f("aliq_pis", parseFloat(v) || 0))} /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">Alíq. COFINS (%)</label><input type="number" step="0.01" {...inp(form.aliq_cofins, v => f("aliq_cofins", parseFloat(v) || 0))} /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">Alíq. IPI (%)</label><input type="number" step="0.01" {...inp(form.aliq_ipi, v => f("aliq_ipi", parseFloat(v) || 0))} /></div>
            {form.tipo === "Serviço" && <>
              <div><label className="block text-xs text-muted-foreground mb-1">Código Serviço LC116</label><input {...inp(form.codigo_servico_lc116, v => f("codigo_servico_lc116", v))} /></div>
              <div><label className="block text-xs text-muted-foreground mb-1">Alíq. ISS (%)</label><input type="number" step="0.01" {...inp(form.aliq_iss, v => f("aliq_iss", parseFloat(v) || 0))} /></div>
            </>}
            <div className="col-span-2 flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(false)} className="flex-1 py-2 bg-muted text-muted-foreground rounded-lg text-sm">Cancelar</button>
              <button type="submit" className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm">Salvar</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function TransportadorasTab() {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => { base44.entities.Transportadora.list().then(setItems); }, []);

  const save = async (e) => {
    e.preventDefault();
    if (edit) await base44.entities.Transportadora.update(edit.id, form);
    else await base44.entities.Transportadora.create(form);
    setModal(false); setEdit(null);
    base44.entities.Transportadora.list().then(setItems);
  };
  const openNew = () => { setForm({ ativo: true }); setEdit(null); setModal(true); };
  const openEdit = (item) => { setForm({ ...item }); setEdit(item); setModal(true); };
  const del = async (id) => { if (!confirm("Excluir?")) return; await base44.entities.Transportadora.delete(id); base44.entities.Transportadora.list().then(setItems); };
  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div>
      <div className="flex justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Transportadoras</h3>
        <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs hover:bg-primary/90"><Plus size={12} /> Nova</button>
      </div>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
            <div>
              <p className="text-sm font-medium text-foreground">{item.razao_social}</p>
              <p className="text-xs text-muted-foreground">{item.cnpj_cpf} · {item.municipio}/{item.uf}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(item)} className="p-1 text-muted-foreground hover:text-foreground"><Pencil size={13} /></button>
              <button onClick={() => del(item.id)} className="p-1 text-red-400 hover:text-red-300"><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-center py-8 text-sm text-muted-foreground">Nenhuma transportadora cadastrada</p>}
      </div>
      {modal && (
        <Modal title={edit ? "Editar Transportadora" : "Nova Transportadora"} onClose={() => setModal(false)}>
          <form onSubmit={save} className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="block text-xs text-muted-foreground mb-1">Razão Social *</label><input required {...inp(form.razao_social, v => f("razao_social", v))} /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">CNPJ/CPF *</label><input required {...inp(form.cnpj_cpf, v => f("cnpj_cpf", v))} /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">Insc. Estadual</label><input {...inp(form.inscricao_estadual, v => f("inscricao_estadual", v))} /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">E-mail</label><input type="email" {...inp(form.email, v => f("email", v))} /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">Telefone</label><input {...inp(form.telefone, v => f("telefone", v))} /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">Município</label><input {...inp(form.municipio, v => f("municipio", v))} /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">UF</label><input maxLength={2} {...inp(form.uf, v => f("uf", v))} /></div>
            <div className="col-span-2 flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(false)} className="flex-1 py-2 bg-muted text-muted-foreground rounded-lg text-sm">Cancelar</button>
              <button type="submit" className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm">Salvar</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function MotoristasTab() {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => { base44.entities.Motorista.list().then(setItems); }, []);

  const save = async (e) => {
    e.preventDefault();
    if (edit) await base44.entities.Motorista.update(edit.id, form);
    else await base44.entities.Motorista.create(form);
    setModal(false); setEdit(null);
    base44.entities.Motorista.list().then(setItems);
  };
  const openNew = () => { setForm({ categoria_cnh: "E", ativo: true }); setEdit(null); setModal(true); };
  const openEdit = (item) => { setForm({ ...item }); setEdit(item); setModal(true); };
  const del = async (id) => { if (!confirm("Excluir?")) return; await base44.entities.Motorista.delete(id); base44.entities.Motorista.list().then(setItems); };
  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div>
      <div className="flex justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Motoristas</h3>
        <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs hover:bg-primary/90"><Plus size={12} /> Novo</button>
      </div>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
            <div>
              <p className="text-sm font-medium text-foreground">{item.nome}</p>
              <p className="text-xs text-muted-foreground">CPF: {item.cpf} · CNH: {item.cnh} ({item.categoria_cnh}) · Val: {item.validade_cnh || "—"}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(item)} className="p-1 text-muted-foreground hover:text-foreground"><Pencil size={13} /></button>
              <button onClick={() => del(item.id)} className="p-1 text-red-400 hover:text-red-300"><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-center py-8 text-sm text-muted-foreground">Nenhum motorista cadastrado</p>}
      </div>
      {modal && (
        <Modal title={edit ? "Editar Motorista" : "Novo Motorista"} onClose={() => setModal(false)}>
          <form onSubmit={save} className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="block text-xs text-muted-foreground mb-1">Nome *</label><input required {...inp(form.nome, v => f("nome", v))} /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">CPF *</label><input required {...inp(form.cpf, v => f("cpf", v))} /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">CNH</label><input {...inp(form.cnh, v => f("cnh", v))} /></div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Categoria CNH</label>
              <select value={form.categoria_cnh || "E"} onChange={e => f("categoria_cnh", e.target.value)} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none">
                {["A","B","C","D","E","AB","AC","AD","AE"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="block text-xs text-muted-foreground mb-1">Validade CNH</label><input type="date" {...inp(form.validade_cnh, v => f("validade_cnh", v))} /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">Telefone</label><input {...inp(form.telefone, v => f("telefone", v))} /></div>
            <div className="col-span-2 flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(false)} className="flex-1 py-2 bg-muted text-muted-foreground rounded-lg text-sm">Cancelar</button>
              <button type="submit" className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm">Salvar</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function VeiculosTab() {
  return <VeiculosFrota />;
}

const TABS = [
  { key: "empresas", label: "Empresas", icon: Building2 },
  { key: "certificados", label: "Certificados A1", icon: Lock },
  { key: "produtos", label: "Produtos/Serviços", icon: Package },
  { key: "transportadoras", label: "Transportadoras", icon: Truck },
  { key: "motoristas", label: "Motoristas", icon: User },
  { key: "veiculos", label: "Veículos", icon: Car },
];

export default function NFeCadastros() {
  const [tab, setTab] = useState("empresas");

  return (
    <div>
      <div className="flex gap-1 p-1 bg-muted rounded-lg mb-5 w-fit overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap
 ${tab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              <Icon size={12} /> {t.label}
            </button>
          );
        })}
      </div>
      {tab === "empresas" && <EmpresasTab />}
      {tab === "certificados" && <CertificadoA1 />}
      {tab === "produtos" && <ProdutosTab />}
      {tab === "transportadoras" && <TransportadorasTab />}
      {tab === "motoristas" && <MotoristasTab />}
      {tab === "veiculos" && <VeiculosTab />}
    </div>
  );
}