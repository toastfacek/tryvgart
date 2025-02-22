import React from 'react'
import { Link } from 'react-router-dom'

const Home = () => {
  return (
    <div className="page-container">
      <div className="flex flex-col items-center justify-center min-h-screen">
        {/* Title */}
        <div className="translucent-container mb-16 px-16 py-8
                      border-4 border-cyan-400/50
                      shadow-[0_0_30px_rgba(34,211,238,0.4),inset_0_0_30px_rgba(34,211,238,0.2)]
                      bg-navy-900/30">
          <h1 className="game-title mb-2 text-white">
            TRYVGART
          </h1>
          <p className="font-pixel text-lg tracking-wider text-cyan-300/90
                        text-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
            Now approved for self-REFLECTION
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
          <Link 
            to="/create" 
            className="translucent-container hover:bg-navy-800/50 transition-all duration-300
                     hover:scale-105 hover:shadow-[0_0_30px_rgba(34,211,238,0.5)]
                     min-w-[240px] text-lg py-4 text-center font-pixel tracking-wide
                     text-cyan-400 hover:text-cyan-300 bg-navy-900/30"
          >
            CREATE ROOM
          </Link>
          <Link 
            to="/join" 
            className="translucent-container hover:bg-navy-800/50 transition-all duration-300
                     hover:scale-105 hover:shadow-[0_0_30px_rgba(34,211,238,0.5)]
                     min-w-[240px] text-lg py-4 text-center font-pixel tracking-wide
                     text-purple-300 hover:text-purple-200 bg-navy-900/30"
          >
            JOIN ROOM
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Home 