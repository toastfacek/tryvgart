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
    socket.on('guess_submitted', ({ playerId }) => {
      setSubmittedPlayers(prev => [...prev, playerId])
    })

    socket.on('next_prompt', ({ promptIndex }) => {
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
    if (Object.keys(myGuesses).length !== answers.length) return
    
    socket.emit('submit_guesses', {
      roomCode,
      promptIndex: currentPromptIndex,
      guesses: myGuesses
    })
    setSubmittedPlayers(prev => [...prev, socket.id])
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-purple-900 to-purple-800">
      <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
        {/* Question Display */}
        <div className="rounded-xl bg-purple-900/50 p-6 backdrop-blur-sm border border-purple-700/50">
          <h2 className="text-lg text-center text-cyan-300 mb-2">
            Question {currentPromptIndex + 1} of {prompts.length}
          </h2>
          <p className="text-xl text-center text-fuchsia-400">
            {prompts[currentPromptIndex]}
          </p>
        </div>

        {/* Answer Selection */}
        {!submittedPlayers.includes(socket.id) && (
          <div className="space-y-4">
            {answers.map((answer) => (
              <div key={answer.playerId} className="rounded-lg bg-purple-900/50 p-4 border border-purple-700/50">
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
                  {players.map(player => (
                    <option key={player.id} value={player.id}>
                      {player.emoji} {player.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            <button
              onClick={handleGuessSubmit}
              disabled={Object.keys(myGuesses).length !== answers.length}
              className="w-full py-3 px-6 rounded-full bg-fuchsia-600 hover:bg-fuchsia-500 
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
                className={`flex items-center justify-between p-3 rounded-lg 
                  ${submittedPlayers.includes(player.id) 
                    ? 'bg-green-900/30 border-green-500/30' 
                    : 'bg-purple-900/30 border-purple-500/30'
                  } border`}
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
            className="w-full py-3 px-6 rounded-full bg-fuchsia-600 hover:bg-fuchsia-500 
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