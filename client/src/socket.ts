import io from 'socket.io-client';

// Connect to the server's WebSocket endpoint
export const socket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:3001', {
  autoConnect: true,
  reconnection: true,
}); 