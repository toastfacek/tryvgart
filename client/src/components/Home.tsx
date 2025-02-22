import React from 'react'
import { Link } from 'react-router-dom'

const Home = () => {
  return (
    <div className="page-container">
      <div className="flex flex-col items-center justify-center min-h-screen">
        {/* Title */}
        <h1 className="game-title">
          TRYVGART
        </h1>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
          <Link 
            to="/create" 
            className="button min-w-[240px] text-lg py-4 shadow-lg"
          >
            CREATE ROOM
          </Link>
          <Link 
            to="/join" 
            className="button secondary min-w-[240px] text-lg py-4 shadow-lg"
          >
            JOIN ROOM
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Home 