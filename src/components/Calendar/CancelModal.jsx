import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function CancelModal({ modal, setModal, onCancel, loading }) {
  if (modal.type !== 'cancel') return null;

  const commonModalProps = {
    className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50",
    onClick: (e) => {
      if (e.target === e.currentTarget) {
        setModal({ type: null, data: null });
      }
    }
  };

  return (
    <div {...commonModalProps}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-scale-in border border-gray-100">
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-amber-50 rounded-xl mx-auto mb-4 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Already Booked
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            To reschedule, please cancel first
          </p>
          <div className="space-y-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white py-3 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Cancelling...' : 'Cancel Appointment'}
            </button>
            <button
              onClick={() => setModal({ type: null, data: null })}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-medium transition-colors"
            >
              Keep
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
