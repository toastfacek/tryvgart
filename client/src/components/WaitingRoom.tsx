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
    <div className="container">
      <h2>Waiting Room</h2>
      <div className="room-code">
        Room Code: 
        <span className="code">{roomCode}</span>
        <button 
          className="copy-button"
          onClick={copyRoomCode}
        >
          {copied ? '✓ Copied!' : 'Copy'}
        </button>
      </div>
      <div className="players-list">
        <h3>Players ({players.length})</h3>
        {players.map(player => (
          <div key={player.id} className="player-item">
            <span className="player-emoji">{player.emoji}</span>
            <span className="player-name">{player.name}</span>
          </div>
        ))}
      </div>
      <div className="button-group">
        {isHost && players.length >= 1 && (
          <button className="button" onClick={handleStartGame}>
            Start Game
          </button>
        )}
        <button className="button secondary" onClick={handleBack}>
          Back to Home
        </button>
      </div>
      {isHost && players.length < 1 && (
        <p className="waiting-message">Waiting for more players to join...</p>
      )}
    </div>
  )
}

export default WaitingRoom 