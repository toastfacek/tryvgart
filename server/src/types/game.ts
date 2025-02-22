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

export interface GuessPhaseData {
  prompts: string[]
  answers: Array<{
    promptIndex: number
    answers: Array<{
      playerId: string
      text: string
      authorName?: string
      authorEmoji?: string
    }>
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

export interface Answer {
  playerId: string
  text: string
  authorName?: string
  authorEmoji?: string
} 