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
      console.log('Creating room with emoji:', emoji, 'Length:', emoji.length, 'Code points:', [...emoji].map(c => c.codePointAt(0)?.toString(16)))
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
    <div className="page-container">
      <h1 className="section-title">Create Room</h1>
      <div className="content-container">
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <form onSubmit={handleCreateRoom} className="form-container">
          <div className="form-group">
            <label htmlFor="playerName" className="input-label">
              Your Name:
            </label>
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
    </div>
  )
}

export default CreateRoom 