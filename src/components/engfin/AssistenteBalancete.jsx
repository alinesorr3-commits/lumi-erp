import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { MessageCircle, X, Send, Bot, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

const FunctionDisplay = ({ toolCall }) => {
    const [expanded, setExpanded] = useState(false);
    
    // Status visual
    let statusIcon = '⏳';
    if (toolCall.status === 'success' || toolCall.status === 'completed') statusIcon = '✅';
    if (toolCall.status === 'error' || toolCall.status === 'failed') statusIcon = '❌';

    return (
        <div className="mt-2 text-xs bg-card/50 border border-border rounded-lg overflow-hidden">
            <button 
                onClick={() => setExpanded(!expanded)}
                className="w-full flex justify-between items-center px-3 py-2 hover:bg-muted text-foreground transition-colors"
            >
                <span className="font-mono flex items-center gap-1.5 opacity-80">
                   <Bot size={12}/> Buscando dados ({toolCall.name})
                </span>
                <span>{statusIcon}</span>
            </button>
            {expanded && (
                <div className="p-3 border-t border-border bg-card">
                    <p className="font-semibold mb-1 text-primary">Status: {toolCall.status}</p>
                </div>
            )}
        </div>
    );
};

export default function AssistenteBalancete() {
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open && !conversation) {
      iniciarConversa();
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const iniciarConversa = async () => {
    setLoading(true);
    try {
      const conv = await base44.agents.createConversation({ 
        agent_name: "balancete_assistant", 
        metadata: { name: "Análise de Balancete", description: "Chat do usuário com a IA Financeira" } 
      });
      setConversation(conv);
      
      const unsubscribe = base44.agents.subscribeToConversation(conv.id, (data) => {
        // Ignora a mensagem do system/instructions que às vezes volta no histórico do model, focamos no user e assistant
        const history = (data.messages || []).filter(m => m.role !== 'system');
        setMessages(history);
      });
      
      setLoading(false);
      return () => unsubscribe();
    } catch (err) {
      console.error("Erro ao iniciar conversa:", err);
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !conversation) return;
    
    const text = input;
    setInput("");
    
    try {
      await base44.agents.addMessage(conversation, { role: "user", content: text });
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
    }
  };

  if (!open) {
    return (
      <button 
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-500/10 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-all z-50 hover:bg-green-600"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[420px] h-[600px] max-h-[85vh] max-w-[90vw] bg-card border border-border shadow-2xl rounded-2xl flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-green-500/10/10 border-b border-green-500/20 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500/10/20 rounded-full flex justify-center items-center">
            <Bot size={20} className="text-green-500" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm">IA Consultor Financeiro</h3>
            <p className="text-[10px] font-medium text-green-500">Análise de Balancetes e Saúde da Empresa</p>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl p-3 bg-muted text-foreground text-sm border border-border">
                Olá! Sou o seu Assistente de IA Financeira do ERP GFE. Eu analiso seus <strong>Balancetes</strong>, leio seu <strong>Plano de Contas</strong> e ajudo a diagnosticar a saúde financeira da empresa.<br/><br/>Posso explicar métricas complexas de forma fácil. O que você gostaria de saber hoje?
            </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-20">
            <Loader2 className="animate-spin text-green-500" size={24} />
          </div>
        ) : (
          messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-3 ${m.role === 'user' ? 'bg-green-500/10 text-white' : 'bg-muted text-foreground border border-border'}`}>
                {m.content && (
                  m.role === 'user' ? (
                    <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                  ) : (
                    <div className="text-sm">
                      <ReactMarkdown
                         components={{
                            ul: ({node, ...props}) => <ul className="list-disc ml-4 space-y-1 my-2" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal ml-4 space-y-1 my-2" {...props} />,
                            li: ({node, ...props}) => <li className="pl-1" {...props} />,
                            h3: ({node, ...props}) => <h3 className="font-bold text-base mt-3 mb-1 text-green-500" {...props} />,
                            h4: ({node, ...props}) => <h4 className="font-semibold text-sm mt-3 mb-1" {...props} />,
                            p: ({node, ...props}) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-bold text-green-400" {...props} />
                         }}
                      >{m.content}</ReactMarkdown>
                    </div>
                  )
                )}
                {m.tool_calls?.map((tc, idx2) => <FunctionDisplay key={idx2} toolCall={tc} />)}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border bg-muted/30">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Analise o balancete mais recente..."
            className="w-full bg-card border border-border rounded-full pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-green-500 text-foreground shadow-sm"
          />
          <button 
            type="submit"
            disabled={!input.trim()}
            className="absolute right-1.5 w-9 h-9 flex justify-center items-center bg-green-500/10 text-white rounded-full hover:bg-green-600 disabled:opacity-50 transition-colors shadow-md"
          >
            <Send size={14} className="mr-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}