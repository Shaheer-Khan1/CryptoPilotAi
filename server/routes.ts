import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, users, chatSessions, type User } from "@shared/schema";
import Stripe from "stripe";
import { CryptoPanicService, GeminiService, YouTubeService, VideoGenerationService } from './shorts-pipeline';

let stripe: Stripe | null = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-05-28.basil",
  });
}

// Define Stripe price IDs
const STRIPE_PRICE_IDS = {
  starter: 'price_starter', // You'll need to replace these with your actual Stripe price IDs
  pro: 'price_pro',
  enterprise: 'price_enterprise'
};

// Helper function to get or create test user
async function getOrCreateTestUser(): Promise<User> {
  const user = await storage.getUserByFirebaseUid('test-user-id');
  if (!user) {
    return await storage.createUser({
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpass',
      firebaseUid: 'test-user-id',
      plan: 'starter',
    });
  }
  return user;
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get current user
  app.get("/api/user", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // For now, we'll extract the Firebase UID from the token
    // In production, you'd verify the token with Firebase Admin SDK
    const token = authHeader.replace("Bearer ", "");
    
    try {
      // Simple token parsing - in production use Firebase Admin SDK
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      const firebaseUid = payload.user_id || payload.sub;
      
      if (!firebaseUid) {
        
        return res.status(401).json({ message: "Invalid token" });
      }

      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send password in response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      // If token parsing fails, try using the token as Firebase UID directly
      try {
        const user = await storage.getUserByFirebaseUid(token);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      } catch (innerError: any) {
        res.status(500).json({ message: "Error fetching user: " + innerError.message });
      }
    }
  });

  // Create user (registration)
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      
      // Don't send password in response
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: "Error creating user: " + error.message });
    }
  });

  // Create setup intent for payment
  app.post("/api/create-setup-intent", async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe not configured" });
    }

    try {
      const { planType } = req.body;
      console.log("Creating setup intent for plan:", planType);

      // Create a setup intent
      const setupIntent = await stripe.setupIntents.create({
        payment_method_types: ['card'],
        usage: 'off_session',
      });

      console.log("Setup intent created:", setupIntent.id);

      res.json({
        clientSecret: setupIntent.client_secret,
        setupIntentId: setupIntent.id
      });
    } catch (error: any) {
      console.error("Setup intent creation error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Create subscription
  app.post("/api/create-subscription", async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe not configured" });
    }

    try {
      const { planType, setupIntentId } = req.body;
      console.log("Subscription request body:", req.body);
      console.log("Plan type:", planType);
      console.log("Setup intent ID:", setupIntentId);

      // Get the setup intent to verify payment method
      const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
      if (!setupIntent.payment_method) {
        throw new Error("No payment method attached to setup intent");
      }

      // Create the subscription
      const subscription = await stripe.subscriptions.create({
        customer: setupIntent.customer as string,
        items: [{ price: STRIPE_PRICE_IDS[planType as keyof typeof STRIPE_PRICE_IDS] }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      console.log("Subscription created:", subscription.id);

      res.json({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any).payment_intent?.client_secret,
      });
    } catch (error: any) {
      console.error("Stripe subscription creation error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Cancel subscription
  app.post('/api/cancel-subscription', async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe not configured. Please add STRIPE_SECRET_KEY." });
    }

    const firebaseUid = req.headers.authorization?.replace("Bearer ", "");
    if (!firebaseUid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user || !user.stripeSubscriptionId) {
        return res.status(404).json({ message: "No subscription found" });
      }

      await stripe.subscriptions.cancel(user.stripeSubscriptionId);
      await storage.updateUserPlan(user.id, "starter");

      res.json({ message: "Subscription canceled successfully" });
    } catch (error: any) {
      res.status(400).json({ message: "Error canceling subscription: " + error.message });
    }
  });

  // Portfolio API Routes

  // Get user's portfolios
  app.get("/api/portfolios", async (req, res) => {
    console.log('📋 GET /api/portfolios - Fetching user portfolios');
    const firebaseUid = req.headers.authorization?.replace("Bearer ", "");
    console.log('👤 Firebase UID from request:', firebaseUid ? 'Present' : 'Missing');
    
    if (!firebaseUid) {
      console.log('❌ Unauthorized - No Firebase UID provided');
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      console.log('🔍 Looking up user by Firebase UID...');
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        console.log('❌ User not found for Firebase UID:', firebaseUid);
        return res.status(404).json({ message: "User not found" });
      }
      console.log('✅ User found:', { id: user.id, email: user.email });

      console.log('📊 Fetching portfolios for user ID:', user.id);
      const portfolios = await storage.getUserPortfolios(user.id);
      console.log('📋 Found', portfolios.length, 'portfolios');
      console.log('📋 Portfolios:', portfolios.map(p => ({ id: p.id, walletAddress: p.walletAddress, totalValue: p.totalValue })));
      
      res.json(portfolios);
      console.log('✅ Successfully returned portfolios');
    } catch (error: any) {
      console.error('💥 Error fetching portfolios:', error);
      console.error('💥 Error details:', { message: error.message, stack: error.stack });
      res.status(500).json({ message: "Error fetching portfolios: " + error.message });
    }
  });

  // Get specific portfolio with assets and latest AI analysis
  app.get("/api/portfolios/:portfolioId", async (req, res) => {
    const firebaseUid = req.headers.authorization?.replace("Bearer ", "");
    const portfolioId = parseInt(req.params.portfolioId);
    
    console.log('📊 GET /api/portfolios/:portfolioId - Fetching portfolio details');
    console.log('🆔 Portfolio ID:', portfolioId);
    console.log('👤 Firebase UID:', firebaseUid ? 'Present' : 'Missing');
    
    if (!firebaseUid) {
      console.log('❌ Unauthorized - No Firebase UID provided');
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      console.log('🔍 Looking up user by Firebase UID...');
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        console.log('❌ User not found for Firebase UID:', firebaseUid);
        return res.status(404).json({ message: "User not found" });
      }
      console.log('✅ User found:', { id: user.id, email: user.email });

      // Get portfolio and verify ownership
      console.log('📊 Fetching user portfolios to verify ownership...');
      const portfolios = await storage.getUserPortfolios(user.id);
      const portfolio = portfolios.find(p => p.id === portfolioId);
      
      if (!portfolio) {
        console.log('❌ Portfolio not found or not owned by user');
        console.log('🔍 Available portfolios:', portfolios.map(p => p.id));
        return res.status(404).json({ message: "Portfolio not found" });
      }
      console.log('✅ Portfolio found and ownership verified:', { id: portfolio.id, walletAddress: portfolio.walletAddress });

      console.log('🪙 Fetching portfolio assets...');
      const assets = await storage.getPortfolioAssets(portfolioId);
      console.log('📊 Found', assets.length, 'assets');

      console.log('🤖 Fetching latest AI analysis...');
      const aiAnalysis = await storage.getLatestAiAnalysis(portfolioId);
      console.log('🤖 AI Analysis found:', aiAnalysis ? 'Yes' : 'No');

      const responseData = {
        portfolio,
        assets,
        aiAnalysis
      };
      
      console.log('📦 Response data structure:', {
        portfolioId: responseData.portfolio.id,
        assetsCount: responseData.assets.length,
        hasAiAnalysis: !!responseData.aiAnalysis
      });

      res.json(responseData);
      console.log('✅ Successfully returned portfolio details');
    } catch (error: any) {
      console.error('💥 Error fetching portfolio details:', error);
      console.error('💥 Error details:', { message: error.message, stack: error.stack });
      res.status(500).json({ message: "Error fetching portfolio: " + error.message });
    }
  });

  // Save/Update portfolio data
  app.post("/api/portfolios", async (req, res) => {
    console.log('💾 POST /api/portfolios - Saving portfolio data');
    const firebaseUid = req.headers.authorization?.replace("Bearer ", "");
    console.log('👤 Firebase UID:', firebaseUid ? 'Present' : 'Missing');
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
    
    if (!firebaseUid) {
      console.log('❌ Unauthorized - No Firebase UID provided');
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      console.log('🔍 Looking up user by Firebase UID...');
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        console.log('❌ User not found for Firebase UID:', firebaseUid);
        return res.status(404).json({ message: "User not found" });
      }
      console.log('✅ User found:', { id: user.id, email: user.email });

      const { walletAddress, chainId, totalValue, totalChange, assetsCount, ethBalance, assets, aiAnalysis } = req.body;
      
      console.log('📊 Portfolio data to save:', {
        walletAddress,
        chainId,
        totalValue,
        totalChange,
        assetsCount,
        ethBalance,
        assetsLength: assets?.length || 0,
        hasAiAnalysis: !!aiAnalysis
      });

      // Check if portfolio exists
      console.log('🔍 Checking if portfolio exists for wallet:', walletAddress);
      let portfolio = await storage.getPortfolioByUserAndWallet(user.id, walletAddress);
      
      if (portfolio) {
        console.log('🔄 Portfolio exists, updating...');
        console.log('📊 Current portfolio:', { id: portfolio.id, totalValue: portfolio.totalValue });
        
        // Update existing portfolio
        portfolio = await storage.updatePortfolio(portfolio.id, {
          totalValue,
          totalChange,
          assetsCount,
          ethBalance,
          chainId
        });
        console.log('✅ Portfolio updated:', { id: portfolio.id, newTotalValue: portfolio.totalValue });
        
        // Delete old assets and create new ones
        console.log('🗑️ Deleting old portfolio assets...');
        await storage.deletePortfolioAssets(portfolio.id);
        console.log('✅ Old assets deleted');
      } else {
        console.log('🆕 Portfolio does not exist, creating new one...');
        // Create new portfolio
        portfolio = await storage.createPortfolio({
          userId: user.id,
          walletAddress,
          chainId,
          totalValue,
          totalChange,
          assetsCount,
          ethBalance
        });
        console.log('✅ New portfolio created:', { id: portfolio.id, walletAddress: portfolio.walletAddress });
      }

      // Create portfolio assets
      if (assets && assets.length > 0) {
        console.log('🪙 Creating', assets.length, 'portfolio assets...');
        const portfolioAssets = assets.map((asset: any) => ({
          portfolioId: portfolio.id,
          symbol: asset.symbol,
          name: asset.name,
          amount: asset.amount,
          value: asset.value,
          percentage: asset.percentage,
          change: asset.change,
          contractAddress: asset.address !== 'native' ? asset.address : null,
          isNative: asset.address === 'native'
        }));

        console.log('📦 Portfolio assets to create:', portfolioAssets.map((a: any) => ({ symbol: a.symbol, value: a.value })));
        await storage.createPortfolioAssets(portfolioAssets);
        console.log('✅ Portfolio assets created successfully');
      } else {
        console.log('⚠️ No assets provided to save');
      }

      // Save AI analysis if provided
      if (aiAnalysis) {
        console.log('🤖 Saving AI analysis...');
        console.log('📊 AI Analysis data:', {
          overallScore: aiAnalysis.overallScore,
          riskLevel: aiAnalysis.riskLevel,
          diversification: aiAnalysis.diversification,
          portfolioHealth: aiAnalysis.portfolioHealth,
          dataSource: aiAnalysis.dataSource,
          hasError: aiAnalysis.error
        });
        
        await storage.createAiAnalysis({
          portfolioId: portfolio.id,
          overallScore: aiAnalysis.overallScore,
          riskLevel: aiAnalysis.riskLevel,
          diversification: aiAnalysis.diversification,
          recommendation: aiAnalysis.recommendation,
          portfolioHealth: aiAnalysis.portfolioHealth,
          keyInsights: JSON.stringify(aiAnalysis.keyInsights || []),
          rebalanceActions: JSON.stringify(aiAnalysis.rebalanceActions || []),
          riskFactors: JSON.stringify(aiAnalysis.riskFactors || []),
          opportunities: JSON.stringify(aiAnalysis.opportunities || []),
          dataSource: aiAnalysis.dataSource || "Gemini AI",
          hasError: aiAnalysis.error || false,
          errorMessage: aiAnalysis.errorMessage
        });
        console.log('✅ AI analysis saved successfully');
      } else {
        console.log('⚠️ No AI analysis provided to save');
      }

      const response = { 
        message: "Portfolio saved successfully", 
        portfolioId: portfolio.id 
      };
      
      console.log('✅ Portfolio save operation completed successfully');
      console.log('📤 Response:', response);
      
      res.json(response);

    } catch (error: any) {
      console.error('💥 Error saving portfolio:', error);
      console.error('💥 Error details:', { message: error.message, stack: error.stack });
      res.status(500).json({ message: "Error saving portfolio: " + error.message });
    }
  });

  // Get AI analysis history
  app.get("/api/ai-analysis/history", async (req, res) => {
    const firebaseUid = req.headers.authorization?.replace("Bearer ", "");
    if (!firebaseUid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const analyses = await storage.getUserAiAnalysisHistory(user.id, limit);

      // Parse JSON strings back to objects
      const parsedAnalyses = analyses.map(analysis => ({
        ...analysis,
        keyInsights: JSON.parse(analysis.keyInsights || '[]'),
        rebalanceActions: JSON.parse(analysis.rebalanceActions || '[]'),
        riskFactors: JSON.parse(analysis.riskFactors || '[]'),
        opportunities: JSON.parse(analysis.opportunities || '[]')
      }));

      res.json(parsedAnalyses);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching AI analysis history: " + error.message });
    }
  });

  // Delete portfolio
  app.delete("/api/portfolios/:portfolioId", async (req, res) => {
    const firebaseUid = req.headers.authorization?.replace("Bearer ", "");
    const portfolioId = parseInt(req.params.portfolioId);
    
    if (!firebaseUid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify portfolio ownership
      const portfolios = await storage.getUserPortfolios(user.id);
      const portfolio = portfolios.find(p => p.id === portfolioId);
      
      if (!portfolio) {
        return res.status(404).json({ message: "Portfolio not found" });
      }

      await storage.deletePortfolio(portfolioId);
      res.json({ message: "Portfolio deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting portfolio: " + error.message });
    }
  });

  // Chatbot API Routes

  // Get user's chatbots
  app.get("/api/chatbots", async (req, res) => {
    const firebaseUid = req.headers.authorization?.replace("Bearer ", "");
    
    if (!firebaseUid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      let user: User | null = null;
      // TEST BYPASS: Use or create test user if test-user-id
      if (firebaseUid === 'test-user-id') {
        user = await getOrCreateTestUser();
      } else {
        // ORIGINAL LOGIC (commented out for testing)
        /*
        user = await storage.getUserByFirebaseUid(firebaseUid);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        */
        // Uncomment above and remove test bypass for production
      }

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const chatbots = await storage.getUserChatbots(user.id);
      console.log('🤖 Found', chatbots.length, 'chatbots for user:', user.id);
      
      res.json(chatbots);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('💥 Error fetching chatbots:', errorMessage);
      res.status(500).json({ message: "Error fetching chatbots: " + errorMessage });
    }
  });

  // Get specific chatbot with files
  app.get("/api/chatbots/:chatbotId", async (req, res) => {
    const firebaseUid = req.headers.authorization?.replace("Bearer ", "");
    const chatbotId = parseInt(req.params.chatbotId);
    
    if (!firebaseUid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      let user: User | null = null;
      // TEST BYPASS: Use or create test user if test-user-id
      if (firebaseUid === 'test-user-id') {
        user = await getOrCreateTestUser();
      } else {
        // ORIGINAL LOGIC (commented out for testing)
        /*
        user = await storage.getUserByFirebaseUid(firebaseUid);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        */
        // Uncomment above and remove test bypass for production
      }

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify chatbot ownership
      const chatbots = await storage.getUserChatbots(user.id);
      const chatbot = chatbots.find(c => c.id === chatbotId);
      
      if (!chatbot) {
        return res.status(404).json({ message: "Chatbot not found" });
      }

      // Get chatbot files
      const files = await storage.getChatbotFiles(chatbotId);

      const responseData = {
        chatbot,
        files
      };

      res.json(responseData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('💥 Error fetching chatbot details:', errorMessage);
      res.status(500).json({ message: "Error fetching chatbot: " + errorMessage });
    }
  });

  // Create new chatbot
  app.post("/api/chatbots", async (req, res) => {
    console.log('🤖 POST /api/chatbots - Creating new chatbot');
    const firebaseUid = req.headers.authorization?.replace("Bearer ", "");
    
    if (!firebaseUid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      let user: User | null = null;
      // TEST BYPASS: Use or create test user if test-user-id
      if (firebaseUid === 'test-user-id') {
        user = await getOrCreateTestUser();
      } else {
        // ORIGINAL LOGIC (commented out for testing)
        /*
        user = await storage.getUserByFirebaseUid(firebaseUid);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        */
        // Uncomment above and remove test bypass for production
      }

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { name, description, platform, knowledge, files } = req.body;
      
      console.log('🤖 Creating chatbot:', { name, platform, filesCount: files?.length || 0 });

      // Create chatbot
      const chatbot = await storage.createChatbot({
        userId: user.id,
        name,
        description,
        platform: platform || "web",
        status: "processing",
        knowledge,
        deploymentUrl: null
      });

      // Save uploaded files if provided
      if (files && files.length > 0) {
        console.log('📁 Saving', files.length, 'files for chatbot');
        const chatbotFiles = files.map((file: any) => ({
          chatbotId: chatbot.id,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          extractedContent: file.content,
          processingStatus: "completed"
        }));

        await storage.createChatbotFiles(chatbotFiles);
        console.log('✅ Chatbot files saved successfully');
      }

      // Update chatbot status to active after processing
      setTimeout(async () => {
        await storage.updateChatbot(chatbot.id, {
          status: "active",
          deploymentUrl: platform ? `https://bot-deploy-${chatbot.id}.example.com` : null
        });
        console.log('✅ Chatbot activated:', chatbot.id);
      }, 3000);

      const response = { 
        message: "Chatbot created successfully", 
        chatbotId: chatbot.id,
        chatbot 
      };
      
      console.log('✅ Chatbot creation completed successfully');
      res.status(201).json(response);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('💥 Error creating chatbot:', errorMessage);
      res.status(500).json({ message: "Error creating chatbot: " + errorMessage });
    }
  });

  // Update chatbot
  app.put("/api/chatbots/:chatbotId", async (req, res) => {
    const firebaseUid = req.headers.authorization?.replace("Bearer ", "");
    const chatbotId = parseInt(req.params.chatbotId);
    
    if (!firebaseUid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      let user: typeof users.$inferSelect | null = null;
      // TEST BYPASS: Use or create test user if test-user-id
      if (firebaseUid === 'test-user-id') {
        user = await storage.getUserByFirebaseUid('test-user-id');
        if (!user) {
          user = await storage.createUser({
            username: 'testuser',
            email: 'test@example.com',
            password: 'testpass',
            firebaseUid: 'test-user-id',
            plan: 'starter',
          });
        }
      } else {
        // ORIGINAL LOGIC (commented out for testing)
        /*
        user = await storage.getUserByFirebaseUid(firebaseUid);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        */
        // Uncomment above and remove test bypass for production
      }

      // Verify chatbot ownership
      const chatbots = await storage.getUserChatbots(user.id);
      const chatbot = chatbots.find(c => c.id === chatbotId);
      
      if (!chatbot) {
        return res.status(404).json({ message: "Chatbot not found" });
      }

      const updateData = req.body;
      const updatedChatbot = await storage.updateChatbot(chatbotId, updateData);
      
      res.json(updatedChatbot);
    } catch (error: any) {
      console.error('💥 Error updating chatbot:', error);
      res.status(500).json({ message: "Error updating chatbot: " + error.message });
    }
  });

  // Delete chatbot
  app.delete("/api/chatbots/:chatbotId", async (req, res) => {
    const firebaseUid = req.headers.authorization?.replace("Bearer ", "");
    const chatbotId = parseInt(req.params.chatbotId);
    
    if (!firebaseUid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      let user: typeof users.$inferSelect | null = null;
      // TEST BYPASS: Use or create test user if test-user-id
      if (firebaseUid === 'test-user-id') {
        user = await storage.getUserByFirebaseUid('test-user-id');
        if (!user) {
          user = await storage.createUser({
            username: 'testuser',
            email: 'test@example.com',
            password: 'testpass',
            firebaseUid: 'test-user-id',
            plan: 'starter',
          });
        }
      } else {
        // ORIGINAL LOGIC (commented out for testing)
        /*
        user = await storage.getUserByFirebaseUid(firebaseUid);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        */
        // Uncomment above and remove test bypass for production
      }

      // Verify chatbot ownership
      const chatbots = await storage.getUserChatbots(user.id);
      const chatbot = chatbots.find(c => c.id === chatbotId);
      
      if (!chatbot) {
        return res.status(404).json({ message: "Chatbot not found" });
      }

      await storage.deleteChatbot(chatbotId);
      res.json({ message: "Chatbot deleted successfully" });
    } catch (error: any) {
      console.error('💥 Error deleting chatbot:', error);
      res.status(500).json({ message: "Error deleting chatbot: " + error.message });
    }
  });

  // Create chat session
  app.post("/api/chatbots/:chatbotId/sessions", async (req, res) => {
    const firebaseUid = req.headers.authorization?.replace("Bearer ", "");
    const chatbotId = parseInt(req.params.chatbotId);
    
    if (!firebaseUid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      let user: typeof users.$inferSelect | null = null;
      // TEST BYPASS: Use or create test user if test-user-id
      if (firebaseUid === 'test-user-id') {
        user = await storage.getUserByFirebaseUid('test-user-id');
        if (!user) {
          user = await storage.createUser({
            username: 'testuser',
            email: 'test@example.com',
            password: 'testpass',
            firebaseUid: 'test-user-id',
            plan: 'starter',
          });
        }
      } else {
        // ORIGINAL LOGIC (commented out for testing)
        /*
        user = await storage.getUserByFirebaseUid(firebaseUid);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        */
        // Uncomment above and remove test bypass for production
      }

      // Verify chatbot ownership
      const chatbots = await storage.getUserChatbots(user.id);
      const chatbot = chatbots.find(c => c.id === chatbotId);
      
      if (!chatbot) {
        return res.status(404).json({ message: "Chatbot not found" });
      }

      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const session = await storage.createChatSession({
        chatbotId,
        userId: user.id,
        sessionId,
        messageCount: 0,
        isActive: true
      });

      res.status(201).json(session);
    } catch (error: any) {
      console.error('💥 Error creating chat session:', error);
      res.status(500).json({ message: "Error creating chat session: " + error.message });
    }
  });

  // Send message to chatbot
  app.post("/api/chat-sessions/:sessionId/messages", async (req, res) => {
    const firebaseUid = req.headers.authorization?.replace("Bearer ", "");
    const sessionId = parseInt(req.params.sessionId);
    const { content, role } = req.body;
    
    console.log('📨 Received message request - ROLE CHECK:', {
      firebaseUid,
      sessionId,
      content: content?.substring(0, 50) + '...',
      receivedRole: role,
      roleType: typeof role
    });

    if (!firebaseUid) {
      console.log('❌ Unauthorized: No firebaseUid provided');
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Strict role validation
    if (!role || typeof role !== 'string') {
      console.log('❌ Invalid role type:', { role, type: typeof role });
      return res.status(400).json({ message: "Role must be a string" });
    }

    // Only allow "user" or "bot" roles
    if (role !== "user" && role !== "bot") {
      console.log('❌ Invalid role value:', role);
      return res.status(400).json({ message: "Role must be either 'user' or 'bot'" });
    }

    // Validate content
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      console.log('❌ Invalid content provided:', content);
      return res.status(400).json({ message: "Message content is required" });
    }

    try {
      let user: User | null = null;
      // TEST BYPASS: Use or create test user if test-user-id
      if (firebaseUid === 'test-user-id') {
        console.log('🔑 Using test user bypass');
        user = await getOrCreateTestUser();
        console.log('👤 Test user:', user);
      } else {
        user = await storage.getUserByFirebaseUid(firebaseUid);
        if (!user) {
          console.log('❌ User not found for firebaseUid:', firebaseUid);
          return res.status(404).json({ message: "User not found" });
        }
      }

      // Verify session ownership
      const session = await storage.getChatSession(sessionId);
      console.log('💬 Found chat session:', session);

      if (!session || session.userId !== user.id) {
        console.error('❌ Chat session validation failed:', {
          sessionExists: !!session,
          sessionUserId: session?.userId,
          requestUserId: user.id
        });
        return res.status(404).json({ message: "Chat session not found or unauthorized" });
      }

      // Create the message with validated role
      const message = await storage.createChatMessage({
        sessionId,
        role, // Use the validated role directly
        content: content.trim(),
        tokensUsed: null,
        processingTime: null,
        hasError: false,
        errorMessage: null
      });

      console.log('✅ Created chat message - ROLE CHECK:', {
        messageId: message.id,
        role: message.role,
        roleType: typeof message.role,
        content: message.content.substring(0, 50) + '...'
      });

      // Update session
      const updateResult = await storage.updateChatSession(sessionId, {
        messageCount: (session.messageCount || 0) + 1,
        lastActivity: new Date()
      });

      console.log('✅ Updated session:', updateResult);

      res.json(message);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('💥 Error handling message:', {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({ message: "Error handling message: " + errorMessage });
    }
  });

  // Get chat session messages
  app.get("/api/chat-sessions/:sessionId/messages", async (req, res) => {
    const firebaseUid = req.headers.authorization?.replace("Bearer ", "");
    const sessionId = parseInt(req.params.sessionId);
    
    console.log('📝 GET chat messages request:', {
      firebaseUid,
      sessionId
    });

    if (!firebaseUid) {
      console.log('❌ Unauthorized: No firebaseUid provided');
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      let user: User | null = null;
      if (firebaseUid === 'test-user-id') {
        console.log('🔑 Using test user bypass');
        user = await getOrCreateTestUser();
        console.log('👤 Test user:', user);
      } else {
        user = await storage.getUserByFirebaseUid(firebaseUid);
        if (!user) {
          console.log('❌ User not found for firebaseUid:', firebaseUid);
          return res.status(404).json({ message: "User not found" });
        }
      }

      // Verify session ownership
      const session = await storage.getChatSession(sessionId);
      console.log('💬 Found chat session:', session);

      if (!session || session.userId !== user.id) {
        console.error('❌ Chat session validation failed:', {
          sessionExists: !!session,
          sessionUserId: session?.userId,
          requestUserId: user.id
        });
        return res.status(404).json({ message: "Chat session not found or unauthorized" });
      }

      const messages = await storage.getChatMessages(sessionId);
      
      // Validate roles before sending
      messages.forEach((msg, index) => {
        console.log(`Message ${index + 1} role validation:`, {
          messageId: msg.id,
          role: msg.role,
          roleType: typeof msg.role,
          content: msg.content.substring(0, 50) + '...'
        });
      });

      res.json(messages);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('💥 Error fetching messages:', {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({ message: "Error fetching messages: " + errorMessage });
    }
  });

  // Get chat sessions for a chatbot
  app.get("/api/chatbots/:chatbotId/sessions", async (req, res) => {
    const firebaseUid = req.headers.authorization?.replace("Bearer ", "");
    const chatbotId = parseInt(req.params.chatbotId);
    
    if (!firebaseUid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      let user: typeof users.$inferSelect | null = null;
      // TEST BYPASS: Use or create test user if test-user-id
      if (firebaseUid === 'test-user-id') {
        user = await storage.getUserByFirebaseUid('test-user-id');
        if (!user) {
          user = await storage.createUser({
            username: 'testuser',
            email: 'test@example.com',
            password: 'testpass',
            firebaseUid: 'test-user-id',
            plan: 'starter',
          });
        }
      } else {
        // ORIGINAL LOGIC (commented out for testing)
        /*
        user = await storage.getUserByFirebaseUid(firebaseUid);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        */
        // Uncomment above and remove test bypass for production
      }

      // Verify chatbot ownership
      const chatbots = await storage.getUserChatbots(user.id);
      const chatbot = chatbots.find(c => c.id === chatbotId);
      
      if (!chatbot) {
        return res.status(404).json({ message: "Chatbot not found" });
      }

      const sessions = await storage.getChatbotSessions(chatbotId);
      res.json(sessions);
    } catch (error: any) {
      console.error('💥 Error fetching chat sessions:', error);
      res.status(500).json({ message: "Error fetching chat sessions: " + error.message });
    }
  });

  // Altcoin Screener API Routes

  // Fetch coin data from CoinGecko
  const fetchCoinData = async () => {
    try {
      console.log('📊 Fetching coin data from CoinGecko...');
      
      // Fetch coins with market data
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?' +
        'vs_currency=usd&' +
        'order=market_cap_desc&' +
        'per_page=250&' +
        'page=1&' +
        'sparkline=false&' +
        'price_change_percentage=24h,7d'
      );
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }
      
      const coins = await response.json();
      console.log(`📊 Fetched ${coins.length} coins from CoinGecko`);
      
      // Filter for low-mid market cap coins
      const filteredCoins = coins.filter((coin: any) => 
        coin.market_cap && 
        coin.market_cap < 500000000 && // Under $500M
        coin.market_cap > 5000000 &&   // Over $5M
        coin.total_volume > 100000 &&  // Minimum volume
        coin.price_change_percentage_24h !== null
      );
      
      console.log(`📊 Filtered to ${filteredCoins.length} qualifying coins`);
      return filteredCoins.slice(0, 100); // Limit to 100 for analysis
      
    } catch (error) {
      console.error('💥 Error fetching coins:', error);
      throw new Error('Failed to fetch coin data');
    }
  };

  // Analyze coins with Gemini AI
  const analyzeWithGemini = async (coins: any[]) => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      console.log('⚠️ No Gemini API key found, using mock data');
      return getMockSignals();
    }

    const prompt = `
      Analyze these cryptocurrency coins and return the TOP 5 with highest potential for gains in the next 7-14 days.
      
      For each coin, provide:
      - symbol: coin symbol
      - name: coin name  
      - prediction: "Strong Buy", "Buy", "Hold", "Weak Sell", "Strong Sell"
      - confidence: number between 60-95
      - targetPrice: predicted price as string with $ sign
      - timeframe: "X days" 
      - reasoning: brief explanation (1-2 sentences)
      - trend: "up", "down", or "neutral"
      
      Focus on coins with good volume, recent momentum, and technical potential.
      
      Coin data: ${JSON.stringify(coins.map((coin: any) => ({
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        current_price: coin.current_price,
        market_cap: coin.market_cap,
        price_change_24h: coin.price_change_percentage_24h,
        price_change_7d: coin.price_change_percentage_7d,
        volume: coin.total_volume
      })))}
      
      Return ONLY a JSON array with exactly 5 objects matching the format above.
    `;
    
    try {
      console.log('🤖 Analyzing coins with Gemini AI...');
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 2048,
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }
      
      const data = await response.json();
      const analysisText = data.candidates[0].content.parts[0].text;
      
      // Clean and parse JSON response
      const cleanedText = analysisText.replace(/```json\n?|\n?```/g, '').trim();
      const signals = JSON.parse(cleanedText);
      
      console.log('✅ Gemini analysis completed successfully');
      return signals;
      
    } catch (error) {
      console.error('💥 Error with Gemini analysis:', error);
      console.log('🔄 Falling back to mock signals');
      return getMockSignals();
    }
  };

  // Get mock signals as fallback
  const getMockSignals = () => {
    return [
      {
        symbol: "MATIC",
        name: "Polygon",
        prediction: "Strong Buy",
        confidence: 87,
        targetPrice: "$1.25",
        timeframe: "10 days",
        reasoning: "Strong technical indicators with upcoming network upgrades driving momentum.",
        trend: "up"
      },
      {
        symbol: "AVAX",
        name: "Avalanche",
        prediction: "Buy",
        confidence: 82,
        targetPrice: "$45.50",
        timeframe: "12 days",
        reasoning: "Breaking out of consolidation with increasing volume and positive momentum.",
        trend: "up"
      },
      {
        symbol: "LINK",
        name: "Chainlink",
        prediction: "Hold",
        confidence: 71,
        targetPrice: "$18.75",
        timeframe: "8 days",
        reasoning: "Consolidating at support levels, waiting for catalyst to drive next move.",
        trend: "neutral"
      },
      {
        symbol: "DOT",
        name: "Polkadot",
        prediction: "Weak Sell",
        confidence: 68,
        targetPrice: "$6.20",
        timeframe: "14 days",
        reasoning: "Facing resistance at key levels with decreasing volume momentum.",
        trend: "down"
      },
      {
        symbol: "UNI",
        name: "Uniswap",
        prediction: "Strong Buy",
        confidence: 91,
        targetPrice: "$12.80",
        timeframe: "7 days",
        reasoning: "Excellent volume profile with strong institutional buying and protocol upgrades.",
        trend: "up"
      }
    ];
  };

  // Apply tier-based filtering
  const filterByTier = (signals: any[], userPlan: string) => {
    const isFreeTier = !userPlan || userPlan === 'starter';
    
    if (isFreeTier) {
      return signals.slice(0, 1); // Free tier: 1 signal only
    } else {
      return signals; // Pro tier: all 5 signals
    }
  };

  // Generate altcoin signals
  app.post("/api/signals", async (req, res) => {
    console.log('🚀 POST /api/signals - Generating altcoin signals');
    const firebaseUid = req.headers.authorization?.replace("Bearer ", "");
    
    if (!firebaseUid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      let user: typeof users.$inferSelect | null = null;
      let userPlan = 'starter'; // Default to free tier
      
      // TEST BYPASS: Use or create test user if test-user-id
      if (firebaseUid === 'test-user-id') {
        console.log('🧪 TESTING MODE: Using test user bypass');
        user = { id: 0, email: 'test@example.com', plan: 'starter' };
      } else {
        // ORIGINAL LOGIC (commented out for testing)
        /*
        user = await storage.getUserByFirebaseUid(firebaseUid);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        userPlan = user.plan;
        */
        // Uncomment above and remove test bypass for production
      }

      console.log(`👤 Generating signals for user: ${user.email} (Plan: ${userPlan})`);
      
      // Step 1: Fetch coin data
      const coins = await fetchCoinData();
      
      // Step 2: Analyze with Gemini
      const signals = await analyzeWithGemini(coins);
      
      // Step 3: Apply tier restrictions
      const filteredSignals = filterByTier(signals, userPlan);
      
      console.log(`✅ Generated ${filteredSignals.length} signals for ${userPlan} tier`);
      
      res.json({ 
        success: true, 
        signals: filteredSignals,
        totalAnalyzed: coins.length,
        userPlan: userPlan
      });
      
    } catch (error: any) {
      console.error('💥 Error generating signals:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  // Save a new market summary
  app.post("/api/market-summary", async (req, res) => {
    try {
      console.log('POST /api/market-summary', req.body);
      const summary = await storage.createMarketSummary(req.body);
      res.status(201).json(summary);
      console.log('Saved market summary:', summary);
    } catch (error) {
      console.error('Error saving market summary:', error);
      res.status(500).json({ message: "Error saving market summary: " + error.message });
    }
  });

  // Get the latest market summary
  app.get("/api/market-summary/latest", async (req, res) => {
    try {
      const summary = await storage.getLatestMarketSummary();
      if (!summary) return res.status(404).json({ message: "No summary found" });
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Error fetching market summary: " + error.message });
    }
  });

  // Create test chat session
  app.post("/api/test-chat-session", async (req, res) => {
    const firebaseUid = req.headers.authorization?.replace("Bearer ", "");
    
    console.log('📝 POST /api/test-chat-session - Request:', {
      firebaseUid,
      body: req.body
    });

    if (!firebaseUid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      let user: User | null = null;
      // TEST BYPASS: Use or create test user if test-user-id
      if (firebaseUid === 'test-user-id') {
        console.log('🔑 Using test user bypass');
        user = await getOrCreateTestUser();
        console.log('👤 Test user:', user);
      } else {
        // ORIGINAL LOGIC (commented out for testing)
        /*
        user = await storage.getUserByFirebaseUid(firebaseUid);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        */
        // Uncomment above and remove test bypass for production
      }

      if (!user) {
        console.error('❌ User not found');
        return res.status(404).json({ message: "User not found" });
      }

      // Create a test chatbot if it doesn't exist
      let chatbot = (await storage.getUserChatbots(user.id)).find(c => c.name === 'Test Bot');
      if (!chatbot) {
        console.log('🤖 Creating test chatbot');
        chatbot = await storage.createChatbot({
          userId: user.id,
          name: 'Test Bot',
          description: 'A test chatbot',
          platform: 'web',
          status: 'active',
          knowledge: null,
          deploymentUrl: null
        });
        console.log('✅ Test chatbot created:', chatbot);
      }

      // Create a new chat session
      console.log('💬 Creating chat session for chatbot:', chatbot.id);
      const session = await storage.createChatSession({
        chatbotId: chatbot.id,
        userId: user.id,
        sessionId: `test-session-${Date.now()}`,
        messageCount: 0,
        isActive: true,
        lastActivity: new Date()
      });

      console.log('✅ Chat session created:', session);
      res.json(session);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('💥 Error creating test chat session:', {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({ message: "Error creating test chat session: " + errorMessage });
    }
  });

  // Shorts Generator Pipeline API endpoints
  const shortsConfig = {
    cryptoPanicApiKey: process.env.CRYPTOPANIC_API_KEY,
    geminiApiKey: process.env.GEMINI_API_KEY,
    youtubeApiKey: process.env.YOUTUBE_API_KEY,
    channelId: process.env.YOUTUBE_CHANNEL_ID,
    videoGenApiKey: process.env.LUMEN5_API_KEY,
    videoGenProvider: process.env.VIDEO_GEN_PROVIDER || 'lumen5',
  };

  const cryptoPanic = new CryptoPanicService(shortsConfig.cryptoPanicApiKey);
  const gemini = new GeminiService(shortsConfig.geminiApiKey);
  const youtube = new YouTubeService(shortsConfig.youtubeApiKey, shortsConfig.channelId);
  const videoGen = new VideoGenerationService(shortsConfig.videoGenApiKey, shortsConfig.videoGenProvider);

  // Get top crypto news
  app.get('/api/shorts/news', async (req, res) => {
    try {
      const news = await cryptoPanic.getTopNews(10);
      // Log the headlines for debugging
      console.log('📰 CryptoPanic Headlines:');
      news.forEach((item: any, idx: number) => {
        console.log(`${idx + 1}. ${item.title}`);
      });
      res.json(news);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Generate script for a news item
  app.post('/api/shorts/generate-script', async (req, res) => {
    try {
      const script = await gemini.generateScript(req.body);
      // Log the generated script for debugging
      console.log('✍️ Gemini Script Generated:');
      console.log(script);
      res.json(script);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create video (placeholder)
  app.post('/api/shorts/create-video', async (req, res) => {
    try {
      const video = await videoGen.createVideo(req.body);
      res.json(video);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Upload to YouTube (simulated)
  app.post('/api/shorts/upload-youtube', async (req, res) => {
    try {
      // In production, pass OAuth2 accessToken as needed
      const upload = await youtube.uploadVideo(req.body, null);
      res.json(upload);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
