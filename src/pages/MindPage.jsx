import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Play, Pause, Clock, TrendingUp, ArrowLeft, Sparkles } from 'lucide-react';
import { EnhancedButton, useHapticFeedback } from '../components';
import { useLocalStorage } from '../hooks/useLocalStorage';
import audioManager from '../utils/audioManager';

export default function MindPage() {
  const navigate = useNavigate();
  const { trigger: hapticTrigger } = useHapticFeedback();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayingSecond, setIsPlayingSecond] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [breathExerciseCount, setBreathExerciseCount] = useLocalStorage('breathExerciseCount', 0);
  const [secondMeditationCount, setSecondMeditationCount] = useLocalStorage('secondMeditationCount', 0);
  const [dailyQuote, setDailyQuote] = useState({
    content: "Peace comes from within. Do not seek it without.",
    author: "Buddha"
  });
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);



  const AUDIO_URL = 'https://rsfkkiuoutgacrblubtt.supabase.co/storage/v1/object/sign/meditation/Patrick-Kozakiewicz-Short-Body-Scan.mp3?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82N2RkOTBiMy03MDE3LTQyZTYtODhlMS0wMzk5MGJlNWE4MTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtZWRpdGF0aW9uL1BhdHJpY2stS296YWtpZXdpY3otU2hvcnQtQm9keS1TY2FuLm1wMyIsImlhdCI6MTc1NTI0NTg0MCwiZXhwIjoxOTEyOTI1ODQwfQ.ZEvMe4AuhEcENDxSv2iNjDfK_ypwPjvS9I8nrzl8Wyc';
  const SECOND_AUDIO_URL = 'https://rsfkkiuoutgacrblubtt.supabase.co/storage/v1/object/sign/meditation/Meditation-1-Mindfulness-of-Body-and-Breath.mp3?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82N2RkOTBiMy03MDE3LTQyZTYtODhlMS0wMzk5MGJlNWE4MTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtZWRpdGF0aW9uL01lZGl0YXRpb24tMS1NaW5kZnVsbmVzcy1vZi1Cb2R5LWFuZC1CcmVhdGgubXAzIiwiaWF0IjoxNzU1MjQ2NTI3LCJleHAiOjE5MTI5MjY1Mjd9.pu5qcQfCyGBka3JRArNqUQXFp13GGh5RiJzcNdR5CyY';
  const MOVEMENT_AUDIO_URL = 'https://rsfkkiuoutgacrblubtt.supabase.co/storage/v1/object/sign/meditation/Movement-with-Rebecca-Crane-10-min.mp3?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82N2RkOTBiMy03MDE3LTQyZTYtODhlMS0wMzk5MGJlNWE4MTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtZWRpdGF0aW9uL01vdmVtZW50LXdpdGgtUmViZWNjYS1DcmFuZS0xMC1taW4ubXAzIiwiaWF0IjoxNzU1MjQ3NjA2LCJleHAiOjE5MTI5Mjc2MDZ9.uVntCBeQbaA0JpW1Tu717Ekb95pXVkg4RqDzK4wThs8';

  const handleBreathExerciseStart = async () => {
    try {
      hapticTrigger('light');
      setIsPlaying(true);
      
      // Stop other meditations if playing
      if (isPlayingSecond) {
        audioManager.stopAudio();
        setIsPlayingSecond(false);
      }
      
      await audioManager.playAudio(AUDIO_URL, { 
        volume: 0.8,
        onEnd: handleAudioComplete
      });
      
      console.log('Breath exercise started');
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  const handleBreathExercisePause = () => {
    hapticTrigger('light');
    setIsPlaying(false);
    audioManager.pauseAudio();
    console.log('Breath exercise paused');
  };

  const handleBreathExerciseStop = () => {
    hapticTrigger('light');
    setIsPlaying(false);
    audioManager.stopAudio();
    console.log('Breath exercise stopped');
  };

  const handleAudioComplete = () => {
    setIsPlaying(false);
    setBreathExerciseCount(prev => prev + 1);
    console.log('Breath exercise completed, total sessions:', breathExerciseCount + 1);
  };

  const handleSecondMeditationStart = async () => {
    try {
      hapticTrigger('light');
      setIsPlayingSecond(true);
      
      if (isPlaying) {
        audioManager.stopAudio();
        setIsPlaying(false);
      }
      
      await audioManager.playAudio(SECOND_AUDIO_URL, { 
        volume: 0.8,
        onEnd: handleSecondMeditationComplete
      });
      
      console.log('Second meditation started');
    } catch (error) {
      console.error('Error playing second audio:', error);
      setIsPlayingSecond(false);
    }
  };

  const handleSecondMeditationPause = () => {
    hapticTrigger('light');
    setIsPlayingSecond(false);
    audioManager.pauseAudio();
    console.log('Second meditation paused');
  };

  const handleSecondMeditationStop = () => {
    hapticTrigger('light');
    setIsPlayingSecond(false);
    audioManager.stopAudio();
    console.log('Second meditation stopped');
  };

  const handleSecondMeditationComplete = () => {
    setIsPlayingSecond(false);
    setSecondMeditationCount(prev => prev + 1);
    console.log('Second meditation completed, total sessions:', secondMeditationCount + 1);
  };

  // Fetch daily inspiration quote from local file
  const fetchDailyQuote = async () => {
    try {
      setIsLoadingQuote(true);
      // Load quotes from local JSON file
      const response = await fetch('/meditation-quotes.json');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const quotes = await response.json();
      
      if (quotes && quotes.length > 0) {
        // Randomly select a quote
        const randomIndex = Math.floor(Math.random() * quotes.length);
        const selectedQuote = quotes[randomIndex];
        
        setDailyQuote({
          content: selectedQuote.content,
          author: selectedQuote.author || "Unknown"
        });
      }
    } catch (error) {
      console.log('Error loading quotes, using default');
      // Keep the default quote if loading fails
    } finally {
      setIsLoadingQuote(false);
    }
  };

  // Fetch quote on component mount
  React.useEffect(() => {
    fetchDailyQuote();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-xl font-semibold text-slate-800">Mind & Meditation</h1>
              <p className="text-sm text-slate-500">Find your inner peace</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-4">
        {/* Daily Inspiration */}
        <div className="text-center mb-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <Heart className="w-6 h-6 text-rose-500" />
                <h3 className="text-xl font-bold text-slate-800">Daily Quote</h3>
              </div>
              {!isLoadingQuote && dailyQuote.author && (
                <span className="text-sm text-slate-500">- {dailyQuote.author}</span>
              )}
            </div>
            {isLoadingQuote ? (
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-3 bg-slate-200 rounded animate-pulse w-3/4 mx-auto"></div>
              </div>
            ) : (
              <>
                <p className="text-slate-600 italic text-base text-left">
                  {dailyQuote.content}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Meditation Sessions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Body Scan Session */}
          <div className="group bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-white/50 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                <img 
                  src="/body_scan.jpg" 
                  alt="Body Scan" 
                  className="w-full h-full object-cover"
                />
              </div>
              
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Body Scan</h3>
              <p className="text-sm text-slate-600 mb-1">Patrick Kozakiewicz</p>
              <p className="text-xs text-slate-500 mb-4">Gentle body awareness practice</p>
              
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="flex items-center space-x-1 text-xs text-slate-500">
                  <Clock className="w-3 h-3" />
                  <span>10 min</span>
                </div>
                <div className="flex items-center space-x-1 text-xs text-slate-500">
                  <TrendingUp className="w-3 h-3" />
                  <span>{breathExerciseCount}</span>
                </div>
              </div>

              <div className="space-y-2">
                {!isPlaying ? (
                  <EnhancedButton
                    variant="primary"
                    onClick={handleBreathExerciseStart}
                    size="sm"
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border-0 text-white shadow-md"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Session
                  </EnhancedButton>
                ) : (
                  <div className="space-y-2">
                    <EnhancedButton
                      variant="outline"
                      onClick={handleBreathExercisePause}
                      size="sm"
                      className="w-full"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </EnhancedButton>
                    <EnhancedButton
                      variant="outline"
                      onClick={handleBreathExerciseStop}
                      size="sm"
                      className="w-full"
                    >
                      Stop
                    </EnhancedButton>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Body and Breath Session */}
          <div className="group bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-white/50 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                <img 
                  src="/breathe_outdoor.jpg" 
                  alt="Body and Breath" 
                  className="w-full h-full object-cover"
                />
              </div>
              
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Body and Breath</h3>
              <p className="text-sm text-slate-600 mb-1">Mark Williams</p>
              <p className="text-xs text-slate-500 mb-4">Present moment awareness</p>
              
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="flex items-center space-x-1 text-xs text-slate-500">
                  <Clock className="w-3 h-3" />
                  <span>10 min</span>
                </div>
                <div className="flex items-center space-x-1 text-xs text-slate-500">
                  <TrendingUp className="w-3 h-3" />
                  <span>{secondMeditationCount}</span>
                </div>
              </div>

              <div className="space-y-2">
                {!isPlayingSecond ? (
                  <EnhancedButton
                    variant="primary"
                    onClick={handleSecondMeditationStart}
                    size="sm"
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border-0 text-white shadow-md"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Session
                  </EnhancedButton>
                ) : (
                  <div className="space-y-2">
                    <EnhancedButton
                      variant="outline"
                      onClick={handleSecondMeditationPause}
                      size="sm"
                      className="w-full"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </EnhancedButton>
                    <EnhancedButton
                      variant="outline"
                      onClick={handleSecondMeditationStop}
                      size="sm"
                      className="w-full"
                    >
                      Stop
                    </EnhancedButton>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mindful Movement Session */}
          <div className="group bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-white/50 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                <img 
                  src="/movement.png" 
                  alt="Mindful Movement" 
                  className="w-full h-full object-cover"
                />
              </div>
              
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Mindful Movement</h3>
              <p className="text-sm text-slate-600 mb-1">Rebecca Crane</p>
              <p className="text-xs text-slate-500 mb-4">Gentle body reconnection</p>
              
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="flex items-center space-x-1 text-xs text-slate-500">
                  <Clock className="w-3 h-3" />
                  <span>10 min</span>
                </div>
                <div className="flex items-center space-x-1 text-xs text-slate-500">
                  <TrendingUp className="w-3 h-3" />
                  <span>0</span>
                </div>
              </div>

              <EnhancedButton
                variant="primary"
                size="sm"
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 border-0 text-white shadow-md"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Session
              </EnhancedButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
