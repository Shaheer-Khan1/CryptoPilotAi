import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Lock, TrendingUp, TrendingDown, Download, RefreshCw, Wallet } from "lucide-react";

export default function Portfolio() {
  const { userData } = useAuth();
  const isFreeTier = !userData?.plan || userData?.plan === "starter";

  // Mock portfolio summary
  const portfolioSummary = {
    totalValue: "$56,172.00",
    totalChange: "+4.27%",
    assets: 6,
    bestPerformer: {
      symbol: "SOL",
      change: "+8.91%"
    },
    worstPerformer: {
      symbol: "ADA",
      change: "-1.23%"
    },
    lastUpdated: "2 hours ago"
  };

  // Mock AI portfolio summary
  const aiSummary = {
    overallScore: 82,
    riskLevel: "Moderate",
    diversification: "Good",
    recommendation: "Consider increasing exposure to DeFi tokens while reducing meme coin allocation. Your portfolio shows strong fundamentals but could benefit from better risk management.",
    rebalanceActions: [
      { action: "Sell 20% DOGE", reason: "Overweight in meme coins", impact: "+3% portfolio score" },
      { action: "Buy more LINK", reason: "Underweight in oracles", impact: "+2% portfolio score" },
      { action: "Add stablecoin buffer", reason: "Low cash reserves", impact: "+1% risk management" }
    ],
    nextScan: isFreeTier ? "Monthly" : "Weekly"
  };

  // Mock portfolio data
  const portfolioData = [
    {
      symbol: "BTC",
      name: "Bitcoin",
      amount: "0.5234",
      value: "$25,340.50",
      percentage: 45.2,
      change: "+5.67%",
      color: "bg-orange-500"
    },
    {
      symbol: "ETH",
      name: "Ethereum",
      amount: "8.2341",
      value: "$12,680.30",
      percentage: 22.6,
      change: "+3.24%",
      color: "bg-blue-500"
    },
    {
      symbol: "ADA",
      name: "Cardano",
      amount: "15,420",
      value: "$7,125.80",
      percentage: 12.7,
      change: "-1.23%",
      color: "bg-blue-600"
    },
    {
      symbol: "SOL",
      name: "Solana",
      amount: "125.67",
      value: "$5,890.45",
      percentage: 10.5,
      change: "+8.91%",
      color: "bg-purple-500"
    },
    {
      symbol: "MATIC",
      name: "Polygon",
      amount: "8,340",
      value: "$3,245.20",
      percentage: 5.8,
      change: "+2.14%",
      color: "bg-purple-600"
    },
    {
      symbol: "DOT",
      name: "Polkadot",
      amount: "450.23",
      value: "$1,890.75",
      percentage: 3.4,
      change: "-0.56%",
      color: "bg-pink-500"
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Portfolio</h1>
        <p className="text-slate-600 dark:text-slate-400">AI-powered portfolio analysis and tracking</p>
        {isFreeTier && (
          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <Lock className="h-5 w-5 text-amber-600" />
              <span className="text-amber-800 dark:text-amber-200 font-medium">
                Free Tier: Monthly analysis only. Upgrade to Pro for weekly detailed reports.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Portfolio Summary */}
      <Card className="bg-white/90 dark:bg-surface/50 backdrop-blur-xl border-slate-200 dark:border-slate-700 mb-8">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-white">Portfolio Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <Wallet className="text-primary h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Total Value</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white">{portfolioSummary.totalValue}</div>
                  <div className="text-sm text-green-600 dark:text-green-400">{portfolioSummary.totalChange} 24h</div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="text-blue-500 h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Best Performer</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white">{portfolioSummary.bestPerformer.symbol}</div>
                  <div className="text-sm text-green-600 dark:text-green-400">{portfolioSummary.bestPerformer.change}</div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                  <TrendingDown className="text-red-500 h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Worst Performer</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white">{portfolioSummary.worstPerformer.symbol}</div>
                  <div className="text-sm text-red-500">{portfolioSummary.worstPerformer.change}</div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <RefreshCw className="text-purple-500 h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Last Updated</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white">{portfolioSummary.lastUpdated}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">{portfolioSummary.assets} assets</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Portfolio Analysis */}
      <Card className="bg-white/90 dark:bg-surface/50 backdrop-blur-xl border-slate-200 dark:border-slate-700 mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-slate-900 dark:text-white">AI Portfolio Analysis</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-green-600 border-green-600">
              Score: {aiSummary.overallScore}/100
            </Badge>
            <Button variant="outline" size="sm" disabled={isFreeTier}>
              {isFreeTier ? (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Pro Only
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Risk Level</div>
              <div className="text-lg font-semibold text-slate-900 dark:text-white">{aiSummary.riskLevel}</div>
            </div>
            <div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Diversification</div>
              <div className="text-lg font-semibold text-slate-900 dark:text-white">{aiSummary.diversification}</div>
            </div>
            <div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Next Scan</div>
              <div className="text-lg font-semibold text-slate-900 dark:text-white">{aiSummary.nextScan}</div>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">AI Recommendation</h4>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              {isFreeTier ? aiSummary.recommendation.substring(0, 100) + "..." : aiSummary.recommendation}
            </p>
            {isFreeTier && (
              <div className="mt-2">
                <Button size="sm" variant="outline">
                  <Lock className="mr-2 h-4 w-4" />
                  Upgrade for Full Analysis
                </Button>
              </div>
            )}
          </div>

          {!isFreeTier && (
            <div>
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Recommended Actions</h4>
              <div className="space-y-3">
                {aiSummary.rebalanceActions.map((action, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">{action.action}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">{action.reason}</div>
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                      {action.impact}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex space-x-3">
                <Button>
                  <Download className="mr-2 h-4 w-4" />
                  Download Report
                </Button>
                <Button variant="outline">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Auto-Rebalance
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Portfolio Breakdown */}
      <Card className="bg-white/90 dark:bg-surface/50 backdrop-blur-xl border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-white">Portfolio Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {portfolioData.map((asset, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${asset.color} rounded-full flex items-center justify-center`}>
                      <span className="text-white font-bold text-sm">{asset.symbol.slice(0, 2)}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{asset.name}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">{asset.amount} {asset.symbol}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-900 dark:text-white">{asset.value}</div>
                    <div className={`text-sm ${asset.change.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                      {asset.change}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Progress value={asset.percentage} className="flex-1" />
                  <span className="text-sm text-slate-600 dark:text-slate-400 w-12">{asset.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
