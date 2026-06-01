import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Download, X } from 'lucide-react';

const PDFViewer = ({ pdfPath, fileName, onClose }) => {
  const [scale, setScale] = useState(1);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-10">
          <h3 className="font-bold truncate text-lg">{fileName}</h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setScale(Math.max(0.5, scale - 0.1))}
              className="p-2 hover:bg-slate-100 rounded-full transition"
              title="Zoom out"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-medium w-12 text-center">{Math.round(scale * 100)}%</span>
            <button 
              onClick={() => setScale(Math.min(3, scale + 0.1))}
              className="p-2 hover:bg-slate-100 rounded-full transition"
              title="Zoom in"
            >
              <ChevronRight size={20} />
            </button>
            <a 
              href={`http://localhost:5000/${pdfPath}`}
              download
              className="p-2 hover:bg-slate-100 rounded-full transition text-premium-accent"
              title="Download"
            >
              <Download size={20} />
            </a>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-auto bg-slate-50 flex items-center justify-center p-4">
          <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
            <embed
              src={`http://localhost:5000/${pdfPath}#toolbar=0`}
              type="application/pdf"
              width="800px"
              height="600px"
              className="rounded-lg shadow-lg"
            />
          </div>
        </div>

        {/* Footer Info */}
        <div className="p-3 border-t bg-slate-50 text-xs text-slate-500 text-center">
          💡 Utilisez les boutons zoom pour ajuster la taille. Téléchargez pour une meilleure expérience.
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
