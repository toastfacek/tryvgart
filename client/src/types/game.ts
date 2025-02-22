export interface Player {
  id: string
  name: string
  emoji: string
}

export interface Room {
  code: string
  host: Player
  players: Player[]
  gameState: GamePhase
  prompts: Map<string, string>  // playerId -> prompt
  answers: Map<number, Map<string, string>>  // promptIndex -> (playerId -> answer)
  guesses: Map<number, Map<string, Record<number, string>>>  // promptIndex -> playerId -> guesses
  scores: Map<string, number>  // playerId -> score
}

export type GamePhase = 'lobby' | 'prompt' | 'answer' | 'guess' | 'reveal' | 'end'

export interface GameState {
  roomCode: string
  isHost: boolean
  room?: Room
}

export interface Answer {
  playerId: string
  text: string
  authorName?: string
  authorEmoji?: string
}

export interface GuessPhaseData {
  prompts: string[]
  answers: Array<{
    promptIndex: number
    answers: Answer[]
  }>
}

export interface RevealData {
  promptIndex: number
  prompts: string[]
  answers: Array<{
    playerId: string
    text: string
    authorName?: string
    authorEmoji?: string
  }>
  guesses: Array<[string, Record<string, string>]>  // [playerId, guesses]
  scores: Array<{
    playerId: string
    playerName?: string
    playerEmoji?: string
    score: number
  }>
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

export interface AnswerSubmittedPayload {
  playerId: string
}

export interface GuessSubmittedPayload {
  playerId: string
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