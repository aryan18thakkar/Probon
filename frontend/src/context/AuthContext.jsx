import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('projnan_token');
    if (storedToken) {
      api.auth
        .me()
        .then((res) => {
          if (res.success && res.data) {
            setUser(res.data);
            localStorage.setItem('projnan_user', JSON.stringify(res.data));
          }
        })
        .catch(() => {
          localStorage.removeItem('projnan_token');
          localStorage.removeItem('projnan_user');
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const res = await api.auth.login(credentials);
    if (res.success && res.data) {
      localStorage.setItem('projnan_token', res.data.token);
      localStorage.setItem('projnan_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
    }
    return res;
  };

  const register = async (userData) => {
    const res = await api.auth.register(userData);
    if (res.success && res.data) {
      localStorage.setItem('projnan_token', res.data.token);
      localStorage.setItem('projnan_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
    }
    return res;
  };

  const logout = () => {
    api.auth.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser: async () => {
          const res = await api.auth.me();
          if (res.success) setUser(res.data);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
