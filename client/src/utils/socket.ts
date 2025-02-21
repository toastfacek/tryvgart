import { io } from 'socket.io-client'
import { SERVER_URL } from '../config'

export const socket = io(SERVER_URL)

export const createRoom = (playerName: string, emoji: string) => {
  return new Promise((resolve, reject) => {
    const handleRoomCreated = ({ roomCode, room }: any) => {
      socket.off('room_created', handleRoomCreated)
      socket.off('error', handleError)
      resolve({ roomCode, room })
    }

    const handleError = (error: any) => {
      socket.off('room_created', handleRoomCreated)
      socket.off('error', handleError)
      reject(error)
    }

    socket.on('room_created', handleRoomCreated)
    socket.on('error', handleError)
    socket.emit('create_room', { playerName, emoji })
  })
}

export const joinRoom = (roomCode: string, playerName: string, emoji: string) => {
  return new Promise((resolve, reject) => {
    const handleRoomJoined = ({ room }: any) => {
      socket.off('room_joined', handleRoomJoined)
      socket.off('error', handleError)
      resolve(room)
    }

    const handleError = (error: any) => {
      socket.off('room_joined', handleRoomJoined)
      socket.off('error', handleError)
      reject(error)
    }

    socket.on('room_joined', handleRoomJoined)
    socket.on('error', handleError)
    socket.emit('join_room', { roomCode, playerName, emoji })
  })
} 