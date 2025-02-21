import React, { useState, useEffect } from 'react'
import { socket } from '../utils/socket'
import RevealInterface from './RevealInterface'
import { Player, Answer, GuessAnswer, Score } from '../types/game'

interface GuessPhaseProps {
  roomCode: string
  players: Player[]
  isHost: boolean
}

const GuessPhase: React.FC<GuessPhaseProps> = ({ roomCode, players, isHost }) => {
  const [prompts, setPrompts] = useState<string[]>([])
  const [answers, setAnswers] = useState<GuessAnswer[]>([])
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0)
  const [guesses, setGuesses] = useState<Record<number, string>>({}) // answerIndex -> playerId
  const [submitted, setSubmitted] = useState(false)
  const [submittedPlayers, setSubmittedPlayers] = useState<string[]>([])
  // Add new state for reveal
  const [revealed, setRevealed] = useState(false)
  const [revealData, setRevealData] = useState<{
    answers: Answer[]
    guesses: Record<string, Record<number, string>>
    scores: Score[]
  } | null>(null)

  useEffect(() => {
    console.log('Setting up guess phase listeners')
    
    socket.on('guess_phase_started', (data) => {
      console.log('Received guess phase data:', data)
      if (!data.prompts || !data.answers) {
        console.error('Invalid data received:', data)
        return
      }

      setPrompts(data.prompts)
      const currentAnswers = data.answers.find(a => a.promptIndex === currentPromptIndex)
      if (currentAnswers) {
        setAnswers(currentAnswers.answers as GuessAnswer[])
      }
    })

    socket.on('reveal_answers', (data) => {
      console.log('Received reveal data:', data)
      setRevealed(true)
      setRevealData({
        answers: data.answers as Answer[],
        guesses: data.guesses.reduce((acc, [playerId, guesses]) => {
          acc[playerId] = guesses
          return acc
        }, {} as Record<string, Record<number, string>>),
        scores: data.scores
      })
    })

    // Re-request data if we don't have it
    if (prompts.length === 0 && isHost) {
      console.log('No prompts loaded, requesting guess phase start')
      socket.emit('start_guess_phase', { roomCode })
    }

    socket.on('guess_submitted', ({ playerId }) => {
      setSubmittedPlayers(prev => [...prev, playerId])
    })

    socket.on('next_prompt_guessing', () => {
      setCurrentPromptIndex(prev => prev + 1)
      setGuesses({})
      setSubmitted(false)
      setSubmittedPlayers([])
    })

    socket.on('all_guesses_submitted', () => {
      console.log('All guesses submitted')
      // If host, show the "next" button
      // This will be handled by the existing UI since submittedPlayers will include everyone
      setSubmittedPlayers(players.map(p => p.id))
    })

    return () => {
      socket.off('guess_phase_started')
      socket.off('reveal_answers')
      socket.off('guess_submitted')
      socket.off('next_prompt_guessing')
      socket.off('all_guesses_submitted')
    }
  }, [currentPromptIndex])

  // Add new effect to handle prompt changes
  useEffect(() => {
    socket.on('next_prompt_started', (data) => {
      const currentAnswers = data.answers.find(a => a.promptIndex === currentPromptIndex)
      if (currentAnswers) {
        setAnswers(currentAnswers.answers as GuessAnswer[])
        setGuesses({})
        setSubmitted(false)
        setSubmittedPlayers([])
      }
    })

    return () => {
      socket.off('next_prompt_started')
    }
  }, [currentPromptIndex])

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Submitting guesses:', guesses)
    socket.emit('submit_guesses', { roomCode, promptIndex: currentPromptIndex, guesses })
    setSubmitted(true)
  }

  const handlePlayerSelect = (answerIndex: number, playerId: string) => {
    setGuesses(prev => ({
      ...prev,
      [answerIndex]: playerId
    }))
  }

  if (revealed && revealData) {
    console.log('Rendering reveal interface with data:', {
      revealed,
      revealData,
      prompts,
      currentPromptIndex
    })
    
    return (
      <div className="container">
        <div className="progress-bar">
          Question {currentPromptIndex + 1} of {prompts.length}
        </div>

        <div className="prompt-display">
          <h2>Question:</h2>
          <p className="prompt-text">{prompts[currentPromptIndex]}</p>
        </div>

        <RevealInterface
          answers={revealData.answers}
          guesses={revealData.guesses}
          players={players}
          scores={revealData.scores}
          isLastPrompt={currentPromptIndex === prompts.length - 1}
          isHost={isHost}
          roomCode={roomCode}
        />

        {isHost && currentPromptIndex < prompts.length - 1 && (
          <button 
            className="button"
            onClick={() => {
              socket.emit('next_prompt', { 
                roomCode, 
                promptIndex: currentPromptIndex + 1 
              })
              setCurrentPromptIndex(prev => prev + 1)
              setRevealed(false)
              setRevealData(null)
              setGuesses({})
              setSubmitted(false)
              setSubmittedPlayers([])
            }}
          >
            Next Question
          </button>
        )}
      </div>
    )
  }

  if (!prompts.length || !answers.length) {
    return (
      <div className="container">
        <h2>Loading answers...</h2>
        <div className="debug-info" style={{ textAlign: 'left', padding: '1rem', background: '#f0f0f0' }}>
          <h3>Debug Info:</h3>
          <pre>
            {JSON.stringify({
              roomCode,
              isHost,
              playersCount: players.length,
              promptsCount: prompts.length,
              answersCount: answers.length,
              currentPromptIndex
            }, null, 2)}
          </pre>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="progress-bar">
        Question {currentPromptIndex + 1} of {prompts.length}
      </div>

      <div className="prompt-display">
        <h2>Question:</h2>
        <p className="prompt-text">{prompts[currentPromptIndex]}</p>
      </div>

      {!submitted ? (
        <form onSubmit={handleGuessSubmit}>
          <div className="answers-list">
            {answers.map((answer, index) => (
              <div key={index} className="answer-card">
                <p className="answer-text">{answer.text}</p>
                <select
                  value={guesses[index] || ''}
                  onChange={(e) => handlePlayerSelect(index, e.target.value)}
                  required
                  className="player-select"
                >
                  <option value="">Who wrote this?</option>
                  {players.map(player => (
                    <option 
                      key={player.id} 
                      value={player.id}
                      disabled={Object.values(guesses).includes(player.id)}
                    >
                      {player.emoji} {player.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <button 
            type="submit" 
            className="button"
            disabled={Object.keys(guesses).length !== answers.length}
          >
            Submit Guesses
          </button>
        </form>
      ) : (
        <div className="waiting-message">
          Waiting for other players to submit their guesses...
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
          onClick={() => {
            if (currentPromptIndex === prompts.length - 1) {
              socket.emit('start_reveal_phase', { roomCode })
            } else {
              socket.emit('next_prompt_guessing', { roomCode })
            }
          }}
        >
          {currentPromptIndex === prompts.length - 1 
            ? "Everyone's Done - Show Results" 
            : "Everyone's Done - Next Question"}
        </button>
      )}
    </div>
  )
}

export default GuessPhase 