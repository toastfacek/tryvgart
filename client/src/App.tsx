import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './components/Home'
import CreateRoom from './components/CreateRoom'
import JoinRoom from './components/JoinRoom'
import Game from './components/Game'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateRoom />} />
        <Route path="/join" element={<JoinRoom />} />
        <Route path="/room/:roomCode" element={<Game />} />
      </Routes>
    </Router>
  )
}

export default App
