import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/call', label: 'Live Sales Demo' },
    { path: '/dashboard', label: 'CRM Dashboard' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[#2A2A2A] bg-[#121212]/90 backdrop-blur-md px-6 py-4 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6AE301] to-[#95FF29] flex items-center justify-center text-black font-black text-xl shadow-[0_0_20px_rgba(106,227,1,0.4)] group-hover:scale-105 transition-transform">
            H
          </div>
          <div>
            <span className="font-heading font-black text-xl tracking-wider text-white">HERMION</span>
            <span className="text-[10px] uppercase font-mono block text-[#6AE301] tracking-widest -mt-1">
              Voice AI Engine
            </span>
          </div>
        </Link>

        {/* Links */}
        <nav className="hidden md:flex items-center gap-1 bg-[#1A1A1A] p-1.5 rounded-full border border-[#2A2A2A]">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#6AE301] text-black font-bold shadow-[0_0_15px_rgba(106,227,1,0.3)]'
                    : 'text-[#A0A0A0] hover:text-white hover:bg-[#252525]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* User / Auth CTA */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#2A2A2A] bg-[#181818] text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-[#6AE301] animate-ping" />
            <span className="text-[#A0A0A0]">FastMCP Online</span>
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-white hidden lg:inline">
                {user.username || user.email}
              </span>
              <button
                onClick={logout}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#242424] text-white hover:bg-red-500/20 hover:text-red-400 border border-[#333] hover:border-red-500/40 transition-all"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="px-5 py-2.5 text-sm font-bold rounded-xl bg-[#6AE301] text-black hover:bg-[#80F318] transition-all shadow-[0_0_20px_rgba(106,227,1,0.3)] hover:scale-105"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
