import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User, Bot, Paperclip, X } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';

const AIChat = ({ files }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Bonjour ! Je suis Drive AI. Comment puis-je vous aider avec vos fichiers aujourd'hui ?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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
        fileContext: selectedFile ? { name: selectedFile.name, id: selectedFile.id } : null
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Erreur: Impossible de contacter l'IA." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      {/* Zone de chat */}
      <div className="flex-1 overflow-y-auto space-y-6 pb-12 pr-4">
        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              msg.role === 'user' ? 'bg-premium-accent text-white' : 'bg-white border border-slate-200 text-premium-accent'
            }`}>
              {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
            </div>
            <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-premium-accent animate-pulse">
              <Bot size={18} />
            </div>
            <div className="chat-bubble-ai italic text-slate-400">L'IA réfléchit...</div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Bar - Design ChatGPT inspired */}
      <div className="sticky bottom-0 bg-premium-light pb-8">
        {selectedFile && (
          <div className="mb-2 flex items-center gap-2 px-4 py-1 bg-white border border-slate-200 rounded-full w-fit text-xs text-slate-500">
            <Paperclip size={12} />
            <span className="max-w-[150px] truncate">{selectedFile.name}</span>
            <button onClick={() => setSelectedFile(null)} className="hover:text-red-500">
              <X size={12} />
            </button>
          </div>
        )}
        <div className="relative bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/40 p-2 group focus-within:ring-2 focus-within:ring-premium-accent/10 transition-all">
          <div className="flex items-center gap-2">
            <button className="p-3 text-slate-400 hover:text-premium-accent transition-colors">
              <Paperclip size={20} />
            </button>
            <textarea
              rows="1"
              placeholder="Posez une question sur votre Drive ou un fichier..."
              className="flex-1 bg-transparent py-3 px-1 focus:outline-none resize-none text-slate-700 placeholder:text-slate-400"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`p-3 rounded-2xl transition-all ${
                input.trim() && !isLoading ? 'bg-premium-accent text-white' : 'bg-slate-100 text-slate-300'
              }`}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-4 flex items-center justify-center gap-1">
          <Sparkles size={10} /> Propulsé par Gemini 1.5 Flash • Analyse de fichiers multimodale
        </p>
      </div>
    </div>
  );
};

export default AIChat;
