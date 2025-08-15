import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Stethoscope, 
  PenTool, 
  Brain, 
  Apple
} from 'lucide-react';
import { useHapticFeedback } from './index';

const BottomTabBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { trigger: hapticTrigger } = useHapticFeedback();

  const tabs = [
    {
      id: 'clinic',
      label: 'Clinic',
      icon: Stethoscope,
      path: '/',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-300'
    },
    {
      id: 'record',
      label: 'Record',
      icon: PenTool,
      path: '/record',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-300'
    },
    {
      id: 'mind',
      label: 'Mind',
      icon: Brain,
      path: '/mind',
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
      borderColor: 'border-violet-300'
    },
    {
      id: 'diet',
      label: 'Diet',
      icon: Apple,
      path: '/diet',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-300'
    }
  ];

  const handleTabPress = (tab) => {
    hapticTrigger('light');
    navigate(tab.path);
  };

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Get current active tab for border color
  const getActiveBorderColor = () => {
    const activeTab = tabs.find(tab => isActive(tab.path));
    return activeTab ? activeTab.borderColor : 'border-gray-300';
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-4">
      <div className={`bg-white border-2 shadow-lg rounded-full px-4 py-1.5 transition-all duration-500 ${getActiveBorderColor()}`}>
        <div className="flex items-center space-x-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.path);
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabPress(tab)}
                className={`group flex items-center justify-center p-1.5 rounded-full transition-all duration-300 ease-out ${
                  active 
                    ? 'scale-105' 
                    : 'hover:scale-102'
                }`}
              >
                <div className={`relative p-1.5 rounded-full transition-all duration-300 ${
                  active 
                    ? `${tab.bgColor} ${tab.color} shadow-sm` 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}>
                  <Icon 
                    className={`w-5 h-5 transition-all duration-300 ${
                      active ? 'scale-110' : 'group-hover:scale-105'
                    }`} 
                  />
                  
                  {/* Active indicator with animation */}
                  {active && (
                    <div className={`absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full ${tab.color.replace('text-', 'bg-')} animate-pulse`} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BottomTabBar;
