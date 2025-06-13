// src/App.tsx
import React, {useEffect} from 'react';
import {BrowserRouter as Router, Routes, Route, useNavigate, Navigate} from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat'; // Импорт Chat.tsx
import apiClient from './api/client';
import {ChatProvider} from './context/ChatContext';
import {DatabaseConnectionProvider} from './context/DatabaseConnectionContext';
import {LLMProvider} from './context/LLMContext';
import {MPPProvider} from './context/MPPContext';
import {useAuth} from './hooks/useAuth';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const {isAuthenticated} = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
    }, []);

    if (!isAuthenticated) {
        return <Navigate to="/login"/>;
    }

    return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const {isAuthenticated} = useAuth();

    if (isAuthenticated) {
        return <Navigate to="/chat"/>;
    }

    return <>{children}</>;
};

const AppRoutes: React.FC = () => {
    return (
        <Routes> <Route path="/login" element={
            <PublicRoute>
                <Login/>
            </PublicRoute>
        }/>
            <Route path="/register" element={
                <PublicRoute>
                    <Register/>
                </PublicRoute>
            }/>
            <Route path="/chat" element={
                <ProtectedRoute>
                    <MPPProvider>
                        <LLMProvider>
                            <DatabaseConnectionProvider>
                                <ChatProvider>
                                    <Chat/>
                                </ChatProvider>
                            </DatabaseConnectionProvider>
                        </LLMProvider>
                    </MPPProvider>
                </ProtectedRoute>
            }/>
            <Route path="/" element={<Navigate to="/chat"/>}/>
            <Route path="*" element={<div>404 - Page Not Found</div>}/>
        </Routes>
    );
};

const App: React.FC = () => {
    return (
        <Router> <AppRoutes/>
        </Router>
    );
};

export default App;
