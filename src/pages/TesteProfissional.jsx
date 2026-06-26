import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function TesteProfissional() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ empresa: '', cnpj: '', email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await base44.auth.register({ email: form.email, password: form.password });
      setStep(2);
    } catch (err) {
      setError(err.message || 'Erro ao registrar.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await base44.auth.verifyOtp({ email: form.email, otpCode: otp });
      await base44.auth.setToken(res.access_token);
      
      await base44.functions.invoke('iniciarTesteProfissional', {
        empresa: form.empresa,
        cnpj: form.cnpj
      });

      window.location.href = '/';
    } catch (err) {
      setError(err.message || 'Erro ao verificar código. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-6 lg:p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mb-4">
            <ShieldCheck size={24} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold font-heading text-foreground">Teste 10 dias Grátis</h1>
          <p className="text-sm text-muted-foreground mt-2">Plano Profissional completo liberado</p>
        </div>

        {error && (
          <div className="bg-red-500/10/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Nome da Empresa</label>
              <input required value={form.empresa} onChange={e => setForm({...form, empresa: e.target.value})} className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm focus:border-primary outline-none" placeholder="Minha Empresa Ltda" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">CNPJ</label>
              <input required value={form.cnpj} onChange={e => setForm({...form, cnpj: e.target.value})} className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm focus:border-primary outline-none" placeholder="00.000.000/0000-00" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">E-mail Corporativo</label>
              <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm focus:border-primary outline-none" placeholder="email@empresa.com.br" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Senha de Acesso</label>
              <input required type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm focus:border-primary outline-none" placeholder="••••••••" minLength={6} />
              <p className="text-[10px] text-muted-foreground mt-1">O login de acesso será seu E-mail e Senha, vinculados ao seu CNPJ.</p>
            </div>
            
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors mt-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Criar Conta e Iniciar Teste'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="bg-green-500/10/10 border border-green-500/20 text-green-400 text-sm px-4 py-3 rounded-lg mb-6 flex items-start gap-2">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              <p>Enviamos um código de verificação para <strong>{form.email}</strong>. Verifique sua caixa de entrada e spam.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Código de Verificação (OTP)</label>
              <input required value={otp} onChange={e => setOtp(e.target.value)} className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-center tracking-[0.5em] font-mono text-lg focus:border-primary outline-none" placeholder="000000" />
            </div>
            
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors mt-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Confirmar e Acessar'}
            </button>
          </form>
        )}
        
        <div className="mt-6 text-center text-xs text-muted-foreground">
          Já tem uma conta? <a href="/login" className="text-primary hover:underline">Faça login</a>
        </div>
      </div>
    </div>
  );
}