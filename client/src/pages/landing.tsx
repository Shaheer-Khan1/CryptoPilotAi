import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, PieChart, Signal } from "lucide-react";

export default function Landing() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative py-20 bg-crypto-pattern overflow-hidden">
        {/* Floating crypto symbols background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-20 left-10 text-6xl">₿</div>
          <div className="absolute top-40 right-20 text-4xl">Ξ</div>
          <div className="absolute bottom-20 left-1/4 text-5xl">₳</div>
          <div className="absolute top-60 right-1/3 text-3xl">◎</div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl brand-text mb-6">
              <span className="brand-black">CRYPTOPILOT</span>{" "}
              <span className="brand-orange">AI</span>
            </h1>
            <p className="text-xl md:text-2xl brand-text mb-2 brand-orange">
              CRYPTO ON AUTOPILOT
            </p>
            <p className="text-lg text-muted-foreground mb-8 max-w-3xl mx-auto">
              Your All-in-One AI Assistant for Cryptocurrency Trading, Analysis, and Portfolio Management
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="px-8 py-4 text-lg font-semibold">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/features">
                <Button variant="outline" size="lg" className="px-8 py-4 text-lg font-semibold">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white">Powerful AI-Driven Features</h2>
            <p className="text-xl text-slate-700 dark:text-slate-300">Everything you need to master cryptocurrency trading</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* AI Analysis */}
            <Card className="bg-white/90 dark:bg-surface/50 backdrop-blur-xl border-slate-200 dark:border-slate-700">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-6">
                  <Brain className="text-primary h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Market Summary</h3>
                <p className="text-slate-700 dark:text-slate-300">Comprehensive market analysis with real-time trends, sentiment indicators, and actionable trading insights.</p>
              </CardContent>
            </Card>
            
            {/* Portfolio Management */}
            <Card className="bg-white/90 dark:bg-surface/50 backdrop-blur-xl border-slate-200 dark:border-slate-700">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center mb-6">
                  <PieChart className="text-secondary h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Portfolio Tracking</h3>
                <p className="text-slate-700 dark:text-slate-300">Real-time portfolio monitoring with AI-powered rebalancing suggestions and risk assessment.</p>
              </CardContent>
            </Card>
            
            {/* Trading Signals */}
            <Card className="bg-white/90 dark:bg-surface/50 backdrop-blur-xl border-slate-200 dark:border-slate-700">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-6">
                  <Signal className="text-accent h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Smart Trading Signals</h3>
                <p className="text-slate-700 dark:text-slate-300">AI-generated trading signals with confidence scores and detailed explanations for every recommendation.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
