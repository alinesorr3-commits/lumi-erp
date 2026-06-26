import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Pencil, Trash2, Search, Filter, TrendingDown, TrendingUp, CheckCircle2, AlertCircle, Link2, XCircle, SearchIcon, Zap } from "lucide-react";
import { format } from "date-fns";
import { analisarConciliacoes } from "@/lib/conciliacaoEngine";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function MovimentacoesImportadas({ contaId, conta, saldoSistema, lancamentosDisponiveis, onRefresh }) {
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [analisadas, setAnalizadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("pendentes");
  const [user, setUser] = useState(null);
  
  // Para vinculação manual
  const [movParaVincular, setMovParaVincular] = useState(null);
  const [buscaManual, setBuscaManual] = useState("");
  const [selecionadosManual, setSelecionadosManual] = useState({});
  const [criandoNovoLancamento, setCriandoNovoLancamento] = useState(false);
  const [novoLancamentoForm, setNovoLancamentoForm] = useState({ categoria: "", observacoes: "" });

  useEffect(() => {
    base44.auth.me().then(u => setUser(u));
  }, []);

  useEffect(() => {
    carregarMovimentacoes();
  }, [contaId]);

  const carregarMovimentacoes = async () => {
    try {
      const dados = await base44.entities.MovimentacaoBancaria.filter({
        conta_bancaria_id: contaId
      }, "-data_transacao");
      setMovimentacoes(dados || []);
    } catch (e) {
      console.error("Erro ao carregar movimentações:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (movimentacoes.length > 0 && lancamentosDisponiveis) {
      const resultado = analisarConciliacoes(movimentacoes, lancamentosDisponiveis);
      setAnalizadas(resultado);
    } else {
      setAnalizadas(movimentacoes.map(m => ({ ...m, status_sugestao: m.vinculado ? 'conciliado' : 'nenhuma' })));
    }
  }, [movimentacoes, lancamentosDisponiveis]);

  const executarConciliacaoAutomatica = async () => {
    const automaticas = analisadas.filter(a => a.status_sugestao === 'automatica' && a.status_conciliacao === 'pendente');
    if (automaticas.length === 0) {
      alert("Nenhuma conciliação com alta confiabilidade encontrada.");
      return;
    }
    
    if (!confirm(`Deseja processar e vincular ${automaticas.length} movimentações automaticamente?`)) return;
    
    setLoading(true);
    for (const mov of automaticas) {
      const lan = mov.melhorSugestao.lancamento;
      await vincular(mov, lan, "automatica");
    }
    carregarMovimentacoes();
    if (onRefresh) onRefresh();
  };

  const processarConciliacao = async (mov, lancamentosSelecionados, tipo, novoLancamento = null) => {
    const dataIso = new Date().toISOString();
    const idsExistentes = mov.ids_lancamentos || [];
    let valorConciliadoAdicional = 0;
    const historicoAdicional = [];
    const idsNovos = [];

    // Processar lançamentos existentes selecionados
    for (const item of lancamentosSelecionados) {
      const lan = item.lancamento;
      const valorAplicado = item.valorAplicado;
      const ehParcial = valorAplicado < lan.valor;
      
      valorConciliadoAdicional += valorAplicado;
      idsNovos.push(lan.id);
      
      const novoStatusLan = ehParcial ? "pendente" : "pago"; // ou podemos ter um status "parcial" se existisse, como não tem, fica pendente
      // Na verdade, se ehParcial, marcamos o valor_pago e mantemos pendente, ou se pagar total, pago e conciliado.
      // Porém, como simplificação, se for parcial, atualizamos o valor_pago
      const valorJaPago = lan.valor_pago || 0;
      const totalPagoAgora = valorJaPago + valorAplicado;
      const estaQuitado = totalPagoAgora >= lan.valor - 0.01;

      await base44.entities.Lancamento.update(lan.id, {
        conciliado: estaQuitado,
        valor_pago: totalPagoAgora,
        data_pagamento: mov.data_transacao,
        status: estaQuitado ? "pago" : "pendente",
        conta_bancaria_id: contaId
      });

      historicoAdicional.push({
        data: dataIso,
        usuario: user?.full_name || "Usuário",
        acao: "Vínculo",
        detalhes: `Vinculado R$ ${valorAplicado.toFixed(2)} ao lançamento ${lan.descricao}`
      });
    }

    let nomeDoLancamentoPrincipal = lancamentosSelecionados.length > 0 ? lancamentosSelecionados[0].lancamento.descricao : "";

    // Processar criação de novo lançamento (se houver resto não conciliado)
    if (novoLancamento) {
      const lanCriado = await base44.entities.Lancamento.create({
        descricao: mov.descricao + " (via Conciliação)",
        tipo: mov.tipo,
        valor: novoLancamento.valor,
        valor_pago: novoLancamento.valor,
        vencimento: mov.data_transacao,
        data_pagamento: mov.data_transacao,
        status: "pago",
        categoria: novoLancamento.categoria || "Conciliação Avulsa",
        conta_bancaria_id: contaId,
        conciliado: true,
        observacoes: novoLancamento.observacoes || ""
      });
      valorConciliadoAdicional += novoLancamento.valor;
      idsNovos.push(lanCriado.id);
      nomeDoLancamentoPrincipal = lanCriado.descricao;
      
      historicoAdicional.push({
        data: dataIso,
        usuario: user?.full_name || "Usuário",
        acao: "Criação",
        detalhes: `Criado novo lançamento de R$ ${novoLancamento.valor.toFixed(2)}`
      });
    }

    const valorTotalConciliadoAteAgora = (mov.valor_conciliado || 0) + valorConciliadoAdicional;
    const falta = Math.abs(mov.valor) - valorTotalConciliadoAteAgora;
    const novaDiferenca = Math.abs(falta) > 0.01;
    
    let novoStatusConciliacao = "conciliado";
    if (valorTotalConciliadoAteAgora > Math.abs(mov.valor) + 0.01) novoStatusConciliacao = "divergente";
    else if (novaDiferenca) novoStatusConciliacao = "parcialmente_conciliado";

    const todosIds = [...idsExistentes, ...idsNovos];

    await base44.entities.MovimentacaoBancaria.update(mov.id, {
      vinculado: novoStatusConciliacao === "conciliado" || novoStatusConciliacao === "divergente",
      status_conciliacao: novoStatusConciliacao,
      valor_conciliado: valorTotalConciliadoAteAgora,
      ids_lancamentos: todosIds,
      lancamento_id: todosIds[0] || "",
      lancamento_descricao: lancamentosSelecionados.length > 1 ? `Vários (${todosIds.length})` : nomeDoLancamentoPrincipal,
      tipo_conciliacao: tipo,
      data_conciliacao: dataIso,
      usuario_conciliador: user?.full_name || "Usuário",
      historico_conciliacao: [...(mov.historico_conciliacao || []), ...historicoAdicional]
    });
  };

  const vincular = async (mov, lan, tipo) => {
    // Para retrocompatibilidade com auto
    await processarConciliacao(mov, [{ lancamento: lan, valorAplicado: lan.valor }], tipo);
  };

  const aprovarSugestao = async (mov) => {
    setLoading(true);
    await vincular(mov, mov.melhorSugestao.lancamento, "assistida");
    carregarMovimentacoes();
    if (onRefresh) onRefresh();
  };

  const desvincular = async (mov) => {
    if (!confirm("Desfazer conciliação desta movimentação?")) return;
    setLoading(true);
    
    const dataIso = new Date().toISOString();
    const ids = mov.ids_lancamentos && mov.ids_lancamentos.length > 0 ? mov.ids_lancamentos : (mov.lancamento_id ? [mov.lancamento_id] : []);
    
    for (const id of ids) {
      if (!id) continue;
      // Precisaríamos saber quanto foi deduzido. Como simplificação de "desfazer tudo":
      const lan = lancamentosDisponiveis?.find(l => l.id === id);
      if (lan) {
        await base44.entities.Lancamento.update(id, {
          conciliado: false,
          status: "pendente",
          valor_pago: 0
        });
      }
    }

    await base44.entities.MovimentacaoBancaria.update(mov.id, {
      vinculado: false,
      status_conciliacao: "pendente",
      valor_conciliado: 0,
      ids_lancamentos: [],
      lancamento_id: "",
      lancamento_descricao: "",
      tipo_conciliacao: "",
      data_conciliacao: "",
      usuario_conciliador: "",
      historico_conciliacao: [...(mov.historico_conciliacao || []), {
        data: dataIso,
        usuario: user?.full_name || "Usuário",
        acao: "Desvinculação",
        detalhes: "Todos os vínculos desfeitos."
      }]
    });
    
    carregarMovimentacoes();
    if (onRefresh) onRefresh();
  };

  const handleDeletarMovimentacao = async (id) => {
    if (!confirm("Remover esta movimentação do extrato?")) return;
    await base44.entities.MovimentacaoBancaria.delete(id);
    carregarMovimentacoes();
  };

  const confirmarVinculacaoManual = async () => {
    if (!movParaVincular) return;
    setLoading(true);
    
    const arraySelecionados = Object.keys(selecionadosManual).map(id => {
      const lan = lancamentosDisponiveis.find(l => l.id === id);
      return { lancamento: lan, valorAplicado: selecionadosManual[id] };
    });

    let novoLanInfo = null;
    if (criandoNovoLancamento) {
      const valorTotalSel = arraySelecionados.reduce((acc, curr) => acc + curr.valorAplicado, 0);
      const falta = Math.abs(movParaVincular.valor) - (movParaVincular.valor_conciliado || 0) - valorTotalSel;
      if (falta > 0.01) {
        novoLanInfo = { valor: falta, categoria: novoLancamentoForm.categoria, observacoes: novoLancamentoForm.observacoes };
      }
    }

    await processarConciliacao(movParaVincular, arraySelecionados, "manual", novoLanInfo);
    
    setMovParaVincular(null);
    setSelecionadosManual({});
    setCriandoNovoLancamento(false);
    setNovoLancamentoForm({ categoria: "", observacoes: "" });
    carregarMovimentacoes();
    if (onRefresh) onRefresh();
  };

  const filtered = analisadas.filter(m => {
    if (search && !m.descricao.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus === "conciliados" && m.status_conciliacao !== 'conciliado') return false;
    if (filterStatus === "pendentes" && m.status_conciliacao !== 'pendente') return false;
    if (filterStatus === "parciais" && m.status_conciliacao !== 'parcialmente_conciliado') return false;
    return true;
  });

  const totalConciliados = analisadas.filter(m => m.status_conciliacao === 'conciliado').length;
  const totalPendentes = analisadas.filter(m => m.status_conciliacao === 'pendente').length;

  const totalReceitaGlobal = movimentacoes.filter(m => m.tipo === "receita").reduce((s, m) => s + (m.valor || 0), 0);
  const totalDespesaGlobal = movimentacoes.filter(m => m.tipo === "despesa").reduce((s, m) => s + (m.valor || 0), 0);
  const saldoImportado = (conta?.saldo_inicial || 0) + totalReceitaGlobal - totalDespesaGlobal;
  const diferenca = saldoImportado - (saldoSistema || 0);
  const temDivergencia = Math.abs(diferenca) > 0.01;
  const percConciliado = analisadas.length > 0 ? ((totalConciliados / analisadas.length) * 100).toFixed(0) : 0;
  const divergencias = analisadas.filter(m => m.status_conciliacao === 'divergente' || m.status_sugestao === 'assistida').length;
  const sugestoesAuto = analisadas.filter(m => m.status_sugestao === 'automatica' && m.status_conciliacao === 'pendente').length;

  if (loading && movimentacoes.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-4 h-4 border-2 border-muted border-t-primary rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-6 border-t pt-6 border-border">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Zap className="text-yellow-400" size={18} />
            Conciliação Inteligente
          </h3>
          <p className="text-xs text-muted-foreground">Cruzamento automático entre extrato importado e lançamentos do ERP.</p>
        </div>
        {sugestoesAuto > 0 && (
          <button 
            onClick={executarConciliacaoAutomatica}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm"
          >
            <CheckCircle2 size={16} />
            Conciliar {sugestoesAuto} Automáticos
          </button>
        )}
      </div>

      {/* Relatório Gerencial de Saldos */}
      <div className={`p-5 rounded-xl border shadow-sm ${temDivergencia ? 'bg-red-500/5 border-red-500/20' : 'bg-green-500/5 border-green-500/20'}`}>
        <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          {temDivergencia ? <AlertCircle className="text-red-400" size={18} /> : <CheckCircle2 className="text-green-400" size={18} />}
          Relatório Gerencial de Saldos
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Saldo Extrato (Importado)</p>
            <p className="text-lg font-bold text-foreground">{fmt(saldoImportado)}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Saldo Sistema (ERP)</p>
            <p className="text-lg font-bold text-foreground">{fmt(saldoSistema)}</p>
          </div>
          <div className={`border rounded-lg p-3 ${temDivergencia ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
            <p className={`text-xs mb-1 ${temDivergencia ? 'text-red-400' : 'text-green-500'}`}>Divergência</p>
            <p className={`text-lg font-bold ${temDivergencia ? 'text-red-500' : 'text-green-500'}`}>
              {temDivergencia ? fmt(Math.abs(diferenca)) : "R$ 0,00"}
            </p>
          </div>
        </div>
        {temDivergencia && (
          <p className="text-xs text-red-400 mt-3 flex items-center gap-1">
            <AlertCircle size={12} />
            Existem diferenças entre o que foi importado do banco e o que consta como pago no sistema. Revise as movimentações.
          </p>
        )}
      </div>

      {/* Dashboard Resumo */}
      {analisadas.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Percentual Conciliado</p>
            <div className="flex items-end gap-2">
              <p className="text-2xl font-bold text-primary">{percConciliado}%</p>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 mt-2">
              <div className="bg-primary h-1.5 rounded-full" style={{ width: `${percConciliado}%` }} />
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Total Conciliado</p>
            <p className="text-2xl font-bold text-green-400">{totalConciliados}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Total Pendente</p>
            <p className="text-2xl font-bold text-yellow-400">{totalPendentes}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Divergências / Dúvidas</p>
            <p className="text-2xl font-bold text-red-400">{divergencias}</p>
          </div>
        </div>
      )}

      {/* Controles */}
      <div className="flex items-center justify-between gap-2 bg-card p-3 rounded-xl border border-border">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar no extrato..."
              className="bg-muted border border-transparent rounded-lg pl-9 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:bg-card focus:border-primary w-64 transition-all"
            />
          </div>
          <div className="flex bg-muted rounded-lg p-0.5">
            <button
              onClick={() => setFilterStatus("todos")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filterStatus === "todos" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Todos ({analisadas.length})
            </button>
            <button
              onClick={() => setFilterStatus("pendentes")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filterStatus === "pendentes" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Pendentes ({totalPendentes})
            </button>
            <button
              onClick={() => setFilterStatus("parciais")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filterStatus === "parciais" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Parciais ({analisadas.filter(m => m.status_conciliacao === 'parcialmente_conciliado').length})
            </button>
            <button
              onClick={() => setFilterStatus("conciliados")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filterStatus === "conciliados" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Conciliados ({totalConciliados})
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Movimentações */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-10 bg-card border border-border rounded-xl">
            <SearchIcon className="mx-auto text-muted-foreground mb-2 opacity-50" size={24} />
            <p className="text-sm text-muted-foreground">Nenhuma movimentação bancária para exibir.</p>
          </div>
        ) : (
          filtered.map(mov => (
            <div key={mov.id} className={`p-4 rounded-xl border transition-all ${
              mov.status_conciliacao === 'conciliado' ? "bg-green-500/5 border-green-500/20" : 
              mov.status_conciliacao === 'parcialmente_conciliado' ? "bg-yellow-500/5 border-yellow-500/30" :
              mov.status_conciliacao === 'divergente' ? "bg-red-500/5 border-red-500/20" :
              "bg-card border-border"
            }`}>
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                
                {/* Lado Esquerdo: Dados do Banco */}
                <div className="flex-1 w-full min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-sm ${mov.tipo === 'receita' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {mov.tipo === 'receita' ? "ENTRADA" : "SAÍDA"}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">Extrato Bancário</span>
                  </div>
                  <h4 className="text-base font-semibold text-foreground truncate" title={mov.descricao}>{mov.descricao}</h4>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span className="font-mono">{mov.data_transacao}</span>
                    {mov.cnpj_cpf && <span>• {mov.cnpj_cpf}</span>}
                    {mov.numero_documento && <span>• Doc: {mov.numero_documento}</span>}
                  </div>
                  <p className={`text-lg font-bold mt-2 ${mov.tipo === 'receita' ? 'text-green-400' : 'text-red-400'}`}>
                    {mov.tipo === 'receita' ? '+' : '-'}{fmt(mov.valor)}
                  </p>
                </div>

                {/* Centro: Indicador de Vínculo */}
                <div className="flex justify-center items-center px-4 hidden md:flex">
                  {mov.status_conciliacao === 'conciliado' ? (
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Link2 className="text-green-400" size={16} />
                      </div>
                      <span className="text-[10px] text-green-400 font-medium mt-1 uppercase">Conciliado</span>
                    </div>
                  ) : mov.status_conciliacao === 'parcialmente_conciliado' ? (
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <Link2 className="text-yellow-500" size={16} />
                      </div>
                      <span className="text-[10px] text-yellow-500 font-medium mt-1 uppercase text-center leading-tight">Conciliado<br/>Parcial</span>
                    </div>
                  ) : mov.status_conciliacao === 'divergente' ? (
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                        <AlertCircle className="text-red-500" size={16} />
                      </div>
                      <span className="text-[10px] text-red-500 font-medium mt-1 uppercase">Divergente</span>
                    </div>
                  ) : mov.status_sugestao === 'automatica' ? (
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Zap className="text-primary" size={16} />
                      </div>
                      <span className="text-[10px] text-primary font-medium mt-1">SURE MATCH</span>
                    </div>
                  ) : mov.status_sugestao === 'assistida' ? (
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-yellow-400/20 flex items-center justify-center">
                        <AlertCircle className="text-yellow-400" size={16} />
                      </div>
                      <span className="text-[10px] text-yellow-400 font-medium mt-1">DÚVIDA</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <SearchIcon className="text-muted-foreground" size={16} />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium mt-1">S/ MATCH</span>
                    </div>
                  )}
                </div>

                {/* Lado Direito: Ações / Lançamento do ERP */}
                <div className="flex-1 w-full border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                  {(mov.vinculado || mov.status_conciliacao === 'parcialmente_conciliado' || mov.status_conciliacao === 'divergente') ? (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {mov.status_conciliacao === 'parcialmente_conciliado' ? (
                          <><AlertCircle className="text-yellow-500" size={16} />
                          <span className="text-sm font-semibold text-yellow-500">Parcialmente Conciliado</span></>
                        ) : mov.status_conciliacao === 'divergente' ? (
                          <><AlertCircle className="text-red-500" size={16} />
                          <span className="text-sm font-semibold text-red-500">Conciliação Divergente</span></>
                        ) : (
                          <><CheckCircle2 className="text-green-400" size={16} />
                          <span className="text-sm font-semibold text-green-400">Conciliado no ERP</span></>
                        )}
                      </div>
                      <p className="text-sm text-foreground truncate">{mov.lancamento_descricao}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Via conciliação {mov.tipo_conciliacao} por {mov.usuario_conciliador || "Usuário"} em {mov.data_conciliacao ? format(new Date(mov.data_conciliacao), "dd/MM/yyyy HH:mm") : "-"}
                      </p>
                      {mov.valor_conciliado > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Valor Aplicado: {fmt(mov.valor_conciliado)}
                        </p>
                      )}
                      <div className="flex gap-4 mt-3 items-center">
                        <button 
                          onClick={() => desvincular(mov)}
                          className="text-xs text-red-400 hover:underline"
                        >
                          Desfazer vínculo
                        </button>
                        {mov.status_conciliacao === 'parcialmente_conciliado' && (
                          <button 
                            onClick={() => setMovParaVincular(mov)}
                            className="text-xs text-primary hover:underline"
                          >
                            Continuar Conciliação
                          </button>
                        )}
                      </div>
                    </div>
                  ) : mov.melhorSugestao ? (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-sm bg-muted text-foreground">Sugestão Encontrada</span>
                        <span className={`text-xs font-bold ${mov.melhorSugestao.percentage >= 80 ? 'text-primary' : 'text-yellow-400'}`}>
                          {mov.melhorSugestao.percentage}% Compatível
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">{mov.melhorSugestao.lancamento.descricao}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {mov.melhorSugestao.matches.map((match, idx) => (
                          <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">{match}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mt-4">
                        <button 
                          onClick={() => aprovarSugestao(mov)}
                          className="flex-1 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90"
                        >
                          Aprovar Match
                        </button>
                        <button 
                          onClick={() => setMovParaVincular(mov)}
                          className="flex-1 py-1.5 bg-muted text-foreground border border-border rounded-lg text-xs font-medium hover:bg-muted/80"
                        >
                          Buscar Outro
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col justify-center">
                      <p className="text-sm text-muted-foreground mb-3">Nenhum lançamento semelhante encontrado no ERP.</p>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setMovParaVincular(mov)}
                          className="flex-1 py-1.5 bg-muted text-foreground border border-border rounded-lg text-xs font-medium hover:bg-muted/80"
                        >
                          Vincular Manualmente
                        </button>
                        <button 
                          onClick={() => handleDeletarMovimentacao(mov.id)}
                          className="py-1.5 px-3 bg-red-500/10 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/20"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Vinculação Manual */}
      {movParaVincular && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Conciliação Manual Inteligente</h2>
                <p className="text-xs text-muted-foreground">Selecione um ou vários lançamentos para vincular (baixa total ou parcial).</p>
              </div>
              <button onClick={() => {
                setMovParaVincular(null);
                setSelecionadosManual({});
                setCriandoNovoLancamento(false);
              }} className="text-muted-foreground hover:text-foreground"><XCircle size={20} /></button>
            </div>
            
            <div className="p-4 bg-muted/30 border-b border-border flex justify-between items-center gap-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Transação Bancária:</p>
                <span className="text-sm font-bold text-foreground">{movParaVincular.descricao}</span>
                <p className="text-xs text-muted-foreground mt-0.5">{movParaVincular.data_transacao}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Valor Total:</p>
                <span className={`text-lg font-bold ${movParaVincular.tipo === 'receita' ? 'text-green-400' : 'text-red-400'}`}>
                  {movParaVincular.tipo === 'receita' ? '+' : '-'}{fmt(Math.abs(movParaVincular.valor))}
                </span>
                {movParaVincular.valor_conciliado > 0 && (
                  <p className="text-xs text-muted-foreground">Já conciliado: {fmt(movParaVincular.valor_conciliado)}</p>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* Lado Esquerdo - Busca */}
              <div className="flex-1 border-r border-border flex flex-col overflow-hidden">
                <div className="p-3 border-b border-border">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={buscaManual}
                      onChange={e => setBuscaManual(e.target.value)}
                      placeholder="Buscar por descrição ou valor..."
                      className="w-full bg-muted border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {lancamentosDisponiveis
                    .filter(l => !l.conciliado && l.tipo === movParaVincular.tipo)
                    .filter(l => {
                      if (!buscaManual) return true;
                      const q = buscaManual.toLowerCase();
                      return l.descricao?.toLowerCase().includes(q) || l.valor?.toString().includes(q) || l.vencimento?.includes(q);
                    })
                    .map(lan => {
                      const isSelected = !!selecionadosManual[lan.id];
                      return (
                        <div key={lan.id} className={`flex items-center justify-between p-3 border rounded-lg transition-colors cursor-pointer ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                          onClick={() => {
                            if (isSelected) {
                              const ns = { ...selecionadosManual };
                              delete ns[lan.id];
                              setSelecionadosManual(ns);
                            } else {
                              const valorRestanteMov = Math.abs(movParaVincular.valor) - (movParaVincular.valor_conciliado || 0) - Object.values(selecionadosManual).reduce((a, b) => a + b, 0);
                              const valorRestanteLan = lan.valor - (lan.valor_pago || 0);
                              const aplicar = Math.min(valorRestanteMov > 0 ? valorRestanteMov : valorRestanteLan, valorRestanteLan);
                              setSelecionadosManual({ ...selecionadosManual, [lan.id]: aplicar });
                            }
                          }}
                        >
                          <div className="flex-1 min-w-0 pr-3">
                            <p className="text-sm font-medium text-foreground truncate">{lan.descricao}</p>
                            <p className="text-xs text-muted-foreground">Venc: {lan.vencimento}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="text-sm font-bold text-foreground">{fmt(lan.valor)}</span>
                              {(lan.valor_pago > 0) && <p className="text-[10px] text-muted-foreground">Pago: {fmt(lan.valor_pago)}</p>}
                            </div>
                            <div className={`w-5 h-5 rounded flex items-center justify-center border ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-border'}`}>
                              {isSelected && <CheckCircle2 size={14} />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Lado Direito - Selecionados e Finalização */}
              <div className="w-full md:w-80 flex flex-col bg-muted/10">
                <div className="p-4 border-b border-border bg-card">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Lançamentos Selecionados</h3>
                  <div className="space-y-3">
                    {Object.keys(selecionadosManual).length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">Nenhum selecionado.</p>
                    ) : (
                      Object.keys(selecionadosManual).map(id => {
                        const lan = lancamentosDisponiveis.find(l => l.id === id);
                        if (!lan) return null;
                        const vRestanteLan = lan.valor - (lan.valor_pago || 0);
                        return (
                          <div key={id} className="bg-muted p-2 rounded-lg text-sm border border-border">
                            <div className="flex justify-between mb-1">
                              <span className="truncate text-xs font-medium max-w-[150px]">{lan.descricao}</span>
                              <span className="text-xs text-muted-foreground">Máx: {fmt(vRestanteLan)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs">R$</span>
                              <input 
                                type="number" 
                                step="0.01" 
                                max={vRestanteLan}
                                value={selecionadosManual[id]}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setSelecionadosManual({ ...selecionadosManual, [id]: val });
                                }}
                                className="w-full px-2 py-1 text-xs border border-border rounded bg-card focus:outline-primary"
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="p-4 flex-1 overflow-y-auto">
                  {/* Resumo Valores */}
                  <div className="space-y-1 mb-4 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Valor do Extrato:</span>
                      <span>{fmt(Math.abs(movParaVincular.valor))}</span>
                    </div>
                    {movParaVincular.valor_conciliado > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Já Conciliado Antes:</span>
                        <span>-{fmt(movParaVincular.valor_conciliado)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-muted-foreground">
                      <span>Selecionado Agora:</span>
                      <span>-{fmt(Object.values(selecionadosManual).reduce((a, b) => a + b, 0))}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-border pt-1 mt-1">
                      <span>Diferença Restante:</span>
                      <span className={
                        (Math.abs(movParaVincular.valor) - (movParaVincular.valor_conciliado || 0) - Object.values(selecionadosManual).reduce((a, b) => a + b, 0)) > 0.01 
                          ? 'text-yellow-500' : 'text-green-500'
                      }>
                        {fmt(Math.max(0, Math.abs(movParaVincular.valor) - (movParaVincular.valor_conciliado || 0) - Object.values(selecionadosManual).reduce((a, b) => a + b, 0)))}
                      </span>
                    </div>
                  </div>

                  {(() => {
                    const falta = Math.max(0, Math.abs(movParaVincular.valor) - (movParaVincular.valor_conciliado || 0) - Object.values(selecionadosManual).reduce((a, b) => a + b, 0));
                    if (falta > 0.01) {
                      return (
                        <div className="border border-yellow-500/30 bg-yellow-500/10 p-3 rounded-lg">
                          <label className="flex items-center gap-2 cursor-pointer text-xs mb-2">
                            <input type="checkbox" checked={criandoNovoLancamento} onChange={e => setCriandoNovoLancamento(e.target.checked)} />
                            Criar novo lançamento para a diferença ({fmt(falta)})
                          </label>
                          {criandoNovoLancamento && (
                            <div className="space-y-2 mt-2">
                              <input 
                                placeholder="Categoria (opcional)" 
                                value={novoLancamentoForm.categoria}
                                onChange={e => setNovoLancamentoForm({...novoLancamentoForm, categoria: e.target.value})}
                                className="w-full px-2 py-1.5 text-xs bg-card border border-border rounded" 
                              />
                              <input 
                                placeholder="Observações (opcional)" 
                                value={novoLancamentoForm.observacoes}
                                onChange={e => setNovoLancamentoForm({...novoLancamentoForm, observacoes: e.target.value})}
                                className="w-full px-2 py-1.5 text-xs bg-card border border-border rounded" 
                              />
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div className="p-4 border-t border-border bg-card">
                  <button
                    disabled={Object.keys(selecionadosManual).length === 0 && !criandoNovoLancamento}
                    onClick={confirmarVinculacaoManual}
                    className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    Confirmar Conciliação
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}