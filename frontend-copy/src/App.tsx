// src/App.tsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat'; // Импорт Chat.tsx
import apiClient from './api/client';

const AppRoutes: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            navigate('/login');
        }
    }, [navigate]);

    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/" element={<Login />} /> {/* Редирект на логин по умолчанию */}
            <Route path="*" element={<div>404 - Page Not Found</div>} /> {/* Обработка 404 */}
        </Routes>
    );
};

const App: React.FC = () => {
    return (
        <Router>
            <AppRoutes />
        </Router>
    );
};

export default App;
