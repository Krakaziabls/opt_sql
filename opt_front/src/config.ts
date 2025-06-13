export const config = {
    apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
    websocketUrl: process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:8080/api/ws',
    debug: process.env.REACT_APP_DEBUG === 'true',
    maxReconnectAttempts: 5,
    reconnectDelay: 5000,
    heartbeatInterval: 10000,
    messageQueueSize: 1000,
    connectionTimeout: 30000,
} as const; 