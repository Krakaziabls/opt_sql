import { Client, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { config } from '../config';

export class WebSocketClient {
    private client: Client;
    private subscription: StompSubscription | null = null;
    private messageHandlers: ((data: any) => void)[] = [];
    private errorHandlers: ((error: any) => void)[] = [];

    constructor(chatId: string) {
        this.client = new Client({
            webSocketFactory: () => new SockJS(config.websocketUrl),
            connectHeaders: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            debug: (str) => {
                if (config.debug) {
                    console.log('STOMP: ' + str);
                }
            },
            reconnectDelay: config.reconnectDelay,
            heartbeatIncoming: config.heartbeatInterval,
            heartbeatOutgoing: config.heartbeatInterval,
        });

        this.client.onConnect = () => {
            this.subscription = this.client.subscribe(`/topic/chat/${chatId}`, (message) => {
                try {
                    const data = JSON.parse(message.body);
                    this.messageHandlers.forEach(handler => handler(data));
                } catch (error) {
                    console.error('Error processing message:', error);
                }
            });
        };

        this.client.onStompError = (frame) => {
            console.error('STOMP error:', frame);
            this.errorHandlers.forEach(handler => handler(frame));
        };

        this.client.onWebSocketError = (event) => {
            console.error('WebSocket error:', event);
            this.errorHandlers.forEach(handler => handler(event));
        };

        this.client.activate();
    }

    onMessage(handler: (data: any) => void) {
        this.messageHandlers.push(handler);
    }

    onError(handler: (error: any) => void) {
        this.errorHandlers.push(handler);
    }

    disconnect() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
        if (this.client.active) {
            this.client.deactivate();
        }
    }
} 