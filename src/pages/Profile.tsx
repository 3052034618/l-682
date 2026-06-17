import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  User, Calendar, Music, Settings, QrCode, Clock, Star,
  ChevronRight, LogOut, Camera, Upload, Play, Heart,
  AlertCircle, CheckCircle, Bell, X, CreditCard, Receipt,
  ArrowUpRight, ArrowDownRight, Pause
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { bookingApi, workApi, paymentApi } from '@/lib/api';
import type { Booking, Work, Payment } from '../../shared/types';

function getMediaUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
  return url;
}

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [renewNotice, setRenewNotice] = useState<Booking | null>(null);
  const [playingWorkId, setPlayingWorkId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [, forceUpdate] = useState(0);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    const path = location.pathname.split('/').pop();
    if (path === 'bookings' || path === 'works' || path === 'settings' || path === 'payments') {
      setActiveTab(path);
    }
  }, [location]);

  useEffect(() => {
    if (activeTab === 'bookings') {
      fetchBookings();
    } else if (activeTab === 'works') {
      fetchWorks();
    } else if (activeTab === 'payments') {
      fetchPayments();
    }
  }, [activeTab, user?.id]);

  useEffect(() => {
    if (!user) return;
    if (activeTab === 'works') {
      fetchWorks();
    }
  }, [location.key, location.pathname]);

  useEffect(() => {
    if (activeTab === 'bookings' && user) {
      pollRef.current = window.setInterval(() => {
        fetchBookings();
        forceUpdate(n => n + 1);
      }, 10000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeTab, user?.id]);

  useEffect(() => {
    const renewed = bookings.find(b => b.autoRenewed && b.status === 'in_use');
    if (renewed && renewed !== renewNotice) {
      setRenewNotice(renewed);
    }
  }, [bookings]);

  const getRemainingTime = (booking: Booking) => {
    if (booking.status !== 'in_use') return null;
    const end = new Date(`${booking.date}T${booking.endTime}`).getTime();
    const now = Date.now();
    const diff = end - now;
    if (diff <= 0) return '已超时';
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    if (hours > 0) return `${hours}时${mins}分${secs}秒`;
    if (mins > 0) return `${mins}分${secs}秒`;
    return `${secs}秒`;
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await bookingApi.getList();
      setBookings(data);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorks = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await workApi.getByUser(user.id);
      setWorks(data);
    } catch (err) {
      console.error('Failed to fetch works:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await paymentApi.getList();
      setPayments(data);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShowQr = async (booking: Booking) => {
    try {
      const result = await bookingApi.getQrCode(booking.id);
      setQrCode(result.qrCode);
      setSelectedBooking(booking);
      setShowQrModal(true);
    } catch (err) {
      console.error('Failed to get QR code:', err);
    }
  };

  const handleCheckin = async (bookingId: string) => {
    try {
      await bookingApi.checkin(bookingId);
      alert('签到成功！已开始计时使用。');
      fetchBookings();
    } catch (err: any) {
      alert(err.message || '签到失败');
    }
  };

  const handleCheckout = async (bookingId: string) => {
    if (!confirm('确定要结束使用吗？')) return;
    try {
      await bookingApi.checkout(bookingId);
      alert('使用已结束，欢迎上传作品分享！');
      fetchBookings();
    } catch (err: any) {
      alert(err.message || '签退失败');
    }
  };

  const handleRenew = async (bookingId: string, hours: number) => {
    try {
      const result = await bookingApi.renew(bookingId, hours);
      alert(`续费成功！延长${hours}小时，当前总费用¥${result.totalPrice}`);
      fetchBookings();
    } catch (err: any) {
      alert(err.message || '续费失败');
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('确定要取消这个预约吗？')) return;
    try {
      await bookingApi.cancel(bookingId);
      fetchBookings();
    } catch (err: any) {
      alert(err.message || '取消失败');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: '待支付', className: 'badge-warning' },
      paid: { label: '已支付', className: 'badge-info' },
      confirmed: { label: '已确认', className: 'badge-info' },
      in_use: { label: '使用中', className: 'badge-success' },
      completed: { label: '已完成', className: 'badge-success' },
      cancelled: { label: '已取消', className: 'badge-danger' },
      no_show: { label: '未到场', className: 'badge-danger' },
    };
    return statusMap[status] || { label: status, className: 'badge-info' };
  };

  const navItems = [
    { id: 'bookings', label: '我的预约', icon: Calendar, path: '/profile/bookings' },
    { id: 'works', label: '我的作品', icon: Music, path: '/profile/works' },
    { id: 'payments', label: '订单流水', icon: Receipt, path: '/profile/payments' },
    { id: 'settings', label: '账户设置', icon: Settings, path: '/profile/settings' },
  ];

  if (!user) {
    return (
      <div className="min-h-screen pt-20 bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-dark-400 mb-4">请先登录</p>
          <Link to="/login" className="btn-primary">去登录</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-dark-900">
      <div className="container mx-auto px-4 py-8">

        {renewNotice && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 animate-scale-in">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-amber-400 mb-1">系统已自动续费</h4>
              <p className="text-sm text-dark-300">
                {renewNotice.studioName} 使用时间已超时，系统已自动续费1小时。
                当前结束时间: {renewNotice.endTime}，总费用: ¥{renewNotice.totalPrice}
              </p>
            </div>
            <button
              onClick={() => setRenewNotice(null)}
              className="text-dark-500 hover:text-dark-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="card p-6 sticky top-24">
              <div className="text-center mb-6">
                <div className="relative inline-block mb-4">
                  <img
                    src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                    alt="avatar"
                    className="w-24 h-24 rounded-full border-4 border-primary-500/30"
                  />
                  <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-xl font-semibold text-dark-50">{user.username}</h3>
                <p className="text-sm text-dark-500">{user.email}</p>
                {user.role === 'admin' && (
                  <span className="badge badge-info mt-2">管理员</span>
                )}
              </div>
              
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.id}
                    to={item.path}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      activeTab === item.id
                        ? 'bg-primary-500/20 text-primary-300'
                        : 'text-dark-300 hover:bg-dark-700/50 hover:text-dark-100'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </Link>
                ))}
              </nav>
              
              <button
                onClick={handleLogout}
                className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>退出登录</span>
              </button>
            </div>
          </div>
          
          <div className="md:col-span-3">
            {activeTab === 'bookings' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-dark-50">我的预约</h2>
                  <Link to="/booking/studio-001" className="btn-secondary text-sm py-2 px-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    新建预约
                  </Link>
                </div>
                
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="card p-6 animate-pulse">
                        <div className="h-6 bg-dark-700 rounded w-1/3 mb-4" />
                        <div className="grid grid-cols-3 gap-4">
                          {[1, 2, 3].map((j) => (
                            <div key={j} className="h-4 bg-dark-700 rounded" />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="card p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-800/50 flex items-center justify-center">
                      <Calendar className="w-8 h-8 text-dark-600" />
                    </div>
                    <p className="text-dark-500 mb-4">暂无预约记录</p>
                    <Link to="/booking/studio-001" className="btn-primary text-sm py-2 px-6">
                      立即预约
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => {
                      const statusInfo = getStatusBadge(booking.status);
                      return (
                        <div key={booking.id} className="card p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-dark-100 mb-1">
                                {booking.studioName}
                              </h3>
                              <span className={`badge ${statusInfo.className}`}>
                                {statusInfo.label}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold gradient-text">
                                ¥{booking.totalPrice}
                              </div>
                              <div className="text-sm text-dark-500">
                                {booking.duration}小时
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-dark-500" />
                              <span className="text-sm text-dark-300">{booking.date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-dark-500" />
                              <span className="text-sm text-dark-300">
                                {booking.startTime} - {booking.endTime}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-dark-500" />
                              <span className="text-sm text-dark-300">订单号: {booking.id.slice(-8)}</span>
                            </div>
                            {booking.status === 'in_use' && (
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-emerald-400" />
                                <span className="text-sm text-emerald-400 font-medium">
                                  剩余 {getRemainingTime(booking)}
                                </span>
                              </div>
                            )}
                          </div>

                          {booking.status === 'in_use' && booking.autoRenewed && (
                            <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
                              <Bell className="w-4 h-4 text-amber-400" />
                              <span className="text-sm text-amber-300">
                                系统已自动续费1小时，新增费用已扣除。如不需继续使用请点击"结束使用"
                              </span>
                            </div>
                          )}
                          
                          <div className="flex gap-3 flex-wrap">
                            {['paid', 'confirmed'].includes(booking.status) && (
                              <>
                                <button
                                  onClick={() => handleCheckin(booking.id)}
                                  className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  签到使用
                                </button>
                                <button
                                  onClick={() => handleShowQr(booking)}
                                  className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
                                >
                                  <QrCode className="w-4 h-4" />
                                  签到码
                                </button>
                                <button
                                  onClick={() => handleCancelBooking(booking.id)}
                                  className="btn-secondary text-sm py-2 px-4 flex items-center gap-2 text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
                                >
                                  取消预约
                                </button>
                              </>
                            )}
                            {booking.status === 'in_use' && (
                              <>
                                <button
                                  onClick={() => handleCheckout(booking.id)}
                                  className="btn-secondary text-sm py-2 px-4 flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  结束使用
                                </button>
                                <button
                                  onClick={() => handleRenew(booking.id, 1)}
                                  className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
                                >
                                  <Clock className="w-4 h-4" />
                                  续费1小时
                                </button>
                                <button
                                  onClick={() => handleShowQr(booking)}
                                  className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
                                >
                                  <QrCode className="w-4 h-4" />
                                  查看码
                                </button>
                              </>
                            )}
                            {booking.status === 'completed' && (
                              <Link
                                to="/works/upload"
                                className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
                              >
                                <Upload className="w-4 h-4" />
                                上传作品
                              </Link>
                            )}
                            {booking.status === 'no_show' && (
                              <div className="w-full">
                                <div className="flex items-center gap-2 text-rose-400 text-sm mb-3">
                                  <AlertCircle className="w-4 h-4" />
                                  未到场，时段已自动释放
                                </div>
                                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-dark-400">原价</span>
                                    <span className="text-dark-200">¥{booking.noShowInfo?.originalPrice ?? booking.totalPrice}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-rose-400">违约金（50%）</span>
                                    <span className="text-rose-400">-¥{booking.noShowInfo?.penaltyAmount ?? (booking.totalPrice * 0.5).toFixed(2)}</span>
                                  </div>
                                  <div className="border-t border-rose-500/20 pt-2 flex justify-between text-sm font-medium">
                                    <span className="text-emerald-400">退款金额</span>
                                    <span className="text-emerald-400">¥{booking.noShowInfo?.refundAmount ?? (booking.totalPrice * 0.5).toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'works' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-dark-50">我的作品</h2>
                  <Link to="/works/upload" className="btn-primary text-sm py-2 px-4 flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    上传作品
                  </Link>
                </div>
                
                {loading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="card overflow-hidden animate-pulse">
                        <div className="aspect-square bg-dark-700" />
                        <div className="p-4 space-y-2">
                          <div className="h-4 bg-dark-700 rounded w-3/4" />
                          <div className="h-3 bg-dark-700 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : works.length === 0 ? (
                  <div className="card p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-800/50 flex items-center justify-center">
                      <Music className="w-8 h-8 text-dark-600" />
                    </div>
                    <p className="text-dark-500 mb-4">还没有上传作品</p>
                    <Link to="/works/upload" className="btn-primary text-sm py-2 px-6">
                      上传第一个作品
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {works.map((work) => (
                      <div key={work.id} className="card overflow-hidden group">
                        <div className="relative aspect-square overflow-hidden">
                          <img
                            src={work.coverImage}
                            alt={work.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-dark-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              onClick={() => {
                                if (work.mediaType === 'video') {
                                  const v = document.createElement('video');
                                  v.src = getMediaUrl(work.mediaUrl);
                                  v.controls = true;
                                  v.autoplay = true;
                                  v.poster = work.coverImage;
                                  v.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);max-width:90vw;max-height:80vh;border-radius:12px;z-index:9999';
                                  const overlay = document.createElement('div');
                                  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9998';
                                  overlay.onclick = () => { overlay.remove(); v.remove(); };
                                  document.body.appendChild(overlay);
                                  document.body.appendChild(v);
                                } else {
                                  if (playingWorkId === work.id) {
                                    audioRef.current?.pause();
                                    setPlayingWorkId(null);
                                  } else {
                                    if (audioRef.current) audioRef.current.pause();
                                    const audio = new Audio(getMediaUrl(work.mediaUrl));
                                    audio.onended = () => setPlayingWorkId(null);
                                    audio.play();
                                    audioRef.current = audio;
                                    setPlayingWorkId(work.id);
                                  }
                                }
                              }}
                              className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                            >
                              {playingWorkId === work.id ? (
                                <Pause className="w-5 h-5 text-white" />
                              ) : (
                                <Play className="w-5 h-5 text-white ml-0.5" />
                              )}
                            </button>
                          </div>
                          {work.mediaType === 'video' && (
                            <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-rose-500/80 text-xs text-white">视频</div>
                          )}
                        </div>
                        <div className="p-4">
                          <h4 className="font-medium text-dark-100 truncate mb-1">{work.title}</h4>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1 text-xs text-dark-400">
                                <Play className="w-3 h-3" />
                                {work.plays}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-dark-400">
                                <Heart className="w-3 h-3" />
                                {work.likes}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-gold-400 fill-gold-400" />
                              <span className="text-xs text-dark-300">{work.rating}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'payments' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-dark-50">订单流水</h2>
                </div>
                
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="card p-6 animate-pulse">
                        <div className="h-6 bg-dark-700 rounded w-1/3 mb-4" />
                        <div className="h-4 bg-dark-700 rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : payments.length === 0 ? (
                  <div className="card p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-800/50 flex items-center justify-center">
                      <Receipt className="w-8 h-8 text-dark-600" />
                    </div>
                    <p className="text-dark-500 mb-4">暂无交易记录</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payments.map((payment) => {
                      const isRefund = payment.amount < 0 || payment.status === 'refunded';
                      const displayAmount = Math.abs(payment.amount);
                      const reason = payment.reason || (isRefund ? '退款' : '预约支付');
                      
                      return (
                        <div key={payment.id} className="card p-5 flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isRefund ? 'bg-emerald-500/20' : 'bg-primary-500/20'
                          }`}>
                            {isRefund ? (
                              <ArrowDownRight className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <ArrowUpRight className="w-5 h-5 text-primary-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-dark-100 font-medium text-sm">{reason}</span>
                              <span className={`badge text-xs ${
                                payment.status === 'success' ? 'badge-success' :
                                payment.status === 'refunded' ? 'badge-warning' : 'badge-info'
                              }`}>
                                {payment.status === 'success' ? '成功' :
                                 payment.status === 'refunded' ? '已退款' : payment.status}
                              </span>
                            </div>
                            <div className="text-xs text-dark-500">
                              {payment.paidAt ? new Date(payment.paidAt).toLocaleString('zh-CN') : ''}
                              {payment.bookingId && ` · 订单 ${payment.bookingId.slice(-8)}`}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className={`font-bold ${
                              isRefund ? 'text-emerald-400' : 'text-dark-100'
                            }`}>
                              {isRefund ? '+' : '-'}¥{displayAmount}
                            </div>
                            {payment.refundAmount && payment.refundAmount > 0 && (
                              <div className="text-xs text-emerald-400">
                                退 ¥{payment.refundAmount}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'settings' && (
              <div>
                <h2 className="text-2xl font-bold text-dark-50 mb-6">账户设置</h2>
                
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-dark-100 mb-4">基本信息</h3>
                  
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm text-dark-300 mb-2">用户名</label>
                      <input
                        type="text"
                        defaultValue={user.username}
                        className="input-field"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-dark-300 mb-2">邮箱</label>
                      <input
                        type="email"
                        defaultValue={user.email}
                        className="input-field"
                        disabled
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-dark-300 mb-2">手机号</label>
                      <input
                        type="tel"
                        defaultValue={user.phone || ''}
                        placeholder="请输入手机号"
                        className="input-field"
                      />
                    </div>
                    
                    <button className="btn-primary">保存修改</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showQrModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-950/80 backdrop-blur-sm animate-fade-in">
          <div className="card p-6 w-full max-w-sm mx-4 animate-scale-in text-center">
            <h3 className="text-xl font-semibold text-dark-50 mb-2">签到二维码</h3>
            <p className="text-sm text-dark-400 mb-6">{selectedBooking.studioName}</p>
            
            <div className="bg-white p-4 rounded-xl inline-block mb-4">
              {qrCode && (
                <img src={qrCode} alt="QR Code" className="w-48 h-48" />
              )}
            </div>
            
            <div className="space-y-2 text-left bg-dark-800/50 rounded-xl p-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-dark-400">日期</span>
                <span className="text-dark-200">{selectedBooking.date}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-400">时间</span>
                <span className="text-dark-200">
                  {selectedBooking.startTime} - {selectedBooking.endTime}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-400">时长</span>
                <span className="text-dark-200">{selectedBooking.duration}小时</span>
              </div>
            </div>
            
            <p className="text-xs text-dark-500 mb-4">
              请在使用前15分钟到达工作室，向工作人员出示此二维码签到
            </p>
            
            <button
              onClick={() => setShowQrModal(false)}
              className="btn-secondary w-full"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
