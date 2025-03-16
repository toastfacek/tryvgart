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
    console.log('[GuessRevealPhase] Component mounted with initial state:', {
      answersCount: answers.length,
      playersCount: players.length,
      hasLocalGuesses: Object.keys(localGuesses).length > 0
    });

    const events = [
      'guess_phase_started',
      'reveal_answers',
      'game_reset',
      'next_prompt',
      'guess_submitted',
      'score_update'
    ];

    socket.on('guess_phase_started', (phaseData: GuessPhaseData) => {
      console.log('[GuessRevealPhase] Received guess_phase_started:', {
        hasPrompts: Boolean(phaseData?.prompts),
        promptsLength: phaseData?.prompts?.length,
        hasAnswers: Boolean(phaseData?.answers),
        answersLength: phaseData?.answers?.length,
        currentPromptIndex: phaseData?.currentPromptIndex
      });

      if (!phaseData?.prompts || !phaseData?.answers) {
        console.error('[GuessRevealPhase] Invalid guess phase data:', phaseData);
        return;
      }

      try {
        setPrompts(phaseData.prompts);
        setIsGuessing(true);
        
        const promptIndex = phaseData.currentPromptIndex || 0;
        setCurrentPromptIndex(promptIndex);
        
        const currentAnswers = phaseData.answers.find(a => a.promptIndex === promptIndex);
        console.log('[GuessRevealPhase] Current answers data:', {
          promptIndex,
          hasCurrentAnswers: Boolean(currentAnswers),
          answersCount: currentAnswers?.answers?.length
        });

        if (currentAnswers?.answers) {
          console.log('[GuessRevealPhase] Setting answers:', currentAnswers.answers);
          setAnswers(currentAnswers.answers);
        } else {
          console.error('[GuessRevealPhase] No answers found for prompt index:', promptIndex);
        }
        
        setMyGuesses({});
        setLocalGuesses({});
        setSubmittedPlayers([]);

        console.log('[GuessRevealPhase] State updates completed for guess phase');
      } catch (error) {
        console.error('[GuessRevealPhase] Error processing guess phase data:', error);
      }
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
      console.log('[GuessRevealPhase] Component unmounting, cleaning up socket listeners');
      events.forEach(event => socket.off(event));
    };
  }, [navigate, setPrompts, setIsGuessing, setCurrentPromptIndex, setAnswers, setMyGuesses, setSubmittedPlayers, setScores, setGuesses]);

  // Monitor state changes
  useEffect(() => {
    console.log('[GuessRevealPhase] State updated:', {
      answersCount: answers.length,
      playersCount: players.length,
      localGuessesCount: Object.keys(localGuesses).length
    });
  }, [answers, players, localGuesses]);

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