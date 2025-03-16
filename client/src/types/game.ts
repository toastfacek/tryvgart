export interface Player {
  id: string
  name: string
  emoji: string
}

export type GamePhase = 'lobby' | 'prompt' | 'answer' | 'guess' | 'reveal' | 'end'

export interface Room {
  code: string
  host: Player
  players: Player[]
  gameState: GamePhase
  prompts: string[]  // Array of prompts in order
  answers: Map<number, Map<string, string>>  // promptIndex -> (playerId -> answer)
  guesses: Map<number, Map<string, Record<string, string>>>  // promptIndex -> playerId -> (answerPlayerId -> guessedPlayerId)
  scores: Map<string, number>  // playerId -> score
  currentPromptIndex: number
}

export interface Answer {
  playerId: string
  text: string
  authorName: string
  authorEmoji: string
}

export interface GuessPhaseData {
  prompts: string[]
  answers: Array<{
    promptIndex: number
    answers: Answer[]
  }>
  currentPromptIndex: number
}

export interface RevealData {
  promptIndex: number
  prompts: string[]
  answers: Answer[]
  guesses: Array<[string, Record<string, string>]>  // [playerId, guesses]
  scores: Array<{
    playerId: string
    playerName: string
    playerEmoji: string
    score: number
  }>
}

export interface GameState {
  roomCode: string
  isHost: boolean
  room?: Room
}

export interface AnswerSubmittedPayload {
  playerId: string
}

export interface GuessSubmittedPayload {
  playerId: string
}

export interface Score {
  playerId: string
  playerName: string
  playerEmoji: string
  score: number
}

// Event payload interfaces
export interface RoomCreatedPayload {
  roomCode: string
  room: Room
}

export interface ErrorPayload {
  message: string
}

export interface PlayerEventPayload {
  player: Player
}

export interface PromptSubmittedPayload {
  playerId: string
}

export interface AnswerPhaseStartedPayload {
  prompts: string[]
}

export interface NextPromptPayload {
  promptIndex: number
}

export interface ScoreUpdatePayload {
  scores: Array<{
    player: Player
    score: number
  }>
  verified: boolean
} 