import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { Wallet, TrendingUp, Brain, ArrowUpDown } from "lucide-react";

export default function DashboardOverview() {
  const { userData } = useAuth();

  // Mock data - in real app, this would come from APIs
  const stats = [
    {
      title: "Portfolio Value",
      value: "$42,350.50",
      change: "+12.5% this month",
      icon: Wallet,
      color: "text-secondary"
    },
    {
      title: "24h P&L",
      value: "+$1,245.30",
      change: "+2.95%",
      icon: TrendingUp,
      color: "text-primary"
    },
    {
      title: "AI Predictions",
      value: "85%",
      change: "Accuracy this week",
      icon: Brain,
      color: "text-accent"
    },
    {
      title: "Active Trades",
      value: "7",
      change: "4 profitable",
      icon: ArrowUpDown,
      color: "text-primary"
    }
  ];

  const recentPredictions = [
    {
      symbol: "BTC/USD",
      prediction: "Bullish signal",
      confidence: "+15%",
      icon: "₿",
      color: "bg-orange-500"
    },
    {
      symbol: "ETH/USD",
      prediction: "Neutral",
      confidence: "+2%",
      icon: "Ξ",
      color: "bg-blue-500"
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard Overview</h1>
        <p className="text-muted-foreground">Welcome back, {userData?.username}!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="bg-surface/50 backdrop-blur-xl border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground text-sm">{stat.title}</span>
                  <Icon className={`${stat.color} h-5 w-5`} />
                </div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-secondary">{stat.change}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Portfolio Chart */}
        <Card className="bg-surface/50 backdrop-blur-xl border-slate-700">
          <CardHeader>
            <CardTitle>Portfolio Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-slate-800 rounded-lg flex items-center justify-center">
              <span className="text-muted-foreground">Chart Component Placeholder</span>
            </div>
          </CardContent>
        </Card>

        {/* Recent AI Predictions */}
        <Card className="bg-surface/50 backdrop-blur-xl border-slate-700">
          <CardHeader>
            <CardTitle>Recent AI Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPredictions.map((prediction, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 ${prediction.color} rounded-full flex items-center justify-center mr-3`}>
                      <span className="text-xs font-bold text-white">{prediction.icon}</span>
                    </div>
                    <div>
                      <div className="font-semibold">{prediction.symbol}</div>
                      <div className="text-sm text-muted-foreground">{prediction.prediction}</div>
                    </div>
                  </div>
                  <div className="text-secondary font-semibold">{prediction.confidence}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
