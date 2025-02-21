export interface Player {
  id: string
  name: string
  emoji: string
}

export interface Answer {
  playerId: string
  text: string
  authorName: string
  authorEmoji: string
}

export interface GuessAnswer {
  playerId: string
  text: string
}

export interface Score {
  playerId: string
  playerName: string
  playerEmoji: string
  score: number
} 