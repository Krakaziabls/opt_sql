// src/pages/Register.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from "../api/auth";
import apiClient from "../api/client";

const Register: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        username: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await authApi.register(formData);
            navigate('/chat');
        } catch (error) {
            console.error('Registration error:', error);
            setError('Ошибка при регистрации. Пожалуйста, попробуйте еще раз.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Регистрация
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="rounded-md bg-red-50 p-4">
                            <div className="text-sm text-red-700">{error}</div>
                        </div>
                    )}
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email" className="sr-only">
                                Email
                            </label>
                            <input                                id="email"
                                                                  name="email"
                                                                  type="email"
                                                                  required
                                                                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                                                  placeholder="Email"
                                                                  value={formData.email}
                                                                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />                        </div>
                        <div>                            <label htmlFor="username" className="sr-only">
                            Имя пользователя
                        </label>
                            <input                                id="username"
                                                                  name="username"
                                                                  type="text"
                                                                  required
                                                                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                                                  placeholder="Имя пользователя"
                                                                  value={formData.username}
                                                                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            />                        </div>
                        <div>                            <label htmlFor="fullName" className="sr-only">
                            Полное имя
                        </label>
                            <input                                id="fullName"
                                                                  name="fullName"
                                                                  type="text"
                                                                  required
                                                                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                                                  placeholder="Полное имя"
                                                                  value={formData.fullName}
                                                                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            />                        </div>
                        <div>                            <label htmlFor="password" className="sr-only">
                            Пароль
                        </label>
                            <input                                id="password"
                                                                  name="password"
                                                                  type="password"
                                                                  required
                                                                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                                                  placeholder="Пароль"
                                                                  value={formData.password}
                                                                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />                        </div>
                    </div>

                    <div>                        <button
                        type="submit"
                        disabled={loading}
                        className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                    </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
