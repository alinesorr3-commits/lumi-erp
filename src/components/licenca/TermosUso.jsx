import { useState } from "react";
import { Shield, FileText, CheckCircle, AlertTriangle, Lock } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function TermosUso({ user, licenca, onAceite }) {
  const [lido, setLido] = useState(false);
  const [aceitando, setAceitando] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const handleScroll = (e) => {
    const el = e.target;
    if (el.scrollHeight - el.scrollTop <= el.clientHeight + 50) {
      setScrolled(true);
    }
  };

  const handleAceitar = async () => {
    if (!lido || !scrolled) return;
    setAceitando(true);
    try {
      const agora = new Date().toISOString();
      // Atualiza a licença
      if (licenca?.id) {
        await base44.entities.LicencaCliente.update(licenca.id, {
          termos_aceitos: true,
          termos_aceitos_em: agora,
        });
      }
      // Registra log
      await base44.entities.LogAcesso.create({
        user_id: user.id,
        user_email: user.email,
        user_nome: user.full_name || user.email,
        acao: "aceite_termos",
        timestamp: agora,
        detalhes: "Termos de uso aceitos no primeiro acesso.",
        user_agent: navigator.userAgent,
      });
      onAceite?.();
    } catch (e) {
      console.error(e);
    } finally {
      setAceitando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background z-[9999] flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border bg-primary/5 rounded-t-2xl">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Shield size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Termos de Uso e Licença de Software</h2>
            <p className="text-xs text-muted-foreground">Lumi ERP — Leitura obrigatória antes do primeiro acesso</p>
          </div>
          <div className="ml-auto flex-shrink-0">
            <Lock size={16} className="text-muted-foreground" />
          </div>
        </div>

        {/* Corpo rolável */}
        <div
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 py-5 text-sm text-muted-foreground leading-relaxed space-y-4"
        >
          <div className="bg-yellow-500/10/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-300">
              <strong>AVISO LEGAL:</strong> Este software é protegido por direitos autorais e leis de propriedade intelectual. A utilização implica na aceitação integral destes termos.
            </p>
          </div>

          <section>
            <h3 className="text-foreground font-semibold mb-2 flex items-center gap-2"><FileText size={14} className="text-primary" /> 1. TITULARIDADE E PROPRIEDADE INTELECTUAL</h3>
            <p>O <strong className="text-foreground">Lumi ERP</strong> é um software desenvolvido, mantido e comercializado exclusivamente por <strong className="text-foreground">Aline Pereira de Souza</strong>, CPF/CNPJ a ser definido no ato do registro, doravante denominada "<strong className="text-foreground">PROPRIETÁRIA</strong>".</p>
            <p className="mt-2">Todo o código-fonte, arquitetura de sistema, identidade visual, banco de dados, estrutura de dados, algoritmos, fluxos de trabalho, documentação e demais componentes do Lumi ERP são de propriedade exclusiva da PROPRIETÁRIA, estando protegidos pela <strong className="text-foreground">Lei nº 9.609/98 (Lei de Software)</strong>, pela <strong className="text-foreground">Lei nº 9.610/98 (Lei de Direitos Autorais)</strong> e pelas demais legislações nacionais e internacionais aplicáveis.</p>
          </section>

          <section>
            <h3 className="text-foreground font-semibold mb-2 flex items-center gap-2"><FileText size={14} className="text-primary" /> 2. NATUREZA DA LICENÇA — SOFTWARE COMO SERVIÇO (SaaS)</h3>
            <p>O presente instrumento <strong className="text-foreground">NÃO constitui venda</strong> do software ou de qualquer de seus componentes. O usuário recebe exclusivamente uma <strong className="text-foreground">licença de uso não exclusiva, intransferível e revogável</strong>, mediante pagamento da assinatura correspondente ao plano contratado.</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>A licença é pessoal e vinculada ao CNPJ/CPF do contratante.</li>
              <li>O acesso é fornecido exclusivamente via plataforma oficial da PROPRIETÁRIA.</li>
              <li>O usuário não adquire qualquer direito sobre o código-fonte, estrutura ou propriedade intelectual do sistema.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-foreground font-semibold mb-2 flex items-center gap-2"><FileText size={14} className="text-primary" /> 3. CONDUTAS EXPRESSAMENTE PROIBIDAS</h3>
            <p>É <strong className="text-foreground">estritamente vedado</strong> ao usuário, sob pena de responsabilização civil e criminal:</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Copiar, reproduzir, distribuir, revender ou sublicenciar o software ou qualquer parte dele;</li>
              <li>Realizar engenharia reversa, descompilação, desmontagem ou qualquer tentativa de acessar o código-fonte;</li>
              <li>Modificar, adaptar, traduzir ou criar obras derivadas do software;</li>
              <li>Remover ou alterar avisos de propriedade intelectual, marcas ou identificações da PROPRIETÁRIA;</li>
              <li>Comercializar, arrendar, ceder ou transferir a licença a terceiros sem autorização formal e escrita da PROPRIETÁRIA;</li>
              <li>Clonar, duplicar ou instalar o sistema em ambientes não autorizados;</li>
              <li>Utilizar o sistema para desenvolver produto concorrente ou similar.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-foreground font-semibold mb-2 flex items-center gap-2"><FileText size={14} className="text-primary" /> 4. CONTROLE DE LICENÇA E MONITORAMENTO</h3>
            <p>O Lumi ERP realiza <strong className="text-foreground">verificações periódicas de licença</strong> junto aos servidores da PROPRIETÁRIA. O sistema registra:</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Logs de acesso com data, hora e identificação do usuário;</li>
              <li>Módulos acessados e frequência de uso;</li>
              <li>Endereços IP e dispositivos utilizados;</li>
              <li>Qualquer tentativa de acesso não autorizado.</li>
            </ul>
            <p className="mt-2">O acesso poderá ser <strong className="text-foreground">bloqueado remotamente</strong> pela PROPRIETÁRIA em caso de: inadimplência, violação dos termos, suspeita de uso fraudulento ou por qualquer outro motivo previsto no contrato.</p>
          </section>

          <section>
            <h3 className="text-foreground font-semibold mb-2 flex items-center gap-2"><FileText size={14} className="text-primary" /> 5. DADOS E PRIVACIDADE</h3>
            <p>Os dados inseridos pelo usuário permanecem sob sua responsabilidade. A PROPRIETÁRIA não se responsabiliza por perdas de dados decorrentes de uso indevido. O sistema possui criptografia de dados em repouso e em trânsito, conforme a <strong className="text-foreground">Lei nº 13.709/2018 (LGPD)</strong>.</p>
          </section>

          <section>
            <h3 className="text-foreground font-semibold mb-2 flex items-center gap-2"><FileText size={14} className="text-primary" /> 6. PENALIDADES</h3>
            <p>Qualquer violação dos termos desta licença sujeitará o infrator às penalidades previstas nas leis de direitos autorais e de software, podendo incluir:</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Indenização por danos materiais e morais;</li>
              <li>Bloqueio imediato e irrevogável da licença;</li>
              <li>Responsabilização criminal (Art. 12 da Lei 9.609/98 — pena de detenção de 6 meses a 2 anos, ou multa);</li>
              <li>Ação de perdas e danos na esfera civil.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-foreground font-semibold mb-2 flex items-center gap-2"><FileText size={14} className="text-primary" /> 7. FORO E LEGISLAÇÃO</h3>
            <p>Este instrumento é regido pela legislação brasileira. Fica eleito o foro da comarca do domicílio da PROPRIETÁRIA para dirimir quaisquer controvérsias, com renúncia expressa a qualquer outro.</p>
          </section>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
            <p className="text-xs text-foreground font-semibold">© Copyright — Todos os Direitos Reservados</p>
            <p className="text-sm font-bold text-primary mt-1">ALINE PEREIRA DE SOUZA</p>
            <p className="text-xs text-muted-foreground mt-1">Proprietária e Desenvolvedora do Lumi ERP</p>
            <p className="text-xs text-muted-foreground mt-0.5">Versão 2024 — Registro de Propriedade Intelectual em tramitação</p>
          </div>

          <p className="text-xs text-muted-foreground text-center italic">— Role até o final para habilitar o botão de aceite —</p>
        </div>

        {/* Rodapé de aceite */}
        <div className="px-6 py-4 border-t border-border bg-card rounded-b-2xl">
          <label className="flex items-start gap-3 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={lido}
              onChange={e => setLido(e.target.checked)}
              disabled={!scrolled}
              className="mt-0.5 accent-primary w-4 h-4 flex-shrink-0 cursor-pointer"
            />
            <span className="text-sm text-foreground">
              Li, compreendi e aceito integralmente os <strong>Termos de Uso e Licença de Software</strong> do Lumi ERP, ciente de que este software é licenciado e não vendido, sendo de propriedade exclusiva de <strong>Aline Pereira de Souza</strong>.
            </span>
          </label>

          {!scrolled && (
            <p className="text-xs text-muted-foreground text-center mb-3">⬇ Role o texto até o final para aceitar</p>
          )}

          <button
            onClick={handleAceitar}
            disabled={!lido || !scrolled || aceitando}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
          >
            {aceitando ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Registrando aceite...</>
            ) : (
              <><CheckCircle size={16} /> Aceitar e Acessar o Sistema</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}