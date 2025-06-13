import React, { useState } from 'react';
import { useNavigate, Link } from "react-router-dom";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import Card from "../components/Card";
import { CardHeader, CardTitle, CardContent } from "../components/Card";
import { authApi } from "../api/auth";
import apiClient from "../api/client";
import { useAuth } from '../hooks/useAuth';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await login(formData.username, formData.password);
            navigate("/chat");
        } catch (err) {
            setError("Неверное имя пользователя или пароль");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="max-w-md w-full space-y-8">
                <CardHeader>
                    <CardTitle className="text-center text-3xl font-extrabold text-gray-900">
                        Вход
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div>
                                <label htmlFor="username" className="sr-only">Имя пользователя</label>
                                <Input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    placeholder="Имя пользователя"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="sr-only">Пароль</label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    placeholder="Пароль"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <div>
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={loading}
                            >
                                {loading ? "Вход..." : "Войти"}
                            </Button>
                        </div>
                        <Link to="/register" className="text-sm text-primary text-center block">
                            Нет аккаунта? Зарегистрироваться
                        </Link>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default Login;
