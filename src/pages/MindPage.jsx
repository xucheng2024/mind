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
        <div className="mb-6">
          <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-3xl p-6 border border-indigo-200/30 shadow-lg">
            {isLoadingQuote ? (
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-3 bg-slate-200 rounded animate-pulse w-3/4"></div>
              </div>
            ) : (
              <>
                <p className="text-slate-700 text-xl leading-relaxed font-extralight tracking-wide italic">
                  "{dailyQuote.content}"
                  {dailyQuote.author && (
                    <span className="block mt-4 text-sm text-slate-500 font-light tracking-wider">— {dailyQuote.author}</span>
                  )}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Meditation Sessions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Body Scan Session */}
          <div className="group bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-sm rounded-3xl overflow-hidden border border-blue-100/50 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.02]">
            <div className="relative">
              <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center overflow-hidden">
                <img 
                  src="/body_scan.jpg" 
                  alt="Body Scan" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              <div className="absolute top-4 left-4">
                <div className="bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-white font-light">
                  Patrick Kozakiewicz
                </div>
              </div>
              <div className="absolute top-4 right-4">
                <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-slate-700 font-medium">
                  10 min
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="text-center mb-4">
                <h3 className="text-xl font-light text-slate-700 mb-3 tracking-wide">Body Scan</h3>
                <p className="text-sm text-slate-400 leading-relaxed">Gentle body awareness practice</p>
              </div>
              
              <div className="space-y-3">
                {!isPlaying ? (
                  <EnhancedButton
                    variant="primary"
                    onClick={handleBreathExerciseStart}
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
                      onClick={handleBreathExercisePause}
                      size="sm"
                      className="w-full py-3 rounded-2xl font-light border-blue-200 text-blue-600 hover:bg-blue-50 transition-all duration-300"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </EnhancedButton>
                    <EnhancedButton
                      variant="outline"
                      onClick={handleBreathExerciseStop}
                      size="sm"
                      className="w-full py-3 rounded-2xl font-light border-blue-200 text-blue-600 hover:bg-blue-50 transition-all duration-300"
                    >
                      Stop
                    </EnhancedButton>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-center mt-4">
                {breathExerciseCount > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-slate-500">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-light">{breathExerciseCount} sessions</span>
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
                  src="/breathe_outdoor.jpg" 
                  alt="Body and Breath" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              <div className="absolute top-4 left-4">
                <div className="bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-white font-light">
                  Mark Williams
                </div>
              </div>
              <div className="absolute top-4 right-4">
                <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-slate-700 font-medium">
                  10 min
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="text-center mb-4">
                <h3 className="text-xl font-light text-slate-700 mb-3 tracking-wide">Body and Breath</h3>
                <p className="text-sm text-slate-400 leading-relaxed">Present moment awareness</p>
              </div>
              
              <div className="space-y-3">
                {!isPlayingSecond ? (
                  <EnhancedButton
                    variant="primary"
                    onClick={handleSecondMeditationStart}
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
                      onClick={handleSecondMeditationPause}
                      size="sm"
                      className="w-full py-3 rounded-2xl font-light border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-all duration-300"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </EnhancedButton>
                    <EnhancedButton
                      variant="outline"
                      onClick={handleSecondMeditationStop}
                      size="sm"
                      className="w-full py-3 rounded-2xl font-light border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-all duration-300"
                    >
                      Stop
                    </EnhancedButton>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-center mt-4">
                {secondMeditationCount > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-slate-500">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-light">{secondMeditationCount} sessions</span>
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
                  src="/movement.png" 
                  alt="Mindful Movement" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              <div className="absolute top-4 left-4">
                <div className="bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-white font-light">
                  Rebecca Crane
                </div>
              </div>
              <div className="absolute top-4 right-4">
                <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-slate-700 font-medium">
                  10 min
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="text-center mb-4">
                <h3 className="text-xl font-light text-slate-700 mb-3 tracking-wide">Mindful Movement</h3>
                <p className="text-sm text-slate-400 leading-relaxed">Gentle body reconnection</p>
              </div>
              
              <EnhancedButton
                variant="primary"
                size="sm"
                className="w-full bg-gradient-to-r from-violet-400 to-violet-500 hover:from-violet-500 hover:to-violet-600 border-0 text-white shadow-md py-3 rounded-2xl font-light transition-all duration-300"
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
