import { io } from 'socket.io-client';

const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
  autoConnect: false,
  withCredentials: true,
  auth: {}, // Initialize auth as an empty object
});

// Function to set the token before connecting
export function setSocketAuthToken(token) {
  if (typeof token === 'string' && token.match(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/)) {
    socket.auth = { token };
    console.log('Socket.IO auth token set:', token.substring(0, 20) + '...');
  } else {
    console.error('Invalid token format for Socket.IO:', token);
    socket.auth = {};
  }
}

export default socket;