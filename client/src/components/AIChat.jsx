import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Paperclip, X, FileCheck, Sparkles, ArrowUp } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';

const AIChat = ({ files }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Comment puis-je vous aider aujourd'hui ?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedContext, setSelectedContext] = useState(null);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/ai/chat', {
        prompt: input,
        history: messages,
        fileContext: selectedContext ? { name: selectedContext.name, path: selectedContext.path } : null
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Désolé, une erreur est survenue lors de l'analyse." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white text-slate-800">
      {/* Zone des messages (centrée comme ChatGPT) */}
      <div className="flex-1 overflow-y-auto w-full max-w-3xl mx-auto px-4 py-8 space-y-8">
        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center bg-slate-50 shrink-0">
                <Bot size={18} className="text-premium-accent" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-2xl px-5 py-3 ${
              msg.role === 'user' 
                ? 'bg-slate-100 text-slate-900 rounded-tr-none' 
                : 'bg-transparent border-none text-slate-700 leading-relaxed'
            }`}>
              {msg.role === 'assistant' && idx === 0 && <span className="font-bold block mb-2 text-premium-accent">Drive AI</span>}
              <p className="text-[15px] whitespace-pre-wrap">{msg.content}</p>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-premium-dark text-white flex items-center justify-center shrink-0">
                <User size={18} />
              </div>
            )}
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex gap-5 animate-pulse">
            <div className="w-8 h-8 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center">
              <Bot size={18} className="text-slate-300" />
            </div>
            <div className="h-10 w-24 bg-slate-50 rounded-2xl" />
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Barre d'input (minimaliste ChatGPT-style) */}
      <div className="w-full max-w-3xl mx-auto px-4 pb-10">
        <div className="relative bg-slate-50 rounded-[28px] border border-slate-200 focus-within:border-slate-300 transition-all p-2">
          {/* Fichier de contexte attaché */}
          {selectedContext && (
            <div className="absolute -top-12 left-2 flex items-center gap-2 bg-slate-900 text-white px-4 py-1.5 rounded-full text-xs animate-in slide-in-from-bottom-2">
              <FileCheck size={14} />
              <span className="max-w-[200px] truncate">{selectedContext.name}</span>
              <button onClick={() => setSelectedContext(null)} className="ml-1 hover:text-red-400">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Sélecteur de contexte (bouton trombone) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-end gap-2 pr-2">
              <div className="flex-1 flex flex-col">
                <textarea
                  rows="1"
                  placeholder="Posez une question..."
                  className="w-full bg-transparent px-4 py-3 focus:outline-none resize-none text-[15px] max-h-48 scrollbar-hide"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={`p-2.5 rounded-full transition-all ${
                  input.trim() && !isLoading 
                    ? 'bg-premium-dark text-white shadow-lg' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <ArrowUp size={20} />
              </button>
            </div>
            
            <div className="flex items-center gap-2 px-2 pb-1 overflow-x-auto whitespace-nowrap scrollbar-hide">
              <span className="text-[10px] uppercase font-bold text-slate-400 mr-2 flex items-center gap-1">
                <Paperclip size={12} /> Contexte :
              </span>
              {files.slice(0, 5).map(file => (
                <button
                  key={file.id}
                  onClick={() => setSelectedContext(file)}
                  className={`text-[11px] px-3 py-1 rounded-full border transition-all ${
                    selectedContext?.id === file.id 
                      ? 'bg-premium-accent text-white border-premium-accent' 
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {file.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="text-center text-[11px] text-slate-400 mt-4 flex items-center justify-center gap-1">
          Drive AI peut faire des erreurs. Envisagez de vérifier les informations importantes.
        </p>
      </div>
    </div>
  );
};

export default AIChat;
