import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from "@/components/ui/use-toast";
import { Calculator, Download, CheckCircle2, AlertTriangle, RefreshCw, Send, DollarSign } from 'lucide-react';

export default function ApuracaoPGDAS() {
  const [apuracoes, setApuracoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [receita, setReceita] = useState('');
  const [competencia, setCompetencia] = useState('');
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.ApuracaoImposto.filter({ tipo_imposto: "PGDAS-D (Simples Nacional)" }, "-data_apuracao");
    setApuracoes(data || []);
    
    if (!competencia) {
      const today = new Date();
      // Mês anterior é a competência atual
      today.setMonth(today.getMonth() - 1);
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = today.getFullYear();
      setCompetencia(`${mm}/${yyyy}`);
    }
    
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleApurar = async (e) => {
    e.preventDefault();
    if (!receita || !competencia) return;

    setProcessing(true);
    try {
      const response = await base44.functions.invoke('apurarPGDAS', {
        competencia,
        receita_bruta: Number(receita)
      });

      if (response.data?.success) {
        toast({ title: "Sucesso", description: response.data.mensagem });
        setReceita('');
        load();
      } else {
        toast({ title: "Erro na apuração", description: response.data?.error || "Erro desconhecido", variant: "destructive" });
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      toast({ title: "Erro", description: errorMsg, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
          <Calculator size={20} className="text-primary" /> Apurar Simples Nacional (PGDAS-D)
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Esta funcionalidade utilizará a conexão configurada (Certificado Digital ou Código de Acesso) para transmitir e calcular o DAS automaticamente junto à Receita Federal.
        </p>

        <form onSubmit={handleApurar} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Competência (MM/AAAA)</label>
            <input 
              required 
              type="text" 
              placeholder="MM/AAAA"
              value={competencia} 
              onChange={e => setCompetencia(e.target.value)}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" 
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Receita Bruta do Mês (R$)</label>
            <input 
              required 
              type="number" 
              step="0.01"
              placeholder="Ex: 50000.00"
              value={receita} 
              onChange={e => setReceita(e.target.value)}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" 
            />
          </div>
          <button 
            type="submit" 
            disabled={processing}
            className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {processing ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
            {processing ? "Transmitindo e Calculando..." : "Apurar e Transmitir"}
          </button>
        </form>
      </div>

      <div>
        <h3 className="text-base font-semibold text-foreground mb-3">Histórico de Apurações</h3>
        
        {loading ? (
           <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
        ) : apuracoes.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <Calculator size={32} className="mx-auto mb-3 opacity-30 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhuma apuração realizada ainda.</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground text-xs">
                <tr>
                  <th className="px-4 py-3 font-medium">Competência</th>
                  <th className="px-4 py-3 font-medium">Data Apuração</th>
                  <th className="px-4 py-3 font-medium">Receita Bruta</th>
                  <th className="px-4 py-3 font-medium">Valor Devido</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {apuracoes.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{item.competencia}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(item.data_apuracao).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      R$ {item.receita_bruta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 font-semibold text-yellow-400">
                      R$ {item.valor_imposto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full w-fit">
                        <CheckCircle2 size={12} /> {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate" title={item.detalhes}>
                      {item.detalhes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}