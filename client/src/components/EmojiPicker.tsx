import React from 'react'

const EMOJI_OPTIONS = [
  '😊', '😎', '🤓', '🤠', '👻', '🤖', 
  '🐱', '🐶', '🦊', '🦁', '🐯', '🐷',
  '🌟', '⭐', '🍕', '🌈', '🎮', '🎲'
]

interface EmojiPickerProps {
  selectedEmoji: string
  onEmojiSelect: (emoji: string) => void
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ selectedEmoji, onEmojiSelect }) => {
  return (
    <div className="emoji-grid">
      {EMOJI_OPTIONS.map((emoji) => (
        <button
          key={emoji}
          className={`emoji-button ${emoji === selectedEmoji ? 'selected' : ''}`}
          onClick={() => onEmojiSelect(emoji)}
          type="button"
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}

export default EmojiPicker 