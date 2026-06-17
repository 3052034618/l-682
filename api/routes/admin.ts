import { Router } from 'express';
import { getDb } from '../db/database.js';
import { authMiddleware } from './auth.js';
import type {
  DashboardStats, StudioStats, TimeSlotHeat, RevenueTrend,
  PricingSuggestion, MonthlyReport, ApiResponse, Booking, Studio
} from '../../shared/types.js';

const router = Router();

function adminOnly(req: any, res: any, next: any) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: '需要管理员权限' } as ApiResponse<null>);
  }
  next();
}

router.use(authMiddleware, adminOnly);

router.get('/dashboard', (req, res) => {
  const db = getDb();
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
  
  const recentBookings = db.bookings.filter(b => {
    const bookingDate = new Date(b.createdAt);
    return bookingDate >= new Date(thirtyDaysAgo);
  });
  
  const prevThirtyDays = db.bookings.filter(b => {
    const bookingDate = new Date(b.createdAt);
    return bookingDate >= new Date(thirtyDaysAgo) && bookingDate < new Date(thirtyDaysAgo);
  });
  
  const totalRevenue = recentBookings
    .filter(b => ['paid', 'confirmed', 'in_use', 'completed'].includes(b.status))
    .reduce((sum, b) => sum + b.totalPrice, 0);
  
  const prevRevenue = prevThirtyDays
    .filter(b => ['paid', 'confirmed', 'in_use', 'completed'].includes(b.status))
    .reduce((sum, b) => sum + b.totalPrice, 0);
  
  const revenueGrowth = prevRevenue > 0 
    ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) 
    : 100;
  
  const totalBookings = recentBookings.length;
  const prevBookings = prevThirtyDays.length;
  const bookingsGrowth = prevBookings > 0 
    ? Math.round(((totalBookings - prevBookings) / prevBookings) * 100) 
    : 100;
  
  const totalUsers = db.users.filter(u => u.role === 'user').length;
  
  const avgUtilization = calculateAvgUtilization(db.bookings, db.studios);
  
  const stats: DashboardStats = {
    totalRevenue,
    revenueGrowth,
    totalBookings,
    bookingsGrowth,
    totalUsers,
    usersGrowth: Math.round(totalUsers * 0.1),
    avgUtilization
  };
  
  res.json({ success: true, data: stats } as ApiResponse<DashboardStats>);
});

function calculateAvgUtilization(bookings: Booking[], studios: Studio[]): number {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
  
  let totalUtilization = 0;
  let count = 0;
  
  for (const studio of studios) {
    const studioBookings = bookings.filter(b => {
      if (b.studioId !== studio.id) return false;
      if (!['paid', 'confirmed', 'in_use', 'completed'].includes(b.status)) return false;
      const bookingDate = new Date(b.date);
      return bookingDate >= sevenDaysAgo && bookingDate <= now;
    });
    
    const totalHours = studioBookings.reduce((sum, b) => sum + b.duration, 0);
    const availableHours = 15 * 7;
    const utilization = Math.round((totalHours / availableHours) * 100);
    
    totalUtilization += Math.min(utilization, 100);
    count++;
  }
  
  return count > 0 ? Math.round(totalUtilization / count) : 0;
}

router.get('/studio-stats', (req, res) => {
  const db = getDb();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  
  const stats: StudioStats[] = db.studios.map(studio => {
    const studioBookings = db.bookings.filter(b => {
      if (b.studioId !== studio.id) return false;
      if (!['paid', 'confirmed', 'in_use', 'completed'].includes(b.status)) return false;
      const bookingDate = new Date(b.date);
      return bookingDate >= thirtyDaysAgo;
    });
    
    const revenue = studioBookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const totalDuration = studioBookings.reduce((sum, b) => sum + b.duration, 0);
    const avgDuration = studioBookings.length > 0 ? Math.round(totalDuration / studioBookings.length * 10) / 10 : 0;
    
    const availableHours = 15 * 30;
    const utilization = Math.min(100, Math.round((totalDuration / availableHours) * 100));
    
    return {
      studioId: studio.id,
      studioName: studio.name,
      utilization,
      revenue,
      bookingCount: studioBookings.length,
      avgDuration,
      hours: totalDuration
    };
  });
  
  res.json({ success: true, data: stats } as ApiResponse<StudioStats[]>);
});

router.get('/timeslot-heat', (req, res) => {
  const db = getDb();
  const { date } = req.query;
  const targetDate = date as string || new Date().toISOString().split('T')[0];
  
  const heatMap: TimeSlotHeat[] = [];
  
  for (let hour = 8; hour < 23; hour++) {
    const count = db.bookings.filter(b => {
      if (b.date !== targetDate) return false;
      if (!['paid', 'confirmed', 'in_use', 'completed'].includes(b.status)) return false;
      
      const start = parseInt(b.startTime.split(':')[0]);
      const end = parseInt(b.endTime.split(':')[0]);
      
      return hour >= start && hour < end;
    }).length;
    
    heatMap.push({ hour, count });
  }
  
  res.json({ success: true, data: heatMap } as ApiResponse<TimeSlotHeat[]>);
});

router.get('/revenue-trend', (req, res) => {
  const db = getDb();
  const { type = 'week' } = req.query;
  const now = new Date();
  
  let days = 7;
  if (type === 'month') days = 30;
  if (type === 'day') days = 1;
  
  const trend: RevenueTrend[] = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 86400000);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayBookings = db.bookings.filter(b => {
      if (b.date !== dateStr) return false;
      if (!['paid', 'confirmed', 'in_use', 'completed'].includes(b.status)) return false;
      return true;
    });
    
    const revenue = dayBookings.reduce((sum, b) => sum + b.totalPrice, 0);
    
    trend.push({
      date: dateStr,
      revenue,
      bookings: dayBookings.length
    });
  }
  
  res.json({ success: true, data: trend } as ApiResponse<RevenueTrend[]>);
});

router.get('/pricing-suggestions', (req, res) => {
  const db = getDb();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  
  const suggestions: PricingSuggestion[] = db.studios.map(studio => {
    const hourBookings: Record<number, number> = {};
    for (let h = 8; h < 23; h++) hourBookings[h] = 0;
    
    const studioBookings = db.bookings.filter(b => {
      if (b.studioId !== studio.id) return false;
      if (!['paid', 'confirmed', 'in_use', 'completed'].includes(b.status)) return false;
      const bookingDate = new Date(b.date);
      return bookingDate >= thirtyDaysAgo;
    });
    
    studioBookings.forEach(b => {
      const start = parseInt(b.startTime.split(':')[0]);
      const end = parseInt(b.endTime.split(':')[0]);
      for (let h = start; h < end; h++) {
        hourBookings[h]++;
      }
    });
    
    const hours = Object.entries(hourBookings)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count);
    
    const peakThreshold = Math.ceil(studioBookings.length * 0.6);
    const offPeakThreshold = Math.ceil(studioBookings.length * 0.3);
    
    const peakHours = hours.filter(h => h.count >= peakThreshold).map(h => h.hour).sort((a, b) => a - b);
    const offPeakHours = hours.filter(h => h.count <= offPeakThreshold && h.count > 0).map(h => h.hour).sort((a, b) => a - b);
    
    const priceMultiplier = peakHours.length > 4 ? 1.2 : 1.3;
    const offPeakMultiplier = offPeakHours.length > 4 ? 0.7 : 0.8;
    
    const suggestedPeakPrice = Math.round(studio.pricePerHour * priceMultiplier);
    const suggestedOffPeakPrice = Math.round(studio.pricePerHour * offPeakMultiplier);
    
    const peakRevenueGain = peakHours.length * (suggestedPeakPrice - studio.pricePerHour) * 20;
    const offPeakLoss = offPeakHours.length * (studio.pricePerHour - suggestedOffPeakPrice) * 10;
    const expectedRevenueIncrease = Math.round(peakRevenueGain - offPeakLoss);
    
    return {
      studioId: studio.id,
      studioName: studio.name,
      peakHours: peakHours.slice(0, 6),
      offPeakHours: offPeakHours.slice(0, 6),
      suggestedPeakPrice,
      suggestedOffPeakPrice,
      currentPrice: studio.pricePerHour,
      expectedRevenueIncrease: Math.max(0, expectedRevenueIncrease)
    };
  });
  
  res.json({ success: true, data: suggestions } as ApiResponse<PricingSuggestion[]>);
});

router.get('/report/monthly', (req, res) => {
  const db = getDb();
  const { month } = req.query;
  
  let targetMonth: string;
  if (month) {
    targetMonth = month as string;
  } else {
    const now = new Date();
    targetMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
  
  const monthBookings = db.bookings.filter(b => {
    if (!b.date.startsWith(targetMonth)) return false;
    return ['paid', 'confirmed', 'in_use', 'completed'].includes(b.status);
  });
  
  const totalRevenue = monthBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const totalHours = monthBookings.reduce((sum, b) => sum + b.duration, 0);
  
  const studioReports = db.studios.map(studio => {
    const studioBookings = monthBookings.filter(b => b.studioId === studio.id);
    const revenue = studioBookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const hours = studioBookings.reduce((sum, b) => sum + b.duration, 0);
    const daysInMonth = 30;
    const availableHours = 15 * daysInMonth;
    const utilization = Math.min(100, Math.round((hours / availableHours) * 100));
    
    return {
      studioId: studio.id,
      studioName: studio.name,
      revenue,
      bookings: studioBookings.length,
      hours,
      utilization,
      avgSatisfaction: studio.rating
    };
  });
  
  const avgSatisfaction = studioReports.length > 0
    ? Math.round(studioReports.reduce((sum, s) => sum + s.avgSatisfaction, 0) / studioReports.length * 10) / 10
    : 0;
  
  const report: MonthlyReport = {
    month: targetMonth,
    totalRevenue,
    totalBookings: monthBookings.length,
    totalHours,
    avgSatisfaction,
    studioReports
  };
  
  res.json({ success: true, data: report } as ApiResponse<MonthlyReport>);
});

router.get('/report/monthly/export', (req, res) => {
  const db = getDb();
  const { month } = req.query;
  
  let targetMonth: string;
  if (month) {
    targetMonth = month as string;
  } else {
    const now = new Date();
    targetMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
  
  const monthBookings = db.bookings.filter(b => {
    if (!b.date.startsWith(targetMonth)) return false;
    return ['paid', 'confirmed', 'in_use', 'completed'].includes(b.status);
  });
  
  const totalRevenue = monthBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const totalHours = monthBookings.reduce((sum, b) => sum + b.duration, 0);
  
  let csvContent = '月度运营报表\n';
  csvContent += `月份,${targetMonth}\n`;
  csvContent += `总收入,${totalRevenue}元\n`;
  csvContent += `总预约数,${monthBookings.length}\n`;
  csvContent += `总使用时长,${totalHours}小时\n\n`;
  
  csvContent += '各工作室数据\n';
  csvContent += '工作室名称,营收(元),预约数,使用时长(小时),利用率(%),满意度\n';
  
  db.studios.forEach(studio => {
    const studioBookings = monthBookings.filter(b => b.studioId === studio.id);
    const revenue = studioBookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const hours = studioBookings.reduce((sum, b) => sum + b.duration, 0);
    const utilization = Math.min(100, Math.round((hours / (15 * 30)) * 100));
    
    csvContent += `${studio.name},${revenue},${studioBookings.length},${hours},${utilization},${studio.rating}\n`;
  });
  
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="monthly-report-${targetMonth}.csv"`);
  
  const bom = '\uFEFF';
  res.send(bom + csvContent);
});

router.get('/bookings', (req, res) => {
  const db = getDb();
  const { status, studioId, date } = req.query;
  
  let bookings = [...db.bookings];
  
  if (status && status !== 'all') {
    bookings = bookings.filter(b => b.status === status);
  }
  
  if (studioId && studioId !== 'all') {
    bookings = bookings.filter(b => b.studioId === studioId);
  }
  
  if (date) {
    bookings = bookings.filter(b => b.date === date);
  }
  
  bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  res.json({ success: true, data: bookings } as ApiResponse<Booking[]>);
});

export default router;
