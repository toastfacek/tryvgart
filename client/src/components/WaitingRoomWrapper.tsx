import React from 'react'
import { useLocation, useParams } from 'react-router-dom'
import WaitingRoom from './WaitingRoom'

const WaitingRoomWrapper = () => {
  const { roomCode } = useParams()
  const location = useLocation()
  const { room, isHost } = location.state || {}

  if (!room || !roomCode) {
    return <div className="container">Invalid room or missing data</div>
  }

  return (
    <WaitingRoom
      roomCode={roomCode}
      players={room.players}
      isHost={isHost}
    />
  )
}

export default WaitingRoomWrapper 