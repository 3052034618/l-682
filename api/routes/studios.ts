import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, saveDb } from '../db/database.js';
import { authMiddleware } from './auth.js';
import type { Studio, ApiResponse, TimeSlot } from '../../shared/types.js';

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { type, sort } = req.query;
  
  let studios = [...db.studios];
  
  if (type && type !== 'all') {
    studios = studios.filter(s => s.type === type);
  }
  
  if (sort === 'price-asc') {
    studios.sort((a, b) => a.pricePerHour - b.pricePerHour);
  } else if (sort === 'price-desc') {
    studios.sort((a, b) => b.pricePerHour - a.pricePerHour);
  } else if (sort === 'rating') {
    studios.sort((a, b) => b.rating - a.rating);
  }
  
  res.json({ success: true, data: studios } as ApiResponse<Studio[]>);
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const studio = db.studios.find(s => s.id === req.params.id);
  
  if (!studio) {
    return res.status(404).json({ success: false, error: '工作室不存在' } as ApiResponse<null>);
  }
  
  res.json({ success: true, data: studio } as ApiResponse<Studio>);
});

router.get('/:id/availability', (req, res) => {
  const { id } = req.params;
  const { date } = req.query;
  
  if (!date) {
    return res.status(400).json({ success: false, error: '请提供日期参数' } as ApiResponse<null>);
  }
  
  const db = getDb();
  const studio = db.studios.find(s => s.id === id);
  
  if (!studio) {
    return res.status(404).json({ success: false, error: '工作室不存在' } as ApiResponse<null>);
  }
  
  const dateStr = date as string;
  const bookings = db.bookings.filter(
    b => b.studioId === id && b.date === dateStr && ['paid', 'confirmed', 'in_use'].includes(b.status)
  );
  
  const timeSlots: TimeSlot[] = [];
  const startHour = 8;
  const endHour = 23;
  
  for (let hour = startHour; hour < endHour; hour++) {
    const startTime = `${hour.toString().padStart(2, '0')}:00`;
    const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
    
    const booking = bookings.find(b => {
      const start = parseInt(b.startTime.split(':')[0]);
      const end = parseInt(b.endTime.split(':')[0]);
      return hour >= start && hour < end;
    });
    
    timeSlots.push({
      startTime,
      endTime,
      available: !booking,
      bookingId: booking?.id
    });
  }
  
  res.json({ success: true, data: timeSlots } as ApiResponse<TimeSlot[]>);
});

router.post('/', authMiddleware, (req: any, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: '无权限操作' } as ApiResponse<null>);
  }
  
  const db = getDb();
  const { name, description, image, pricePerHour, equipment, capacity, type } = req.body;
  
  const newStudio: Studio = {
    id: `studio-${uuidv4().slice(0, 8)}`,
    name,
    description: description || '',
    image: image || 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80',
    pricePerHour: Number(pricePerHour),
    equipment: equipment || [],
    capacity: Number(capacity) || 4,
    type: type || '录音室',
    rating: 5,
    reviewCount: 0
  };
  
  db.studios.push(newStudio);
  saveDb();
  
  res.status(201).json({ success: true, data: newStudio } as ApiResponse<Studio>);
});

router.put('/:id', authMiddleware, (req: any, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: '无权限操作' } as ApiResponse<null>);
  }
  
  const db = getDb();
  const studioIndex = db.studios.findIndex(s => s.id === req.params.id);
  
  if (studioIndex === -1) {
    return res.status(404).json({ success: false, error: '工作室不存在' } as ApiResponse<null>);
  }
  
  const { name, description, image, pricePerHour, equipment, capacity, type } = req.body;
  
  if (name) db.studios[studioIndex].name = name;
  if (description !== undefined) db.studios[studioIndex].description = description;
  if (image) db.studios[studioIndex].image = image;
  if (pricePerHour !== undefined) db.studios[studioIndex].pricePerHour = Number(pricePerHour);
  if (equipment) db.studios[studioIndex].equipment = equipment;
  if (capacity !== undefined) db.studios[studioIndex].capacity = Number(capacity);
  if (type) db.studios[studioIndex].type = type;
  
  saveDb();
  
  res.json({ success: true, data: db.studios[studioIndex] } as ApiResponse<Studio>);
});

router.delete('/:id', authMiddleware, (req: any, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: '无权限操作' } as ApiResponse<null>);
  }
  
  const db = getDb();
  const studioIndex = db.studios.findIndex(s => s.id === req.params.id);
  
  if (studioIndex === -1) {
    return res.status(404).json({ success: false, error: '工作室不存在' } as ApiResponse<null>);
  }
  
  db.studios.splice(studioIndex, 1);
  saveDb();
  
  res.json({ success: true, message: '删除成功' } as ApiResponse<null>);
});

export default router;
