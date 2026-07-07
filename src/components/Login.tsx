import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, FileText } from 'lucide-react';

interface LoginProps {
  onLogin: (username: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Simple credentials validation: any user is fine, but recommend admin/admin
    setTimeout(() => {
      if (username.trim().toLowerCase() === 'admin' && password === 'admin') {
        onLogin(username);
      } else if (username.trim() && password) {
        // Accept other credentials too, but check password length for sanity
        if (password.length >= 4) {
          onLogin(username);
        } else {
          setError('Password must be at least 4 characters long.');
          setLoading(false);
        }
      } else {
        setError('Please enter both a username and password.');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-paper dark:bg-paper-dark flex flex-col justify-center items-center px-4 transition-colors duration-200">
      
      {/* Masthead Banner for Login */}
      <div className="w-full max-w-md text-center mb-8 font-sans text-xs tracking-widest text-ink-light/50 dark:text-ink-darkLight/50 uppercase border-b border-ink/10 dark:border-ink-dark/15 pb-4">
        <span>THE STERLING ANALYTICAL DESK</span>
      </div>

      {/* Login Card Panel */}
      <div className="w-full max-w-md bg-paper dark:bg-paper-dark border-3 border-ink dark:border-ink-dark/30 p-8 shadow-xl relative">
        
        {/* Double-line board decorations */}
        <div className="absolute inset-2 border border-ink/5 dark:border-ink-dark/5 pointer-events-none" />

        <div className="text-center mb-8">
          <FileText className="w-10 h-10 mx-auto text-editorial-ochre mb-3" />
          <h1 className="font-serif text-3xl font-black uppercase tracking-tight text-ink dark:text-ink-dark">
            Sign In
          </h1>
          <p className="text-xs text-ink-light/60 dark:text-ink-darkLight/60 font-sans mt-2">
            Enter credentials to access the Client Metrics Workspace.
          </p>
        </div>

        {error && (
          <div className="bg-editorial-terracotta/10 border border-editorial-terracotta text-editorial-terracotta px-4 py-2.5 text-xs font-sans mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Input */}
          <div className="space-y-1.5">
            <label htmlFor="user-login" className="block text-[10px] font-sans font-bold uppercase tracking-wider text-ink-light/50 dark:text-ink-darkLight/50">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-ink-light/40 dark:text-ink-darkLight/40">
                <User className="w-4 h-4" />
              </span>
              <input
                id="user-login"
                type="text"
                autoComplete="username"
                className="w-full pl-10 pr-3 py-2 text-sm font-sans bg-paper-card dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark outline-none text-ink dark:text-ink-dark focus:border-editorial-ochre focus:ring-1 focus:ring-editorial-ochre"
                placeholder="Enter admin or custom username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label htmlFor="user-pass" className="block text-[10px] font-sans font-bold uppercase tracking-wider text-ink-light/50 dark:text-ink-darkLight/50">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-ink-light/40 dark:text-ink-darkLight/40">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="user-pass"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="w-full pl-10 pr-10 py-2 text-sm font-sans bg-paper-card dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark outline-none text-ink dark:text-ink-dark focus:border-editorial-ochre focus:ring-1 focus:ring-editorial-ochre"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-light/40 dark:text-ink-darkLight/40 hover:text-ink"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-paper dark:bg-ink-dark dark:text-paper-dark py-2.5 text-xs font-sans font-bold uppercase tracking-wider hover:bg-editorial-ochre dark:hover:bg-editorial-ochre hover:text-paper transition-colors duration-150 flex justify-center items-center"
          >
            {loading ? 'Verifying Desk Credentials...' : 'Authenticate Workspace'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-paper-border/60 dark:border-paper-borderDark/60 text-[10px] font-sans text-ink-light/40 dark:text-ink-darkLight/40 text-center">
          <span>Testing hint: Use <span className="font-bold">admin</span> / <span className="font-bold">admin</span> for immediate login.</span>
        </div>
      </div>
      
      {/* Footer copyright */}
      <div className="mt-8 text-[10px] font-sans text-ink-light/40 dark:text-ink-darkLight/40">
        <span>© 2026 Sterling Publishing & Co. All Rights Reserved.</span>
      </div>
    </div>
  );
};
