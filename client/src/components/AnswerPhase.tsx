import React, { useState, useEffect } from 'react'
import { socket } from '../utils/socket'

interface Player {
  id: string
  name: string
  emoji: string
}

interface AnswerPhaseProps {
  roomCode: string
  players: Player[]
  isHost: boolean
}

const AnswerPhase: React.FC<AnswerPhaseProps> = ({ roomCode, players, isHost }) => {
  const [prompts, setPrompts] = useState<string[]>([])
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [answeredPlayers, setAnsweredPlayers] = useState<string[]>([])

  useEffect(() => {
    // Remove any existing listeners first
    socket.off('answer_phase_started')
    socket.off('answer_submitted')
    socket.off('all_answers_submitted')

    socket.on('answer_phase_started', (data) => {
      console.log('Answer phase started with data:', data)
      if (Array.isArray(data.prompts)) {
        setPrompts(data.prompts)
      } else {
        console.error('Received invalid prompts data:', data)
      }
    })

    // Re-emit to get prompts in case we missed the initial event
    if (isHost) {
      console.log('Re-requesting answer phase start')
      socket.emit('start_answer_phase', { roomCode })
    }

    socket.on('answer_submitted', ({ playerId }) => {
      console.log('Answer submitted by:', playerId)
      setAnsweredPlayers(prev => [...prev, playerId])
    })

    socket.on('all_answers_submitted', () => {
      console.log('All answers submitted for current prompt')
    })

    return () => {
      socket.off('answer_phase_started')
      socket.off('answer_submitted')
      socket.off('all_answers_submitted')
    }
  }, [roomCode, isHost])

  useEffect(() => {
    console.log('Current prompts:', prompts)
    console.log('Current prompt index:', currentPromptIndex)
  }, [prompts, currentPromptIndex])

  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault()
    socket.emit('submit_answer', { 
      roomCode, 
      promptIndex: currentPromptIndex,
      answer 
    })
    setSubmitted(true)
    setAnswer('')
  }

  if (!prompts.length) {
    console.log('No prompts available yet')
    return <div>Loading prompts...</div>
  }

  return (
    <div className="container">
      {/* Temporary debug section */}
      {prompts.length === 0 && (
        <div className="debug-info">
          <div className="room-code">Room: {roomCode}</div>
          {isHost && (
            <button 
              className="button secondary small"
              onClick={() => socket.emit('start_answer_phase', { roomCode })}
            >
              Reload
            </button>
          )}
        </div>
      )}

      <div className="progress-bar">
        Question {currentPromptIndex + 1} of {prompts.length}
      </div>

      <div className="prompt-display">
        <h2>Question:</h2>
        <p className="prompt-text">{prompts[currentPromptIndex]}</p>
      </div>

      {!submitted ? (
        <form onSubmit={handleSubmitAnswer}>
          <div className="form-group">
            <label htmlFor="answer">Your Answer:</label>
            <textarea
              id="answer"
              className="answer-input"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer..."
              required
              maxLength={200}
              rows={3}
            />
            <div className="char-count">
              {answer.length}/200
            </div>
          </div>
          <button type="submit" className="button">
            Submit Answer
          </button>
        </form>
      ) : (
        <div className="waiting-message">
          Waiting for other players to answer...
        </div>
      )}

      <div className="submission-status">
        <h3>Players Answered</h3>
        {players.map(player => (
          <div 
            key={player.id} 
            className={`player-item ${answeredPlayers.includes(player.id) ? 'submitted' : ''}`}
          >
            <span className="player-emoji">{player.emoji}</span>
            <span className="player-name">{player.name}</span>
            {answeredPlayers.includes(player.id) && (
              <span className="status-icon">✓</span>
            )}
          </div>
        ))}
      </div>

      {isHost && answeredPlayers.length === players.length && (
        <button 
          className="button"
          onClick={() => {
            if (currentPromptIndex === prompts.length - 1) {
              socket.emit('start_guess_phase', { roomCode })
            } else {
              socket.emit('next_prompt', { roomCode })
            }
          }}
        >
          {currentPromptIndex === prompts.length - 1 
            ? "Everyone's Done - Start Guessing Phase" 
            : "Everyone's Done - Next Question"}
        </button>
      )}
    </div>
  )
}

export default AnswerPhase 