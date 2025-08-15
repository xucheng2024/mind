import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Calendar, Clock, User, Edit } from 'lucide-react';
import { EnhancedButton, useHapticFeedback } from '../components';

export default function RecordPage() {
  const navigate = useNavigate();
  const { trigger: hapticTrigger } = useHapticFeedback();

  const handleViewRecord = (recordId) => {
    hapticTrigger('light');
    console.log('View record:', recordId);
  };

  const handleBackToHome = () => {
    hapticTrigger('light');
    navigate('/');
  };

  // Mock medical records data
  const medicalRecords = [
    {
      id: 1,
      date: '2024-01-15',
      type: 'Consultation',
      doctor: 'Dr. Zhang',
      symptoms: 'Headache, Fatigue',
      treatment: 'Acupuncture + Herbs'
    },
    {
      id: 2,
      date: '2024-01-08',
      type: 'Follow-up',
      doctor: 'Dr. Li',
      symptoms: 'Back Pain',
      treatment: 'Massage Therapy'
    },
    {
      id: 3,
      date: '2023-12-20',
      type: 'Initial Visit',
      doctor: 'Dr. Wang',
      symptoms: 'Insomnia',
      treatment: 'Herbal Medicine'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Medical Records</h1>
          <p className="text-gray-600">Your complete health history and treatment records</p>
        </div>

        {/* Records List */}
        <div className="space-y-4 mb-6">
          {medicalRecords.map((record) => (
            <div key={record.id} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <FileText className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{record.type}</h3>
                    <p className="text-sm text-gray-500">{record.date}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleViewRecord(record.id)}
                  className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Doctor:</span>
                  <span className="font-medium text-gray-900">{record.doctor}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Symptoms:</span>
                  <span className="font-medium text-gray-900">{record.symptoms}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Treatment:</span>
                  <span className="font-medium text-gray-900">{record.treatment}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <EnhancedButton
              variant="primary"
              onClick={() => console.log('Add new record')}
              fullWidth
              size="lg"
            >
              Add New Record
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
