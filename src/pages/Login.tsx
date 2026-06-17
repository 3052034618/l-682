import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Music, Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/lib/api';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    phone: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (mode === 'login') {
        const result = await authApi.login(formData.email, formData.password);
        login(result.user, result.token);
        navigate('/');
      } else {
        const result = await authApi.register(
          formData.username,
          formData.email,
          formData.password,
          formData.phone
        );
        login(result.user, result.token);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role: 'user' | 'admin') => {
    setLoading(true);
    setError('');
    try {
      const email = role === 'admin' ? 'admin@example.com' : 'user1@example.com';
      const password = role === 'admin' ? 'admin123' : '123456';
      const result = await authApi.login(email, password);
      login(result.user, result.token);
      navigate('/');
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      
      <div className="w-full max-w-md relative z-10">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
            <Music className="w-6 h-6 text-white" />
          </div>
          <span className="font-display text-2xl font-bold gradient-text">Sonic Studio</span>
        </Link>
        
        <div className="card p-8">
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl font-bold text-dark-50 mb-2">
              {mode === 'login' ? '欢迎回来' : '创建账户'}
            </h2>
            <p className="text-dark-400 text-sm">
              {mode === 'login' ? '登录你的账户开始创作' : '加入我们，开启音乐之旅'}
            </p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm text-dark-300 mb-2">用户名</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="请输入用户名"
                    className="input-field pl-10"
                    required={mode === 'register'}
                  />
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm text-dark-300 mb-2">邮箱</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="请输入邮箱地址"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-dark-300 mb-2">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="请输入密码"
                  className="input-field pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            {mode === 'register' && (
              <div>
                <label className="block text-sm text-dark-300 mb-2">手机号（选填）</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="请输入手机号"
                    className="input-field pl-10"
                  />
                </div>
              </div>
            )}
            
            {mode === 'login' && (
              <div className="flex justify-end">
                <a href="#" className="text-sm text-primary-400 hover:text-primary-300">
                  忘记密码？
                </a>
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary text-lg"
            >
              {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-dark-400">
              {mode === 'login' ? '还没有账户？' : '已有账户？'}
              <button
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError('');
                }}
                className="text-primary-400 hover:text-primary-300 font-medium ml-1"
              >
                {mode === 'login' ? '立即注册' : '立即登录'}
              </button>
            </p>
          </div>
          
          <div className="mt-6 pt-6 border-t border-dark-700/50">
            <p className="text-center text-sm text-dark-500 mb-4">快速体验</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleQuickLogin('user')}
                disabled={loading}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-dark-600/50 text-dark-300 hover:bg-dark-800/50 hover:border-dark-500 transition-all text-sm"
              >
                <User className="w-4 h-4" />
                用户登录
              </button>
              <button
                onClick={() => handleQuickLogin('admin')}
                disabled={loading}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-gold-500/30 text-gold-400 hover:bg-gold-500/10 transition-all text-sm"
              >
                <ArrowRight className="w-4 h-4" />
                管理员
              </button>
            </div>
          </div>
        </div>
        
        <p className="text-center text-xs text-dark-600 mt-6">
          登录即表示同意<a href="#" className="text-dark-400 hover:text-dark-300">用户协议</a>和
          <a href="#" className="text-dark-400 hover:text-dark-300 ml-1">隐私政策</a>
        </p>
      </div>
    </div>
  );
}
