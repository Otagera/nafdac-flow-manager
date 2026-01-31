import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useNavigate } from '@tanstack/react-router';

type User = {
    username: string;
    role: string;
    id: number;
} | null;

type AuthContextType = {
    user: User;
    loading: boolean;
    isAuthenticated: boolean;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    isAuthenticated: false,
    logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const { data, error } = await api.auth.me.get();
            if (error || !data.authenticated) {
                setUser(null);
            } else {
                setUser(data.user as User);
            }
        } catch (e) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        await api.auth.logout.post();
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
