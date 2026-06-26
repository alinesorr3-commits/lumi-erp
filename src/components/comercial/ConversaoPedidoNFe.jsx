import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export default function ConversaoPedidoNFe({ pedido, onClose, onSaved }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [empresa, setEmpresa] = useState(null);
  const [tabelasNCM, setTabelasNCM] = useState([]);
  const [nfeData, setNfeData] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.entities.EmpresaCliente.list(),
      base44.entities.TabelaNCM.list(),
    ]).then(([emps, ncms]) => {
      setEmpresa(emps[0] || null);
      setTabelasNCM(ncms);
    });
  }, []);

  const calcularTributacao = async () => {
    if (!empresa) {
      setError("Empresa emitente não configurada");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Processar itens com tributação da tabela NCM
      const itensComTributos = await Promise.all(
        (pedido.itens || []).map(async (item) => {
          // Buscar classificação NCM pelo nome do produto (simplificado)
          const ncm = tabelasNCM.find(t => 
            item.descricao?.toLowerCase().includes(t.descricao?.toLowerCase())
          );

          return {
            codigo: item.codigo || "",
            descricao: item.descricao,
            ncm: ncm?.codigo || "00000000",
            cfop: ncm?.cfop_saida || "5102",
            unidade: "UN",
            quantidade: item.quantidade || 1,
            valor_unitario: item.valor_unitario || 0,
            valor_total: (item.quantidade || 1) * (item.valor_unitario || 0),
            cst_icms: ncm?.icms_percentual ? "00" : "40",
            aliq_icms: ncm?.icms_percentual || 0,
            valor_icms: ((item.quantidade || 1) * (item.valor_unitario || 0)) * ((ncm?.icms_percentual || 0) / 100),
            aliq_pis: ncm?.credito_pis_cofins ? 1.65 : 0,
            valor_pis: ((item.quantidade || 1) * (item.valor_unitario || 0)) * (ncm?.credito_pis_cofins ? 0.0165 : 0),
            aliq_cofins: ncm?.credito_pis_cofins ? 7.6 : 0,
            valor_cofins: ((item.quantidade || 1) * (item.valor_unitario || 0)) * (ncm?.credito_pis_cofins ? 0.076 : 0),
          };
        })
      );

      // Calcular totais
      const valor_produtos = itensComTributos.reduce((s, i) => s + i.valor_total, 0);
      const valor_icms = itensComTributos.reduce((s, i) => s + i.valor_icms, 0);
      const valor_pis = itensComTributos.reduce((s, i) => s + i.valor_pis, 0);
      const valor_cofins = itensComTributos.reduce((s, i) => s + i.valor_cofins, 0);
      const valor_total = valor_produtos + valor_icms;

      const nfe = {
        empresa_id: empresa.id,
        tipo_doc: "NF-e",
        numero: (empresa.ultimo_numero_nfe || 0) + 1,
        serie: empresa.serie_nfe || 1,
        data_emissao: new Date().toISOString().split("T")[0],
        natureza_operacao: "Venda de Mercadorias",
        finalidade: "1-Normal",
        destinatario_nome: pedido.cliente_nome,
        destinatario_cnpj_cpf: pedido.cliente_cnpj || "",
        itens: itensComTributos,
        valor_produtos,
        valor_frete: 0,
        valor_desconto: 0,
        valor_icms: valor_icms,
        valor_pis: valor_pis,
        valor_cofins: valor_cofins,
        valor_total,
        situacao: "Rascunho",
        modalidade_frete: "9-Sem frete",
        ambiente: empresa.ambiente_nfe || "Homologação",
        informacoes_adicionais: `Convertido do Pedido: ${pedido.numero}`,
      };

      setNfeData(nfe);
    } catch (e) {
      setError(e.message);
    }

    setLoading(false);
  };

  const salvarNFe = async () => {
    if (!nfeData) return;

    setLoading(true);
    try {
      await base44.entities.NotaFiscalEletronica.create(nfeData);
      
      // Marcar pedido como vinculado a NF-e
      await base44.entities.Pedido.update(pedido.id, {
        status: "emitido",
        observacoes: `NF-e ${nfeData.numero}/${nfeData.serie} gerada em ${new Date().toLocaleDateString("pt-BR")}`,
      });

      onSaved?.();
      onClose?.();
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  if (!nfeData) {
    return (
      <div className="space-y-4">
        <div className="bg-blue-400/10 border border-blue-400/30 rounded-lg p-4">
          <p className="text-xs text-blue-300 font-semibold mb-2">Conversão automática de Pedido para NF-e</p>
          <p className="text-xs text-blue-200">A nota fiscal será gerada com itens, tributação (ICMS, PIS, COFINS) e regras fiscais aplicadas automaticamente baseadas na tabela NCM e configuração da empresa.</p>
        </div>

        {error && (
          <div className="bg-red-400/10 border border-red-400/30 rounded-lg p-3 flex gap-2">
            <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-300">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-2 bg-muted text-muted-foreground rounded-lg text-sm">Cancelar</button>
          <button type="button" onClick={calcularTributacao} disabled={loading || !empresa} className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={14} className="animate-spin" /> Processando...</> : "Gerar NF-e com Tributos"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-green-400/10 border border-green-400/30 rounded-lg p-4">
        <div className="flex items-start gap-2 mb-2">
          <CheckCircle2 size={14} className="text-green-400 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-green-400">NF-e Processada</p>
            <p className="text-xs text-green-300 mt-1">
              Número: <strong>{nfeData.numero}/{nfeData.serie}</strong> | Status: <strong>Rascunho</strong>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-3 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase">Resumo da NF-e</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Itens:</span>
            <span className="font-mono text-foreground">{nfeData.itens.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Valor Produtos:</span>
            <span className="font-mono text-foreground">R$ {nfeData.valor_produtos.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">ICMS Total:</span>
            <span className="font-mono text-green-400">R$ {nfeData.valor_icms.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">PIS + COFINS:</span>
            <span className="font-mono text-yellow-400">R$ {(nfeData.valor_pis + nfeData.valor_cofins).toFixed(2)}</span>
          </div>
          <div className="col-span-2 pt-2 border-t border-border flex justify-between">
            <span className="text-muted-foreground font-semibold">Total NF-e:</span>
            <span className="font-mono text-lg font-bold text-foreground">R$ {nfeData.valor_total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={() => setNfeData(null)} className="flex-1 py-2 bg-muted text-muted-foreground rounded-lg text-sm">Voltar</button>
        <button type="button" onClick={salvarNFe} disabled={loading} className="flex-1 py-2 bg-green-500/10 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <><Loader2 size={14} className="animate-spin" /> Salvando...</> : "✓ Salvar NF-e"}
        </button>
      </div>
    </div>
  );
}