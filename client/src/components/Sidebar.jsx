import React from 'react';
import { LayoutDashboard, MessageSquare, Settings, HardDrive, LogOut, ToggleLeft as Toggle } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, driveConnected, toggleDrive }) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Mes Fichiers' },
    { id: 'chat', icon: MessageSquare, label: 'Drive AI' },
    { id: 'settings', icon: Settings, label: 'Paramètres' },
  ];

  return (
    <aside className="w-72 bg-white border-r border-slate-200 h-full flex flex-col p-6">
      <div className="flex items-center gap-3 mb-12">
        <div className="w-10 h-10 bg-premium-accent rounded-xl flex items-center justify-center text-white font-bold text-xl">
          D
        </div>
        <h1 className="text-xl font-bold tracking-tight">Drive AI</h1>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
              activeTab === item.id 
                ? 'bg-slate-100 text-premium-accent' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-slate-100">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl mb-4">
          <div className="flex items-center gap-3">
            <HardDrive size={18} className={driveConnected ? 'text-green-500' : 'text-slate-400'} />
            <span className="text-sm font-medium">Google Drive</span>
          </div>
          <button onClick={toggleDrive} className={`transition-colors ${driveConnected ? 'text-premium-accent' : 'text-slate-300'}`}>
             <Toggle size={24} fill={driveConnected ? 'currentColor' : 'none'} />
          </button>
        </div>
        <button className="w-full flex items-center gap-4 px-4 py-3 text-slate-400 hover:text-red-500 transition-colors">
          <LogOut size={20} />
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
