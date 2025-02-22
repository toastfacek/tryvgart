import { Socket as ClientSocket } from 'socket.io-client';

declare module 'socket.io-client' {
  interface EmitEvents {
    create_room: (data: { playerName: string; playerEmoji: string }) => void;
    join_room: (data: { roomCode: string; playerName: string; emoji: string }) => void;
    rejoin_room: (data: { roomCode: string }) => void;
    submit_prompt: (data: { roomCode: string; prompt: string }) => void;
    start_answer_phase: (data: { roomCode: string }) => void;
    submit_guesses: (data: { roomCode: string; promptIndex: number; guesses: Record<string, string> }) => void;
    reveal_answers: (data: { roomCode: string }) => void;
    next_prompt: (data: { roomCode: string; promptIndex: number }) => void;
    reset_game: (data: { roomCode: string }) => void;
    close_room: (data: { roomCode: string }) => void;
  }

  interface ListenEvents {
    room_created: (data: any) => void;
    room_joined: (data: any) => void;
    error: (error: { message: string }) => void;
    game_started: () => void;
    answer_phase_started: (data: { prompt: string }) => void;
    guess_phase_started: (data: any) => void;
    reveal_answers: (data: any) => void;
    game_ended: (scores: any) => void;
    player_joined: (data: { player: any }) => void;
    player_left: (data: { playerId: string }) => void;
    players_updated: (players: any[]) => void;
    prompt_submitted: (data: { playerId: string }) => void;
    all_prompts_submitted: () => void;
    guess_submitted: (data: { playerId: string }) => void;
    next_prompt: (data: { promptIndex: number }) => void;
  }

  interface Socket extends ClientSocket {
    onAny(listener: (event: string, ...args: any[]) => void): this;
    offAny(listener?: (event: string, ...args: any[]) => void): this;
  }
} 