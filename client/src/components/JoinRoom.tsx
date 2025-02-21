import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import EmojiPicker from './EmojiPicker'
import { joinRoom } from '../utils/socket'

const JoinRoom = () => {
  const [roomCode, setRoomCode] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [emoji, setEmoji] = useState('😊')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const room = await joinRoom(roomCode, playerName, emoji)
      navigate(`/room/${roomCode}`, { 
        state: { 
          roomCode,
          room,
          isHost: false
        }
      })
    } catch (err: any) {
      setError(err.message || 'Failed to join room')
    }
  }

  return (
    <div className="container">
      <h2>Join Room</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleJoinRoom}>
        <div className="form-group">
          <label htmlFor="roomCode">Room Code:</label>
          <input
            type="text"
            id="roomCode"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            maxLength={6}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="playerName">Your Name:</label>
          <input
            type="text"
            id="playerName"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Choose Your Avatar:</label>
          <div className="selected-emoji">{emoji}</div>
          <EmojiPicker 
            selectedEmoji={emoji} 
            onEmojiSelect={setEmoji} 
          />
        </div>
        <div className="button-group">
          <button type="submit" className="button">
            Join Room
          </button>
          <button 
            type="button" 
            className="button secondary"
            onClick={() => navigate('/')}
          >
            Back
          </button>
        </div>
      </form>
    </div>
  )
}

export default JoinRoom 