import { useState, useEffect } from 'react';
import { authApi } from '../api/auth';

interface LoginRequest {
    username: string;
    password: string;
}

interface RegisterRequest {
    username: string;
    password: string;
    email: string;
    fullName: string;
}

export const useAuth = () => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);

    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);
            setIsAuthenticated(true);
        } else {
            localStorage.removeItem('token');
            setIsAuthenticated(false);
        }
    }, [token]);

    const login = async (username: string, password: string) => {
        const response = await authApi.login({ username, password });
        setToken(response.token);
        return response;
    };

    const register = async (data: { email: string; password: string; fullName: string; username: string }) => {
        const response = await authApi.register(data);
        setToken(response.token);
        return response;
    };

    const logout = () => {
        setToken(null);
    };

    return {
        token,
        isAuthenticated,
        login,
        register,
        logout
    };
};
