import React, { useState, useEffect } from 'react';
import { File, Folder, Upload, Trash2, Search, Plus, FolderPlus, Play, FileText, ChevronRight, Home, X } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const DriveExplorer = ({ fetchFiles }) => {
  const [data, setData] = useState({ folders: [], files: [], driveFiles: [] });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentFolder, setCurrentFolder] = useState(null); // ID du dossier actuel
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showFolderInput, setShowFolderInput] = useState(false);

  useEffect(() => {
    loadFiles();
  }, [currentFolder]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/files', {
        params: { folderId: currentFolder }
      });
      setData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folderId', currentFolder || '');
    try {
      await axios.post('/api/files/upload', formData);
      loadFiles();
    } catch (err) {
      alert("Erreur lors de l'upload. Vérifiez que le serveur est lancé.");
    }
  };

  const createNewFolder = async () => {
    if (!newFolderName.trim()) return;
    await axios.post('/api/folders', { name: newFolderName, parentId: currentFolder });
    setNewFolderName('');
    setShowFolderInput(false);
    loadFiles();
  };

  const enterFolder = (folder) => {
    setBreadcrumbs([...breadcrumbs, folder]);
    setCurrentFolder(folder.id);
  };

  const goToBreadcrumb = (index) => {
    if (index === -1) {
      setBreadcrumbs([]);
      setCurrentFolder(null);
    } else {
      const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
      setBreadcrumbs(newBreadcrumbs);
      setCurrentFolder(newBreadcrumbs[index].id);
    }
  };

  const allFiles = [...data.folders.map(f => ({...f, isFolder: true})), ...data.files, ...data.driveFiles];
  const filtered = allFiles.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Navigation & Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-slate-500 overflow-x-auto whitespace-nowrap">
          <button onClick={() => goToBreadcrumb(-1)} className="hover:text-premium-accent flex items-center gap-1">
            <Home size={16} /> Principal
          </button>
          {breadcrumbs.map((b, i) => (
            <React.Fragment key={b.id}>
              <ChevronRight size={14} />
              <button onClick={() => goToBreadcrumb(i)} className="hover:text-premium-accent max-w-[100px] truncate">
                {b.name}
              </button>
            </React.Fragment>
          ))}
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={() => setShowFolderInput(true)} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 font-medium">
            <FolderPlus size={18} /> Dossier
          </button>
          <label className="flex items-center gap-2 px-5 py-2 bg-premium-accent text-white rounded-xl hover:shadow-lg cursor-pointer font-bold">
            <Upload size={18} /> Upload
            <input type="file" className="hidden" onChange={handleUpload} />
          </label>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text" placeholder="Rechercher..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-premium-accent/5"
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {showFolderInput && (
        <div className="flex gap-2 p-3 bg-premium-accent/5 border border-premium-accent/10 rounded-xl">
          <input 
            className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1 outline-none"
            placeholder="Nom du dossier..." value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
          />
          <button onClick={createNewFolder} className="bg-premium-accent text-white px-4 py-1 rounded-lg font-bold">Créer</button>
          <button onClick={() => setShowFolderInput(false)} className="text-slate-400">Annuler</button>
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-32 bg-slate-50 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 pb-10">
            {filtered.map((item) => (
              <motion.div
                key={item.id} layout
                onDoubleClick={() => item.isFolder && enterFolder(item)}
                onClick={() => !item.isFolder && setSelectedFile(item)}
                className="group p-4 bg-white border border-slate-50 rounded-2xl hover:shadow-xl transition-all cursor-pointer text-center"
              >
                <div className="w-12 h-12 mx-auto bg-slate-50 rounded-xl flex items-center justify-center text-premium-accent mb-2 group-hover:scale-110 transition-transform">
                  {item.isFolder ? <Folder size={24} fill="currentColor" /> : item.type?.includes('video') ? <Play size={24} /> : <FileText size={24} />}
                </div>
                <p className="text-xs font-semibold truncate text-slate-700" title={item.name}>{item.name}</p>
                <p className="text-[9px] text-slate-300 mt-1 uppercase font-bold tracking-tighter">
                  {item.source || 'Local'}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Overlay */}
      <AnimatePresence>
        {selectedFile && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedFile(null)}>
            <motion.div initial={{scale: 0.9}} animate={{scale: 1}} className="bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-bold truncate max-w-md">{selectedFile.name}</h3>
                <button onClick={() => setSelectedFile(null)}><X size={20} /></button>
              </div>
              <div className="p-6 bg-slate-50 min-h-[300px] flex items-center justify-center">
                {selectedFile.type?.includes('video') ? (
                  <video controls className="w-full max-h-[60vh] rounded-xl shadow-lg">
                    <source src={`http://localhost:5000/${selectedFile.path}`} />
                  </video>
                ) : (
                  <div className="text-center">
                    <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500 mb-4">Aperçu non disponible pour ce type de fichier.</p>
                    <a href={`http://localhost:5000/${selectedFile.path}`} target="_blank" className="bg-premium-accent text-white px-6 py-2 rounded-xl font-bold inline-block">Télécharger</a>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DriveExplorer;
