import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, saveDb } from '../db/database.js';
import { authMiddleware } from './auth.js';
import type { Payment, ApiResponse } from '../../shared/types.js';

const router = Router();

router.get('/', authMiddleware, (req: any, res) => {
  const db = getDb();
  
  const userBookingIds = db.bookings
    .filter(b => b.userId === req.user.id)
    .map(b => b.id);
  
  const userPayments = db.payments
    .filter(p => userBookingIds.includes(p.bookingId))
    .sort((a, b) => new Date(b.paidAt || 0).getTime() - new Date(a.paidAt || 0).getTime());
  
  res.json({ success: true, data: userPayments } as ApiResponse<Payment[]>);
});

router.post('/', authMiddleware, (req: any, res) => {
  const { bookingId, method } = req.body;
  const db = getDb();
  
  const booking = db.bookings.find(b => b.id === bookingId);
  
  if (!booking) {
    return res.status(404).json({ success: false, error: '预约不存在' } as ApiResponse<null>);
  }
  
  if (booking.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: '无权限操作' } as ApiResponse<null>);
  }
  
  if (booking.status === 'paid' || booking.status === 'confirmed') {
    return res.status(400).json({ success: false, error: '该预约已支付' } as ApiResponse<null>);
  }
  
  const payment: Payment = {
    id: `pay-${uuidv4().slice(0, 8)}`,
    bookingId,
    amount: booking.totalPrice,
    method: method || 'wechat',
    status: 'success',
    paidAt: new Date().toISOString()
  };
  
  db.payments.push(payment);
  
  const bookingIndex = db.bookings.findIndex(b => b.id === bookingId);
  if (bookingIndex !== -1) {
    db.bookings[bookingIndex].status = 'paid';
  }
  
  saveDb();
  
  res.json({ 
    success: true, 
    data: payment,
    message: '支付成功'
  } as ApiResponse<Payment>);
});

router.get('/:id', authMiddleware, (req: any, res) => {
  const db = getDb();
  const payment = db.payments.find(p => p.id === req.params.id);
  
  if (!payment) {
    return res.status(404).json({ success: false, error: '支付记录不存在' } as ApiResponse<null>);
  }
  
  const booking = db.bookings.find(b => b.id === payment.bookingId);
  if (booking && booking.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: '无权限查看' } as ApiResponse<null>);
  }
  
  res.json({ success: true, data: payment } as ApiResponse<Payment>);
});

router.post('/:id/refund', authMiddleware, (req: any, res) => {
  const { reason } = req.body;
  const db = getDb();
  const paymentIndex = db.payments.findIndex(p => p.id === req.params.id);
  
  if (paymentIndex === -1) {
    return res.status(404).json({ success: false, error: '支付记录不存在' } as ApiResponse<null>);
  }
  
  const payment = db.payments[paymentIndex];
  const booking = db.bookings.find(b => b.id === payment.bookingId);
  
  if (!booking) {
    return res.status(404).json({ success: false, error: '预约不存在' } as ApiResponse<null>);
  }
  
  if (booking.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: '无权限操作' } as ApiResponse<null>);
  }
  
  if (payment.status === 'refunded') {
    return res.status(400).json({ success: false, error: '该支付已退款' } as ApiResponse<null>);
  }
  
  const refundAmount = payment.amount * 0.8;
  
  db.payments[paymentIndex].status = 'refunded';
  db.payments[paymentIndex].refundAmount = refundAmount;
  
  saveDb();
  
  res.json({ 
    success: true, 
    data: db.payments[paymentIndex],
    message: `退款申请已提交，预计退款${refundAmount.toFixed(2)}元`
  } as ApiResponse<Payment>);
});

export default router;
