import { useState } from "react";
import { Upload, X, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ImportarRelatorioModal({ contaId, lancamentos, onClose, onImportSuccess }) {
  const [arquivo, setArquivo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["ofx", "pdf"].includes(ext)) {
      setError("Apenas arquivos OFX e PDF são suportados");
      return;
    }
    setError("");
    setArquivo(file);
  };

  const extrairTransacoesOFX = (conteudo) => {
    const transacoes = [];
    const regex = /<STMTTRN>[\s\S]*?<\/STMTTRN>/g;
    const matches = conteudo.matchAll(regex);
    
    for (const match of matches) {
      const stmt = match[0];
      const valueMatch = stmt.match(/<TRNAMT>(-?\d+\.?\d*)/);
      const dateMatch = stmt.match(/<DTPOSTED>(\d{8})/);
      const descMatch = stmt.match(/<MEMO>([^<]+)/);
      
      if (valueMatch && dateMatch) {
        const descricao = descMatch ? descMatch[1].trim() : "Transação importada";
        
        // Ignorar linhas de saldo diário/disponível
        if (descricao.toLowerCase().includes("saldo") && descricao.toLowerCase().includes("disponível")) {
          continue;
        }
        
        const valorRaw = parseFloat(valueMatch[1]);
        // Analisar sinal: negativo = débito (despesa), positivo = crédito (receita)
        const tipo = valorRaw < 0 ? "despesa" : "receita";
        const valor = Math.abs(valorRaw);
        const data = dateMatch[1];
        const data_formatada = `${data.substring(0, 4)}-${data.substring(4, 6)}-${data.substring(6, 8)}`;
        
        transacoes.push({ tipo, valor, data: data_formatada, descricao });
      }
    }
    return transacoes;
  };

  const extrairTransacoesPDF = async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await base44.integrations.Core.UploadFile({ file });
      const pdfUrl = uploadRes.file_url;
      
      const extractRes = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: pdfUrl,
        json_schema: {
          type: "object",
          properties: {
            transacoes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  valor: { type: "number", description: "Valor com sinal: negativo=débito/despesa, positivo=crédito/receita" },
                  data: { type: "string" },
                  descricao: { type: "string" },
                  cnpj: { type: "string" },
                  numero_nota: { type: "string" }
                }
              }
            }
          }
        }
      });
      
      // Processar transações e classificar por sinal
      const transacoes = extractRes.output?.transacoes || [];
      return transacoes.map(t => ({
        ...t,
        tipo: t.valor < 0 ? "despesa" : "receita",
        valor: Math.abs(t.valor)
      }));
    } catch (e) {
      console.error("Erro ao extrair PDF:", e);
      return [];
    }
  };

  const buscarLancamentoCorespondente = (transacao) => {
    return lancamentos.find(l => {
      if (l.conta_bancaria_id && l.conta_bancaria_id !== contaId) return false;
      if (l.tipo !== transacao.tipo) return false;
      
      const valorTotal = l.valor_pago !== undefined && l.valor_pago !== null && l.valor_pago !== "" ? Number(l.valor_pago) : (Number(l.valor) || 0) + (Number(l.valor_por_fora) || 0) + (Number(l.juros_multas) || 0);
      const valorMatch = Math.abs(valorTotal - transacao.valor) < 0.01;
      
      if (valorMatch) {
        const isFolha = l.numero_documento?.startsWith("FOLHA-") || l.numero_documento?.startsWith("PROLABORE-");
        const cnpjMatch = transacao.cnpj && l.cliente_fornecedor?.includes(transacao.cnpj);
        const notaMatch = transacao.numero_nota && l.numero_documento === transacao.numero_nota;
        
        if (isFolha || cnpjMatch || notaMatch || transacao.cnpj === undefined) return true;
      }
      return false;
    });
  };

  const handleImport = async () => {
    if (!arquivo) {
      setError("Selecione um arquivo para importar");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Salvar arquivo em storage privado
      let arquivoUrl = "";
      try {
        const uploadRes = await base44.integrations.Core.UploadPrivateFile({ file: arquivo });
        arquivoUrl = uploadRes.file_uri;
      } catch (e) {
        console.error("Erro ao salvar arquivo privado:", e);
      }

      // Ler arquivo de forma assíncrona com Promise
      const conteudo = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(arquivo);
      });

      let transacoes = [];

      if (arquivo.name.endsWith(".ofx")) {
        transacoes = extrairTransacoesOFX(conteudo);
      } else if (arquivo.name.endsWith(".pdf")) {
        transacoes = await extrairTransacoesPDF(arquivo);
      }

      if (transacoes.length === 0) {
        setError("Nenhuma transação encontrada no arquivo");
        setLoading(false);
        return;
      }

      const matches = transacoes.map(t => {
        const lancamento = buscarLancamentoCorespondente(t);
        return {
          transacao: t,
          lancamento,
          vinculado: !!lancamento
        };
      });

      const vinculados = matches.filter(m => m.vinculado).length;

      // Marcar lançamentos como conciliados
      if (vinculados > 0) {
        for (const match of matches.filter(m => m.vinculado)) {
          await base44.entities.Lancamento.update(match.lancamento.id, {
            conciliado: true,
            data_pagamento: match.transacao.data,
            conta_bancaria_id: contaId,
            status: "pago"
          });
        }
      }

      // Registrar arquivo na base de dados
      let arquivoId = "";
      if (arquivoUrl) {
        try {
          const res = await base44.entities.ArquivoApuracao.create({
            nome_arquivo: arquivo.name,
            tipo_arquivo: arquivo.name.endsWith(".ofx") ? "OFX" : "PDF",
            arquivo_url: arquivoUrl,
            conta_bancaria_id: contaId,
            conta_bancaria_nome: "", // será preenchido via relação
            data_importacao: new Date().toISOString().split("T")[0],
            quantidade_transacoes: transacoes.length,
            quantidade_vinculadas: vinculados,
            descricao: `Importação de ${transacoes.length} transação(ões)`
          });
          arquivoId = res.id;
        } catch (e) {
          console.error("Erro ao registrar arquivo:", e);
        }
      }

      // Salvar movimentações no banco
      try {
        for (const match of matches) {
          await base44.entities.MovimentacaoBancaria.create({
            conta_bancaria_id: contaId,
            conta_bancaria_nome: "", // será preenchido via relação
            arquivo_apuracao_id: arquivoId,
            data_transacao: match.transacao.data,
            tipo: match.transacao.tipo,
            descricao: match.transacao.descricao,
            valor: match.transacao.valor,
            cnpj_cpf: match.transacao.cnpj || "",
            numero_documento: match.transacao.numero_nota || "",
            lancamento_id: match.lancamento?.id || "",
            lancamento_descricao: match.lancamento?.descricao || "",
            vinculado: match.vinculado,
            observacoes: ""
          });
        }
      } catch (e) {
        console.error("Erro ao registrar movimentações:", e);
      }

      setResultado({
        total: transacoes.length,
        vinculados,
        transacoes: matches
      });
      setLoading(false);
      if (onImportSuccess) onImportSuccess();
    } catch (err) {
      console.error("Erro ao processar arquivo:", err);
      setError(err.message || "Erro ao processar arquivo");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Upload size={18} className="text-primary" />
            Importar Relatório Bancário
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        <div className="p-5 space-y-4">
          {!resultado ? (
            <>
              <div>
                <label className="block text-xs text-muted-foreground mb-2 font-semibold">Arquivo (OFX ou PDF)</label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => document.getElementById("file-input").click()}>
                  <Upload size={24} className="mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-foreground font-medium">Clique para selecionar ou arraste o arquivo</p>
                  <p className="text-xs text-muted-foreground mt-1">OFX ou PDF · Até 10 MB</p>
                  <input
                    id="file-input"
                    type="file"
                    accept=".ofx,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                {arquivo && (
                  <p className="text-xs text-green-400 mt-2 flex items-center gap-1.5">
                    <CheckCircle2 size={12} /> {arquivo.name}
                  </p>
                )}
              </div>

              <div className="bg-blue-400/10 border border-blue-400/30 rounded-lg px-4 py-3 flex gap-3">
                <AlertCircle size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-300">
                  <p className="font-medium mb-1">Como funciona:</p>
                  <ul className="space-y-0.5 text-blue-200">
                    <li>• Extrai transações do arquivo OFX ou PDF</li>
                    <li>• <strong>Analisa sinal:</strong> débito (−) = despesa, crédito (+) = receita</li>
                    <li>• Faz match automático por <strong>valor, CNPJ ou número de nota</strong></li>
                    <li>• Marca lançamentos correspondentes como conciliados</li>
                  </ul>
                </div>
              </div>

              {error && (
                <div className="bg-red-400/10 border border-red-400/30 rounded-lg px-4 py-3 flex gap-2">
                  <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-lg text-sm bg-muted text-muted-foreground hover:bg-muted/80"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleImport}
                  disabled={!arquivo || loading}
                  className="flex-1 py-2.5 rounded-lg text-sm bg-primary text-primary-foreground disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Processando...
                    </>
                  ) : (
                    "Importar e Conciliar"
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-green-400/10 border border-green-400/30 rounded-lg px-4 py-3">
                <p className="text-sm font-semibold text-green-400">✓ Importação concluída!</p>
                <p className="text-xs text-green-300 mt-1">
                  {resultado.vinculados} de {resultado.total} transações foram conciliadas automaticamente.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Detalhes das Transações</h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {resultado.transacoes.map((match, idx) => (
                    <div key={idx} className={`p-3 rounded-lg border text-xs
 ${match.vinculado ? "border-green-400/30 bg-green-400/5" : "border-border bg-muted/30"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">{match.transacao.descricao}</p>
                          <p className="text-muted-foreground">
                            {match.transacao.data} · {match.transacao.tipo === "receita" ? "+" : "-"}R$ {match.transacao.valor.toFixed(2)}
                          </p>
                          {match.vinculado && (
                            <p className="text-green-400 mt-1">
                              ✓ Vinculado: {match.lancamento.descricao}
                            </p>
                          )}
                        </div>
                        {match.vinculado && <CheckCircle2 size={14} className="text-green-400 flex-shrink-0 mt-0.5" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Fechar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}