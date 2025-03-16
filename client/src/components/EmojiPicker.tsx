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
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
      {EMOJI_OPTIONS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onEmojiSelect(emoji)}
          className={`
            aspect-square p-2 text-2xl
            flex items-center justify-center
            rounded-lg transition-all duration-300
            ${emoji === selectedEmoji
              ? 'bg-accent/30 border-2 border-accent shadow-[0_0_15px_rgba(178,75,255,0.3)] scale-105'
              : 'bg-purple-900/30 border-2 border-purple-500/30 hover:border-accent/50 hover:bg-accent/20 hover:scale-105'
            }
          `}
          type="button"
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}

export default EmojiPicker 