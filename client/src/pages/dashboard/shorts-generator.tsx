import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Play, 
  Settings, 
  RefreshCw, 
  Download, 
  Upload, 
  Eye, 
  Clock, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader2,
  Youtube,
  FileText,
  Video,
  Edit
} from "lucide-react";

// Types for Shorts Generator

type NewsItem = {
  id: number;
  title: string;
  url: string;
  published_at: string;
  source: string;
  currencies: string[];
  votes?: Record<string, number>;
};

type ScriptItem = {
  id: number;
  newsId: number;
  newsTitle: string;
  title: string;
  script: string;
  duration: number;
  hashtags: string[];
  thumbnail_prompt: string;
  call_to_action?: string;
  status: string;
  createdAt: string;
};

type VideoItem = {
  id: number;
  scriptId: number;
  title: string;
  status: string;
  videoUrl?: string | null;
  url?: string;
  createdAt: string;
};

const shortsAPI = {
  async getTopNews(): Promise<NewsItem[]> {
    const response = await fetch('/api/shorts/news');
    if (!response.ok) throw new Error('Failed to fetch news');
    return response.json();
  },
  async generateScript(newsData: NewsItem): Promise<Omit<ScriptItem, 'id' | 'newsId' | 'newsTitle' | 'status' | 'createdAt'>> {
    const response = await fetch('/api/shorts/generate-script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newsData),
    });
    if (!response.ok) throw new Error('Failed to generate script');
    return response.json();
  },
  async createVideo(scriptData: ScriptItem): Promise<Omit<VideoItem, 'scriptId' | 'title' | 'createdAt'>> {
    const response = await fetch('/api/shorts/create-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scriptData),
    });
    if (!response.ok) throw new Error('Failed to create video');
    return response.json();
  },
  async uploadVideo(videoData: VideoItem): Promise<Partial<VideoItem>> {
    const response = await fetch('/api/shorts/upload-youtube', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(videoData),
    });
    if (!response.ok) throw new Error('Failed to upload video');
    return response.json();
  },
};

export default function ShortsGeneratorPipeline() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [scripts, setScripts] = useState<ScriptItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [pipelineStep, setPipelineStep] = useState(1);

  // Load news on component mount
  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setLoading(prev => ({ ...prev, news: true }));
    try {
      const newsData = await shortsAPI.getTopNews();
      setNews(newsData);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(prev => ({ ...prev, news: false }));
    }
  };

  const generateScript = async (newsItem: NewsItem) => {
    setLoading(prev => ({ ...prev, [`script_${newsItem.id}`]: true }));
    setPipelineStep(2);
    
    try {
      const script = await shortsAPI.generateScript(newsItem);
      const newScript: ScriptItem = {
        id: Date.now(),
        newsId: newsItem.id,
        newsTitle: newsItem.title,
        ...script,
        status: 'generated',
        createdAt: new Date().toISOString()
      };
      
      setScripts(prev => [...prev, newScript]);
      setSelectedNews(newsItem);
    } catch (error) {
      console.error('Error generating script:', error);
    } finally {
      setLoading(prev => ({ ...prev, [`script_${newsItem.id}`]: false }));
    }
  };

  const processToVideo = async (script: ScriptItem) => {
    setLoading(prev => ({ ...prev, [`video_${script.id}`]: true }));
    setPipelineStep(3);
    try {
      const newVideo = await shortsAPI.createVideo(script);
      const videoItem: VideoItem = {
        id: Date.now(),
        scriptId: script.id,
        title: script.title,
        status: newVideo.status,
        videoUrl: newVideo.videoUrl ?? null,
        url: newVideo.url,
        createdAt: new Date().toISOString()
      };
      setVideos(prev => [...prev, videoItem]);
    } catch (error) {
      console.error('Error creating video:', error);
    } finally {
      setLoading(prev => ({ ...prev, [`video_${script.id}`]: false }));
    }
  };

  const uploadToYouTube = async (video: VideoItem) => {
    setLoading(prev => ({ ...prev, [`upload_${video.id}`]: true }));
    setPipelineStep(4);
    try {
      const uploadResult = await shortsAPI.uploadVideo(video);
      setVideos(prev => prev.map(v => 
        v.id === video.id 
          ? { ...v, ...uploadResult, status: 'uploaded' }
          : v
      ));
    } catch (error) {
      console.error('Error uploading to YouTube:', error);
    } finally {
      setLoading(prev => ({ ...prev, [`upload_${video.id}`]: false }));
    }
  };

  const runFullPipeline = async (newsItem: NewsItem) => {
    await generateScript(newsItem);
    // Note: Full automation would continue here, but we'll do it step by step for demo
  };

  const getPipelineStepStatus = (step: number) => {
    if (step < pipelineStep) return 'completed';
    if (step === pipelineStep) return 'active';
    return 'pending';
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Shorts Generator Pipeline</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Automated crypto content generation from news to YouTube shorts
        </p>
      </div>

      {/* Pipeline Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Pipeline Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            {[
              { step: 1, title: "Fetch News", icon: FileText },
              { step: 2, title: "Generate Script", icon: Edit },
              { step: 3, title: "Create Video", icon: Video },
              { step: 4, title: "Upload to YouTube", icon: Youtube }
            ].map(({ step, title, icon: Icon }) => {
              const status = getPipelineStepStatus(step);
              return (
                <div key={step} className="flex items-center space-x-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    status === 'completed' ? 'bg-green-100 text-green-600' :
                    status === 'active' ? 'bg-blue-100 text-blue-600' :
                    'bg-slate-100 text-slate-400'
                  }`}>
                    {status === 'completed' ? <CheckCircle className="h-5 w-5" /> : 
                     <Icon className="h-5 w-5" />}
                  </div>
                  <span className={`text-sm font-medium ${
                    status === 'completed' ? 'text-green-600' :
                    status === 'active' ? 'text-blue-600' :
                    'text-slate-400'
                  }`}>
                    {title}
                  </span>
                  {step < 4 && <div className="w-8 h-0.5 bg-slate-200" />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step 1: CryptoPanic News */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Step 1: Latest Crypto News</span>
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchNews}
            disabled={loading.news}
          >
            {loading.news ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh News
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {news.map((item) => (
              <div key={item.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-slate-600">
                      <span>{item.source}</span>
                      <span>{new Date(item.published_at).toLocaleString()}</span>
                      <div className="flex space-x-1">
                        {item.currencies.map(currency => (
                          <Badge key={currency} variant="secondary">
                            {currency}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={() => runFullPipeline(item)}
                    disabled={loading[`script_${item.id}`]}
                    className="ml-4"
                  >
                    {loading[`script_${item.id}`] ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="mr-2 h-4 w-4" />
                    )}
                    Generate Script
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Generated Scripts */}
      {scripts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Edit className="h-5 w-5" />
              <span>Step 2: Generated Scripts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {scripts.map((script) => (
                <div key={script.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{script.title}</h3>
                      <p className="text-sm text-slate-600">
                        Duration: {script.duration}s | Created: {new Date(script.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Button 
                      onClick={() => processToVideo(script)}
                      disabled={loading[`video_${script.id}`]}
                      variant="outline"
                    >
                      {loading[`video_${script.id}`] ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Video className="mr-2 h-4 w-4" />
                      )}
                      Process Video
                    </Button>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded p-4">
                    <pre className="whitespace-pre-wrap text-sm">{script.script}</pre>
                  </div>
                  <div className="flex items-center space-x-2 mt-3">
                    <span className="text-sm font-medium">Hashtags:</span>
                    {script.hashtags.map(tag => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Video Processing Status */}
      {videos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Video className="h-5 w-5" />
              <span>Step 3: Video Processing</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {videos.map((video) => (
                <div key={video.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{video.title}</h3>
                      <p className="text-sm text-slate-600">
                        Status: {video.status === 'video_placeholder' ? 'Ready for video generation' : video.status}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {video.status === 'video_placeholder' && (
                        <Alert className="max-w-md">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Video generation API (Lumen5/Pictory) not configured. 
                            Connect your API to enable automatic video creation.
                          </AlertDescription>
                        </Alert>
                      )}
                      {video.status === 'uploaded' ? (
                        <Button variant="outline" asChild>
                          <a href={video.url} target="_blank" rel="noopener noreferrer">
                            <Youtube className="mr-2 h-4 w-4" />
                            View on YouTube
                          </a>
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => uploadToYouTube(video)}
                          disabled={loading[`upload_${video.id}`] || video.status === 'video_placeholder'}
                        >
                          {loading[`upload_${video.id}`] ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="mr-2 h-4 w-4" />
                          )}
                          Upload to YouTube
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Configuration Panel */}

    </div>
  );
}