import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth';

interface AuthContextType {
    isAuthenticated: boolean;
    user: {
        username: string;
        fullName: string;
    } | null;
    login: (token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    user: null,
    login: () => {},
    logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<{ username: string; fullName: string; } | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            checkAuth();
        }
    }, []);

    const checkAuth = async () => {
        try {
            const currentUser = await authApi.getCurrentUser();
            setUser({
                username: currentUser.username,
                fullName: currentUser.username,
            });
            setIsAuthenticated(true);
        } catch (error) {
            setIsAuthenticated(false);
            setUser(null);
            localStorage.removeItem('token');
        }
    };

    const login = (token: string) => {
        localStorage.setItem('token', token);
        checkAuth();
    };

    const logout = () => {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}; 