import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  User, Studio, Booking, Payment, Work, WorkLike, WorkRating
} from '../../shared/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

interface Database {
  users: User[];
  studios: Studio[];
  bookings: Booking[];
  payments: Payment[];
  works: Work[];
  workLikes: WorkLike[];
  workRatings: WorkRating[];
}

let db: Database;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadDatabase(): Database {
  ensureDataDir();
  if (fs.existsSync(DATA_FILE)) {
    try {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load database, using default data');
    }
  }
  return getDefaultData();
}

function saveDatabase() {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

function getDefaultData(): Database {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const tomorrow = new Date(now.getTime() + 86400000).toISOString().split('T')[0];
  const dayAfter = new Date(now.getTime() + 86400000 * 2).toISOString().split('T')[0];
  const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];

  const users: User[] = [
    {
      id: 'user-001',
      username: '音乐达人小明',
      email: 'user1@example.com',
      password: '123456',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoming',
      phone: '13800138001',
      role: 'user',
      createdAt: '2025-01-15T10:30:00Z'
    },
    {
      id: 'user-002',
      username: '制作人阿杰',
      email: 'user2@example.com',
      password: '123456',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ajie',
      phone: '13800138002',
      role: 'user',
      createdAt: '2025-02-20T14:20:00Z'
    },
    {
      id: 'user-003',
      username: '歌手小雨',
      email: 'user3@example.com',
      password: '123456',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoyu',
      phone: '13800138003',
      role: 'user',
      createdAt: '2025-03-10T09:15:00Z'
    },
    {
      id: 'admin-001',
      username: '系统管理员',
      email: 'admin@example.com',
      password: 'admin123',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      role: 'admin',
      createdAt: '2025-01-01T00:00:00Z'
    }
  ];

  const studios: Studio[] = [
    {
      id: 'studio-001',
      name: '旗舰录音棚 A',
      description: '顶级专业录音棚，配备Neumann U87麦克风、API 1608混音台，适合专辑录制、人声录制、乐器实录。',
      image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80',
      pricePerHour: 500,
      equipment: ['Neumann U87 麦克风', 'API 1608 混音台', 'Yamaha NS-10 监听', 'Universal Audio Apollo', 'Fender Strat 吉他', 'Yamaha 钢琴'],
      capacity: 8,
      type: '专业录音棚',
      rating: 4.9,
      reviewCount: 128
    },
    {
      id: 'studio-002',
      name: '混音工作室 B',
      description: '专注于混音和母带处理的工作室，配备顶级AD/DA转换器和精准监听系统。',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
      pricePerHour: 400,
      equipment: ['Pro Tools HDX', 'Avid HD I/O', 'Genelec 8351B 监听', 'SSL Bus Compressor', 'Neve 1073 话放'],
      capacity: 4,
      type: '混音工作室',
      rating: 4.8,
      reviewCount: 96
    },
    {
      id: 'studio-003',
      name: '排练室 C',
      description: '宽敞的乐队排练室，配备完整的乐队设备，适合乐队排练和小型演出彩排。',
      image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80',
      pricePerHour: 200,
      equipment: ['Marshall JCM800 吉他音箱', 'Ampeg SVT 贝斯音箱', 'DW Collector 鼓组', 'Yamaha Motif 合成器', 'PA 系统'],
      capacity: 10,
      type: '排练室',
      rating: 4.7,
      reviewCount: 156
    },
    {
      id: 'studio-004',
      name: '创作空间 D',
      description: '舒适的音乐创作空间，适合独立音乐人和制作人进行编曲和创作。',
      image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&q=80',
      pricePerHour: 150,
      equipment: ['Mac Pro + Logic Pro', 'Native Instruments Komplete', 'RME Fireface UFX', 'Audio-Technica AT4050', 'MIDI 键盘 61键'],
      capacity: 3,
      type: '创作空间',
      rating: 4.6,
      reviewCount: 72
    },
    {
      id: 'studio-005',
      name: '直播/播客室 E',
      description: '专业声学处理的直播间，适合播客录制、音乐直播、视频录制。',
      image: 'https://images.unsplash.com/photo-1589903308904-1010c2294adc?w=800&q=80',
      pricePerHour: 180,
      equipment: ['Shure SM7B 麦克风', 'Rodecaster Pro', '4K 摄像机', '补光灯套装', '绿幕背景'],
      capacity: 5,
      type: '直播室',
      rating: 4.5,
      reviewCount: 64
    },
    {
      id: 'studio-006',
      name: '母带工作室 F',
      description: '专业母带处理工作室，精准的监听环境和顶级母带设备，让你的作品更上一层楼。',
      image: 'https://images.unsplash.com/photo-1571974599782-87624638275e?w=800&q=80',
      pricePerHour: 600,
      equipment: ['Prismsound Dream ADA-128', 'Audeze LCD-4 耳机', 'Bricasti M7 混响', 'Manley 母带压缩器', 'Weiss EQ1-LP'],
      capacity: 2,
      type: '母带工作室',
      rating: 4.9,
      reviewCount: 42
    }
  ];

  const bookings: Booking[] = [
    {
      id: 'booking-001',
      userId: 'user-001',
      studioId: 'studio-001',
      studioName: '旗舰录音棚 A',
      date: today,
      startTime: '10:00',
      endTime: '14:00',
      duration: 4,
      totalPrice: 2000,
      status: 'paid',
      qrCode: 'QR-BOOKING-001',
      createdAt: new Date(now.getTime() - 86400000 * 2).toISOString()
    },
    {
      id: 'booking-002',
      userId: 'user-001',
      studioId: 'studio-003',
      studioName: '排练室 C',
      date: tomorrow,
      startTime: '19:00',
      endTime: '22:00',
      duration: 3,
      totalPrice: 600,
      status: 'paid',
      qrCode: 'QR-BOOKING-002',
      createdAt: new Date(now.getTime() - 86400000).toISOString()
    },
    {
      id: 'booking-003',
      userId: 'user-002',
      studioId: 'studio-002',
      studioName: '混音工作室 B',
      date: yesterday,
      startTime: '14:00',
      endTime: '18:00',
      duration: 4,
      totalPrice: 1600,
      status: 'completed',
      qrCode: 'QR-BOOKING-003',
      checkInTime: `${yesterday}T14:05:00`,
      checkOutTime: `${yesterday}T18:10:00`,
      createdAt: new Date(now.getTime() - 86400000 * 3).toISOString()
    },
    {
      id: 'booking-004',
      userId: 'user-003',
      studioId: 'studio-004',
      studioName: '创作空间 D',
      date: today,
      startTime: '15:00',
      endTime: '18:00',
      duration: 3,
      totalPrice: 450,
      status: 'in_use',
      qrCode: 'QR-BOOKING-004',
      checkInTime: `${today}T15:02:00`,
      createdAt: new Date(now.getTime() - 86400000 * 2).toISOString()
    },
    {
      id: 'booking-005',
      userId: 'user-002',
      studioId: 'studio-001',
      studioName: '旗舰录音棚 A',
      date: dayAfter,
      startTime: '09:00',
      endTime: '12:00',
      duration: 3,
      totalPrice: 1500,
      status: 'paid',
      qrCode: 'QR-BOOKING-005',
      createdAt: new Date(now.getTime() - 86400000 * 5).toISOString()
    },
    {
      id: 'booking-006',
      userId: 'user-003',
      studioId: 'studio-005',
      studioName: '直播/播客室 E',
      date: yesterday,
      startTime: '20:00',
      endTime: '22:00',
      duration: 2,
      totalPrice: 360,
      status: 'completed',
      qrCode: 'QR-BOOKING-006',
      checkInTime: `${yesterday}T20:00:00`,
      checkOutTime: `${yesterday}T22:05:00`,
      createdAt: new Date(now.getTime() - 86400000 * 4).toISOString()
    },
    {
      id: 'booking-007',
      userId: 'user-001',
      studioId: 'studio-006',
      studioName: '母带工作室 F',
      date: dayAfter,
      startTime: '14:00',
      endTime: '17:00',
      duration: 3,
      totalPrice: 1800,
      status: 'pending',
      qrCode: 'QR-BOOKING-007',
      createdAt: new Date(now.getTime() - 3600000).toISOString()
    }
  ];

  const payments: Payment[] = [
    { id: 'pay-001', bookingId: 'booking-001', amount: 2000, method: 'wechat', status: 'success', paidAt: new Date(now.getTime() - 86400000 * 2).toISOString() },
    { id: 'pay-002', bookingId: 'booking-002', amount: 600, method: 'alipay', status: 'success', paidAt: new Date(now.getTime() - 86400000).toISOString() },
    { id: 'pay-003', bookingId: 'booking-003', amount: 1600, method: 'card', status: 'success', paidAt: new Date(now.getTime() - 86400000 * 3).toISOString() },
    { id: 'pay-004', bookingId: 'booking-004', amount: 450, method: 'wechat', status: 'success', paidAt: new Date(now.getTime() - 86400000 * 2).toISOString() },
    { id: 'pay-005', bookingId: 'booking-005', amount: 1500, method: 'alipay', status: 'success', paidAt: new Date(now.getTime() - 86400000 * 5).toISOString() },
    { id: 'pay-006', bookingId: 'booking-006', amount: 360, method: 'wechat', status: 'success', paidAt: new Date(now.getTime() - 86400000 * 4).toISOString() }
  ];

  const works: Work[] = [
    {
      id: 'work-001',
      userId: 'user-001',
      username: '音乐达人小明',
      userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoming',
      bookingId: 'booking-003',
      title: '星空下的约定',
      description: '一首关于梦想与坚持的原创歌曲，希望大家喜欢。',
      coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80',
      mediaUrl: '/audio/demo1.mp3',
      mediaType: 'audio',
      duration: 215,
      plays: 3562,
      likes: 289,
      rating: 4.8,
      ratingCount: 45,
      isRecommended: true,
      createdAt: '2025-04-15T10:30:00Z'
    },
    {
      id: 'work-002',
      userId: 'user-002',
      username: '制作人阿杰',
      userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ajie',
      bookingId: 'booking-003',
      title: 'City Lights',
      description: 'Electronic / Chillout 风格纯音乐，城市夜晚的声音。',
      coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80',
      mediaUrl: '/audio/demo2.mp3',
      mediaType: 'audio',
      duration: 248,
      plays: 5234,
      likes: 412,
      rating: 4.9,
      ratingCount: 67,
      isRecommended: true,
      createdAt: '2025-04-20T14:20:00Z'
    },
    {
      id: 'work-003',
      userId: 'user-003',
      username: '歌手小雨',
      userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoyu',
      title: '雨后彩虹 (Cover)',
      description: '翻唱经典老歌，向经典致敬。',
      coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80',
      mediaUrl: '/audio/demo3.mp3',
      mediaType: 'audio',
      duration: 198,
      plays: 1856,
      likes: 178,
      rating: 4.6,
      ratingCount: 32,
      isRecommended: false,
      createdAt: '2025-05-02T09:15:00Z'
    },
    {
      id: 'work-004',
      userId: 'user-001',
      username: '音乐达人小明',
      userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoming',
      title: '录歌vlog - 第一次进棚',
      description: '记录我第一次进专业录音棚的体验和过程~',
      coverImage: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&q=80',
      mediaUrl: '/video/demo1.mp4',
      mediaType: 'video',
      duration: 520,
      plays: 8976,
      likes: 756,
      rating: 4.7,
      ratingCount: 89,
      isRecommended: true,
      createdAt: '2025-05-08T16:45:00Z'
    },
    {
      id: 'work-005',
      userId: 'user-002',
      username: '制作人阿杰',
      userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ajie',
      title: 'Midnight Dreams',
      description: 'Lo-fi 风格 beats，适合深夜工作学习时听。',
      coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80',
      mediaUrl: '/audio/demo4.mp3',
      mediaType: 'audio',
      duration: 175,
      plays: 6789,
      likes: 534,
      rating: 4.8,
      ratingCount: 72,
      isRecommended: true,
      createdAt: '2025-05-12T22:10:00Z'
    },
    {
      id: 'work-006',
      userId: 'user-003',
      username: '歌手小雨',
      userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoyu',
      title: '原创 - 夏天的风',
      description: '一首清新的夏日情歌，希望能给你带来清凉。',
      coverImage: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=600&q=80',
      mediaUrl: '/audio/demo5.mp3',
      mediaType: 'audio',
      duration: 232,
      plays: 4321,
      likes: 367,
      rating: 4.7,
      ratingCount: 56,
      isRecommended: false,
      createdAt: '2025-05-18T11:30:00Z'
    },
    {
      id: 'work-007',
      userId: 'user-001',
      username: '音乐达人小明',
      userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoming',
      title: '乐队排练现场',
      description: '上周排练室的排练记录，新歌试唱~',
      coverImage: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&q=80',
      mediaUrl: '/video/demo2.mp4',
      mediaType: 'video',
      duration: 385,
      plays: 2543,
      likes: 234,
      rating: 4.5,
      ratingCount: 38,
      isRecommended: false,
      createdAt: '2025-05-22T20:00:00Z'
    },
    {
      id: 'work-008',
      userId: 'user-002',
      username: '制作人阿杰',
      userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ajie',
      title: 'Ocean Waves',
      description: '氛围音乐，融合大自然的声音。',
      coverImage: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80',
      mediaUrl: '/audio/demo6.mp3',
      mediaType: 'audio',
      duration: 312,
      plays: 3210,
      likes: 289,
      rating: 4.9,
      ratingCount: 51,
      isRecommended: false,
      createdAt: '2025-05-28T08:45:00Z'
    }
  ];

  const workLikes: WorkLike[] = [
    { id: 'like-001', userId: 'user-002', workId: 'work-001', createdAt: '2025-04-16T12:00:00Z' },
    { id: 'like-002', userId: 'user-003', workId: 'work-001', createdAt: '2025-04-17T09:30:00Z' },
    { id: 'like-003', userId: 'user-001', workId: 'work-002', createdAt: '2025-04-21T14:00:00Z' }
  ];

  const workRatings: WorkRating[] = [
    { id: 'rating-001', userId: 'user-002', workId: 'work-001', rating: 5, createdAt: '2025-04-16T12:00:00Z' },
    { id: 'rating-002', userId: 'user-003', workId: 'work-001', rating: 4, createdAt: '2025-04-17T09:30:00Z' }
  ];

  return {
    users,
    studios,
    bookings,
    payments,
    works,
    workLikes,
    workRatings
  };
}

export function initDatabase() {
  db = loadDatabase();
  console.log('Database initialized with', {
    users: db.users.length,
    studios: db.studios.length,
    bookings: db.bookings.length,
    works: db.works.length
  });
}

export function getDb() {
  if (!db) {
    initDatabase();
  }
  return db;
}

export function saveDb() {
  saveDatabase();
}
