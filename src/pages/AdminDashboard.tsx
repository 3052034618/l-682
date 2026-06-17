import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Calendar, Music, Users, TrendingUp, TrendingDown,
  DollarSign, BarChart3, Clock, Star, Download, Settings, ChevronDown,
  Lightbulb, ArrowUpRight, ArrowDownRight, FileText, QrCode
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import type {
  DashboardStats, StudioStats, TimeSlotHeat, RevenueTrend, PricingSuggestion
} from '../../shared/types';
import { adminApi } from '@/lib/api';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [studioStats, setStudioStats] = useState<StudioStats[]>([]);
  const [timeslotHeat, setTimeslotHeat] = useState<TimeSlotHeat[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrend[]>([]);
  const [pricingSuggestions, setPricingSuggestions] = useState<PricingSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendType, setTrendType] = useState<'day' | 'week' | 'month'>('week');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    const now = new Date();
    setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  }, []);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchOverviewData();
    } else if (activeTab === 'pricing') {
      fetchPricingData();
    }
  }, [activeTab, trendType]);

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      const [statsData, studiosData, heatData, trendData] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getStudioStats(),
        adminApi.getTimeslotHeat(),
        adminApi.getRevenueTrend(trendType),
      ]);
      setStats(statsData);
      setStudioStats(studiosData);
      setTimeslotHeat(heatData);
      setRevenueTrend(trendData);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPricingData = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getPricingSuggestions();
      setPricingSuggestions(data);
    } catch (err) {
      console.error('Failed to fetch pricing data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    adminApi.exportMonthlyReport(selectedMonth);
    setShowExportMenu(false);
  };

  const PIE_COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#f59e0b', '#06b6d4', '#10b981'];

  const StatCard = ({ title, value, growth, icon: Icon, color }: {
    title: string;
    value: string | number;
    growth?: number;
    icon: any;
    color: string;
  }) => (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {growth !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${
            growth >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {growth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            <span>{Math.abs(growth)}%</span>
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-dark-50 mb-1">{value}</div>
      <div className="text-sm text-dark-400">{title}</div>
    </div>
  );

  const navItems = [
    { id: 'overview', label: '数据概览', icon: LayoutDashboard },
    { id: 'studios', label: '工作室管理', icon: Music },
    { id: 'bookings', label: '预约管理', icon: Calendar },
    { id: 'pricing', label: '定价策略', icon: Settings },
    { id: 'reports', label: '报表中心', icon: FileText },
  ];

  return (
    <div className="min-h-screen pt-20 bg-dark-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          <aside className="md:w-64 flex-shrink-0">
            <div className="card p-4 sticky top-24">
              <div className="mb-6 px-2">
                <h2 className="font-display text-xl font-bold gradient-text">管理后台</h2>
                <p className="text-xs text-dark-500 mt-1">Sonic Studio Admin</p>
              </div>
              
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      activeTab === item.id
                        ? 'bg-gradient-to-r from-primary-500/20 to-purple-500/20 text-primary-300 border border-primary-500/30'
                        : 'text-dark-400 hover:bg-dark-700/50 hover:text-dark-200'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>
              
              <div className="mt-6 pt-4 border-t border-dark-700/50">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-dark-300 hover:bg-dark-700/50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Download className="w-5 h-5" />
                    <span>导出报表</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showExportMenu && (
                  <div className="mt-2 px-2 space-y-1 animate-slide-down">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg bg-dark-700/50 text-dark-200 text-sm border border-dark-600/30"
                      />
                    </div>
                    <button
                      onClick={handleExportReport}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-primary-400 hover:bg-primary-500/10"
                    >
                      导出月度运营报表
                    </button>
                  </div>
                )}
              </div>
            </div>
          </aside>
          
          <main className="flex-1 min-w-0">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title="总收入"
                    value={`¥${stats?.totalRevenue?.toLocaleString() || 0}`}
                    growth={stats?.revenueGrowth}
                    icon={DollarSign}
                    color="bg-gradient-to-br from-emerald-500 to-teal-600"
                  />
                  <StatCard
                    title="总预约数"
                    value={stats?.totalBookings || 0}
                    growth={stats?.bookingsGrowth}
                    icon={Calendar}
                    color="bg-gradient-to-br from-primary-500 to-purple-600"
                  />
                  <StatCard
                    title="注册用户"
                    value={stats?.totalUsers || 0}
                    growth={stats?.usersGrowth}
                    icon={Users}
                    color="bg-gradient-to-br from-amber-500 to-orange-600"
                  />
                  <StatCard
                    title="平均利用率"
                    value={`${stats?.avgUtilization || 0}%`}
                    icon={BarChart3}
                    color="bg-gradient-to-br from-rose-500 to-pink-600"
                  />
                </div>
                
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-dark-50">收入趋势</h3>
                    <div className="flex items-center gap-2 p-1 rounded-lg bg-dark-800/60">
                      {(['day', 'week', 'month'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setTrendType(type)}
                          className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                            trendType === type
                              ? 'bg-primary-500/20 text-primary-300'
                              : 'text-dark-400 hover:text-dark-200'
                          }`}
                        >
                          {type === 'day' ? '日' : type === 'week' ? '周' : '月'}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {loading ? (
                    <div className="h-64 flex items-center justify-center">
                      <div className="animate-pulse text-dark-500">加载中...</div>
                    </div>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueTrend}>
                          <defs>
                            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis
                            dataKey="date"
                            stroke="#64748b"
                            fontSize={12}
                            tickFormatter={(value) => value.slice(5)}
                          />
                          <YAxis stroke="#64748b" fontSize={12} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              border: '1px solid #334155',
                              borderRadius: '8px',
                              color: '#f1f5f9'
                            }}
                            formatter={(value: number) => [`¥${value}`, '收入']}
                          />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#6366f1"
                            strokeWidth={2}
                            fill="url(#revenueGradient)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
                
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-dark-50 mb-6">工作室使用率</h3>
                    
                    {loading ? (
                      <div className="h-64 flex items-center justify-center">
                        <div className="animate-pulse text-dark-500">加载中...</div>
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={studioStats}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={90}
                              paddingAngle={2}
                              dataKey="utilization"
                              nameKey="studioName"
                            >
                              {studioStats.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#1e293b',
                                border: '1px solid #334155',
                                borderRadius: '8px',
                                color: '#f1f5f9'
                              }}
                              formatter={(value: number) => [`${value}%`, '使用率']}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {studioStats.slice(0, 4).map((studio, index) => (
                        <div key={studio.studioId} className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                          />
                          <span className="text-xs text-dark-400 truncate">{studio.studioName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-dark-50 mb-6">时段热度</h3>
                    
                    {loading ? (
                      <div className="h-64 flex items-center justify-center">
                        <div className="animate-pulse text-dark-500">加载中...</div>
                      </div>
                    ) : (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={timeslotHeat}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
                            <YAxis stroke="#64748b" fontSize={11} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#1e293b',
                                border: '1px solid #334155',
                                borderRadius: '8px',
                                color: '#f1f5f9'
                              }}
                              formatter={(value: number) => [value, '预约数']}
                              labelFormatter={(label) => `${label}:00`}
                            />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                              {timeslotHeat.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.count > 3 ? '#f59e0b' : '#6366f1'}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-center gap-6 mt-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-primary-500" />
                        <span className="text-xs text-dark-400">平峰时段</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-gold-500" />
                        <span className="text-xs text-dark-400">高峰时段</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="card p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-amber-500 flex items-center justify-center">
                      <Lightbulb className="w-5 h-5 text-dark-900" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-dark-50">智能定价建议</h3>
                      <p className="text-sm text-dark-400">基于时段热度分析，优化定价策略提升营收</p>
                    </div>
                  </div>
                  
                  {loading ? (
                    <div className="h-32 flex items-center justify-center">
                      <div className="animate-pulse text-dark-500">加载中...</div>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {pricingSuggestions.slice(0, 3).map((suggestion) => (
                        <div
                          key={suggestion.studioId}
                          className="p-4 rounded-xl bg-gradient-to-br from-gold-500/10 to-amber-500/5 border border-gold-500/20"
                        >
                          <h4 className="font-medium text-dark-100 mb-2">{suggestion.studioName}</h4>
                          <div className="text-sm text-dark-400 mb-3">
                            当前价格: <span className="text-dark-200">¥{suggestion.currentPrice}/小时</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                            <div className="p-2 rounded-lg bg-dark-800/50">
                              <div className="text-rose-400">高峰建议价</div>
                              <div className="text-dark-100 font-semibold">¥{suggestion.suggestedPeakPrice}</div>
                            </div>
                            <div className="p-2 rounded-lg bg-dark-800/50">
                              <div className="text-emerald-400">低谷建议价</div>
                              <div className="text-dark-100 font-semibold">¥{suggestion.suggestedOffPeakPrice}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gold-400">
                            <TrendingUp className="w-3 h-3" />
                            <span>预计增收 ¥{suggestion.expectedRevenueIncrease}/月</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'studios' && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-dark-50">工作室列表</h3>
                  <button className="btn-primary text-sm py-2 px-4">新增工作室</button>
                </div>
                
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-20 bg-dark-700/30 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {studioStats.map((studio, index) => (
                      <div
                        key={studio.studioId}
                        className="flex items-center gap-4 p-4 rounded-xl bg-dark-800/30 hover:bg-dark-700/30 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${PIE_COLORS[index % PIE_COLORS.length]}30` }}
                        >
                          <Music className="w-6 h-6" style={{ color: PIE_COLORS[index % PIE_COLORS.length] }} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-dark-100">{studio.studioName}</h4>
                          <p className="text-sm text-dark-500">
                            {studio.bookingCount} 笔预约 · {studio.hours || 0} 小时 · 利用率 {studio.utilization}%
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-semibold text-emerald-400">
                            ¥{studio.revenue.toLocaleString()}
                          </div>
                          <div className="text-xs text-dark-500">本月收入</div>
                        </div>
                        
                        <button className="p-2 rounded-lg text-dark-400 hover:text-dark-200 hover:bg-dark-700/50">
                          <Settings className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'bookings' && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-dark-50">预约管理</h3>
                  <div className="flex items-center gap-2">
                    <select className="px-3 py-2 rounded-lg bg-dark-800/60 text-dark-200 text-sm border border-dark-600/30 outline-none">
                      <option value="all">全部状态</option>
                      <option value="paid">已支付</option>
                      <option value="in_use">使用中</option>
                      <option value="completed">已完成</option>
                    </select>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-dark-700/50">
                        <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">工作室</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">日期</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">时间</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">金额</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">状态</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <tr key={i} className="border-b border-dark-800/30 hover:bg-dark-700/20">
                          <td className="py-4 px-4 text-dark-200">旗舰录音棚 A</td>
                          <td className="py-4 px-4 text-dark-300">2025-06-15</td>
                          <td className="py-4 px-4 text-dark-300">10:00 - 14:00</td>
                          <td className="py-4 px-4 text-dark-200 font-medium">¥2,000</td>
                          <td className="py-4 px-4">
                            <span className="badge badge-success">已完成</span>
                          </td>
                          <td className="py-4 px-4">
                            <button className="text-primary-400 hover:text-primary-300 text-sm">详情</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {activeTab === 'pricing' && (
              <div className="space-y-6">
                <div className="card p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-400 to-amber-500 flex items-center justify-center">
                      <Lightbulb className="w-6 h-6 text-dark-900" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-dark-50">智能定价建议</h3>
                      <p className="text-sm text-dark-400">
                        基于过去30天的时段热度分析，为每个工作室提供差异化定价建议
                      </p>
                    </div>
                  </div>
                  
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-32 bg-dark-700/30 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pricingSuggestions.map((suggestion) => (
                        <div
                          key={suggestion.studioId}
                          className="p-6 rounded-xl bg-gradient-to-r from-dark-800/50 to-dark-800/30 border border-dark-700/50"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="text-lg font-semibold text-dark-50">{suggestion.studioName}</h4>
                              <p className="text-sm text-dark-400">当前价格: ¥{suggestion.currentPrice}/小时</p>
                            </div>
                            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-sm">
                              <TrendingUp className="w-4 h-4" />
                              <span>预计增收 ¥{suggestion.expectedRevenueIncrease}</span>
                            </div>
                          </div>
                          
                          <div className="grid md:grid-cols-3 gap-4">
                            <div className="p-4 rounded-xl bg-dark-800/50">
                              <div className="text-sm text-dark-400 mb-2">高峰时段</div>
                              <div className="text-lg font-bold text-rose-400 mb-2">
                                ¥{suggestion.suggestedPeakPrice}/小时
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {suggestion.peakHours.slice(0, 4).map((hour) => (
                                  <span key={hour} className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-xs">
                                    {hour}:00
                                  </span>
                                ))}
                                {suggestion.peakHours.length > 4 && (
                                  <span className="px-2 py-0.5 rounded bg-dark-700/50 text-dark-400 text-xs">
                                    +{suggestion.peakHours.length - 4}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="p-4 rounded-xl bg-dark-800/50">
                              <div className="text-sm text-dark-400 mb-2">低谷时段</div>
                              <div className="text-lg font-bold text-emerald-400 mb-2">
                                ¥{suggestion.suggestedOffPeakPrice}/小时
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {suggestion.offPeakHours.slice(0, 4).map((hour) => (
                                  <span key={hour} className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs">
                                    {hour}:00
                                  </span>
                                ))}
                                {suggestion.offPeakHours.length > 4 && (
                                  <span className="px-2 py-0.5 rounded bg-dark-700/50 text-dark-400 text-xs">
                                    +{suggestion.offPeakHours.length - 4}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/20">
                              <div className="text-sm text-dark-400 mb-2">预期效果</div>
                              <div className="text-lg font-bold gradient-text mb-2">
                                +{((suggestion.expectedRevenueIncrease / (suggestion.currentPrice * 150)) * 100).toFixed(1)}% 营收增长
                              </div>
                              <button className="w-full btn-primary text-sm py-2 mt-2">
                                应用定价
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-dark-50 mb-6">月度运营报表</h3>
                  
                  <div className="flex items-center gap-4 mb-6">
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="px-4 py-2 rounded-lg bg-dark-800/60 text-dark-200 border border-dark-600/30 outline-none"
                    />
                    <button
                      onClick={handleExportReport}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      导出 CSV
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-dark-700/50">
                          <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">工作室</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-dark-400">营收</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-dark-400">预约数</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-dark-400">使用时长</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-dark-400">利用率</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-dark-400">满意度</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studioStats.map((studio, index) => (
                          <tr key={studio.studioId} className="border-b border-dark-800/30 hover:bg-dark-700/20">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                  style={{ backgroundColor: `${PIE_COLORS[index % PIE_COLORS.length]}30` }}
                                >
                                  <Music className="w-4 h-4" style={{ color: PIE_COLORS[index % PIE_COLORS.length] }} />
                                </div>
                                <span className="text-dark-200">{studio.studioName}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right text-emerald-400 font-medium">
                              ¥{studio.revenue.toLocaleString()}
                            </td>
                            <td className="py-4 px-4 text-right text-dark-300">
                              {studio.bookingCount}
                            </td>
                            <td className="py-4 px-4 text-right text-dark-300">
                              {studio.hours || 0} 小时
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-20 h-2 rounded-full bg-dark-700 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-primary-500 to-purple-500"
                                    style={{ width: `${studio.utilization}%` }}
                                  />
                                </div>
                                <span className="text-dark-300 text-sm">{studio.utilization}%</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Star className="w-4 h-4 text-gold-400 fill-gold-400" />
                                <span className="text-dark-200">{(studio as any).avgSatisfaction || 4.8}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
