import React, { useState } from 'react';
import { X, Lock, Mail, ShieldAlert, Sparkles, User, PenTool, Shield } from 'lucide-react';
import { User as UserType } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserType) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const demoAccounts = [
    {
      name: 'Rajesh Sharma',
      role: 'ADMIN',
      email: 'editor@raipursamvad.com',
      password: 'admin123',
      icon: Shield,
      desc: 'Editor-in-Chief'
    },
    {
      name: 'Priya Verma',
      role: 'JOURNALIST',
      email: 'priya.verma@raipursamvad.com',
      password: 'journo123',
      icon: PenTool,
      desc: 'Senior Reporter'
    },
    {
      name: 'Deepak Agrawal',
      role: 'SUBSCRIBER',
      email: 'deepak.agrawal@gmail.com',
      password: 'sub123',
      icon: Sparkles,
      desc: 'Civic Patron'
    },
    {
      name: 'Kavita Sahu',
      role: 'READER',
      email: 'kavita.sahu@outlook.com',
      password: 'reader123',
      icon: User,
      desc: 'Standard Reader'
    }
  ];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onLoginSuccess(data.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate. Check connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPass: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: demoPass })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onLoginSuccess(data.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed demo authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        {/* Left Side: Traditional Form */}
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold font-playfair text-[#191b23]">Newsroom Login</h3>
              <p className="text-xs text-slate-500 font-sans mt-0.5">Access your Raipur Samvad publishing account</p>
            </div>
            <button 
              onClick={onClose} 
              className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center space-x-2 mb-4">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4 font-sans text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="editor@raipursamvad.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#dc2626] focus:ring-1 focus:ring-[#dc2626]"
                  required
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Security Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#dc2626] focus:ring-1 focus:ring-[#dc2626]"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold rounded-lg cursor-pointer transition-colors shadow-xs hover:shadow-md disabled:opacity-50 mt-6"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Right Side: Demo Shortcuts (Enterprise-like Quick Access Panel) */}
        <div className="md:w-80 bg-slate-50 border-t md:border-t-0 md:border-l border-slate-200 p-6 flex flex-col justify-between overflow-y-auto">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 font-sans">
              Demo Credentials
            </h4>
            <p className="text-[11px] text-slate-400 mb-4 leading-normal">
              Click any profile below to immediately authenticate and test the role-specific workspace:
            </p>
            
            <div className="space-y-2.5">
              {demoAccounts.map((account) => {
                const Icon = account.icon;
                return (
                  <button
                    key={account.email}
                    onClick={() => handleDemoLogin(account.email, account.password)}
                    className="w-full text-left p-2.5 rounded-lg bg-white border border-slate-200 hover:border-[#dc2626] hover:bg-rose-50/20 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded bg-rose-100 flex items-center justify-center text-[#dc2626]">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="font-sans">
                        <div className="text-xs font-bold text-slate-800 group-hover:text-[#dc2626] transition-colors leading-tight">
                          {account.name}
                        </div>
                        <div className="text-[10px] text-slate-400 leading-none mt-0.5">
                          {account.desc}
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-500 uppercase tracking-wide group-hover:bg-[#dc2626] group-hover:text-white group-hover:border-transparent transition-colors">
                      {account.role}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-200 text-[10px] text-slate-400 leading-normal font-sans">
            Authentication is persistent across hot-reloads via local storage. Role validation is checked on the backend server.
          </div>
        </div>
      </div>
    </div>
  );
};
