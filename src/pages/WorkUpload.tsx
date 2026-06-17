import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Music, Video, Image, FileAudio, X, Check } from 'lucide-react';
import { workApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export default function WorkUpload() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    mediaType: 'audio' as 'audio' | 'video',
    coverImage: '',
    mediaUrl: '',
    duration: 0,
  });
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      alert('请填写作品标题');
      return;
    }
    
    setUploading(true);
    try {
      const coverImage = formData.coverImage || `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80`;
      const mediaUrl = formData.mediaUrl || (formData.mediaType === 'audio' ? '/audio/demo.mp3' : '/video/demo.mp4');
      
      await workApi.create({
        title: formData.title,
        description: formData.description,
        mediaType: formData.mediaType,
        coverImage,
        mediaUrl,
        duration: Number(formData.duration) || 180,
      });
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/profile/works');
      }, 2000);
    } catch (err: any) {
      alert(err.message || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  if (success) {
    return (
      <div className="min-h-screen pt-20 bg-dark-900 flex items-center justify-center">
        <div className="text-center animate-scale-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Check className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-dark-50 mb-2">上传成功！</h2>
          <p className="text-dark-400 mb-6">作品已成功上传，即将跳转到我的作品</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-dark-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-display text-3xl font-bold text-dark-50 mb-2">上传作品</h1>
          <p className="text-dark-400 mb-8">分享你的音乐创作，让更多人听到</p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-dark-100 mb-4">基本信息</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-dark-300 mb-2">作品类型</label>
                  <div className="flex gap-4">
                    {[
                      { id: 'audio', label: '音频', icon: Music },
                      { id: 'video', label: '视频', icon: Video },
                    ].map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, mediaType: type.id as 'audio' | 'video' }))}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border transition-all ${
                          formData.mediaType === type.id
                            ? 'border-primary-500 bg-primary-500/20 text-primary-300'
                            : 'border-dark-600/50 bg-dark-800/50 text-dark-400 hover:border-dark-500'
                        }`}
                      >
                        <type.icon className="w-5 h-5" />
                        <span>{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-dark-300 mb-2">作品标题 *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="请输入作品标题"
                    className="input-field"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-dark-300 mb-2">作品描述</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="介绍一下你的作品..."
                    rows={4}
                    className="input-field resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-dark-300 mb-2">时长（秒）</label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    placeholder="180"
                    className="input-field"
                  />
                </div>
              </div>
            </div>
            
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-dark-100 mb-4">封面图片</h3>
              
              <div className="border-2 border-dashed border-dark-600/50 rounded-xl p-8 text-center hover:border-primary-500/50 transition-colors">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-800/50 flex items-center justify-center">
                  <Image className="w-8 h-8 text-dark-500" />
                </div>
                <p className="text-dark-400 mb-4">拖拽图片到此处或点击上传</p>
                <p className="text-xs text-dark-600 mb-4">支持 JPG、PNG 格式，建议尺寸 600x600</p>
                <button type="button" className="btn-secondary text-sm py-2 px-6">
                  <Upload className="w-4 h-4 inline mr-2" />
                  选择图片
                </button>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm text-dark-300 mb-2">或输入图片URL</label>
                <input
                  type="url"
                  name="coverImage"
                  value={formData.coverImage}
                  onChange={handleInputChange}
                  placeholder="https://..."
                  className="input-field"
                />
              </div>
            </div>
            
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-dark-100 mb-4">媒体文件</h3>
              
              <div className="border-2 border-dashed border-dark-600/50 rounded-xl p-8 text-center hover:border-primary-500/50 transition-colors">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-800/50 flex items-center justify-center">
                  {formData.mediaType === 'audio' ? (
                    <FileAudio className="w-8 h-8 text-dark-500" />
                  ) : (
                    <Video className="w-8 h-8 text-dark-500" />
                  )}
                </div>
                <p className="text-dark-400 mb-4">
                  拖拽{formData.mediaType === 'audio' ? '音频' : '视频'}文件到此处或点击上传
                </p>
                <p className="text-xs text-dark-600 mb-4">
                  {formData.mediaType === 'audio' ? '支持 MP3、WAV 格式，最大 50MB' : '支持 MP4 格式，最大 200MB'}
                </p>
                <button type="button" className="btn-secondary text-sm py-2 px-6">
                  <Upload className="w-4 h-4 inline mr-2" />
                  选择文件
                </button>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm text-dark-300 mb-2">或输入媒体URL（演示用）</label>
                <input
                  type="url"
                  name="mediaUrl"
                  value={formData.mediaUrl}
                  onChange={handleInputChange}
                  placeholder="https://..."
                  className="input-field"
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 btn-secondary"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 btn-primary"
              >
                {uploading ? '上传中...' : '发布作品'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
