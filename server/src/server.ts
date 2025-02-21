import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import { generateRoomCode } from './utils'

dotenv.config()

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})

// Middleware
app.use(cors())
app.use(express.json())

// Store game state in memory
const rooms = new Map()

interface Player {
  id: string
  name: string
  emoji: string
}

interface Room {
  code: string
  host: Player
  players: Player[]
  gameState: 'lobby' | 'prompt' | 'answer' | 'guess' | 'reveal' | 'end'
  prompts: Map<string, string> // playerId -> prompt
  answers: Map<number, Map<string, string>> // promptIndex -> (playerId -> answer)
  guesses: Map<number, Map<string, Record<number, string>>> // promptIndex -> playerId -> guesses
  scores: Map<string, number> // playerId -> score
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  // Handle room creation
  socket.on('create_room', ({ playerName, emoji }) => {
    const roomCode = generateRoomCode()
    const room: Room = {
      code: roomCode,
      host: { id: socket.id, name: playerName, emoji },
      players: [{ id: socket.id, name: playerName, emoji }],
      gameState: 'lobby',
      prompts: new Map(),
      answers: new Map(),
      guesses: new Map(),
      scores: new Map()
    }
    
    rooms.set(roomCode, room)
    socket.join(roomCode)
    socket.emit('room_created', { roomCode, room })
    room.scores.set(socket.id, 0)
  })

  // Handle room joining
  socket.on('join_room', ({ roomCode, playerName, emoji }) => {
    const room = rooms.get(roomCode)
    
    if (!room) {
      socket.emit('error', { message: 'Room not found' })
      return
    }

    const newPlayer = { id: socket.id, name: playerName, emoji }
    room.players.push(newPlayer)
    
    socket.join(roomCode)
    socket.emit('room_joined', { room })
    io.to(roomCode).emit('player_joined', { player: newPlayer })
    room.scores.set(socket.id, 0)
  })

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
    // Remove player from any room they were in
    rooms.forEach((room, roomCode) => {
      const playerIndex = room.players.findIndex(p => p.id === socket.id)
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1)
        io.to(roomCode).emit('player_left', { playerId: socket.id })
        
        // If host left, end the game
        if (room.host.id === socket.id) {
          io.to(roomCode).emit('game_ended', { reason: 'Host left the game' })
          rooms.delete(roomCode)
        }
      }
    })
  })

  socket.on('close_room', ({ roomCode }) => {
    const room = rooms.get(roomCode)
    if (room && room.host.id === socket.id) {
      // Notify all players in the room
      io.to(roomCode).emit('room_closed', { reason: 'Host ended the game' })
      rooms.delete(roomCode)
    }
  })

  // Add new event handlers
  socket.on('start_game', ({ roomCode }) => {
    const room = rooms.get(roomCode)
    if (room && room.host.id === socket.id) {
      room.gameState = 'prompt'
      io.to(roomCode).emit('game_started')
    }
  })

  socket.on('submit_prompt', ({ roomCode, prompt }) => {
    const room = rooms.get(roomCode)
    if (!room) return

    console.log(`Saving prompt for player ${socket.id}:`, prompt)
    room.prompts.set(socket.id, prompt)
    io.to(roomCode).emit('prompt_submitted', { playerId: socket.id })

    // Check if all players have submitted
    console.log('Prompts submitted:', room.prompts.size, 'of', room.players.length)
    if (room.prompts.size === room.players.length) {
      console.log('All prompts submitted, current prompts:', Array.from(room.prompts.values()))
      io.to(roomCode).emit('all_prompts_submitted')
    }
  })

  socket.on('start_answer_phase', ({ roomCode }) => {
    const room = rooms.get(roomCode)
    console.log('Starting answer phase for room:', roomCode)
    console.log('Room state:', {
      gameState: room?.gameState,
      promptsSize: room?.prompts.size,
      prompts: Array.from(room?.prompts?.values() || [])
    })
    
    if (!room) {
      console.log('Room not found:', roomCode)
      return
    }

    if (room.host.id !== socket.id) {
      console.log('Non-host tried to start answer phase')
      return
    }

    room.gameState = 'answer'
    const prompts = Array.from(room.prompts.values())
    console.log('Sending prompts to clients:', prompts)
    
    if (prompts.length === 0) {
      console.log('Warning: No prompts available!')
      return
    }
    
    // Emit to the entire room including the host
    io.to(roomCode).emit('answer_phase_started', { prompts })
  })

  socket.on('submit_answer', ({ roomCode, promptIndex, answer }) => {
    const room = rooms.get(roomCode)
    if (!room) return

    console.log(`Saving answer for prompt ${promptIndex} from player ${socket.id}:`, answer)

    if (!room.answers.has(promptIndex)) {
      room.answers.set(promptIndex, new Map())
    }
    const promptAnswers = room.answers.get(promptIndex)!
    promptAnswers.set(socket.id, answer)

    console.log(`Current answers for prompt ${promptIndex}:`, 
      Array.from(promptAnswers.entries()))

    io.to(roomCode).emit('answer_submitted', { playerId: socket.id })

    // Check if all players have answered
    if (promptAnswers.size === room.players.length) {
      io.to(roomCode).emit('all_answers_submitted')
    }
  })

  socket.on('submit_guesses', ({ roomCode, promptIndex, guesses }) => {
    const room = rooms.get(roomCode)
    if (!room) return

    // Store guesses
    if (!room.guesses.has(promptIndex)) {
      room.guesses.set(promptIndex, new Map())
    }
    room.guesses.get(promptIndex)!.set(socket.id, guesses)

    io.to(roomCode).emit('guess_submitted', { playerId: socket.id })

    // Check if all players have submitted guesses
    const promptGuesses = room.guesses.get(promptIndex)!
    if (promptGuesses.size === room.players.length) {
      // Calculate scores for this round
      const promptAnswers = room.answers.get(promptIndex)!
      promptGuesses.forEach((playerGuesses, guessingPlayerId) => {
        let correctGuesses = 0
        Object.entries(playerGuesses).forEach(([answerIndex, guessedPlayerId]) => {
          const actualAuthorId = Array.from(promptAnswers.keys())[Number(answerIndex)]
          if (guessedPlayerId === actualAuthorId) {
            correctGuesses++
            // Award points (1 point per correct guess)
            const currentScore = room.scores.get(guessingPlayerId) || 0
            room.scores.set(guessingPlayerId, currentScore + 1)
          }
        })
      })

      // Send reveal data including scores
      io.to(roomCode).emit('reveal_answers', {
        promptIndex,
        answers: Array.from(promptAnswers.entries()).map(([playerId, text]) => ({
          playerId,
          text,
          authorName: room.players.find(p => p.id === playerId)?.name,
          authorEmoji: room.players.find(p => p.id === playerId)?.emoji
        })),
        guesses: Array.from(promptGuesses.entries()),
        scores: Array.from(room.scores.entries()).map(([playerId, score]) => ({
          playerId,
          playerName: room.players.find(p => p.id === playerId)?.name,
          playerEmoji: room.players.find(p => p.id === playerId)?.emoji,
          score
        }))
      })
    }
  })

  socket.on('next_prompt', ({ roomCode, promptIndex }) => {
    const room = rooms.get(roomCode)
    if (!room || room.host.id !== socket.id) return

    // Send next prompt's answers
    const nextAnswers = room.answers.get(promptIndex)
    if (nextAnswers) {
      const answers = Array.from(nextAnswers.entries()).map(([playerId, text]) => ({
        playerId,
        text
      }))
      io.to(roomCode).emit('next_prompt_started', { 
        promptIndex,
        answers
      })
    }
  })

  socket.on('start_guess_phase', ({ roomCode }) => {
    const room = rooms.get(roomCode)
    console.log('Starting guess phase for room:', roomCode)
    
    if (room && room.host.id === socket.id) {
      room.gameState = 'guess'
      
      // Format the data for the client
      const promptsArray = Array.from(room.prompts.values())
      
      // Restructure answers data
      const answersArray = []
      for (let i = 0; i < promptsArray.length; i++) {
        const promptAnswers = room.answers.get(i)
        if (promptAnswers) {
          answersArray.push({
            promptIndex: i,
            answers: Array.from(promptAnswers.entries()).map(([playerId, text]) => ({
              playerId,
              text
            }))
          })
        }
      }

      console.log('Debug - Room state:', {
        prompts: promptsArray,
        answers: answersArray,
        answersMap: room.answers
      })

      io.to(roomCode).emit('guess_phase_started', {
        prompts: promptsArray,
        answers: answersArray
      })
    }
  })

  socket.on('start_reveal_phase', ({ roomCode }) => {
    const room = rooms.get(roomCode)
    console.log('Starting reveal phase for room:', roomCode)
    
    if (room && room.host.id === socket.id) {
      room.gameState = 'reveal'
      
      // Format the data for the client
      const promptsArray = Array.from(room.prompts.values())
      const answersArray = []
      for (let i = 0; i < promptsArray.length; i++) {
        const promptAnswers = room.answers.get(i)
        if (promptAnswers) {
          answersArray.push({
            promptIndex: i,
            answers: Array.from(promptAnswers.entries()).map(([playerId, text]) => ({
              playerId,
              text,
              authorName: room.players.find(p => p.id === playerId)?.name,
              authorEmoji: room.players.find(p => p.id === playerId)?.emoji
            }))
          })
        }
      }

      io.to(roomCode).emit('reveal_phase_started', {
        prompts: promptsArray,
        answers: answersArray
      })
    }
  })

  socket.on('reset_game', ({ roomCode }) => {
    const room = rooms.get(roomCode)
    if (room && room.host.id === socket.id) {
      // Reset the room state but keep the players
      room.gameState = 'lobby'
      room.prompts = new Map()
      room.answers = new Map()
      room.guesses = new Map()
      room.scores = new Map()
      room.players.forEach(player => {
        room.scores.set(player.id, 0)
      })
      
      // Notify all players to return to lobby
      io.to(roomCode).emit('game_reset')
    }
  })
})

// Utils
app.get('/health', (_, res) => {
  res.json({ status: 'ok' })
})

const PORT = process.env.PORT || 3000
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
}) 