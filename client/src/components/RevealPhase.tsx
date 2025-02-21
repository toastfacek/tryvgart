import React, { useState, useEffect } from 'react'
import { socket } from '../utils/socket'

interface Player {
  id: string
  name: string
  emoji: string
}

interface Answer {
  playerId: string
  text: string
  authorName: string
  authorEmoji: string
}

interface RevealPhaseProps {
  roomCode: string
  players: Player[]
  isHost: boolean
}

const RevealPhase: React.FC<RevealPhaseProps> = ({ roomCode, players, isHost }) => {
  const [prompts, setPrompts] = useState<string[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0)

  useEffect(() => {
    socket.on('reveal_phase_started', (data) => {
      console.log('Reveal phase data:', data)
      setPrompts(data.prompts)
      const currentAnswers = data.answers.find(a => a.promptIndex === currentPromptIndex)
      if (currentAnswers) {
        setAnswers(currentAnswers.answers)
      }
    })

    return () => {
      socket.off('reveal_phase_started')
    }
  }, [currentPromptIndex])

  if (!prompts.length || !answers.length) {
    return <div>Loading results...</div>
  }

  return (
    <div className="container">
      <div className="progress-bar">
        Results for Question {currentPromptIndex + 1} of {prompts.length}
      </div>

      <div className="prompt-display">
        <h2>Question:</h2>
        <p className="prompt-text">{prompts[currentPromptIndex]}</p>
      </div>

      <div className="answers-list">
        {answers.map((answer, index) => (
          <div key={index} className="answer-card reveal">
            <div className="answer-author">
              <span className="author-emoji">{answer.authorEmoji}</span>
              <span className="author-name">{answer.authorName}</span>
            </div>
            <p className="answer-text">{answer.text}</p>
          </div>
        ))}
      </div>

      {isHost && currentPromptIndex < prompts.length - 1 && (
        <button 
          className="button"
          onClick={() => setCurrentPromptIndex(prev => prev + 1)}
        >
          Next Question
        </button>
      )}

      {isHost && currentPromptIndex === prompts.length - 1 && (
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

export default RevealPhase 