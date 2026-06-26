import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import ParecerIA from "@/components/shared/ParecerIA";
import ReactMarkdown from "react-markdown";

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-3xl shadow-2xl max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

const inp = (value, onChange, extra = {}) => ({
  value: value || "",
  onChange: e => onChange(e.target.value),
  className: "w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary",
  ...extra,
});

export default function PrecificacaoIndustrial({ lancamentos = [] }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    produto: "",
    uf_origem: "MT",
    uf_destino: "MT",
    tipo_precificacao: "industrial",
    finalidade: "industrializacao",
    estoque_atual: 0,
    estoque_minimo: 0,
    custos: {
      materia_prima: 0,
      mao_obra: 0,
      custos_indiretos: 0,
      energia: 0,
      frete: 0,
      comissao: 0,
      equipamentos: 0,
      manutencao: 0,
      perdas: 0,
      overhead: 0,
      tributos: 0,
    },
    tributacao: {
      simples_nacional: 0,
      icms: 0,
      difal: 0,
      fcp: 0,
      st: 0,
      ipi: 0,
      pis_cofins: 0,
      margem_liquida: 0,
    },
    observacoes: "",
  });
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(null);
  const [fichas, setFichas] = useState([]);

  useEffect(() => {
    base44.entities.ConfigEncargos.list().then(list => {
      if (list.length > 0) setConfig(list.find(c => c.ativa) || list[0]);
    });
    base44.entities.FichaTecnica.filter({ ativa: true }).then(setFichas);
  }, []);

  const handleSelectFicha = (fichaId) => {
    const ficha = fichas.find(f => f.id === fichaId);
    if (!ficha) return;

    const custoMateriaPrima = (ficha.insumos || []).reduce((acc, ins) => acc + ((ins.quantidade_por_unidade || 0) * (ins.custo_unitario || 0)), 0);

    setForm(prev => ({
      ...prev,
      produto: ficha.produto_descricao || prev.produto,
      custos: {
        ...prev.custos,
        materia_prima: custoMateriaPrima,
        mao_obra: ficha.custo_mao_obra || prev.custos.mao_obra,
        overhead: ficha.custo_overhead || prev.custos.overhead,
      }
    }));
  };

  const f = (path, value) => {
    const keys = path.split(".");
    setForm(prev => {
      if (keys.length === 1) return { ...prev, [path]: value };
      const copy = { ...prev };
      copy[keys[0]] = { ...copy[keys[0]], [keys[1]]: value };
      return copy;
    });
  };

  const calcularCustoTotal = () => {
    return Object.values(form.custos).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  };

  const calcularPrecos = async () => {
    setLoading(true);
    const custoTotal = calcularCustoTotal();
    const icms = parseFloat(form.tributacao.icms) || 0;
    const ipi = parseFloat(form.tributacao.ipi) || 0;
    const pisCofins = parseFloat(form.tributacao.pis_cofins) || 0;
    const margem = parseFloat(form.tributacao.margem_liquida) || 20;

    // Cenário MÍNIMO: cobre custos + tributos, sem margem
    const precoMinimo = custoTotal / (1 - (icms + ipi + pisCofins) / 100);

    // Cenário IDEAL: cobre custos + tributos + margem desejada
    const precoIdeal = (custoTotal / (1 - (icms + ipi + pisCofins) / 100)) * (1 + margem / 100);

    // Cenário BOM: margem de 35% (2x do ideal)
    const precoBom = (custoTotal / (1 - (icms + ipi + pisCofins) / 100)) * (1 + 35 / 100);

    const res = {
      custoTotal,
      precos: {
        minimo: Math.ceil(precoMinimo * 100) / 100,
        ideal: Math.ceil(precoIdeal * 100) / 100,
        bom: Math.ceil(precoBom * 100) / 100,
      },
      margensEsperadas: {
        minimo: 0,
        ideal: margem,
        bom: 35,
      },
    };

    // Parecer IA opcional
    try {
      const parecer = await base44.integrations.Core.InvokeLLM({
        prompt: `Atue como um consultor financeiro especialista em precificação industrial.
Faça uma análise MUITO DETALHADA sobre os seguintes cenários de precificação:

Produto: ${form.produto}
Custo Total: R$ ${custoTotal.toFixed(2)}
ICMS: ${icms}% | IPI: ${ipi}% | PIS/COFINS: ${pisCofins}%
Margem Alvo (Ideal): ${margem}%

Cenários:
1. Preço Mínimo (sem margem, cobre apenas custos e tributos): R$ ${res.precos.minimo.toFixed(2)}
2. Preço Ideal (${margem}% de margem): R$ ${res.precos.ideal.toFixed(2)}
3. Preço Bom (35% de margem): R$ ${res.precos.bom.toFixed(2)}

Estruture o parecer usando Markdown, dividindo em tópicos como Análise de Viabilidade, Riscos de Mercado e Recomendação Final (qual cenário adotar e por quê). Seja aprofundado.`,
      });
      res.parecer = parecer;
    } catch (e) {
      console.log("Parecer IA opcional");
    }

    setResultado(res);
    setLoading(false);
  };

  const salvar = async (e) => {
    e.preventDefault();
    if (!form.produto) {
      alert("Informe o produto");
      return;
    }
    if (!resultado) {
      await calcularPrecos();
      return;
    }
    // TODO: salvar resultado em banco
    setModal(false);
    setForm({
      produto: "",
      uf_origem: "MT",
      uf_destino: "MT",
      tipo_precificacao: "industrial",
      finalidade: "industrializacao",
      estoque_atual: 0,
      estoque_minimo: 0,
      custos: {
        materia_prima: 0,
        mao_obra: 0,
        custos_indiretos: 0,
        energia: 0,
        frete: 0,
        comissao: 0,
        equipamentos: 0,
        manutencao: 0,
        perdas: 0,
        overhead: 0,
        tributos: 0,
      },
      tributacao: {
        simples_nacional: 0,
        icms: 0,
        difal: 0,
        fcp: 0,
        st: 0,
        ipi: 0,
        pis_cofins: 0,
        margem_liquida: 20,
      },
      observacoes: "",
    });
    setResultado(null);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-semibold text-foreground">Precificação Industrial, Fiscal e Logística</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">Preço ideal para pré-moldados, estruturas metálicas, outros serviços e revenda</p>

      <button
        onClick={() => setModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        <Plus size={14} /> Nova Precificação
      </button>

      {modal && (
        <Modal title="Calcular Precificação" onClose={() => setModal(false)}>
          <form onSubmit={salvar} className="space-y-5">
            {!resultado ? (
              <>
                {/* Importar dados */}
                <div className="bg-blue-400/10 border border-blue-400/30 rounded-lg p-4">
                  <label className="block text-xs text-muted-foreground font-semibold mb-2 flex items-center gap-2">
                    <Upload size={12} /> Importar dados da nota
                  </label>
                  <p className="text-xs text-blue-300">Acerla CSV/XML/TXT/PDF com texto e planilhas simples. Tenta preencher data, valor, formecido, descrição, CFOP e CST automaticamente.</p>
                  <button type="button" className="text-xs mt-2 px-3 py-1 bg-primary/10 text-white rounded hover:bg-blue-600">
                    Selecionar arquivo
                  </button>
                </div>

                {/* Básico */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs text-blue-500 mb-1 font-semibold">Importar da Ficha Técnica (Preenche custos automaticamente)</label>
                    <select onChange={e => handleSelectFicha(e.target.value)} className="w-full bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-blue-500 mb-2">
                      <option value="">Selecione uma ficha técnica...</option>
                      {fichas.map(f => <option key={f.id} value={f.id}>{f.produto_descricao} (Versão {f.versao || 1})</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-muted-foreground mb-1 font-semibold">Produto / Serviço *</label>
                    <input required {...inp(form.produto, v => f("produto", v))} placeholder="Ex: Laje pré-moldada" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">UF origem</label>
                    <select value={form.uf_origem} onChange={e => f("uf_origem", e.target.value)} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none">
                      {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map(uf => <option key={uf}>{uf}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">UF destino</label>
                    <select value={form.uf_destino} onChange={e => f("uf_destino", e.target.value)} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none">
                      {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map(uf => <option key={uf}>{uf}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Tipo de precificação</label>
                    <select value={form.tipo_precificacao} onChange={e => f("tipo_precificacao", e.target.value)} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none">
                      <option value="industrial">Produto industrial</option>
                      <option value="revenda">Revenda</option>
                      <option value="servico">Serviço</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Finalidade</label>
                    <select value={form.finalidade} onChange={e => f("finalidade", e.target.value)} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none">
                      <option value="industrializacao">Industrialização</option>
                      <option value="revenda">Revenda</option>
                      <option value="consumo">Uso e Consumo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Estoque atual</label>
                    <input type="number" {...inp(form.estoque_atual, v => f("estoque_atual", parseFloat(v) || 0))} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Estoque mínimo</label>
                    <input type="number" {...inp(form.estoque_minimo, v => f("estoque_minimo", parseFloat(v) || 0))} />
                  </div>
                </div>

                {/* Custos separados */}
                <div className="border-t border-border pt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Custos separados</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { key: "materia_prima", label: "Matéria-prima" },
                      { key: "mao_obra", label: "Mão de obra" },
                      { key: "custos_indiretos", label: "Custos indiretos" },
                      { key: "energia", label: "Energia" },
                      { key: "frete", label: "Frete" },
                      { key: "comissao", label: "Comissão" },
                      { key: "equipamentos", label: "Equipamentos" },
                      { key: "manutencao", label: "Manutenção" },
                      { key: "perdas", label: "Perdas produção" },
                      { key: "overhead", label: "Overhead R$" },
                      { key: "tributos", label: "Tributos R$" },
                    ].map(c => (
                      <div key={c.key}>
                        <label className="block text-xs text-muted-foreground mb-1">{c.label}</label>
                        <input type="number" step="0.01" {...inp(form.custos[c.key], v => f(`custos.${c.key}`, parseFloat(v) || 0))} placeholder="0.00" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tributação */}
                <div className="border-t border-border pt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Tributação automática / manual</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { key: "simples_nacional", label: "Simples Nacional %" },
                      { key: "icms", label: "ICMS % vazio=auto" },
                      { key: "difal", label: "DIFAL % vazio=auto" },
                      { key: "fcp", label: "FCP %" },
                      { key: "st", label: "ST %" },
                      { key: "ipi", label: "IPI %" },
                      { key: "pis_cofins", label: "PIS/COFINS %" },
                      { key: "margem_liquida", label: "Margem líquida %" },
                    ].map(t => (
                      <div key={t.key}>
                        <label className="block text-xs text-muted-foreground mb-1">{t.label}</label>
                        <input type="number" step="0.01" {...inp(form.tributacao[t.key], v => f(`tributacao.${t.key}`, parseFloat(v) || 0))} placeholder="0" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-xs text-muted-foreground mb-1 font-semibold">Observações</label>
                  <textarea
                    value={form.observacoes}
                    onChange={e => f("observacoes", e.target.value)}
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary h-24"
                    placeholder="Notas adicionais sobre a precificação..."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setModal(false)} className="flex-1 py-2 bg-muted text-muted-foreground rounded-lg text-sm">Cancelar</button>
                  <button type="submit" disabled={loading} className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? <><Loader2 size={14} className="animate-spin" /> Calculando...</> : "Calcular Preços"}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Resultado */}
                <div className="space-y-4">
                  <div className="bg-green-400/10 border border-green-400/30 rounded-lg p-4">
                    <p className="text-xs text-green-400 font-semibold mb-3">✓ Cálculo realizado</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Custo Total:</span>
                        <span className="font-bold text-foreground">R$ {resultado.custoTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* 3 Cenários */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Preço MÍNIMO", key: "minimo", desc: "Cobre custos + tributos" },
                      { label: "Preço IDEAL", key: "ideal", desc: `${resultado.margensEsperadas.ideal}% de margem` },
                      { label: "Preço BOM", key: "bom", desc: "35% de margem" },
                    ].map(cenario => (
                      <div key={cenario.key} className="bg-card border border-border rounded-lg p-3">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">{cenario.label}</p>
                        <p className="text-lg font-bold text-foreground">R$ {resultado.precos[cenario.key].toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground mt-1">{cenario.desc}</p>
                      </div>
                    ))}
                  </div>

                  {resultado.parecer && (
                    <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-4">
                      <p className="text-sm font-bold text-black mb-3">💡 Parecer IA Detalhado</p>
                      <div className="text-sm text-black prose prose-sm max-w-none">
                        <ReactMarkdown>{resultado.parecer}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setResultado(null)} className="flex-1 py-2 bg-muted text-muted-foreground rounded-lg text-sm">Voltar</button>
                  <button type="submit" className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">Salvar Precificação</button>
                </div>
              </>
            )}
          </form>
        </Modal>
      )}
    </div>
  );
}