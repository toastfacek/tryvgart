import React from 'react'
import { Player } from '../types/game'

interface EndPhaseProps {
  scores: [Player, number][]
  isHost: boolean
  onPlayAgain: () => void
  onReturnHome: () => void
}

const EndPhase: React.FC<EndPhaseProps> = ({ scores, isHost, onPlayAgain, onReturnHome }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-8 gradient-text">Game Over!</h1>
      <div className="space-y-4">
        {scores.map(([player, score], index) => (
          <div key={player.id} className="flex items-center gap-4 text-xl">
            <span className="text-2xl">{index === 0 ? '👑' : ''} {player.emoji}</span>
            <span className="gradient-text">{player.name}</span>
            <span className="text-purple-400">Score: {score}</span>
          </div>
        ))}
      </div>
      {isHost && (
        <div className="flex gap-4 mt-8">
          <button 
            onClick={onPlayAgain}
            className="button bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold py-3 px-8 rounded-full transition-colors"
          >
            Play Again
          </button>
          <button 
            onClick={onReturnHome}
            className="button bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-8 rounded-full transition-colors"
          >
            Return Home
          </button>
        </div>
      )}
    </div>
  )
}

export default EndPhase 