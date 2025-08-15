import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, Plus, Minus, Target, TrendingUp, Calendar } from 'lucide-react';
import { EnhancedButton, useHapticFeedback } from '../components';

export default function DietPage() {
  const navigate = useNavigate();
  const { trigger: hapticTrigger } = useHapticFeedback();
  const [waterIntake, setWaterIntake] = useState(6);

  const handleWaterAdd = () => {
    hapticTrigger('light');
    setWaterIntake(prev => Math.min(prev + 1, 12));
  };

  const handleWaterRemove = () => {
    hapticTrigger('light');
    setWaterIntake(prev => Math.max(prev - 1, 0));
  };

  const handleBackToHome = () => {
    hapticTrigger('light');
    navigate('/');
  };

  // Mock dietary recommendations
  const dietaryRecommendations = [
    {
      id: 1,
      category: 'Breakfast',
      foods: ['Oatmeal with berries', 'Green tea', 'Nuts and seeds'],
      time: '7:00 AM',
      color: 'bg-yellow-100 text-yellow-600'
    },
    {
      id: 2,
      category: 'Lunch',
      foods: ['Brown rice', 'Steamed vegetables', 'Lean protein'],
      time: '12:00 PM',
      color: 'bg-green-100 text-green-600'
    },
    {
      id: 3,
      category: 'Dinner',
      foods: ['Light soup', 'Whole grains', 'Herbal tea'],
      time: '6:00 PM',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      id: 4,
      category: 'Snacks',
      foods: ['Fresh fruits', 'Yogurt', 'Dark chocolate'],
      time: '3:00 PM',
      color: 'bg-purple-100 text-purple-600'
    }
  ];

  // Mock nutrition goals
  const nutritionGoals = [
    { name: 'Calories', current: 1850, target: 2000, unit: 'kcal' },
    { name: 'Protein', current: 75, target: 80, unit: 'g' },
    { name: 'Carbs', current: 220, target: 250, unit: 'g' },
    { name: 'Fat', current: 65, target: 70, unit: 'g' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Nutrition & Diet</h1>
          <p className="text-gray-600">Track your nutrition and get personalized recommendations</p>
        </div>

        {/* Water Intake Tracker */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
          <div className="text-center">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Coffee className="w-12 h-12 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Daily Water Intake</h2>
            <p className="text-gray-600 mb-4">Stay hydrated for better health</p>
            
            <div className="flex items-center justify-center space-x-4 mb-4">
              <button
                onClick={handleWaterRemove}
                className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"
              >
                <Minus className="w-6 h-6 text-red-600" />
              </button>
              
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600">{waterIntake}</div>
                <div className="text-sm text-gray-500">Glasses</div>
              </div>
              
              <button
                onClick={handleWaterAdd}
                className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center hover:bg-green-200 transition-colors"
              >
                <Plus className="w-6 h-6 text-green-600" />
              </button>
            </div>
            
            <div className="text-sm text-gray-500">
              Goal: 8 glasses • {Math.round((waterIntake / 8) * 100)}% complete
            </div>
          </div>
        </div>

        {/* Nutrition Goals */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Nutrition Goals</h3>
          <div className="space-y-4">
            {nutritionGoals.map((goal) => {
              const percentage = Math.round((goal.current / goal.target) * 100);
              return (
                <div key={goal.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{goal.name}</span>
                    <span className="text-gray-500">
                      {goal.current}/{goal.target} {goal.unit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        percentage >= 80 ? 'bg-green-500' : 
                        percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dietary Recommendations */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Recommendations</h3>
          <div className="space-y-4">
            {dietaryRecommendations.map((meal) => (
              <div key={meal.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{meal.category}</h4>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>{meal.time}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {meal.foods.map((food, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                      <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                      <span>{food}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <EnhancedButton
              variant="primary"
              onClick={() => console.log('Log meal')}
              fullWidth
              size="lg"
            >
              Log Today's Meals
            </EnhancedButton>
            
            <EnhancedButton
              variant="outline"
              onClick={() => console.log('View plan')}
              fullWidth
              size="lg"
            >
              View Meal Plan
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
