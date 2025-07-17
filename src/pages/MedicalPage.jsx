import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegistration } from '../../context/RegistrationContext';
import RegistrationHeader from '../components/RegistrationHeader';

const healthItems = [
  'HeartDisease', 'Diabetes', 'Hypertension', 'Cancer', 'Asthma',
  'MentalIllness', 'Epilepsy', 'Stroke', 'KidneyDisease', 'LiverDisease'
];

export default function MedicalPage() {
  const navigate = useNavigate();
  const { registrationData, updateRegistrationData } = useRegistration();
  const [form, setForm] = useState(() => {
    const initial = {};
    healthItems.forEach(item => {
      initial[item] = registrationData[item] || 'NO'; // 默认NO
    });
    initial.otherHealthNotes = registrationData.otherHealthNotes || '';
    return initial;
  });

  const [error, setError] = useState('');
  const [optionErrors, setOptionErrors] = useState({});

  useEffect(() => {
    console.log('✅ MedicalPage mounted');
  }, []);

  const handleSelect = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    for (const item of healthItems) {
      if (!form[item]) {
        errs[item] = `Please select an option for ${item.replace(/([A-Z])/g, ' $1')}`;
      }
    }
    setOptionErrors(errs);
    if (Object.keys(errs).length > 0) {
      // 自动滚动到第一个错误
      const firstErrorKey = healthItems.find(item => errs[item]);
      const el = document.getElementById(`option-${firstErrorKey}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setError('');
    updateRegistrationData(form);
    navigate('/register/authorize');
  };

  return (
    <div className="form-container min-h-screen flex flex-col overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md mx-auto p-4 bg-gray-50 rounded-lg min-h-screen flex flex-col"
      >
        <RegistrationHeader title="Health Declaration" />

        {healthItems.map(item => (
          <div key={item} id={`option-${item}`} className="mb-6">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              {item.replace(/([A-Z])/g, ' $1')}
            </label>
            <div className="flex gap-2">
              {['YES', 'NO', 'UNSURE'].map(opt => (
                <button
                  key={opt}
                  type="button"
                  className={`px-3 py-1 rounded-full border text-sm font-medium transition
                    ${form[item] === opt
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-300 bg-white text-gray-800'}`}
                  onClick={() => handleSelect(item, opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
            {optionErrors[item] && (
              <div className="text-red-600 text-xs mt-1">
                {optionErrors[item]}
              </div>
            )}
          </div>
        ))}

        <div className="mt-4">
          <label className="font-semibold block text-sm text-gray-800 mb-2">
            Other Health Notes (if any)
          </label>
          <textarea
            value={form.otherHealthNotes}
            onChange={(e) => setForm({ ...form, otherHealthNotes: e.target.value })}
            className="w-full min-h-[80px] border border-gray-300 rounded-md p-2 text-sm resize-y"
            placeholder="e.g. Allergies, previous surgeries, medications..."
          />
        </div>

        {error && (
          <div className="text-red-600 bg-red-50 px-3 py-2 rounded mb-3 text-center">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-lg text-lg font-semibold mt-6 hover:bg-blue-700"
        >
          Next
        </button>
      </form>
    </div>
  );
}

