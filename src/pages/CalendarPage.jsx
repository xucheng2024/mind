import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

// CSS动画样式
const styles = `
  @keyframes fadeInScale {
    0% {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  @keyframes successPulse {
    0% {
      transform: scale(1);
      background: #10b981;
    }
    50% {
      transform: scale(1.1);
      background: #059669;
    }
    100% {
      transform: scale(1);
      background: #10b981;
    }
  }
`;

// 插入样式到页面
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

export default function CalendarPage() {
  const [searchParams] = useSearchParams();
  const clinicId = searchParams.get('clinic_id');
  const userId = searchParams.get('user_id');

  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalEvents, setModalEvents] = useState([]);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(null);
  // 移除 showRebookPrompt
  const [clickedHour, setClickedHour] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [businessHours, setBusinessHours] = useState(null);
  const [availableHours, setAvailableHours] = useState([]);
  const [isClosedDay, setIsClosedDay] = useState(false);

  // 可预约时间范围（9点到20点）
  const hours = Array.from({ length: 12 }, (_, i) => i + 9); // 9-20点

  // 获取小时显示格式
  function getDisplayHourPeriod(hour) {
    const period = hour < 12 ? 'am' : 'pm';
    let displayHour = hour % 12;
    if (displayHour === 0) displayHour = 12;
    return { displayHour, period };
  }

  // 格式化小时为 "10am" 格式
  function formatHourAmPm(hour) {
    const { displayHour, period } = getDisplayHourPeriod(hour);
    return `${displayHour}${period}`;
  }

  // 自定义日历工具栏
  function CustomToolbar({ label, onNavigate }) {
    return (
      <div className="flex items-center justify-center mb-6">
        <button
          onClick={() => onNavigate('PREV')}
          className="p-3 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Previous Month"
        >
          <FaChevronLeft className="text-gray-600" />
        </button>
        <span className="font-bold text-xl mx-8 min-w-[200px] text-center">
          {label}
        </span>
        <button
          onClick={() => onNavigate('NEXT')}
          className="p-3 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Next Month"
        >
          <FaChevronRight className="text-gray-600" />
        </button>
      </div>
    );
  }

  // 获取预约数据
  useEffect(() => {
    if (!clinicId) return;
    
    setLoading(true);
    supabase
      .from('visits')
      .select('*')
      .eq('clinic_id', clinicId)
      .then(({ data, error }) => {
        setLoading(false);
        if (error) {
          console.error('获取预约数据失败:', error);
          return;
        }
        
        const evts = (data || [])
          .filter(v => v.user_id === userId && v.status !== 'cancel')
          .map(v => {
            const startDate = v.book_time || v.visit_time ? new Date(v.book_time || v.visit_time) : null;
            if (!startDate) return null;
            
            const timeStr = formatHourAmPm(startDate.getHours());
            return {
              id: v.id,
              title: timeStr,
              start: startDate,
              end: new Date(startDate.getTime() + 60 * 60 * 1000),
              status: v.status,
              userId: v.user_id,
            };
          })
          .filter(e => e && e.start);
        
        setEvents(evts);
      });
  }, [clinicId, refresh, userId]);

  // 拉取诊所营业时间
  useEffect(() => {
    if (!clinicId) return;
    supabase
      .from('clinics')
      .select('business_hours')
      .eq('id', clinicId)
      .single()
      .then(({ data, error }) => {
        if (!error && data && data.business_hours) {
          setBusinessHours(data.business_hours);
        }
      });
  }, [clinicId]);

  // 判断某时间段是否已满
  const isSlotFull = useCallback((date) => {
    const hour = date.getHours();
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    
    const count = events.filter(e =>
      e.status !== 'cancel' &&
      e.start.getFullYear() === year &&
      e.start.getMonth() === month &&
      e.start.getDate() === day &&
      e.start.getHours() === hour
    ).length;
    
    return count >= 3;
  }, [events]);

  // 解析营业时间段为小时数组
  function getAvailableHoursForDate(date) {
    if (!businessHours || !date) return [];
    const weekdays = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const weekday = weekdays[date.getDay()];
    const hoursStr = businessHours[weekday];
    if (!hoursStr || hoursStr === 'closed') return 'closed';
    // 例：10:00-17:30
    const [start, end] = hoursStr.split('-');
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    // 只整点预约，起止都包含
    let hours = [];
    for (let h = startH; h <= endH; h++) {
      // 结束小时需判断分钟
      if (h === endH && endM === 0) break;
      hours.push(h);
    }
    return hours;
  }

  // 日历时段样式
  function slotPropGetter(date) {
    const hour = date.getHours();
    const dayOfWeek = date.getDay();
    
    // 周末或非工作时间
    if (dayOfWeek === 0 || dayOfWeek === 1 || hour < 9 || hour > 20) {
      return {
        style: {
          backgroundColor: '#f9fafb',
          color: '#d1d5db',
          cursor: 'not-allowed',
        },
      };
    }
    
    return {};
  }

  // 事件样式
  function eventPropGetter(event) {
    if (event.userId === userId) {
      return {
        style: {
          backgroundColor: '#3b82f6',
          color: 'white',
          borderRadius: '8px',
          border: 'none',
          fontSize: '13px',
          fontWeight: '600',
        },
      };
    }
    return {};
  }

  // 日期样式
  function dayPropGetter(date) {
    const day = date.getDay();
    if (day === 0 || day === 1) {
      return {
        style: {
          backgroundColor: '#f9fafb',
          color: '#d1d5db',
          pointerEvents: 'none',
        },
      };
    }
    return {};
  }

  // 选择日期时动态生成可预约小时
  function handleSelectSlot(slotInfo) {
    const date = slotInfo.start;
    if (!businessHours) return;
    // 排除周末
    if (date.getDay() === 0 || date.getDay() === 1) {
      return;
    }
    // 获取当天所有预约
    const dayEvents = events.filter(e =>
      e.start.toDateString() === date.toDateString()
    );
    // 检查用户当天是否已有预约
    const myEvent = dayEvents.find(e => e.userId === userId);
    if (myEvent) {
      const timeStr = formatHourAmPm(myEvent.start.getHours());
      setConfirmCancel({ eventId: myEvent.id, timeStr });
    } else {
      setSelectedDate(date);
      setModalEvents(dayEvents);
      setClickedHour(null);
      // 动态生成可预约小时
      const result = getAvailableHoursForDate(date);
      if (result === 'closed') {
        setIsClosedDay(true);
        setAvailableHours([]);
      } else {
        setIsClosedDay(false);
        setAvailableHours(result);
      }
      setShowModal(true);
    }
  }

  // 预约时间段
  async function handleBook(hour) {
    const date = new Date(selectedDate);
    date.setHours(hour, 0, 0, 0);
    setClickedHour(hour);

    try {
      const { error } = await supabase
        .from('visits')
        .insert([{
          user_id: userId,
          clinic_id: clinicId,
          book_time: date.toISOString(),
          status: 'booked',
          is_first: false,
          is_paid: false
        }]);

      if (error) throw error;

      // 更新本地状态
      setEvents(prev => [
        ...prev,
        {
          id: Date.now(),
          title: formatHourAmPm(hour),
          start: new Date(date),
          end: new Date(date.getTime() + 60 * 60 * 1000),
          status: 'booked',
          userId,
        },
      ]);

      // 延时关闭弹窗，显示成功动效
      setTimeout(() => {
        setShowModal(false);
        setSelectedDate(null);
        setClickedHour(null);
      }, 800);

    } catch (error) {
      console.error('预约失败:', error);
      setClickedHour(null);
    }
  }

  // 点击预约事件
  function handleEventClick(event) {
    if (event.userId === userId) {
      setConfirmCancel({ eventId: event.id, timeStr: event.title });
    }
  }

  // 确认取消预约
  async function confirmCancelBooking() {
    if (!confirmCancel) return;
    
    await supabase
      .from('visits')
      .update({ status: 'cancel' })
      .eq('id', confirmCancel.eventId);
    
    setConfirmCancel(null);
    setRefresh(r => r + 1);
  }

  // 时间范围设置
  const minTime = new Date();
  minTime.setHours(9, 0, 0, 0);
  const maxTime = new Date();
  maxTime.setHours(20, 0, 0, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      {/* 日历大容器 */}
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl p-8">
        <h2 className="text-3xl font-extrabold text-center mb-8 text-gray-800">
          My Appointment
        </h2>
        {loading ? (
          <div className="text-center py-20">
            <div className="text-blue-600 font-medium animate-pulse">加载中...</div>
          </div>
        ) : (
          <div className="relative">
            <Calendar
              localizer={localizer}
              events={events.filter(e => e && e.status !== 'cancel')}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 500 }}
              selectable={true}
              views={{ month: true }}
              view="month"
              onView={() => {}}
              components={{ toolbar: CustomToolbar }}
              onSelectSlot={handleSelectSlot}
              eventPropGetter={eventPropGetter}
              slotPropGetter={slotPropGetter}
              dayPropGetter={dayPropGetter}
              min={minTime}
              max={maxTime}
              popup
              onSelectEvent={handleEventClick}
            />
          </div>
        )}
        {/* 取消预约确认弹窗 */}
        {confirmCancel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-md p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-gray-200 transform transition-all duration-300">
              <div className="p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl mx-auto flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">Cancel Appointment</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Are you sure you want to cancel the appointment at <span className="font-semibold text-red-600">{confirmCancel.timeStr}</span>?
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={confirmCancelBooking}
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmCancel(null)}
                    className="flex-1 bg-gray-50 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-200 border border-gray-200"
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* 时间选择弹窗，始终在日历之上 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <div 
            className="bg-white/90 rounded-2xl w-full max-w-lg shadow-xl relative border border-gray-100 mx-4"
            style={{
              animation: 'fadeInScale 0.3s ease-out',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 0
            }}
          >
            {/* 关闭按钮 */}
            <button
              onClick={() => {
                setShowModal(false);
                setSelectedDate(null);
                setClickedHour(null);
              }}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200 text-gray-500 hover:text-gray-700 z-10"
              style={{ fontSize: '20px', lineHeight: '1' }}
            >
              ×
            </button>
            <div className="px-10 py-12">
              {/* 标题区域 */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Select Appointment Time
                </h3>
                <div className="w-12 h-1 mx-auto rounded-full bg-gradient-to-r from-blue-400 to-blue-600 mb-4" />
                <p className="text-gray-500 text-sm">
                  {selectedDate?.toLocaleDateString('en-US', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              {/* 时间选择流式按钮区 */}
              <div className="flex flex-wrap gap-4 justify-center max-w-xl mx-auto mb-6">
                {isClosedDay ? (
                  <div className="w-full text-center text-gray-400 py-8 text-lg font-semibold">
                    Closed today
                    <div className="text-sm text-gray-400 mt-3 font-normal">Closed on holidays. For appointments, please call the clinic first.</div>
                  </div>
                ) : (
                  availableHours.map(hour => {
                    const slotEvents = modalEvents.filter(e => 
                      e.start.getHours() === hour && e.status !== 'cancel'
                    );
                    const isFull = slotEvents.length >= 3;
                    const myEvent = modalEvents.find(e => 
                      e.userId === userId && e.start.getHours() === hour
                    );
                    const isClicked = clickedHour === hour;
                    const isBooked = !!myEvent;
                    if (isFull) return null;
                    return (
                      <button
                        key={hour}
                        onClick={() => handleBook(hour)}
                        disabled={isBooked}
                        className={
                          `px-6 py-2 rounded-full border font-semibold text-base shadow-sm transition-all duration-200
                          ${isClicked 
                            ? 'bg-blue-500 text-white border-blue-500 shadow-lg' 
                            : isBooked
                              ? 'bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed'
                              : 'bg-transparent text-blue-700 border-blue-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-400 hover:shadow-md'
                          }
                          flex items-center justify-center relative overflow-hidden`
                        }
                        style={{
                          minWidth: 80,
                          marginBottom: 0,
                          animation: isClicked ? 'successPulse 0.6s ease-in-out' : 'none'
                        }}
                      >
                        {isClicked ? (
                          <div className="flex items-center justify-center">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : (
                          <span className="font-medium">
                            {formatHourAmPm(hour)}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
              {/* 底部提示 */}
              <div className="text-center mt-8">
                <p className="text-xs text-gray-400">
                  Click to select your appointment time
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
