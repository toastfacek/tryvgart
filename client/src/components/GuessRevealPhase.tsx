import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../utils/socket';
import { GuessPhaseData, RevealData, Answer, Player, Score } from '../types/game';

interface Props {
  setPrompts: (prompts: string[]) => void;
  setIsGuessing: (isGuessing: boolean) => void;
  setCurrentPromptIndex: (index: number) => void;
  setAnswers: (answers: Answer[]) => void;
  setMyGuesses: (guesses: Record<string, string>) => void;
  setSubmittedPlayers: React.Dispatch<React.SetStateAction<string[]>>;
  setScores: (scores: Array<[string, number]>) => void;
  setGuesses: (guesses: Record<string, string>) => void;
  answers: Answer[];
  players: Player[];
}

const GuessRevealPhase: React.FC<Props> = ({
  setPrompts,
  setIsGuessing,
  setCurrentPromptIndex,
  setAnswers,
  setMyGuesses,
  setSubmittedPlayers,
  setScores,
  setGuesses,
  answers,
  players,
}) => {
  const navigate = useNavigate();
  const [localGuesses, setLocalGuesses] = useState<Record<string, string>>({});

  useEffect(() => {
    const events = [
      'guess_phase_started',
      'reveal_answers',
      'game_reset',
      'next_prompt',
      'guess_submitted',
      'score_update'
    ];

    socket.on('guess_phase_started', (phaseData: GuessPhaseData) => {
      console.log('Guess phase started with data:', phaseData);
      if (!phaseData?.prompts || !phaseData?.answers) {
        console.error('Invalid guess phase data:', phaseData);
        return;
      }

      setPrompts(phaseData.prompts);
      setIsGuessing(true);
      
      // Use the currentPromptIndex from server
      const promptIndex = phaseData.currentPromptIndex || 0;
      setCurrentPromptIndex(promptIndex);
      
      // Get answers for current prompt
      const currentAnswers = phaseData.answers.find(a => a.promptIndex === promptIndex);
      if (currentAnswers?.answers) {
        console.log('Setting answers for prompt', promptIndex, ':', currentAnswers.answers);
        setAnswers(currentAnswers.answers);
      } else {
        console.error('No answers found for prompt index:', promptIndex);
      }
      
      // Reset states
      setMyGuesses({});
      setLocalGuesses({});
      setSubmittedPlayers([]);
    });

    socket.on('reveal_answers', (revealData: RevealData) => {
      console.log('Reveal answers data:', revealData);
      
      if (!revealData.answers || !revealData.scores || !revealData.guesses) {
        console.error('Invalid reveal data structure:', revealData);
        return;
      }

      try {
        setAnswers(revealData.answers);
        setIsGuessing(false);
        setScores(revealData.scores.map(score => [score.playerId, score.score]));
        
        // Convert guesses array to the expected format
        const guessesMap: Record<string, string> = {};
        revealData.guesses.forEach(([playerId, playerGuesses]) => {
          Object.assign(guessesMap, playerGuesses);
        });
        setGuesses(guessesMap);
      } catch (err) {
        console.error('Error processing reveal data:', err);
      }
    });

    socket.on('game_reset', () => {
      navigate('/');
    });

    socket.on('next_prompt', (data: { promptIndex: number }) => {
      console.log('Next prompt data:', data);
      setCurrentPromptIndex(data.promptIndex);
      setIsGuessing(true);
      setMyGuesses({});
      setLocalGuesses({});
    });

    socket.on('guess_submitted', ({ playerId }: { playerId: string }) => {
      console.log('Guess submitted by:', playerId);
      setSubmittedPlayers(prev => [...prev, playerId]);
    });

    socket.on('score_update', (data: { verified: boolean; scores: Score[] }) => {
      if (!data.verified) {
        console.error('Received unverified score data');
        return;
      }
      setScores(data.scores.map(score => [score.playerId, score.score]));
    });

    // Cleanup
    return () => {
      events.forEach(event => socket.off(event));
    };
  }, [navigate, setPrompts, setIsGuessing, setCurrentPromptIndex, setAnswers, setMyGuesses, setSubmittedPlayers, setScores, setGuesses]);

  // Add debug logging for answers and players
  useEffect(() => {
    console.log('Current answers:', answers);
    console.log('Available players:', players);
  }, [answers, players]);

  return (
    <div className="space-y-4">
      {answers.map((answer, index) => (
        <div key={answer.playerId || index} className="rounded-lg bg-purple-900/50 p-4 border border-purple-700/50">
          <p className="text-lg mb-4">{answer.text}</p>
          <select
            value={localGuesses[answer.playerId] || ''}
            onChange={(e) => {
              console.log('Selected player:', e.target.value, 'for answer:', answer);
              const newGuesses = {
                ...localGuesses,
                [answer.playerId]: e.target.value
              };
              setLocalGuesses(newGuesses);
              setMyGuesses(newGuesses);
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
    </div>
  );
};

export default GuessRevealPhase; 