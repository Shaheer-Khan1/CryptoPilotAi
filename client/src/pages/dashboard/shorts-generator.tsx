import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, RefreshCw, Loader2, Video } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { NewsCache } from "@/lib/newsCache";

interface NewsItem {
  title: string;
  source: string;
  time: string;
  url: string;
}

interface GeneratedScript {
  topic: string;
  script: string;
  videoSearchQuery: string;
}

export default function ShortsGenerator() {
  const { userData } = useAuth();
  const isFreeTier = !userData?.plan || userData?.plan === "starter";
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [generatedScript, setGeneratedScript] = useState<GeneratedScript | null>(null);
  const [generating, setGenerating] = useState(false);

  // Fetch news data
  const fetchNews = async (forceRefresh: boolean = false) => {
    setLoading(true);
    try {
      // Check cache first (unless forced refresh)
      if (!forceRefresh && NewsCache.isCacheValid()) {
        const cachedNews = NewsCache.getCachedNews();
        if (cachedNews.length > 0) {
          console.log(`📋 Using cached news data (${cachedNews.length} articles)`);
          setNews(cachedNews);
          setLoading(false);
          return;
        }
      }

      // Strategy 1: CryptoPanic with multiple CORS proxies
      const corsProxies = [
        'https://allorigins.win/raw?url=',
        'https://corsproxy.io/?',
        'https://api.codetabs.com/v1/proxy?quest=',
        'https://thingproxy.freeboard.io/fetch/',
        'https://cors-anywhere.herokuapp.com/'
      ];

      for (const proxy of corsProxies) {
        try {
          const cryptoPanicUrl = `https://cryptopanic.com/api/free/v1/posts/?auth_token=${import.meta.env.VITE_CRYPTOPANIC_API_KEY || 'demo'}&public=true&kind=news&currencies=BTC,ETH&regions=en`;
          const response = await fetch(`${proxy}${encodeURIComponent(cryptoPanicUrl)}`, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.results && data.results.length > 0) {
              const newsData = data.results.slice(0, 6).map((article: any) => ({
                title: decodeHtmlEntities(article.title || ''),
                source: article.source?.title || 'CryptoPanic',
                time: formatTimeAgo(new Date(article.published_at)),
                url: article.url
              }));
              
              setNews(newsData);
              NewsCache.setCachedNews(newsData, 'CryptoPanic');
              setLoading(false);
              return;
            }
          }
        } catch (proxyError) {
          console.log(`CryptoPanic proxy ${proxy} failed:`, proxyError);
          continue;
        }
      }

      // Fallback: CoinDesk RSS
      try {
        const rssUrl = 'https://coindesk.com/arc/outboundfeeds/rss/';
        const response = await fetch(`https://allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`);
        
        if (response.ok) {
          const rssText = await response.text();
          const parser = new DOMParser();
          const rssDoc = parser.parseFromString(rssText, 'text/xml');
          const items = rssDoc.querySelectorAll('item');
          
          if (items.length > 0) {
            const newsData = Array.from(items).slice(0, 6).map((item: any) => ({
              title: decodeHtmlEntities(item.querySelector('title')?.textContent?.replace(/<!\[CDATA\[|\]\]>/g, '') || ''),
              source: 'CoinDesk',
              time: formatTimeAgo(new Date(item.querySelector('pubDate')?.textContent || '')),
              url: item.querySelector('link')?.textContent || ''
            }));
            
            setNews(newsData);
            NewsCache.setCachedNews(newsData, 'CoinDesk');
            setLoading(false);
            return;
          }
        }
      } catch (fallbackError) {
        console.log('CoinDesk RSS fallback failed:', fallbackError);
      }

      setNews([]);
    } catch (error) {
      console.error('Error fetching news:', error);
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  // Generate script using Gemini
  const generateScript = async (newsItem: NewsItem) => {
    if (!newsItem) return;
    setGenerating(true);
    try {
      const prompt = `
Create a short-form video script based on this crypto news:
"${newsItem.title}"

Please provide the response in this JSON format:
{
  "topic": "A catchy, SEO-optimized title for the video (max 60 chars)",
  "script": "A compelling voiceover script that explains the news in an engaging way. The script should be conversational, easy to understand, and optimized for a 30-60 second video. DO NOT use any emojis.",
  "videoSearchQuery": "A specific search query for finding relevant stock footage on Pexels. Focus on visual elements that would work well with the script. Make it specific but not too long (3-5 words)."
}

Make it:
1. Engaging and attention-grabbing from the first second
2. Easy to understand for beginners
3. Factual and informative
4. End with a call to action
5. Keep the script length suitable for 30-60 seconds when spoken
`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate script');
      }

      const data = await response.json();
      const aiResponse = data.candidates[0].content.parts[0].text;
      
      // Extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const scriptData = JSON.parse(jsonMatch[0]);
        setGeneratedScript(scriptData);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error generating script:', error);
      alert('Failed to generate script. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // Helper function to decode HTML entities
  const decodeHtmlEntities = (text: string) => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  // Helper function to format time ago
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // Initial data fetch
  useEffect(() => {
    fetchNews();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Shorts Generator</h1>
        <p className="text-slate-600 dark:text-slate-400">Generate viral crypto shorts from the latest news</p>
        {isFreeTier && (
          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-amber-800 dark:text-amber-200 font-medium">
                Free Tier: Limited to 3 shorts per month. Upgrade to Pro for unlimited generation.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* News Selection */}
      <Card className="bg-white/90 dark:bg-surface/50 backdrop-blur-xl border-slate-200 dark:border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-slate-900 dark:text-white">Latest Crypto News</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchNews(true)}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {news.map((item, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border ${
                  selectedNews?.title === item.title 
                    ? 'bg-primary/10 border-primary' 
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                } cursor-pointer hover:bg-primary/5`}
                onClick={() => setSelectedNews(item)}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h3 className="font-medium mb-1">{item.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <span>{item.source}</span>
                      <span>•</span>
                      <span>{item.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Generate Script Button */}
          {selectedNews && (
            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => generateScript(selectedNews)}
                disabled={generating}
                className="w-full sm:w-auto"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Script...
                  </>
                ) : (
                  <>
                    <Video className="mr-2 h-4 w-4" />
                    Generate Script
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Script */}
      {generatedScript && (
        <Card className="bg-white/90 dark:bg-surface/50 backdrop-blur-xl border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">Generated Script</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Topic</h3>
              <p className="text-slate-600 dark:text-slate-400">{generatedScript.topic}</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Script</h3>
              <div className="whitespace-pre-wrap bg-slate-50 dark:bg-slate-800 p-4 rounded-lg text-slate-600 dark:text-slate-400">
                {generatedScript.script}
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Video Search Query</h3>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg text-slate-600 dark:text-slate-400">
                {generatedScript.videoSearchQuery}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}