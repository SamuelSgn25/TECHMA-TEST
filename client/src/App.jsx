import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DriveExplorer from './components/DriveExplorer';
import AIChat from './components/AIChat';
import Login from './components/Login';
import axios from 'axios';

// Configuration globale d'Axios
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Intercepteur pour injecter le token JWT et gérer les erreurs 401
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload(); // Force la reconnexion
    }
    return Promise.reject(error);
  }
);

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    if (user) fetchFiles();
  }, [user]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/files');
      setFiles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (!user) return <Login onLogin={setUser} />;

  return (
    <div className="flex h-screen w-full bg-premium-light overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user}
        onLogout={handleLogout}
      />
      
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 flex items-center justify-between px-8 bg-white border-b border-slate-100">
          <h2 className="text-xl font-bold text-premium-dark">
            {activeTab === 'dashboard' ? 'Ma Bibliothèque' : activeTab === 'chat' ? 'Drive AI Assistant' : 'Paramètres'}
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-500">{user.username}</span>
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-premium-accent">
              {user.username[0].toUpperCase()}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'dashboard' && (
            <DriveExplorer files={files} loading={loading} fetchFiles={fetchFiles} />
          )}
          {activeTab === 'chat' && <AIChat files={files} />}
          {activeTab === 'settings' && (
            <div className="max-w-3xl mx-auto space-y-8">
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="text-xl font-bold mb-6">Paramètres Google Drive</h3>
                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl">
                  <div>
                    <p className="font-semibold">Intégration Google Drive</p>
                    <p className="text-sm text-slate-400">Accédez à tous vos dossiers Drive directement.</p>
                  </div>
                  <button className={`px-6 py-2 rounded-xl font-bold transition-all ${user.drive_enabled ? 'bg-red-50 text-red-500' : 'bg-premium-accent text-white'}`}>
                    {user.drive_enabled ? "Déconnecter" : "Connecter"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
