import React, { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { cn } from '../lib/utils';
import { Chat } from '../api/chat';
import { chatApi } from '../api/chat';

interface ChatListProps {
    chats: Chat[];
    selectedChatId: string | null;
    onSelectChat: (chatId: string) => void;
    onChatsChange: () => void;
}

const ChatList: React.FC<ChatListProps> = ({
    chats,
    selectedChatId,
    onSelectChat,
    onChatsChange,
}) => {
    const [newChatTitle, setNewChatTitle] = useState('');
    const [editingChatId, setEditingChatId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCreateChat = async () => {
        if (!newChatTitle.trim()) return;

        setLoading(true);
        setError('');

        try {
            await chatApi.createChat(newChatTitle);
            setNewChatTitle('');
            onChatsChange();
        } catch (err) {
            setError('Failed to create chat: ' + (err instanceof Error ? err.message : 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateChat = async (chatId: string) => {
        if (!editingTitle.trim()) return;

        setLoading(true);
        setError('');

        try {
            await chatApi.updateChat(chatId, editingTitle);
            setEditingChatId(null);
            setEditingTitle('');
            onChatsChange();
        } catch (err) {
            setError('Failed to update chat: ' + (err instanceof Error ? err.message : 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteChat = async (chatId: string) => {
        if (!window.confirm('Are you sure you want to delete this chat?')) return;

        setLoading(true);
        setError('');

        try {
            await chatApi.deleteChat(chatId);
            onChatsChange();
        } catch (err) {
            setError('Failed to delete chat: ' + (err instanceof Error ? err.message : 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const startEditing = (chat: Chat) => {
        setEditingChatId(chat.id);
        setEditingTitle(chat.title);
    };

    const cancelEditing = () => {
        setEditingChatId(null);
        setEditingTitle('');
    };

    return (
        <div className="w-64 bg-secondary p-4 flex flex-col">
            <div className="mb-4">
                <h2 className="text-lg font-semibold mb-2">Chats</h2>
                <div className="flex space-x-2">
                    <Input
                        value={newChatTitle}
                        onChange={(e) => setNewChatTitle(e.target.value)}
                        placeholder="New chat title..."
                        className="flex-1"
                        disabled={loading}
                    />
                    <Button onClick={handleCreateChat} disabled={loading}>
                        +
                    </Button>
                </div>
            </div>

            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

            <div className="flex-1 overflow-y-auto">
                {chats.map((chat) => (
                    <div
                        key={chat.id}
                        className={cn(
                            'p-2 mb-2 rounded-lg cursor-pointer flex items-center justify-between group',
                            selectedChatId === chat.id
                                ? 'bg-primary text-text'
                                : 'hover:bg-[#4A4A4A]'
                        )}
                    >
                        {editingChatId === chat.id ? (
                            <div className="flex-1 flex items-center space-x-2">
                                <Input
                                    value={editingTitle}
                                    onChange={(e) => setEditingTitle(e.target.value)}
                                    className="flex-1"
                                    disabled={loading}
                                />
                                <Button onClick={() => handleUpdateChat(chat.id)} disabled={loading}>
                                    ✓
                                </Button>
                                <Button onClick={cancelEditing} disabled={loading}>
                                    ✕
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div
                                    className="flex-1 truncate"
                                    onClick={() => onSelectChat(chat.id)}
                                >
                                    {chat.title}
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
                                    <button
                                        onClick={() => startEditing(chat)}
                                        className="p-1 hover:bg-[#4A4A4A] rounded"
                                        disabled={loading}
                                    >
                                        ✎
                                    </button>
                                    <button
                                        onClick={() => handleDeleteChat(chat.id)}
                                        className="p-1 hover:bg-[#4A4A4A] rounded text-red-500"
                                        disabled={loading}
                                    >
                                        ×
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ChatList; 