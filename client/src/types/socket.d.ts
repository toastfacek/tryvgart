import { Socket } from 'socket.io-client';

declare module 'socket.io-client' {
  export interface Socket {
    onAny(listener: (event: string, ...args: any[]) => void): this;
    offAny(listener?: (event: string, ...args: any[]) => void): this;
  }
} 