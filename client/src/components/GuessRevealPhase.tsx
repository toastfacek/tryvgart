import React, { useState } from 'react'
import io from '../services/socket'
import { Answer } from '../types/Answer'
import { Player } from '../types/Player'
import GuessingInterface from './GuessingInterface'
import RevealInterface from './RevealInterface'

interface Props {
  roomCode: string
  players: Player[]
  isHost: boolean
}

const GuessRevealPhase: React.FC<Props> = ({ roomCode, players, isHost }) => {
  const [prompts, setPrompts] = useState<string[]>([])
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [guesses, setGuesses] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submittedPlayers, setSubmittedPlayers] = useState<string[]>([])
  const [revealed, setRevealed] = useState(false)

  // ... socket listeners and handlers ...

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
        // Show guessing interface
        <GuessingInterface 
          answers={answers}
          players={players}
          guesses={guesses}
          onGuessSubmit={handleGuessSubmit}
          onPlayerSelect={handlePlayerSelect}
          submitted={submitted}
        />
      ) : (
        // Show reveal interface
        <RevealInterface 
          answers={answers}
          guesses={guesses}
          players={players}
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