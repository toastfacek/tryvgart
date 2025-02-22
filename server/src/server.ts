import express from 'express'
import type { Request, Response } from 'express'
import { createServer } from 'http'
import type { Server as HTTPServer } from 'http'
import { Server, Socket } from 'socket.io'
import cors from 'cors'
import type { CorsOptions } from 'cors'
import * as dotenv from 'dotenv'
import { RoomManager } from './RoomManager'
import { EventValidator } from './EventValidator'
import { Player, Room, GamePhase, GuessPhaseData } from './types/game'

dotenv.config()

const app = express()
const httpServer: HTTPServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: [
      process.env.CLIENT_URL || 'http://localhost:5173',
      'https://tryvgart.vercel.app',
      'https://tryvgart-server.onrender.com'
    ],
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  allowEIO3: true,
  transports: ['websocket', 'polling']
})

// Middleware
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'https://tryvgart.vercel.app',
    'https://tryvgart-server.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json())

// Initialize managers
const roomManager = new RoomManager(io)
const eventValidator = new EventValidator(roomManager)

// Event interfaces
interface CreateRoomData {
  playerName: string
  playerEmoji: string
}

interface JoinRoomData {
  roomCode: string
  playerName: string
  playerEmoji: string
}

interface CloseRoomData {
  roomCode: string
}

interface StartGameData {
  roomCode: string
}

interface SubmitPromptData {
  roomCode: string
  prompt: string
}

interface SubmitAnswerData {
  roomCode: string
  answer: string
}

interface SubmitGuessesData {
  roomCode: string
  promptIndex: number
  guesses: Record<string, string>
}

interface NextPromptData {
  roomCode: string
}

// Add interfaces for the remaining event handlers
interface StartAnswerPhaseData {
  roomCode: string
}

interface StartGuessPhaseData {
  roomCode: string
}

interface StartRevealPhaseData {
  roomCode: string
}

interface ResetGameData {
  roomCode: string
}

// Add interfaces for emitted events
interface RoomCreatedPayload {
  roomCode: string;
  room: Room;
}

interface HealthResponse {
  status: string;
}

// Add this interface near the other interfaces
interface NextQuestionData {
  roomCode: string
}

function emitError(socket: Socket, message: string) {
  socket.emit('error', { message })
}

function mapToObject<T>(map: Map<string, T>): Record<string, T> {
  return Object.fromEntries(map.entries())
}

function getPlayerById(players: Player[], playerId: string): Player | undefined {
  return players.find(p => p.id === playerId)
}

function updateRoomState(room: Room, newState: GamePhase, io: Server) {
  room.gameState = newState
  io.to(room.code).emit('game_phase_changed', { phase: newState })
}

function validateRoomAndHost(roomCode: string, socket: Socket): Room | undefined {
  const room = roomManager.getRoom(roomCode)
  if (!room) {
    emitError(socket, 'Room not found')
    return
  }
  if (room.host.id !== socket.id) {
    emitError(socket, 'Only the host can perform this action')
    return
  }
  return room
}

io.on('connection', (socket: Socket) => {
  console.log('User connected:', socket.id)

  // Handle room creation
  socket.on('create_room', (data: CreateRoomData) => {
    const validation = eventValidator.validateCreateRoom(data)
    if (!validation.isValid) {
      emitError(socket, validation.error!)
      return
    }

    const room = roomManager.createRoom(socket, data.playerName, data.playerEmoji)
    socket.emit('room_created', { 
      roomCode: room.code,
      room: {
        ...room,
        answers: {},
        guesses: {},
        scores: Object.fromEntries(room.scores)
      }
    })
  })

  // Handle room joining
  socket.on('join_room', (data: JoinRoomData) => {
    const validation = eventValidator.validateJoinRoom(data)
    if (!validation.isValid) {
      emitError(socket, validation.error!)
      return
    }

    const result = roomManager.addPlayerToRoom(socket, data.roomCode, data.playerName, data.playerEmoji)
    if (!result.success) {
      emitError(socket, result.error!)
      return
    }

    io.to(data.roomCode).emit('player_joined', { 
      player: { id: socket.id, name: data.playerName, emoji: data.playerEmoji }
    })
    socket.emit('room_joined', { room: result.room })
  })

  // Handle disconnection
  socket.on('disconnect', () => {
    roomManager.removePlayer(socket)
  })

  // Handle game events
  socket.on('start_game', (data: StartGameData) => {
    const validation = eventValidator.validateHostAction(socket, data.roomCode)
    if (!validation.isValid) {
      emitError(socket, validation.error!)
      return
    }

    roomManager.updateGameState(data.roomCode, 'prompt')
    io.to(data.roomCode).emit('game_started')
  })

  socket.on('submit_prompt', (data: SubmitPromptData) => {
    const validation = eventValidator.validateSubmitPrompt(data)
    if (!validation.isValid) {
      emitError(socket, validation.error!)
      return
    }

    roomManager.submitPrompt(data.roomCode, socket.id, data.prompt)
  })

  socket.on('start_answer_phase', (data: { roomCode: string }) => {
    const validation = eventValidator.validateHostAction(socket, data.roomCode)
    if (!validation.isValid) {
      emitError(socket, validation.error!)
      return
    }

    const room = roomManager.getRoom(data.roomCode)
    if (!room) return

    roomManager.updateGameState(data.roomCode, 'answer')
    io.to(data.roomCode).emit('answer_phase_started', {
      prompt: room.prompts[room.currentPromptIndex]
    })
  })

  socket.on('submit_answer', (data: SubmitAnswerData) => {
    const validation = eventValidator.validateSubmitAnswer(data)
    if (!validation.isValid) {
      emitError(socket, validation.error!)
      return
    }

    const allAnswersSubmitted = roomManager.submitAnswer(data.roomCode, socket.id, data.answer)
    if (allAnswersSubmitted) {
      const room = roomManager.getRoom(data.roomCode)
      if (room) {
        roomManager.updateGameState(data.roomCode, 'guess')
        // Format and send guess phase data
        const guessPhaseData = {
          prompts: room.prompts,  // Send all prompts
          answers: [{
            promptIndex: room.currentPromptIndex,
            answers: Array.from(room.answers.get(room.currentPromptIndex)!.entries()).map(([playerId, text]) => {
              const player = room.players.find(p => p.id === playerId)
              return {
                playerId,
                text,
                authorName: player?.name,
                authorEmoji: player?.emoji
              }
            })
          }]
        }
        io.to(data.roomCode).emit('guess_phase_started', guessPhaseData)
      }
    }
  })

  socket.on('submit_guesses', (data: SubmitGuessesData) => {
    const validation = eventValidator.validateSubmitGuesses(data)
    if (!validation.isValid) {
      emitError(socket, validation.error!)
      return
    }

    const room = roomManager.getRoom(data.roomCode)
    if (!room) {
      emitError(socket, 'Room not found')
      return
    }

    // Store guesses
    if (!room.guesses.has(data.promptIndex)) {
      room.guesses.set(data.promptIndex, new Map())
    }
    room.guesses.get(data.promptIndex)!.set(socket.id, data.guesses)

    io.to(data.roomCode).emit('guess_submitted', { playerId: socket.id })

    // Check if all players have submitted guesses
    const promptGuesses = room.guesses.get(data.promptIndex)!
    if (promptGuesses.size === room.players.length) {
      // Calculate scores and send reveal data
      const promptAnswers = room.answers.get(data.promptIndex)!
      promptGuesses.forEach((playerGuesses: Record<string, string>, guessingPlayerId: string) => {
        Object.entries(playerGuesses).forEach(([answerPlayerId, guessedPlayerId]) => {
          if (guessedPlayerId === answerPlayerId) {
            const currentScore = room.scores.get(guessingPlayerId) || 0
            room.scores.set(guessingPlayerId, currentScore + 1)
          }
        })
      })

      io.to(data.roomCode).emit('reveal_answers', {
        promptIndex: data.promptIndex,
        prompts: room.prompts,
        answers: Array.from(promptAnswers.entries()).map(([playerId, text]) => {
          const player = room.players.find(p => p.id === playerId)
          return {
            playerId,
            text,
            authorName: player?.name,
            authorEmoji: player?.emoji
          }
        }),
        guesses: Array.from(promptGuesses.entries()),
        scores: Array.from(room.scores.entries()).map(([playerId, score]) => {
          const player = room.players.find(p => p.id === playerId)
          return {
            playerId,
            playerName: player?.name,
            playerEmoji: player?.emoji,
            score
          }
        })
      })
    }
  })

  socket.on('next_prompt', (data: NextPromptData) => {
    const validation = eventValidator.validateHostAction(socket, data.roomCode)
    if (!validation.isValid) {
      emitError(socket, validation.error!)
      return
    }

    const room = roomManager.getRoom(data.roomCode)
    if (!room) return

    room.currentPromptIndex++

    if (room.currentPromptIndex < room.prompts.length) {
      roomManager.updateGameState(data.roomCode, 'answer')
      io.to(data.roomCode).emit('answer_phase_started', {
        prompt: room.prompts[room.currentPromptIndex]
      })
    } else {
      roomManager.updateGameState(data.roomCode, 'end')
      const finalScores = Array.from(room.scores.entries())
        .map(([playerId, score]) => ({
          player: room.players.find(p => p.id === playerId),
          score
        }))
        .sort((a, b) => b.score - a.score)
      
      io.to(data.roomCode).emit('game_ended', { finalScores })
    }
  })

  socket.on('reset_game', (data: ResetGameData) => {
    const validation = eventValidator.validateHostAction(socket, data.roomCode)
    if (!validation.isValid) {
      emitError(socket, validation.error!)
      return
    }

    if (roomManager.resetRoom(data.roomCode)) {
      io.to(data.roomCode).emit('game_reset')
    }
  })
})

// Utils
app.get('/health', (_: Request, res: Response) => {
  res.json({ status: 'ok' } as HealthResponse)
})

const PORT = process.env.PORT || 3000
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
}) 