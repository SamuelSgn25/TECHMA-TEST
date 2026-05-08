import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User as UserIcon } from 'lucide-react';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [mode, setMode] = useState('login'); // 'login', 'register', 'reset'
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (mode === 'reset') {
        await axios.post('auth/reset-password', formData);
        setMode('login');
        setError('Mot de passe réinitialisé ! Connectez-vous.');
        return;
      }

      const endpoint = mode === 'register' ? 'auth/register' : 'auth/login';
      const { data } = await axios.post(endpoint, formData);
      if (mode !== 'register') {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.user);
      } else {
        setMode('login');
        setError('Compte créé ! Connectez-vous.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Une erreur est survenue');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-premium-light p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-premium-accent rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">D</div>
          <h1 className="text-3xl font-bold text-premium-dark">Drive AI</h1>
          <p className="text-slate-400 mt-2">
            {mode === 'register' ? 'Créez votre compte premium' : mode === 'reset' ? 'Réinitialisez votre accès' : 'Heureux de vous revoir'}
          </p>
        </div>

        {error && <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm mb-6 text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <input
              type="text" placeholder="Nom d'utilisateur"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-premium-accent/20 outline-none transition-all"
              onChange={(e) => setFormData({...formData, username: e.target.value})}
            />
          )}
          
          <div className="relative">
            <input
              type="email" placeholder="Email"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-premium-accent/20 outline-none transition-all"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"} 
              placeholder="Mot de passe"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-premium-accent/20 outline-none transition-all"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-premium-accent"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {mode === 'login' && (
            <div className="text-right">
              <button 
                type="button" onClick={() => setMode('reset')}
                className="text-xs text-slate-400 hover:text-premium-accent"
              >
                Mot de passe oublié ?
              </button>
            </div>
          )}

          <button className="w-full bg-premium-accent text-white py-4 rounded-xl font-bold hover:shadow-lg hover:shadow-premium-accent/30 transition-all">
            {mode === 'register' ? "S'inscrire" : mode === 'reset' ? "Réinitialiser" : "Se connecter"}
          </button>
        </form>

        <button 
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          className="w-full mt-6 text-sm text-slate-400 hover:text-premium-accent transition-colors"
        >
          {mode === 'register' ? "Déjà un compte ? Connectez-vous" : mode === 'reset' ? "Retour à la connexion" : "Pas encore de compte ? Inscrivez-vous"}
        </button>
      </div>
    </div>
  );
};

export default Login;
