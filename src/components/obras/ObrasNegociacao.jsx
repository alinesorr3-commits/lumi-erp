import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { fmt } from "./ObrasUtils";
import { Plus, Filter, Download, Pencil, Trash2, HandCoins } from "lucide-react";

const FORMAS = ["Dinheiro", "PIX", "Transferência", "Cheque Próprio", "Cheque de Terceiro", "Boleto", "Permuta/Bem", "Crédito em Conta", "Outro"];
const CLASSIFICACOES = ["Recebimento", "Pagamento", "Permuta", "Adiantamento", "Medição", "Retenção"];
const TIPOS_REG = ["Gerencial", "Contábil", "Fiscal"];
const INTEGRACOES = ["Nenhuma", "Financeiro", "Estoque Próprio", "Revenda"];
const DESTINOS_BEM = ["Estoque Próprio", "Revenda Posterior", "Ativo Imobilizado", "N/A"];

function NegForm({ item, obras, onSave, onCancel }) {
  const [form, setForm] = useState({
    obra_id: item?.obra_id || "",
    obra_nome: item?.obra_nome || "",
    forma_recebimento: item?.forma_recebimento || "",
    classificacao: item?.classificacao || "",
    tipo_registro: item?.tipo_registro || "Gerencial",
    integracao: item?.integracao || "Nenhuma",
    destino_bem: item?.destino_bem || "N/A",
    descricao_bem: item?.descricao_bem || "",
    valor_bem: item?.valor_bem || "",
    data: item?.data || new Date().toISOString().slice(0, 10),
    descricao: item?.descricao || "",
    valor: item?.valor || "",
    terceiro: item?.terceiro || "",
    observacoes: item?.observacoes || "",
    cheque_agencia: item?.cheque_agencia || "",
    cheque_conta: item?.cheque_conta || "",
    cheque_emissor: item?.cheque_emissor || "",
  });
  const [saving, setSaving] = useState(false);

  const isPermuta = form.forma_recebimento === "Permuta/Bem" || form.classificacao === "Permuta";
  const isCheque = form.forma_recebimento === "Cheque Próprio" || form.forma_recebimento === "Cheque de Terceiro" || form.forma_recebimento === "Cheque";

  const handleObra = (id) => {
    const o = obras.find(o => o.id === id);
    setForm(f => ({ ...f, obra_id: id, obra_nome: o?.nome || "" }));
  };

  const inp = (field, type = "text") => ({
    type, value: form[field],
    onChange: e => setForm(f => ({ ...f, [field]: e.target.value })),
    className: "w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-yellow-500",
  });

  const sel = (field, options) => (
    <select value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
      className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-yellow-500">
      <option value="">Selecionar</option>
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ ...form, valor: parseFloat(form.valor) || 0, valor_bem: parseFloat(form.valor_bem) || 0 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 mb-5">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Obra Vinculada</label>
            <select value={form.obra_id} onChange={e => handleObra(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-yellow-500">
              <option value="">Sem vínculo</option>
              {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>
          </div>
          <div><label className="block text-xs text-muted-foreground mb-1.5">Forma de Recebimento *</label>{sel("forma_recebimento", FORMAS)}</div>
          <div><label className="block text-xs text-muted-foreground mb-1.5">Classificação da Operação</label>{sel("classificacao", CLASSIFICACOES)}</div>
          <div><label className="block text-xs text-muted-foreground mb-1.5">Tipo de Registro</label>{sel("tipo_registro", TIPOS_REG)}</div>
          <div><label className="block text-xs text-muted-foreground mb-1.5">Integração com</label>{sel("integracao", INTEGRACOES)}</div>
          <div><label className="block text-xs text-muted-foreground mb-1.5">Data</label><input {...inp("data", "date")} /></div>
          <div className="col-span-2"><label className="block text-xs text-muted-foreground mb-1.5">Descrição *</label><input required {...inp("descricao")} /></div>
          <div><label className="block text-xs text-muted-foreground mb-1.5">Valor (R$)</label><input {...inp("valor", "number")} step="0.01" /></div>
          <div><label className="block text-xs text-muted-foreground mb-1.5">Terceiro (nome/CPF/CNPJ)</label><input {...inp("terceiro")} /></div>
        </div>

        {/* Seção de Bem Negociado (Permuta) */}
        {isPermuta && (
          <div className="border border-yellow-500/30 rounded-xl p-4 mb-4 space-y-3">
            <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">Bem Negociado (Permuta)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Destino do Bem *</label>
                <select value={form.destino_bem} onChange={e => setForm(f => ({ ...f, destino_bem: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-yellow-500">
                  {DESTINOS_BEM.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Valor do Bem (R$)</label>
                <input type="number" step="0.01" value={form.valor_bem} onChange={e => setForm(f => ({ ...f, valor_bem: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-yellow-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-muted-foreground mb-1.5">Descrição do Bem</label>
                <input value={form.descricao_bem} onChange={e => setForm(f => ({ ...f, descricao_bem: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-yellow-500"
                  placeholder="Ex: Terreno 500m², Apartamento, Veículo..." />
              </div>
            </div>
            <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
              {form.destino_bem === "Estoque Próprio" && "✓ Bem será lançado no Estoque Próprio (Bens Recebidos) para controle de ativo."}
              {form.destino_bem === "Revenda Posterior" && "✓ Bem será registrado como item para revenda posterior com controle de margem."}
              {form.destino_bem === "Ativo Imobilizado" && "✓ Bem será incorporado ao ativo imobilizado da empresa."}
            </div>
          </div>
        )}

        {isCheque && (
          <div className="border border-blue-500/30 rounded-xl p-4 mb-4 space-y-3">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Dados do Cheque</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Agência</label>
                <input {...inp("cheque_agencia")} />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Conta</label>
                <input {...inp("cheque_conta")} />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Dados do Emissor</label>
                <input {...inp("cheque_emissor")} placeholder="Nome / CPF / CNPJ" />
              </div>
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-xs text-muted-foreground mb-1.5">Observações</label>
          <input value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-yellow-500" />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="px-6 py-2.5 bg-yellow-500/10 text-white rounded-lg text-sm font-medium hover:bg-yellow-400 disabled:opacity-50">{saving ? "Salvando..." : "Salvar"}</button>
          <button type="button" onClick={onCancel} className="px-6 py-2.5 bg-muted text-muted-foreground rounded-lg text-sm">Cancelar</button>
        </div>
      </form>
    </div>
  );
}

export default function ObrasNegociacao() {
  const [items, setItems] = useState([]);
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filtroObra, setFiltroObra] = useState("");
  const [filtroForma, setFiltroForma] = useState("");
  const [sincronizando, setSincronizando] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([base44.entities.NegociacaoObra.list("-data"), base44.entities.Obra.list()]).then(([n, o]) => {
      setItems(n); setObras(o); setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  const sincronizarBemRecebido = async (negociacaoId, negociacaoData) => {
    const isPermuta = negociacaoData.forma_recebimento === "Permuta/Bem" || negociacaoData.classificacao === "Permuta";
    if (!isPermuta || !negociacaoData.descricao_bem) return;

    const destinoParaCategoria = {
      "Estoque Próprio": "outro",
      "Revenda Posterior": "mercadoria",
      "Ativo Imobilizado": "outro",
    };

    const payload = {
      descricao: negociacaoData.descricao_bem,
      categoria: destinoParaCategoria[negociacaoData.destino_bem] || "outro",
      quantidade: 1,
      valor_avaliacao: parseFloat(negociacaoData.valor_bem) || 0,
      data_entrada: negociacaoData.data || new Date().toISOString().slice(0, 10),
      cliente_fornecedor: negociacaoData.terceiro || negociacaoData.obra_nome || "",
      contrato_origem_id: negociacaoId,
      contrato_origem_numero: negociacaoData.obra_nome ? `Obra: ${negociacaoData.obra_nome}` : "Negociação de Obra",
      classificacao_operacao: "Contrato Negociado",
      status: "em_estoque",
      ativo: true,
      observacoes: negociacaoData.observacoes || "",
    };

    const existentes = await base44.entities.BemRecebido.filter({ contrato_origem_id: negociacaoId });
    if (existentes.length > 0) {
      await base44.entities.BemRecebido.update(existentes[0].id, payload);
    } else {
      await base44.entities.BemRecebido.create({
        ...payload,
        historico: [{ acao: "Entrada via Negociação de Obra", data: new Date().toISOString(), dados: { obra: negociacaoData.obra_nome, destino: negociacaoData.destino_bem } }],
      });
    }
  };

  const handleSave = async (data) => {
    try {
      if (editItem) {
        await base44.entities.NegociacaoObra.update(editItem.id, data);
        await sincronizarBemRecebido(editItem.id, data);
      } else {
        const negociacao = await base44.entities.NegociacaoObra.create(data);
        await sincronizarBemRecebido(negociacao.id, data);
      }
      setShowForm(false); setEditItem(null); load();
    } catch (error) {
      alert("Erro ao salvar: " + error.message);
    }
  };

  const handleSincronizarTodos = async () => {
    if (!confirm("Isso vai sincronizar todas as negociações de permuta existentes com o módulo Bens Recebidos. Continuar?")) return;
    setSincronizando(true);
    try {
      let count = 0;
      for (const neg of items) {
        const isPermuta = neg.forma_recebimento === "Permuta/Bem" || neg.classificacao === "Permuta";
        if (isPermuta && neg.descricao_bem) {
          await sincronizarBemRecebido(neg.id, neg);
          count++;
        }
      }
      alert(`${count} bem(ns) sincronizado(s) com sucesso!`);
    } catch (error) {
      alert("Erro ao sincronizar: " + error.message);
    } finally {
      setSincronizando(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir este registro?")) return;
    await base44.entities.NegociacaoObra.delete(id);
    load();
  };

  const handleExport = () => {
    const rows = ["Obra;Forma;Classificação;Tipo;Data;Valor;Destino Bem;Terceiro"].concat(
      filtered.map(i => `${i.obra_nome || "s/v"};${i.forma_recebimento};${i.classificacao || ""};${i.tipo_registro};${i.data};${i.valor};${i.destino_bem || ""};${i.terceiro || ""}`)
    );
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "negociacoes.csv"; a.click();
  };

  const filtered = items
    .filter(i => !filtroObra || i.obra_id === filtroObra)
    .filter(i => !filtroForma || i.forma_recebimento === filtroForma);

  const totalGeral = filtered.reduce((s, i) => s + (i.valor || 0), 0);

  const formaBadge = (forma) => {
    if (forma === "Permuta/Bem") return "bg-yellow-400/10 text-yellow-400";
    if (forma === "PIX" || forma === "Transferência") return "bg-green-400/10 text-green-400";
    if (forma === "Boleto") return "bg-blue-400/10 text-blue-400";
    if (forma === "Cheque" || forma === "Cheque Próprio" || forma === "Cheque de Terceiro") return "bg-indigo-400/10 text-indigo-400";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-base font-semibold text-foreground">Formas de Negociação em Obras</h2>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 bg-muted text-muted-foreground rounded-lg text-sm hover:text-foreground"><Download size={14} /> Exportar</button>
          {/* <button onClick={handleSincronizarTodos} disabled={sincronizando} className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/10 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-500/20 disabled:opacity-50">
            <HandCoins size={14} /> {sincronizando ? "Sincronizando..." : "Sincronizar Bens"}
          </button> */}
          <button onClick={() => { setEditItem(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 text-white rounded-lg text-sm font-medium hover:bg-yellow-400">
            <Plus size={16} /> Novo Registro
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Filter size={13} className="text-muted-foreground" />
        <select value={filtroObra} onChange={e => setFiltroObra(e.target.value)} className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none">
          <option value="">Todas as obras</option>
          {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
        </select>
        <select value={filtroForma} onChange={e => setFiltroForma(e.target.value)} className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none">
          <option value="">Todas as formas</option>
          {FORMAS.map(f => <option key={f}>{f}</option>)}
        </select>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} registros · {fmt(totalGeral)}</span>
      </div>

      {(showForm || editItem) && (
        <NegForm item={editItem} obras={obras} onSave={handleSave} onCancel={() => { setShowForm(false); setEditItem(null); }} />
      )}

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground"><HandCoins size={32} className="mx-auto mb-3 opacity-50" /><p className="text-sm">Nenhuma negociação registrada</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(i => (
            <div key={i.id} className={`bg-card border rounded-xl p-5 ${i.forma_recebimento === "Permuta/Bem" ? "border-yellow-500/30" : "border-border"}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${formaBadge(i.forma_recebimento)}`}>{i.forma_recebimento}</span>
                    {i.classificacao && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{i.classificacao}</span>}
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{i.tipo_registro}</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{i.descricao}</p>
                  <p className="text-xs text-muted-foreground">{i.data}{i.obra_nome ? ` · ${i.obra_nome}` : " · Sem vínculo"}{i.terceiro ? ` · ${i.terceiro}` : ""}</p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-lg font-bold text-foreground">{fmt(i.valor)}</p>
                  {i.integracao !== "Nenhuma" && <p className="text-xs text-blue-400">{i.integracao}</p>}
                </div>
              </div>
              {i.forma_recebimento === "Permuta/Bem" && i.descricao_bem && (
                <div className="mt-2 p-2 bg-yellow-500/10/5 border border-yellow-500/20 rounded-lg">
                  <p className="text-xs text-yellow-400 font-medium">Bem: {i.descricao_bem}</p>
                  <p className="text-xs text-muted-foreground">Valor: {fmt(i.valor_bem)} · Destino: <span className="text-yellow-400">{i.destino_bem}</span></p>
                </div>
              )}
              {(i.forma_recebimento === "Cheque Próprio" || i.forma_recebimento === "Cheque de Terceiro" || i.forma_recebimento === "Cheque") && (i.cheque_agencia || i.cheque_conta || i.cheque_emissor) && (
                <div className="mt-2 p-2 bg-blue-500/10/5 border border-blue-500/20 rounded-lg">
                  <p className="text-xs text-blue-400 font-medium">Detalhes do Cheque</p>
                  <p className="text-xs text-muted-foreground">Agência: <span className="text-foreground">{i.cheque_agencia || "-"}</span> · Conta: <span className="text-foreground">{i.cheque_conta || "-"}</span> · Emissor: <span className="text-foreground">{i.cheque_emissor || "-"}</span></p>
                </div>
              )}
              {i.observacoes && <p className="text-xs text-muted-foreground mt-2 italic">{i.observacoes}</p>}
              <div className="flex gap-2 mt-3">
                <button onClick={() => { setEditItem(i); setShowForm(true); }} className="p-1 text-muted-foreground hover:text-foreground"><Pencil size={13} /></button>
                <button onClick={() => handleDelete(i.id)} className="p-1 text-red-400 hover:text-red-300"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}