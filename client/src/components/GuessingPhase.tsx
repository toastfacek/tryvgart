import React, { useState, useEffect } from 'react'
import { socket } from '../utils/socket'
import { Player, Answer, GuessPhaseData } from '../types/game'

interface GuessingPhaseProps {
  roomCode: string
  players: Player[]
  isHost: boolean
  prompts: string[]
  initialAnswers: Array<{
    promptIndex: number
    answers: Answer[]
  }>
}

interface GuessSubmittedEvent {
  playerId: string
}

interface NextPromptEvent {
  promptIndex: number
}

const GuessingPhase: React.FC<GuessingPhaseProps> = ({ 
  roomCode, 
  players, 
  isHost,
  prompts,
  initialAnswers 
}) => {
  console.log('GuessingPhase: Component rendering with props:', {
    roomCode,
    playersCount: players.length,
    isHost,
    prompts,
    initialAnswers
  });

  const [currentPromptIndex, setCurrentPromptIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>(() => {
    console.log('GuessingPhase: Initializing answers with:', {
      initialAnswers,
      currentPromptIndex: 0
    });
    const currentAnswers = initialAnswers.find(a => a.promptIndex === 0)
    console.log('GuessingPhase: Found current answers:', currentAnswers);
    const result = currentAnswers?.answers || [];
    console.log('GuessingPhase: Setting initial answers:', result);
    return result;
  })
  const [myGuesses, setMyGuesses] = useState<Record<string, string>>({})
  const [submittedPlayers, setSubmittedPlayers] = useState<string[]>([])

  // Initialize answers when props change
  useEffect(() => {
    console.log('GuessingPhase: Updating answers for prompt index change:', {
      initialAnswers,
      currentPromptIndex
    });
    const currentAnswers = initialAnswers.find(a => a.promptIndex === currentPromptIndex)
    console.log('GuessingPhase: Found new current answers:', currentAnswers);
    if (currentAnswers?.answers) {
      console.log('GuessingPhase: Setting new answers:', currentAnswers.answers);
      setAnswers(currentAnswers.answers)
    }
  }, [initialAnswers, currentPromptIndex])

  useEffect(() => {
    console.log('GuessingPhase mounted with:', {
      prompts,
      initialAnswers,
      players,
      currentPromptIndex,
      currentAnswers: answers
    })
  }, [prompts, initialAnswers, players, currentPromptIndex, answers])

  useEffect(() => {
    socket.on('guess_submitted', ({ playerId }: GuessSubmittedEvent) => {
      setSubmittedPlayers(prev => [...prev, playerId])
    })

    socket.on('next_prompt', ({ promptIndex }: NextPromptEvent) => {
      setCurrentPromptIndex(promptIndex)
      setMyGuesses({})
      setSubmittedPlayers([])
      
      const nextAnswers = initialAnswers.find(a => a.promptIndex === promptIndex)
      if (nextAnswers?.answers) {
        setAnswers(nextAnswers.answers)
      }
    })

    return () => {
      socket.off('guess_submitted')
      socket.off('next_prompt')
    }
  }, [initialAnswers])

  const handleGuessSubmit = () => {
    // A player should guess for all answers except their own
    const expectedGuessCount = players.length - 1;
    const actualGuessCount = Object.keys(myGuesses).length;

    console.log('[GuessingPhase] Validating guesses:', {
      expectedGuessCount,
      actualGuessCount,
      myGuesses,
      socketId: socket.id
    });

    if (actualGuessCount !== expectedGuessCount || !socket.id) {
      console.error('[GuessingPhase] Invalid guess count:', {
        expected: expectedGuessCount,
        actual: actualGuessCount
      });
      return;
    }
    
    socket.emit('submit_guesses', {
      roomCode,
      promptIndex: currentPromptIndex,
      guesses: myGuesses
    })
    
    // Ensure socket.id is not undefined before adding to array
    if (socket.id) {
      setSubmittedPlayers(prev => [...prev, socket.id as string])
    }
  }

  if (!prompts.length || !answers.length) {
    console.log('GuessingPhase: Missing required data:', {
      promptsLength: prompts.length,
      answersLength: answers.length,
      prompts,
      answers
    });
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-fuchsia-400">Loading game data...</p>
      </div>
    )
  }

  return (
    <div className="page-container min-h-screen flex items-center justify-center">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        {/* Question Display */}
        <div className="translucent-container">
          <h2 className="text-lg text-center text-cyan-300 mb-2">
            Question {currentPromptIndex + 1} of {prompts.length}
          </h2>
          <p className="text-xl text-center text-fuchsia-400">
            {prompts[currentPromptIndex]}
          </p>
        </div>

        {/* Answer Selection */}
        {socket.id && !submittedPlayers.includes(socket.id) && (
          <div className="space-y-4">
            {answers.map((answer) => {
              // Don't show guessing UI for player's own answer
              if (answer.playerId === socket.id) {
                return (
                  <div key={answer.playerId} className="translucent-container bg-purple-900/20">
                    <p className="text-lg mb-4">{answer.text}</p>
                    <p className="text-cyan-300 italic">This is your answer</p>
                  </div>
                );
              }

              return (
                <div key={answer.playerId} className="translucent-container">
                  <p className="text-lg mb-4">{answer.text}</p>
                  <select
                    value={myGuesses[answer.playerId] || ''}
                    onChange={(e) => {
                      setMyGuesses(prev => ({
                        ...prev,
                        [answer.playerId]: e.target.value
                      }))
                    }}
                    className="w-full p-2 rounded bg-darker text-white border border-purple-500"
                  >
                    <option value="">Who wrote this?</option>
                    {players
                      .filter(player => player.id !== socket.id) // Don't allow guessing yourself
                      .map(player => (
                        <option key={player.id} value={player.id}>
                          {player.emoji} {player.name}
                        </option>
                    ))}
                  </select>
                </div>
              );
            })}

            <button
              onClick={handleGuessSubmit}
              disabled={Object.keys(myGuesses).length !== (players.length - 1)}
              className="button w-full py-3 bg-fuchsia-600 hover:bg-fuchsia-500 
                       disabled:bg-gray-600 disabled:cursor-not-allowed
                       text-white font-bold transition-colors"
            >
              Submit Guesses
            </button>
          </div>
        )}

        {/* Players Ready List */}
        <div className="mt-8">
          <h3 className="text-lg text-center text-cyan-300 mb-4">Players Ready</h3>
          <div className="space-y-2">
            {players.map(player => (
              <div 
                key={player.id} 
                className={`translucent-container flex items-center justify-between ${
                  submittedPlayers.includes(player.id) 
                    ? 'bg-green-900/30 border-green-500/30' 
                    : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{player.emoji}</span>
                  <span className="text-fuchsia-400">{player.name}</span>
                </div>
                {submittedPlayers.includes(player.id) && (
                  <span className="text-green-400">✓</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Host Controls */}
        {isHost && submittedPlayers.length === players.length && (
          <button
            onClick={() => socket.emit('reveal_answers', { roomCode })}
            className="button w-full py-3 bg-fuchsia-600 hover:bg-fuchsia-500 
                     text-white font-bold transition-colors"
          >
            Everyone's Done - Show Results
          </button>
        )}
      </div>
    </div>
  )
}

export default GuessingPhase 