import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem('bm_current_user');
        if (saved) {
            try {
                setUser(JSON.parse(saved));
            } catch {
                localStorage.removeItem('bm_current_user');
            }
        }
        setLoading(false);
    }, []);

    const register = async (name, email, password) => {
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, name, email, password })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao registrar');

        setUser(data.user);
        localStorage.setItem('bm_current_user', JSON.stringify(data.user));
        return data.user;
    };

    const login = async (email, password) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao fazer login');

        setUser(data.user);
        localStorage.setItem('bm_current_user', JSON.stringify(data.user));
        return data.user;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('bm_current_user');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be inside AuthProvider');
    return ctx;
}
