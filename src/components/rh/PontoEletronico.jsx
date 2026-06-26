import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, X, Clock, CheckCircle2, AlertCircle, Printer } from "lucide-react";
import PrintButton from "@/components/shared/PrintButton";

const fmtDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "-";

const ocorrenciaConfig = {
  normal: { label: "Normal", color: "text-green-400", bg: "bg-green-400/10" },
  falta: { label: "Falta", color: "text-red-400", bg: "bg-red-400/10" },
  falta_justificada: { label: "Falta Justif.", color: "text-yellow-400", bg: "bg-yellow-400/10" },
  ferias: { label: "Férias", color: "text-blue-400", bg: "bg-blue-400/10" },
  feriado: { label: "Feriado", color: "text-blue-400", bg: "bg-blue-400/10" },
  afastamento: { label: "Afastamento", color: "text-yellow-400", bg: "bg-yellow-400/10" },
};

function calcHoras(entrada, saida, saidaAlmoco, retornoAlmoco) {
  const toMin = (t) => {
    if (!t) return 0;
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const total = toMin(saida) - toMin(entrada);
  const almoco = (retornoAlmoco && saidaAlmoco) ? toMin(retornoAlmoco) - toMin(saidaAlmoco) : 0;
  const horas = Math.max(0, total - almoco) / 60;
  return Math.round(horas * 100) / 100;
}

function PontoModal({ ponto, colaboradores, onClose, onSave }) {
  const [form, setForm] = useState({
    colaborador_id: ponto?.colaborador_id || "",
    colaborador_nome: ponto?.colaborador_nome || "",
    data: ponto?.data || new Date().toISOString().split("T")[0],
    entrada: ponto?.entrada || "",
    saida_almoco: ponto?.saida_almoco || "",
    retorno_almoco: ponto?.retorno_almoco || "",
    saida: ponto?.saida || "",
    ocorrencia: ponto?.ocorrencia || "normal",
    observacoes: ponto?.observacoes || "",
  });
  const [saving, setSaving] = useState(false);

  const horas = calcHoras(form.entrada, form.saida, form.saida_almoco, form.retorno_almoco);
  const extras = Math.max(0, horas - 8);

  const handleColaboradorChange = (id) => {
    const col = colaboradores.find(c => c.id === id);
    setForm(f => ({ ...f, colaborador_id: id, colaborador_nome: col?.nome || "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ ...form, horas_trabalhadas: horas, horas_extras: extras });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">{ponto ? "Editar Registro" : "Novo Registro de Ponto"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-muted-foreground mb-1.5">Colaborador *</label>
              <select required value={form.colaborador_id} onChange={e => handleColaboradorChange(e.target.value)}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                <option value="">Selecionar</option>
                {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Data *</label>
              <input required type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Ocorrência</label>
              <select value={form.ocorrencia} onChange={e => setForm(f => ({ ...f, ocorrencia: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                {Object.entries(ocorrenciaConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          {form.ocorrencia === "normal" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Entrada</label>
                <input type="time" value={form.entrada} onChange={e => setForm(f => ({ ...f, entrada: e.target.value }))}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Saída Almoço</label>
                <input type="time" value={form.saida_almoco} onChange={e => setForm(f => ({ ...f, saida_almoco: e.target.value }))}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Retorno Almoço</label>
                <input type="time" value={form.retorno_almoco} onChange={e => setForm(f => ({ ...f, retorno_almoco: e.target.value }))}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Saída</label>
                <input type="time" value={form.saida} onChange={e => setForm(f => ({ ...f, saida: e.target.value }))}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
            </div>
          )}

          {form.ocorrencia === "normal" && (form.entrada || form.saida) && (
            <div className="flex gap-3 p-3 bg-muted rounded-lg">
              <div className="text-center flex-1">
                <p className="text-xs text-muted-foreground">Horas Trabalhadas</p>
                <p className="text-lg font-bold text-foreground">{horas.toFixed(1)}h</p>
              </div>
              <div className="text-center flex-1">
                <p className="text-xs text-muted-foreground">Horas Extras</p>
                <p className={`text-lg font-bold ${extras > 0 ? "text-yellow-400" : "text-muted-foreground"}`}>{extras.toFixed(1)}h</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Observações</label>
            <textarea rows={2} value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm bg-muted text-muted-foreground">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm bg-primary text-primary-foreground disabled:opacity-50">
              {saving ? "Salvando..." : ponto ? "Salvar" : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PontoEletronico() {
  const [registros, setRegistros] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filtroColaborador, setFiltroColaborador] = useState("");
  const [filtroMes, setFiltroMes] = useState(new Date().toISOString().slice(0, 7));
  const [selected, setSelected] = useState(new Set());

  const load = async () => {
    setLoading(true);
    const [regs, cols] = await Promise.all([
      base44.entities.RegistroPonto.list("-data"),
      base44.entities.Colaborador.filter({ status: "ativo" }),
    ]);
    setRegistros(regs);
    setColaboradores(cols);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (data) => {
    try {
      if (editItem) {
        await base44.entities.RegistroPonto.update(editItem.id, data);
      } else {
        await base44.entities.RegistroPonto.create(data);
      }
      
      // Sincronização automática com a folha de pagamento
      const mes = data.data.substring(0, 7);
      const folhas = await base44.entities.Folha.filter({ 
        colaborador_id: data.colaborador_id, 
        mes_referencia: mes
      });
      
      if (folhas.length > 0) {
        const folha = folhas[0];
        if (folha.status === "rascunho") {
          const pontos = await base44.entities.RegistroPonto.filter({ colaborador_id: data.colaborador_id });
          const pontosMes = pontos.filter(p => p.data?.startsWith(mes));
          const totalExtrasHoras = pontosMes.reduce((s, p) => s + (p.horas_extras || 0), 0);
          const totalAtrasosFaltas = pontosMes.filter(p => p.ocorrencia === "falta").length * 8; // Assumindo 8h/falta
          
          const col = colaboradores.find(c => c.id === data.colaborador_id);
          if (col && col.salario_base) {
            const valorHoraExtra = (col.salario_base / 220) * 1.5;
            const horasExtrasValor = totalExtrasHoras * valorHoraExtra;
            
            await base44.entities.Folha.update(folha.id, {
              horas_extras_valor: parseFloat(horasExtrasValor.toFixed(2))
            });
            // Nota: O cálculo de impostos deve ser refeito na própria folha ou por automação
          }
        }
      }

      setModalOpen(false);
      setEditItem(null);
      load();
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar registro. Verifique as permissões ou se todos os campos estão preenchidos.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir este registro?")) return;
    await base44.entities.RegistroPonto.delete(id);
    load();
  };

  const filtered = registros.filter(r => {
    const matchCol = !filtroColaborador || r.colaborador_id === filtroColaborador;
    const matchMes = !filtroMes || r.data?.startsWith(filtroMes);
    return matchCol && matchMes;
  });

  const totalHoras = filtered.filter(r => r.ocorrencia === "normal").reduce((s, r) => s + (r.horas_trabalhadas || 0), 0);
  const totalExtras = filtered.reduce((s, r) => s + (r.horas_extras || 0), 0);
  const totalFaltas = filtered.filter(r => r.ocorrencia === "falta").length;

  const printItems = selected.size > 0 ? filtered.filter(r => selected.has(r.id)) : filtered;

  return (
    <div>
      {/* Relatório de Impressão (Fiel ao Padrão) */}
      <div className="hidden print:block w-full text-black font-sans">
        <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wider">Espelho de Ponto Eletrônico</h1>
            <p className="text-sm mt-1 text-gray-700">Competência: {filtroMes.split("-").reverse().join("/")}</p>
          </div>
          <div className="text-right text-sm text-gray-700">
            <p>Emitido em: {new Date().toLocaleDateString('pt-BR')}</p>
            <p>Colaborador(es): {filtroColaborador ? colaboradores.find(c => c.id === filtroColaborador)?.nome : "Todos"}</p>
          </div>
        </div>

        <div className="flex gap-8 mb-6 p-4 rounded-lg bg-gray-100 print:bg-gray-100 !print:bg-opacity-100" style={{ WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact' }}>
          <div>
            <p className="text-xs uppercase text-gray-600 font-semibold">Total de Horas</p>
            <p className="text-xl font-bold">{totalHoras.toFixed(1)}h</p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-600 font-semibold">Horas Extras</p>
            <p className="text-xl font-bold text-yellow-600">{totalExtras.toFixed(1)}h</p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-600 font-semibold">Faltas Registradas</p>
            <p className="text-xl font-bold text-red-600">{totalFaltas}</p>
          </div>
        </div>

        <table className="w-full border-collapse mt-4">
          <thead>
            <tr className="border-b-2 border-black bg-gray-100">
              <th className="py-2 px-2 text-left font-bold text-sm">Data</th>
              <th className="py-2 px-2 text-left font-bold text-sm">Colaborador</th>
              <th className="py-2 px-2 text-center font-bold text-sm">Entrada</th>
              <th className="py-2 px-2 text-center font-bold text-sm">S. Almoço</th>
              <th className="py-2 px-2 text-center font-bold text-sm">R. Almoço</th>
              <th className="py-2 px-2 text-center font-bold text-sm">Saída</th>
              <th className="py-2 px-2 text-center font-bold text-sm">Total</th>
              <th className="py-2 px-2 text-center font-bold text-sm">Extras</th>
              <th className="py-2 px-2 text-left font-bold text-sm pl-4">Ocorrência</th>
            </tr>
          </thead>
          <tbody>
            {printItems.map((r, idx) => (
              <tr key={r.id} className={`border-b border-gray-300 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50 print:bg-gray-50 !print:bg-opacity-100"}`} style={{ WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact' }}>
                <td className="py-2 px-2 text-left text-sm whitespace-nowrap">{fmtDate(r.data)}</td>
                <td className="py-2 px-2 text-left text-sm font-medium">{r.colaborador_nome}</td>
                <td className="py-2 px-2 text-center text-sm">{r.entrada || "-"}</td>
                <td className="py-2 px-2 text-center text-sm">{r.saida_almoco || "-"}</td>
                <td className="py-2 px-2 text-center text-sm">{r.retorno_almoco || "-"}</td>
                <td className="py-2 px-2 text-center text-sm">{r.saida || "-"}</td>
                <td className="py-2 px-2 text-center text-sm font-bold">{r.horas_trabalhadas?.toFixed(1) || "-"}h</td>
                <td className="py-2 px-2 text-center text-sm font-bold text-yellow-600">{(r.horas_extras || 0) > 0 ? `+${r.horas_extras.toFixed(1)}h` : "-"}</td>
                <td className="py-2 px-2 text-left text-sm pl-4 uppercase">{r.ocorrencia}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="mt-12 pt-8 border-t border-gray-300 flex justify-around">
          <div className="text-center w-64">
            <div className="border-b border-black mb-2"></div>
            <p className="text-sm font-semibold">Assinatura do Colaborador</p>
          </div>
          <div className="text-center w-64">
            <div className="border-b border-black mb-2"></div>
            <p className="text-sm font-semibold">Responsável / RH</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 flex-wrap gap-3 print:hidden">
        <div className="flex items-center gap-2 flex-wrap">
          <input type="month" value={filtroMes} onChange={e => setFiltroMes(e.target.value)}
            className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
          <select value={filtroColaborador} onChange={e => setFiltroColaborador(e.target.value)}
            className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
            <option value="">Todos colaboradores</option>
            {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <>
              <button onClick={async () => {
                if(!confirm(`Excluir ${selected.size} registro(s)?`)) return;
                for(let id of selected) await base44.entities.RegistroPonto.delete(id);
                setSelected(new Set());
                load();
              }} className="px-3 py-2 bg-red-500/10/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/10/30">
                Excluir {selected.size}
              </button>
              <span className="text-xs text-muted-foreground mr-2">{selected.size} selecionado(s)</span>
            </>
          )}
          <PrintButton label={selected.size > 0 ? `Imprimir Selecionados (${selected.size})` : "Imprimir Ponto"} />
          <button onClick={() => { setEditItem(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
            <Plus size={16} /> Registrar Ponto
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-5 print:hidden">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Total de Horas</p>
          <p className="text-xl font-bold text-foreground">{totalHoras.toFixed(1)}h</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Horas Extras</p>
          <p className="text-xl font-bold text-yellow-400">{totalExtras.toFixed(1)}h</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Faltas</p>
          <p className="text-xl font-bold text-red-400">{totalFaltas}</p>
        </div>
      </div>

      <div className={`bg-card border border-border rounded-xl overflow-hidden print:hidden`}>
        {loading ? <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
          : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock size={28} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum registro encontrado</p>
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
                          else setSelected(new Set(filtered.map(f => f.id)));
                        }}
                        className="cursor-pointer" />
                    </th>
                    <th className="text-left text-xs text-muted-foreground px-4 py-3">Colaborador</th>
                    <th className="text-left text-xs text-muted-foreground px-4 py-3">Data</th>
                    <th className="text-left text-xs text-muted-foreground px-4 py-3">Entrada</th>
                    <th className="text-left text-xs text-muted-foreground px-4 py-3">Saída</th>
                    <th className="text-center text-xs text-muted-foreground px-4 py-3">Horas</th>
                    <th className="text-center text-xs text-muted-foreground px-4 py-3">Extras</th>
                    <th className="text-left text-xs text-muted-foreground px-4 py-3">Ocorrência</th>
                    <th className="text-right text-xs text-muted-foreground px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => {
                    const oc = ocorrenciaConfig[r.ocorrencia] || ocorrenciaConfig.normal;
                    return (
                      <tr key={r.id} className={`border-b border-border/50 transition-colors ${selected.has(r.id) ? "bg-primary/10" : "hover:bg-muted/30"} ${!selected.has(r.id) ? "unselected-row" : ""}`}>
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={selected.has(r.id)} onChange={() => {
                            const newSet = new Set(selected);
                            if (newSet.has(r.id)) newSet.delete(r.id);
                            else newSet.add(r.id);
                            setSelected(newSet);
                          }} className="cursor-pointer" />
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-foreground">{r.colaborador_nome}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{fmtDate(r.data)}</td>
                        <td className="px-4 py-3 text-sm text-foreground font-mono">{r.entrada || "—"}</td>
                        <td className="px-4 py-3 text-sm text-foreground font-mono">{r.saida || "—"}</td>
                        <td className="px-4 py-3 text-center text-sm font-semibold text-foreground">{r.horas_trabalhadas?.toFixed(1) || "—"}h</td>
                        <td className="px-4 py-3 text-center text-sm font-semibold text-yellow-400">{(r.horas_extras || 0) > 0 ? `+${r.horas_extras.toFixed(1)}h` : "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${oc.bg} ${oc.color}`}>{oc.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-3">
                            <button onClick={() => {
                              setSelected(new Set([r.id]));
                              setTimeout(() => window.print(), 100);
                            }} title="Imprimir" className="text-muted-foreground hover:text-primary"><Printer size={15}/></button>
                            <button onClick={() => { setEditItem(r); setModalOpen(true); }} className="text-xs text-muted-foreground hover:text-foreground">Editar</button>
                            <button onClick={() => handleDelete(r.id)} className="text-xs text-red-400 hover:underline">Excluir</button>
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
        <PontoModal
          ponto={editItem}
          colaboradores={colaboradores}
          onClose={() => { setModalOpen(false); setEditItem(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}