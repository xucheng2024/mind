import React, { useState, useEffect, useCallback } from 'react';
import { Brain, Play, Pause, RotateCcw, TrendingUp, Timer, Target, Zap } from 'lucide-react';
import { EnhancedButton, useHapticFeedback } from '../components';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function BrainPage() {
  const { trigger: hapticTrigger } = useHapticFeedback();
  
  // Game states
  const [currentMode, setCurrentMode] = useState(null); // 'forward', 'backward', 'updating'
  const [gameState, setGameState] = useState('menu'); // 'menu', 'ready', 'showing', 'input', 'result', 'rest'
  const [currentSequence, setCurrentSequence] = useState([]);
  const [userInput, setUserInput] = useState([]);
  const [currentDigitIndex, setCurrentDigitIndex] = useState(0);
  const [showingDigit, setShowingDigit] = useState(null);
  const [score, setScore] = useState(0);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [consecutiveWrong, setConsecutiveWrong] = useState(0);
  const [currentLength, setCurrentLength] = useState(4);
  const [remainingTime, setRemainingTime] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [roundsInMode, setRoundsInMode] = useState(0);
  const [maxRoundsPerMode] = useState(10); // Each mode has 10 rounds
  const [lastResult, setLastResult] = useState(null); // 'correct' or 'incorrect'
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentRoundLength, setCurrentRoundLength] = useState(4); // Length for current round
  
  // Updating span specific states
  const [updatingWindowSize, setUpdatingWindowSize] = useState(2); // Size of sliding window
  const [totalSequenceLength, setTotalSequenceLength] = useState(8); // Total length of sequence (unknown to user)
  
  // Progress tracking
  const [forwardSpanRecord, setForwardSpanRecord] = useLocalStorage('forwardSpanRecord', 0); // Last session ending difficulty
  const [backwardSpanRecord, setBackwardSpanRecord] = useLocalStorage('backwardSpanRecord', 0); // Last session ending difficulty  
  const [updatingSpanRecord, setUpdatingSpanRecord] = useLocalStorage('updatingSpanRecord', 0); // Last session ending difficulty
  const [totalSessions, setTotalSessions] = useLocalStorage('brainTrainingSessions', 0);
  const [dailyStreak, setDailyStreak] = useLocalStorage('brainTrainingStreak', 0);
  const [lastSessionDate, setLastSessionDate] = useLocalStorage('lastBrainSessionDate', null);

  // Timer for rest periods only
  useEffect(() => {
    let timer;
    if (remainingTime > 0) {
      timer = setTimeout(() => {
        setRemainingTime(prev => prev - 1);
      }, 1000);
    } else if (gameState === 'rest' && remainingTime === 0) {
      nextMode();
    }
    return () => clearTimeout(timer);
  }, [remainingTime, gameState]);


  // Generate random digit sequence
  const generateSequence = useCallback((length) => {
    const sequence = [];
    for (let i = 0; i < length; i++) {
      sequence.push(Math.floor(Math.random() * 9) + 1); // 1-9
    }
    return sequence;
  }, []);

  // Generate updating span sequence with dynamic length
  const generateUpdatingSequence = useCallback(() => {
    // Dynamic sequence length based on difficulty (8-13 digits)
    const minLength = Math.max(8, updatingWindowSize + 3);
    const maxLength = Math.max(10, updatingWindowSize + 5);
    const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
    setTotalSequenceLength(length);
    return generateSequence(length);
  }, [updatingWindowSize, generateSequence]);

  // Reset all records (for testing)
  const resetRecords = () => {
    setForwardSpanRecord(0);
    setBackwardSpanRecord(0);
    setUpdatingSpanRecord(0);
    setTotalSessions(0);
    setDailyStreak(0);
    setLastSessionDate(null);
    alert('All records reset to 0. Next training will start fresh.');
  };

  // Start training session
  const startTraining = () => {
    setSessionStartTime(Date.now());
    setCurrentRound(0);
    setRoundsInMode(0);
    setScore(0);
    setCurrentMode('forward');
    
    // Read latest record from localStorage to ensure fresh data
    const latestRecord = parseInt(localStorage.getItem('forwardSpanRecord') || '0');
    if (import.meta.env.DEV) {
      console.log(`Latest Forward record from localStorage: ${latestRecord}`);
      console.log(`React state record: ${forwardSpanRecord}`);
    }
    
    // Set initial difficulty based on last session (first time starts at 4, returning users start 1 below record)
    const startDifficulty = latestRecord === 0 ? 4 : Math.max(4, latestRecord - 1);
    if (import.meta.env.DEV) {
      console.log(`Starting Forward - will start at: ${startDifficulty}`);
    }
    setCurrentLength(startDifficulty);
    setConsecutiveCorrect(0);
    setConsecutiveWrong(0);
    // Ensure the first round uses the exact same computed difficulty
    if (import.meta.env.DEV) {
      console.log(`Starting first round explicitly with length: ${startDifficulty}`);
    }
    startRound(startDifficulty);
  };

  // Start a new round with specific length
  const startRound = (length = currentLength) => {
    if (import.meta.env.DEV) {
      console.log(`Starting new round with length: ${length}`);
    }
    
    let sequence;
    if (currentMode === 'updating') {
      // For updating span, use dynamic sequence length
      sequence = generateUpdatingSequence();
      setCurrentRoundLength(updatingWindowSize); // Input grid shows window size
      if (import.meta.env.DEV) {
        console.log(`Generated updating sequence (${sequence.length} total, window: ${updatingWindowSize}): ${sequence.join(', ')}`);
      }
    } else {
      // For forward/backward, use fixed length
      sequence = generateSequence(length);
      setCurrentRoundLength(length);
      if (import.meta.env.DEV) {
        console.log(`Generated sequence: ${sequence.join(', ')}`);
      }
    }
    
    setCurrentSequence(sequence);
    setUserInput([]);
    setCurrentDigitIndex(0);
    setGameState('showing');
    hapticTrigger('light');
    
    // Start showing digits after a brief delay to ensure state is updated
    setTimeout(() => {
      if (sequence.length > 0) {
        if (import.meta.env.DEV) {
          console.log(`Starting sequence display: ${sequence.join(', ')}`);
        }
        showDigitAtIndex(0, sequence);
      }
    }, 50);
  };

  // Start showing sequence
  const startShowingSequence = () => {
    if (import.meta.env.DEV) {
      console.log('Starting to show sequence');
    }
    setGameState('showing');
    setCurrentDigitIndex(0);
    // Start showing digits immediately
    showFirstDigit();
  };

  // Show first digit to start the sequence
  const showFirstDigit = () => {
    if (currentSequence.length > 0) {
      if (import.meta.env.DEV) {
        console.log(`Starting sequence display: ${currentSequence.join(', ')}`);
      }
      setCurrentDigitIndex(0);
      showDigitAtIndex(0);
    }
  };

  // Show digit at specific index
  const showDigitAtIndex = (index, sequence = currentSequence) => {
    if (index >= sequence.length) {
      if (import.meta.env.DEV) {
        console.log('All digits shown, switching to input mode');
      }
      setGameState('input');
      setShowingDigit(null);
      return;
    }

    if (import.meta.env.DEV) {
      console.log(`Showing digit ${index + 1}/${sequence.length}: ${sequence[index]}`);
    }
    setCurrentDigitIndex(index + 1);
    setShowingDigit(sequence[index]);
    hapticTrigger('light');
    
    // Show digit for 1 second, then hide for 0.5 seconds before next digit
    setTimeout(() => {
      setShowingDigit(null); // Hide digit
      setTimeout(() => {
        showDigitAtIndex(index + 1, sequence);
      }, 500); // 0.5 second gap
    }, 1000); // 1 second display
  };


  // Handle digit input
  const handleDigitInput = (digit) => {
    hapticTrigger('light');
    const newInput = [...userInput, digit];
    setUserInput(newInput);

    // Check if input is complete
    const expectedLength = currentRoundLength;
    if (newInput.length === expectedLength) {
      checkAnswer(newInput);
    }
  };

  // Check if answer is correct
  const checkAnswer = (input) => {
    let correct = false;
    
    switch (currentMode) {
      case 'forward':
        correct = JSON.stringify(input) === JSON.stringify(currentSequence);
        break;
      case 'backward':
        correct = JSON.stringify(input) === JSON.stringify([...currentSequence].reverse());
        break;
      case 'updating':
        const lastWindow = currentSequence.slice(-currentRoundLength);
        correct = JSON.stringify(input) === JSON.stringify(lastWindow);
        break;
    }

    // Set lightweight feedback
    setLastResult(correct ? 'correct' : 'incorrect');
    setShowFeedback(true);
    setTimeout(() => setShowFeedback(false), 2000); // Hide feedback after 2 seconds

    let newLength = currentLength;
    
    if (correct) {
      setScore(prev => prev + 1);
      const newConsecutiveCorrect = consecutiveCorrect + 1;
      setConsecutiveCorrect(newConsecutiveCorrect);
      setConsecutiveWrong(0);
      hapticTrigger('success');
      if (import.meta.env.DEV) {
        console.log(`Correct answer! Consecutive correct: ${newConsecutiveCorrect}`);
      }
      
      // Increase difficulty if 1 correct answer
      if (newConsecutiveCorrect >= 1) {
        if (currentMode === 'updating') {
          // For updating span, increase window size
          setUpdatingWindowSize(prev => Math.min(prev + 1, 5));
          if (import.meta.env.DEV) {
            console.log(`Updating window size increased to ${updatingWindowSize + 1}`);
          }
        } else {
          // For forward/backward, increase sequence length
          newLength = currentLength + 1;
          setCurrentLength(newLength);
          if (import.meta.env.DEV) {
            console.log(`Difficulty increased to ${newLength} digits`);
          }
        }
        setConsecutiveCorrect(0);
      }
    } else {
      const newConsecutiveWrong = consecutiveWrong + 1;
      setConsecutiveWrong(newConsecutiveWrong);
      setConsecutiveCorrect(0);
      hapticTrigger('error');
      if (import.meta.env.DEV) {
        console.log(`Wrong answer! Consecutive wrong: ${newConsecutiveWrong}`);
      }
      
      // Decrease difficulty if 1 wrong answer
      if (newConsecutiveWrong >= 1) {
        if (currentMode === 'updating') {
          // For updating span, decrease window size
          setUpdatingWindowSize(prev => Math.max(prev - 1, 2));
          if (import.meta.env.DEV) {
            console.log(`Updating window size decreased to ${Math.max(updatingWindowSize - 1, 2)}`);
          }
        } else {
          // For forward/backward, decrease sequence length
          newLength = Math.max(2, currentLength - 1);
          setCurrentLength(newLength);
          if (import.meta.env.DEV) {
            console.log(`Difficulty decreased to ${newLength} digits`);
          }
        }
        setConsecutiveWrong(0);
      }
    }

    const newRoundsInMode = roundsInMode + 1;
    setRoundsInMode(newRoundsInMode);
    if (import.meta.env.DEV) {
      console.log(`Round ${newRoundsInMode} completed in ${currentMode} mode with length ${newLength}`);
    }
    
    // Continue immediately without showing result screen
    setTimeout(() => {
      // Check if current mode is complete (10 rounds)
      if (newRoundsInMode >= maxRoundsPerMode) {
        if (import.meta.env.DEV) {
          console.log(`${currentMode} mode completed - ${maxRoundsPerMode} rounds finished`);
        }
        updateRecords();
        if (currentMode === 'forward') {
          setCurrentMode('backward');
          // Set backward difficulty (first time starts at 2, returning users start 1 below record)
          const backwardStart = backwardSpanRecord === 0 ? 2 : Math.max(2, backwardSpanRecord - 1);
          if (import.meta.env.DEV) {
            console.log(`Starting Backward with record: ${backwardSpanRecord}, will start at: ${backwardStart}`);
          }
          setCurrentLength(backwardStart);
          setGameState('rest');
          setRemainingTime(30);
        } else if (currentMode === 'backward') {
          setCurrentMode('updating');
          // Set updating window size (first time starts at 2, returning users start 1 below record)
          const updatingStart = updatingSpanRecord === 0 ? 2 : Math.max(2, updatingSpanRecord - 1);
          if (import.meta.env.DEV) {
            console.log(`Starting Updating with record: ${updatingSpanRecord}, will start at: ${updatingStart}`);
          }
          setUpdatingWindowSize(updatingStart);
          setGameState('rest');
          setRemainingTime(30);
        } else {
          completeSession();
        }
        setRoundsInMode(0);
        setConsecutiveCorrect(0);
        setConsecutiveWrong(0);
      } else {
        // Continue with same mode immediately, using the updated length
        startRound(newLength);
      }
    }, 500); // Just a brief pause
  };

  // Update records - save current ending difficulty for next session
  const updateRecords = () => {
    switch (currentMode) {
      case 'forward':
        if (import.meta.env.DEV) {
          console.log(`Saving Forward record: ${currentLength} (was: ${forwardSpanRecord})`);
        }
        setForwardSpanRecord(currentLength); // Save ending difficulty
        // Also save to localStorage immediately
        localStorage.setItem('forwardSpanRecord', currentLength.toString());
        break;
      case 'backward':
        if (import.meta.env.DEV) {
          console.log(`Saving Backward record: ${currentLength} (was: ${backwardSpanRecord})`);
        }
        setBackwardSpanRecord(currentLength); // Save ending difficulty
        localStorage.setItem('backwardSpanRecord', currentLength.toString());
        break;
      case 'updating':
        if (import.meta.env.DEV) {
          console.log(`Saving Updating record: ${updatingWindowSize} (was: ${updatingSpanRecord})`);
        }
        setUpdatingSpanRecord(updatingWindowSize); // Save ending difficulty
        localStorage.setItem('updatingSpanRecord', updatingWindowSize.toString());
        break;
    }
  };

  // Next mode
  const nextMode = () => {
    setCurrentRound(0);
    setRoundsInMode(0);
    // Use currentLength which should be already updated by mode switching
    startRound(currentLength);
  };

  // Complete session
  const completeSession = () => {
    const sessionTime = Math.floor((Date.now() - sessionStartTime) / 1000);
    setTotalSessions(prev => prev + 1);
    
    // Update daily streak
    const today = new Date().toDateString();
    if (lastSessionDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastSessionDate === yesterday.toDateString()) {
        setDailyStreak(prev => prev + 1);
      } else {
        setDailyStreak(1);
      }
      setLastSessionDate(today);
    }
    
    setGameState('complete');
    hapticTrigger('success');
  };

  // Reset to menu
  const resetToMenu = () => {
    setGameState('menu');
    setCurrentMode(null);
    setScore(0);
    setCurrentRound(0);
    setConsecutiveCorrect(0);
    setConsecutiveWrong(0);
  };

  // Clear input
  const clearInput = () => {
    setUserInput([]);
    hapticTrigger('light');
  };

  // Get current mode info
  const getModeInfo = () => {
    switch (currentMode) {
      case 'forward':
        return {
          title: 'Forward Span',
          description: 'Repeat digits in same order',
          color: 'blue',
          icon: '→'
        };
      case 'backward':
        return {
          title: 'Backward Span',
          description: 'Repeat digits in reverse order',
          color: 'emerald',
          icon: '←'
        };
      case 'updating':
        return {
          title: 'Updating Span',
          description: `Remember the last ${updatingWindowSize} digits`,
          color: 'violet',
          icon: '↻'
        };
      default:
        return { title: '', description: '', color: 'gray', icon: '' };
    }
  };

  const modeInfo = getModeInfo();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-6 relative">
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900 mb-1">Brain Training</h1>
            <p className="text-sm text-gray-600">Adaptive digit span training</p>
          </div>
          <button
            onClick={resetRecords}
            className="absolute top-6 right-4 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            reset
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 pb-20">
        {gameState === 'menu' && (
          <div className="space-y-4">
            {/* Stats Overview */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Your Progress</h2>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-blue-600 mb-1">{forwardSpanRecord}</div>
                  <div className="text-xs text-gray-600">Forward</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-green-600 mb-1">{backwardSpanRecord}</div>
                  <div className="text-xs text-gray-600">Backward</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-purple-600 mb-1">{updatingSpanRecord}</div>
                  <div className="text-xs text-gray-600">Updating</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-gray-900 mb-1">{totalSessions}</div>
                  <div className="text-xs text-gray-600">Sessions</div>
                </div>
              </div>
              {dailyStreak > 0 && (
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium">
                    <Zap className="w-3 h-3" />
                    {dailyStreak} day streak!
                  </div>
                </div>
              )}
            </div>

            {/* Training Description */}
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-gray-900">Training Modes</h2>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2.5 bg-blue-50 rounded-lg">
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium">1</div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Forward Span</div>
                    <div className="text-xs text-gray-600">Repeat digits in same order</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2.5 bg-green-50 rounded-lg">
                  <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-medium">2</div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Backward Span</div>
                    <div className="text-xs text-gray-600">Repeat digits in reverse order</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2.5 bg-purple-50 rounded-lg">
                  <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium">3</div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Updating Span</div>
                    <div className="text-xs text-gray-600">Remember last N digits (sliding window)</div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-xs text-gray-600 text-center">
                  <strong>30 rounds total</strong> • 10 rounds per mode
                </div>
              </div>
            </div>

            {/* Start Button */}
            <div className="pt-1">
              <EnhancedButton
                variant="primary"
                onClick={startTraining}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Training
              </EnhancedButton>
            </div>
          </div>
        )}


        {gameState === 'showing' && (
          <div className="text-center space-y-8">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">{modeInfo.title}</h2>
              <p className="text-gray-600">Watch the digits carefully</p>
              <div className="text-sm text-gray-500">
                {currentMode === 'updating' 
                  ? `Showing ${currentDigitIndex}/${totalSequenceLength} • Remember last ${updatingWindowSize}`
                  : `Length: ${currentRoundLength} digits`
                }
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-16">
              <div className="text-8xl font-bold text-gray-900 min-h-[120px] flex items-center justify-center">
                {showingDigit !== null ? showingDigit : ''}
              </div>
            </div>
          </div>
        )}

        {gameState === 'input' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">{modeInfo.title}</h2>
              <p className="text-gray-600">{modeInfo.description}</p>
              <div className="text-sm text-gray-500">
                Enter {currentRoundLength} digits • Round {roundsInMode + 1}/{maxRoundsPerMode}
              </div>
            </div>

            {/* Input Display */}
            <div className="space-y-6">
              <div className="flex justify-center items-center gap-3">
                {Array.from({ length: currentRoundLength }).map((_, index) => (
                  <div
                    key={index}
                    className={`w-14 h-14 border-2 rounded-xl flex items-center justify-center text-xl font-bold transition-colors ${
                      userInput[index] 
                        ? 'border-blue-300 bg-blue-50 text-blue-700' 
                        : 'border-gray-200 bg-gray-50 text-gray-400'
                    }`}
                  >
                    {userInput[index] || ''}
                  </div>
                ))}
              </div>

              {/* Number Pad */}
              <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                  <EnhancedButton
                    key={digit}
                    variant="outline"
                    onClick={() => handleDigitInput(digit)}
                    className="h-14 text-lg font-semibold border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all"
                    disabled={userInput.length >= currentRoundLength}
                  >
                    {digit}
                  </EnhancedButton>
                ))}
              </div>

              <div className="flex justify-center">
                <EnhancedButton
                  variant="outline"
                  onClick={clearInput}
                  className="px-6 py-2 border-gray-200 bg-white hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Clear
                </EnhancedButton>
              </div>
            </div>
          </div>
        )}


        {gameState === 'rest' && (
          <div className="text-center space-y-6">
            <div className="bg-blue-50 rounded-2xl p-8">
              <div className="text-6xl mb-4">☕</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Rest Time</h2>
              <p className="text-gray-600 mb-4">Take a breath before the next mode</p>
              <div className="text-4xl font-bold text-blue-600 mb-2">{remainingTime}s</div>
              <p className="text-sm text-gray-500">
                Next: {currentMode === 'forward' ? 'Backward Span' : 'Updating Span'}
              </p>
            </div>
          </div>
        )}

        {gameState === 'complete' && (
          <div className="text-center space-y-6">
            <div className="bg-green-50 rounded-2xl p-8">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Training Complete!</h2>
              <div className="text-gray-600 mb-6">
                <p>Well done! You've completed all 30 rounds.</p>
                <p className="font-semibold text-lg text-green-700 mt-2">Score: {score}/30</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-blue-600 mb-1">{forwardSpanRecord}</div>
                  <div className="text-sm text-gray-600">Forward</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-green-600 mb-1">{backwardSpanRecord}</div>
                  <div className="text-sm text-gray-600">Backward</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-purple-600 mb-1">{updatingSpanRecord}</div>
                  <div className="text-sm text-gray-600">Updating</div>
                </div>
              </div>
            </div>
            <EnhancedButton
              variant="primary"
              onClick={resetToMenu}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold transition-colors"
            >
              Back to Menu
            </EnhancedButton>
          </div>
        )}

        {/* Progress indicator for active session */}
        {gameState !== 'menu' && gameState !== 'complete' && gameState !== 'rest' && (
          <div className={`fixed bottom-24 left-1/2 transform -translate-x-1/2 rounded-full px-4 py-2 shadow-lg transition-all duration-300 ${
            showFeedback && lastResult === 'correct' 
              ? 'bg-green-100 border-green-300' 
              : showFeedback && lastResult === 'incorrect'
              ? 'bg-red-100 border-red-300'
              : 'bg-white/90 border-gray-200'
          }`}>
            <div className={`text-sm font-medium flex items-center gap-2 transition-colors ${
              showFeedback && lastResult === 'correct' 
                ? 'text-green-700' 
                : showFeedback && lastResult === 'incorrect'
                ? 'text-red-700'
                : 'text-gray-700'
            }`}>
              {showFeedback && (
                <span className="text-base">
                  {lastResult === 'correct' ? '✅' : '❌'}
                </span>
              )}
              {currentMode === 'forward' && 'Forward Span'} 
              {currentMode === 'backward' && 'Backward Span'}
              {currentMode === 'updating' && 'Updating Span'}
              <span className={showFeedback ? (lastResult === 'correct' ? 'text-green-600' : 'text-red-600') : 'text-gray-500'}>
                {gameState === 'input' ? roundsInMode + 1 : roundsInMode}/{maxRoundsPerMode}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

