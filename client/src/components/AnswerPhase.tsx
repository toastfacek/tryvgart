import React, { useState, useEffect } from 'react'
import { socket } from '../utils/socket'
import { Player } from '../types/game'
import LoadingSpinner from './LoadingSpinner'

interface AnswerPhaseProps {
  roomCode: string
  players: Player[]
  isHost: boolean
  currentPrompt: string
}

const AnswerPhase: React.FC<AnswerPhaseProps> = ({ roomCode, players, isHost, currentPrompt }) => {
  const [answer, setAnswer] = useState('')
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [submittedPlayers, setSubmittedPlayers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault()
    if (!answer.trim()) return

    setIsLoading(true)
    socket.emit('submit_answer', {
      roomCode,
      answer: answer.trim()
    })
  }

  useEffect(() => {
    const events = ['player_submitted_answer']

    socket.on('player_submitted_answer', (data: { playerId: string }) => {
      console.log('AnswerPhase: Player submitted answer:', data.playerId)
      if (data.playerId === socket.id) {
        setHasSubmitted(true)
        setIsLoading(false)
      }
      setSubmittedPlayers(prev => [...prev, data.playerId])
    })

    // Debug logging for component mount
    console.log('AnswerPhase: Component mounted with players:', players)

    return () => {
      console.log('AnswerPhase: Component unmounting')
      events.forEach(event => socket.off(event))
    }
  }, [])

  // Debug logging for state changes
  useEffect(() => {
    console.log('AnswerPhase: Submitted players updated:', submittedPlayers)
    console.log('AnswerPhase: Total players:', players.length)
    
    // Additional debug logging for when all players have submitted
    if (submittedPlayers.length === players.length) {
      console.log('AnswerPhase: All players have submitted their answers')
    }
  }, [submittedPlayers, players])

  return (
    <div className="page-container min-h-screen flex items-center justify-center">
      <div className="w-[500px] flex flex-col items-center space-y-6">
        {/* Prompt Section */}
        <div className="w-full bg-purple-900/30 p-6 rounded-xl border-2 border-purple-500/50 
                       shadow-[0_0_15px_rgba(147,51,234,0.3)]">
          <h2 className="game-title text-2xl text-center mb-4">Current Question</h2>
          <p className="text-xl text-center text-white/90">{currentPrompt}</p>
        </div>

        {/* Answer Form */}
        {!hasSubmitted ? (
          <form onSubmit={handleSubmitAnswer} className="w-full">
            <div className="bg-purple-900/30 p-6 rounded-xl border-2 border-purple-500/50 
                          shadow-[0_0_15px_rgba(147,51,234,0.3)]">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full h-32 p-4 bg-purple-900/30 rounded-lg border-2 border-purple-500/50
                         text-white placeholder-purple-400 focus:outline-none focus:border-fuchsia-500
                         transition-all duration-300 resize-none mb-4
                         shadow-[0_0_10px_rgba(147,51,234,0.2)]"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !answer.trim()}
                className="button w-full py-3 rounded-lg disabled:opacity-50 
                         disabled:cursor-not-allowed transition-all duration-300
                         shadow-[0_0_15px_rgba(219,39,119,0.3)]"
              >
                {isLoading ? <LoadingSpinner /> : 'SUBMIT ANSWER'}
              </button>
            </div>
          </form>
        ) : (
          <div className="w-full bg-purple-900/30 p-6 rounded-xl border-2 
                         border-purple-500/50 shadow-[0_0_15px_rgba(147,51,234,0.3)]">
            <h3 className="gradient-text text-xl mb-2 text-center">Answer Submitted!</h3>
            <p className="text-purple-300 text-center">Waiting for other players...</p>
          </div>
        )}

        {/* Players Status */}
        <div className="w-full bg-purple-900/30 p-6 rounded-xl border-2 border-purple-500/50 
                       shadow-[0_0_15px_rgba(147,51,234,0.3)]">
          <h3 className="game-title text-xl text-center mb-4">Players Status</h3>
          <div className="grid grid-cols-1 gap-2">
            {players.map(player => (
              <div 
                key={player.id}
                className={`flex items-center justify-between px-4 py-2 rounded-lg
                          transition-all duration-300 ${
                  submittedPlayers.includes(player.id)
                    ? 'bg-green-900/20 border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.2)]'
                    : 'bg-purple-900/20 border-purple-500/50 shadow-[0_0_10px_rgba(147,51,234,0.2)]'
                } border-2`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{player.emoji}</span>
                  <span className="gradient-text">{player.name}</span>
                </div>
                <span>
                  {submittedPlayers.includes(player.id) 
                    ? <span className="text-green-400 text-xl">✓</span>
                    : <span className="text-purple-400">...</span>
                  }
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnswerPhase 