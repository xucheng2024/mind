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
      initial[item] = registrationData[item] || ''; // 初始不选
    });
    initial.otherHealthNotes = '';
    return initial;
  });

  const [error, setError] = useState('');
  const [optionErrors, setOptionErrors] = useState({});

  useEffect(() => {
    console.log('🏥 MedicalPage mounted');
    console.log('📋 Registration data:', registrationData);
    console.log('🏥 Clinic ID:', registrationData.clinic_id);
    
    // 从registrationData恢复表单数据，而不是清空
    const restored = {};
    healthItems.forEach(item => { 
      restored[item] = registrationData[item] || ''; 
    });
    restored.otherHealthNotes = registrationData.otherHealthNotes || '';
    setForm(restored);
    
    console.log('🔄 Restored form data:', restored);
  }, [registrationData]);

  useEffect(() => {
    console.log('🔍 MedicalPage registration data changed:', registrationData);
    // Check if clinic_id exists
    if (!registrationData.clinic_id) {
      console.error('❌ Missing clinic_id in MedicalPage');
      console.log('📋 Full registration data:', registrationData);
    } else {
      console.log(`✅ Clinic ID found: ${registrationData.clinic_id}`);
    }
  }, [registrationData]); // Added registrationData to dependency array for logs

  const handleSelect = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const formatSGTime = () => {
    const now = new Date();
    // 新加坡时间
    const sgTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const yyyy = sgTime.getFullYear();
    const MM = String(sgTime.getMonth() + 1).padStart(2, '0');
    const dd = String(sgTime.getDate()).padStart(2, '0');
    const hh = String(sgTime.getHours()).padStart(2, '0');
    const mm = String(sgTime.getMinutes()).padStart(2, '0');
    const ss = String(sgTime.getSeconds()).padStart(2, '0');
    return `${yyyy}/${MM}/${dd} ${hh}:${mm}:${ss}`;
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

    // 只在点击 Next 时处理备注内容
    const prefix = formatSGTime();
    let notes = form.otherHealthNotes && form.otherHealthNotes.trim() ? form.otherHealthNotes.trim() : '';
    if (!notes) {
      notes = 'None reported';
    } else {
      notes = `${prefix}: ${notes}`;
    }
    updateRegistrationData({ ...form, otherHealthNotes: notes });
    navigate('/register/selfie');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100"
    >
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-fade-in">
        <RegistrationHeader title="Health Declaration" />

        {healthItems.map(item => (
          <div key={item} id={`option-${item}`} className="mb-6">
            <div>
              <span className="block text-base font-semibold text-gray-800 mb-2">
                {item.replace(/([A-Z])/g, ' $1')}
              </span>
              <div className="flex gap-2 mt-1">
                {['Yes', 'No', 'Unsure'].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    aria-label={`Select ${opt} for ${item.replace(/([A-Z])/g, ' $1')}`}
                    className={`px-6 py-2 rounded-full border text-base font-medium transition-all
                      ${form[item] === opt
                        ? 'border-blue-600 bg-blue-50 text-blue-600 shadow'
                        : 'border-gray-300 bg-white text-gray-800 hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600'}
                      focus:outline-none`}
                    onClick={() => handleSelect(item, opt)}
                  >
                    {opt.charAt(0) + opt.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
            {optionErrors[item] && (
              <div className="text-red-600 text-xs mt-2 bg-red-50 border border-red-200 rounded-xl px-3 py-1 animate-shake">
                {optionErrors[item]}
              </div>
            )}
          </div>
        ))}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Other Health Notes (if any)
          </label>
          <textarea
            value={form.otherHealthNotes}
            onChange={(e) => setForm({ ...form, otherHealthNotes: e.target.value })}
            className="w-full min-h-[80px] border border-gray-300 rounded-xl p-4 text-base resize-y focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all placeholder-gray-400"
            placeholder="e.g. Allergies, previous surgeries, medications..."
          />
        </div>

        {error && (
          <div className="text-red-600 bg-red-50 px-4 py-3 rounded-xl mb-4 text-center border border-red-200 flex items-center gap-2 animate-shake">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full h-14 rounded-xl text-lg font-semibold transition-all flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 mt-2"
        >
          Next
        </button>
      </div>
    </form>
  );
}

