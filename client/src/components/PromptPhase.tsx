import React, { useState, useEffect } from 'react'
import { socket } from '../utils/socket'

interface Player {
  id: string
  name: string
  emoji: string
}

interface PromptPhaseProps {
  roomCode: string
  players: Player[]
  isHost: boolean
}

interface PromptSubmittedEvent {
  playerId: string;
}

const PromptPhase: React.FC<PromptPhaseProps> = ({ roomCode, players, isHost }) => {
  const [prompt, setPrompt] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submittedPlayers, setSubmittedPlayers] = useState<string[]>([])
  const [allPromptsSubmitted, setAllPromptsSubmitted] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const currentPlayer = players.find(p => p.id === socket.id)

  useEffect(() => {
    socket.on('prompt_submitted', ({ playerId }: PromptSubmittedEvent) => {
      console.log('Prompt submitted by:', playerId)
      setSubmittedPlayers(prev => [...prev, playerId])
    })

    socket.on('all_prompts_submitted', () => {
      console.log('All prompts submitted')
      setAllPromptsSubmitted(true)
    })

    return () => {
      socket.off('prompt_submitted')
      socket.off('all_prompts_submitted')
    }
  }, [])

  const handleSubmitPrompt = (e: React.FormEvent) => {
    e.preventDefault()
    socket.emit('submit_prompt', { roomCode, prompt })
    setSubmitted(true)
    if (currentPlayer) {
      setSubmittedPlayers(prev => [...prev, currentPlayer.id])
    }
  }

  const handleStartAnswerPhase = () => {
    if (!allPromptsSubmitted || isTransitioning) return
    console.log('Starting answer phase')
    setIsTransitioning(true)
    socket.emit('start_answer_phase', { roomCode })
  }

  const canProceed = isHost && allPromptsSubmitted && !isTransitioning

  return (
    <div className="page-container">
      <div className="content-container">
        <h1 className="section-title">Submit Your Question</h1>

        {!submitted ? (
          <form onSubmit={handleSubmitPrompt} className="form-container">
            <div className="translucent-container">
              <label htmlFor="prompt" className="input-label">
                Your Question:
              </label>
              <textarea
                id="prompt"
                className="text-input min-h-[100px] resize-none"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter a fun question for others to answer..."
                required
                maxLength={200}
                rows={3}
              />
              <div className="text-right text-sm text-white/70">
                {prompt.length}/200
              </div>
            </div>
            <button type="submit" className="button w-full">
              Submit Question
            </button>
          </form>
        ) : (
          <div className="translucent-container text-center text-lg text-secondary">
            {isTransitioning ? 'Moving to answer phase...' :
              allPromptsSubmitted ? 'All questions submitted!' : 'Waiting for other players...'}
          </div>
        )}

        <div className="mt-8">
          <h3 className="text-lg text-primary mb-4">Players Ready</h3>
          <div className="player-list">
            {players.map(player => (
              <div 
                key={player.id} 
                className={`translucent-container flex items-center justify-between ${
                  submittedPlayers.includes(player.id) 
                    ? 'bg-green-900/30 border-green-500/30' 
                    : ''
                }`}
              >
                <span className="text-2xl">{player.emoji}</span>
                <span className="flex-1">{player.name}</span>
                {submittedPlayers.includes(player.id) && (
                  <span className="text-green-400">✓</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {canProceed && (
          <div className="button-container">
            <button 
              className="button"
              onClick={handleStartAnswerPhase}
              disabled={isTransitioning}
            >
              Start Answer Phase
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default PromptPhase 