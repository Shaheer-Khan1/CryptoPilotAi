import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Lock, Clock, TrendingUp, TrendingDown, Newspaper, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function Analysis() {
  const { userData } = useAuth();
  const isFreeTier = !userData?.plan || userData?.plan === "starter";

  // Mock crypto prices
  const cryptoPrices = [
    {
      symbol: "BTC",
      name: "Bitcoin",
      price: "$43,250.75",
      change: "+2.45%",
      volume: "$28.5B",
      trend: "up",
      icon: "₿"
    },
    {
      symbol: "ETH",
      name: "Ethereum",
      price: "$2,285.30",
      change: "+1.87%",
      volume: "$15.2B",
      trend: "up",
      icon: "Ξ"
    },
    {
      symbol: "SOL",
      name: "Solana",
      price: "$98.45",
      change: "-0.75%",
      volume: "$3.8B",
      trend: "down",
      icon: "◎"
    },
    {
      symbol: "ADA",
      name: "Cardano",
      price: "$0.52",
      change: "+3.21%",
      volume: "$1.2B",
      trend: "up",
      icon: "₳"
    }
  ];

  // Mock crypto news
  const cryptoNews = [
    {
      title: "Bitcoin ETF Approval Sparks Market Rally",
      source: "CryptoNews",
      time: "2 hours ago",
      summary: "SEC's approval of spot Bitcoin ETFs leads to increased institutional adoption and market confidence."
    },
    {
      title: "Ethereum Layer 2 Solutions See Record Growth",
      source: "Blockchain Times",
      time: "4 hours ago",
      summary: "Ethereum scaling solutions reach new heights with over $20B in TVL across major L2 networks."
    },
    {
      title: "Regulatory Concerns in Asian Markets",
      source: "Crypto Daily",
      time: "6 hours ago",
      summary: "New regulatory framework proposed in major Asian markets could impact crypto trading volumes."
    },
    {
      title: "DeFi Protocol Launches Revolutionary Yield Strategy",
      source: "DeFi Pulse",
      time: "8 hours ago",
      summary: "New DeFi protocol introduces innovative yield farming mechanism with 15% APY potential."
    }
  ];

  const marketSentiment = {
    overall: "Bullish",
    fearGreedIndex: 72,
    socialSentiment: 68,
    newsScore: 84
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Market Summary</h1>
        <p className="text-slate-600 dark:text-slate-400">Real-time cryptocurrency prices and market news</p>
      </div>

      {/* Crypto Prices */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        {cryptoPrices.map((coin, index) => (
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
        ))}
      </div>

      {/* Market News */}
      <Card className="bg-white/90 dark:bg-surface/50 backdrop-blur-xl border-slate-200 dark:border-slate-700 mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-slate-900 dark:text-white">Latest Market News</CardTitle>
          <div className="flex items-center space-x-2">
            <Newspaper className="h-4 w-4 text-slate-500" />
            <span className="text-sm text-slate-500">Updated 2h ago</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {cryptoNews.map((news, index) => (
              <div key={index} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-slate-900 dark:text-white">{news.title}</h3>
              </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{news.summary}</p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{news.source}</span>
                  <span>{news.time}</span>
          </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Market Sentiment */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="bg-white/90 dark:bg-surface/50 backdrop-blur-xl border-slate-200 dark:border-slate-700">
          <CardContent className="p-6">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Overall Sentiment</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{marketSentiment.overall}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 dark:bg-surface/50 backdrop-blur-xl border-slate-200 dark:border-slate-700">
          <CardContent className="p-6">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Fear & Greed</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{marketSentiment.fearGreedIndex}</div>
            <Progress value={marketSentiment.fearGreedIndex} className="mt-2" />
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
    </div>
  );
}
