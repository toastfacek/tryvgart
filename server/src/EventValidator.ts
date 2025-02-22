import { Socket } from 'socket.io'
import { RoomManager } from './RoomManager'

export class EventValidator {
  private roomManager: RoomManager

  constructor(roomManager: RoomManager) {
    this.roomManager = roomManager
  }

  validateRoomCode(roomCode: string | undefined): boolean {
    return typeof roomCode === 'string' && roomCode.length === 6
  }

  validatePlayerName(name: string | undefined): boolean {
    return typeof name === 'string' && name.length >= 2 && name.length <= 20
  }

  validatePlayerEmoji(emoji: string | undefined): boolean {
    console.log('Validating emoji:', {
      emoji,
      type: typeof emoji,
      length: emoji?.length,
      codePoints: emoji ? [...emoji].map(c => c.codePointAt(0)?.toString(16)) : null
    });
    
    if (typeof emoji !== 'string') {
      console.log('Emoji validation failed: not a string');
      return false;
    }
    
    // Allow for emoji sequences up to 8 characters (covers most emoji combinations)
    if (emoji.length > 8) {
      console.log('Emoji validation failed: too long');
      return false;
    }
    
    // Basic check that the string contains at least one emoji-like character
    const hasEmoji = /\p{Emoji}/u.test(emoji);
    console.log('Emoji validation result:', hasEmoji);
    return hasEmoji;
  }

  validatePrompt(prompt: string | undefined): boolean {
    return typeof prompt === 'string' && prompt.length >= 1 && prompt.length <= 200
  }

  validateAnswer(answer: string | undefined): boolean {
    return typeof answer === 'string' && answer.length >= 1 && answer.length <= 500
  }

  validateGuesses(guesses: Record<string, string> | undefined): boolean {
    if (!guesses || typeof guesses !== 'object') return false
    return Object.entries(guesses).every(([key, value]) => 
      typeof key === 'string' && typeof value === 'string'
    )
  }

  validateCreateRoom(data: any): { isValid: boolean; error?: string } {
    if (!this.validatePlayerName(data?.playerName)) {
      return { isValid: false, error: 'Invalid player name' }
    }
    if (!this.validatePlayerEmoji(data?.playerEmoji)) {
      return { isValid: false, error: 'Invalid player emoji' }
    }
    return { isValid: true }
  }

  validateJoinRoom(data: any): { isValid: boolean; error?: string } {
    if (!this.validateRoomCode(data?.roomCode)) {
      return { isValid: false, error: 'Invalid room code' }
    }
    if (!this.validatePlayerName(data?.playerName)) {
      return { isValid: false, error: 'Invalid player name' }
    }
    if (!this.validatePlayerEmoji(data?.playerEmoji)) {
      return { isValid: false, error: 'Invalid player emoji' }
    }
    return { isValid: true }
  }

  validateSubmitPrompt(data: any): { isValid: boolean; error?: string } {
    if (!this.validateRoomCode(data?.roomCode)) {
      return { isValid: false, error: 'Invalid room code' }
    }
    if (!this.validatePrompt(data?.prompt)) {
      return { isValid: false, error: 'Invalid prompt' }
    }
    return { isValid: true }
  }

  validateSubmitAnswer(data: any): { isValid: boolean; error?: string } {
    if (!this.validateRoomCode(data?.roomCode)) {
      return { isValid: false, error: 'Invalid room code' }
    }
    if (!this.validateAnswer(data?.answer)) {
      return { isValid: false, error: 'Invalid answer' }
    }
    return { isValid: true }
  }

  validateSubmitGuesses(data: any): { isValid: boolean; error?: string } {
    if (!this.validateRoomCode(data?.roomCode)) {
      return { isValid: false, error: 'Invalid room code' }
    }
    if (typeof data?.promptIndex !== 'number') {
      return { isValid: false, error: 'Invalid prompt index' }
    }
    if (!this.validateGuesses(data?.guesses)) {
      return { isValid: false, error: 'Invalid guesses' }
    }
    return { isValid: true }
  }

  validateHostAction(socket: Socket, roomCode: string): { isValid: boolean; error?: string } {
    if (!this.validateRoomCode(roomCode)) {
      return { isValid: false, error: 'Invalid room code' }
    }
    if (!this.roomManager.validateHost(roomCode, socket.id)) {
      return { isValid: false, error: 'Only the host can perform this action' }
    }
    return { isValid: true }
  }
} 