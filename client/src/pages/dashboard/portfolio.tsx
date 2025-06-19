import React, { useState, useEffect } from 'react';
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Lock, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  RefreshCw, 
  Wallet,
  X,
  ExternalLink,
  Copy,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import Moralis from 'moralis';
import { Buffer } from 'buffer';
import EnhancedAIAnalysis from '@/components/EnhancedAIAnalysis';
window.Buffer = Buffer;

// Add ethereum to window type
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Dummy wallet address for Sepolia
const DUMMY_WALLET = "0x13CB6AE34A13a0977F4d7101eBc24B87Bb23F0d5";

interface PortfolioAsset {
  symbol: string;
  name: string;
  amount: string;
  value: string;
  percentage: string;
  change: string;
  color: string;
  address: string;
}

interface PortfolioSummary {
  totalValue: string;
  totalChange: string;
  assets: number;
  bestPerformer: {
    symbol: string;
    change: string;
  };
  worstPerformer: {
    symbol: string;
    change: string;
  };
  lastUpdated: string;
}

interface AISummary {
  overallScore: number;
  riskLevel: string;
  diversification: string;
  recommendation: string;
  portfolioHealth: string;
  keyInsights: string[];
  rebalanceActions: {
    action: string;
    reason: string;
    impact: string;
    priority: string;
  }[];
  riskFactors: string[];
  opportunities: string[];
  nextScan: string;
  lastAnalysis: string;
  dataSource: string;
  error?: boolean;
  errorMessage?: string;
}

// Wallet Connection Modal Component
const WalletConnectionModal = ({ isOpen, onClose, onConnect }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  const walletOptions = [
    {
      name: 'MetaMask',
      icon: '🦊',
      id: 'metamask',
      description: 'Connect using MetaMask browser extension'
    },
    {
      name: 'WalletConnect',
      icon: '🔗',
      id: 'walletconnect',
      description: 'Connect using WalletConnect protocol'
    },
    {
      name: 'Coinbase Wallet',
      icon: '🔵',
      id: 'coinbase',
      description: 'Connect using Coinbase Wallet'
    }
  ];

  const handleWalletConnect = async (walletId) => {
    setIsConnecting(true);
    setError('');
    
    try {
      await onConnect(walletId);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
            Connect Wallet
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-red-800 dark:text-red-200 text-sm">{error}</span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {walletOptions.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => handleWalletConnect(wallet.id)}
              disabled={isConnecting}
              className="w-full p-4 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{wallet.icon}</span>
                <div className="text-left">
                  <div className="font-medium text-slate-900 dark:text-white">
                    {wallet.name}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {wallet.description}
                  </div>
                </div>
                {isConnecting && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary ml-auto" />
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          By connecting a wallet, you agree to our Terms of Service and Privacy Policy.
        </div>
      </div>
    </div>
  );
};

// Connected Account Display Component
const ConnectedAccount = ({ account, onDisconnect, balance }) => {
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(account);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
      <CheckCircle className="h-5 w-5 text-green-600" />
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-green-800 dark:text-green-200">
            Connected: {formatAddress(account)}
          </span>
          <button
            onClick={copyAddress}
            className="text-green-600 hover:text-green-700"
          >
            {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
        {balance && (
          <div className="text-xs text-green-600 dark:text-green-400">
            Balance: {balance} ETH
          </div>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onDisconnect}
        className="text-green-700 border-green-300 hover:bg-green-100"
      >
        Disconnect
      </Button>
    </div>
  );
};

const Portfolio = () => {
  const { userData } = useAuth();
  const [connectedAccount, setConnectedAccount] = useState<string | null>(() => {
    return localStorage.getItem('connectedWallet');
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [portfolioData, setPortfolioData] = useState<PortfolioAsset[]>(() => {
    const stored = localStorage.getItem('portfolioData');
    return stored ? JSON.parse(stored) : [];
  });
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(() => {
    const stored = localStorage.getItem('portfolioSummary');
    return stored ? JSON.parse(stored) : null;
  });
  const [aiSummary, setAiSummary] = useState<AISummary | null>(() => {
    const stored = localStorage.getItem('aiSummary');
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [ethBalance, setEthBalance] = useState(() => {
    return localStorage.getItem('ethBalance');
  });
  const isFreeTier = true;

  // Add API status state
  const [apiStatus, setApiStatus] = useState({
    moralis: 'idle',
    gemini: 'idle'
  });

  // Add a new loading state for the entire portfolio
  const [isPortfolioLoading, setIsPortfolioLoading] = useState(false);

  // Initialize Moralis
  const initializeMoralis = async () => {
    if (!Moralis.Core.isStarted) {
      await Moralis.start({
        apiKey: import.meta.env.VITE_MORALIS_API_KEY || "YOUR_MORALIS_API_KEY_HERE"
      });
    }
  };

  useEffect(() => {
    initializeMoralis();
  }, []);

  // Auto-reconnect and refresh data if wallet is stored
  useEffect(() => {
    const storedWallet = localStorage.getItem('connectedWallet');
    if (storedWallet) {
      // If we have stored data, show it immediately
      if (portfolioData.length === 0 && portfolioSummary === null) {
        // Try to load from backend first, then fallback to localStorage
        loadSavedPortfolioData().then(() => {
          // If no backend data, fetch fresh data
          if (portfolioData.length === 0) {
            fetchPortfolioData(storedWallet);
          }
        });
      }
    }
  }, []);

  // Store portfolio data in localStorage whenever it changes
  useEffect(() => {
    if (portfolioData.length > 0) {
      localStorage.setItem('portfolioData', JSON.stringify(portfolioData));
    }
  }, [portfolioData]);

  useEffect(() => {
    if (portfolioSummary) {
      localStorage.setItem('portfolioSummary', JSON.stringify(portfolioSummary));
    }
  }, [portfolioSummary]);

  useEffect(() => {
    if (aiSummary) {
      localStorage.setItem('aiSummary', JSON.stringify(aiSummary));
    }
  }, [aiSummary]);

  useEffect(() => {
    if (ethBalance) {
      localStorage.setItem('ethBalance', ethBalance);
    }
  }, [ethBalance]);

  // Connect wallet function
  const connectWallet = async (walletId) => {
    try {
      setIsLoading(true);
      
      if (walletId === 'metamask' && !window.ethereum) {
        throw new Error('MetaMask is not installed');
      }

      let accounts;
      if (walletId === 'metamask') {
        accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
      }

      if (accounts && accounts.length > 0) {
        const account = accounts[0];
        setConnectedAccount(account);
        localStorage.setItem('connectedWallet', account);
        
        // Fetch fresh data
        await fetchPortfolioData(account);
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced error handling
  const handleApiError = (error, context) => {
    console.error(`Error in ${context}:`, error);
    return {
      error: true,
      message: error.message || 'An unexpected error occurred',
      context
    };
  };

  // Generate AI summary with Gemini
  const generateAISummaryWithGemini = async (assets: PortfolioAsset[], totalValue: number, ethBalance: string) => {
    try {
      console.log('🤖 Starting AI analysis generation...');
      console.log('📊 Assets for analysis:', assets.length);
      console.log('💰 Total value for analysis:', `$${totalValue.toLocaleString()}`);
      console.log('⚡ ETH balance for analysis:', ethBalance);
      
      setApiStatus(prev => ({ ...prev, gemini: 'loading' }));
      
      // Prepare portfolio data for Gemini
      const portfolioData = {
        totalValue: totalValue,
        ethBalance: ethBalance,
        assets: assets.map(asset => ({
          symbol: asset.symbol,
          name: asset.name,
          amount: asset.amount,
          value: parseFloat(asset.value.replace('$', '').replace(',', '')),
          percentage: parseFloat(asset.percentage),
          change: asset.change
        }))
      };

      console.log('📦 Portfolio data prepared for Gemini:', JSON.stringify(portfolioData, null, 2));

      // Create detailed prompt for Gemini
      const prompt = `
Analyze this cryptocurrency portfolio and provide a detailed analysis:

Portfolio Summary:
- Total Value: $${totalValue.toLocaleString()}
- ETH Balance: ${ethBalance} ETH
- Number of Assets: ${assets.length}

Assets Breakdown:
${assets.map(asset => 
  `- ${asset.symbol} (${asset.name}): ${asset.amount} tokens, Value: ${asset.value} (${asset.percentage}% of portfolio), 24h Change: ${asset.change}`
).join('\n')}

Please provide analysis in this exact JSON format:
{
  "overallScore": [number 0-100],
  "riskLevel": "[Low/Moderate/High/Conservative/Aggressive]",
  "diversification": "[Poor/Good/Excellent]",
  "recommendation": "[detailed recommendation text]",
  "portfolioHealth": "[Healthy/Concerning/Critical]",
  "keyInsights": [
    "[insight 1]",
    "[insight 2]",
    "[insight 3]"
  ],
  "rebalanceActions": [
    {
      "action": "[specific action]",
      "reason": "[reason for action]",
      "impact": "[expected impact]",
      "priority": "[High/Medium/Low]"
    }
  ],
  "riskFactors": [
    "[risk factor 1]",
    "[risk factor 2]"
  ],
  "opportunities": [
    "[opportunity 1]",
    "[opportunity 2]"
  ]
}

Focus on:
1. Portfolio diversification analysis
2. Risk assessment based on asset allocation
3. Performance evaluation
4. Specific actionable recommendations
5. Market trends impact
6. Overall portfolio health score

Provide practical, actionable advice based on current crypto market conditions.
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
      console.log('📡 Gemini API Response Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Gemini API error response:', errorText);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Gemini API response received');
      console.log('📄 Gemini raw response:', JSON.stringify(data, null, 2));
      
      const aiResponse = data.candidates[0].content.parts[0].text;
      console.log('🤖 Gemini AI Response Text:', aiResponse);
      
      // Extract JSON from response
      let analysisData;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisData = JSON.parse(jsonMatch[0]);
          console.log('✅ Successfully parsed AI analysis JSON');
          console.log('📊 Parsed AI Analysis:', JSON.stringify(analysisData, null, 2));
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('❌ Error parsing Gemini response:', parseError);
        console.log('🔄 Using fallback analysis');
        analysisData = createFallbackAnalysis(assets, totalValue);
      }

      const finalAnalysis = {
        ...analysisData,
        nextScan: isFreeTier ? "Monthly" : "Weekly",
        lastAnalysis: new Date().toLocaleString(),
        dataSource: "Gemini AI"
      };

      console.log('🎯 Final AI Analysis to be saved:', JSON.stringify(finalAnalysis, null, 2));

      setAiSummary(finalAnalysis);
      setApiStatus(prev => ({ ...prev, gemini: 'success' }));
      
      console.log('✅ AI analysis generation completed successfully');
      
    } catch (error) {
      console.error('💥 Gemini API error:', error);
      console.error('💥 Error Details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      setApiStatus(prev => ({ ...prev, gemini: 'error' }));
      
      const fallbackAnalysis = {
        ...createFallbackAnalysis(assets, totalValue),
        error: true,
        errorMessage: 'AI analysis temporarily unavailable. Showing basic analysis.'
      };
      
      console.log('🔄 Setting fallback analysis due to error');
      setAiSummary(fallbackAnalysis);
    }
  };

  // Fallback analysis function
  const createFallbackAnalysis = (assets, totalValue) => {
    const ethPercentage = parseFloat(assets.find(a => a.symbol === 'ETH')?.percentage || 0);
    const tokenCount = assets.length;
    
    let riskLevel = "Moderate";
    let diversification = "Good";
    let score = 70;

    if (tokenCount > 5) {
      diversification = "Good";
      score += 10;
    }
    if (tokenCount > 10) {
      diversification = "Excellent";
      score += 15;
    }

    if (ethPercentage > 60) {
      riskLevel = "Conservative";
    } else if (ethPercentage > 30) {
      riskLevel = "Moderate";
    } else {
      riskLevel = "Aggressive";
    }

    return {
      overallScore: Math.min(score, 100),
      riskLevel,
      diversification,
      portfolioHealth: "Healthy",
      recommendation: `Your portfolio shows ${diversification.toLowerCase()} diversification with ${tokenCount} assets. Consider rebalancing for optimal risk-adjusted returns.`,
      keyInsights: [
        `${ethPercentage}% allocation to ETH provides stability`,
        `Portfolio contains ${tokenCount} different assets`,
        "Regular rebalancing recommended"
      ],
      rebalanceActions: [
        { 
          action: ethPercentage > 50 ? "Diversify into DeFi tokens" : "Increase ETH allocation", 
          reason: ethPercentage > 50 ? "Over-concentrated in ETH" : "Improve portfolio stability", 
          impact: "+5% portfolio score",
          priority: "Medium"
        }
      ],
      riskFactors: [
        "Market volatility exposure",
        "Concentration risk in major holdings"
      ],
      opportunities: [
        "DeFi staking opportunities",
        "Portfolio rebalancing potential"
      ],
      nextScan: "Weekly",
      lastAnalysis: new Date().toLocaleString(),
      dataSource: "Fallback Analysis"
    };
  };

  // Fetch portfolio data from Moralis and save to backend
  const fetchPortfolioData = async (address: string) => {
    try {
      console.log('🚀 Starting portfolio data fetch for address:', address);
      setIsPortfolioLoading(true);
      setApiStatus(prev => ({ ...prev, moralis: 'loading' }));

      // Get native balance (ETH)
      console.log('📊 Fetching ETH balance...');
      const nativeBalance = await Moralis.EvmApi.balance.getNativeBalance({
        chain: "0xaa36a7", // Sepolia testnet
        address: address
      });

      const ethBalanceFormatted = (parseFloat(nativeBalance.raw.balance) / Math.pow(10, 18)).toFixed(4);
      setEthBalance(ethBalanceFormatted);
      console.log('💰 ETH Balance:', ethBalanceFormatted, 'ETH');

      // Get ERC20 token balances
      console.log('🪙 Fetching ERC20 token balances...');
      const tokenBalances = await Moralis.EvmApi.token.getWalletTokenBalances({
        chain: "0xaa36a7", // Sepolia testnet
        address: address
      });

      setApiStatus(prev => ({ ...prev, moralis: 'success' }));
      console.log('✅ Moralis API call successful');

      // Fetch real ETH price from CoinGecko
      console.log('💱 Fetching ETH price from CoinGecko...');
      const ethPriceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true');
      const ethPriceData = await ethPriceResponse.json();
      const ethPrice = ethPriceData.ethereum.usd;
      const eth24hChange = ethPriceData.ethereum.usd_24h_change;
      console.log('📈 ETH Price:', `$${ethPrice}`, '24h Change:', `${eth24hChange}%`);

      // Process token balances
      const tokens = tokenBalances.raw;
      const portfolioAssets = [];
      let totalValue = parseFloat(ethBalanceFormatted) * ethPrice;

      console.log('🔍 Processing', tokens.length, 'tokens...');

      // Add ETH as first asset
      portfolioAssets.push({
        symbol: "ETH",
        name: "Ethereum",
        amount: ethBalanceFormatted,
        value: `$${(parseFloat(ethBalanceFormatted) * ethPrice).toFixed(2)}`,
        percentage: 0,
        change: `${eth24hChange >= 0 ? '+' : ''}${eth24hChange.toFixed(2)}%`,
        color: "bg-blue-500",
        address: "native"
      });

      // Process ERC20 tokens with real prices
      for (const token of tokens.slice(0, 10)) {
        if (token.balance && parseFloat(token.balance) > 0) {
          const balance = parseFloat(token.balance) / Math.pow(10, token.decimals || 18);
          
          // Try to get real price for known tokens, fallback to mock for unknown
          let tokenPrice = 1;
          let token24hChange = 0;
          
          // Map common token symbols to CoinGecko IDs
          const tokenMapping = {
            'USDC': 'usd-coin',
            'USDT': 'tether',
            'DAI': 'dai',
            'WETH': 'ethereum',
            'WBTC': 'wrapped-bitcoin',
            'UNI': 'uniswap',
            'LINK': 'chainlink',
            'AAVE': 'aave',
            'COMP': 'compound-governance-token',
            'MKR': 'maker'
          };

          const coinGeckoId = tokenMapping[token.symbol?.toUpperCase()];
          
          if (coinGeckoId) {
            try {
              const priceResponse = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoId}&vs_currencies=usd&include_24hr_change=true`);
              const priceData = await priceResponse.json();
              if (priceData[coinGeckoId]) {
                tokenPrice = priceData[coinGeckoId].usd;
                token24hChange = priceData[coinGeckoId].usd_24h_change || 0;
              }
            } catch (error) {
              console.log(`⚠️ Could not fetch price for ${token.symbol}, using fallback`);
            }
          } else {
            // For unknown tokens, use a more realistic mock price
            tokenPrice = Math.random() * 10 + 0.01; // Between $0.01 and $10
            token24hChange = (Math.random() - 0.5) * 20; // Between -10% and +10%
          }

          const tokenValue = balance * tokenPrice;
          totalValue += tokenValue;

          portfolioAssets.push({
            symbol: token.symbol || "UNK",
            name: token.name || "Unknown Token",
            amount: balance.toFixed(4),
            value: `$${tokenValue.toFixed(2)}`,
            percentage: 0,
            change: `${token24hChange >= 0 ? '+' : ''}${token24hChange.toFixed(2)}%`,
            color: `bg-${['purple', 'blue', 'green', 'red', 'yellow', 'pink'][Math.floor(Math.random() * 6)]}-500`,
            address: token.token_address
          });
        }
      }

      // Calculate percentages
      portfolioAssets.forEach(asset => {
        const assetValue = parseFloat(asset.value.replace('$', '').replace(',', ''));
        asset.percentage = ((assetValue / totalValue) * 100).toFixed(1);
      });

      // Sort by value
      portfolioAssets.sort((a, b) => {
        const aValue = parseFloat(a.value.replace('$', '').replace(',', ''));
        const bValue = parseFloat(b.value.replace('$', '').replace(',', ''));
        return bValue - aValue;
      });

      setPortfolioData(portfolioAssets);
      console.log('📊 Portfolio Assets Processed:', portfolioAssets.length, 'assets');
      console.log('💼 Total Portfolio Value:', `$${totalValue.toLocaleString()}`);

      // Calculate real total change based on weighted average of asset changes
      const totalChange = portfolioAssets.reduce((acc, asset) => {
        const assetValue = parseFloat(asset.value.replace('$', '').replace(',', ''));
        const assetChange = parseFloat(asset.change.replace('%', '').replace('+', ''));
        return acc + (assetChange * (assetValue / totalValue));
      }, 0);

      // Set portfolio summary with real data
      const portfolioSummaryData = {
        totalValue: `$${totalValue.toLocaleString()}`,
        totalChange: `${totalChange >= 0 ? '+' : ''}${totalChange.toFixed(2)}%`,
        assets: portfolioAssets.length,
        bestPerformer: {
          symbol: portfolioAssets[0]?.symbol || "ETH",
          change: portfolioAssets[0]?.change || "+0%"
        },
        worstPerformer: {
          symbol: portfolioAssets[portfolioAssets.length - 1]?.symbol || "ETH",
          change: portfolioAssets[portfolioAssets.length - 1]?.change || "0%"
        },
        lastUpdated: "Just now"
      };

      setPortfolioSummary(portfolioSummaryData);
      console.log('📈 Portfolio Summary Created:', portfolioSummaryData);

      // Generate AI summary with Gemini
      console.log('🤖 Generating AI analysis with Gemini...');
      await generateAISummaryWithGemini(portfolioAssets, totalValue, ethBalanceFormatted);

      // Save portfolio data to backend if user is authenticated
      if (userData?.firebaseUid) {
        console.log('💾 User authenticated, saving to database...');
        console.log('👤 Firebase UID:', userData.firebaseUid);
        
        try {
          const portfolioPayload = {
            walletAddress: address,
            chainId: "0xaa36a7",
            totalValue: totalValue.toString(),
            totalChange: totalChange.toFixed(2),
            assetsCount: portfolioAssets.length,
            ethBalance: ethBalanceFormatted,
            assets: portfolioAssets,
            aiAnalysis: aiSummary
          };

          console.log('📦 Portfolio Payload to Save:', JSON.stringify(portfolioPayload, null, 2));

          const saveResponse = await fetch('/api/portfolios', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${userData.firebaseUid}`
            },
            body: JSON.stringify(portfolioPayload)
          });

          console.log('📡 Database Save Response Status:', saveResponse.status);
          console.log('📡 Database Save Response Headers:', Object.fromEntries(saveResponse.headers.entries()));

          if (saveResponse.ok) {
            const savedData = await saveResponse.json();
            console.log('✅ Portfolio successfully saved to database!');
            console.log('🆔 Saved Portfolio ID:', savedData.id);
            console.log('📅 Created At:', savedData.createdAt);
            console.log('🔄 Updated At:', savedData.updatedAt);
          } else {
            const errorData = await saveResponse.text();
            console.error('❌ Failed to save portfolio to database');
            console.error('🚨 Error Status:', saveResponse.status);
            console.error('🚨 Error Response:', errorData);
          }
        } catch (error) {
          console.error('💥 Exception while saving to database:', error);
          console.error('💥 Error Details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
          });
        }
      } else {
        console.log('⚠️ User not authenticated, skipping database save');
        console.log('🔍 User Data:', userData);
      }

    } catch (error) {
      setApiStatus(prev => ({ ...prev, moralis: 'error' }));
      console.error('💥 Failed to fetch portfolio data:', error);
      console.error('💥 Error Details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      handleApiError(error, 'Portfolio Data Fetch');
    } finally {
      setIsPortfolioLoading(false);
      console.log('🏁 Portfolio data fetch completed');
    }
  };

  // Load saved portfolio data from backend
  const loadSavedPortfolioData = async () => {
    if (!userData?.firebaseUid) {
      console.log('⚠️ No Firebase UID, skipping portfolio load');
      return;
    }

    console.log('🔄 Loading saved portfolio data from database...');
    console.log('👤 Firebase UID:', userData.firebaseUid);

    try {
      console.log('📡 Fetching portfolios list...');
      const response = await fetch('/api/portfolios', {
        headers: {
          'Authorization': `Bearer ${userData.firebaseUid}`
        }
      });

      console.log('📡 Portfolios List Response Status:', response.status);
      console.log('📡 Portfolios List Response Headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const portfolios = await response.json();
        console.log('📋 Found', portfolios.length, 'saved portfolios');
        console.log('📋 Portfolios List:', portfolios);

        if (portfolios.length > 0) {
          // Load the most recent portfolio
          const latestPortfolio = portfolios[0];
          console.log('📊 Loading latest portfolio:', latestPortfolio.id);

          const portfolioResponse = await fetch(`/api/portfolios/${latestPortfolio.id}`, {
            headers: {
              'Authorization': `Bearer ${userData.firebaseUid}`
            }
          });

          console.log('📡 Portfolio Detail Response Status:', portfolioResponse.status);

          if (portfolioResponse.ok) {
            const portfolioData = await portfolioResponse.json();
            console.log('✅ Successfully loaded portfolio from database');
            console.log('📊 Loaded Portfolio Data:', JSON.stringify(portfolioData, null, 2));

            // Set the loaded data
            setConnectedAccount(portfolioData.walletAddress);
            setPortfolioData(portfolioData.assets || []);
            setPortfolioSummary({
              totalValue: `$${parseFloat(portfolioData.totalValue).toLocaleString()}`,
              totalChange: `${portfolioData.totalChange}%`,
              assets: portfolioData.assetsCount || 0,
              bestPerformer: {
                symbol: "ETH",
                change: "+0%"
              },
              worstPerformer: {
                symbol: "ETH",
                change: "0%"
              },
              lastUpdated: new Date(portfolioData.updatedAt).toLocaleString()
            });
            setAiSummary(portfolioData.aiAnalysis || null);
            setEthBalance(portfolioData.ethBalance || null);

            console.log('🎯 Portfolio state updated with loaded data');
            console.log('💰 ETH Balance loaded:', portfolioData.ethBalance);
            console.log('📊 Assets loaded:', portfolioData.assets?.length || 0);
            console.log('🤖 AI Analysis loaded:', portfolioData.aiAnalysis ? 'Yes' : 'No');
          } else {
            const errorData = await portfolioResponse.text();
            console.error('❌ Failed to load portfolio details from database');
            console.error('🚨 Error Status:', portfolioResponse.status);
            console.error('🚨 Error Response:', errorData);
          }
        } else {
          console.log('📭 No saved portfolios found in database');
        }
      } else {
        const errorData = await response.text();
        console.error('❌ Failed to fetch portfolios list from database');
        console.error('🚨 Error Status:', response.status);
        console.error('🚨 Error Response:', errorData);
      }
    } catch (error) {
      console.error('💥 Exception while loading portfolio from database:', error);
      console.error('💥 Error Details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
  };

  // Enhanced refresh function
  const refreshPortfolio = async () => {
    try {
      if (connectedAccount) {
        await fetchPortfolioData(connectedAccount);
      } else {
        await fetchPortfolioData(DUMMY_WALLET);
      }
    } catch (error) {
      handleApiError(error, 'Portfolio Refresh');
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setConnectedAccount(null);
    setPortfolioData([]);
    setPortfolioSummary(null);
    setAiSummary(null);
    setEthBalance(null);
    
    // Clear all stored data
    localStorage.removeItem('connectedWallet');
    localStorage.removeItem('portfolioData');
    localStorage.removeItem('portfolioSummary');
    localStorage.removeItem('aiSummary');
    localStorage.removeItem('ethBalance');
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">Portfolio</h1>
          <div className="flex items-center space-x-2">
            {connectedAccount && (
              <Button
                onClick={refreshPortfolio}
                variant="outline"
                className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Data
                  </>
                )}
              </Button>
            )}
          <Button
              onClick={() => setShowModal(true)}
            className="bg-primary hover:bg-primary/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </>
            )}
          </Button>
          </div>
        </div>
        <p className="text-slate-600 dark:text-slate-400">AI-powered portfolio analysis and tracking</p>
        
        {/* Connected Account Display */}
        {connectedAccount && (
          <div className="mt-4">
            <ConnectedAccount 
              account={connectedAccount}
              onDisconnect={disconnectWallet}
              balance={ethBalance}
            />
          </div>
        )}

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

        {!connectedAccount && (
          <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
            <div className="flex items-center space-x-2">
              <Wallet className="h-5 w-5 text-slate-600" />
              <span className="text-slate-800 dark:text-slate-200">
                Connect your wallet to get AI-powered portfolio insights and analysis.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Only show content if wallet is connected */}
      {connectedAccount && (
        <>
          {isPortfolioLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-slate-600 dark:text-slate-400">Loading portfolio data and AI analysis...</p>
            </div>
          ) : (
            portfolioSummary && (
        <>
          {/* Portfolio Summary */}
          <Card className="bg-white/90 dark:bg-surface/50 backdrop-blur-xl border-slate-200 dark:border-slate-700 mb-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-slate-900 dark:text-white">Portfolio Summary</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshPortfolio}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
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

                {/* AI Portfolio Analysis - Enhanced Version */}
                <EnhancedAIAnalysis 
                  aiSummary={aiSummary}
                  isFreeTier={isFreeTier}
                  onRefresh={refreshPortfolio}
                  isLoading={isLoading}
                />

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
                      <Progress value={parseFloat(asset.percentage)} className="flex-1" />
                      <span className="text-sm text-slate-600 dark:text-slate-400 w-12">{asset.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
              </>
            )
          )}
        </>
      )}

      {/* Wallet Connection Modal */}
      <WalletConnectionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConnect={connectWallet}
      />
    </div>
  );
};

export default Portfolio;