import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { getDb, saveDb } from '../db/database.js';
import { authMiddleware } from './auth.js';
import type { Booking, ApiResponse, CreateBookingRequest } from '../../shared/types.js';

const router = Router();

function generateQRCodeData(bookingId: string): string {
  return `studio-booking://${bookingId}`;
}

router.get('/', authMiddleware, (req: any, res) => {
  const db = getDb();
  const { status } = req.query;
  
  let bookings = db.bookings.filter(b => b.userId === req.user.id);
  
  if (status) {
    bookings = bookings.filter(b => b.status === status);
  }
  
  bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  res.json({ success: true, data: bookings } as ApiResponse<Booking[]>);
});

router.get('/:id', authMiddleware, (req: any, res) => {
  const db = getDb();
  const booking = db.bookings.find(b => b.id === req.params.id);
  
  if (!booking) {
    return res.status(404).json({ success: false, error: '预约不存在' } as ApiResponse<null>);
  }
  
  if (booking.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: '无权限查看' } as ApiResponse<null>);
  }
  
  res.json({ success: true, data: booking } as ApiResponse<Booking>);
});

router.post('/', authMiddleware, (req: any, res) => {
  const { studioId, date, startTime, endTime }: CreateBookingRequest = req.body;
  const db = getDb();
  
  const studio = db.studios.find(s => s.id === studioId);
  if (!studio) {
    return res.status(404).json({ success: false, error: '工作室不存在' } as ApiResponse<null>);
  }
  
  const startHour = parseInt(startTime.split(':')[0]);
  const endHour = parseInt(endTime.split(':')[0]);
  const duration = endHour - startHour;
  
  if (duration <= 0) {
    return res.status(400).json({ success: false, error: '结束时间必须晚于开始时间' } as ApiResponse<null>);
  }
  
  const conflictBooking = db.bookings.find(b => {
    if (b.studioId !== studioId || b.date !== date) return false;
    if (!['paid', 'confirmed', 'in_use'].includes(b.status)) return false;
    
    const bStart = parseInt(b.startTime.split(':')[0]);
    const bEnd = parseInt(b.endTime.split(':')[0]);
    
    return startHour < bEnd && endHour > bStart;
  });
  
  if (conflictBooking) {
    return res.status(409).json({ success: false, error: '该时段已被预约，请选择其他时段' } as ApiResponse<null>);
  }
  
  const totalPrice = duration * studio.pricePerHour;
  const bookingId = `booking-${uuidv4().slice(0, 8)}`;
  const qrCode = generateQRCodeData(bookingId);
  
  const newBooking: Booking = {
    id: bookingId,
    userId: req.user.id,
    studioId,
    studioName: studio.name,
    date,
    startTime,
    endTime,
    duration,
    totalPrice,
    status: 'pending',
    qrCode,
    createdAt: new Date().toISOString()
  };
  
  db.bookings.push(newBooking);
  saveDb();
  
  res.status(201).json({ success: true, data: newBooking } as ApiResponse<Booking>);
});

router.post('/:id/checkin', authMiddleware, (req: any, res) => {
  const db = getDb();
  const bookingIndex = db.bookings.findIndex(b => b.id === req.params.id);
  
  if (bookingIndex === -1) {
    return res.status(404).json({ success: false, error: '预约不存在' } as ApiResponse<null>);
  }
  
  const booking = db.bookings[bookingIndex];
  
  if (booking.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: '无权限操作' } as ApiResponse<null>);
  }
  
  if (booking.status !== 'paid' && booking.status !== 'confirmed') {
    return res.status(400).json({ success: false, error: '当前状态无法签到' } as ApiResponse<null>);
  }
  
  db.bookings[bookingIndex].status = 'in_use';
  db.bookings[bookingIndex].checkInTime = new Date().toISOString();
  saveDb();
  
  res.json({ success: true, data: db.bookings[bookingIndex], message: '签到成功' } as ApiResponse<Booking>);
});

router.post('/:id/checkout', authMiddleware, (req: any, res) => {
  const db = getDb();
  const bookingIndex = db.bookings.findIndex(b => b.id === req.params.id);
  
  if (bookingIndex === -1) {
    return res.status(404).json({ success: false, error: '预约不存在' } as ApiResponse<null>);
  }
  
  const booking = db.bookings[bookingIndex];
  
  if (booking.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: '无权限操作' } as ApiResponse<null>);
  }
  
  if (booking.status !== 'in_use') {
    return res.status(400).json({ success: false, error: '当前状态无法结束使用' } as ApiResponse<null>);
  }
  
  db.bookings[bookingIndex].status = 'completed';
  db.bookings[bookingIndex].checkOutTime = new Date().toISOString();
  saveDb();
  
  res.json({ success: true, data: db.bookings[bookingIndex], message: '使用已结束' } as ApiResponse<Booking>);
});

router.post('/:id/renew', authMiddleware, (req: any, res) => {
  const { hours } = req.body;
  const db = getDb();
  const bookingIndex = db.bookings.findIndex(b => b.id === req.params.id);
  
  if (bookingIndex === -1) {
    return res.status(404).json({ success: false, error: '预约不存在' } as ApiResponse<null>);
  }
  
  const booking = db.bookings[bookingIndex];
  
  if (booking.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: '无权限操作' } as ApiResponse<null>);
  }
  
  if (booking.status !== 'in_use' && booking.status !== 'paid' && booking.status !== 'confirmed') {
    return res.status(400).json({ success: false, error: '当前状态无法续费' } as ApiResponse<null>);
  }
  
  const studio = db.studios.find(s => s.id === booking.studioId);
  if (!studio) {
    return res.status(404).json({ success: false, error: '工作室不存在' } as ApiResponse<null>);
  }
  
  const currentEndHour = parseInt(booking.endTime.split(':')[0]);
  const newEndHour = currentEndHour + hours;
  
  if (newEndHour > 23) {
    return res.status(400).json({ success: false, error: '续费后时间超过营业时间（23:00）' } as ApiResponse<null>);
  }
  
  const conflictBooking = db.bookings.find(b => {
    if (b.id === booking.id) return false;
    if (b.studioId !== booking.studioId || b.date !== booking.date) return false;
    if (!['paid', 'confirmed', 'in_use'].includes(b.status)) return false;
    
    const bStart = parseInt(b.startTime.split(':')[0]);
    const bEnd = parseInt(b.endTime.split(':')[0]);
    
    return currentEndHour < bEnd && newEndHour > bStart;
  });
  
  if (conflictBooking) {
    return res.status(409).json({ success: false, error: '续时段已被预约' } as ApiResponse<null>);
  }
  
  const renewPrice = hours * studio.pricePerHour;
  
  db.bookings[bookingIndex].endTime = `${newEndHour.toString().padStart(2, '0')}:00`;
  db.bookings[bookingIndex].duration += hours;
  db.bookings[bookingIndex].totalPrice += renewPrice;
  
  db.payments.push({
    id: `pay-${uuidv4().slice(0, 8)}`,
    bookingId: booking.id,
    amount: renewPrice,
    method: 'card',
    status: 'success',
    paidAt: new Date().toISOString(),
    reason: '手动续费',
  } as any);
  
  saveDb();
  
  res.json({ 
    success: true, 
    data: db.bookings[bookingIndex], 
    message: `续费成功，延长${hours}小时，费用${renewPrice}元` 
  } as ApiResponse<Booking>);
});

router.post('/:id/cancel', authMiddleware, (req: any, res) => {
  const db = getDb();
  const bookingIndex = db.bookings.findIndex(b => b.id === req.params.id);
  
  if (bookingIndex === -1) {
    return res.status(404).json({ success: false, error: '预约不存在' } as ApiResponse<null>);
  }
  
  const booking = db.bookings[bookingIndex];
  
  if (booking.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: '无权限操作' } as ApiResponse<null>);
  }
  
  if (booking.status === 'completed' || booking.status === 'cancelled' || booking.status === 'no_show') {
    return res.status(400).json({ success: false, error: '当前状态无法取消' } as ApiResponse<null>);
  }
  
  const bookingDate = new Date(`${booking.date}T${booking.startTime}`);
  const now = new Date();
  const hoursDiff = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  let refundRate = 1;
  if (hoursDiff < 2) {
    refundRate = 0;
  } else if (hoursDiff < 24) {
    refundRate = 0.5;
  }
  
  db.bookings[bookingIndex].status = 'cancelled';
  saveDb();
  
  const refundAmount = Math.round(booking.totalPrice * refundRate * 100) / 100;
  
  res.json({ 
    success: true, 
    data: db.bookings[bookingIndex], 
    message: `取消成功，退款${refundAmount}元（退款比例${(refundRate * 100).toFixed(0)}%）` 
  } as ApiResponse<Booking>);
});

router.get('/:id/qrcode', authMiddleware, async (req: any, res) => {
  const db = getDb();
  const booking = db.bookings.find(b => b.id === req.params.id);
  
  if (!booking) {
    return res.status(404).json({ success: false, error: '预约不存在' } as ApiResponse<null>);
  }
  
  if (booking.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: '无权限查看' } as ApiResponse<null>);
  }
  
  try {
    const qrDataUrl = await QRCode.toDataURL(booking.qrCode, {
      width: 200,
      margin: 2,
      color: {
        dark: '#6366f1',
        light: '#ffffff'
      }
    });
    
    res.json({ success: true, data: { qrCode: qrDataUrl } } as ApiResponse<{ qrCode: string }>);
  } catch (err) {
    res.status(500).json({ success: false, error: '生成二维码失败' } as ApiResponse<null>);
  }
});

export default router;
