// src/pages/Chat.tsx
import React, {useState, useEffect, useCallback, memo} from 'react';
import {useNavigate} from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import DatabaseConnection from '../components/DatabaseConnection';
import ConfirmModal from '../components/ConfirmModal';
import {chatApi, Chat} from '../api/chat';
import {authApi} from '../api/auth';

const ChatPage: React.FC = memo(() => {
    const navigate = useNavigate();
    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChatId, setSelectedChatId] = useState<string>('');
    const [selectedLLM, setSelectedLLM] = useState<string>('Local');
    const [showDBModal, setShowDBModal] = useState<boolean>(false);
    const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
    const [chatToDelete, setChatToDelete] = useState<string | null>(null);
    const [showRenameModal, setShowRenameModal] = useState<boolean>(false);
    const [chatToRename, setChatToRename] = useState<{ id: string; title: string } | null>(null);
    const [newChatTitle, setNewChatTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<{ username: string; fullName: string }>({
        username: '',
        fullName: '',
    });

    const loadChats = useCallback(async () => {
        try {
            const loadedChats = await chatApi.getChats();
            setChats(loadedChats);
            if (loadedChats.length > 0 && !selectedChatId) {
                setSelectedChatId(loadedChats[0].id);
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to load chats';
            setError(errorMsg);
        }
    }, [selectedChatId]);

    const checkAuth = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        try {
            const currentUser = await authApi.getCurrentUser();
            setUser({
                username: currentUser.username,
                fullName: currentUser.username,
            });
            await loadChats();
        } catch (error) {
            navigate('/login');
        } finally {
            setLoading(false);
        }
    }, [navigate, loadChats]);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        if (!loading) {
            loadChats();
        }
    }, [loadChats, loading]);

    const handleNewChat = useCallback(async () => {
        try {
            const newChat = await chatApi.createChat(`Chat ${chats.length + 1}`);
            setChats((prev) => [...prev, newChat]);
            setSelectedChatId(newChat.id);
        } catch (err) {
            setError('Failed to create chat');
        }
    }, [chats.length]);

    const handleSelectChat = useCallback((id: string) => {
        setSelectedChatId(id);
    }, []);

    const handleRenameChat = useCallback((id: string) => {
        const chat = chats.find((c) => c.id === id);
        if (chat) {
            setChatToRename({id, title: chat.title});
            setNewChatTitle(chat.title);
            setShowRenameModal(true);
        }
    }, [chats]);

    const handleConfirmRename = useCallback(async () => {
        if (!chatToRename || !newChatTitle.trim()) return;

        try {
            const updatedChat = await chatApi.updateChat(chatToRename.id, newChatTitle);
            setChats((prev) =>
                prev.map((chat) => (chat.id === chatToRename.id ? updatedChat : chat))
            );
        } catch (err) {
            setError('Failed to rename chat');
        } finally {
            setShowRenameModal(false);
            setChatToRename(null);
            setNewChatTitle('');
        }
    }, [chatToRename, newChatTitle]);

    const handleDeleteChat = useCallback((chatId: string) => {
        setChatToDelete(chatId);
        setShowConfirmModal(true);
    }, []);

    const handleConfirmDelete = useCallback(async () => {
        if (!chatToDelete) return;

        try {
            await chatApi.deleteChat(chatToDelete);
            setChats((prev) => prev.filter((chat) => chat.id !== chatToDelete));
            if (selectedChatId === chatToDelete) {
                setSelectedChatId(chats.length > 1 ? chats[0].id : '');
            }
        } catch (err) {
            setError('Failed to delete chat');
        } finally {
            setShowConfirmModal(false);
            setChatToDelete(null);
        }
    }, [chatToDelete, selectedChatId, chats]);

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Thinking...</div>;
    }

    return (
        <div className="flex h-screen">
            <Sidebar
                chats={chats}
                selectedChat={selectedChatId}
                onNewChat={handleNewChat}
                onSelectChat={handleSelectChat}
                onDeleteChat={handleDeleteChat}
                onRenameChat={handleRenameChat}
                user={user}
            />
            <div className="flex-1 flex flex-col">
                {error && (
                    <div className="p-4 bg-red-500 text-white">
                        {error}
                        <button
                            onClick={() => setError(null)}
                            className="ml-4 text-sm underline"
                        >
                            Close
                        </button>
                    </div>
                )}
                {selectedChatId ? (
                    <ChatArea
                        selectedChatId={selectedChatId}
                        selectedLLM={selectedLLM}
                        onSelectLLM={setSelectedLLM}
                        onConnectDB={() => setShowDBModal(true)}
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-gray-500">Select a chat or create a new one</p>
                    </div>
                )}
            </div>
            <DatabaseConnection
                open={showDBModal}
                onClose={() => setShowDBModal(false)}
                chatId={selectedChatId}
            />
            <ConfirmModal
                open={showConfirmModal}
                onClose={() => {
                    setShowConfirmModal(false);
                    setChatToDelete(null);
                }}
                onConfirm={handleConfirmDelete}
                message="Are you sure you want to delete this chat?"
            />
            <ConfirmModal
                open={showRenameModal}
                onClose={() => {
                    setShowRenameModal(false);
                    setChatToRename(null);
                    setNewChatTitle('');
                }}
                onConfirm={handleConfirmRename}
                message={
                    <div>
                        <p className="mb-2">Enter new chat name:</p>
                        <input
                            type="text"
                            value={newChatTitle}
                            onChange={(e) => setNewChatTitle(e.target.value)}
                            className="w-full p-2 bg-background border border-gray-600 rounded text-text"
                            placeholder="New chat name"
                        />
                    </div>
                }
            />
        </div>
    );
});

export default ChatPage;
