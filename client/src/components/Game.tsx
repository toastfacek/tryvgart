import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { socket } from '../utils/socket'
import WaitingRoom from './WaitingRoom'
import PromptPhase from './PromptPhase'
import AnswerPhase from './AnswerPhase'
import GuessPhase from './GuessPhase'
import RevealPhase from './RevealPhase'

type GamePhase = 'lobby' | 'prompt' | 'answer' | 'guess' | 'reveal' | 'end'

const Game = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { roomCode, isHost } = location.state || {}
  const [gamePhase, setGamePhase] = useState<GamePhase>('lobby')
  const [players, setPlayers] = useState(location.state?.room?.players || [])

  useEffect(() => {
    if (!roomCode) {
      navigate('/')
      return
    }

    // Listen for game phase changes
    socket.on('game_started', () => {
      console.log('Game started - moving to prompt phase')
      setGamePhase('prompt')
    })

    socket.on('player_joined', ({ player }) => {
      setPlayers(prev => [...prev, player])
    })

    socket.on('player_left', ({ playerId }) => {
      setPlayers(prev => prev.filter(p => p.id !== playerId))
    })

    socket.on('game_ended', () => {
      navigate('/')
    })

    socket.on('answer_phase_started', () => {
      console.log('Answer phase started')
      setGamePhase('answer')
    })

    socket.on('guess_phase_started', () => {
      console.log('Guess phase started')
      setGamePhase('guess')
    })

    socket.on('all_answers_submitted', () => {
      console.log('All answers submitted, transitioning to guess phase')
      if (isHost) {
        socket.emit('start_guess_phase', { roomCode })
      }
    })

    socket.on('reveal_phase_started', () => {
      console.log('Transitioning to reveal phase')
      setGamePhase('reveal')
    })

    return () => {
      socket.off('game_started')
      socket.off('player_joined')
      socket.off('player_left')
      socket.off('game_ended')
      socket.off('answer_phase_started')
      socket.off('guess_phase_started')
      socket.off('all_answers_submitted')
      socket.off('reveal_phase_started')
    }
  }, [roomCode, isHost, navigate])

  const renderGamePhase = () => {
    switch (gamePhase) {
      case 'lobby':
        return (
          <WaitingRoom
            roomCode={roomCode}
            players={players}
            isHost={isHost}
          />
        )
      case 'prompt':
        return (
          <PromptPhase
            roomCode={roomCode}
            players={players}
            isHost={isHost}
          />
        )
      case 'answer':
        return (
          <AnswerPhase
            roomCode={roomCode}
            players={players}
            isHost={isHost}
          />
        )
      case 'guess':
        return (
          <GuessPhase
            roomCode={roomCode}
            players={players}
            isHost={isHost}
          />
        )
      case 'reveal':
        return (
          <RevealPhase
            roomCode={roomCode}
            players={players}
            isHost={isHost}
          />
        )
      default:
        return <div>Loading...</div>
    }
  }

  return renderGamePhase()
}

export default Game 