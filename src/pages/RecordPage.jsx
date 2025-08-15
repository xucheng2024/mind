import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight, Plus, Check, X } from 'lucide-react';
import { EnhancedButton, useHapticFeedback, TextArea } from '../components';

export default function RecordPage() {
  const navigate = useNavigate();
  const { trigger: hapticTrigger } = useHapticFeedback();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [formData, setFormData] = useState({
    mood: '',
    sleepQuality: '',
    symptoms: [],
    sexualActivity: '',
    vitals: {
      height: '',
      weight: '',
      bloodPressure: { systolic: '', diastolic: '' },
      heartRate: '',
      bloodOxygen: '',
      bloodGlucose: ''
    },
    menstrual: {
      isMenstruating: false,
      flow: '',
      pain: ''
    },
    notes: ''
  });

  // Auto-save to localStorage whenever formData changes
  useEffect(() => {
    const dateKey = selectedDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format in local timezone
    
    // Check if there's actual meaningful data to save
    const hasData = (
      formData.mood || 
      formData.sleepQuality || 
      formData.symptoms.length > 0 || 
      formData.sexualActivity || 
      formData.vitals.height || 
      formData.vitals.weight || 
      formData.vitals.bloodPressure.systolic || 
      formData.vitals.bloodPressure.diastolic || 
      formData.vitals.heartRate || 
      formData.vitals.bloodOxygen || 
      formData.vitals.bloodGlucose || 
      formData.menstrual.isMenstruating || 
      formData.menstrual.flow || 
      formData.menstrual.pain || 
      formData.notes
    );
    
    if (hasData) {
      try {
        localStorage.setItem(`healthRecord_${dateKey}`, JSON.stringify(formData));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    } else {
      // Remove the record if no meaningful data exists
      try {
        localStorage.removeItem(`healthRecord_${dateKey}`);
      } catch (error) {
        console.error('Error removing from localStorage:', error);
      }
    }
  }, [formData, selectedDate]);

  // Load data from localStorage when date changes
  useEffect(() => {
    const dateKey = selectedDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format in local timezone
    loadFormDataFromStorage(dateKey);
  }, [selectedDate]);

  // Calendar navigation
  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Generate calendar days
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    
    // Add previous month's days
    for (let i = startingDay - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false, hasRecord: false });
    }
    
    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month, i);
      const dateKey = currentDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format in local timezone
      let hasRecord = false;
      
      try {
        const savedData = localStorage.getItem(`healthRecord_${dateKey}`);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          // Only show green dot if there's actual data, not just empty form
          hasRecord = parsedData && (
            parsedData.mood || 
            parsedData.sleepQuality || 
            parsedData.symptoms.length > 0 || 
            parsedData.sexualActivity || 
            parsedData.habits.length > 0 || 
            parsedData.vitals.height || 
            parsedData.vitals.weight || 
            parsedData.vitals.bloodPressure.systolic || 
            parsedData.vitals.bloodPressure.diastolic || 
            parsedData.vitals.heartRate || 
            parsedData.vitals.bloodOxygen || 
            parsedData.vitals.bloodGlucose || 
            parsedData.menstrual.isMenstruating || 
            parsedData.menstrual.flow || 
            parsedData.menstrual.pain || 
            parsedData.notes
          );
        } else {
          hasRecord = false;
        }
      } catch (error) {
        console.error('Error checking localStorage for date:', dateKey, error);
        hasRecord = false;
      }
      
      days.push({ 
        date: currentDate, 
        isCurrentMonth: true, 
        hasRecord,
        isToday: currentDate.toDateString() === new Date().toDateString()
      });
    }
    
    // Add next month's days to complete the grid
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({ date: nextDate, isCurrentMonth: false, hasRecord: false });
    }
    
    return days;
  };

  const handleDateClick = (day) => {
    if (day.isCurrentMonth) {
      hapticTrigger('light');
      setSelectedDate(day.date);
      
      // Immediately load or reset form when switching dates
      const dateKey = day.date.toLocaleDateString('en-CA'); // YYYY-MM-DD format in local timezone
      loadFormDataFromStorage(dateKey);
    }
  };

  const handleSymptomToggle = (symptom) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  };



  // Helper function to reset form to empty state
  const resetFormToEmpty = () => {
    setFormData({
      mood: '',
      sleepQuality: '',
      symptoms: [],
      sexualActivity: '',
      vitals: {
        height: '',
        weight: '',
        bloodPressure: { systolic: '', diastolic: '' },
        heartRate: '',
        bloodOxygen: '',
        bloodGlucose: ''
      },
      menstrual: {
        isMenstruating: false,
        flow: '',
        pain: ''
      },
      notes: ''
    });
  };

  // Helper function to load form data from localStorage
  const loadFormDataFromStorage = (dateKey) => {
    try {
      const savedData = localStorage.getItem(`healthRecord_${dateKey}`);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        if (parsedData && typeof parsedData === 'object') {
          setFormData({
            mood: parsedData.mood || '',
            sleepQuality: parsedData.sleepQuality || '',
            symptoms: Array.isArray(parsedData.symptoms) ? parsedData.symptoms : [],
            sexualActivity: parsedData.sexualActivity || '',
            vitals: {
              height: parsedData.vitals?.height || '',
              weight: parsedData.vitals?.weight || '',
              bloodPressure: { 
                systolic: parsedData.vitals?.bloodPressure?.systolic || '', 
                diastolic: parsedData.vitals?.bloodPressure?.diastolic || '' 
              },
              heartRate: parsedData.vitals?.heartRate || '',
              bloodOxygen: parsedData.vitals?.bloodOxygen || '',
              bloodGlucose: parsedData.vitals?.bloodGlucose || ''
            },
            menstrual: {
              isMenstruating: Boolean(parsedData.menstrual?.isMenstruating),
              flow: parsedData.menstrual?.flow || '',
              pain: parsedData.menstrual?.pain || ''
            },
            notes: parsedData.notes || ''
          });
        }
      } else {
        resetFormToEmpty();
      }
    } catch (error) {
      console.error('Error loading data for date:', dateKey, error);
      resetFormToEmpty();
    }
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-xl font-semibold text-gray-800">Health Records</h1>
              <p className="text-sm text-gray-500">Track your wellness journey</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Calendar Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex items-center space-x-2">
              <EnhancedButton
                variant="ghost"
                onClick={goToPreviousMonth}
                size="sm"
                className="p-2"
              >
                <ChevronLeft className="w-4 h-4" />
              </EnhancedButton>
              <EnhancedButton
                variant="ghost"
                onClick={goToNextMonth}
                size="sm"
                className="p-2"
              >
                <ChevronRight className="w-4 h-4" />
              </EnhancedButton>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {days.map((day, index) => (
              <button
                key={index}
                onClick={() => handleDateClick(day)}
                disabled={!day.isCurrentMonth}
                className={`
                  relative p-3 text-sm rounded-lg transition-all duration-200
                  ${day.isCurrentMonth 
                    ? 'hover:bg-blue-50 hover:border-blue-200 cursor-pointer' 
                    : 'text-gray-300 cursor-not-allowed'
                  }
                  ${day.isToday ? 'bg-blue-100 border-2 border-blue-300' : ''}
                  ${day.hasRecord ? 'bg-green-50 border border-green-200' : ''}
                  ${selectedDate.toDateString() === day.date.toDateString() && day.isCurrentMonth
                    ? 'bg-blue-100 border-2 border-blue-400' : ''
                  }
                `}
              >
                <span className={day.isCurrentMonth ? 'text-gray-900' : 'text-gray-300'}>
                  {day.date.getDate()}
                </span>
                {day.hasRecord && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Date Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          {/* Health Tracking Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mood Card */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 border-2 border-blue-400 rounded-full flex items-center justify-center">
                  <span className="text-blue-400 text-lg">😊</span>
                </div>
                <label className="text-base font-semibold text-gray-900">Mood</label>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {[
                  'happy', 'relaxed', 'calm', 'tired', 'down', 'anxious', 'stressed', 'angry'
                ].map(mood => (
                  <button
                    key={mood}
                    type="button"
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      mood: prev.mood === mood ? '' : mood 
                    }))}
                    className={`
                      px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 border
                      ${formData.mood === mood
                        ? 'bg-blue-400 text-white shadow-md'
                        : 'bg-white text-blue-600 hover:bg-blue-50 border-blue-100 hover:border-blue-200'
                      }
                    `}
                  >
                    {mood.charAt(0).toUpperCase() + mood.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Sleep Quality Card */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 border-2 border-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-purple-500 text-lg">😴</span>
                </div>
                <label className="text-base font-semibold text-gray-900">Sleep</label>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  'good', 'fair', 'poor'
                ].map(quality => (
                  <button
                    key={quality}
                    type="button"
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      sleepQuality: prev.sleepQuality === quality ? '' : quality 
                    }))}
                    className={`
                      px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 border
                      ${formData.sleepQuality === quality
                        ? 'border-purple-500 bg-purple-100 shadow-md scale-105'
                        : 'border-purple-200 hover:border-purple-300 bg-white hover:shadow-md hover:scale-102'
                      }
                    `}
                  >
                    {quality === 'good' ? 'Good (>7h)' : quality === 'fair' ? 'Fair (5-7h)' : 'Poor (<5h)'}
                  </button>
                ))}
              </div>
            </div>



            {/* Symptoms Card */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 border-2 border-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-orange-500 text-lg">⚕️</span>
                </div>
                <label className="text-base font-semibold text-gray-900">Symptoms</label>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  'headache', 'dizzy', 'cough', 'sore_throat', 'stomachache', 'fever', 'joint_pain', 'fatigue', 'nausea', 'chest_tightness'
                ].map(symptom => (
                  <button
                    key={symptom}
                    type="button"
                    onClick={() => handleSymptomToggle(symptom)}
                    className={`
                      px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105
                      ${formData.symptoms.includes(symptom)
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'bg-white text-orange-700 hover:bg-orange-100 border border-orange-200 hover:border-orange-300'
                      }
                    `}
                  >
                    {symptom === 'headache' ? 'Headache' :
                     symptom === 'dizzy' ? 'Dizzy' :
                     symptom === 'cough' ? 'Cough' :
                     symptom === 'sore_throat' ? 'Sore Throat' :
                     symptom === 'chest_tightness' ? 'Chest Tightness' :
                     symptom === 'stomachache' ? 'Stomachache' :
                     symptom === 'fever' ? 'Fever' :
                     symptom === 'joint_pain' ? 'Joint Pain' :
                     symptom === 'fatigue' ? 'Fatigue' :
                     symptom === 'nausea' ? 'Nausea' : symptom}
                  </button>
                ))}
              </div>
            </div>



            {/* Vitals Card */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 border-2 border-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-blue-500 text-lg">❤️</span>
                </div>
                <label className="text-base font-semibold text-gray-900">Vitals</label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1 font-medium">Height (cm)</label>
                  <input
                    type="number"
                    min="100"
                    max="250"
                    value={formData.vitals.height || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      vitals: { ...prev.vitals, height: e.target.value }
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                    placeholder="170"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1 font-medium">Weight (kg)</label>
                  <input
                    type="number"
                    min="20"
                    max="300"
                    step="0.1"
                    value={formData.vitals.weight || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      vitals: { ...prev.vitals, weight: e.target.value }
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                    placeholder="65.5"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1 font-medium">Systolic (80-200)</label>
                  <input
                    type="number"
                    min="80"
                    max="200"
                    value={formData.vitals.bloodPressure.systolic || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      vitals: {
                        ...prev.vitals,
                        bloodPressure: { ...prev.vitals.bloodPressure, systolic: e.target.value }
                      }
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                    placeholder="120"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1 font-medium">Diastolic (50-130)</label>
                  <input
                    type="number"
                    min="50"
                    max="130"
                    value={formData.vitals.bloodPressure.diastolic || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      vitals: {
                        ...prev.vitals,
                        bloodPressure: { ...prev.vitals.bloodPressure, diastolic: e.target.value }
                      }
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                    placeholder="80"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1 font-medium">Heart Rate (30-220)</label>
                  <input
                    type="number"
                    min="30"
                    max="220"
                    value={formData.vitals.heartRate || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      vitals: { ...prev.vitals, heartRate: e.target.value }
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                    placeholder="72"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1 font-medium">Blood Oxygen (50-100)</label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={formData.vitals.bloodOxygen || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      vitals: { ...prev.vitals, bloodOxygen: e.target.value }
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                    placeholder="98"
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-xs text-gray-600 mb-1 font-medium">Blood Glucose (2-30)</label>
                <input
                  type="number"
                  min="2"
                  max="30"
                  step="0.1"
                                      value={formData.vitals.bloodGlucose || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    vitals: { ...prev.vitals, bloodGlucose: e.target.value }
                  }))}
                                      className="w-full p-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                    placeholder="5.5"
                />
              </div>
            </div>

            {/* Sex Card */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 border-2 border-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-pink-500 text-lg">💕</span>
                  </div>
                  <label className="text-base font-semibold text-gray-900">Sex</label>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    sexualActivity: prev.sexualActivity ? '' : 'protected'
                  }))}
                  className={`
                    px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out
                    ${formData.sexualActivity
                      ? 'bg-pink-500 text-white shadow-lg border-0'
                      : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200 hover:text-gray-600'
                    }
                  `}
                >
                  {formData.sexualActivity ? 'ON' : 'OFF'}
                </button>
              </div>
              
              {formData.sexualActivity && (
                <div className="space-y-4">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      {['protected', 'unprotected'].map(activity => (
                        <button
                          key={activity}
                          type="button"
                          onClick={() => setFormData(prev => ({ 
                            ...prev, 
                            sexualActivity: prev.sexualActivity === activity ? '' : activity 
                          }))}
                          className={`
                            px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 border
                            ${formData.sexualActivity === activity
                              ? 'bg-pink-500 text-white shadow-md'
                              : 'bg-white text-pink-700 hover:bg-pink-100 border-pink-200 hover:border-pink-300'
                            }
                          `}
                        >
                          {activity === 'protected' ? 'Protected' :
                           activity === 'unprotected' ? 'Unprotected' : activity}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Menstrual Card */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 border-2 border-rose-500 rounded-full flex items-center justify-center">
                    <span className="text-rose-500 text-lg">🌸</span>
                  </div>
                  <label className="text-base font-semibold text-gray-900">Menstrual</label>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    menstrual: { ...prev.menstrual, isMenstruating: !prev.menstrual.isMenstruating }
                  }))}
                  className={`
                    px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out
                    ${formData.menstrual.isMenstruating
                      ? 'bg-pink-500 text-white shadow-lg border-0'
                      : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200 hover:text-gray-600'
                    }
                  `}
                >
                  {formData.menstrual.isMenstruating ? 'ON' : 'OFF'}
                </button>
              </div>
              
              {formData.menstrual.isMenstruating && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-rose-700 mb-2 font-medium">Flow</label>
                    <div className="flex flex-wrap gap-2">
                      {['light', 'medium', 'heavy'].map(flow => (
                        <button
                          key={flow}
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            menstrual: { 
                              ...prev.menstrual, 
                              flow: prev.menstrual.flow === flow ? '' : flow 
                            }
                          }))}
                          className={`
                            px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 border
                            ${(formData.menstrual.flow || '') === flow
                              ? 'bg-rose-500 text-white shadow-md'
                              : 'bg-white text-rose-700 hover:bg-rose-100 border-rose-200 hover:border-rose-300'
                            }
                          `}
                        >
                          {flow === 'light' ? 'Light' : flow === 'medium' ? 'Medium' : 'Heavy'}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-rose-700 mb-2 font-medium">Pain</label>
                    <div className="flex flex-wrap gap-2">
                      {['none', 'mild', 'severe'].map(pain => (
                        <button
                          key={pain}
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            menstrual: { 
                              ...prev.menstrual, 
                              pain: prev.menstrual.pain === pain ? '' : pain 
                            }
                          }))}
                          className={`
                            px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 border
                            ${(formData.menstrual.pain || '') === pain
                              ? 'bg-rose-500 text-white shadow-md'
                              : 'bg-white text-rose-700 hover:bg-rose-100 border-rose-200 hover:border-rose-300'
                            }
                          `}
                        >
                          {pain === 'none' ? 'None' : pain === 'mild' ? 'Mild' : 'Severe'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="lg:col-span-2">
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="How are you feeling today? Any special events, thoughts, or observations you'd like to record..."
                className="w-full min-h-[160px] resize-none border border-gray-300 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
