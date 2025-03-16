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
      const { roomCode, room } = await createRoom(playerName, emoji) as any
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
      <div className="flex flex-col items-center justify-center min-h-screen w-full max-w-2xl mx-auto">
        {/* Title */}
        <div className="translucent-container mb-8 px-8 py-4
                      border-4 border-cyan-400/50
                      shadow-[0_0_30px_rgba(34,211,238,0.4),inset_0_0_30px_rgba(34,211,238,0.2)]">
          <h1 className="game-title mb-0 text-4xl">Create Room</h1>
        </div>

        {/* Form Container */}
        <div className="translucent-container w-full">
          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border-2 border-red-500/50 rounded-lg text-red-400">
              {error}
            </div>
          )}
          
          <form onSubmit={handleCreateRoom} className="space-y-6">
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
                placeholder="Enter your name"
                required
              />
            </div>
            
            <div className="space-y-4">
              <label className="input-label">Choose Your Avatar:</label>
              <div className="bg-purple-900/20 p-4 rounded-xl border-2 border-purple-500/30">
                <EmojiPicker 
                  selectedEmoji={emoji} 
                  onEmojiSelect={setEmoji} 
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button type="submit" className="button">
                CREATE ROOM
              </button>
              <button 
                type="button" 
                className="button secondary"
                onClick={() => navigate('/')}
              >
                BACK
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateRoom 