import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Paperclip, X, FileCheck } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';

const AIChat = ({ files }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Bonjour ! Je suis Drive AI. Sélectionnez un fichier ou posez-moi n'importe quelle question sur vos documents." }
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
      const response = await axios.post('ai/chat', {
        prompt: input,
        history: messages,
        fileContext: selectedContext ? { name: selectedContext.name, path: selectedContext.path } : null
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Erreur lors de la communication avec l'IA." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-6 pb-10 pr-2">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-premium-accent text-white' : 'bg-white border text-premium-accent'}`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
              <p className="text-sm">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && <div className="text-xs text-slate-400 italic">Drive AI analyse...</div>}
        <div ref={chatEndRef} />
      </div>

      <div className="sticky bottom-0 bg-premium-light pt-4 pb-6">
        {/* Sélecteur de fichier contexte */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {files.map(file => (
            <button 
              key={file.id} 
              onClick={() => setSelectedContext(file)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all whitespace-nowrap ${
                selectedContext?.id === file.id ? 'bg-premium-accent text-white border-premium-accent' : 'bg-white text-slate-500 border-slate-100 hover:border-premium-accent'
              }`}
            >
              <FileCheck size={12} /> {file.name}
            </button>
          ))}
        </div>

        <div className="relative bg-white border border-slate-200 rounded-3xl shadow-xl p-2 flex items-center">
          {selectedContext && (
            <div className="absolute -top-12 left-0 bg-premium-accent text-white px-3 py-1 rounded-lg text-xs flex items-center gap-2">
              <Paperclip size={12} /> {selectedContext.name}
              <button onClick={() => setSelectedContext(null)}><X size={12} /></button>
            </div>
          )}
          <textarea
            rows="1" placeholder="Posez votre question..."
            className="flex-1 bg-transparent px-4 py-3 outline-none resize-none text-sm"
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
          />
          <button onClick={handleSend} className="p-3 bg-premium-accent text-white rounded-2xl hover:scale-105 active:scale-95 transition-all">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
