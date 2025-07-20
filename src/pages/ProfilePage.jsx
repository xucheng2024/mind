import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRegistration } from '../../context/RegistrationContext';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState({ phone: false, email: false, address: false });
  const [clinics, setClinics] = useState([]); // 存储诊所信息
  const [transactions, setTransactions] = useState([]); // 存储交易信息
  const [selectedClinicId, setSelectedClinicId] = useState(null); // 当前选中的诊所
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const { registrationData } = useRegistration(); // 从 Context 获取邮箱
  const email = registrationData?.email || null;

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);

      // 检查用户是否已登录
      const { data: session, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session?.session) {
        console.error('User is not logged in:', sessionError);
        setUser(null);
        setLoading(false);
        return;
      }

      // 使用邮箱查询 users 表
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(
          'user_id, full_name, phone, email, postal_code, block_no, street, building, floor, unit, selfie, dob'
        ) // 获取所需字段
        .eq('email', email)
        .limit(1); // 取第一条记录

      if (usersError || !usersData || usersData.length === 0) {
        console.error('Error fetching user data:', usersError);
        setUser(null);
        setLoading(false);
        return;
      }

      const userData = usersData[0];
      setUser(userData);

      // 获取用户的所有交易记录
      await fetchTransactionsAndClinics(userData.user_id);

      setLoading(false);
    };

    const fetchTransactionsAndClinics = async (userId) => {
      setTransactionsLoading(true);

      try {
        // Fetch all transactions for the user
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (transactionsError) {
          console.error('Error fetching transactions:', transactionsError);
          setTransactionsLoading(false);
          return;
        }

        setTransactions(transactionsData || []);

        // Extract unique clinic IDs from transactions
        const clinicIds = [...new Set(transactionsData?.map(t => t.clinic_id).filter(Boolean))];

        if (clinicIds.length > 0) {
          // Fetch clinic names using clinic IDs
          const { data: clinicsData, error: clinicsError } = await supabase
            .from('clinics')
            .select('id, name')
            .in('id', clinicIds);

          if (clinicsError) {
            console.error('Error fetching clinics:', clinicsError);
          } else {
            setClinics(clinicsData || []);
          }
        }
      } catch (error) {
        console.error('Error in fetchTransactionsAndClinics:', error);
      }

      setTransactionsLoading(false);
    };

    fetchUserData();
  }, [email]);

  useEffect(() => {
    if (clinics.length > 0 && selectedClinicId === null) {
      setSelectedClinicId(clinics[0].id);
    }
  }, [clinics, selectedClinicId]);

  const handleEditToggle = (field) => {
    setIsEditing((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const saveUserData = async (field, value) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ [field]: value })
        .eq('user_id', user.user_id);

      if (error) {
        console.error('Error updating user data:', error);
      } else {
        console.log(`${field} updated successfully.`);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  const handleInputChange = (e, field) => {
    const value = e.target.value;
    setUser((prev) => ({ ...prev, [field]: value }));
    saveUserData(field, value); // Save to database
  };

  const getTransactionsByClinic = (clinicId) => {
    return transactions.filter(transaction => transaction.clinic_id === clinicId);
  };

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-SG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 格式化金额
  const formatAmount = (amount) => {
    if (!amount) return '$0.00';
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  if (!user) return <div className="text-center py-12">No user found for this email.</div>;

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 px-4 py-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-100 p-4">
        {/* 头像与名字、生日并排 */}
        <div className="flex items-center mb-4">
          {user?.selfie ? (
            <img
              src={user.selfie}
              alt="Avatar"
              className="w-16 h-16 rounded-full object-cover border mr-3"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xl mr-3">
              ?
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-lg font-bold text-gray-800">{user.full_name || '-'}</span>
            <span className="text-sm text-gray-600">{user.dob || '-'}</span>
          </div>
        </div>

        <div className="space-y-3">
          {/* 电话 */}
          <div className="flex items-center justify-between py-1">
            <div>
              <div className="text-gray-500 text-sm">Phone:</div>
              {isEditing.phone ? (
                <input
                  type="text"
                  value={user.phone || ''}
                  onChange={(e) => handleInputChange(e, 'phone')}
                  onBlur={() => handleEditToggle('phone')}
                  className="text-gray-900 font-medium border rounded px-2 py-1"
                />
              ) : (
                <div className="text-gray-900 font-medium">{user.phone || '-'}</div>
              )}
            </div>
            <button
              className="text-blue-500 text-sm hover:underline"
              onClick={() => handleEditToggle('phone')}
            >
              edit
            </button>
          </div>

          {/* 邮箱 */}
          <div className="flex items-center justify-between py-1">
            <div>
              <div className="text-gray-500 text-sm">Email:</div>
              {isEditing.email ? (
                <input
                  type="email"
                  value={user.email || ''}
                  onChange={(e) => handleInputChange(e, 'email')}
                  onBlur={() => handleEditToggle('email')}
                  className="text-gray-900 font-medium border rounded px-2 py-1"
                />
              ) : (
                <div className="text-gray-900 font-medium">{user.email || '-'}</div>
              )}
            </div>
            <button
              className="text-blue-500 text-sm hover:underline"
              onClick={() => handleEditToggle('email')}
            >
              edit
            </button>
          </div>

          {/* 地址 */}
          <div className="py-1">
            <div className="text-gray-500 text-sm">Address:</div>
            {isEditing.address ? (
              <div className="space-y-2">
                {/* Block Number */}
                <div className="flex items-center justify-between py-1">
                  <div>
                    <div className="text-gray-500 text-xs">Block No:</div>
                    <input
                      type="text"
                      value={user.block_no || ''}
                      onChange={(e) => handleInputChange(e, 'block_no')}
                      className="text-gray-900 font-medium border rounded px-2 py-1"
                    />
                  </div>
                </div>

                {/* Street */}
                <div className="flex items-center justify-between py-1">
                  <div>
                    <div className="text-gray-500 text-xs">Street:</div>
                    <input
                      type="text"
                      value={user.street || ''}
                      onChange={(e) => handleInputChange(e, 'street')}
                      className="text-gray-900 font-medium border rounded px-2 py-1"
                    />
                  </div>
                </div>

                {/* Unit */}
                <div className="flex items-center justify-between py-1">
                  <div>
                    <div className="text-gray-500 text-xs">Unit:</div>
                    <input
                      type="text"
                      value={user.unit || ''}
                      onChange={(e) => handleInputChange(e, 'unit')}
                      className="text-gray-900 font-medium border rounded px-2 py-1"
                    />
                  </div>
                </div>

                {/* Floor */}
                <div className="flex items-center justify-between py-1">
                  <div>
                    <div className="text-gray-500 text-xs">Floor:</div>
                    <input
                      type="text"
                      value={user.floor || ''}
                      onChange={(e) => handleInputChange(e, 'floor')}
                      className="text-gray-900 font-medium border rounded px-2 py-1"
                    />
                  </div>
                </div>

                {/* Postal Code */}
                <div className="flex items-center justify-between py-1">
                  <div>
                    <div className="text-gray-500 text-xs">Postal Code:</div>
                    <input
                      type="text"
                      value={user.postal_code || ''}
                      onChange={(e) => handleInputChange(e, 'postal_code')}
                      className="text-gray-900 font-medium border rounded px-2 py-1"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end mt-2">
                  <button
                    className="bg-blue-500 text-white text-sm px-4 py-2 rounded hover:bg-blue-600"
                    onClick={() => handleEditToggle('address')}
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between py-1">
                <div className="text-gray-900 font-medium">
                  {`${user.block_no || '-'} ${user.street || '-'} #${user.unit || '-'}-${user.floor || '-'} ${user.postal_code || '-'}`}
                </div>
                <button
                  className="text-blue-500 text-sm hover:underline"
                  onClick={() => handleEditToggle('address')}
                >
                  edit
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Display transactions grouped by clinic name */}
        {!transactionsLoading && clinics.length > 0 && (
          <div className="mt-6 border-t pt-4">
            {/* Clinic Tabs */}
            <div className="flex space-x-4 border-b mb-4">
              {clinics.map((clinic) => (
                <button
                  key={clinic.id}
                  className={`text-sm pb-2 border-b-2 ${
                    selectedClinicId === clinic.id
                      ? 'text-blue-500 border-blue-500'
                      : 'text-gray-500 border-transparent hover:text-blue-500 hover:border-blue-500'
                  }`}
                  onClick={() => setSelectedClinicId(clinic.id)}
                >
                  {clinic.name}
                </button>
              ))}
            </div>

            {/* Transactions for Selected Clinic */}
            {selectedClinicId && (
              <div className="space-y-3">
                {getTransactionsByClinic(selectedClinicId).map((transaction) => (
                  <div
                    key={transaction.transaction_id}
                    className="bg-white rounded-lg border p-4 shadow-sm text-sm text-gray-800"
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-xs text-gray-500">{formatDate(transaction.created_at)}</p>
                      <p className="text-xs text-gray-400 italic">Total: {formatAmount(transaction.total_amount)}</p>
                    </div>

                    <div className="mt-3">
                      <ul className="list-disc list-inside text-gray-900 leading-relaxed">
                        {transaction.items && transaction.items.map((item, index) => (
                          <li key={index}>
                            {item.name}{item.qty > 1 ? `*${item.qty}` : ''}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-3">
                      <p className="text-gray-900 whitespace-pre-line leading-relaxed">
                        {transaction.diagnosis || 'N/A'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {transactionsLoading && (
          <div className="mt-6 border-t pt-4">
            <div className="text-center py-4 text-gray-500">
              Loading transactions...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}