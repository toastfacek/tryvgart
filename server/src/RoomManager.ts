import { Server, Socket } from 'socket.io'
import { Player, Room, GamePhase } from './types/game'
import { generateRoomCode } from './utils'

export class RoomManager {
  private rooms: Map<string, Room> = new Map()
  private io: Server

  constructor(io: Server) {
    this.io = io
  }

  createRoom(socket: Socket, playerName: string, playerEmoji: string): Room {
    const roomCode = generateRoomCode()
    const player: Player = { id: socket.id, name: playerName, emoji: playerEmoji }
    
    const room: Room = {
      code: roomCode,
      host: player,
      players: [player],
      gameState: 'lobby',
      prompts: [],
      answers: new Map(),
      guesses: new Map(),
      scores: new Map([[player.id, 0]]),
      currentPromptIndex: 0
    }
    
    this.rooms.set(roomCode, room)
    socket.join(roomCode)
    return room
  }

  addPlayerToRoom(socket: Socket, roomCode: string, playerName: string, playerEmoji: string): { success: boolean; error?: string; room?: Room } {
    const room = this.rooms.get(roomCode)
    if (!room) {
      return { success: false, error: 'Room not found' }
    }

    const existingPlayer = room.players.find(p => 
      p.id === socket.id || 
      p.name.toLowerCase() === playerName.toLowerCase()
    )

    if (existingPlayer) {
      return { success: false, error: 'You are already in this room or name is taken' }
    }

    const player: Player = { id: socket.id, name: playerName, emoji: playerEmoji }
    room.players.push(player)
    room.scores.set(player.id, 0)
    socket.join(roomCode)
    
    return { success: true, room }
  }

  removePlayer(socket: Socket): void {
    for (const [roomCode, room] of this.rooms.entries()) {
      const playerIndex = room.players.findIndex(p => p.id === socket.id)
      if (playerIndex !== -1) {
        const [player] = room.players.splice(playerIndex, 1)
        room.scores.delete(player.id)
        
        this.io.to(roomCode).emit('player_left', { playerId: socket.id })

        if (room.host.id === socket.id) {
          this.rooms.delete(roomCode)
          this.io.to(roomCode).emit('room_closed')
        } else if (room.players.length === 0) {
          this.rooms.delete(roomCode)
        }
      }
    }
  }

  submitPrompt(roomCode: string, playerId: string, prompt: string): boolean {
    const room = this.rooms.get(roomCode)
    if (!room) return false

    room.prompts.push(prompt)
    this.io.to(roomCode).emit('prompt_submitted', { playerId })

    if (room.prompts.length === room.players.length) {
      this.io.to(roomCode).emit('all_prompts_submitted')
    }
    return true
  }

  submitAnswer(roomCode: string, playerId: string, answer: string): boolean {
    const room = this.rooms.get(roomCode)
    if (!room) return false

    if (!room.answers.has(room.currentPromptIndex)) {
      room.answers.set(room.currentPromptIndex, new Map())
    }
    const promptAnswers = room.answers.get(room.currentPromptIndex)!
    promptAnswers.set(playerId, answer)

    this.io.to(roomCode).emit('player_submitted_answer', { playerId })

    return promptAnswers.size === room.players.length
  }

  updateGameState(roomCode: string, newState: GamePhase): boolean {
    const room = this.rooms.get(roomCode)
    if (!room) return false

    room.gameState = newState
    this.io.to(roomCode).emit('game_phase_changed', { phase: newState })
    return true
  }

  getRoom(roomCode: string): Room | undefined {
    return this.rooms.get(roomCode)
  }

  validateHost(roomCode: string, socketId: string): boolean {
    const room = this.rooms.get(roomCode)
    return room?.host.id === socketId
  }

  resetRoom(roomCode: string): boolean {
    const room = this.rooms.get(roomCode)
    if (!room) return false

    room.gameState = 'lobby'
    room.prompts = []
    room.answers = new Map()
    room.guesses = new Map()
    room.scores = new Map()
    room.players.forEach(player => {
      room.scores.set(player.id, 0)
    })

    return true
  }

  closeRoom(roomCode: string): void {
    this.rooms.delete(roomCode)
  }
} 