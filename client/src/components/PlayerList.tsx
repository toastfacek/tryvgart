import { Player } from '../types/game'

interface PlayerListProps {
  players: Player[]
  submittedPlayers: string[]
  title?: string
}

const PlayerList: React.FC<PlayerListProps> = ({ 
  players, 
  submittedPlayers,
  title = "Players Ready" 
}) => (
  <div className="mt-8">
    <h3 className="text-lg text-primary mb-4">{title}</h3>
    <div className="player-list">
      {players.map(player => (
        <div 
          key={player.id} 
          className={`player-item ${submittedPlayers.includes(player.id) ? 'submitted' : ''}`}
        >
          <span className="text-2xl">{player.emoji}</span>
          <span className="flex-1">{player.name}</span>
          {submittedPlayers.includes(player.id) && (
            <span className="text-green-400">✓</span>
          )}
        </div>
      ))}
    </div>
  </div>
) 