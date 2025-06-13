import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { connectionApi } from '../api/connection';
import { useDatabaseConnections } from '../context/DatabaseConnectionContext';
import { DatabaseConnectionDto } from '../types/database';

interface DatabaseConnectionProps {
    open: boolean;
    onClose: () => void;
    chatId?: string;
}

const DatabaseConnection: React.FC<DatabaseConnectionProps> = ({ open, onClose, chatId }) => {
    const { setConnections } = useDatabaseConnections();
    const [form, setForm] = useState<DatabaseConnectionDto>({
        chatId: chatId || '',
        name: '',
        dbType: 'PostgreSQL',
        host: '',
        port: 5432,
        databaseName: '',
        username: '',
        password: '',
    });
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const handleChange = (field: keyof DatabaseConnectionDto, value: string | number) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleTestConnection = async () => {
        setLoading(true);
        setError('');
        try {
            const { success } = await connectionApi.testConnection(form);
            if (success) {
                alert('Connection successful!');
            } else {
                setError('Connection failed. Please check your credentials.');
            }
        } catch (err) {
            setError('Failed to test connection: ' + (err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!chatId) {
            setError('Chat ID is required.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const newConnection = await connectionApi.createConnection({ ...form, chatId });
            const connections = await connectionApi.getConnectionsForChat(chatId);
            setConnections(connections);
            onClose();
        } catch (err) {
            setError('Failed to save connection: ' + (err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    // Загружаем список подключений при открытии модального окна
    useEffect(() => {
        if (open && chatId) {
            const loadConnections = async () => {
                try {
                    const connections = await connectionApi.getConnectionsForChat(chatId);
                    setConnections(connections);
                } catch (err) {
                    console.error('Failed to load connections:', err);
                }
            };
            loadConnections();
        }
    }, [open, chatId, setConnections]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-secondary p-6 rounded-lg text-text w-96">
                <h2 className="text-lg font-semibold mb-4">Connect to Database</h2>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <select
                    className="w-full bg-[#4A4A4A] text-text px-4 py-2 rounded-lg mb-4 outline-none"
                    value={form.dbType}
                    onChange={(e) => handleChange('dbType', e.target.value)}
                >
                    <option value="PostgreSQL">PostgreSQL</option>
                    <option value="Greenplum">Greenplum</option>
                </select>
                <Input
                    className="w-full bg-[#4A4A4A] mb-4"
                    placeholder="Connection Name"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                />
                <Input
                    className="w-full bg-[#4A4A4A] mb-4"
                    placeholder="Host"
                    value={form.host}
                    onChange={(e) => handleChange('host', e.target.value)}
                />
                <Input
                    className="w-full bg-[#4A4A4A] mb-4"
                    placeholder="Port"
                    type="number"
                    value={form.port}
                    onChange={(e) => handleChange('port', parseInt(e.target.value))}
                />
                <Input
                    className="w-full bg-[#4A4A4A] mb-4"
                    placeholder="Database"
                    value={form.databaseName}
                    onChange={(e) => handleChange('databaseName', e.target.value)}
                />
                <Input
                    className="w-full bg-[#4A4A4A] mb-4"
                    placeholder="User"
                    value={form.username}
                    onChange={(e) => handleChange('username', e.target.value)}
                />
                <Input
                    type="password"
                    className="w-full bg-[#4A4A4A] mb-4"
                    placeholder="Password"
                    value={form.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                />
                <div className="flex justify-end space-x-2">
                    <Button onClick={handleTestConnection} variant="outline" disabled={loading}>
                        Test
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        Save
                    </Button>
                    <Button onClick={onClose} variant="outline" disabled={loading}>
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default DatabaseConnection;
