import React, { useState } from 'react'
import { socket } from '../utils/socket'
import { Answer } from '../types/game'
import { Player } from '../types/game'
import RevealInterface from './RevealInterface'

interface GuessRevealPhaseProps {
  roomCode: string
  players: Player[]
  isHost: boolean
}

const GuessRevealPhase: React.FC<GuessRevealPhaseProps> = ({ roomCode, players, isHost }) => {
  const [prompts, setPrompts] = useState<string[]>([])
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [guesses, setGuesses] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submittedPlayers, setSubmittedPlayers] = useState<string[]>([])
  const [revealed, setRevealed] = useState(false)

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    socket.emit('submit_guesses', { roomCode, guesses })
    setSubmitted(true)
  }

  const handlePlayerSelect = (answerIndex: number, playerId: string) => {
    setGuesses(prev => ({
      ...prev,
      [answerIndex]: playerId
    }))
  }

  const handleNextPrompt = () => {
    socket.emit('next_prompt', { roomCode })
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

      {!revealed ? (
        <div>
          <button onClick={handleNextPrompt}>
            Next Prompt
          </button>
        </div>
      ) : (
        <RevealInterface
          answers={answers}
          guesses={guesses}
          players={players}
          scores={[]}
          isLastPrompt={false}
          isHost={isHost}
          roomCode={roomCode}
        />
      )}

      {isHost && revealed && currentPromptIndex < prompts.length - 1 && (
        <button 
          className="button"
          onClick={handleNextPrompt}
        >
          Next Question
        </button>
      )}

      {isHost && revealed && currentPromptIndex === prompts.length - 1 && (
        <button 
          className="button"
          onClick={() => socket.emit('end_game', { roomCode })}
        >
          End Game
        </button>
      )}
    </div>
  )
}

export default GuessRevealPhase 