import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card";
import { authApi } from "../api/auth";
import apiClient from "../api/client";

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await authApi.login({ username, password });
            // Сохраняем токен в localStorage
            localStorage.setItem('token', response.token);
            // Устанавливаем токен в заголовки для всех последующих запросов
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.token}`;
            navigate("/chat");
        } catch (err) {
            setError("Неверное имя пользователя или пароль");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Вход</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            placeholder="Имя пользователя"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                        <Input
                            placeholder="Пароль"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <Button className="w-full" type="submit" disabled={loading}>
                            {loading ? "Вход..." : "Войти"}
                        </Button>
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
