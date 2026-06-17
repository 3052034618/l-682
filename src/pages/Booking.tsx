import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Star, Clock, Users, Check, X, CreditCard, QrCode, Info } from 'lucide-react';
import type { Studio, TimeSlot } from '../../shared/types';
import { studioApi, bookingApi, paymentApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export default function Booking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  
  const [studio, setStudio] = useState<Studio | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('wechat');
  const [processing, setProcessing] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [newBookingId, setNewBookingId] = useState('');

  useEffect(() => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    setSelectedDate(dateStr);
  }, []);

  useEffect(() => {
    if (id && selectedDate) {
      fetchData();
    }
  }, [id, selectedDate]);

  const fetchData = async () => {
    if (!id || !selectedDate) return;
    setLoading(true);
    try {
      const [studioData, slotsData] = await Promise.all([
        studioApi.getById(id),
        studioApi.getAvailability(id, selectedDate),
      ]);
      setStudio(studioData);
      setTimeSlots(slotsData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotClick = (slot: TimeSlot) => {
    if (!slot.available) return;
    
    setSelectedSlots(prev => {
      if (prev.includes(slot.startTime)) {
        return prev.filter(s => s !== slot.startTime);
      }
      return [...prev, slot.startTime].sort();
    });
  };

  const getTotalHours = () => {
    if (selectedSlots.length === 0) return 0;
    
    const sorted = [...selectedSlots].sort();
    let hours = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = parseInt(sorted[i - 1].split(':')[0]);
      const curr = parseInt(sorted[i].split(':')[0]);
      if (curr === prev + 1) {
        hours++;
      }
    }
    return hours;
  };

  const getTotalPrice = () => {
    if (!studio) return 0;
    return getTotalHours() * studio.pricePerHour;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (string | null)[] = [];
    
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push(dateStr);
    }
    
    return days;
  };

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  const isPast = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr < today;
  };

  const handleBooking = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (selectedSlots.length < 2) {
      alert('请至少选择2个连续时段');
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePayment = async () => {
    if (!id || selectedSlots.length < 2 || !studio) return;
    
    setProcessing(true);
    try {
      const sortedSlots = [...selectedSlots].sort();
      const startTime = sortedSlots[0];
      const endHour = parseInt(sortedSlots[sortedSlots.length - 1].split(':')[0]) + 1;
      const endTime = `${String(endHour).padStart(2, '0')}:00`;
      
      const booking = await bookingApi.create({
        studioId: id,
        date: selectedDate,
        startTime,
        endTime,
      });
      
      await paymentApi.create(booking.id, paymentMethod);
      
      setNewBookingId(booking.id);
      setBookingSuccess(true);
      setShowPaymentModal(false);
      
      fetchData();
      setSelectedSlots([]);
    } catch (err: any) {
      alert(err.message || '支付失败');
    } finally {
      setProcessing(false);
    }
  };

  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  if (loading && !studio) {
    return (
      <div className="min-h-screen pt-20 bg-dark-900 flex items-center justify-center">
        <div className="animate-pulse text-dark-400">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-dark-900">
      <div className="container mx-auto px-4 py-8">
        {bookingSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 animate-scale-in">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="font-semibold text-emerald-400">预约成功！</h4>
              <p className="text-sm text-dark-400">您可以在个人中心查看预约详情和签到二维码</p>
            </div>
            <button
              onClick={() => navigate('/profile/bookings')}
              className="ml-auto btn-secondary text-sm py-2 px-4"
            >
              查看预约
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {studio && (
              <div className="card overflow-hidden">
                <div className="relative h-64 md:h-80">
                  <img
                    src={studio.image}
                    alt={studio.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="badge badge-info">{studio.type}</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-gold-400 fill-gold-400" />
                        <span className="text-white font-medium">{studio.rating}</span>
                        <span className="text-dark-300 text-sm">({studio.reviewCount}条评价)</span>
                      </div>
                    </div>
                    <h1 className="text-3xl font-bold text-white">{studio.name}</h1>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-dark-300 mb-6">{studio.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-primary-400" />
                      </div>
                      <div>
                        <div className="text-sm text-dark-500">营业时间</div>
                        <div className="text-dark-200 font-medium">08:00 - 23:00</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary-400" />
                      </div>
                      <div>
                        <div className="text-sm text-dark-500">容纳人数</div>
                        <div className="text-dark-200 font-medium">最多{studio.capacity}人</div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-dark-100 font-medium mb-3">设备配置</h4>
                    <div className="flex flex-wrap gap-2">
                      {studio.equipment.map((eq, i) => (
                        <span key={i} className="px-3 py-1.5 rounded-lg bg-dark-700/50 text-sm text-dark-300">
                          {eq}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="card p-6">
              <h3 className="text-xl font-semibold text-dark-50 mb-6">选择日期</h3>
              
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 rounded-lg hover:bg-dark-700/50 text-dark-400 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h4 className="font-semibold text-dark-100">
                  {currentMonth.getFullYear()}年 {monthNames[currentMonth.getMonth()]}
                </h4>
                <button
                  onClick={handleNextMonth}
                  className="p-2 rounded-lg hover:bg-dark-700/50 text-dark-400 hover:text-white transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map(day => (
                  <div key={day} className="text-center text-sm text-dark-500 py-2">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth().map((dateStr, index) => (
                  <button
                    key={index}
                    onClick={() => dateStr && !isPast(dateStr) && setSelectedDate(dateStr)}
                    disabled={!dateStr || isPast(dateStr)}
                    className={`aspect-square rounded-lg text-sm transition-all ${
                      !dateStr
                        ? ''
                        : isPast(dateStr)
                        ? 'text-dark-700 cursor-not-allowed'
                        : selectedDate === dateStr
                        ? 'bg-gradient-primary text-white font-medium scale-105'
                        : isToday(dateStr)
                        ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30 hover:bg-primary-500/30'
                        : 'text-dark-300 hover:bg-dark-700/50 hover:text-white'
                    }`}
                  >
                    {dateStr ? new Date(dateStr).getDate() : ''}
                  </button>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-dark-50">选择时段</h3>
                <span className="text-sm text-dark-400">{selectedDate}</span>
              </div>
              
              {loading ? (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {Array(10).fill(0).map((_, i) => (
                    <div key={i} className="h-12 rounded-lg bg-dark-700/50 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {timeSlots.map((slot) => {
                    const isSelected = selectedSlots.includes(slot.startTime);
                    
                    return (
                      <button
                        key={slot.startTime}
                        onClick={() => handleSlotClick(slot)}
                        disabled={!slot.available}
                        className={`py-3 px-2 rounded-xl text-sm font-medium transition-all ${
                          !slot.available
                            ? 'bg-dark-800/50 text-dark-600 cursor-not-allowed line-through'
                            : isSelected
                            ? 'bg-gradient-primary text-white shadow-lg shadow-primary-500/30 scale-105'
                            : 'bg-dark-700/30 text-dark-200 hover:bg-dark-700/50 hover:text-white border border-dark-600/30'
                        }`}
                      >
                        <div>{slot.startTime}</div>
                        {isSelected && <Check className="w-4 h-4 mx-auto mt-1" />}
                      </button>
                    );
                  })}
                </div>
              )}
              
              <div className="flex items-center gap-6 mt-6 pt-4 border-t border-dark-700/50">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-dark-700/30 border border-dark-600/30" />
                  <span className="text-sm text-dark-400">可预约</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-dark-800/50" />
                  <span className="text-sm text-dark-400">已预约</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gradient-primary" />
                  <span className="text-sm text-dark-400">已选择</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-dark-50 mb-4">订单摘要</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-dark-400">工作室</span>
                  <span className="text-dark-200">{studio?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-400">日期</span>
                  <span className="text-dark-200">{selectedDate || '请选择'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-400">时长</span>
                  <span className="text-dark-200">{getTotalHours()} 小时</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-400">单价</span>
                  <span className="text-dark-200">¥{studio?.pricePerHour || 0}/小时</span>
                </div>
              </div>
              
              <div className="border-t border-dark-700/50 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-dark-200 font-medium">总计</span>
                  <span className="text-2xl font-bold gradient-text">¥{getTotalPrice()}</span>
                </div>
              </div>
              
              <button
                onClick={handleBooking}
                disabled={selectedSlots.length < 2}
                className={`w-full btn-primary text-lg ${
                  selectedSlots.length < 2 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isAuthenticated ? '立即预约' : '登录后预约'}
              </button>
              
              <div className="mt-4 flex items-start gap-2 text-xs text-dark-500">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>至少选择2个连续时段，预约成功后请在使用前15分钟到达并扫码签到</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-950/80 backdrop-blur-sm animate-fade-in">
          <div className="card p-6 w-full max-w-md mx-4 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-dark-50">确认支付</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-dark-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="text-center mb-6">
              <div className="text-sm text-dark-400 mb-1">支付金额</div>
              <div className="text-4xl font-bold gradient-text">¥{getTotalPrice()}</div>
            </div>
            
            <div className="space-y-3 mb-6">
              <p className="text-sm text-dark-400">选择支付方式</p>
              
              {[
                { id: 'wechat', name: '微信支付', color: 'emerald' },
                { id: 'alipay', name: '支付宝', color: 'blue' },
                { id: 'card', name: '银行卡', color: 'purple' },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                    paymentMethod === method.id
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-dark-600/50 bg-dark-800/50 hover:border-dark-500'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg bg-${method.color}-500/20 flex items-center justify-center`}>
                    <CreditCard className={`w-5 h-5 text-${method.color}-400`} />
                  </div>
                  <span className="text-dark-100 font-medium">{method.name}</span>
                  <div className="ml-auto">
                    {paymentMethod === method.id && (
                      <div className="w-5 h-5 rounded-full bg-gradient-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            <button
              onClick={handlePayment}
              disabled={processing}
              className="w-full btn-primary text-lg"
            >
              {processing ? '处理中...' : '确认支付'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
