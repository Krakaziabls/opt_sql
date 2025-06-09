import React from 'react';
import { Button } from './Button';
import { cn } from '../lib/utils';
import { Chat } from '../api/chat';

interface User {
    username: string;
    fullName: string;
}

interface SidebarProps {
    chats: Chat[];
    selectedChat: string;
    onSelectChat: (id: string) => void;
    onNewChat: () => void;
    onRenameChat: (id: string) => void;
    onDeleteChat: (id: string) => void;
    user: User;
}

const Sidebar: React.FC<SidebarProps> = ({
                                             chats,
                                             selectedChat,
                                             onSelectChat,
                                             onNewChat,
                                             onRenameChat,
                                             onDeleteChat,
                                             user,
                                         }) => {
    return (
        <div className="w-64 bg-card p-4 flex flex-col h-screen text-text">
            <Button onClick={onNewChat} className="mb-4">
                + New Chat
            </Button>
            <div className="flex-1 overflow-y-auto">
                {chats.map((chat) => (
                    <div
                        key={chat.id}
                        className={cn(
                            'p-2 rounded-lg mb-2 cursor-pointer flex justify-between items-center',
                            chat.id === selectedChat ? 'bg-primary' : 'bg-secondary'
                        )}
                        onClick={() => onSelectChat(chat.id)}
                    >
                        <div>
                            <p>{chat.title}</p>
                            <p className="text-sm text-muted">{new Date(chat.updatedAt).toLocaleString()}</p>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRenameChat(chat.id);
                                }}
                                className="text-muted hover:text-text"
                            >
                                ✏️
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteChat(chat.id);
                                }}
                                className="text-muted hover:text-text"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-auto p-2 bg-secondary rounded-lg">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                        <span className="text-text">{user.username.charAt(0)}</span>
                    </div>
                    <div>
                        <p className="font-semibold">@{user.username}</p>
                        <p className="text-sm text-muted">{user.fullName}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
