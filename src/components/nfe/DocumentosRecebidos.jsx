import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, FileText, Trash2, Download, AlertCircle } from "lucide-react";
import RateioModal from "./RateioModal";

const fmt = (d) => d ? new Date(d).toLocaleDateString("pt-BR") : "-";

export default function DocumentosRecebidos() {
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rateioOpen, setRateioOpen] = useState(false);
  const [docSelecionado, setDocSelecionado] = useState(null);
  const [empresas, setEmpresas] = useState([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [progresso, setProgresso] = useState(null); // { atual, total, nomeArquivo }
  const [filtroSituacao, setFilterSituacao] = useState("Pendentes");
  const [filtroFornecedor, setFiltroFornecedor] = useState("");

  const loadDocumentos = async () => {
    try {
      const query = { tipo_operacao: "Entrada" };
      if (filtroSituacao === "Pendentes") {
        query.situacao = "Rascunho";
      } else if (filtroSituacao !== "Todas") {
        query.situacao = filtroSituacao;
      }
      
      let data = await base44.entities.NotaFiscalEletronica.filter(query, "-created_date");
      
      if (filtroFornecedor) {
        data = data.filter(d => d.destinatario_nome?.toLowerCase().includes(filtroFornecedor.toLowerCase()));
      }
      
      setDocumentos(data);
    } catch (e) {
      console.error("Erro ao carregar documentos:", e);
    }
  };

  useEffect(() => {
    loadDocumentos();
  }, [filtroSituacao, filtroFornecedor]);

  useEffect(() => { 
    base44.entities.EmpresaCliente.list().then(setEmpresas);
  }, []);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (!empresaSelecionada) {
      setError("Selecione uma empresa para importar os documentos");
      return;
    }

    setLoading(true);
    setError("");
    setProgresso({ atual: 0, total: files.length, nomeArquivo: "" });

    try {
      for (let idx = 0; idx < files.length; idx++) {
        const file = files[idx];
        setProgresso({ atual: idx + 1, total: files.length, nomeArquivo: file.name });
        try {
          const uploadRes = await base44.integrations.Core.UploadPrivateFile({ file });
          
          let dadosExtraidos = {
            empresa_id: empresaSelecionada,
            tipo_operacao: "Entrada",
            tipo_doc: "NF-e",
            numero: "",
            serie: "1",
            data_emissao: new Date().toISOString().split("T")[0],
            destinatario_nome: "",
            valor_total: 0,
            situacao: "Rascunho",
            xml_url: uploadRes.file_uri,
            itens: []
          };

          // Se for XML, tenta extrair dados
          if (file.name.endsWith(".xml")) {
            try {
              const conteudo = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = reject;
                reader.readAsText(file);
              });

              // Extração de dados do XML
              const numeroMatch = conteudo.match(/<nNF>(\d+)<\/nNF>/);
              const serieMatch = conteudo.match(/<serie>(\d+)<\/serie>/);
              const dataMatch = conteudo.match(/<dhEmi>([^<]+)<\/dhEmi>/);
              const nomeFornecedor = conteudo.match(/<xNome>([^<]{0,150})<\/xNome>/);
              const totalMatch = conteudo.match(/<vNF>([0-9.]+)<\/vNF>/);

              if (numeroMatch) dadosExtraidos.numero = numeroMatch[1];
              if (serieMatch) dadosExtraidos.serie = serieMatch[1];
              if (dataMatch) dadosExtraidos.data_emissao = dataMatch[1].substring(0, 10);
              if (nomeFornecedor) dadosExtraidos.destinatario_nome = nomeFornecedor[1].trim();
              if (totalMatch) dadosExtraidos.valor_total = parseFloat(totalMatch[1]);
            } catch (parseErr) {
              console.error("Erro ao extrair XML:", parseErr);
            }
          }

          // Salvar documento
          await base44.entities.NotaFiscalEletronica.create(dadosExtraidos);
        } catch (fileErr) {
          console.error(`Erro ao processar arquivo ${file.name}:`, fileErr);
          setError(`Erro ao processar ${file.name}: ${fileErr.message}`);
        }
      }
      loadDocumentos();
    } catch (err) {
      console.error("Erro ao fazer upload:", err);
      setError(err.message || "Erro ao processar arquivo");
    } finally {
      setLoading(false);
      setProgresso(null);
      // limpa o input para permitir reimportar os mesmos arquivos
      const input = document.getElementById("file-input-recebidas");
      if (input) input.value = "";
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir este documento?")) return;
    try {
      await base44.entities.NotaFiscalEletronica.delete(id);
      loadDocumentos();
    } catch (e) {
      console.error("Erro ao excluir:", e);
    }
  };

  const handleDeleteBatch = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Excluir ${selected.size} documento(s)?`)) return;
    for (const id of selected) {
      await base44.entities.NotaFiscalEletronica.delete(id);
    }
    setSelected(new Set());
    loadDocumentos();
  };

  const toggleSelect = (id) => {
    const newSet = new Set(selected);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelected(newSet);
  };

  const handleDarEntrada = (doc) => {
    setDocSelecionado(doc);
    setRateioOpen(true);
  };

  const updateSituacao = async (id, novaSituacao) => {
    try {
      await base44.entities.NotaFiscalEletronica.update(id, { situacao: novaSituacao });
      loadDocumentos();
    } catch (e) {
      console.error("Erro ao atualizar situação:", e);
      setError("Erro ao atualizar situação.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="bg-muted/50 border border-border rounded-xl p-4 mb-4">
        <label className="block text-xs font-medium text-muted-foreground mb-2">Empresa Receptora *</label>
        <select
          value={empresaSelecionada}
          onChange={e => setEmpresaSelecionada(e.target.value)}
          className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
        >
          <option value="">Selecionar empresa...</option>
          {empresas.map(emp => (
            <option key={emp.id} value={emp.id}>
              {emp.razao_social} — {emp.cnpj}
            </option>
          ))}
        </select>
      </div>

      <div className={`bg-card border-2 border-dashed border-border rounded-xl p-8 text-center transition-colors ${empresaSelecionada ? "hover:border-primary/50 cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
        onClick={() => empresaSelecionada && !loading && document.getElementById("file-input-recebidas").click()}>
        <Upload size={32} className="mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">Clique para importar documentos</p>
        <p className="text-xs text-muted-foreground mt-1">XML, PDF ou XLS · Múltiplos arquivos (lote) · Até 50 MB cada</p>
        <p className="text-xs text-primary mt-1 font-medium">✓ Importação em lote — selecione vários arquivos de uma vez</p>
        <input
          id="file-input-recebidas"
          type="file"
          multiple
          accept=".xml,.pdf,.xls,.xlsx"
          onChange={handleFileUpload}
          disabled={loading || !empresaSelecionada}
          className="hidden"
        />
      </div>

      {/* Barra de progresso do lote */}
      {progresso && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-foreground font-medium">Importando em lote...</span>
            <span className="text-muted-foreground">{progresso.atual} / {progresso.total}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progresso.atual / progresso.total) * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground truncate">📄 {progresso.nomeArquivo}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-400/10 border border-red-400/30 rounded-lg p-3 flex gap-3">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-300">Erro ao processar arquivo</p>
            <p className="text-xs text-red-300/80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Documentos List */}
      <div className="bg-card border border-border rounded-xl">
        <div className="p-5 border-b border-border flex items-center justify-between flex-wrap gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <h3 className="text-sm font-semibold text-foreground">Documentos Importados ({documentos.length})</h3>
              <div className="flex gap-1 bg-muted p-1 rounded-lg">
                {["Pendentes", "Autorizada", "Cancelada", "Devolvida", "Desconhecida", "Todas"].map(s => (
                  <button 
                    key={s} 
                    onClick={() => setFilterSituacao(s)}
                    className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${filtroSituacao === s ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <input
                value={filtroFornecedor}
                onChange={e => setFiltroFornecedor(e.target.value)}
                placeholder="Filtrar por Fornecedor..."
                className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary w-64"
              />
            </div>
          </div>
          {selected.size > 0 && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  const docsSelecionados = documentos.filter(d => selected.has(d.id));
                  setDocSelecionado(docsSelecionados);
                  setRateioOpen(true);
                }} 
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10/20 text-green-400 rounded-lg text-xs font-medium hover:bg-green-500/10/30 transition-colors"
              >
                Dar Entrada em Lote ({selected.size})
              </button>
              <div className="relative group">
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border text-muted-foreground rounded-lg text-xs font-medium hover:text-foreground transition-colors">
                  Ações em Lote ▾
                </button>
                <div className="absolute right-0 top-full mt-1 w-36 bg-popover border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 overflow-hidden">
                  <button onClick={async () => {
                    if(!confirm("Cancelar selecionadas?")) return;
                    for (const id of selected) await base44.entities.NotaFiscalEletronica.update(id, { situacao: "Cancelada" });
                    setSelected(new Set()); loadDocumentos();
                  }} className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-muted">Cancelar Lote</button>
                  <button onClick={async () => {
                    if(!confirm("Devolver selecionadas?")) return;
                    for (const id of selected) await base44.entities.NotaFiscalEletronica.update(id, { situacao: "Devolvida" });
                    setSelected(new Set()); loadDocumentos();
                  }} className="w-full text-left px-3 py-2 text-xs text-yellow-400 hover:bg-muted">Devolver Lote</button>
                  <button onClick={async () => {
                    if(!confirm("Desconhecer selecionadas?")) return;
                    for (const id of selected) await base44.entities.NotaFiscalEletronica.update(id, { situacao: "Desconhecida" });
                    setSelected(new Set()); loadDocumentos();
                  }} className="w-full text-left px-3 py-2 text-xs text-yellow-400 hover:bg-muted">Desconhecer Lote</button>
                </div>
              </div>
              <button onClick={handleDeleteBatch} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10/20 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/10/30 transition-colors">
                Excluir {selected.size}
              </button>
            </div>
          )}
        </div>
        
        {documentos.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <FileText size={28} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum documento importado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground w-8">
                    <input type="checkbox" checked={selected.size === documentos.length && documentos.length > 0}
                      onChange={() => {
                        if (selected.size === documentos.length) setSelected(new Set());
                        else setSelected(new Set(documentos.map(d => d.id)));
                      }}
                      className="cursor-pointer" />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Número</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Fornecedor</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Data</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Valor</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Situação</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {documentos.map((doc) => (
                  <tr key={doc.id} className={`border-b border-border/50 transition-colors ${selected.has(doc.id) ? "bg-primary/10" : "hover:bg-muted/30"}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(doc.id)} onChange={() => toggleSelect(doc.id)} className="cursor-pointer" />
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-muted rounded text-xs font-medium">
                        <FileText size={12} />
                        {doc.tipo_doc}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground font-medium">{doc.numero || "—"}</td>
                    <td className="px-4 py-3 text-foreground">{doc.destinatario_nome || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{fmt(doc.data_emissao)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-400">
                      R$ {(doc.valor_total || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
 doc.situacao === 'Autorizada' ? 'bg-green-400/10 text-green-400' : 
 doc.situacao === 'Cancelada' ? 'bg-red-400/10 text-red-400' :
 doc.situacao === 'Devolvida' ? 'bg-yellow-400/10 text-yellow-400' :
 doc.situacao === 'Desconhecida' ? 'bg-yellow-400/10 text-yellow-400' :
 'bg-muted text-muted-foreground'
 }`}>
                        {doc.situacao === "Rascunho" ? "Pendente" : doc.situacao}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {doc.situacao === "Rascunho" && (
                          <>
                            <button 
                              onClick={() => handleDarEntrada(doc)}
                              className="text-xs text-green-400 font-medium hover:underline">
                              Dar Entrada
                            </button>
                            <div className="relative group">
                              <button className="text-xs text-muted-foreground hover:text-foreground">
                                Ações ▾
                              </button>
                              <div className="absolute right-0 top-full mt-1 w-32 bg-popover border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 overflow-hidden">
                                <button onClick={() => updateSituacao(doc.id, "Cancelada")} className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-muted">Cancelar</button>
                                <button onClick={() => updateSituacao(doc.id, "Devolvida")} className="w-full text-left px-3 py-2 text-xs text-yellow-400 hover:bg-muted">Devolver</button>
                                <button onClick={() => updateSituacao(doc.id, "Desconhecida")} className="w-full text-left px-3 py-2 text-xs text-yellow-400 hover:bg-muted">Desconhecer</button>
                              </div>
                            </div>
                          </>
                        )}
                        
                        {doc.xml_url && (
                          <a href={doc.xml_url} download className="text-primary text-xs hover:underline ml-1">
                            <Download size={14} />
                          </a>
                        )}
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="text-red-400 text-xs hover:underline ml-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {rateioOpen && docSelecionado && (
        <RateioModal
          documento={docSelecionado}
          onClose={() => { setRateioOpen(false); setDocSelecionado(null); }}
          onConfirm={() => { setRateioOpen(false); setDocSelecionado(null); loadDocumentos(); }}
        />
      )}
    </div>
  );
}