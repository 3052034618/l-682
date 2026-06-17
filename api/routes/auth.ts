import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, saveDb } from '../db/database.js';
import type { User, LoginRequest, RegisterRequest, AuthResponse, ApiResponse } from '../../shared/types.js';

const router = Router();

function generateToken(userId: string, role: string): string {
  return Buffer.from(`${userId}:${role}:${Date.now()}`).toString('base64');
}

function parseToken(token: string): { userId: string; role: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [userId, role] = decoded.split(':');
    return { userId, role };
  } catch {
    return null;
  }
}

function sanitizeUser(user: User): Omit<User, 'password'> {
  const { password, ...sanitized } = user;
  return sanitized;
}

export function authMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: '未授权访问' });
  }
  
  const token = authHeader.slice(7);
  const payload = parseToken(token);
  if (!payload) {
    return res.status(401).json({ success: false, error: '无效的token' });
  }
  
  const db = getDb();
  const user = db.users.find(u => u.id === payload.userId);
  if (!user) {
    return res.status(401).json({ success: false, error: '用户不存在' });
  }
  
  req.user = sanitizeUser(user);
  next();
}

router.post('/login', (req, res) => {
  const { email, password }: LoginRequest = req.body;
  const db = getDb();
  
  const user = db.users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return res.status(401).json({ success: false, error: '邮箱或密码错误' } as ApiResponse<null>);
  }
  
  const token = generateToken(user.id, user.role);
  
  res.json({
    success: true,
    data: {
      user: sanitizeUser(user),
      token
    }
  } as ApiResponse<AuthResponse>);
});

router.post('/register', (req, res) => {
  const { username, email, password, phone }: RegisterRequest = req.body;
  const db = getDb();
  
  if (db.users.some(u => u.email === email)) {
    return res.status(400).json({ success: false, error: '该邮箱已被注册' } as ApiResponse<null>);
  }
  
  const newUser: User = {
    id: `user-${uuidv4().slice(0, 8)}`,
    username,
    email,
    password,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
    phone,
    role: 'user',
    createdAt: new Date().toISOString()
  };
  
  db.users.push(newUser);
  saveDb();
  
  const token = generateToken(newUser.id, newUser.role);
  
  res.json({
    success: true,
    data: {
      user: sanitizeUser(newUser),
      token
    }
  } as ApiResponse<AuthResponse>);
});

router.get('/profile', authMiddleware, (req: any, res) => {
  res.json({
    success: true,
    data: req.user
  } as ApiResponse<Omit<User, 'password'>>);
});

router.put('/profile', authMiddleware, (req: any, res) => {
  const db = getDb();
  const userIndex = db.users.findIndex(u => u.id === req.user.id);
  
  if (userIndex === -1) {
    return res.status(404).json({ success: false, error: '用户不存在' } as ApiResponse<null>);
  }
  
  const { username, phone, avatar } = req.body;
  
  if (username) db.users[userIndex].username = username;
  if (phone !== undefined) db.users[userIndex].phone = phone;
  if (avatar) db.users[userIndex].avatar = avatar;
  
  saveDb();
  
  res.json({
    success: true,
    data: sanitizeUser(db.users[userIndex])
  } as ApiResponse<Omit<User, 'password'>>);
});

export default router;
