import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import EmojiPicker from './EmojiPicker'
import { createRoom } from '../utils/socket'

const CreateRoom = () => {
  const [playerName, setPlayerName] = useState('')
  const [emoji, setEmoji] = useState('😊')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      console.log('Creating room...')
      const { roomCode, room } = await createRoom(playerName, emoji) as any
      console.log('Room created:', { roomCode, room })
      
      navigate(`/room/${roomCode}`, { 
        state: { 
          roomCode,
          room,
          isHost: true
        }
      })
    } catch (err: any) {
      console.error('Error creating room:', err)
      setError(err.message || 'Failed to create room')
    }
  }

  return (
    <div className="container">
      <h2>Create Room</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleCreateRoom}>
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
            Create Room
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

export default CreateRoom 