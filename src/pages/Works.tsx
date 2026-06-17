import { useState, useEffect } from 'react';
import { Play, Heart, Star, Headphones, Search, Filter, Music, Video } from 'lucide-react';
import type { Work } from '../../shared/types';
import { workApi } from '@/lib/api';

export default function Works() {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('popular');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    fetchWorks();
  }, [sortBy, typeFilter]);

  const fetchWorks = async () => {
    setLoading(true);
    try {
      const data = await workApi.getList({
        sort: sortBy,
        type: typeFilter,
      });
      setWorks(data);
    } catch (err) {
      console.error('Failed to fetch works:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlay = (id: string) => {
    setPlayingId(playingId === id ? null : id);
  };

  const handleLike = async (id: string) => {
    try {
      const result = await workApi.like(id);
      setWorks(prev => prev.map(w => 
        w.id === id ? { ...w, likes: result.likes } : w
      ));
    } catch (err) {
      console.error('Failed to like:', err);
    }
  };

  const filteredWorks = works.filter(w => 
    w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-20 bg-dark-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-dark-50 mb-3">作品广场</h1>
          <p className="text-dark-400">发现优秀的音乐创作，寻找灵感</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
            <input
              type="text"
              placeholder="搜索作品或创作者..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-12"
            />
          </div>
          
          <div className="flex gap-3">
            <div className="flex items-center gap-2 p-1 rounded-xl bg-dark-800/60">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  typeFilter === 'all'
                    ? 'bg-primary-500/20 text-primary-300'
                    : 'text-dark-400 hover:text-dark-200'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setTypeFilter('audio')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  typeFilter === 'audio'
                    ? 'bg-primary-500/20 text-primary-300'
                    : 'text-dark-400 hover:text-dark-200'
                }`}
              >
                <Music className="w-4 h-4" />
                音频
              </button>
              <button
                onClick={() => setTypeFilter('video')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  typeFilter === 'video'
                    ? 'bg-primary-500/20 text-primary-300'
                    : 'text-dark-400 hover:text-dark-200'
                }`}
              >
                <Video className="w-4 h-4" />
                视频
              </button>
            </div>
            
            <div className="flex items-center gap-2 p-1 rounded-xl bg-dark-800/60">
              <Filter className="w-4 h-4 text-dark-500 ml-2" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-dark-200 text-sm px-2 py-2 outline-none cursor-pointer"
              >
                <option value="popular">最热门</option>
                <option value="latest">最新发布</option>
                <option value="rating">评分最高</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array(10).fill(0).map((_, i) => (
              <div key={i} className="card overflow-hidden animate-pulse">
                <div className="aspect-square bg-dark-700" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-dark-700 rounded w-3/4" />
                  <div className="h-3 bg-dark-700 rounded w-1/2" />
                  <div className="h-3 bg-dark-700 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredWorks.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-dark-800/50 flex items-center justify-center">
              <Music className="w-10 h-10 text-dark-600" />
            </div>
            <p className="text-dark-500">暂无作品</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredWorks.map((work, index) => (
              <div
                key={work.id}
                className="card overflow-hidden group animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={work.coverImage}
                    alt={work.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-dark-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => handlePlay(work.id)}
                      className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center shadow-lg shadow-primary-500/30 hover:scale-110 transition-transform"
                    >
                      {playingId === work.id ? (
                        <div className="flex gap-1">
                          <div className="w-1 h-5 bg-white rounded animate-pulse" />
                          <div className="w-1 h-5 bg-white rounded animate-pulse" style={{ animationDelay: '0.2s' }} />
                          <div className="w-1 h-5 bg-white rounded animate-pulse" style={{ animationDelay: '0.4s' }} />
                        </div>
                      ) : (
                        <Play className="w-6 h-6 text-white ml-1" />
                      )}
                    </button>
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
                  <p className="text-sm text-dark-500 truncate mb-3">{work.username}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-xs text-dark-400">
                        <Headphones className="w-3.5 h-3.5" />
                        {work.plays > 1000 ? `${(work.plays / 1000).toFixed(1)}k` : work.plays}
                      </span>
                      <button
                        onClick={() => handleLike(work.id)}
                        className="flex items-center gap-1 text-xs text-dark-400 hover:text-rose-400 transition-colors"
                      >
                        <Heart className="w-3.5 h-3.5" />
                        {work.likes}
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-gold-400 fill-gold-400" />
                      <span className="text-xs text-dark-300">{work.rating}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
