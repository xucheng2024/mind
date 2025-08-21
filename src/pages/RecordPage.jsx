import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight, Plus, Check, X } from 'lucide-react';
import { EnhancedButton, useHapticFeedback, TextArea } from '../components';
import cacheManager from '../lib/cache';

export default function RecordPage() {
  const navigate = useNavigate();
  const { trigger: hapticTrigger } = useHapticFeedback();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showMoodHistory, setShowMoodHistory] = useState(false);
  const [showSleepHistory, setShowSleepHistory] = useState(false);
  const [showVitalsHistory, setShowVitalsHistory] = useState(false);
  const [userGender, setUserGender] = useState('');
  const [formData, setFormData] = useState({
    mood: '',
    sleepQuality: '',
    symptoms: [],
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

  // Get user gender from cache on component mount
  useEffect(() => {
    const loginInfo = cacheManager.getLoginInfo();
    console.log('User login info:', loginInfo);
    if (loginInfo.gender) {
      setUserGender(loginInfo.gender.toLowerCase());
      console.log('User gender:', loginInfo.gender.toLowerCase());
    } else {
      console.log('No gender information found');
      setUserGender('');
    }
  }, []);

  // Auto-save to localStorage whenever formData changes
  useEffect(() => {
    const dateKey = selectedDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format in local timezone
    
    // Check if there's actual meaningful data to save
    const hasData = (
      formData.mood || 
      formData.sleepQuality || 
      formData.symptoms.length > 0 || 
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
      days.push({ 
        date: prevDate, 
        isCurrentMonth: false, 
        hasRecord: false,
        hasSymptom: false,
        hasMenstrual: false
      });
    }
    
    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month, i);
      const dateKey = currentDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format in local timezone
      
      // Initialize variables
      let hasRecord = false;
      let hasSymptom = false;
      let hasMenstrual = false;
      
      try {
        const savedData = localStorage.getItem(`healthRecord_${dateKey}`);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          // Check for specific data types and assign colors
          hasSymptom = Boolean(parsedData.symptoms && parsedData.symptoms.length > 0);
          hasMenstrual = Boolean(parsedData.menstrual && parsedData.menstrual.isMenstruating);
          
          // Show dots for symptom, and for menstrual when they are ON
          hasRecord = hasSymptom || hasMenstrual;
        }
      } catch (error) {
        console.error('Error checking localStorage for date:', dateKey, error);
        // Ensure variables are set to false on error
        hasRecord = false;
        hasSymptom = false;
        hasMenstrual = false;
      }
      
      days.push({ 
        date: currentDate, 
        isCurrentMonth: true, 
        hasRecord,
        hasSymptom,
        hasMenstrual,
        isToday: currentDate.toDateString() === new Date().toDateString()
      });
    }
    
    // Add next month's days to complete the grid
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({ 
        date: nextDate, 
        isCurrentMonth: false, 
        hasRecord: false,
        hasSymptom: false,
        hasMenstrual: false
      });
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

  const getMoodScore = (mood) => {
    const moodScores = {
      'happy': 3,
      'relaxed': 2,
      'calm': 1,
      'tired': 0,
      'down': -1,
      'anxious': -2,
      'stressed': -3,
      'angry': -4
    };
    return moodScores[mood] || 0;
  };

  const getSleepScore = (sleep) => {
    const sleepScores = {
      'refreshed': 3,
      'normal': 0,
      'tired': -3
    };
    return sleepScores[sleep] || 0;
  };

  const getMoodHistory = () => {
    const history = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toLocaleDateString('en-CA');
      const savedData = localStorage.getItem(`healthRecord_${dateKey}`);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        if (parsedData.mood) {
          history.push({ 
            date: dateKey, 
            mood: parsedData.mood,
            score: getMoodScore(parsedData.mood)
          });
        } else {
          // 如果没有mood数据，添加空记录
          history.push({ 
            date: dateKey, 
            mood: null,
            score: null
          });
        }
      } else {
        // 如果没有保存的数据，添加空记录
        history.push({ 
          date: dateKey, 
          mood: null,
          score: null
        });
      }
    }
    return history;
  };

    const getSleepHistory = () => {
    const history = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toLocaleDateString('en-CA');
      const savedData = localStorage.getItem(`healthRecord_${dateKey}`);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        if (parsedData.sleepQuality) {
          history.push({ 
            date: dateKey, 
            sleepQuality: parsedData.sleepQuality,
            score: getSleepScore(parsedData.sleepQuality)
          });
        } else {
          // 如果没有sleep数据，添加空记录
          history.push({ 
            date: dateKey, 
            sleepQuality: null,
            score: null
          });
        }
      } else {
        // 如果没有保存的数据，添加空记录
        history.push({ 
          date: dateKey, 
          sleepQuality: null,
          score: null
        });
      }
    }
    return history;
  };

  // Vitals history functions
  const getWeightHistory = () => {
    const history = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toLocaleDateString('en-CA');
      const savedData = localStorage.getItem(`healthRecord_${dateKey}`);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        if (parsedData.vitals?.weight) {
          history.push({ 
            date: dateKey, 
            weight: parseFloat(parsedData.vitals.weight),
            value: parseFloat(parsedData.vitals.weight)
          });
        } else {
          history.push({ 
            date: dateKey, 
            weight: null,
            value: null
          });
        }
      } else {
        history.push({ 
          date: dateKey, 
          weight: null,
          value: null
        });
      }
    }
    return history;
  };

  const getBloodPressureHistory = () => {
    const history = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toLocaleDateString('en-CA');
      const savedData = localStorage.getItem(`healthRecord_${dateKey}`);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        if (parsedData.vitals?.bloodPressure?.systolic || parsedData.vitals?.bloodPressure?.diastolic) {
          history.push({ 
            date: dateKey, 
            systolic: parsedData.vitals?.bloodPressure?.systolic ? parseFloat(parsedData.vitals.bloodPressure.systolic) : null,
            diastolic: parsedData.vitals?.bloodPressure?.diastolic ? parseFloat(parsedData.vitals.bloodPressure.diastolic) : null
          });
        } else {
          history.push({ 
            date: dateKey, 
            systolic: null,
            diastolic: null
          });
        }
      } else {
        history.push({ 
          date: dateKey, 
          systolic: null,
          diastolic: null
        });
      }
    }
    return history;
  };

  const getHeartRateHistory = () => {
    const history = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toLocaleDateString('en-CA');
      const savedData = localStorage.getItem(`healthRecord_${dateKey}`);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        if (parsedData.vitals?.heartRate) {
          history.push({ 
            date: dateKey, 
            heartRate: parseFloat(parsedData.vitals.heartRate),
            value: parseFloat(parsedData.vitals.heartRate)
          });
        } else {
          history.push({ 
            date: dateKey, 
            heartRate: null,
            value: null
          });
        }
      } else {
        history.push({ 
          date: dateKey, 
          heartRate: null,
          value: null
        });
      }
    }
    return history;
  };

  const getBloodOxygenHistory = () => {
    const history = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toLocaleDateString('en-CA');
      const savedData = localStorage.getItem(`healthRecord_${dateKey}`);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        if (parsedData.vitals?.bloodOxygen) {
          history.push({ 
            date: dateKey, 
            bloodOxygen: parseFloat(parsedData.vitals.bloodOxygen),
            value: parseFloat(parsedData.vitals.bloodOxygen)
          });
        } else {
          history.push({ 
            date: dateKey, 
            bloodOxygen: null,
            value: null
          });
        }
      } else {
        history.push({ 
          date: dateKey, 
          bloodOxygen: null,
          value: null
        });
      }
    }
    return history;
  };

  const getBloodGlucoseHistory = () => {
    const history = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toLocaleDateString('en-CA');
      const savedData = localStorage.getItem(`healthRecord_${dateKey}`);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        if (parsedData.vitals?.bloodGlucose) {
          history.push({ 
            date: dateKey, 
            bloodGlucose: parseFloat(parsedData.vitals.bloodGlucose),
            value: parseFloat(parsedData.vitals.bloodGlucose)
          });
        } else {
          history.push({ 
            date: dateKey, 
            bloodGlucose: null,
            value: null
          });
        }
      } else {
        history.push({ 
          date: dateKey, 
          bloodGlucose: null,
          value: null
        });
      }
    }
    return history;
  };



  // Helper function to reset form to empty state
  const resetFormToEmpty = () => {
    setFormData({
      mood: '',
      sleepQuality: '',
      symptoms: [],
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
        <div className="px-6 py-4">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-xl font-semibold text-gray-800">Health Records</h1>
              <p className="text-sm text-gray-500">Track your wellness journey</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
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
                {/* Show different colored dots based on data type */}
                {day.hasSymptom && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"></div>
                )}
                {day.hasMenstrual && (
                  <div className="absolute top-1 right-3 w-2 h-2 bg-red-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Date Info */}
        {/* Health Tracking Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Mood Card */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 border-2 border-blue-400 rounded-full flex items-center justify-center">
                    <span className="text-blue-400 text-lg">😊</span>
                  </div>
                  <label className="text-base font-semibold text-gray-900">Mood</label>
                </div>
                                  <button
                    onClick={() => setShowMoodHistory(!showMoodHistory)}
                    className="text-blue-500 hover:text-blue-700 text-sm font-medium transition-colors"
                  >
                    {showMoodHistory ? 'Hide' : 'History'}
                  </button>
              </div>
              
              {/* Mood Selection Buttons - Only show when history is hidden */}
              {!showMoodHistory && (
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
                        px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 border
                        ${formData.mood === mood
                          ? 'border-blue-500 bg-blue-100 shadow-md scale-105'
                          : 'border-blue-200 hover:border-blue-300 bg-white hover:shadow-md hover:scale-102'
                        }
                      `}
                    >
                      {mood === 'happy' ? 'Happy' :
                       mood === 'relaxed' ? 'Relaxed' :
                       mood === 'calm' ? 'Calm' :
                       mood === 'tired' ? 'Tired' :
                       mood === 'down' ? 'Down' :
                       mood === 'anxious' ? 'Anxious' :
                       mood === 'stressed' ? 'Stressed' :
                       mood === 'angry' ? 'Angry' : mood}
                    </button>
                  ))}
                </div>
              )}

              {/* History Table */}
              {showMoodHistory && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Last 30 Days Mood Trend</h4>
                  


                  {/* Line Chart */}
                  <div className="mb-4">
                    <div className="h-32 relative">
                      {/* Grid lines */}
                      <div className="absolute inset-0 flex flex-col justify-between">
                        <div className="border-t border-gray-200"></div>
                        <div className="border-t border-gray-200"></div>
                        <div className="border-t border-gray-200"></div>
                      </div>
                      
                      {/* Y-axis labels */}
                      <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500">
                        <span>+5</span>
                        <span>0</span>
                        <span>-5</span>
                      </div>

                      {/* Line Chart */}
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <polyline
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="1"
                          points={getMoodHistory()
                            .map((item, index) => {
                              if (item.score !== null) {
                                const x = (index / 29) * 100;
                                const y = 50 - (item.score / 5) * 50; // Scale to fit 100x100 viewBox with ±5 range
                                return `${x},${y}`;
                              }
                              return null;
                            })
                            .filter(Boolean)
                            .join(' ')
                          }
                        />
                        
                        {/* Data points */}
                        {getMoodHistory().map((item, index) => {
                          if (item.score !== null) {
                            const x = (index / 29) * 100;
                            const y = 50 - (item.score / 5) * 50;
                            return (
                              <circle
                                key={index}
                                cx={x}
                                cy={y}
                                r="2"
                                fill={item.score >= 0 ? "#3b82f6" : "#ef4444"}
                                stroke="white"
                                strokeWidth="1"
                              />
                            );
                          }
                          return null;
                        })}
                      </svg>
                    </div>
                    
                    {/* X-axis labels */}
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>{getMoodHistory()[0]?.date || ''}</span>
                      <span>{getMoodHistory()[14]?.date || ''}</span>
                      <span>{getMoodHistory()[29]?.date || ''}</span>
                    </div>
                  </div>


                </div>
              )}
            </div>

            {/* Sleep Quality Card */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 border-2 border-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-purple-500 text-lg">😴</span>
                  </div>
                  <label className="text-base font-semibold text-gray-900">Sleep</label>
                </div>
                <button
                  onClick={() => setShowSleepHistory(!showSleepHistory)}
                  className="text-purple-500 hover:text-purple-700 text-sm font-medium transition-colors"
                >
                  {showSleepHistory ? 'Hide' : 'History'}
                </button>
              </div>
              
              {/* Sleep Quality Selection Buttons - Only show when history is hidden */}
              {!showSleepHistory && (
                <div className="flex flex-wrap gap-2">
                  {[
                    'refreshed', 'normal', 'tired'
                  ].map(quality => (
                    <button
                      key={quality}
                      type="button"
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        sleepQuality: prev.sleepQuality === quality ? '' : quality 
                      }))}
                      className={`
                        px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 border
                        ${formData.sleepQuality === quality
                          ? 'border-purple-500 bg-purple-100 shadow-md scale-105'
                          : 'border-purple-200 hover:border-purple-300 bg-white hover:shadow-md hover:scale-102'
                        }
                      `}
                    >
                      {quality === 'refreshed' ? 'Refreshed' : quality === 'normal' ? 'Normal' : 'Tired'}
                    </button>
                  ))}
                </div>
              )}

              {/* Sleep History */}
              {showSleepHistory && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Last 30 Days Sleep Trend</h4>
                  
                  {/* Line Chart */}
                  <div className="mb-4">
                    <div className="h-32 relative">
                      {/* Grid lines */}
                      <div className="absolute inset-0 flex flex-col justify-between">
                        <div className="border-t border-gray-200"></div>
                        <div className="border-t border-gray-200"></div>
                        <div className="border-t border-gray-200"></div>
                      </div>
                      
                      {/* Y-axis labels */}
                      <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500">
                        <span>+5</span>
                        <span>0</span>
                        <span>-5</span>
                      </div>

                      {/* Line Chart */}
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <polyline
                          fill="none"
                          stroke="#a855f7"
                          strokeWidth="1"
                          points={getSleepHistory()
                            .map((item, index) => {
                              if (item.score !== null) {
                                const x = (index / 29) * 100;
                                const y = 50 - (item.score / 5) * 50; // Scale to fit 100x100 viewBox with ±5 range
                                return `${x},${y}`;
                              }
                              return null;
                            })
                            .filter(Boolean)
                            .join(' ')
                          }
                        />
                        
                        {/* Data points */}
                        {getSleepHistory().map((item, index) => {
                          if (item.score !== null) {
                            const x = (index / 29) * 100;
                            const y = 50 - (item.score / 5) * 50;
                            return (
                              <circle
                                key={index}
                                cx={x}
                                cy={y}
                                r="2"
                                fill={item.score >= 0 ? "#a855f7" : "#ef4444"}
                                stroke="white"
                                strokeWidth="1"
                              />
                            );
                          }
                          return null;
                        })}
                      </svg>
                    </div>
                    
                    {/* X-axis labels */}
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>{getSleepHistory()[0]?.date || ''}</span>
                      <span>{getSleepHistory()[14]?.date || ''}</span>
                      <span>{getSleepHistory()[29]?.date || ''}</span>
                    </div>
                  </div>
                </div>
              )}
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
                      px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105
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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 border-2 border-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-blue-500 text-lg">❤️</span>
                  </div>
                  <label className="text-base font-semibold text-gray-900">Vitals</label>
                </div>
                <button
                  onClick={() => setShowVitalsHistory(!showVitalsHistory)}
                  className="text-blue-500 hover:text-blue-700 text-sm font-medium transition-colors"
                >
                  {showVitalsHistory ? 'Hide' : 'History'}
                </button>
              </div>
              {!showVitalsHistory && (
                <>
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
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-600 mb-1 font-medium">Blood Pressure</label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Systolic (80-200)</label>
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
                          <label className="block text-xs text-gray-500 mb-1">Diastolic (50-130)</label>
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
                      </div>
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
                </>
              )}
              
              {/* Vitals History Charts */}
              {showVitalsHistory && (
                <div className="mt-6 space-y-6">
                  {/* Weight Chart */}
                  <div className="border-t border-gray-100 pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Weight Trend (Last 30 Days)</h4>
                    <div className="mb-4">
                      <div className="h-32 relative">
                        {/* Grid lines */}
                        <div className="absolute inset-0 flex flex-col justify-between">
                          <div className="border-t border-gray-200"></div>
                          <div className="border-t border-gray-200"></div>
                          <div className="border-t border-gray-200"></div>
                        </div>
                        
                        {/* Y-axis labels */}
                        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500">
                          <span>100</span>
                          <span>75</span>
                          <span>50</span>
                        </div>

                        {/* Line Chart */}
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <polyline
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="1"
                            points={getWeightHistory()
                              .map((item, index) => {
                                if (item.weight !== null) {
                                  const x = (index / 29) * 100;
                                  const y = 100 - ((item.weight - 50) / 50) * 100; // Scale to fit 50-100 kg range
                                  return `${x},${y}`;
                                }
                                return null;
                              })
                              .filter(Boolean)
                              .join(' ')
                            }
                          />
                          
                          {/* Data points */}
                          {getWeightHistory().map((item, index) => {
                            if (item.weight !== null) {
                              const x = (index / 29) * 100;
                              const y = 100 - ((item.weight - 50) / 50) * 100;
                              return (
                                <circle
                                  key={index}
                                  cx={x}
                                  cy={y}
                                  r="2"
                                  fill="#3b82f6"
                                  stroke="white"
                                  strokeWidth="1"
                                />
                              );
                            }
                            return null;
                          })}
                        </svg>
                      </div>
                      
                      {/* X-axis labels */}
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>{getWeightHistory()[0]?.date || ''}</span>
                        <span>{getWeightHistory()[14]?.date || ''}</span>
                        <span>{getWeightHistory()[29]?.date || ''}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Blood Pressure Chart */}
                  <div className="border-t border-gray-100 pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Blood Pressure Trend (Last 30 Days)</h4>
                    <div className="mb-4">
                      <div className="h-32 relative">
                        {/* Grid lines */}
                        <div className="absolute inset-0 flex flex-col justify-between">
                          <div className="border-t border-gray-200"></div>
                          <div className="border-t border-gray-200"></div>
                          <div className="border-t border-gray-200"></div>
                        </div>
                        
                        {/* Y-axis labels */}
                        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500">
                          <span>150</span>
                          <span>75</span>
                          <span>0</span>
                        </div>

                        {/* Line Chart - Systolic */}
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <polyline
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="1"
                            points={getBloodPressureHistory()
                              .map((item, index) => {
                                if (item.systolic !== null) {
                                  const x = (index / 29) * 100;
                                  const y = 100 - (item.systolic / 150) * 100; // Scale to fit 0-150 range
                                  return `${x},${y}`;
                                }
                                return null;
                              })
                              .filter(Boolean)
                              .join(' ')
                            }
                          />
                          
                          {/* Line Chart - Diastolic */}
                          <polyline
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="1"
                            points={getBloodPressureHistory()
                              .map((item, index) => {
                                if (item.diastolic !== null) {
                                  const x = (index / 29) * 100;
                                  const y = 100 - (item.diastolic / 150) * 100; // Scale to fit 0-150 range
                                  return `${x},${y}`;
                                }
                                return null;
                              })
                              .filter(Boolean)
                              .join(' ')
                            }
                          />
                          
                          {/* Data points */}
                          {getBloodPressureHistory().map((item, index) => {
                            if (item.systolic !== null) {
                              const x = (index / 29) * 100;
                              const y = 100 - (item.systolic / 150) * 100;
                              return (
                                <circle
                                  key={`systolic-${index}`}
                                  cx={x}
                                  cy={y}
                                  r="2"
                                  fill="#ef4444"
                                  stroke="white"
                                  strokeWidth="1"
                                />
                              );
                            }
                            return null;
                          })}
                          {getBloodPressureHistory().map((item, index) => {
                            if (item.diastolic !== null) {
                              const x = (index / 29) * 100;
                              const y = 100 - (item.diastolic / 150) * 100;
                              return (
                                <circle
                                  key={`diastolic-${index}`}
                                  cx={x}
                                  cy={y}
                                  r="2"
                                  fill="#3b82f6"
                                  stroke="white"
                                  strokeWidth="1"
                                />
                              );
                            }
                            return null;
                          })}
                        </svg>
                      </div>
                      
                      {/* X-axis labels */}
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>{getBloodPressureHistory()[0]?.date || ''}</span>
                        <span>{getBloodPressureHistory()[14]?.date || ''}</span>
                        <span>{getBloodPressureHistory()[29]?.date || ''}</span>
                      </div>
                      
                      {/* Legend */}
                      <div className="flex justify-center space-x-4 mt-2 text-xs">
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-gray-600">Systolic</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-gray-600">Diastolic</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Heart Rate Chart */}
                  <div className="border-t border-gray-100 pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Heart Rate Trend (Last 30 Days)</h4>
                    <div className="mb-4">
                      <div className="h-32 relative">
                        {/* Grid lines */}
                        <div className="absolute inset-0 flex flex-col justify-between">
                          <div className="border-t border-gray-200"></div>
                          <div className="border-t border-gray-200"></div>
                          <div className="border-t border-gray-200"></div>
                        </div>
                        
                        {/* Y-axis labels */}
                        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500">
                          <span>220</span>
                          <span>125</span>
                          <span>30</span>
                        </div>

                        {/* Line Chart */}
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <polyline
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="1"
                            points={getHeartRateHistory()
                              .map((item, index) => {
                                if (item.heartRate !== null) {
                                  const x = (index / 29) * 100;
                                  const y = 100 - ((item.heartRate - 30) / 190) * 100; // Scale to fit 30-220 range
                                  return `${x},${y}`;
                                }
                                return null;
                              })
                              .filter(Boolean)
                              .join(' ')
                            }
                          />
                          
                          {/* Data points */}
                          {getHeartRateHistory().map((item, index) => {
                            if (item.heartRate !== null) {
                              const x = (index / 29) * 100;
                              const y = 100 - ((item.heartRate - 30) / 190) * 100;
                              return (
                                <circle
                                  key={index}
                                  cx={x}
                                  cy={y}
                                  r="2"
                                  fill="#10b981"
                                  stroke="white"
                                  strokeWidth="1"
                                />
                              );
                            }
                            return null;
                          })}
                        </svg>
                      </div>
                      
                      {/* X-axis labels */}
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>{getHeartRateHistory()[0]?.date || ''}</span>
                        <span>{getHeartRateHistory()[14]?.date || ''}</span>
                        <span>{getHeartRateHistory()[29]?.date || ''}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Blood Oxygen Chart */}
                  <div className="border-t border-gray-100 pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Blood Oxygen Trend (Last 30 Days)</h4>
                    <div className="mb-4">
                      <div className="h-32 relative">
                        {/* Grid lines */}
                        <div className="absolute inset-0 flex flex-col justify-between">
                          <div className="border-t border-gray-200"></div>
                          <div className="border-t border-gray-200"></div>
                          <div className="border-t border-gray-200"></div>
                        </div>
                        
                        {/* Y-axis labels */}
                        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500">
                          <span>100</span>
                          <span>90</span>
                          <span>80</span>
                        </div>

                        {/* Line Chart */}
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <polyline
                            fill="none"
                            stroke="#8b5cf6"
                            strokeWidth="1"
                            points={getBloodOxygenHistory()
                              .map((item, index) => {
                                if (item.bloodOxygen !== null) {
                                  const x = (index / 29) * 100;
                                  const y = 100 - ((item.bloodOxygen - 80) / 20) * 100; // Scale to fit 80-100 range
                                  return `${x},${y}`;
                                }
                                return null;
                              })
                              .filter(Boolean)
                              .join(' ')
                            }
                          />
                          
                          {/* Data points */}
                          {getBloodOxygenHistory().map((item, index) => {
                            if (item.bloodOxygen !== null) {
                              const x = (index / 29) * 100;
                              const y = 100 - ((item.bloodOxygen - 80) / 20) * 100;
                              return (
                                <circle
                                  key={index}
                                  cx={x}
                                  cy={y}
                                  r="2"
                                  fill="#8b5cf6"
                                  stroke="white"
                                  strokeWidth="1"
                                />
                              );
                            }
                            return null;
                          })}
                        </svg>
                      </div>
                      
                      {/* X-axis labels */}
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>{getBloodOxygenHistory()[0]?.date || ''}</span>
                        <span>{getBloodOxygenHistory()[14]?.date || ''}</span>
                        <span>{getBloodOxygenHistory()[29]?.date || ''}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Blood Glucose Chart */}
                  <div className="border-t border-gray-100 pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Blood Glucose Trend (Last 30 Days)</h4>
                    <div className="mb-4">
                      <div className="h-32 relative">
                        {/* Grid lines */}
                        <div className="absolute inset-0 flex flex-col justify-between">
                          <div className="border-t border-gray-200"></div>
                          <div className="border-t border-gray-200"></div>
                          <div className="border-t border-gray-200"></div>
                        </div>
                        
                        {/* Y-axis labels */}
                        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500">
                          <span>6</span>
                          <span>4</span>
                          <span>2</span>
                        </div>

                        {/* Line Chart */}
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <polyline
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="1"
                            points={getBloodGlucoseHistory()
                              .map((item, index) => {
                                if (item.bloodGlucose !== null) {
                                  const x = (index / 29) * 100;
                                  const y = 100 - ((item.bloodGlucose - 2) / 4) * 100; // Scale to fit 2-6 range
                                  return `${x},${y}`;
                                }
                                return null;
                              })
                              .filter(Boolean)
                              .join(' ')
                            }
                          />
                          
                          {/* Data points */}
                          {getBloodGlucoseHistory().map((item, index) => {
                            if (item.bloodGlucose !== null) {
                              const x = (index / 29) * 100;
                              const y = 100 - ((item.bloodGlucose - 2) / 4) * 100;
                              return (
                                <circle
                                  key={index}
                                  cx={x}
                                  cy={y}
                                  r="2"
                                  fill="#f59e0b"
                                  stroke="white"
                                  strokeWidth="1"
                                />
                              );
                            }
                            return null;
                          })}
                        </svg>
                      </div>
                      
                      {/* X-axis labels */}
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>{getBloodGlucoseHistory()[0]?.date || ''}</span>
                        <span>{getBloodGlucoseHistory()[14]?.date || ''}</span>
                        <span>{getBloodGlucoseHistory()[29]?.date || ''}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>



            {/* Menstrual Card - Only show for female users */}
            {userGender === 'female' && userGender && (
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
                      px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 ease-in-out border
                      ${formData.menstrual.isMenstruating
                        ? 'border-red-500 text-red-500 bg-white'
                        : 'border-gray-200 text-gray-500 bg-white hover:border-gray-300 hover:text-gray-600'
                      }
                    `}
                  >
                    {formData.menstrual.isMenstruating ? 'on' : 'off'}
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
                              px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 border
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
                              px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 border
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
            )}

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
  );
}
