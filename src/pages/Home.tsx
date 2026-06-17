import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Music, Calendar, Clock, Star, Play, Heart, ChevronRight, Mic2, Headphones, Radio, Disc3, Volume2 } from 'lucide-react';
import type { Studio, Work } from '../../shared/types';
import { studioApi, workApi } from '@/lib/api';

export default function Home() {
  const [studios, setStudios] = useState<Studio[]>([]);
  const [recommendedWorks, setRecommendedWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studiosData, worksData] = await Promise.all([
          studioApi.getList(),
          workApi.getRecommended(),
        ]);
        setStudios(studiosData);
        setRecommendedWorks(worksData);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const features = [
    { icon: Mic2, title: '专业设备', desc: '顶级录音设备，满足专业需求' },
    { icon: Clock, title: '灵活预约', desc: '在线预约，实时查看空闲时段' },
    { icon: Volume2, title: '作品展示', desc: '上传作品，获得评分与推荐' },
    { icon: Disc3, title: '社区交流', desc: '音乐人社区，发现更多精彩' },
  ];

  return (
    <div className="min-h-screen pt-16">
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-primary-950/30" />
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-500/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-6">
              <Music className="w-4 h-4 text-primary-400" />
              <span className="text-sm text-primary-300">专业音乐工作室预约平台</span>
            </div>
            
            <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="text-dark-50">创造属于你的</span>
              <br />
              <span className="gradient-text text-shadow-glow">音乐梦想</span>
            </h1>
            
            <p className="text-lg md:text-xl text-dark-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              顶级录音设备、专业混音棚、舒适创作空间。
              在线预约、实时确认、扫码签到，让音乐创作更简单。
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/booking/studio-001" className="btn-primary text-lg px-8 py-4 inline-flex items-center justify-center gap-2">
                <Calendar className="w-5 h-5" />
                立即预约
              </Link>
              <Link to="/works" className="btn-secondary text-lg px-8 py-4 inline-flex items-center justify-center gap-2">
                <Play className="w-5 h-5" />
                探索作品
              </Link>
            </div>
            
            <div className="grid grid-cols-3 gap-8 mt-16 max-w-lg mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold gradient-text-gold">6+</div>
                <div className="text-sm text-dark-500 mt-1">专业工作室</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold gradient-text">500+</div>
                <div className="text-sm text-dark-500 mt-1">月预约量</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-emerald-400">4.9</div>
                <div className="text-sm text-dark-500 mt-1">用户评分</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronRight className="w-6 h-6 text-dark-500 rotate-90" />
        </div>
      </section>

      <section className="py-20 bg-dark-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="card p-6 text-center group hover:-translate-y-1"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-semibold text-dark-100 mb-2">{feature.title}</h3>
                <p className="text-sm text-dark-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-dark-900 to-dark-950">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="section-title mb-2">精选工作室</h2>
              <p className="text-dark-400">专业设备，为你的音乐梦想保驾护航</p>
            </div>
            <Link to="/booking/studio-001" className="hidden md:flex items-center gap-1 text-primary-400 hover:text-primary-300 transition-colors">
              查看全部
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card overflow-hidden animate-pulse">
                  <div className="h-48 bg-dark-700" />
                  <div className="p-6 space-y-3">
                    <div className="h-6 bg-dark-700 rounded w-3/4" />
                    <div className="h-4 bg-dark-700 rounded w-full" />
                    <div className="h-4 bg-dark-700 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {studios.slice(0, 6).map((studio, index) => (
                <Link
                  key={studio.id}
                  to={`/booking/${studio.id}`}
                  className="card overflow-hidden group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={studio.image}
                      alt={studio.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 to-transparent" />
                    <div className="absolute top-4 left-4">
                      <span className="badge badge-info">{studio.type}</span>
                    </div>
                    <div className="absolute bottom-4 right-4">
                      <span className="text-2xl font-bold text-white">
                        ¥{studio.pricePerHour}
                        <span className="text-sm font-normal text-dark-300">/小时</span>
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-semibold text-dark-50 group-hover:text-primary-300 transition-colors">
                        {studio.name}
                      </h3>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-gold-400 fill-gold-400" />
                        <span className="text-sm font-medium text-dark-200">{studio.rating}</span>
                        <span className="text-xs text-dark-500">({studio.reviewCount})</span>
                      </div>
                    </div>
                    <p className="text-sm text-dark-400 line-clamp-2 mb-4">{studio.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {studio.equipment.slice(0, 3).map((eq, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded-md bg-dark-700/50 text-dark-400">
                          {eq.split(' ')[0]}
                        </span>
                      ))}
                      {studio.equipment.length > 3 && (
                        <span className="text-xs px-2 py-1 rounded-md bg-dark-700/50 text-dark-400">
                          +{studio.equipment.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-20 bg-dark-950">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="section-title mb-2">热门作品</h2>
              <p className="text-dark-400">发现优秀的音乐创作</p>
            </div>
            <Link to="/works" className="hidden md:flex items-center gap-1 text-primary-400 hover:text-primary-300 transition-colors">
              更多作品
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card overflow-hidden animate-pulse">
                  <div className="aspect-square bg-dark-700" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-dark-700 rounded w-3/4" />
                    <div className="h-3 bg-dark-700 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {recommendedWorks.slice(0, 4).map((work, index) => (
                <Link
                  key={work.id}
                  to={`/works`}
                  className="card overflow-hidden group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={work.coverImage}
                      alt={work.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-dark-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Play className="w-6 h-6 text-white ml-1" />
                      </div>
                    </div>
                    {work.isRecommended && (
                      <div className="absolute top-3 left-3">
                        <span className="badge bg-gradient-to-r from-gold-500 to-amber-500 text-dark-900 border-0">
                          <Star className="w-3 h-3 mr-1 fill-dark-900" />
                          推荐
                        </span>
                      </div>
                    )}
                    <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-dark-900/70 text-xs text-white">
                      {formatDuration(work.duration)}
                    </div>
                    {work.mediaType === 'video' && (
                      <div className="absolute top-3 right-3">
                        <span className="px-2 py-1 rounded-md bg-rose-500/80 text-xs text-white">HD</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-medium text-dark-100 truncate mb-1 group-hover:text-primary-300 transition-colors">
                      {work.title}
                    </h4>
                    <p className="text-sm text-dark-500 truncate">{work.username}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-xs text-dark-400">
                          <Headphones className="w-3 h-3" />
                          {work.plays > 1000 ? `${(work.plays / 1000).toFixed(1)}k` : work.plays}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-dark-400">
                          <Heart className="w-3 h-3" />
                          {work.likes}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-gold-400 fill-gold-400" />
                        <span className="text-xs text-dark-300">{work.rating}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-dark-950 to-dark-900">
        <div className="container mx-auto px-4">
          <div className="card p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-radial from-primary-500/10 to-transparent" />
            <div className="relative z-10">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-dark-50 mb-4">
                准备好开始你的<span className="gradient-text">音乐之旅</span>了吗？
              </h2>
              <p className="text-dark-400 mb-8 max-w-xl mx-auto">
                立即注册，首次预约享受8折优惠。专业的设备，舒适的环境，只为你的创作。
              </p>
              <Link to="/login" className="btn-gold text-lg px-10 py-4 inline-flex items-center gap-2">
                <Radio className="w-5 h-5" />
                立即开始
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 bg-dark-950 border-t border-dark-800/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Music className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-xl font-bold gradient-text">Sonic Studio</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-dark-500">
              <a href="#" className="hover:text-dark-300 transition-colors">关于我们</a>
              <a href="#" className="hover:text-dark-300 transition-colors">使用条款</a>
              <a href="#" className="hover:text-dark-300 transition-colors">隐私政策</a>
              <a href="#" className="hover:text-dark-300 transition-colors">联系我们</a>
            </div>
            <p className="text-sm text-dark-600">
              © 2025 Sonic Studio. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
