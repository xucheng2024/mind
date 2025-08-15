import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Play, Pause, Clock, TrendingUp } from 'lucide-react';
import { EnhancedButton, useHapticFeedback } from '../components';

export default function MindPage() {
  const navigate = useNavigate();
  const { trigger: hapticTrigger } = useHapticFeedback();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const handleMeditationStart = () => {
    hapticTrigger('light');
    setIsPlaying(true);
    console.log('Meditation started');
  };

  const handleMeditationPause = () => {
    hapticTrigger('light');
    setIsPlaying(false);
    console.log('Meditation paused');
  };

  const handleBackToHome = () => {
    hapticTrigger('light');
    navigate('/');
  };

  // Mock mindfulness activities
  const mindfulnessActivities = [
    {
      id: 1,
      title: 'Breathing Exercise',
      duration: '5 min',
      description: 'Simple breathing technique for stress relief',
      icon: '🫁',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      id: 2,
      title: 'Body Scan',
      duration: '10 min',
      description: 'Progressive muscle relaxation',
      icon: '🧘',
      color: 'bg-green-100 text-green-600'
    },
    {
      id: 3,
      title: 'Mindful Walking',
      duration: '15 min',
      description: 'Walking meditation in nature',
      icon: '🚶',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      id: 4,
      title: 'Loving Kindness',
      duration: '8 min',
      description: 'Compassion meditation practice',
      icon: '💝',
      color: 'bg-pink-100 text-pink-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mind Wellness</h1>
          <p className="text-gray-600">Nurture your mental health and inner peace</p>
        </div>

        {/* Current Session */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
          <div className="text-center">
            <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-12 h-12 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Daily Meditation</h2>
            <p className="text-gray-600 mb-4">Take a moment to center yourself</p>
            
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">15</div>
                <div className="text-sm text-gray-500">Minutes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">7</div>
                <div className="text-sm text-gray-500">Day Streak</div>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-3">
              {!isPlaying ? (
                <EnhancedButton
                  variant="primary"
                  onClick={handleMeditationStart}
                  size="lg"
                  className="flex items-center space-x-2"
                >
                  <Play className="w-4 h-4" />
                  <span>Start</span>
                </EnhancedButton>
              ) : (
                <EnhancedButton
                  variant="outline"
                  onClick={handleMeditationPause}
                  size="lg"
                  className="flex items-center space-x-2"
                >
                  <Pause className="w-4 h-4" />
                  <span>Pause</span>
                </EnhancedButton>
              )}
            </div>
          </div>
        </div>

        {/* Mindfulness Activities */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mindfulness Activities</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mindfulnessActivities.map((activity) => (
              <div key={activity.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${activity.color}`}>
                    {activity.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{activity.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{activity.duration}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Stats */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Progress</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">85%</div>
              <div className="text-sm text-gray-600">Weekly Goal</div>
            </div>
            <div className="text-center p-4 bg-pink-50 rounded-lg">
              <Heart className="w-8 h-8 text-pink-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-pink-600">12</div>
              <div className="text-sm text-gray-600">Sessions</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <EnhancedButton
              variant="primary"
              onClick={() => console.log('Schedule session')}
              fullWidth
              size="lg"
            >
              Schedule Session
            </EnhancedButton>
            
            <EnhancedButton
              variant="outline"
              onClick={handleBackToHome}
              fullWidth
              size="lg"
            >
              Back to Home
            </EnhancedButton>
          </div>
        </div>
      </div>
    </div>
  );
}
