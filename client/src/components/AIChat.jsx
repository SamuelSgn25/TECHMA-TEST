import React, { useState, useRef, useEffect } from 'react';
import { Send, Upload, X, Loader, MessageSquare, Sparkles, Paperclip, FileText } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const AIChat = ({ files }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollToBottom, [messages]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile({ name: file.name, size: file.size, type: file.type, file });
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setUploadedFile({ name: file.name, size: file.size, type: file.type, file });
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !uploadedFile) return;

    // Add user message
    const userMessage = {
      role: 'user',
      content: input,
      file: uploadedFile ? { name: uploadedFile.name, type: uploadedFile.type } : null
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setUploadedFile(null);
    setIsLoading(true);

    try {
      // If file is uploaded, prepare FormData
      let requestData = { prompt: input, history: messages };

      if (uploadedFile) {
        const formData = new FormData();
        formData.append('prompt', input);
        formData.append('history', JSON.stringify(messages));
        formData.append('file', uploadedFile.file);

        const response = await axios.post('/api/ai/chat', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
      } else {
        const response = await axios.post('/api/ai/chat', requestData);
        setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Désolé, une erreur est survenue. Veuillez réessayer."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto w-full">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-20 h-20 bg-gradient-to-br from-premium-accent/10 to-purple-100 rounded-3xl flex items-center justify-center mb-6">
              <MessageSquare className="text-premium-accent" size={32} />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-3">Drive AI Assistant</h1>
            <p className="text-slate-500 max-w-md mb-8">Posez des questions sur vos fichiers, analysez leur contenu, ou demandez des résumés et explications.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
              {[
                { icon: Sparkles, label: 'Résumé du fichier', prompt: 'Résume ce fichier en points clés' },
                { icon: Paperclip, label: 'Questions rapides', prompt: 'Quels sont les éléments importants?' },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(item.prompt)}
                  className="p-4 rounded-2xl border border-slate-100 hover:border-premium-accent hover:bg-premium-accent/5 transition-all text-left"
                >
                  <item.icon className="text-premium-accent mb-2" size={20} />
                  <p className="font-semibold text-slate-900 text-sm">{item.label}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            <AnimatePresence>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-premium-accent to-purple-600 flex items-center justify-center text-white shrink-0 mt-1">
                      <Sparkles size={16} />
                    </div>
                  )}

                  <div className={`max-w-2xl ${msg.role === 'user' ? 'text-right' : ''}`}>
                    {msg.file && (
                      <div className="mb-2 inline-flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5 text-xs text-slate-600">
                        <FileText size={14} />
                        {msg.file.name}
                      </div>
                    )}
                    <div className={`rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-premium-accent text-white rounded-tr-none'
                        : 'bg-slate-50 text-slate-900 rounded-tl-none border border-slate-100'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 mt-1">
                      <Send size={16} />
                    </div>
                  )}
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-4 justify-start"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-premium-accent to-purple-600 flex items-center justify-center text-white shrink-0">
                    <Loader size={16} className="animate-spin" />
                  </div>
                  <div className="bg-slate-50 rounded-2xl rounded-tl-none px-4 py-3 border border-slate-100">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-100 bg-white px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {/* File Upload Display */}
          {uploadedFile && (
            <div className="mb-3 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <FileText size={16} />
                <span className="font-medium">{uploadedFile.name}</span>
                <span className="text-blue-600">({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
              <button
                onClick={() => setUploadedFile(null)}
                className="text-blue-600 hover:text-blue-700"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* Chat Input */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative rounded-2xl border-2 transition-all ${
              dragActive
                ? 'border-premium-accent bg-premium-accent/5'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-end gap-2 p-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-premium-accent transition-colors"
                title="Upload a file"
              >
                <Upload size={20} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
              />

              <textarea
                placeholder="Ask me anything or upload a file..."
                className="flex-1 bg-transparent px-2 py-2 focus:outline-none resize-none max-h-32 text-sm"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows="1"
              />

              <button
                onClick={handleSend}
                disabled={(!input.trim() && !uploadedFile) || isLoading}
                className={`p-2 rounded-lg transition-all ${
                  (input.trim() || uploadedFile) && !isLoading
                    ? 'bg-premium-accent text-white hover:shadow-lg'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Send size={20} />
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-2 text-center">
            Drive AI peut faire des erreurs. Envisagez de vérifier les informations importantes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
