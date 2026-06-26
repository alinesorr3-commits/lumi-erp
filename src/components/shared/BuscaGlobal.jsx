import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Users, FileText, Package, DollarSign, HardHat, Truck, Sprout, Shield, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const CATEGORIAS = {
  cliente: { label: "Cliente", icon: Users, color: "text-blue-400", path: "/comercial" },
  lancamento: { label: "Financeiro", icon: DollarSign, color: "text-green-400", path: "/financeiro" },
  produto: { label: "Estoque", icon: Package, color: "text-yellow-400", path: "/estoques" },
  nota_fiscal: { label: "Nota Fiscal", icon: FileText, color: "text-yellow-400", path: "/fiscal" },
  colaborador: { label: "RH", icon: Users, color: "text-blue-400", path: "/rh" },
  certidao: { label: "Certidão", icon: Shield, color: "text-green-400", path: "/certidoes" },
  obra: { label: "Obra", icon: HardHat, color: "text-yellow-400", path: "/obras" },
  veiculo: { label: "Veículo", icon: Truck, color: "text-blue-400", path: "/veiculos" },
  safra: { label: "Agronegócio", icon: Sprout, color: "text-green-400", path: "/agronegocio" },
};

const fmt = (v) => v ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v) : null;

async function buscarTudo(termo) {
  const t = termo.toLowerCase().trim();
  const resultados = [];

  const buscas = await Promise.allSettled([
    base44.entities.Cliente.list(),
    base44.entities.Lancamento.list(),
    base44.entities.ProdutoServico.list(),
    base44.entities.NotaFiscal.list().catch(() => []),
    base44.entities.Colaborador.list().catch(() => []),
    base44.entities.Certidao.list().catch(() => []),
    base44.entities.Obra.list().catch(() => []),
    base44.entities.Veiculo.list().catch(() => []),
    base44.entities.Safra.list().catch(() => []),
  ]);

  const [clientes, lancamentos, produtos, notas, colaboradores, certidoes, obras, veiculos, safras] = buscas.map(r => r.status === "fulfilled" ? r.value : []);

  // Clientes
  clientes?.filter(c =>
    (c.nome_razao_social || c.nome || "").toLowerCase().includes(t) ||
    (c.cnpj_cpf || "").includes(t) ||
    (c.email || "").toLowerCase().includes(t)
  ).slice(0, 3).forEach(c => resultados.push({
    tipo: "cliente",
    titulo: c.nome_razao_social || c.nome || "Cliente",
    subtitulo: c.cnpj_cpf || c.email || "",
    id: c.id,
  }));

  // Lançamentos financeiros
  lancamentos?.filter(l =>
    (l.descricao || "").toLowerCase().includes(t) ||
    (l.cliente_fornecedor || "").toLowerCase().includes(t)
  ).slice(0, 3).forEach(l => resultados.push({
    tipo: "lancamento",
    titulo: l.descricao || "Lançamento",
    subtitulo: `${l.tipo === "receita" ? "Receita" : "Despesa"} · ${fmt(l.valor)}`,
    id: l.id,
  }));

  // Produtos/Estoque
  produtos?.filter(p =>
    (p.descricao || "").toLowerCase().includes(t) ||
    (p.codigo || "").toLowerCase().includes(t)
  ).slice(0, 3).forEach(p => resultados.push({
    tipo: "produto",
    titulo: p.descricao || "Produto",
    subtitulo: `Cód: ${p.codigo || "—"} · Estoque: ${p.estoque_atual ?? "—"}`,
    id: p.id,
  }));

  // Notas Fiscais
  notas?.filter(n =>
    (n.numero || "").toString().includes(t) ||
    (n.destinatario_nome || n.emitente_nome || "").toLowerCase().includes(t)
  ).slice(0, 3).forEach(n => resultados.push({
    tipo: "nota_fiscal",
    titulo: `NF ${n.numero || "—"} · ${n.destinatario_nome || n.emitente_nome || ""}`,
    subtitulo: fmt(n.valor_total) || "",
    id: n.id,
  }));

  // Colaboradores
  colaboradores?.filter(c =>
    (c.nome || "").toLowerCase().includes(t) ||
    (c.cpf || "").includes(t)
  ).slice(0, 2).forEach(c => resultados.push({
    tipo: "colaborador",
    titulo: c.nome || "Colaborador",
    subtitulo: c.cargo || c.departamento || "",
    id: c.id,
  }));

  // Certidões
  certidoes?.filter(c =>
    (c.tipo || "").toLowerCase().includes(t) ||
    (c.empresa || "").toLowerCase().includes(t)
  ).slice(0, 2).forEach(c => resultados.push({
    tipo: "certidao",
    titulo: c.tipo || "Certidão",
    subtitulo: c.empresa || "",
    id: c.id,
  }));

  // Obras
  obras?.filter(o =>
    (o.nome || o.descricao || "").toLowerCase().includes(t) ||
    (o.cliente || "").toLowerCase().includes(t)
  ).slice(0, 2).forEach(o => resultados.push({
    tipo: "obra",
    titulo: o.nome || o.descricao || "Obra",
    subtitulo: o.cliente || "",
    id: o.id,
  }));

  // Veículos
  veiculos?.filter(v =>
    (v.placa || "").toLowerCase().includes(t) ||
    (v.modelo || "").toLowerCase().includes(t)
  ).slice(0, 2).forEach(v => resultados.push({
    tipo: "veiculo",
    titulo: `${v.placa || ""} · ${v.modelo || "Veículo"}`,
    subtitulo: v.responsavel || "",
    id: v.id,
  }));

  // Safras
  safras?.filter(s =>
    (s.cultura || "").toLowerCase().includes(t) ||
    (s.nome || "").toLowerCase().includes(t)
  ).slice(0, 2).forEach(s => resultados.push({
    tipo: "safra",
    titulo: s.nome || s.cultura || "Safra",
    subtitulo: s.temporada || "",
    id: s.id,
  }));

  return resultados.slice(0, 12);
}

export default function BuscaGlobal() {
  const [aberta, setAberta] = useState(false);
  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [selecionado, setSelecionado] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const timerRef = useRef(null);

  const fechar = useCallback(() => {
    setAberta(false);
    setTermo("");
    setResultados([]);
    setSelecionado(0);
  }, []);

  const abrir = useCallback(() => {
    setAberta(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  // Atalho Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        aberta ? fechar() : abrir();
      }
      if (e.key === "Escape") fechar();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [aberta, fechar, abrir]);

  // Debounce da busca
  useEffect(() => {
    if (!termo.trim() || termo.length < 2) {
      setResultados([]);
      return;
    }
    clearTimeout(timerRef.current);
    setCarregando(true);
    timerRef.current = setTimeout(async () => {
      const res = await buscarTudo(termo);
      setResultados(res);
      setSelecionado(0);
      setCarregando(false);
    }, 350);
    return () => clearTimeout(timerRef.current);
  }, [termo]);

  const irPara = (resultado) => {
    const cat = CATEGORIAS[resultado.tipo];
    if (cat) navigate(cat.path);
    fechar();
  };

  // Navegação pelo teclado
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelecionado(s => Math.min(s + 1, resultados.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelecionado(s => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && resultados[selecionado]) irPara(resultados[selecionado]);
  };

  return (
    <>
      {/* Botão de ativação */}
      <button
        onClick={abrir}
        className="flex items-center gap-2 px-3 py-1.5 bg-muted border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all text-xs"
      >
        <Search size={13} />
        <span className="hidden sm:inline">Buscar no ERP...</span>
        <span className="hidden sm:inline ml-2 text-[10px] bg-background border border-border px-1.5 py-0.5 rounded">⌘K</span>
      </button>

      {/* Modal de busca */}
      {aberta && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4" onClick={fechar}>
          <div
            className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search size={16} className="text-muted-foreground flex-shrink-0" />
              <input
                ref={inputRef}
                value={termo}
                onChange={e => setTermo(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar cliente, nota fiscal, produto, lançamento..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              {carregando && <Loader2 size={14} className="text-muted-foreground animate-spin flex-shrink-0" />}
              {termo && !carregando && (
                <button onClick={() => setTermo("")} className="text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              )}
              <kbd className="text-[10px] text-muted-foreground bg-muted border border-border px-1.5 py-0.5 rounded hidden sm:block">ESC</kbd>
            </div>

            {/* Resultados */}
            {termo.length >= 2 && (
              <div className="max-h-80 overflow-y-auto">
                {resultados.length === 0 && !carregando ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-muted-foreground">Nenhum resultado para <strong className="text-foreground">"{termo}"</strong></p>
                  </div>
                ) : (
                  <ul className="py-2">
                    {resultados.map((r, i) => {
                      const cat = CATEGORIAS[r.tipo];
                      const Icon = cat?.icon || Search;
                      return (
                        <li key={`${r.tipo}-${r.id}`}>
                          <button
                            onClick={() => irPara(r)}
                            onMouseEnter={() => setSelecionado(i)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
 ${selecionado === i ? "bg-muted" : "hover:bg-muted/50"}`}
                          >
                            <div className={`w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0`}>
                              <Icon size={13} className={cat?.color || "text-muted-foreground"} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{r.titulo}</p>
                              {r.subtitulo && <p className="text-xs text-muted-foreground truncate">{r.subtitulo}</p>}
                            </div>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted ${cat?.color || "text-muted-foreground"}`}>
                              {cat?.label}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            {/* Dica quando vazio */}
            {termo.length < 2 && (
              <div className="px-4 py-5">
                <p className="text-xs text-muted-foreground mb-3 font-medium">Buscar em:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(CATEGORIAS).map(([key, cat]) => {
                    const Icon = cat.icon;
                    return (
                      <span key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                        <Icon size={11} className={cat.color} /> {cat.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}