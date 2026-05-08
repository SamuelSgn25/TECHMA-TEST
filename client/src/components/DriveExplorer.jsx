import React, { useState } from 'react';
import { File, Folder, Upload, Trash2, Search, Plus, FolderPlus, Play, FileText, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const DriveExplorer = ({ files, loading, fetchFiles }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showFolderInput, setShowFolderInput] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    await axios.post('/api/files/upload', formData);
    fetchFiles();
  };

  const createNewFolder = async () => {
    if (!newFolderName.trim()) return;
    await axios.post('/api/folders', { name: newFolderName });
    setNewFolderName('');
    setShowFolderInput(false);
    fetchFiles();
  };

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8 h-full flex flex-col">
      {/* Barre d'action professionnelle */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 w-full max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text" placeholder="Rechercher dans votre Drive..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-premium-accent/10 outline-none"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => setShowFolderInput(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-medium"
          >
            <FolderPlus size={20} />
            Dossier
          </button>
          <label className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-premium-accent text-white rounded-xl hover:shadow-lg hover:shadow-premium-accent/20 cursor-pointer font-bold transition-all">
            <Upload size={20} />
            Upload
            <input type="file" className="hidden" onChange={handleUpload} />
          </label>
        </div>
      </div>

      {/* Input nouveau dossier */}
      <AnimatePresence>
        {showFolderInput && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="flex items-center gap-4 bg-premium-accent/5 p-4 rounded-2xl border border-premium-accent/10">
              <input 
                type="text" placeholder="Nom du nouveau dossier..." 
                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-premium-accent/20"
                value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
                autoFocus
              />
              <button onClick={createNewFolder} className="bg-premium-accent text-white px-6 py-2 rounded-xl font-bold">Créer</button>
              <button onClick={() => setShowFolderInput(false)} className="text-slate-400 font-medium">Annuler</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grille de fichiers */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[1,2,3,4,5].map(i => <div key={i} className="h-48 bg-slate-50 rounded-3xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 pb-20">
            {filteredFiles.map((file) => (
              <motion.div
                key={file.id} layout
                onClick={() => setSelectedFile(file)}
                className="group cursor-pointer bg-white border border-slate-100 p-5 rounded-3xl hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 relative border-b-4 border-b-transparent hover:border-b-premium-accent"
              >
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-premium-accent mb-4 group-hover:scale-110 transition-transform">
                  {file.type?.includes('video') ? <Play size={28} fill="currentColor" /> : file.type?.includes('folder') ? <Folder size={28} /> : <FileText size={28} />}
                </div>
                <h4 className="font-bold text-slate-800 truncate" title={file.name}>{file.name}</h4>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">{file.source || 'Local'}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Prévisualisation Overlay */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-premium-dark/80 backdrop-blur-sm flex items-center justify-center p-8"
            onClick={() => setSelectedFile(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold">{selectedFile.name}</h3>
                <button onClick={() => setSelectedFile(null)} className="p-2 hover:bg-slate-100 rounded-full"><X size={24} /></button>
              </div>
              <div className="p-8 bg-slate-50 flex items-center justify-center min-h-[400px]">
                {selectedFile.type?.includes('video') ? (
                  <video controls className="w-full rounded-2xl shadow-lg">
                    <source src={`http://localhost:5000/${selectedFile.path}`} type={selectedFile.type} />
                  </video>
                ) : (
                  <div className="text-center space-y-4">
                    <FileText size={64} className="mx-auto text-slate-300" />
                    <p className="text-slate-500 italic">Prévisualisation non disponible pour ce type de fichier.</p>
                    <a href={`http://localhost:5000/${selectedFile.path}`} target="_blank" className="inline-block bg-premium-accent text-white px-8 py-3 rounded-xl font-bold">Télécharger</a>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const X = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

export default DriveExplorer;
