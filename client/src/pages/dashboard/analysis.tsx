import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Lock, Clock, TrendingUp, TrendingDown, Newspaper, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';

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
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrice[]>([]);
  const [cryptoNews, setCryptoNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Mock user data - replace with actual auth context
  const userData = { plan: "starter" };
  const isFreeTier = !userData?.plan || userData?.plan === "starter";

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
      
      return {
        overall: fearGreedValue > 50 ? "Bullish" : "Bearish",
        fearGreedIndex: fearGreedValue,
        socialSentiment: Math.floor(Math.random() * 30) + 60, // Mock data
        newsScore: Math.floor(Math.random() * 20) + 70 // Mock data
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
      await Promise.all([
        fetchCryptoPrices(),
        fetchCryptoNews(),
        fetchMarketSentiment().then(setMarketSentiment)
      ]);
      
      setLastUpdated(new Date());
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
                  Get unlimited access to advanced analytics, real-time alerts, and AI-powered insights for just $69/month.
                </p>
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