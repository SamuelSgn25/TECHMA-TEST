import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User as UserIcon } from 'lucide-react';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isRegister ? 'auth/register' : 'auth/login';
      const { data } = await axios.post(endpoint, formData);
      if (!isRegister) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.user);
      } else {
        setIsRegister(false);
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
          <p className="text-slate-400 mt-2">{isRegister ? 'Créez votre compte premium' : 'Heureux de vous revoir'}</p>
        </div>

        {error && <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm mb-6 text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
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
          <button className="w-full bg-premium-accent text-white py-4 rounded-xl font-bold hover:shadow-lg hover:shadow-premium-accent/30 transition-all">
            {isRegister ? "S'inscrire" : "Se connecter"}
          </button>
        </form>

        <button 
          onClick={() => setIsRegister(!isRegister)}
          className="w-full mt-6 text-sm text-slate-400 hover:text-premium-accent transition-colors"
        >
          {isRegister ? "Déjà un compte ? Connectez-vous" : "Pas encore de compte ? Inscrivez-vous"}
        </button>
      </div>
    </div>
  );
};

export default Login;
