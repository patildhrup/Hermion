import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, username);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) setError(error.message);
    } catch (err) {
      setError('Google Sign-In failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col font-body">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[#181818] border border-[#2A2A2A] rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <h2 className="font-heading font-bold text-3xl text-white">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-xs font-mono text-[#888]">
              Sign in to access your HERMION voice workspace
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-mono text-[#AAA] mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#121212] border border-[#333] text-white focus:outline-none focus:border-[#6AE301]"
                  placeholder="acme_corp"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-mono text-[#AAA] mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#121212] border border-[#333] text-white focus:outline-none focus:border-[#6AE301]"
                  placeholder="you@company.com"
                />
              </div>

            <div>
              <label className="block text-xs font-mono text-[#AAA] mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#121212] border border-[#333] text-white focus:outline-none focus:border-[#6AE301]"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#6AE301] text-black font-bold hover:bg-[#80F318] transition-all shadow-[0_0_20px_rgba(106,227,1,0.3)] disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#262626] w-full" />
            <span className="bg-[#181818] px-3 text-[10px] font-mono text-[#666] uppercase">Or</span>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full py-3 rounded-xl bg-[#222] text-white font-medium hover:bg-[#2C2C2C] border border-[#333] transition-all flex items-center justify-center gap-2 text-sm"
          >
            <span>🌐</span> Sign in with Google
          </button>

          <div className="text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs font-mono text-[#888] hover:text-[#6AE301] transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
