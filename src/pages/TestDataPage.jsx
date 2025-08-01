import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getAESKey } from '../lib/config';
import { EnhancedButton, LoadingSpinner } from '../components';
import CryptoJS from 'crypto-js';

// Decrypt function
function decrypt(val, key) {
  if (!val) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(val, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    return val; // 如果解密失败，返回原值
  }
}

export default function TestDataPage() {
  const [selfieData, setSelfieData] = useState(null);
  const [signatureData, setSignatureData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');

  console.log('TestDataPage loaded');

  const fetchUserData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Get AES key for decryption
      const AES_KEY = getAESKey();
      if (!AES_KEY) {
        throw new Error('Encryption key not configured');
      }

      // Fetch user data from database
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      console.log('Raw users from database:', users);

      if (userError) {
        throw new Error(`Failed to fetch users: ${userError.message}`);
      }

      if (!users || users.length === 0) {
        setError('No user data found in database');
        setLoading(false);
        return;
      }

      // Get the most recent user
      const latestUser = users[0];
      console.log('Latest user data:', latestUser);
      console.log('Raw selfie field:', latestUser.selfie);
      console.log('Raw signature field:', latestUser.signature);

      // Decrypt user data - URLs are double encrypted in database
      const decryptedUser = {
        full_name: decrypt(latestUser.full_name, AES_KEY),
        phone: decrypt(latestUser.phone, AES_KEY),
        email: decrypt(latestUser.email, AES_KEY),
        selfie: decrypt(decrypt(latestUser.selfie, AES_KEY), AES_KEY), // Double decrypt URL
        signature: decrypt(decrypt(latestUser.signature, AES_KEY), AES_KEY), // Double decrypt URL
        created_at: latestUser.created_at,
        user_id: latestUser.user_id,
        clinic_id: latestUser.clinic_id
      };
      
      console.log('Double decrypted selfie URL:', decryptedUser.selfie);
      console.log('Double decrypted signature URL:', decryptedUser.signature);
      console.log('Selfie URL starts with:', decryptedUser.selfie?.substring(0, 50));
      console.log('Signature URL starts with:', decryptedUser.signature?.substring(0, 50));

      setUserData(decryptedUser);

      // Fetch selfie data if available
      if (decryptedUser.selfie) {
        console.log('Decrypted selfie URL:', decryptedUser.selfie);
        try {
          const selfieResponse = await fetch(decryptedUser.selfie);
          console.log('Selfie response status:', selfieResponse.status);
          if (selfieResponse.ok) {
            // Get encrypted image data
            const encryptedBlob = await selfieResponse.blob();
            const encryptedText = await encryptedBlob.text();
            console.log('Encrypted selfie data length:', encryptedText.length);
            
            // Decrypt image data
            const decryptedImageData = decrypt(encryptedText, AES_KEY);
            console.log('Decrypted selfie data length:', decryptedImageData.length);
            
            // Convert decrypted base64 to blob
            const response2 = await fetch(decryptedImageData);
            const decryptedBlob = await response2.blob();
            const selfieUrl = URL.createObjectURL(decryptedBlob);
            setSelfieData(selfieUrl);
            console.log('Selfie loaded successfully');
          } else {
            console.error('Selfie response not ok:', selfieResponse.status, selfieResponse.statusText);
          }
        } catch (selfieError) {
          console.error('Error fetching selfie:', selfieError);
        }
      } else {
        console.log('No selfie URL in database');
      }

      // Fetch signature data if available
      if (decryptedUser.signature) {
        console.log('Decrypted signature URL:', decryptedUser.signature);
        try {
          const signatureResponse = await fetch(decryptedUser.signature);
          console.log('Signature response status:', signatureResponse.status);
          if (signatureResponse.ok) {
            // Get encrypted image data
            const encryptedBlob = await signatureResponse.blob();
            const encryptedText = await encryptedBlob.text();
            console.log('Encrypted signature data length:', encryptedText.length);
            
            // Decrypt image data
            const decryptedImageData = decrypt(encryptedText, AES_KEY);
            console.log('Decrypted signature data length:', decryptedImageData.length);
            
            // Convert decrypted base64 to blob
            const response2 = await fetch(decryptedImageData);
            const decryptedBlob = await response2.blob();
            const signatureUrl = URL.createObjectURL(decryptedBlob);
            setSignatureData(signatureUrl);
            console.log('Signature loaded successfully');
          } else {
            console.error('Signature response not ok:', signatureResponse.status, signatureResponse.statusText);
          }
        } catch (signatureError) {
          console.error('Error fetching signature:', signatureError);
        }
      } else {
        console.log('No signature URL in database');
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStorageData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Get AES key for decryption
      const AES_KEY = getAESKey();
      if (!AES_KEY) {
        throw new Error('Encryption key not configured');
      }

      // List files in selfies bucket
      const { data: selfieFiles, error: selfieError } = await supabase.storage
        .from('selfies')
        .list('', { limit: 10 });

      if (selfieError) {
        console.error('Error listing selfie files:', selfieError);
      } else if (selfieFiles && selfieFiles.length > 0) {
        // Get the most recent selfie file
        const latestSelfie = selfieFiles[0];
        console.log('Latest selfie file:', latestSelfie);

        // Create signed URL for selfie
        const { data: selfieUrlData, error: selfieUrlError } = await supabase.storage
          .from('selfies')
          .createSignedUrl(latestSelfie.name, 3600);

        if (!selfieUrlError && selfieUrlData) {
          try {
            const response = await fetch(selfieUrlData.signedUrl);
            if (response.ok) {
              const encryptedBlob = await response.blob();
              
              // Convert blob to text to get encrypted data
              const encryptedText = await encryptedBlob.text();
              console.log('Encrypted selfie data length:', encryptedText.length);
              
              // Decrypt the data
              const decryptedData = decrypt(encryptedText, AES_KEY);
              console.log('Decrypted selfie data length:', decryptedData.length);
              
              // Convert decrypted base64 to blob
              const response2 = await fetch(decryptedData);
              const decryptedBlob = await response2.blob();
              const url = URL.createObjectURL(decryptedBlob);
              setSelfieData(url);
            }
          } catch (fetchError) {
            console.error('Error fetching selfie:', fetchError);
          }
        }
      }

      // List files in signatures bucket
      const { data: signatureFiles, error: signatureError } = await supabase.storage
        .from('signatures')
        .list('', { limit: 10 });

      if (signatureError) {
        console.error('Error listing signature files:', signatureError);
      } else if (signatureFiles && signatureFiles.length > 0) {
        // Get the most recent signature file
        const latestSignature = signatureFiles[0];
        console.log('Latest signature file:', latestSignature);

        // Create signed URL for signature
        const { data: signatureUrlData, error: signatureUrlError } = await supabase.storage
          .from('signatures')
          .createSignedUrl(latestSignature.name, 3600);

        if (!signatureUrlError && signatureUrlData) {
          try {
            const response = await fetch(signatureUrlData.signedUrl);
            if (response.ok) {
              const encryptedBlob = await response.blob();
              
              // Convert blob to text to get encrypted data
              const encryptedText = await encryptedBlob.text();
              console.log('Encrypted signature data length:', encryptedText.length);
              
              // Decrypt the data
              const decryptedData = decrypt(encryptedText, AES_KEY);
              console.log('Decrypted signature data length:', decryptedData.length);
              
              // Convert decrypted base64 to blob
              const response2 = await fetch(decryptedData);
              const decryptedBlob = await response2.blob();
              const url = URL.createObjectURL(decryptedBlob);
              setSignatureData(url);
            }
          } catch (fetchError) {
            console.error('Error fetching signature:', fetchError);
          }
        }
      }

    } catch (err) {
      console.error('Error fetching storage data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('TestDataPage useEffect triggered');
    // Auto-fetch data when component mounts
    fetchUserData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Test Data Page</h1>
          <p className="text-gray-600 mb-4">Page loaded successfully</p>
          
          <div className="flex gap-4 mb-6">
            <EnhancedButton
              onClick={fetchUserData}
              variant="primary"
              size="md"
            >
              Fetch User Data
            </EnhancedButton>
            <EnhancedButton
              onClick={fetchStorageData}
              variant="secondary"
              size="md"
            >
              Fetch Storage Data
            </EnhancedButton>
            <EnhancedButton
              onClick={() => {
                console.log('Current userData:', userData);
                console.log('Current selfieData:', selfieData);
                console.log('Current signatureData:', signatureData);
                console.log('Raw database data:', userData?.selfie, userData?.signature);
                alert('Check console for debug info');
              }}
              variant="outline"
              size="md"
            >
              Debug Info
            </EnhancedButton>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
              <span className="ml-3 text-gray-600">Loading data...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-200">
              {error}
            </div>
          )}

          {userData && (
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">User Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-gray-700">Name:</span>
                  <span className="ml-2 text-gray-900">{userData.full_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Phone:</span>
                  <span className="ml-2 text-gray-900">{userData.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <span className="ml-2 text-gray-900">{userData.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">User ID:</span>
                  <span className="ml-2 text-gray-900">{userData.user_id || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Clinic ID:</span>
                  <span className="ml-2 text-gray-900">{userData.clinic_id || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Created:</span>
                  <span className="ml-2 text-gray-900">
                    {userData.created_at ? new Date(userData.created_at).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Selfie Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Selfie</h3>
              {selfieData ? (
                <div className="space-y-4">
                  <img
                    src={selfieData}
                    alt="User selfie"
                    className="w-full h-64 object-cover rounded-lg border border-gray-200"
                  />
                  <div className="text-sm text-gray-600">
                    Selfie loaded successfully
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-center text-gray-500">
                    <div className="text-4xl mb-2">📷</div>
                    <div>No selfie data available</div>
                  </div>
                </div>
              )}
            </div>

            {/* Signature Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Signature</h3>
              {signatureData ? (
                <div className="space-y-4">
                  <img
                    src={signatureData}
                    alt="User signature"
                    className="w-full h-64 object-contain rounded-lg border border-gray-200 bg-white"
                  />
                  <div className="text-sm text-gray-600">
                    Signature loaded successfully
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-center text-gray-500">
                    <div className="text-4xl mb-2">✍️</div>
                    <div>No signature data available</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 