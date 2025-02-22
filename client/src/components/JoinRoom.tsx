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
    
    // Validate inputs
    if (roomCode.length !== 6) {
      setError('Room code must be 6 characters')
      return
    }
    
    if (playerName.trim().length < 2) {
      setError('Name must be at least 2 characters')
      return
    }
    
    if (playerName.trim().length > 20) {
      setError('Name must be less than 20 characters')
      return
    }

    try {
      const room = await joinRoom(roomCode, playerName.trim(), emoji)
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
    <div className="page-container">
      <h1 className="section-title">Join Room</h1>
      <div className="content-container">
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <form onSubmit={handleJoinRoom} className="form-container">
          <div className="form-group">
            <label htmlFor="roomCode" className="input-label">Room Code:</label>
            <input
              type="text"
              id="roomCode"
              className="text-input"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="playerName" className="input-label">Your Name:</label>
            <input
              type="text"
              id="playerName"
              className="text-input"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              required
            />
          </div>

          <div className="emoji-selector">
            <label className="input-label">Choose Your Avatar:</label>
            <EmojiPicker 
              selectedEmoji={emoji} 
              onEmojiSelect={setEmoji} 
            />
          </div>

          <div className="button-container">
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
    </div>
  )
}

export default JoinRoom 