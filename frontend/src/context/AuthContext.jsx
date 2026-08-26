import React, { createContext, useContext, useState, useEffect } from 'react';
import { hermionApi } from '../api/client';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial auth state
    const checkAuth = async () => {
      const token = localStorage.getItem('hermion_token');
      if (token) {
        try {
          const res = await hermionApi.getMe();
          if (res.authenticated) {
            setUser(res.user);
          } else {
            localStorage.removeItem('hermion_token');
          }
        } catch (e) {
          console.error('Auth verification failed:', e);
          localStorage.removeItem('hermion_token');
        }
      }
      setLoading(false);
    };

    checkAuth();

    // Listen to Supabase auth changes if active
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const u = {
          id: session.user.id,
          email: session.user.email,
          username: session.user.user_metadata?.username || session.user.email.split('@')[0],
        };
        setUser(u);
        if (session.access_token) {
          localStorage.setItem('hermion_token', session.access_token);
        }
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const data = await hermionApi.login(email, password);
    if (data.token) {
      localStorage.setItem('hermion_token', data.token);
      setUser({ id: data.id, email: data.email, username: data.username });
    }
    return data;
  };

  const signup = async (email, password, username) => {
    const data = await hermionApi.signup(email, password, username);
    if (data.token) {
      localStorage.setItem('hermion_token', data.token);
      setUser({ id: data.id, email: data.email, username: data.username });
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('hermion_token');
    supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
