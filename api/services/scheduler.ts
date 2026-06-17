import { getDb, saveDb } from '../db/database.js';
import { v4 as uuidv4 } from 'uuid';
import type { Payment } from '../../shared/types.js';

const NO_SHOW_GRACE_MINUTES = 15;
const AUTO_RENEW_GRACE_MINUTES = 5;

export function processNoShowBookings() {
  const db = getDb();
  const now = new Date();
  let changed = false;

  for (let i = 0; i < db.bookings.length; i++) {
    const booking = db.bookings[i];
    if (!['paid', 'confirmed'].includes(booking.status)) continue;

    const bookingStart = new Date(`${booking.date}T${booking.startTime}`);
    const graceTime = new Date(bookingStart.getTime() + NO_SHOW_GRACE_MINUTES * 60 * 1000);

    if (now > graceTime) {
      db.bookings[i].status = 'no_show';
      db.bookings[i].noShowInfo = {
        originalPrice: booking.totalPrice,
        penaltyAmount: Math.round(booking.totalPrice * 0.5 * 100) / 100,
        refundAmount: Math.round(booking.totalPrice * 0.5 * 100) / 100,
        releasedAt: now.toISOString(),
      };
      changed = true;

      const penaltyAmount = Math.round(booking.totalPrice * 0.5 * 100) / 100;
      const refundAmount = booking.totalPrice - penaltyAmount;

      const existingPayment = db.payments.find(p => p.bookingId === booking.id && p.status === 'success');
      if (existingPayment && refundAmount > 0) {
        db.payments.push({
          id: `pay-${uuidv4().slice(0, 8)}`,
          bookingId: booking.id,
          amount: -refundAmount,
          method: existingPayment.method,
          status: 'refunded',
          paidAt: now.toISOString(),
          refundAmount,
          reason: '未到场自动退款（扣除50%违约金）',
        } as Payment);
      }
    }
  }

  if (changed) saveDb();
}

export function processAutoRenew() {
  const db = getDb();
  const now = new Date();
  let changed = false;

  for (let i = 0; i < db.bookings.length; i++) {
    const booking = db.bookings[i];
    if (booking.status !== 'in_use') continue;

    const bookingEnd = new Date(`${booking.date}T${booking.endTime}`);
    const graceTime = new Date(bookingEnd.getTime() + AUTO_RENEW_GRACE_MINUTES * 60 * 1000);

    if (now > bookingEnd && now < graceTime) {
      const studio = db.studios.find(s => s.id === booking.studioId);
      if (!studio) continue;

      const currentEndHour = parseInt(booking.endTime.split(':')[0]);
      if (currentEndHour >= 22) continue;

      const nextEndHour = currentEndHour + 1;

      const conflict = db.bookings.find(b => {
        if (b.id === booking.id) return false;
        if (b.studioId !== booking.studioId || b.date !== booking.date) return false;
        if (!['paid', 'confirmed', 'in_use'].includes(b.status)) return false;
        const bStart = parseInt(b.startTime.split(':')[0]);
        const bEnd = parseInt(b.endTime.split(':')[0]);
        return currentEndHour < bEnd && nextEndHour > bStart;
      });

      if (conflict) continue;

      const renewPrice = studio.pricePerHour;

      db.bookings[i].endTime = `${String(nextEndHour).padStart(2, '0')}:00`;
      db.bookings[i].duration += 1;
      db.bookings[i].totalPrice += renewPrice;
      db.bookings[i].autoRenewed = true;
      db.bookings[i].lastRenewTime = now.toISOString();
      changed = true;

      db.payments.push({
        id: `pay-${uuidv4().slice(0, 8)}`,
        bookingId: booking.id,
        amount: renewPrice,
        method: 'card',
        status: 'success',
        paidAt: now.toISOString(),
        reason: '超时自动续费',
      } as Payment);
    }
  }

  if (changed) saveDb();
}

export function startScheduler() {
  setInterval(() => {
    try {
      processNoShowBookings();
      processAutoRenew();
    } catch (e) {
      console.error('Scheduler error:', e);
    }
  }, 30000);

  processNoShowBookings();
  processAutoRenew();
}
