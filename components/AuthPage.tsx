import React, { useState } from 'react';
import { Icons } from './Icon';

interface AuthPageProps {
  onLogin: (username: string) => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

type AuthView = 'login' | 'register' | 'recovery';

const AuthPage: React.FC<AuthPageProps> = ({ onLogin, toggleTheme, isDarkMode }) => {
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    
    if (view === 'recovery') {
        if (!email) {
            setError("Please enter your email address.");
            return;
        }
        // Mock Recovery
        setSuccessMsg(`Recovery link sent to ${email}`);
        setTimeout(() => {
            setView('login');
            setSuccessMsg('');
        }, 3000);
        return;
    }

    // Simple mock validation
    if (!email || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (view === 'register' && !username) {
      setError("Please choose a username.");
      return;
    }

    // Mock auth success
    const finalUsername = view === 'login' ? email.split('@')[0] : username;
    onLogin(finalUsername);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 transition-colors bg-transparent">
      
      <div className="max-w-md w-full glass rounded-3xl shadow-2xl overflow-hidden transition-all animate-fade-in relative">
        {/* Decorative */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl"></div>

        <div className="relative h-40 bg-gradient-to-br from-blue-600/90 to-indigo-600/90 flex items-center justify-center backdrop-blur-sm">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <div className="text-center z-10">
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center justify-center gap-2 drop-shadow-md">
              <Icons.Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
              LifeSync
            </h1>
            <p className="text-blue-100 mt-1 text-xs font-medium tracking-wide uppercase opacity-90">Free Forever • Smart Planning</p>
          </div>
        </div>

        <div className="p-8 relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 text-center">
            {view === 'login' && 'Welcome Back'}
            {view === 'register' && 'Join for Free'}
            {view === 'recovery' && 'Account Recovery'}
          </h2>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-6">
             {view === 'recovery' ? 'Enter your email to reset your password' : 'Manage your life with AI assistance'}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-100/50 border border-red-200/50 text-red-600 dark:text-red-300 text-sm rounded-xl flex items-center gap-2 backdrop-blur-sm">
               <span>⚠️</span> {error}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3 bg-green-100/50 border border-green-200/50 text-green-600 dark:text-green-300 text-sm rounded-xl flex items-center gap-2 backdrop-blur-sm">
               <Icons.Check className="w-4 h-4" /> {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {view === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1 ml-1">Username</label>
                <input 
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 text-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                  placeholder="jdoe"
                />
              </div>
            )}
            
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1 ml-1">Email Address</label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 text-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                placeholder="you@example.com"
              />
            </div>

            {view !== 'recovery' && (
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1 ml-1">Password</label>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 text-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                  placeholder="••••••••"
                />
              </div>
            )}

            {view === 'login' && (
                <div className="flex justify-end">
                    <button 
                        type="button" 
                        onClick={() => { setView('recovery'); setError(''); }} 
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        Forgot Password?
                    </button>
                </div>
            )}

            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-blue-500/30 transform active:scale-[0.98] mt-2"
            >
              {view === 'login' && 'Sign In'}
              {view === 'register' && 'Create Free Account'}
              {view === 'recovery' && 'Send Recovery Link'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            {view === 'login' && (
                <>
                    Don't have an account?{' '}
                    <button onClick={() => { setView('register'); setError(''); }} className="text-blue-600 dark:text-blue-400 font-bold hover:underline">Sign Up Free</button>
                </>
            )}
            {view === 'register' && (
                <>
                    Already have an account?{' '}
                    <button onClick={() => { setView('login'); setError(''); }} className="text-blue-600 dark:text-blue-400 font-bold hover:underline">Sign In</button>
                </>
            )}
            {view === 'recovery' && (
                <button onClick={() => { setView('login'); setError(''); }} className="text-blue-600 dark:text-blue-400 font-bold hover:underline">Back to Login</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;