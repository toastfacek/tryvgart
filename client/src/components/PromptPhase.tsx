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

const PromptPhase: React.FC<PromptPhaseProps> = ({ roomCode, players, isHost }) => {
  const [prompt, setPrompt] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submittedPlayers, setSubmittedPlayers] = useState<string[]>([])

  const handleSubmitPrompt = (e: React.FormEvent) => {
    e.preventDefault()
    socket.emit('submit_prompt', { roomCode, prompt })
    setSubmitted(true)
  }

  // Listen for other players' submissions
  useEffect(() => {
    socket.on('prompt_submitted', ({ playerId }) => {
      console.log('Prompt submitted by:', playerId)
      setSubmittedPlayers(prev => [...prev, playerId])
    })

    socket.on('all_prompts_submitted', () => {
      console.log('All prompts submitted')
    })

    return () => {
      socket.off('prompt_submitted')
      socket.off('all_prompts_submitted')
    }
  }, [])

  return (
    <div className="container">
      <h2>Submit Your Question</h2>
      {!submitted ? (
        <form onSubmit={handleSubmitPrompt}>
          <div className="form-group">
            <label htmlFor="prompt">Your Question:</label>
            <textarea
              id="prompt"
              className="prompt-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter a fun question for others to answer..."
              required
              maxLength={200}
              rows={3}
            />
            <div className="char-count">
              {prompt.length}/200
            </div>
          </div>
          <button type="submit" className="button">
            Submit Question
          </button>
        </form>
      ) : (
        <div className="waiting-message">
          Waiting for other players...
        </div>
      )}

      <div className="submission-status">
        <h3>Players Ready</h3>
        {players.map(player => (
          <div 
            key={player.id} 
            className={`player-item ${submittedPlayers.includes(player.id) ? 'submitted' : ''}`}
          >
            <span className="player-emoji">{player.emoji}</span>
            <span className="player-name">{player.name}</span>
            {submittedPlayers.includes(player.id) && (
              <span className="status-icon">✓</span>
            )}
          </div>
        ))}
      </div>

      {isHost && submittedPlayers.length === players.length && (
        <button 
          className="button"
          onClick={() => socket.emit('start_answer_phase', { roomCode })}
        >
          Everyone's Ready - Start Answer Phase
        </button>
      )}
    </div>
  )
}

export default PromptPhase 