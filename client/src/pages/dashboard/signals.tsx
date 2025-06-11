import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, AlertTriangle, Lock, Star } from "lucide-react";

export default function Signals() {
  const { userData } = useAuth();
  const isFreeTier = !userData?.plan || userData?.plan === "starter";

  // Mock AI analysis data
  const predictions = [
    {
      symbol: "BTC/USD",
      prediction: "Strong Buy",
      confidence: 92,
      targetPrice: "$72,500",
      timeframe: "7 days",
      reasoning: "Technical indicators showing bullish momentum with RSI oversold recovery",
      icon: "₿",
      color: "bg-orange-500",
      trend: "up"
    },
    {
      symbol: "ETH/USD",
      prediction: "Hold",
      confidence: 67,
      targetPrice: "$2,850",
      timeframe: "5 days",
      reasoning: "Consolidation phase expected before next major move",
      icon: "Ξ",
      color: "bg-blue-500",
      trend: "neutral"
    },
    {
      symbol: "ADA/USD",
      prediction: "Weak Sell",
      confidence: 78,
      targetPrice: "$0.42",
      timeframe: "10 days",
      reasoning: "Breaking below key support levels with high volume",
      icon: "₳",
      color: "bg-blue-600",
      trend: "down"
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Trading Signals</h1>
        <p className="text-slate-600 dark:text-slate-400">AI-powered trading signals and market predictions</p>
        {isFreeTier && (
          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <Lock className="h-5 w-5 text-amber-600" />
              <span className="text-amber-800 dark:text-amber-200 font-medium">
                Free Tier: 1 signal per day. Upgrade to Pro for unlimited AI-ranked signals.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* AI Predictions */}
      <Card className="bg-white/90 dark:bg-surface/50 backdrop-blur-xl border-slate-200 dark:border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-slate-900 dark:text-white">AI Trading Signals</CardTitle>
          {!isFreeTier && (
            <Button variant="outline" size="sm">
              <Star className="mr-2 h-4 w-4" />
              View All Signals
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {predictions.slice(0, isFreeTier ? 1 : predictions.length).map((prediction, index) => (
              <div key={index} className="p-6 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 ${prediction.color} rounded-full flex items-center justify-center`}>
                      <span className="text-white font-bold">{prediction.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{prediction.symbol}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge 
                          variant={prediction.prediction.includes('Buy') ? 'default' : 
                                  prediction.prediction.includes('Sell') ? 'destructive' : 
                                  'secondary'}
                        >
                          {prediction.prediction}
                        </Badge>
                        {prediction.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />}
                        {prediction.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                        {prediction.trend === 'neutral' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-slate-900 dark:text-white">{prediction.targetPrice}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">{prediction.timeframe}</div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Confidence Level</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{prediction.confidence}%</span>
                  </div>
                  <Progress value={prediction.confidence} className="h-2" />
                </div>
                
                <p className="text-slate-700 dark:text-slate-300 text-sm">{prediction.reasoning}</p>
              </div>
            ))}
            
            {isFreeTier && predictions.length > 1 && (
              <div className="p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-center">
                <Lock className="mx-auto h-12 w-12 text-amber-600 mb-4" />
                <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">
                  {predictions.length - 1} More Signals Available
                </h3>
                <p className="text-amber-700 dark:text-amber-300 mb-4">
                  Upgrade to Pro to access all AI-ranked trading signals with detailed analysis.
                </p>
                <Button>
                  <Star className="mr-2 h-4 w-4" />
                  Upgrade to Pro
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 