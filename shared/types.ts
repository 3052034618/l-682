export interface User {
  id: string;
  username: string;
  email: string;
  password?: string;
  avatar?: string;
  phone?: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface Studio {
  id: string;
  name: string;
  description: string;
  image: string;
  pricePerHour: number;
  equipment: string[];
  capacity: number;
  type: string;
  rating: number;
  reviewCount: number;
}

export type BookingStatus = 'pending' | 'paid' | 'confirmed' | 'in_use' | 'completed' | 'cancelled' | 'no_show';

export interface Booking {
  id: string;
  userId: string;
  studioId: string;
  studioName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalPrice: number;
  status: BookingStatus;
  checkInTime?: string;
  checkOutTime?: string;
  qrCode: string;
  createdAt: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  bookingId?: string;
}

export type PaymentMethod = 'wechat' | 'alipay' | 'card';
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt?: string;
  refundAmount?: number;
}

export type MediaType = 'audio' | 'video';

export interface Work {
  id: string;
  userId: string;
  username: string;
  userAvatar?: string;
  bookingId?: string;
  title: string;
  description: string;
  coverImage: string;
  mediaUrl: string;
  mediaType: MediaType;
  duration: number;
  plays: number;
  likes: number;
  rating: number;
  ratingCount: number;
  isRecommended: boolean;
  createdAt: string;
}

export interface WorkLike {
  id: string;
  userId: string;
  workId: string;
  createdAt: string;
}

export interface WorkRating {
  id: string;
  userId: string;
  workId: string;
  rating: number;
  createdAt: string;
}

export interface DashboardStats {
  totalRevenue: number;
  revenueGrowth: number;
  totalBookings: number;
  bookingsGrowth: number;
  totalUsers: number;
  usersGrowth: number;
  avgUtilization: number;
}

export interface StudioStats {
  studioId: string;
  studioName: string;
  utilization: number;
  revenue: number;
  bookingCount: number;
  avgDuration: number;
  hours: number;
}

export interface TimeSlotHeat {
  hour: number;
  count: number;
}

export interface RevenueTrend {
  date: string;
  revenue: number;
  bookings: number;
}

export interface PricingSuggestion {
  studioId: string;
  studioName: string;
  peakHours: number[];
  offPeakHours: number[];
  suggestedPeakPrice: number;
  suggestedOffPeakPrice: number;
  currentPrice: number;
  expectedRevenueIncrease: number;
}

export interface MonthlyReport {
  month: string;
  totalRevenue: number;
  totalBookings: number;
  totalHours: number;
  avgSatisfaction: number;
  studioReports: StudioMonthlyReport[];
}

export interface StudioMonthlyReport {
  studioId: string;
  studioName: string;
  revenue: number;
  bookings: number;
  hours: number;
  utilization: number;
  avgSatisfaction: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface CreateBookingRequest {
  studioId: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
