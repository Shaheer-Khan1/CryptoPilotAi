import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Shield, Gem, Bot, Check } from "lucide-react";

export default function Features() {
  const features = [
    {
      icon: BarChart3,
      title: "Real-time Market Analysis",
      description: "Advanced machine learning models process thousands of data points every second to identify profitable trading opportunities.",
      items: [
        "Technical indicator analysis",
        "Market sentiment monitoring", 
        "Volume and liquidity assessment"
      ],
      iconColor: "text-primary",
      bgColor: "bg-primary/20"
    },
    {
      icon: Shield,
      title: "AI Risk Management",
      description: "Intelligent risk assessment and portfolio protection to safeguard your investments in volatile markets.",
      items: [
        "Automated stop-loss suggestions",
        "Portfolio diversification alerts",
        "Risk scoring algorithms"
      ],
      iconColor: "text-accent",
      bgColor: "bg-accent/20"
    },
    {
      icon: Gem,
      title: "Predictive Analytics",
      description: "Machine learning models trained on historical data to forecast price movements and market trends.",
      items: [
        "Price prediction models",
        "Trend forecasting",
        "Market cycle analysis"
      ],
      iconColor: "text-secondary",
      bgColor: "bg-secondary/20"
    },
    {
      icon: Bot,
      title: "Automated Trading Bots",
      description: "AI-powered trading bots that execute strategies 24/7 based on your preferences and risk tolerance.",
      items: [
        "Custom strategy builder",
        "24/7 market monitoring",
        "Performance optimization"
      ],
      iconColor: "text-primary",
      bgColor: "bg-primary/20"
    }
  ];

  return (
    <div className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">Comprehensive AI Features</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover how CryptoPilot AI transforms your cryptocurrency trading experience with cutting-edge artificial intelligence
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid lg:grid-cols-2 gap-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="bg-surface/30 backdrop-blur-xl border-slate-700">
                <CardContent className="p-8">
                  <div className="flex items-center mb-6">
                    <div className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center mr-4`}>
                      <Icon className={`${feature.iconColor} h-6 w-6`} />
                    </div>
                    <h3 className="text-2xl font-semibold">{feature.title}</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">{feature.description}</p>
                  <ul className="space-y-2 text-muted-foreground">
                    {feature.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-center">
                        <Check className="text-secondary mr-2 h-4 w-4" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
