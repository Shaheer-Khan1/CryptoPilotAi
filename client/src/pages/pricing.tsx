import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

export default function Pricing() {
  const [, setLocation] = useLocation();
  const { currentUser } = useAuth();

  const plans = [
    {
      name: "Starter",
      price: "Free",
      description: "Perfect for beginners",
      features: [
        "Basic market analysis",
        "5 AI predictions per day",
        "Portfolio tracking for 3 coins",
        "Email alerts"
      ],
      buttonText: "Get Started",
      buttonVariant: "outline" as const,
      popular: false
    },
    {
      name: "Pro",
      price: "$29",
      period: "/month",
      description: "For serious traders",
      features: [
        "Advanced AI analysis",
        "Unlimited AI predictions",
        "Portfolio tracking for 50 coins",
        "Real-time alerts",
        "Trading bot access",
        "Priority support"
      ],
      buttonText: "Start Pro Trial",
      buttonVariant: "default" as const,
      popular: true
    },
    {
      name: "Enterprise",
      price: "$99",
      period: "/month",
      description: "For professional teams",
      features: [
        "Everything in Pro",
        "Custom AI models",
        "Unlimited portfolio tracking",
        "API access",
        "Team collaboration tools",
        "Dedicated support"
      ],
      buttonText: "Contact Sales",
      buttonVariant: "default" as const,
      popular: false
    }
  ];

  const handlePlanSelect = (planName: string) => {
    if (!currentUser) {
      setLocation(`/register?plan=${planName.toLowerCase()}`);
    } else {
      if (planName === "Starter") {
        setLocation("/dashboard");
      } else {
        setLocation(`/subscribe?plan=${planName.toLowerCase()}`);
      }
    }
  };

  return (
    <div className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground">Start free and upgrade as you grow</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={plan.name} 
              className={`bg-surface/30 backdrop-blur-xl border-slate-700 relative ${
                plan.popular ? "transform scale-105 border-2 border-primary" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary">Most Popular</Badge>
                </div>
              )}
              
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold mb-2">
                    {plan.price}
                    {plan.period && <span className="text-lg text-muted-foreground">{plan.period}</span>}
                  </div>
                  <p className="text-muted-foreground">{plan.description}</p>
                </div>
                
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="text-secondary mr-3 h-4 w-4" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Button 
                  variant={plan.buttonVariant}
                  className={`w-full py-3 ${
                    plan.name === "Enterprise" 
                      ? "bg-gradient-to-r from-accent to-primary hover:from-purple-600 hover:to-blue-600" 
                      : ""
                  }`}
                  onClick={() => handlePlanSelect(plan.name)}
                >
                  {plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
