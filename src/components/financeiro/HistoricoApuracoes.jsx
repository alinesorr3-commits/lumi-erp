import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Download, Trash2, Search, Calendar, Package } from "lucide-react";

export default function HistoricoApuracoes({ contaId }) {
  const [arquivos, setArquivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    carregarArquivos();
  }, [contaId]);

  const carregarArquivos = async () => {
    try {
      const dados = await base44.entities.ArquivoApuracao.filter({
        conta_bancaria_id: contaId
      }, "-created_date");
      setArquivos(dados || []);
    } catch (e) {
      console.error("Erro ao carregar arquivos:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Remover este arquivo do histórico?")) return;
    try {
      await base44.entities.ArquivoApuracao.delete(id);
      setArquivos(arquivos.filter(a => a.id !== id));
    } catch (e) {
      console.error("Erro ao deletar:", e);
    }
  };

  const handleDownload = async (arquivo) => {
    try {
      const signedUrl = await base44.integrations.Core.CreateFileSignedUrl({
        file_uri: arquivo.arquivo_url
      });
      const link = document.createElement("a");
      link.href = signedUrl.signed_url;
      link.download = arquivo.nome_arquivo;
      link.click();
    } catch (e) {
      console.error("Erro ao baixar arquivo:", e);
      alert("Erro ao baixar arquivo");
    }
  };

  const filtered = arquivos.filter(a =>
    a.nome_arquivo.toLowerCase().includes(search.toLowerCase()) ||
    a.descricao?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-4 h-4 border-2 border-muted border-t-primary rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Histórico de Apurações</h3>
          <p className="text-xs text-muted-foreground">Arquivos importados salvos em nuvem</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="bg-card border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary w-48"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Package size={24} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhum arquivo salvo ainda</p>
          <p className="text-xs mt-1">Importe um arquivo OFX ou PDF para começar</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs text-muted-foreground px-4 py-3 font-medium">Arquivo</th>
                <th className="text-left text-xs text-muted-foreground px-4 py-3 font-medium">Data</th>
                <th className="text-left text-xs text-muted-foreground px-4 py-3 font-medium">Transações</th>
                <th className="text-left text-xs text-muted-foreground px-4 py-3 font-medium">Observações</th>
                <th className="text-right text-xs text-muted-foreground px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(arquivo => (
                <tr key={arquivo.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">
                          {arquivo.tipo_arquivo === "OFX" ? "OFX" : "PDF"}
                        </span>
                      </div>
                      <span className="text-sm text-foreground font-medium truncate">{arquivo.nome_arquivo}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} />
                      {new Date(arquivo.data_importacao).toLocaleDateString("pt-BR")}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {arquivo.quantidade_vinculadas}/{arquivo.quantidade_transacoes}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {arquivo.descricao && (
                      <span className="max-w-xs truncate" title={arquivo.descricao}>{arquivo.descricao}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => handleDownload(arquivo)}
                        title="Baixar arquivo"
                        className="p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-muted transition-colors"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(arquivo.id)}
                        title="Remover"
                        className="p-1.5 text-muted-foreground hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-colors"
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
  );
}