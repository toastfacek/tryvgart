import io from 'socket.io-client'
import { SERVER_URL } from '../config'
import { Room } from '../types/game'

// Connect to the server's WebSocket endpoint
export const socket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:3001', {
  autoConnect: true,
  reconnection: true,
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