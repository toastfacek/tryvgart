import React from 'react'
import { useNavigate } from 'react-router-dom'
import { socket } from '../utils/socket'
import { Player, Answer, Score } from '../types/game'

interface RevealInterfaceProps {
  answers: Answer[]
  guesses: Record<string, Record<number, string>> // playerId -> (answerIndex -> guessedPlayerId)
  players: Player[]
  scores: Score[]
  isLastPrompt: boolean
  isHost: boolean
  roomCode: string
}

const RevealInterface: React.FC<RevealInterfaceProps> = ({ 
  answers, 
  guesses, 
  players,
  scores,
  isLastPrompt,
  isHost,
  roomCode
}) => {
  const navigate = useNavigate()
  const winner = scores.reduce((highest, current) => 
    current.score > highest.score ? current : highest
  )

  const handlePlayAgain = () => {
    // Reset the room for a new game
    if (isHost) {
      socket.emit('reset_game', { roomCode })
    }
  }

  const handleReturnHome = () => {
    if (isHost) {
      socket.emit('close_room', { roomCode })
    }
    navigate('/')
  }

  const handleNextPrompt = () => {
    socket.emit('next_prompt', { roomCode })
  }

  const handleEndGame = () => {
    socket.emit('end_game', { roomCode })
    navigate('/')
  }

  return (
    <div className="reveal-container">
      <div className="answers-list">
        {answers.map((answer, index) => (
          <div key={index} className="answer-card reveal">
            <div className="answer-header">
              <div className="answer-author">
                <span className="author-emoji">{answer.authorEmoji}</span>
                <span className="author-name">{answer.authorName}</span>
              </div>
              <div className="answer-text">{answer.text}</div>
            </div>
            <div className="guesses-list">
              <h4>Who guessed correctly:</h4>
              {players.map(player => {
                const playerGuesses = guesses[player.id] || {}
                const guessedCorrectly = playerGuesses[index] === answer.playerId
                return (
                  <div 
                    key={player.id} 
                    className={`guess-item ${guessedCorrectly ? 'correct' : 'incorrect'}`}
                  >
                    <span className="player-emoji">{player.emoji}</span>
                    <span className="player-name">{player.name}</span>
                    <span className="guess-result">
                      {guessedCorrectly ? '✓' : '✗'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="scores-panel">
        <h3>Current Scores</h3>
        {scores
          .sort((a, b) => b.score - a.score)
          .map(score => (
            <div key={score.playerId} className="score-item">
              <span className="player-emoji">{score.playerEmoji}</span>
              <span className="player-name">{score.playerName}</span>
              <span className="score-value">{score.score}</span>
            </div>
          ))
        }
      </div>

      {isLastPrompt && (
        <div className="game-end-container">
          <h2 className="winner-announcement">
            🎉 Congratulations {winner.playerEmoji} {winner.playerName}! 🎉
          </h2>
          <p className="winner-score">Final Score: {winner.score} points</p>
          
          {isHost && (
            <div className="button-group">
              <button 
                className="button"
                onClick={handlePlayAgain}
              >
                Play Again
              </button>
              <button 
                className="button secondary"
                onClick={handleReturnHome}
              >
                Return to Home
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default RevealInterface 