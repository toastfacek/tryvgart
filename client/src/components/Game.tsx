import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate, Location } from 'react-router-dom'
import { socket } from '../utils/socket'
import WaitingRoom from './WaitingRoom'
import PromptPhase from './PromptPhase'
import AnswerPhase from './AnswerPhase'
import GuessingPhase from './GuessingPhase'
import RevealPhase from './RevealPhase'
import { Player, Room, GamePhase, GameState, GuessPhaseData, RevealData } from '../types/game'

interface EndPhaseProps {
  scores: [Player, number][]
  isHost: boolean
  onPlayAgain: () => void
  onReturnHome: () => void
}

const EndPhase: React.FC<EndPhaseProps> = ({ scores, isHost, onPlayAgain, onReturnHome }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-8 gradient-text">Game Over!</h1>
      <div className="space-y-4">
        {scores.map(([player, score], index) => (
          <div key={player.id} className="flex items-center gap-4 text-xl">
            <span className="text-2xl">{index === 0 ? '👑' : ''} {player.emoji}</span>
            <span className="gradient-text">{player.name}</span>
            <span className="text-purple-400">Score: {score}</span>
          </div>
        ))}
      </div>
      {isHost && (
        <div className="flex gap-4 mt-8">
          <button 
            onClick={onPlayAgain}
            className="button bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold py-3 px-8 rounded-full transition-colors"
          >
            Play Again
          </button>
          <button 
            onClick={onReturnHome}
            className="button bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-8 rounded-full transition-colors"
          >
            Return Home
          </button>
        </div>
      )}
    </div>
  )
}

const Game = () => {
  const location = useLocation() as Location & { state: GameState }
  const navigate = useNavigate()
  const { roomCode, isHost } = location.state || {}
  const [gamePhase, setGamePhase] = useState<GamePhase>('lobby')
  const [players, setPlayers] = useState<Player[]>(location.state?.room?.players || [])
  const [guessPhaseData, setGuessPhaseData] = useState<GuessPhaseData | null>(null)
  const [revealData, setRevealData] = useState<RevealData | null>(null)
  const [finalScores, setFinalScores] = useState<[Player, number][] | null>(null)
  const [currentPrompt, setCurrentPrompt] = useState<string>('')

  // Track state changes
  useEffect(() => {
    console.log('Game: State changed:', {
      gamePhase,
      playersCount: players.length,
      hasGuessPhaseData: !!guessPhaseData,
      guessPhaseDataDetails: guessPhaseData ? {
        promptsLength: guessPhaseData.prompts.length,
        answersLength: guessPhaseData.answers.length,
        firstPrompt: guessPhaseData.prompts[0],
        firstAnswerObject: guessPhaseData.answers[0]
      } : null
    });
  }, [gamePhase, players, guessPhaseData]);

  useEffect(() => {
    if (!roomCode) {
      navigate('/')
      return
    }

    console.log('Game: Setting up socket event listeners');

    const events = [
      'game_started',
      'answer_phase_started',
      'guess_phase_started',
      'reveal_answers',
      'player_joined',
      'player_left',
      'game_ended',
      'game_phase_changed',
      'players_updated'
    ] as const;

    // Game phase events
    socket.on('game_started', () => {
      console.log('Game started - moving to prompt phase')
      setGamePhase('prompt')
    })

    socket.on('answer_phase_started', (data: { prompt: string }) => {
      console.log('Game: Answer phase started - moving to answer phase', data)
      setCurrentPrompt(data.prompt)
      setGamePhase('answer')
    })

    socket.on('guess_phase_started', (data: GuessPhaseData) => {
      console.log('Game: Guess phase started with data:', data)
      console.log('Game: Raw guess phase data:', {
        prompts: data.prompts,
        answers: data.answers,
        firstAnswer: data.answers[0]
      })
      setGuessPhaseData(data)
      console.log('Game: Successfully set guess phase data')
      console.log('Game: Updating phase from answer to guess')
      setGamePhase('guess')
    })

    socket.on('reveal_answers', (data: RevealData) => {
      console.log('Game: Moving to reveal phase for current prompt')
      console.log('Game: Reveal answers data:', data)
      setRevealData(data)
      setGamePhase('reveal')
    })

    socket.on('game_ended', (scores: [Player, number][]) => {
      setFinalScores(scores)
      setGamePhase('end')
    })

    // Player events
    socket.on('player_joined', ({ player }: { player: Player }) => {
      setPlayers(prev => [...prev, player])
    })

    socket.on('player_left', ({ playerId }: { playerId: string }) => {
      setPlayers(prev => prev.filter(p => p.id !== playerId))
    })

    socket.on('players_updated', (updatedPlayers: Player[]) => {
      setPlayers(updatedPlayers)
    })

    // Debug events
    const debugListener = (eventName: string, ...args: any[]) => {
      console.log('Game: Socket event:', eventName, args)
    }
    socket.onAny(debugListener)

    return () => {
      console.log('Game: Cleaning up socket event listeners')
      events.forEach(event => socket.off(event))
      socket.offAny(debugListener)
    }
  }, [roomCode, navigate])

  const handleNextPrompt = () => {
    if (revealData) {
      socket.emit('next_prompt', { 
        roomCode,
        promptIndex: revealData.promptIndex + 1 
      })
    }
  }

  const handlePlayAgain = () => {
    socket.emit('reset_game', { roomCode })
  }

  const handleReturnHome = () => {
    socket.emit('close_room', { roomCode })
    navigate('/')
  }

  return (
    <div className="min-h-screen">
      {gamePhase === 'lobby' && (
        <WaitingRoom roomCode={roomCode} players={players} isHost={isHost} />
      )}
      {gamePhase === 'prompt' && (
        <PromptPhase roomCode={roomCode} players={players} isHost={isHost} />
      )}
      {gamePhase === 'answer' && (
        <AnswerPhase 
          roomCode={roomCode} 
          players={players} 
          isHost={isHost} 
          currentPrompt={currentPrompt}
        />
      )}
      {gamePhase === 'guess' && guessPhaseData && (
        <GuessingPhase 
          roomCode={roomCode}
          players={players}
          isHost={isHost}
          prompts={guessPhaseData.prompts}
          initialAnswers={guessPhaseData.answers}
        />
      )}
      {gamePhase === 'reveal' && revealData && (
        <RevealPhase 
          roomCode={roomCode}
          players={players}
          isHost={isHost}
          onNextPrompt={handleNextPrompt}
          revealData={revealData}
        />
      )}
      {gamePhase === 'end' && finalScores && (
        <EndPhase 
          scores={finalScores}
          isHost={isHost}
          onPlayAgain={handlePlayAgain}
          onReturnHome={handleReturnHome}
        />
      )}
    </div>
  )
}

export default Game 