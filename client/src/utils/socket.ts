import { io, Socket } from 'socket.io-client'
import { DefaultEventsMap } from '@socket.io/component-emitter'
import { Room } from '../types/game'

// Define extended Socket type that includes onAny and offAny
export interface ExtendedSocket extends Socket<DefaultEventsMap, DefaultEventsMap> {
  onAny: (listener: (eventName: string, ...args: any[]) => void) => this;
  offAny: (listener: (eventName: string, ...args: any[]) => void) => this;
}

// Connect to the server's WebSocket endpoint
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'
console.log('Connecting to server:', SERVER_URL)

export const socket = io(SERVER_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  transports: ['websocket', 'polling'],
  withCredentials: true
}) as ExtendedSocket

// Add connection event listeners
socket.on('connect', () => {
  console.log('Socket connected:', socket.id)
})

socket.on('disconnect', () => {
  console.log('Socket disconnected')
})

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error)
})

socket.on('connect_timeout', () => {
  console.error('Socket connection timeout')
})

socket.on('error', (error) => {
  console.error('Socket error:', error)
})

// Debug all events
socket.onAny((event, ...args) => {
  console.log('Socket event:', event, args)
})

interface RoomCreatedResponse {
  roomCode: string
  room: Room
}

interface RoomJoinedResponse {
  room: Room
}

interface SocketError {
  message: string
}

export const createRoom = (playerName: string, emoji: string): Promise<RoomCreatedResponse> => {
  console.log('Creating room with:', { playerName, emoji })
  return new Promise((resolve, reject) => {
    const handleRoomCreated = (data: RoomCreatedResponse) => {
      console.log('Room created:', data)
      socket.off('room_created', handleRoomCreated)
      socket.off('error', handleError)
      resolve(data)
    }

    const handleError = (error: SocketError) => {
      console.error('Error creating room:', error)
      socket.off('room_created', handleRoomCreated)
      socket.off('error', handleError)
      reject(error)
    }

    socket.on('room_created', handleRoomCreated)
    socket.on('error', handleError)
    socket.emit('create_room', { 
      playerName: playerName.trim(),
      playerEmoji: emoji
    })
  })
}

export const joinRoom = (roomCode: string, playerName: string, emoji: string): Promise<Room> => {
  return new Promise((resolve, reject) => {
    const handleRoomJoined = ({ room }: RoomJoinedResponse) => {
      socket.off('room_joined', handleRoomJoined)
      socket.off('error', handleError)
      resolve(room)
    }

    const handleError = (error: SocketError) => {
      socket.off('room_joined', handleRoomJoined)
      socket.off('error', handleError)
      reject(error)
    }

    socket.on('room_joined', handleRoomJoined)
    socket.on('error', handleError)
    socket.emit('join_room', { roomCode, playerName, playerEmoji: emoji })
  })
}

// Should handle reconnection and rejoin room
socket.on('reconnect', () => {
  console.log('Socket reconnected')
  const currentRoom = localStorage.getItem('currentRoom')
  if (currentRoom) {
    console.log('Rejoining room:', currentRoom)
    socket.emit('rejoin_room', { roomCode: currentRoom })
  }
}) 