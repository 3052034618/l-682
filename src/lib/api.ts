import type { ApiResponse, User, Studio, Booking, Work, TimeSlot, Payment, DashboardStats, StudioStats, TimeSlotHeat, RevenueTrend, PricingSuggestion, MonthlyReport, AuthResponse, CreateBookingRequest } from '../../shared/types';

const API_BASE = '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
  
  const data = await response.json();
  
  if (!response.ok || !data.success) {
    throw new Error(data.error || data.message || '请求失败');
  }
  
  return data.data as T;
}

export const authApi = {
  login: (email: string, password: string) => 
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  
  register: (username: string, email: string, password: string, phone?: string) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, phone }),
    }),
  
  getProfile: () => request<User>('/auth/profile'),
  
  updateProfile: (data: Partial<User>) =>
    request<User>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

export const studioApi = {
  getList: (params?: { type?: string; sort?: string }) => {
    const query = new URLSearchParams();
    if (params?.type) query.set('type', params.type);
    if (params?.sort) query.set('sort', params.sort);
    return request<Studio[]>(`/studios?${query.toString()}`);
  },
  
  getById: (id: string) => request<Studio>(`/studios/${id}`),
  
  getAvailability: (id: string, date: string) =>
    request<TimeSlot[]>(`/studios/${id}/availability?date=${date}`),
  
  create: (data: Partial<Studio>) =>
    request<Studio>('/studios', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: Partial<Studio>) =>
    request<Studio>(`/studios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    request<void>(`/studios/${id}`, { method: 'DELETE' }),
};

export const bookingApi = {
  getList: (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return request<Booking[]>(`/bookings${query}`);
  },
  
  getById: (id: string) => request<Booking>(`/bookings/${id}`),
  
  create: (data: CreateBookingRequest) =>
    request<Booking>('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  checkin: (id: string) =>
    request<Booking>(`/bookings/${id}/checkin`, { method: 'POST' }),
  
  checkout: (id: string) =>
    request<Booking>(`/bookings/${id}/checkout`, { method: 'POST' }),
  
  renew: (id: string, hours: number) =>
    request<Booking>(`/bookings/${id}/renew`, {
      method: 'POST',
      body: JSON.stringify({ hours }),
    }),
  
  cancel: (id: string) =>
    request<Booking>(`/bookings/${id}/cancel`, { method: 'POST' }),
  
  getQrCode: (id: string) =>
    request<{ qrCode: string }>(`/bookings/${id}/qrcode`),
};

export const paymentApi = {
  create: (bookingId: string, method: string = 'wechat') =>
    request<Payment>('/payments', {
      method: 'POST',
      body: JSON.stringify({ bookingId, method }),
    }),
  
  getById: (id: string) => request<Payment>(`/payments/${id}`),
  
  refund: (id: string, reason?: string) =>
    request<Payment>(`/payments/${id}/refund`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};

export const workApi = {
  getList: (params?: { sort?: string; type?: string; recommended?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.sort) query.set('sort', params.sort);
    if (params?.type) query.set('type', params.type);
    if (params?.recommended) query.set('recommended', 'true');
    return request<Work[]>(`/works?${query.toString()}`);
  },
  
  getRecommended: () => request<Work[]>('/works/recommended'),
  
  getById: (id: string) => request<Work>(`/works/${id}`),
  
  getByUser: (userId: string) => request<Work[]>(`/works/user/${userId}`),
  
  create: (data: Partial<Work>) =>
    request<Work>('/works', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  like: (id: string) =>
    request<{ liked: boolean; likes: number }>(`/works/${id}/like`, { method: 'POST' }),
  
  rate: (id: string, rating: number) =>
    request<{ rating: number; ratingCount: number }>(`/works/${id}/rating`, {
      method: 'POST',
      body: JSON.stringify({ rating }),
    }),
  
  toggleRecommend: (id: string) =>
    request<{ isRecommended: boolean }>(`/works/${id}/recommend`, { method: 'PUT' }),
  
  delete: (id: string) =>
    request<void>(`/works/${id}`, { method: 'DELETE' }),
};

export const adminApi = {
  getDashboard: () => request<DashboardStats>('/admin/dashboard'),
  
  getStudioStats: () => request<StudioStats[]>('/admin/studio-stats'),
  
  getTimeslotHeat: (date?: string) => {
    const query = date ? `?date=${date}` : '';
    return request<TimeSlotHeat[]>(`/admin/timeslot-heat${query}`);
  },
  
  getRevenueTrend: (type: 'day' | 'week' | 'month' = 'week') =>
    request<RevenueTrend[]>(`/admin/revenue-trend?type=${type}`),
  
  getPricingSuggestions: () => request<PricingSuggestion[]>('/admin/pricing-suggestions'),
  
  getMonthlyReport: (month?: string) => {
    const query = month ? `?month=${month}` : '';
    return request<MonthlyReport>(`/admin/report/monthly${query}`);
  },
  
  exportMonthlyReport: (month?: string) => {
    const query = month ? `?month=${month}` : '';
    window.open(`${API_BASE}/admin/report/monthly/export${query}`, '_blank');
  },
  
  getAllBookings: (params?: { status?: string; studioId?: string; date?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.studioId) query.set('studioId', params.studioId);
    if (params?.date) query.set('date', params.date);
    return request<Booking[]>(`/admin/bookings?${query.toString()}`);
  },
};
