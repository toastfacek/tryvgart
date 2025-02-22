useEffect(() => {
  const events = [
    'guess_phase_started',
    'reveal_answers',
    'game_reset',
    'next_prompt',
    'guess_submitted',
    'score_update'
  ]

  socket.on('guess_phase_started', (phaseData: GuessPhaseData) => {
    console.log('Guess phase started with data:', phaseData)
    if (!phaseData?.prompts || !phaseData?.answers) {
      console.error('Invalid guess phase data:', phaseData)
      return
    }

    setPrompts(phaseData.prompts)
    setIsGuessing(true)
    
    // Start with first prompt
    const promptIndex = 0
    setCurrentPromptIndex(promptIndex)
    
    // Get all answers for current prompt and ensure they're properly formatted
    const currentAnswers = phaseData.answers.find(a => a.promptIndex === promptIndex)
    if (currentAnswers?.answers) {
      console.log('Setting answers:', currentAnswers.answers)
      setAnswers(currentAnswers.answers.map(answer => ({
        ...answer,
        playerId: answer.playerId || '',
        text: answer.text || '',
        authorName: answer.authorName || '',
        authorEmoji: answer.authorEmoji || ''
      })))
    }
    
    // Reset states
    setMyGuesses({})
    setSubmittedPlayers([])
  })

  socket.on('reveal_answers', (revealData: RevealData) => {
    console.log('Reveal answers data:', revealData)
    
    // Handle both possible data structures
    const data = revealData.data || revealData
    if (!data || !data.answers) {
      console.error('Invalid reveal data structure:', revealData)
      return
    }

    try {
      setAnswers(data.answers)
      setIsGuessing(false)
      
      if (data.scores) {
        setScores(data.scores.map(score => [score.player, score.score]))
      }
      
      if (data.guesses) {
        setGuesses(data.guesses)
      }
    } catch (err) {
      console.error('Error processing reveal data:', err)
    }
  })

  socket.on('game_reset', () => {
    navigate('/')
  })

  socket.on('next_prompt', (data) => {
    console.log('Next prompt data:', data)
    setCurrentPromptIndex(data.promptIndex)
    setIsGuessing(true)
    setMyGuesses({})
  })

  socket.on('guess_submitted', ({ playerId }) => {
    console.log('Guess submitted by:', playerId)
    setSubmittedPlayers(prev => [...prev, playerId])
  })

  socket.on('score_update', (data) => {
    if (!data.verified) {
      console.error('Received unverified score data')
      return
    }
    setScores(data.scores)
  })

  // Cleanup
  return () => {
    events.forEach(event => socket.off(event))
  }
}, [navigate]) // Remove currentPromptIndex dependency

// Add debug logging for answers and players
useEffect(() => {
  console.log('Current answers:', answers)
  console.log('Available players:', players)
}, [answers, players])

// ... rest of the component code ...

// In the render section where we map over answers, add logging:
{answers.map((answer, index) => (
  <div key={answer.playerId || index} className="rounded-lg bg-purple-900/50 p-4 border border-purple-700/50">
    <p className="text-lg mb-4">{answer.text}</p>
    <select
      value={myGuesses[answer.playerId] || ''}
      onChange={(e) => {
        console.log('Selected player:', e.target.value, 'for answer:', answer)
        setMyGuesses(prev => ({
          ...prev,
          [answer.playerId]: e.target.value
        }))
      }}
      className="w-full p-2 rounded bg-darker text-white border border-purple-500"
    >
      <option value="">Who wrote this?</option>
      {players.map(player => (
        <option
          key={player.id}
          value={player.id}
        >
          {player.emoji} {player.name}
        </option>
      ))}
    </select>
  </div>
))} 