import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Play, Pause, Clock, TrendingUp, ArrowLeft, Sparkles } from 'lucide-react';
import { EnhancedButton, useHapticFeedback } from '../components';
import { useLocalStorage } from '../hooks/useLocalStorage';
import audioManager from '../utils/audioManager';
import { AUDIO_CONFIG } from '../lib/audioConfig';

export default function MindPage() {
  const navigate = useNavigate();
  const { trigger: hapticTrigger } = useHapticFeedback();
  const [playingSession, setPlayingSession] = useState(null);
  const [breathExerciseCount, setBreathExerciseCount] = useLocalStorage('breathExerciseCount', 0);
  const [secondMeditationCount, setSecondMeditationCount] = useLocalStorage('secondMeditationCount', 0);
  const [movementCount, setMovementCount] = useLocalStorage('movementCount', 0);
  const [vipassanaCount, setVipassanaCount] = useLocalStorage('vipassanaCount', 0);

  const sessionCounts = useMemo(() => ({
    BODY_SCAN: breathExerciseCount,
    BODY_BREATH: secondMeditationCount,
    MOVEMENT: movementCount,
    VIPASSANA: vipassanaCount
  }), [breathExerciseCount, secondMeditationCount, movementCount, vipassanaCount]);

  const setSessionCounts = {
    BODY_SCAN: setBreathExerciseCount,
    BODY_BREATH: setSecondMeditationCount,
    MOVEMENT: setMovementCount,
    VIPASSANA: setVipassanaCount
  };

  // Consolidated audio handlers
  const handleStart = useCallback(async (sessionKey) => {
    try {
      hapticTrigger('light');
      
      if (playingSession) {
        audioManager.stopAudio();
      }
      
      setPlayingSession(sessionKey);
      const config = AUDIO_CONFIG[sessionKey];
      
      await audioManager.playAudio(config.url, { 
        volume: 0.8,
        onEnd: () => handleComplete(sessionKey)
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(`Error playing ${sessionKey} audio:`, error);
      }
      setPlayingSession(null);
    }
  }, [playingSession, hapticTrigger]);

  const handlePause = useCallback(() => {
    hapticTrigger('light');
    audioManager.pauseAudio();
  }, [hapticTrigger]);

  const handleStop = useCallback(() => {
    hapticTrigger('light');
    audioManager.stopAudio();
    setPlayingSession(null);
  }, [hapticTrigger]);

  const handleComplete = useCallback((sessionKey) => {
    setPlayingSession(null);
    const setCount = setSessionCounts[sessionKey];
    if (setCount) {
      setCount(prev => prev + 1);
    }
  }, [setSessionCounts]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-xl font-semibold text-slate-800">Meditation</h1>
              <p className="text-sm text-slate-500">Find your inner peace</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-4">
        {/* Meditation Sessions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Body Scan Session */}
          <div className="group bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-sm rounded-3xl overflow-hidden border border-blue-100/50 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.02]">
            <div className="relative">
              <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center overflow-hidden">
                <img 
                  src={AUDIO_CONFIG.BODY_SCAN.image} 
                  alt={AUDIO_CONFIG.BODY_SCAN.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              <div className="absolute top-4 left-4">
                <div className="bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-white font-light">
                  {AUDIO_CONFIG.BODY_SCAN.instructor}
                </div>
              </div>
              <div className="absolute top-4 right-4">
                <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-slate-700 font-medium">
                  {AUDIO_CONFIG.BODY_SCAN.duration}
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="text-center mb-4">
                <h3 className="text-xl font-light text-slate-700 mb-3 tracking-wide">{AUDIO_CONFIG.BODY_SCAN.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">Gentle body awareness practice</p>
              </div>
              
              <div className="space-y-3">
                {playingSession !== 'BODY_SCAN' ? (
                  <EnhancedButton
                    variant="primary"
                    onClick={() => handleStart('BODY_SCAN')}
                    size="sm"
                    className="w-full bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 border-0 text-white shadow-md py-3 rounded-2xl font-light transition-all duration-300"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Session
                  </EnhancedButton>
                ) : (
                  <div className="space-y-3">
                    <EnhancedButton
                      variant="outline"
                      onClick={handlePause}
                      size="sm"
                      className="w-full py-3 rounded-2xl font-light border-blue-200 text-blue-600 hover:bg-blue-50 transition-all duration-300"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </EnhancedButton>
                    <EnhancedButton
                      variant="outline"
                      onClick={handleStop}
                      size="sm"
                      className="w-full py-3 rounded-2xl font-light border-blue-200 text-blue-600 hover:bg-blue-50 transition-all duration-300"
                    >
                      Stop
                    </EnhancedButton>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-center mt-4">
                {sessionCounts.BODY_SCAN > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-slate-500">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-light">{sessionCounts.BODY_SCAN} sessions</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Body and Breath Session */}
          <div className="group bg-gradient-to-br from-emerald-50/80 to-teal-50/80 backdrop-blur-sm rounded-3xl overflow-hidden border border-emerald-100/50 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.02]">
            <div className="relative">
              <div className="w-full h-48 bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center overflow-hidden">
                <img 
                  src={AUDIO_CONFIG.BODY_BREATH.image} 
                  alt={AUDIO_CONFIG.BODY_BREATH.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              <div className="absolute top-4 left-4">
                <div className="bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-white font-light">
                  {AUDIO_CONFIG.BODY_BREATH.instructor}
                </div>
              </div>
              <div className="absolute top-4 right-4">
                <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-slate-700 font-medium">
                  {AUDIO_CONFIG.BODY_BREATH.duration}
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="text-center mb-4">
                <h3 className="text-xl font-light text-slate-700 mb-3 tracking-wide">{AUDIO_CONFIG.BODY_BREATH.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">Present moment awareness</p>
              </div>
              
              <div className="space-y-3">
                {playingSession !== 'BODY_BREATH' ? (
                  <EnhancedButton
                    variant="primary"
                    onClick={() => handleStart('BODY_BREATH')}
                    size="sm"
                    className="w-full bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 border-0 text-white shadow-md py-3 rounded-2xl font-light transition-all duration-300"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Session
                  </EnhancedButton>
                ) : (
                  <div className="space-y-3">
                    <EnhancedButton
                      variant="outline"
                      onClick={handlePause}
                      size="sm"
                      className="w-full py-3 rounded-2xl font-light border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-all duration-300"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </EnhancedButton>
                    <EnhancedButton
                      variant="outline"
                      onClick={handleStop}
                      size="sm"
                      className="w-full py-3 rounded-2xl font-light border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-all duration-300"
                    >
                      Stop
                    </EnhancedButton>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-center mt-4">
                {sessionCounts.BODY_BREATH > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-slate-500">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-light">{sessionCounts.BODY_BREATH} sessions</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mindful Movement Session */}
          <div className="group bg-gradient-to-br from-violet-50/80 to-purple-50/80 backdrop-blur-sm rounded-3xl overflow-hidden border border-violet-100/50 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.02]">
            <div className="relative">
              <div className="w-full h-48 bg-gradient-to-br from-violet-100 to-violet-200 flex items-center justify-center overflow-hidden">
                <img 
                  src={AUDIO_CONFIG.MOVEMENT.image} 
                  alt={AUDIO_CONFIG.MOVEMENT.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              <div className="absolute top-4 left-4">
                <div className="bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-white font-light">
                  {AUDIO_CONFIG.MOVEMENT.instructor}
                </div>
              </div>
              <div className="absolute top-4 right-4">
                <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-slate-700 font-medium">
                  {AUDIO_CONFIG.MOVEMENT.duration}
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="text-center mb-4">
                <h3 className="text-xl font-light text-slate-700 mb-3 tracking-wide">{AUDIO_CONFIG.MOVEMENT.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">Gentle body reconnection</p>
              </div>
              
              <div className="space-y-3">
                {playingSession !== 'MOVEMENT' ? (
                  <EnhancedButton
                    variant="primary"
                    onClick={() => handleStart('MOVEMENT')}
                    size="sm"
                    className="w-full bg-gradient-to-r from-violet-400 to-violet-500 hover:from-violet-500 hover:to-violet-600 border-0 text-white shadow-md py-3 rounded-2xl font-light transition-all duration-300"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Session
                  </EnhancedButton>
                ) : (
                  <div className="space-y-3">
                    <EnhancedButton
                      variant="outline"
                      onClick={handlePause}
                      size="sm"
                      className="w-full py-3 rounded-2xl font-light border-violet-200 text-violet-600 hover:bg-violet-50 transition-all duration-300"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </EnhancedButton>
                    <EnhancedButton
                      variant="outline"
                      onClick={handleStop}
                      size="sm"
                      className="w-full py-3 rounded-2xl font-light border-violet-200 text-violet-600 hover:bg-violet-50 transition-all duration-300"
                    >
                      Stop
                    </EnhancedButton>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-center mt-4">
                {sessionCounts.MOVEMENT > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-slate-500">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-light">{sessionCounts.MOVEMENT} sessions</span>
                  </div>
                )}
              </div>
              
            </div>
          </div>

          {/* Vipassana Meditation Session */}
          <div className="group bg-gradient-to-br from-amber-50/80 to-orange-50/80 backdrop-blur-sm rounded-3xl overflow-hidden border border-amber-100/50 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.02]">
            <div className="relative">
              <div className="w-full h-48 bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center overflow-hidden">
                <img 
                  src={AUDIO_CONFIG.VIPASSANA.image} 
                  alt={AUDIO_CONFIG.VIPASSANA.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              <div className="absolute top-4 left-4">
                <div className="bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-white font-light">
                  {AUDIO_CONFIG.VIPASSANA.instructor}
                </div>
              </div>
              <div className="absolute top-4 right-4">
                <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-slate-700 font-medium">
                  {AUDIO_CONFIG.VIPASSANA.duration}
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="text-center mb-4">
                <h3 className="text-xl font-light text-slate-700 mb-3 tracking-wide">{AUDIO_CONFIG.VIPASSANA.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">Breath observation practice</p>
              </div>
              
              <div className="space-y-3">
                {playingSession !== 'VIPASSANA' ? (
                  <EnhancedButton
                    variant="primary"
                    onClick={() => handleStart('VIPASSANA')}
                    size="sm"
                    className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 border-0 text-white shadow-md py-3 rounded-2xl font-light transition-all duration-300"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Session
                  </EnhancedButton>
                ) : (
                  <div className="space-y-3">
                    <EnhancedButton
                      variant="outline"
                      onClick={handlePause}
                      size="sm"
                      className="w-full py-3 rounded-2xl font-light border-amber-200 text-amber-600 hover:bg-amber-50 transition-all duration-300"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </EnhancedButton>
                    <EnhancedButton
                      variant="outline"
                      onClick={handleStop}
                      size="sm"
                      className="w-full py-3 rounded-2xl font-light border-amber-200 text-amber-600 hover:bg-amber-50 transition-all duration-300"
                    >
                      Stop
                    </EnhancedButton>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-center mt-4">
                {sessionCounts.VIPASSANA > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-slate-500">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-light">{sessionCounts.VIPASSANA} sessions</span>
                  </div>
                )}
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
