import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { href: '/#features', label: 'Features' },
    { href: '/#contact', label: 'Contact Us' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-glassBorder bg-background/60 backdrop-blur-xl px-6 py-4 transition-all shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent to-[#95FF29] flex items-center justify-center text-black font-black text-xl shadow-[0_0_20px_rgba(106,227,1,0.5)] group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
            H
          </div>
          <div>
            <span className="font-heading font-black text-xl tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-textMuted group-hover:to-white transition-colors duration-300">HERMION</span>
            <span className="text-[10px] uppercase font-mono block text-accent tracking-[0.2em] -mt-1 opacity-80 group-hover:opacity-100 transition-opacity">
              Voice Work Assistant
            </span>
          </div>
        </Link>

        {/* Links */}
        <nav className="hidden md:flex items-center gap-2 bg-surface/50 backdrop-blur-md p-1.5 rounded-full border border-glassBorder shadow-inner">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-5 py-2 rounded-full text-sm font-semibold text-textMuted hover:text-white hover:bg-white/5 hover:scale-105 transition-all duration-300"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* User / Auth CTA */}
        <div className="flex items-center gap-5">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-glassBorder bg-white/5 text-xs font-mono shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            <span className="text-textMuted font-medium tracking-wide">FastMCP</span>
          </div>

          {user ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2.5 text-sm font-bold rounded-xl bg-accent text-black hover:bg-accentHover transition-all duration-300 shadow-[0_0_20px_rgba(106,227,1,0.3)] hover:shadow-[0_0_30px_rgba(106,227,1,0.6)] hover:-translate-y-0.5"
            >
              Open App →
            </button>
          ) : (
            <Link
              to="/auth"
              className="px-6 py-2.5 text-sm font-bold rounded-xl bg-accent text-black hover:bg-accentHover transition-all duration-300 shadow-[0_0_20px_rgba(106,227,1,0.3)] hover:shadow-[0_0_30px_rgba(106,227,1,0.6)] hover:-translate-y-0.5"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
