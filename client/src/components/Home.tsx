import React from 'react'
import { Link } from 'react-router-dom'

const Home = () => {
  return (
    <div className="container">
      <h1 className="game-title">TRYVGART</h1>
      <div className="button-group">
        <Link to="/create" className="button">
          Create Room
        </Link>
        <Link to="/join" className="button">
          Join Room
        </Link>
      </div>
    </div>
  )
}

export default Home 