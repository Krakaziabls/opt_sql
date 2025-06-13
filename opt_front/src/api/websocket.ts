import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { config } from '../config';

// Глобальная переменная для хранения клиента WebSocket
let stompClient: Client | null = null;

// Создает и настраивает новый клиент WebSocket
export const createWebSocketClient = (token: string) => {
    // Если клиент уже существует, отключаем его
    if (stompClient) {
        stompClient.deactivate();
        stompClient = null;
    }

    stompClient = new Client({
        webSocketFactory: () => new SockJS(config.websocketUrl),
        connectHeaders: {
            Authorization: `Bearer ${token}`
        },
        debug: function (str) {
            if (config.debug) {
                console.log('STOMP: ' + str);
            }
        },
        reconnectDelay: config.reconnectDelay,
        heartbeatIncoming: config.heartbeatInterval,
        heartbeatOutgoing: config.heartbeatInterval,
        onStompError: (frame) => {
            console.error('STOMP error:', frame);
        },
        onWebSocketError: (event) => {
            console.error('WebSocket error:', event);
        },
        onWebSocketClose: (event) => {
            console.log('WebSocket closed:', event);
        }
    });

    return stompClient;
};

// Отключает существующий WebSocket-клиент
export const disconnectWebSocket = () => {
    if (stompClient) {
        stompClient.deactivate();
        stompClient = null;
    }
};

// Возвращает текущий WebSocket-клиент
export const getWebSocketClient = () => stompClient;
