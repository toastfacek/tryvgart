import React, { useState, useEffect } from 'react'
import { socket } from '../utils/socket'
import { useNavigate } from 'react-router-dom'
import { Player, Answer, RevealData } from '../types/game'

interface RevealPhaseProps {
  roomCode: string
  players: Player[]
  isHost: boolean
  onNextPrompt: () => void
  revealData: RevealData
}

const RevealPhase: React.FC<RevealPhaseProps> = ({ roomCode, players, isHost, onNextPrompt, revealData }) => {
  const [prompts, setPrompts] = useState<string[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0)
  const [guesses, setGuesses] = useState<Record<string, Record<number, string>>>({})
  const [scores, setScores] = useState<[Player, number][]>([])
  const [isLastPrompt, setIsLastPrompt] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    console.log('RevealPhase: Processing reveal data:', revealData)
    if (!revealData) {
      console.error('RevealPhase: Invalid reveal data:', revealData)
      return
    }

    const { answers, scores, guesses, prompts, promptIndex } = revealData
    console.log('RevealPhase: Destructured data:', {
      answers,
      scores,
      guesses,
      prompts,
      promptIndex
    })

    // Update states with proper error checking
    if (Array.isArray(answers) && answers.length > 0) {
      console.log('RevealPhase: Setting answers:', answers)
      setAnswers(answers)
    } else {
      console.error('RevealPhase: Invalid or empty answers:', answers)
    }

    if (Array.isArray(prompts) && prompts.length > 0) {
      console.log('RevealPhase: Setting prompts:', prompts)
      setPrompts(prompts)
    } else {
      console.error('RevealPhase: Invalid or empty prompts:', prompts)
    }

    if (typeof promptIndex === 'number' && promptIndex >= 0) {
      console.log('RevealPhase: Setting current prompt index:', promptIndex)
      setCurrentPromptIndex(promptIndex)
    } else {
      console.error('RevealPhase: Invalid promptIndex:', promptIndex)
    }

    if (Array.isArray(scores)) {
      console.log('RevealPhase: Processing scores:', scores)
      const processedScores = scores.map(score => {
        const player = {
          id: score.playerId,
          name: score.playerName || '',
          emoji: score.playerEmoji || ''
        }
        return [player, score.score] as [Player, number]
      })
      console.log('RevealPhase: Setting processed scores:', processedScores)
      setScores(processedScores)
    } else {
      console.error('RevealPhase: Invalid scores format:', scores)
    }

    // Update last prompt status
    const isLast = promptIndex === (prompts?.length || 0) - 1
    console.log('RevealPhase: Setting isLastPrompt:', isLast, {
      promptIndex,
      promptsLength: prompts?.length
    })
    setIsLastPrompt(isLast)

    if (Array.isArray(guesses)) {
      console.log('RevealPhase: Processing guesses:', guesses)
      const guessesObject = Object.fromEntries(guesses.map(([playerId, playerGuesses]) => {
        // Convert the guesses object to use answer indices
        const indexedGuesses: Record<number, string> = {}
        Object.entries(playerGuesses).forEach(([answerId, guessedId]) => {
          // Find the index of the answer with this ID
          const answerIndex = answers.findIndex(a => a.playerId === answerId)
          if (answerIndex !== -1) {
            indexedGuesses[answerIndex] = guessedId
          }
        })
        return [playerId, indexedGuesses]
      }))
      console.log('RevealPhase: Setting processed guesses:', guessesObject)
      setGuesses(guessesObject)

      // Log final state for debugging
      console.log('RevealPhase: Final state after updates:', {
        currentPromptIndex: promptIndex,
        currentPrompt: prompts?.[promptIndex],
        answersCount: answers?.length,
        guessesCount: Object.keys(guessesObject).length,
        scoresCount: scores?.length,
        isLastPrompt: isLast,
        processedGuesses: guessesObject
      })
    } else {
      console.error('RevealPhase: Invalid guesses format:', guesses)
      // Log final state even if guesses are invalid
      console.log('RevealPhase: Final state after updates:', {
        currentPromptIndex: promptIndex,
        currentPrompt: prompts?.[promptIndex],
        answersCount: answers?.length,
        guessesCount: 0,
        scoresCount: scores?.length,
        isLastPrompt: isLast
      })
    }
  }, [revealData])

  const handleNextPrompt = () => {
    console.log('Handling next prompt:', {
      roomCode,
      currentPromptIndex
    })
    socket.emit('next_prompt', { 
      roomCode,
      promptIndex: currentPromptIndex + 1 
    })
  }

  const handlePlayAgain = () => {
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

  // Helper function to determine if a player guessed correctly
  const getPlayerGuessResult = (playerId: string) => {
    if (!guesses[playerId]) return null
    
    const playerGuess = guesses[playerId][currentPromptIndex]
    const correctAuthorId = answers[0]?.playerId
    
    return {
      guessedCorrectly: playerGuess === correctAuthorId,
      guessedPlayerId: playerGuess
    }
  }

  return (
    <div className="page-container min-h-screen flex items-center justify-center">
      <div className="w-[800px] flex flex-col items-center space-y-8">
        {/* Current Prompt */}
        <div className="w-full bg-purple-900/30 p-6 rounded-xl border-2 border-purple-500/50">
          <h2 className="game-title text-2xl text-center mb-4">Question</h2>
          <p className="text-xl text-center gradient-text">{prompts[currentPromptIndex]}</p>
        </div>

        {/* Answers and Guesses */}
        <div className="w-full space-y-6">
          {answers.map((answer, index) => (
            <div 
              key={answer.playerId}
              className="bg-purple-900/30 p-6 rounded-xl border-2 border-purple-500/50"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2 bg-fuchsia-900/30 px-4 py-2 rounded-lg border border-fuchsia-500/50">
                  <span className="text-2xl">{answer.authorEmoji}</span>
                  <span className="gradient-text text-xl">{answer.authorName}</span>
                  <span className="text-fuchsia-400 font-medium">wrote:</span>
                </div>
              </div>
              <p className="text-lg text-white/90 mb-6 bg-purple-900/20 p-4 rounded-lg border border-purple-500/30 font-medium">
                "{answer.text}"
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-fuchsia-400">Player Guesses</h3>
                  <div className="flex-1 border-b border-purple-500/30"></div>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {players.map(player => {
                    const playerGuesses = guesses[player.id]
                    const guessedId = playerGuesses?.[index]
                    const guessedCorrectly = guessedId === answer.playerId
                    const guessedPlayer = players.find(p => p.id === guessedId)
                    
                    return (
                      <div 
                        key={player.id}
                        className={`flex items-center gap-4 p-3 rounded-lg ${
                          guessedCorrectly 
                            ? 'bg-green-900/20 border-green-500/50' 
                            : 'bg-purple-900/20 border-purple-500/50'
                        } border transition-colors duration-200`}
                      >
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <span className="text-xl">{player.emoji}</span>
                          <span className="gradient-text font-medium">{player.name}</span>
                        </div>
                        <span className="text-purple-400">→</span>
                        {guessedPlayer ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{guessedPlayer.emoji}</span>
                            <span className="text-white/90">{guessedPlayer.name}</span>
                          </div>
                        ) : (
                          <span className="text-white/50 italic">No guess</span>
                        )}
                        {guessedCorrectly && (
                          <div className="ml-auto flex items-center gap-2 text-green-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium">Correct! +1 point</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Current Scores */}
        <div className="w-full bg-purple-900/30 p-6 rounded-xl border-2 border-purple-500/50">
          <h2 className="game-title text-2xl text-center mb-4">Current Scores</h2>
          <div className="space-y-2">
            {scores
              .sort(([,a], [,b]) => b - a)
              .map(([player, score]) => (
                <div 
                  key={player.id}
                  className="flex items-center justify-between p-2 rounded-lg
                           bg-purple-900/20 border border-purple-500/50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{player.emoji}</span>
                    <span className="gradient-text">{player.name}</span>
                  </div>
                  <span className="text-fuchsia-400">{score} points</span>
                </div>
              ))
            }
          </div>
        </div>

        {/* Next Prompt Button (Host Only) */}
        {isHost && !isLastPrompt && (
          <button 
            onClick={handleNextPrompt}
            className="button w-64 py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold rounded-full transition-colors"
          >
            Next Question
          </button>
        )}

        {/* Play Again Button (Host Only, Last Prompt) */}
        {isHost && isLastPrompt && (
          <div className="flex gap-4">
            <button 
              onClick={handlePlayAgain}
              className="button w-64 py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold rounded-full transition-colors"
            >
              Play Again
            </button>
            <button 
              onClick={handleReturnHome}
              className="button w-64 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-full transition-colors"
            >
              Return Home
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default RevealPhase 