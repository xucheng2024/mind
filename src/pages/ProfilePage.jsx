import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Edit } from 'lucide-react';
import { EnhancedButton, useHapticFeedback } from '../components';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { trigger: hapticTrigger } = useHapticFeedback();

  const handleEditProfile = () => {
    hapticTrigger('light');
    // Navigate to edit profile or show edit modal
    console.log('Edit profile clicked');
  };

  const handleBackToHome = () => {
    hapticTrigger('light');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
          <p className="text-gray-600">Manage your account information</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">John Doe</h2>
                <p className="text-gray-600">Patient ID: #12345</p>
              </div>
            </div>
            <button
              onClick={handleEditProfile}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            >
              <Edit className="w-5 h-5" />
            </button>
          </div>

          {/* Profile Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-gray-900">john.doe@example.com</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="text-gray-900">+1 (555) 123-4567</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="text-gray-900">123 Main St, City, State 12345</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <EnhancedButton
              variant="primary"
              onClick={handleEditProfile}
              fullWidth
              size="lg"
            >
              Edit Profile
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
