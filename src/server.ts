.map((entry): { playerId: string; text: string } => {
    const [playerId, text] = entry as [string, string];
    return { playerId, text };
}) 

.filter((p: Player) => p.connected)
.map((p: Player) => p.id)

function someFunction(player: Player) {
    // ... code ...
} 