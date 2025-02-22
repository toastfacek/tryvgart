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
  transports: ['websocket', 'polling'],
  withCredentials: true
}) as ExtendedSocket

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
  return new Promise((resolve, reject) => {
    const handleRoomCreated = (data: RoomCreatedResponse) => {
      socket.off('room_created', handleRoomCreated)
      socket.off('error', handleError)
      resolve(data)
    }

    const handleError = (error: SocketError) => {
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
    socket.emit('join_room', { roomCode, playerName, emoji })
  })
}

// Should handle reconnection and rejoin room
socket.on('reconnect', () => {
  const currentRoom = localStorage.getItem('currentRoom')
  if (currentRoom) {
    socket.emit('rejoin_room', { roomCode: currentRoom })
  }
}) 