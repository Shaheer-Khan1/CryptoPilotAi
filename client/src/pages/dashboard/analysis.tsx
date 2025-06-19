import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Lock, Clock, TrendingUp, TrendingDown, Newspaper, ArrowUpRight, ArrowDownRight, RefreshCw, Brain, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface CryptoPrice {
  symbol: string;
  name: string;
  price: string;
  change: string;
  volume: string;
  trend: 'up' | 'down';
  icon: string;
}

interface NewsItem {
  title: string;
  source: string;
  time: string;
  summary: string;
}

interface MarketSentiment {
  overall: string;
  fearGreedIndex: number;
  socialSentiment: number;
  newsScore: number;
}

interface AIAnalysis {
  summary: string;
  sentiment: string;
  topPerformers: string[];
  keyNews: string[];
  recommendations: string[];
  riskLevel: string;
  confidence: number;
  generatedAt: string;
  error?: boolean;
  errorMessage?: string;
}

interface CoinGeckoResponse {
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  total_volume: number;
}

interface CryptoPanicResponse {
  results: Array<{
    title: string;
    domain: string;
    published_at: string;
  }>;
}

type TrendType = 'up' | 'down';

interface CryptoPrice {
  symbol: string;
  name: string;
  price: string;
  change: string;
  volume: string;
  trend: TrendType;
  icon: string;
}

export default function Analysis() {
  const { userData } = useAuth();
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrice[]>([]);
  const [cryptoNews, setCryptoNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Check if user is on pro plan
  const isProPlan = userData?.plan === 'pro' || userData?.plan === 'enterprise';
  const isFreeTier = !isProPlan;

  // CoinGecko API endpoints
  const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';
  const CRYPTOPANIC_BASE_URL = 'https://cryptopanic.com/api/v1';
  
  // Get API key from environment variables
  const CRYPTOPANIC_API_KEY = import.meta.env.VITE_CRYPTOPANIC_API_KEY;

  // Fetch cryptocurrency prices from CoinGecko
  const fetchCryptoPrices = async () => {
    try {
      const response = await fetch(
        `${COINGECKO_BASE_URL}/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,cardano&order=market_cap_desc&per_page=4&page=1&sparkline=false&price_change_percentage=24h`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch crypto prices');
      }
      
      const data = await response.json() as CoinGeckoResponse[];
      
      const formattedData: CryptoPrice[] = data.map((coin: CoinGeckoResponse) => ({
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: `$${coin.current_price.toLocaleString()}`,
        change: `${coin.price_change_percentage_24h?.toFixed(2)}%`,
        volume: `$${(coin.total_volume / 1000000000).toFixed(1)}B`,
        trend: coin.price_change_percentage_24h >= 0 ? 'up' : 'down',
        icon: getIconForSymbol(coin.symbol.toUpperCase())
      }));
      
      setCryptoPrices(formattedData);
    } catch (err) {
      console.error('Error fetching crypto prices:', err);
      setError('Failed to load cryptocurrency prices');
    }
  };

  // Fetch crypto news - using mock data since API requires valid key
  const fetchCryptoNews = async () => {
    try {
      // Check if we have a valid API key
      if (!CRYPTOPANIC_API_KEY) {
        console.error('API Key not found in environment variables');
        throw new Error('No valid API key provided');
      }
      
      console.log('Fetching news from CryptoPanic...');
      
      // Use CORS proxy to avoid CORS issues
      const corsProxy = 'https://api.allorigins.win/raw?url=';
      const apiUrl = `${CRYPTOPANIC_BASE_URL}/posts/?auth_token=${CRYPTOPANIC_API_KEY}&public=true&currencies=BTC,ETH,SOL,ADA&filter=hot&page=1`;
      const proxiedUrl = corsProxy + encodeURIComponent(apiUrl);
      
      console.log('Attempting to fetch from:', apiUrl);
      
      const response = await fetch(proxiedUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json() as CryptoPanicResponse;
      console.log('Received data from API');
      
      if (!data.results || !Array.isArray(data.results)) {
        throw new Error('Invalid API response format');
      }
      
      const formattedNews = data.results.slice(0, 4).map((article) => ({
        title: article.title,
        source: article.domain || 'CryptoPanic',
        time: formatTimeAgo(new Date(article.published_at)),
        summary: article.title
      }));
      
      setCryptoNews(formattedNews);
    } catch (err: unknown) {
      console.log('Using mock news data:', err instanceof Error ? err.message : 'Unknown error');
      // Generate dynamic mock data with realistic timestamps
      const now = new Date();
      const mockNews: NewsItem[] = [
        {
          title: "Bitcoin Surges Past Key Resistance Level as Institutional Interest Grows",
          source: "CryptoNews",
          time: formatTimeAgo(new Date(now.getTime() - 2 * 60 * 60 * 1000)),
          summary: "Major financial institutions continue to show increased interest in Bitcoin adoption following regulatory clarity."
        },
        {
          title: "Ethereum Network Activity Reaches New All-Time High",
          source: "Blockchain Times",
          time: formatTimeAgo(new Date(now.getTime() - 4 * 60 * 60 * 1000)),
          summary: "Layer 2 solutions drive unprecedented transaction volume as DeFi ecosystem expands rapidly."
        },
        {
          title: "Solana Ecosystem Developments Show Strong Developer Activity",
          source: "Crypto Daily",
          time: formatTimeAgo(new Date(now.getTime() - 6 * 60 * 60 * 1000)),
          summary: "New partnerships and protocol launches demonstrate growing momentum in the Solana ecosystem."
        },
        {
          title: "Cardano Announces Major Smart Contract Platform Upgrade",
          source: "DeFi Pulse",
          time: formatTimeAgo(new Date(now.getTime() - 8 * 60 * 60 * 1000)),
          summary: "Enhanced functionality and improved performance expected to boost dApp development on Cardano."
        }
      ];
      setCryptoNews(mockNews);
    }
  };

  // Fetch market sentiment data
  const fetchMarketSentiment = async () => {
    try {
      // Fetch Fear & Greed Index
      const fearGreedResponse = await fetch('https://api.alternative.me/fng/');
      if (!fearGreedResponse.ok) {
        throw new Error(`HTTP error! status: ${fearGreedResponse.status}`);
      }
      
      const fearGreedData = await fearGreedResponse.json();
      if (!fearGreedData.data || !fearGreedData.data[0] || !fearGreedData.data[0].value) {
        throw new Error('Invalid response format from Fear & Greed API');
      }
      
      const fearGreedValue = parseInt(fearGreedData.data[0].value);
      console.log('Fear & Greed Index value:', fearGreedValue);

      // Fetch real social sentiment from CryptoPanic (using existing API key)
      let socialSentiment = 50; // Default neutral
      let newsScore = 50; // Default neutral


      if (CRYPTOPANIC_API_KEY) {
        try {
          // Get news sentiment from CryptoPanic using CORS proxy
          const corsProxy = 'https://api.allorigins.win/raw?url=';
          const apiUrl = `https://cryptopanic.com/api/v1/posts/?auth_token=${CRYPTOPANIC_API_KEY}&public=true&currencies=BTC,ETH&filter=hot&page=1`;
          const proxiedUrl = corsProxy + encodeURIComponent(apiUrl);
          
          const newsResponse = await fetch(proxiedUrl);
          if (newsResponse.ok) {
            const newsData = await newsResponse.json();
            
            // Calculate news sentiment based on positive/negative news ratio
            if (newsData.results && newsData.results.length > 0) {
              const positiveNews = newsData.results.filter((post: any) => 
                post.title.toLowerCase().includes('surge') || 
                post.title.toLowerCase().includes('gain') || 
                post.title.toLowerCase().includes('bullish') ||
                post.title.toLowerCase().includes('up')
              ).length;
              
              const negativeNews = newsData.results.filter((post: any) => 
                post.title.toLowerCase().includes('crash') || 
                post.title.toLowerCase().includes('drop') || 
                post.title.toLowerCase().includes('bearish') ||
                post.title.toLowerCase().includes('down')
              ).length;
              
              const totalNews = newsData.results.length;
              if (totalNews > 0) {
                newsScore = Math.round(((positiveNews - negativeNews) / totalNews + 1) * 50);
                newsScore = Math.max(0, Math.min(100, newsScore)); // Clamp between 0-100
              }
            }
          }
        } catch (error) {
          console.log('Could not fetch news sentiment, using fallback');
        }
      }

      // Calculate social sentiment based on Fear & Greed and news score
      // This is a simplified calculation - in production you'd use dedicated social APIs
      socialSentiment = Math.round((fearGreedValue + newsScore) / 2);
      
      return {
        overall: fearGreedValue > 50 ? "Bullish" : "Bearish",
        fearGreedIndex: fearGreedValue,
        socialSentiment: socialSentiment,
        newsScore: newsScore
      };
    } catch (err) {
      console.error('Error fetching market sentiment:', err);
      // More neutral fallback values
      return {
        overall: "Neutral",
        fearGreedIndex: 50,
        socialSentiment: 50,
        newsScore: 50
      };
    }
  };

  const [marketSentiment, setMarketSentiment] = useState<MarketSentiment>({
    overall: "Neutral",
    fearGreedIndex: 50,
    socialSentiment: 50,
    newsScore: 50
  });

  // Helper functions
  const getIconForSymbol = (symbol: string): string => {
    const icons: Record<string, string> = {
      'BTC': '₿',
      'ETH': 'Ξ',
      'SOL': '◎',
      'ADA': '₳'
    };
    return icons[symbol] || symbol;
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  // Fetch all data
  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [prices, news, sentiment] = await Promise.all([
        fetchCryptoPrices(),
        fetchCryptoNews(),
        fetchMarketSentiment()
      ]);
      
      setLastUpdated(new Date());
      
      // Generate AI analysis for pro users
      if (isProPlan && prices && news && sentiment) {
        console.log('🚀 Triggering AI analysis for pro user...');
        generateAIAnalysis(prices, news, sentiment);
      }
    } catch (err) {
      setError('Failed to load market data');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchAllData();
    
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchAllData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Generate AI analysis with Gemini
  const generateAIAnalysis = async (marketData: CryptoPrice[], newsData: NewsItem[], sentimentData: MarketSentiment) => {
    if (!isProPlan) {
      console.log('AI analysis only available for pro users');
      return;
    }

    try {
      setAiLoading(true);
      console.log('🤖 Generating AI market analysis...');

      // Prepare data for Gemini
      const analysisData = {
        marketData: marketData.map(coin => ({
          symbol: coin.symbol,
          name: coin.name,
          price: coin.price,
          change: coin.change,
          volume: coin.volume,
          trend: coin.trend
        })),
        newsData: newsData.map(news => ({
          title: news.title,
          source: news.source,
          time: news.time,
          summary: news.summary
        })),
        sentimentData: {
          overall: sentimentData.overall,
          fearGreedIndex: sentimentData.fearGreedIndex,
          socialSentiment: sentimentData.socialSentiment,
          newsScore: sentimentData.newsScore
        }
      };

      console.log('📦 Data prepared for AI analysis:', analysisData);

      const prompt = `
Based on the following crypto market data and news:

Market Data: ${JSON.stringify(analysisData.marketData, null, 2)}
News Headlines: ${JSON.stringify(analysisData.newsData, null, 2)}
Market Sentiment: ${JSON.stringify(analysisData.sentimentData, null, 2)}

Create a comprehensive market analysis in this exact JSON format:
{
  "summary": "[300-word professional market summary covering overall sentiment, key movements, and market drivers]",
  "sentiment": "[Bullish/Bearish/Neutral]",
  "topPerformers": [
    "[top performing asset with reason]",
    "[second best performer]"
  ],
  "keyNews": [
    "[most impactful news item]",
    "[second most important news]"
  ],
  "recommendations": [
    "[specific trading recommendation]",
    "[risk management advice]",
    "[portfolio allocation suggestion]"
  ],
  "riskLevel": "[Low/Medium/High]",
  "confidence": [number between 0-100]
}

Focus on:
1. Overall market sentiment and trends
2. Top performers and underperformers with reasons
3. Key news events impacting the market
4. Actionable trading recommendations
5. Risk assessment and management advice

Keep the summary professional, data-driven, and actionable. Use current market data to support all conclusions.
`;

      console.log('📝 Gemini prompt length:', prompt.length, 'characters');
      console.log('🔑 Using Gemini API key:', import.meta.env.VITE_GEMINI_API_KEY ? 'Present' : 'Missing');

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      });

      console.log('📡 Gemini API Response Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Gemini API error response:', errorText);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Gemini API response received');
      
      const aiResponse = data.candidates[0].content.parts[0].text;
      console.log('🤖 Gemini AI Response Text:', aiResponse);
      
      // Extract JSON from response
      let analysisResult: AIAnalysis;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          analysisResult = {
            ...parsed,
            generatedAt: new Date().toLocaleString(),
            confidence: parsed.confidence || 75
          };
          console.log('✅ Successfully parsed AI analysis JSON');
          console.log('📊 Parsed AI Analysis:', analysisResult);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('❌ Error parsing Gemini response:', parseError);
        console.log('🔄 Using fallback analysis');
        analysisResult = createFallbackAnalysis(marketData, newsData, sentimentData);
      }

      setAiAnalysis(analysisResult);
      console.log('✅ AI analysis generation completed successfully');
      
      try {
        await fetch('/api/market-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            aiSummary: analysisResult.summary,
            keyInsights: analysisResult.keyInsights || [],
            sentiment: analysisResult.sentiment?.toLowerCase() || 'neutral',
            confidenceScore: analysisResult.confidence || 0,
            marketSnapshot: {/* TODO: fill with real snapshot if available */},
            topGainers: analysisResult.topGainers || [],
            topLosers: analysisResult.topLosers || [],
            newsDigest: analysisResult.newsDigest || {},
            tradingSignals: analysisResult.tradingSignals || [],
            generatedBy: 'manual',
            dataFreshness: new Date(),
            processingTime: analysisResult.processingTime || 0,
          }),
        });
        console.log('Market summary saved to backend');
      } catch (err) {
        console.error('Failed to save market summary:', err);
      }
    } catch (error) {
      console.error('💥 Gemini API error:', error);
      console.error('💥 Error Details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'Unknown'
      });
      
      const fallbackAnalysis = createFallbackAnalysis(marketData, newsData, sentimentData);
      fallbackAnalysis.error = true;
      fallbackAnalysis.errorMessage = 'AI analysis temporarily unavailable. Showing basic analysis.';
      
      console.log('🔄 Setting fallback analysis due to error');
      setAiAnalysis(fallbackAnalysis);
    } finally {
      setAiLoading(false);
    }
  };

  // Create fallback analysis
  const createFallbackAnalysis = (marketData: CryptoPrice[], newsData: NewsItem[], sentimentData: MarketSentiment): AIAnalysis => {
    const topPerformers = marketData
      .filter(coin => coin.trend === 'up')
      .sort((a, b) => parseFloat(b.change.replace('%', '')) - parseFloat(a.change.replace('%', '')))
      .slice(0, 2)
      .map(coin => `${coin.symbol} (+${coin.change})`);

    const keyNews = newsData.slice(0, 2).map(news => news.title);

    return {
      summary: `Market analysis shows ${sentimentData.overall.toLowerCase()} sentiment with the Fear & Greed Index at ${sentimentData.fearGreedIndex}. ${topPerformers.length > 0 ? `${topPerformers[0]} leads the top performers.` : ''} Key market drivers include ${keyNews.length > 0 ? keyNews[0].toLowerCase() : 'ongoing market developments'}.`,
      sentiment: sentimentData.overall,
      topPerformers,
      keyNews,
      recommendations: [
        "Monitor market sentiment indicators closely",
        "Diversify portfolio across different asset classes",
        "Set appropriate stop-loss levels for risk management"
      ],
      riskLevel: sentimentData.fearGreedIndex > 70 ? "High" : sentimentData.fearGreedIndex < 30 ? "High" : "Medium",
      confidence: 60,
      generatedAt: new Date().toLocaleString()
    };
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Market Summary</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Real-time cryptocurrency prices and market news
              {lastUpdated && (
                <span className="ml-2 text-sm">
                  • Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          <Button 
            onClick={fetchAllData} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {isProPlan && (
            <Button 
              onClick={() => {
                if (cryptoPrices.length > 0 && cryptoNews.length > 0) {
                  generateAIAnalysis(cryptoPrices, cryptoNews, marketSentiment);
                }
              }}
              disabled={aiLoading || cryptoPrices.length === 0}
              variant="outline"
              size="sm"
              className="ml-2"
            >
              <Brain className={`h-4 w-4 mr-2 ${aiLoading ? 'animate-pulse' : ''}`} />
              {aiLoading ? 'Analyzing...' : 'Refresh AI'}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Crypto Prices */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        {loading ? (
          Array(4).fill(0).map((_, index) => (
            <Card key={index} className="bg-white/90 dark:bg-surface/50 backdrop-blur-xl border-slate-200 dark:border-slate-700">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                    <div>
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-12 mb-2"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-2"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          cryptoPrices.map((coin, index) => (
            <Card key={index} className="bg-white/90 dark:bg-surface/50 backdrop-blur-xl border-slate-200 dark:border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                      <span className="text-lg font-bold">{coin.icon}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{coin.symbol}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">{coin.name}</div>
                    </div>
                  </div>
                  <div className={`flex items-center ${coin.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                    {coin.trend === 'up' ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                    <span className="text-sm">{coin.change}</span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{coin.price}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Vol: {coin.volume}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Market News */}
      <Card className="bg-white/90 dark:bg-surface/50 backdrop-blur-xl border-slate-200 dark:border-slate-700 mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-slate-900 dark:text-white">Latest Market News</CardTitle>
          <div className="flex items-center space-x-2">
            <Newspaper className="h-4 w-4 text-slate-500" />
            <span className="text-sm text-slate-500">
              {loading ? 'Loading...' : 'Live feed'}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid md:grid-cols-2 gap-6">
              {Array(4).fill(0).map((_, index) => (
                <div key={index} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg animate-pulse">
                  <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {cryptoNews.map((news, index) => (
                <div key={index} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-2">{news.title}</h3>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">{news.summary}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{news.source}</span>
                    <span>{news.time}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Market Sentiment */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="bg-white/90 dark:bg-surface/50 backdrop-blur-xl border-slate-200 dark:border-slate-700">
          <CardContent className="p-6">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Overall Sentiment</div>
            <div className={`text-2xl font-bold ${marketSentiment.overall === 'Bullish' ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
              {marketSentiment.overall}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 dark:bg-surface/50 backdrop-blur-xl border-slate-200 dark:border-slate-700">
          <CardContent className="p-6">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Fear & Greed</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{marketSentiment.fearGreedIndex}</div>
            <Progress value={marketSentiment.fearGreedIndex} className="mt-2" />
            <div className="text-xs text-slate-500 mt-1">
              {marketSentiment.fearGreedIndex > 75 ? 'Extreme Greed' : 
               marketSentiment.fearGreedIndex > 55 ? 'Greed' : 
               marketSentiment.fearGreedIndex > 45 ? 'Neutral' : 
               marketSentiment.fearGreedIndex > 25 ? 'Fear' : 'Extreme Fear'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 dark:bg-surface/50 backdrop-blur-xl border-slate-200 dark:border-slate-700">
          <CardContent className="p-6">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Social Sentiment</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{marketSentiment.socialSentiment}%</div>
            <Progress value={marketSentiment.socialSentiment} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-white/90 dark:bg-surface/50 backdrop-blur-xl border-slate-200 dark:border-slate-700">
          <CardContent className="p-6">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">News Score</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{marketSentiment.newsScore}%</div>
            <Progress value={marketSentiment.newsScore} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* AI Market Analysis - Pro Users Only */}
      {isProPlan && (
        <Card className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center">
                <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-purple-900 dark:text-purple-100 flex items-center space-x-2">
                  <span>AI Market Analysis</span>
                  <Badge variant="secondary" className="bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-200">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Pro
                  </Badge>
                </CardTitle>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  AI-powered market insights and trading recommendations
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {aiLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                  <span className="text-sm text-purple-600">Analyzing...</span>
                </div>
              ) : aiAnalysis && (
                <span className="text-xs text-purple-600 dark:text-purple-400">
                  Generated: {aiAnalysis.generatedAt}
                </span>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            {aiLoading ? (
              <div className="space-y-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-purple-200 dark:bg-purple-800 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-purple-200 dark:bg-purple-800 rounded w-full mb-2"></div>
                  <div className="h-4 bg-purple-200 dark:bg-purple-800 rounded w-5/6"></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="animate-pulse">
                    <div className="h-3 bg-purple-200 dark:bg-purple-800 rounded w-1/2 mb-2"></div>
                    <div className="h-8 bg-purple-200 dark:bg-purple-800 rounded"></div>
                  </div>
                  <div className="animate-pulse">
                    <div className="h-3 bg-purple-200 dark:bg-purple-800 rounded w-1/2 mb-2"></div>
                    <div className="h-8 bg-purple-200 dark:bg-purple-800 rounded"></div>
                  </div>
                </div>
              </div>
            ) : aiAnalysis ? (
              <div className="space-y-6">
                {/* Error Notice */}
                {aiAnalysis.error && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      ⚠️ {aiAnalysis.errorMessage}
                    </p>
                  </div>
                )}

                {/* Market Summary */}
                <div>
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Market Summary</h4>
                  <p className="text-purple-800 dark:text-purple-200 leading-relaxed">
                    {aiAnalysis.summary}
                  </p>
                </div>

                {/* Sentiment and Confidence */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-purple-100 dark:bg-purple-800/30 rounded-lg">
                    <div className="text-sm text-purple-700 dark:text-purple-300 mb-1">Sentiment</div>
                    <div className={`text-lg font-bold ${
                      aiAnalysis.sentiment === 'Bullish' ? 'text-green-600 dark:text-green-400' :
                      aiAnalysis.sentiment === 'Bearish' ? 'text-red-600 dark:text-red-400' :
                      'text-purple-600 dark:text-purple-400'
                    }`}>
                      {aiAnalysis.sentiment}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-purple-100 dark:bg-purple-800/30 rounded-lg">
                    <div className="text-sm text-purple-700 dark:text-purple-300 mb-1">Risk Level</div>
                    <div className={`text-lg font-bold ${
                      aiAnalysis.riskLevel === 'High' ? 'text-red-600 dark:text-red-400' :
                      aiAnalysis.riskLevel === 'Medium' ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-green-600 dark:text-green-400'
                    }`}>
                      {aiAnalysis.riskLevel}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-purple-100 dark:bg-purple-800/30 rounded-lg">
                    <div className="text-sm text-purple-700 dark:text-purple-300 mb-1">Confidence</div>
                    <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {aiAnalysis.confidence}%
                    </div>
                    <Progress value={aiAnalysis.confidence} className="mt-2" />
                  </div>
                </div>

                {/* Top Performers */}
                {aiAnalysis.topPerformers.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Top Performers</h4>
                    <div className="space-y-2">
                      {aiAnalysis.topPerformers.map((performer, index) => (
                        <div key={index} className="flex items-center space-x-2 text-purple-800 dark:text-purple-200">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <span>{performer}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key News */}
                {aiAnalysis.keyNews.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Key Market Drivers</h4>
                    <div className="space-y-2">
                      {aiAnalysis.keyNews.map((news, index) => (
                        <div key={index} className="flex items-start space-x-2 text-purple-800 dark:text-purple-200">
                          <Newspaper className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{news}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trading Recommendations */}
                {aiAnalysis.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Trading Recommendations</h4>
                    <div className="space-y-2">
                      {aiAnalysis.recommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-start space-x-2 text-purple-800 dark:text-purple-200">
                          <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm">{recommendation}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                <p className="text-purple-600 dark:text-purple-400">
                  AI analysis will be generated when market data is loaded...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Free Tier Limitation Notice */}
      {isFreeTier && (
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Lock className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  Upgrade to CryptoPilot Pro
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Get AI-powered market analysis, advanced analytics, real-time alerts, and personalized trading recommendations for just $29/month.
                </p>
                <div className="mt-3 space-y-1">
                  <div className="flex items-center space-x-2 text-xs text-blue-600 dark:text-blue-400">
                    <Brain className="h-3 w-3" />
                    <span>AI Market Analysis & Insights</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-blue-600 dark:text-blue-400">
                    <TrendingUp className="h-3 w-3" />
                    <span>Advanced Trading Recommendations</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-blue-600 dark:text-blue-400">
                    <Newspaper className="h-3 w-3" />
                    <span>Real-time Market Alerts</span>
                  </div>
                </div>
                <Button className="mt-3" size="sm">
                  Upgrade Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}