import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { socket } from '../utils/socket'

interface Player {
  id: string
  name: string
  emoji: string
}

interface WaitingRoomProps {
  roomCode: string
  players: Player[]
  isHost: boolean
}

const WaitingRoom: React.FC<WaitingRoomProps> = ({ roomCode, players, isHost }) => {
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  const handleStartGame = () => {
    socket.emit('start_game', { roomCode })
  }

  const handleBack = () => {
    if (isHost) {
      // Notify server to close the room
      socket.emit('close_room', { roomCode })
    }
    navigate('/')
  }

  const copyRoomCode = async () => {
    await navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="page-container">
      <div className="content-container">
        <h2 className="section-title">Waiting Room</h2>
        
        <div className="card p-4 mb-8">
          <div className="flex items-center justify-center gap-4">
            <span className="text-lg">Room Code:</span>
            <span className="text-2xl font-bold text-primary">{roomCode}</span>
            <button 
              className="button small"
              onClick={copyRoomCode}
            >
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="player-list">
          <h3 className="text-lg mb-4">Players ({players.length})</h3>
          {players.map(player => (
            <div key={player.id} className="player-item">
              <span className="text-2xl">{player.emoji}</span>
              <span className="flex-1">{player.name}</span>
            </div>
          ))}
        </div>

        <div className="button-container">
          {isHost && players.length > 0 && (
            <button className="button" onClick={handleStartGame}>
              Start Game
            </button>
          )}
          <button className="button secondary" onClick={handleBack}>
            Back to Home
          </button>
        </div>

        {isHost && players.length === 0 && (
          <p className="status-indicator">
            Waiting for at least one player to join...
          </p>
        )}
      </div>
    </div>
  )
}

export default WaitingRoom 