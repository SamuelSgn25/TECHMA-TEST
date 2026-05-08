import React, { useState, useEffect } from 'react';
import { Folder, Upload, Search, FolderPlus, Play, FileText, ChevronRight, Home, X, Image as ImageIcon, Music, FileArchive, Download } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

// Détermine le type de prévisualisation en fonction du MIME type et de l'extension
const getPreviewType = (file) => {
  const type = file.type || file.mimeType || '';
  const name = file.name || '';
  const ext = name.split('.').pop().toLowerCase();

  if (type.includes('video') || ['mp4','webm','ogg','mov','avi'].includes(ext)) return 'video';
  if (type.includes('audio') || ['mp3','wav','ogg','flac','aac','m4a'].includes(ext)) return 'audio';
  if (type.includes('image') || ['png','jpg','jpeg','gif','webp','svg','bmp','ico'].includes(ext)) return 'image';
  if (type.includes('pdf') || ext === 'pdf') return 'pdf';
  if (type.includes('text') || type.includes('json') || type.includes('xml') || type.includes('javascript') || type.includes('css')
    || ['txt','js','jsx','ts','tsx','css','html','json','xml','md','py','java','c','cpp','h','sql','sh','yml','yaml','env','csv','log'].includes(ext)) return 'text';
  return 'unknown';
};

// Icône selon le type
const FileIcon = ({ file }) => {
  const preview = getPreviewType(file);
  if (preview === 'image') return <ImageIcon size={24} />;
  if (preview === 'video') return <Play size={24} />;
  if (preview === 'audio') return <Music size={24} />;
  if (preview === 'pdf') return <FileText size={24} className="text-red-500" />;
  return <FileText size={24} />;
};

const DriveExplorer = ({ fetchFiles }) => {
  const [data, setData] = useState({ folders: [], files: [], driveFiles: [] });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [showFolderInput, setShowFolderInput] = useState(false);

  useEffect(() => { loadFiles(); }, [currentFolder]);

  useEffect(() => {
    if (selectedFile && getPreviewType(selectedFile) === 'text') {
      fetchFileContent(selectedFile.id);
    } else {
      setFileContent('');
    }
  }, [selectedFile]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/files', { params: { folderId: currentFolder } });
      setData(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchFileContent = async (id) => {
    try {
      const { data } = await axios.get(`/api/files/content/${id}`);
      setFileContent(data);
    } catch (err) { setFileContent("Impossible de charger le contenu."); }
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
    } catch (err) { alert("Erreur upload"); }
  };

  const createNewFolder = async () => {
    if (!newFolderName.trim()) return;
    await axios.post('/api/folders', { name: newFolderName, parentId: currentFolder });
    setNewFolderName(''); setShowFolderInput(false); loadFiles();
  };

  const enterFolder = (folder) => {
    setBreadcrumbs([...breadcrumbs, folder]);
    setCurrentFolder(folder.id);
  };

  const goToBreadcrumb = (index) => {
    if (index === -1) { setBreadcrumbs([]); setCurrentFolder(null); }
    else {
      const bc = breadcrumbs.slice(0, index + 1);
      setBreadcrumbs(bc);
      setCurrentFolder(bc[index].id);
    }
  };

  const allFiles = [...data.folders.map(f => ({...f, isFolder: true})), ...data.files, ...data.driveFiles];
  const filtered = allFiles.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const fileUrl = (file) => `http://localhost:5000/${file.path}`;

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Navigation */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-slate-500 overflow-x-auto whitespace-nowrap">
          <button onClick={() => goToBreadcrumb(-1)} className="hover:text-premium-accent flex items-center gap-1">
            <Home size={16} /> Principal
          </button>
          {breadcrumbs.map((b, i) => (
            <React.Fragment key={b.id}>
              <ChevronRight size={14} />
              <button onClick={() => goToBreadcrumb(i)} className="hover:text-premium-accent max-w-[100px] truncate">{b.name}</button>
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text" placeholder="Rechercher un fichier ou un dossier..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-premium-accent/5"
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {showFolderInput && (
        <div className="flex gap-2 p-3 bg-premium-accent/5 border border-premium-accent/10 rounded-xl">
          <input className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1" placeholder="Nom du dossier..." value={newFolderName} onChange={e => setNewFolderName(e.target.value)} />
          <button onClick={createNewFolder} className="bg-premium-accent text-white px-4 py-1 rounded-lg font-bold">Créer</button>
          <button onClick={() => setShowFolderInput(false)} className="text-slate-400">Annuler</button>
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 pb-10">
          {filtered.map((item) => (
            <motion.div
              key={item.id} layout
              onDoubleClick={() => item.isFolder && enterFolder(item)}
              onClick={() => !item.isFolder && setSelectedFile(item)}
              className="group p-4 bg-white border border-slate-50 rounded-2xl hover:shadow-xl transition-all cursor-pointer text-center"
            >
              <div className="w-12 h-12 mx-auto bg-slate-50 rounded-xl flex items-center justify-center text-premium-accent mb-2 group-hover:scale-110 transition-transform">
                {item.isFolder ? <Folder size={24} fill="currentColor" /> : <FileIcon file={item} />}
              </div>
              <p className="text-xs font-semibold truncate text-slate-700">{item.name}</p>
              <p className="text-[9px] text-slate-300 mt-1 uppercase font-bold tracking-tighter">{item.source || 'Local'}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ===== PREVIEW OVERLAY ===== */}
      <AnimatePresence>
        {selectedFile && (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setSelectedFile(null)}>
            <motion.div
              initial={{scale: 0.9, opacity: 0}} animate={{scale: 1, opacity: 1}} exit={{scale: 0.9, opacity: 0}}
              className="bg-white w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="text-premium-accent"><FileIcon file={selectedFile} /></div>
                  <div>
                    <h3 className="font-bold truncate max-w-md">{selectedFile.name}</h3>
                    <p className="text-xs text-slate-400">{selectedFile.type || 'Fichier'} • {selectedFile.size ? (selectedFile.size / 1024).toFixed(1) + ' KB' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a href={fileUrl(selectedFile)} download className="p-2 hover:bg-slate-100 rounded-full text-slate-500" title="Télécharger">
                    <Download size={20} />
                  </a>
                  <button onClick={() => setSelectedFile(null)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50 flex items-center justify-center min-h-[300px]">
                {(() => {
                  const type = getPreviewType(selectedFile);

                  if (type === 'video') return (
                    <video controls className="w-full max-h-[70vh] rounded-xl shadow-2xl bg-black">
                      <source src={fileUrl(selectedFile)} />
                      Votre navigateur ne supporte pas la lecture vidéo.
                    </video>
                  );

                  if (type === 'audio') return (
                    <div className="text-center w-full max-w-lg">
                      <div className="w-32 h-32 mx-auto bg-gradient-to-br from-premium-accent to-indigo-600 rounded-full flex items-center justify-center mb-8 shadow-xl">
                        <Music size={48} className="text-white" />
                      </div>
                      <p className="font-bold text-lg mb-6 text-slate-700">{selectedFile.name}</p>
                      <audio controls className="w-full">
                        <source src={fileUrl(selectedFile)} />
                      </audio>
                    </div>
                  );

                  if (type === 'image') return (
                    <img src={fileUrl(selectedFile)} className="max-w-full max-h-[70vh] rounded-xl shadow-2xl object-contain" alt={selectedFile.name} />
                  );

                  if (type === 'pdf') return (
                    <iframe
                      src={fileUrl(selectedFile)}
                      className="w-full h-[70vh] rounded-xl border-0 shadow-xl"
                      title={selectedFile.name}
                    />
                  );

                  if (type === 'text' && fileContent) return (
                    <div className="w-full bg-white p-8 rounded-xl shadow-inner border border-slate-200 font-mono text-sm overflow-x-auto whitespace-pre-wrap max-h-[70vh] overflow-y-auto">
                      {fileContent}
                    </div>
                  );

                  // Fallback pour les types inconnus
                  return (
                    <div className="text-center py-12">
                      <FileArchive size={64} className="mx-auto text-slate-200 mb-6" />
                      <p className="text-slate-500 mb-2 font-medium">Aperçu non disponible pour ce format</p>
                      <p className="text-xs text-slate-400 mb-8">Type : {selectedFile.type || 'inconnu'}</p>
                      <a href={fileUrl(selectedFile)} download className="bg-premium-accent text-white px-8 py-3 rounded-xl font-bold inline-flex items-center gap-2 hover:shadow-lg transition-all">
                        <Download size={18} /> Télécharger le fichier
                      </a>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DriveExplorer;
