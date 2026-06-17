import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, saveDb } from '../db/database.js';
import { authMiddleware } from './auth.js';
import type { Work, ApiResponse, WorkRating } from '../../shared/types.js';

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { sort, type, recommended } = req.query;
  
  let works = [...db.works];
  
  if (type && type !== 'all') {
    works = works.filter(w => w.mediaType === type);
  }
  
  if (recommended === 'true') {
    works = works.filter(w => w.isRecommended);
  }
  
  if (sort === 'popular') {
    works.sort((a, b) => (b.plays + b.likes * 10) - (a.plays + a.likes * 10));
  } else if (sort === 'latest') {
    works.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (sort === 'rating') {
    works.sort((a, b) => b.rating - a.rating);
  }
  
  res.json({ success: true, data: works } as ApiResponse<Work[]>);
});

router.get('/recommended', (req, res) => {
  const db = getDb();
  const recommended = db.works
    .filter(w => w.isRecommended)
    .sort((a, b) => (b.plays + b.likes * 10) - (a.plays + a.likes * 10))
    .slice(0, 6);
  
  res.json({ success: true, data: recommended } as ApiResponse<Work[]>);
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const workIndex = db.works.findIndex(w => w.id === req.params.id);
  
  if (workIndex === -1) {
    return res.status(404).json({ success: false, error: '作品不存在' } as ApiResponse<null>);
  }
  
  db.works[workIndex].plays += 1;
  saveDb();
  
  res.json({ success: true, data: db.works[workIndex] } as ApiResponse<Work>);
});

router.get('/user/:userId', (req, res) => {
  const db = getDb();
  const userWorks = db.works
    .filter(w => w.userId === req.params.userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  res.json({ success: true, data: userWorks } as ApiResponse<Work[]>);
});

router.post('/', authMiddleware, (req: any, res) => {
  const { title, description, coverImage, mediaUrl, mediaType, duration, bookingId } = req.body;
  const db = getDb();
  
  const newWork: Work = {
    id: `work-${uuidv4().slice(0, 8)}`,
    userId: req.user.id,
    username: req.user.username,
    userAvatar: req.user.avatar,
    bookingId,
    title,
    description: description || '',
    coverImage: coverImage || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80',
    mediaUrl: mediaUrl || '/audio/demo.mp3',
    mediaType: mediaType || 'audio',
    duration: Number(duration) || 0,
    plays: 0,
    likes: 0,
    rating: 0,
    ratingCount: 0,
    isRecommended: false,
    createdAt: new Date().toISOString()
  };
  
  db.works.push(newWork);
  saveDb();
  
  res.status(201).json({ success: true, data: newWork, message: '作品上传成功' } as ApiResponse<Work>);
});

router.post('/:id/like', authMiddleware, (req: any, res) => {
  const db = getDb();
  const workIndex = db.works.findIndex(w => w.id === req.params.id);
  
  if (workIndex === -1) {
    return res.status(404).json({ success: false, error: '作品不存在' } as ApiResponse<null>);
  }
  
  const existingLike = db.workLikes.find(l => l.userId === req.user.id && l.workId === req.params.id);
  
  let liked: boolean;
  if (existingLike) {
    const likeIndex = db.workLikes.findIndex(l => l.id === existingLike.id);
    db.workLikes.splice(likeIndex, 1);
    db.works[workIndex].likes = Math.max(0, db.works[workIndex].likes - 1);
    liked = false;
  } else {
    db.workLikes.push({
      id: `like-${uuidv4().slice(0, 8)}`,
      userId: req.user.id,
      workId: req.params.id,
      createdAt: new Date().toISOString()
    });
    db.works[workIndex].likes += 1;
    liked = true;
  }
  
  saveDb();
  
  res.json({ 
    success: true, 
    data: { liked, likes: db.works[workIndex].likes },
    message: liked ? '点赞成功' : '取消点赞'
  } as ApiResponse<{ liked: boolean; likes: number }>);
});

router.post('/:id/rating', authMiddleware, (req: any, res) => {
  const { rating } = req.body;
  const db = getDb();
  
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, error: '评分必须在1-5之间' } as ApiResponse<null>);
  }
  
  const workIndex = db.works.findIndex(w => w.id === req.params.id);
  
  if (workIndex === -1) {
    return res.status(404).json({ success: false, error: '作品不存在' } as ApiResponse<null>);
  }
  
  const existingRating = db.workRatings.find(r => r.userId === req.user.id && r.workId === req.params.id);
  
  if (existingRating) {
    const ratingIndex = db.workRatings.findIndex(r => r.id === existingRating.id);
    db.workRatings[ratingIndex].rating = rating;
  } else {
    const newRating: WorkRating = {
      id: `rating-${uuidv4().slice(0, 8)}`,
      userId: req.user.id,
      workId: req.params.id,
      rating,
      createdAt: new Date().toISOString()
    };
    db.workRatings.push(newRating);
    db.works[workIndex].ratingCount += 1;
  }
  
  const workRatings = db.workRatings.filter(r => r.workId === req.params.id);
  const avgRating = workRatings.reduce((sum, r) => sum + r.rating, 0) / workRatings.length;
  db.works[workIndex].rating = Math.round(avgRating * 10) / 10;
  
  saveDb();
  
  res.json({ 
    success: true, 
    data: { rating: db.works[workIndex].rating, ratingCount: db.works[workIndex].ratingCount },
    message: '评分成功'
  } as ApiResponse<{ rating: number; ratingCount: number }>);
});

router.put('/:id/recommend', authMiddleware, (req: any, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: '无权限操作' } as ApiResponse<null>);
  }
  
  const db = getDb();
  const workIndex = db.works.findIndex(w => w.id === req.params.id);
  
  if (workIndex === -1) {
    return res.status(404).json({ success: false, error: '作品不存在' } as ApiResponse<null>);
  }
  
  db.works[workIndex].isRecommended = !db.works[workIndex].isRecommended;
  saveDb();
  
  res.json({ 
    success: true, 
    data: { isRecommended: db.works[workIndex].isRecommended },
    message: db.works[workIndex].isRecommended ? '已设为推荐' : '已取消推荐'
  } as ApiResponse<{ isRecommended: boolean }>);
});

router.delete('/:id', authMiddleware, (req: any, res) => {
  const db = getDb();
  const workIndex = db.works.findIndex(w => w.id === req.params.id);
  
  if (workIndex === -1) {
    return res.status(404).json({ success: false, error: '作品不存在' } as ApiResponse<null>);
  }
  
  const work = db.works[workIndex];
  if (work.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: '无权限操作' } as ApiResponse<null>);
  }
  
  db.works.splice(workIndex, 1);
  
  db.workLikes = db.workLikes.filter(l => l.workId !== req.params.id);
  db.workRatings = db.workRatings.filter(r => r.workId !== req.params.id);
  
  saveDb();
  
  res.json({ success: true, message: '删除成功' } as ApiResponse<null>);
});

export default router;
