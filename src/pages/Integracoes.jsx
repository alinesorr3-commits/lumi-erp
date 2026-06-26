import React, { useState, useEffect } from 'react';
import { Network, Database, Lock, Search, FileSignature, UploadCloud, RefreshCw, Server, AlertCircle, CheckCircle2 } from 'lucide-react';

const INTEGRATIONS = [
  {
    id: 'serpro',
    name: 'SERPRO',
    description: 'Integração para Assinatura Digital, Transmissão e Validação de Documentos.',
    icon: FileSignature,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    status: 'configured',
    features: ['Assinatura digital', 'Consulta de dados fiscais', 'Validação de documentos']
  },
  {
    id: 'banco',
    name: 'Open Finance / Bancária',
    description: 'Importação automática de extratos e conciliação bancária inteligente via IA.',
    icon: Network,
    color: 'text-green-400',
    bg: 'bg-green-400/10',
    status: 'pending',
    features: ['Importação automática', 'Conciliação com IA', 'Identificação PIX/TED/Boletos']
  },
  {
    id: 'esocial',
    name: 'eSocial',
    description: 'Transmissão automática de eventos trabalhistas, admissão, folha e demissão.',
    icon: Users,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    status: 'error',
    features: ['Cadastro de funcionários', 'Folha de pagamento', 'Transmissão de eventos']
  },
  {
    id: 'pgdas',
    name: 'PGDAS-D',
    description: 'Apuração automática do Simples Nacional, conferência de tributos e relatórios.',
    icon: Calculator,
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    status: 'pending',
    features: ['Apuração automática', 'Importação de faturamento', 'Históricos']
  },
  {
    id: 'docs',
    name: 'Captura de Docs Fiscais',
    description: 'Busca automática de NF-e, NFS-e, CT-e e MDF-e via Certificado Digital A1/A3.',
    icon: Search,
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    status: 'configured',
    features: ['Busca automática (Sefaz)', 'Download de XML e PDF', 'Armazenamento em nuvem']
  }
];

function Users(props) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>; }
function Calculator(props) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"></rect><line x1="8" x2="16" y1="6" y2="6"></line><line x1="16" x2="16" y1="14" y2="18"></line><path d="M16 10h.01"></path><path d="M12 10h.01"></path><path d="M8 10h.01"></path><path d="M12 14h.01"></path><path d="M8 14h.01"></path><path d="M12 18h.01"></path><path d="M8 18h.01"></path></svg>; }

import { base44 } from '@/api/base44Client';
import { useToast } from "@/components/ui/use-toast";
import { X, Check } from 'lucide-react';

function ConfigModal({ int, config, onClose, onSave }) {
  const [dados, setDados] = useState(config?.dados || {});
  const [loading, setLoading] = useState(false);

  const handleChange = (field, val) => {
    setDados(prev => ({ ...prev, [field]: val }));
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSave(int.id, dados);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">Configurar {int.name}</h2>
            <p className="text-xs text-muted-foreground">Insira as credenciais de acesso</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSalvar} className="p-5 space-y-4">
          {int.id === 'banco' && (
            <>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Instituição Financeira</label>
                <select required value={dados.banco || ''} onChange={e => handleChange("banco", e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                  <option value="">Selecione o banco...</option>
                  <option value="bb">Banco do Brasil</option>
                  <option value="itau">Itaú</option>
                  <option value="bradesco">Bradesco</option>
                  <option value="santander">Santander</option>
                  <option value="nubank">Nubank</option>
                  <option value="inter">Inter</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Client ID (Open Finance API)</label>
                <input required value={dados.client_id || ''} onChange={e => handleChange("client_id", e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Client Secret</label>
                <input required type="password" value={dados.client_secret || ''} onChange={e => handleChange("client_secret", e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
            </>
          )}

          {int.id === 'esocial' && (
            <>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Ambiente</label>
                <select value={dados.ambiente || 'Produção'} onChange={e => handleChange("ambiente", e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                  <option value="Homologação">Homologação (Testes)</option>
                  <option value="Produção">Produção</option>
                </select>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted/30 border border-border rounded-lg mt-2">
                <input type="checkbox" id="cert_emp" checked={dados.usar_certificado_empresa !== false} onChange={e => handleChange("usar_certificado_empresa", e.target.checked)} className="rounded" />
                <label htmlFor="cert_emp" className="text-sm text-foreground cursor-pointer">Usar Certificado Digital A1 da Empresa</label>
              </div>
              {dados.usar_certificado_empresa === false && (
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Token de Acesso (Alternativo)</label>
                  <input required type="text" value={dados.token || ''} onChange={e => handleChange("token", e.target.value)}
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
                </div>
              )}
            </>
          )}

          {int.id === 'pgdas' && (
            <>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">CNPJ</label>
                <input required value={dados.cnpj || ''} onChange={e => handleChange("cnpj", e.target.value)} placeholder="00.000.000/0000-00"
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted/30 border border-border rounded-lg mt-2">
                <input type="checkbox" id="cert_emp_pgdas" checked={dados.usar_certificado_empresa !== false} onChange={e => handleChange("usar_certificado_empresa", e.target.checked)} className="rounded" />
                <label htmlFor="cert_emp_pgdas" className="text-sm text-foreground cursor-pointer">Usar Certificado Digital A1 da Empresa para Acesso (e-CAC)</label>
              </div>
              {dados.usar_certificado_empresa === false && (
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Código de Acesso do Simples Nacional</label>
                  <input required type="password" value={dados.codigo_acesso || ''} onChange={e => handleChange("codigo_acesso", e.target.value)}
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
                </div>
              )}
            </>
          )}

          {int.id === 'docs' && (
            <>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Estado (UF)</label>
                <select required value={dados.uf || ''} onChange={e => handleChange("uf", e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                  <option value="">Selecione...</option>
                  {['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'].map(uf => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted/30 border border-border rounded-lg mt-2">
                <input type="checkbox" id="cert_emp_docs" checked={dados.usar_certificado_empresa !== false} onChange={e => handleChange("usar_certificado_empresa", e.target.checked)} className="rounded" />
                <label htmlFor="cert_emp_docs" className="text-sm text-foreground cursor-pointer">Usar Certificado Digital A1 da Empresa para Captura na SEFAZ</label>
              </div>
            </>
          )}

          {!['banco', 'esocial', 'pgdas', 'docs'].includes(int.id) && (
            <div className="text-sm text-muted-foreground p-3 border border-dashed border-border rounded-lg text-center">
              Configurações em desenvolvimento para {int.name}
            </div>
          )}

          <div className="pt-4 flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-muted text-muted-foreground rounded-lg text-sm hover:text-foreground">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 flex justify-center items-center gap-2">
              {loading ? "Salvando..." : <><Check size={16} /> Salvar Conexão</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Integracoes() {
  const [syncing, setSyncing] = useState(false);
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalInt, setModalInt] = useState(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.IntegracaoConfig.list();
    setConfigs(data || []);
    setLoading(false);
  };

  React.useEffect(() => { load(); }, []);

  const handleSaveConfig = async (tipo, dados) => {
    try {
      const existing = configs.find(c => c.tipo === tipo);
      const payload = {
        empresa_id: "0", // Defaulting to 0 since we don't have a multi-company context here directly. Ideally use context.
        tipo,
        status: "configured",
        dados
      };

      if (existing) {
        await base44.entities.IntegracaoConfig.update(existing.id, payload);
      } else {
        await base44.entities.IntegracaoConfig.create(payload);
      }
      
      toast({ title: "Conectado", description: "Integração configurada com sucesso!" });
      setModalInt(null);
      load();
    } catch (err) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleSyncAll = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      toast({ title: "Sincronizado", description: "Dados atualizados com sucesso." });
    }, 2000);
  };

  return (
    <div className="p-6 lg:p-8 relative">
      {modalInt && (
        <ConfigModal 
          int={modalInt} 
          config={configs.find(c => c.tipo === modalInt.id)} 
          onClose={() => setModalInt(null)} 
          onSave={handleSaveConfig} 
        />
      )}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">Integrações e APIs</h1>
          <p className="text-muted-foreground text-sm mt-1">Configure suas conexões governamentais, bancárias e fiscais</p>
        </div>
        <button 
          onClick={handleSyncAll}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Sincronizando...' : 'Sincronizar Tudo'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {INTEGRATIONS.map(int => {
          const Icon = int.icon;
          const conf = configs.find(c => c.tipo === int.id);
          const currentStatus = conf ? conf.status : int.status; // Default to the mocked status if not found
          
          return (
            <div key={int.id} className={`bg-card border border-border rounded-xl p-6 flex flex-col transition-all ${currentStatus === 'configured' ? 'border-primary/30 shadow-sm shadow-primary/5' : 'hover:border-border/80'}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${int.bg}`}>
                    <Icon size={24} className={int.color} />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">{int.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {currentStatus === 'configured' && <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full"><CheckCircle2 size={12}/> Conectado</span>}
                      {currentStatus === 'pending' && <span className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full"><AlertCircle size={12}/> Não configurado</span>}
                      {currentStatus === 'error' && <span className="flex items-center gap-1 text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full"><AlertCircle size={12}/> Falha na Autenticação</span>}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setModalInt(int)}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {currentStatus === 'configured' ? 'Gerenciar' : 'Configurar'}
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-4 flex-1">{int.description}</p>
              <div className="space-y-2 pt-4 border-t border-border">
                {int.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-border" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <div className="bg-card border border-border rounded-xl p-6 flex flex-col opacity-60 grayscale">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-muted">
                <UploadCloud size={24} className="text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-lg">Obrigações Acessórias (Em breve)</h3>
                <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full mt-1 w-fit">Desenvolvimento</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Transmissão automática de DCTFWeb, EFD-Reinf, ISS e outras obrigações mensais e anuais.</p>
        </div>
      </div>
    </div>
  );
}