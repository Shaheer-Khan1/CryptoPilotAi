import React, { useState, useEffect } from 'react';
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, TrendingDown, AlertTriangle, Lock, Star, RefreshCw, Loader2, Zap, AlertCircle } from "lucide-react";

// API functions
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const signalsAPI = {
  async generateSignals(token: string): Promise<any> {
    const response = await fetch(`${API_BASE}/api/signals`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to generate signals');
    return response.json();
  },
};

type Signal = {
  symbol: string;
  name: string;
  prediction: string;
  confidence: number;
  targetPrice: string;
  timeframe: string;
  reasoning: string;
  trend: "up" | "down" | "neutral";
};

// Signal Card Component
const SignalCard: React.FC<{ signal: Signal }> = ({ signal }) => {
  return (
    <Card className="bg-white/90 dark:bg-surface/50 backdrop-blur-xl border-slate-200 dark:border-slate-700">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 ${
              signal.trend === 'up' ? 'bg-green-500' : 
              signal.trend === 'down' ? 'bg-red-500' : 
              'bg-yellow-500'
            } rounded-full flex items-center justify-center`}>
              <span className="text-white font-bold">{signal.symbol.split('/')[0]}</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{signal.symbol}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{signal.name}</p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge 
                  variant={signal.prediction.includes('Buy') ? 'default' : 
                          signal.prediction.includes('Sell') ? 'destructive' : 
                          'secondary'}
                >
                  {signal.prediction}
                </Badge>
                {signal.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />}
                {signal.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                {signal.trend === 'neutral' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-slate-900 dark:text-white">{signal.targetPrice}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">{signal.timeframe}</div>
          </div>
        </div>
        
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Confidence Level</span>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">{signal.confidence}%</span>
          </div>
          <Progress value={signal.confidence} className="h-2" />
        </div>
        
        <p className="text-slate-700 dark:text-slate-300 text-sm">{signal.reasoning}</p>
      </CardContent>
    </Card>
  );
};

export default function Signals() {
  const { userData } = useAuth();
  const [predictions, setPredictions] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);

  const isFreeTier = !userData?.plan || userData?.plan === "starter";

  const fetchSignals = async () => {
    if (!userData?.id) {
      // Bypass for testing - remove this in production
      console.log('🧪 TESTING MODE: Bypassing authentication');
      setLoading(true);
      setError(null);
      
      try {
        console.log('🚀 Generating altcoin signals (TEST MODE)...');
        const response = await signalsAPI.generateSignals('test-user-id');
        
        if (response.success) {
          setPredictions(response.signals);
          setLastGenerated(new Date());
          console.log(`✅ Generated ${response.signals.length} signals for testing`);
        } else {
          setError(response.error || 'Failed to generate signals');
        }
      } catch (err) {
        console.error('💥 Error generating signals:', err);
        setError('Failed to generate signals. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('🚀 Generating altcoin signals...');
      const response = await signalsAPI.generateSignals(userData.id.toString());
      
      if (response.success) {
        setPredictions(response.signals);
        setLastGenerated(new Date());
        console.log(`✅ Generated ${response.signals.length} signals for ${response.userPlan} tier`);
      } else {
        setError(response.error || 'Failed to generate signals');
      }
    } catch (err) {
      console.error('💥 Error generating signals:', err);
      setError('Failed to generate signals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSignals = () => {
    fetchSignals();
  };

  // Empty mock data - no sample signals
  const mockPredictions: Signal[] = [];

  const displayPredictions = predictions.length > 0 ? predictions : mockPredictions;

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

      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Altcoin Signals
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              AI-powered cryptocurrency trading signals and analysis
            </p>
          </div>
          <Button
            onClick={handleGenerateSignals}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Generate Signals
              </>
            )}
          </Button>
        </div>

        {/* Testing Mode Indicator */}
        {!userData?.id && (
          <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertTitle>Testing Mode</AlertTitle>
            <AlertDescription>
              You're in testing mode. Signals will be generated without authentication. 
              <span className="font-semibold"> Remove this bypass in production!</span>
            </AlertDescription>
          </Alert>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Last Generated Info */}
        {lastGenerated && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last generated: {lastGenerated.toLocaleString()}
          </div>
        )}

        {/* Signals Display */}
        {displayPredictions.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {displayPredictions.map((signal, index) => (
              <SignalCard key={index} signal={signal} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Zap className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Signals Generated
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Click "Generate Signals" to get AI-powered cryptocurrency trading signals
            </p>
            <Button
              onClick={handleGenerateSignals}
              disabled={loading}
              variant="outline"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Generate Signals
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 