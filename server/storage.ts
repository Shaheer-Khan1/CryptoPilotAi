import { 
  users, type User, type InsertUser,
  portfolios, type Portfolio, type InsertPortfolio,
  portfolioAssets, type PortfolioAsset, type InsertPortfolioAsset,
  aiAnalyses, type AiAnalysis, type InsertAiAnalysis,
  chatbots, type Chatbot, type InsertChatbot,
  chatSessions, type ChatSession, type InsertChatSession,
  chatMessages, type ChatMessage, type InsertChatMessage,
  chatbotFiles, type ChatbotFile, type InsertChatbotFile
} from "@shared/schema";

// Define MarketSummary type based on the schema
type MarketSummary = {
  aiSummary: string;
  keyInsights: string[];
  sentiment: string;
  confidenceScore: number;
  marketSnapshot: any;
  topGainers: any[];
  topLosers: any[];
  newsDigest: any;
  tradingSignals: any[];
  generatedBy: string;
  dataFreshness: Date;
  processingTime: number;
  createdAt?: Date;
  id?: number;
};

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | null>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStripeInfo(userId: number, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User>;
  updateUserPlan(userId: number, plan: string): Promise<User>;
  
  // Portfolio methods
  getPortfolioByUserAndWallet(userId: number, walletAddress: string): Promise<Portfolio | undefined>;
  getUserPortfolios(userId: number): Promise<Portfolio[]>;
  createPortfolio(portfolio: InsertPortfolio): Promise<Portfolio>;
  updatePortfolio(portfolioId: number, updates: Partial<InsertPortfolio>): Promise<Portfolio>;
  deletePortfolio(portfolioId: number): Promise<void>;
  
  // Portfolio Assets methods
  getPortfolioAssets(portfolioId: number): Promise<PortfolioAsset[]>;
  createPortfolioAssets(assets: InsertPortfolioAsset[]): Promise<PortfolioAsset[]>;
  deletePortfolioAssets(portfolioId: number): Promise<void>;
  
  // AI Analysis methods
  getLatestAiAnalysis(portfolioId: number): Promise<AiAnalysis | undefined>;
  createAiAnalysis(analysis: InsertAiAnalysis): Promise<AiAnalysis>;
  getUserAiAnalysisHistory(userId: number, limit?: number): Promise<AiAnalysis[]>;

  // Chatbot methods
  getUserChatbots(userId: number): Promise<Chatbot[]>;
  getChatbot(chatbotId: number): Promise<Chatbot | undefined>;
  createChatbot(chatbot: InsertChatbot): Promise<Chatbot>;
  updateChatbot(chatbotId: number, updates: Partial<InsertChatbot>): Promise<Chatbot>;
  deleteChatbot(chatbotId: number): Promise<void>;
  
  // Chatbot Files methods
  getChatbotFiles(chatbotId: number): Promise<ChatbotFile[]>;
  createChatbotFiles(files: InsertChatbotFile[]): Promise<ChatbotFile[]>;
  
  // Chat Session methods
  getChatSession(sessionId: number): Promise<ChatSession | undefined>;
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  updateChatSession(sessionId: number, updates: Partial<InsertChatSession>): Promise<ChatSession>;
  getChatbotSessions(chatbotId: number): Promise<ChatSession[]>;
  
  // Chat Message methods
  getChatMessages(sessionId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private portfolios: Map<number, Portfolio>;
  private portfolioAssets: Map<number, PortfolioAsset>;
  private aiAnalyses: Map<number, AiAnalysis>;
  private chatbots: Map<number, Chatbot>;
  private chatbotFiles: Map<number, ChatbotFile>;
  private chatSessions: Map<number, ChatSession>;
  private chatMessages: Map<number, ChatMessage>;
  currentId: number;
  private currentPortfolioId: number;
  private currentAssetId: number;
  private currentAnalysisId: number;
  private currentChatbotId: number;
  private currentChatbotFileId: number;
  private currentChatSessionId: number;
  private currentChatMessageId: number;

  marketSummaries = new Map();
  rawNewsData = new Map();
  rawMarketData = new Map();
  digestSubscriptions = new Map();
  summaryGenerationLogs = new Map();
  dailySummaryStats = new Map();

  constructor() {
    this.users = new Map();
    this.portfolios = new Map();
    this.portfolioAssets = new Map();
    this.aiAnalyses = new Map();
    this.chatbots = new Map();
    this.chatbotFiles = new Map();
    this.chatSessions = new Map();
    this.chatMessages = new Map();
    this.currentId = 1;
    this.currentPortfolioId = 1;
    this.currentAssetId = 1;
    this.currentAnalysisId = 1;
    this.currentChatbotId = 1;
    this.currentChatbotFileId = 1;
    this.currentChatSessionId = 1;
    this.currentChatMessageId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | null> {
    const user = Array.from(this.users.values()).find(
      (user) => user.firebaseUid === firebaseUid,
    );
    return user || null;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { 
      ...insertUser, 
      id,
      firebaseUid: insertUser.firebaseUid || null,
      plan: insertUser.plan || "starter",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserStripeInfo(userId: number, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error("User not found");
    }
    const updatedUser = { ...user, stripeCustomerId, stripeSubscriptionId };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserPlan(userId: number, plan: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error("User not found");
    }
    const updatedUser = { ...user, plan };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Portfolio methods
  async getPortfolioByUserAndWallet(userId: number, walletAddress: string): Promise<Portfolio | undefined> {
    return Array.from(this.portfolios.values()).find(
      p => p.userId === userId && p.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    );
  }

  async getUserPortfolios(userId: number): Promise<Portfolio[]> {
    return Array.from(this.portfolios.values()).filter(p => p.userId === userId);
  }

  async createPortfolio(insertPortfolio: InsertPortfolio): Promise<Portfolio> {
    const id = this.currentPortfolioId++;
    const portfolio: Portfolio = {
      ...insertPortfolio,
      id,
      chainId: insertPortfolio.chainId || "0xaa36a7",
      totalValue: insertPortfolio.totalValue || null,
      totalChange: insertPortfolio.totalChange || null,
      assetsCount: insertPortfolio.assetsCount || 0,
      ethBalance: insertPortfolio.ethBalance || null,
      lastUpdated: new Date(),
      createdAt: new Date(),
    };
    this.portfolios.set(id, portfolio);
    return portfolio;
  }

  async updatePortfolio(portfolioId: number, updates: Partial<InsertPortfolio>): Promise<Portfolio> {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) throw new Error("Portfolio not found");
    
    const updatedPortfolio = { 
      ...portfolio, 
      ...updates, 
      lastUpdated: new Date() 
    };
    this.portfolios.set(portfolioId, updatedPortfolio);
    return updatedPortfolio;
  }

  async deletePortfolio(portfolioId: number): Promise<void> {
    this.portfolios.delete(portfolioId);
    // Also delete related assets and analyses
    Array.from(this.portfolioAssets.entries())
      .filter(([_, asset]) => asset.portfolioId === portfolioId)
      .forEach(([id]) => this.portfolioAssets.delete(id));
    
    Array.from(this.aiAnalyses.entries())
      .filter(([_, analysis]) => analysis.portfolioId === portfolioId)
      .forEach(([id]) => this.aiAnalyses.delete(id));
  }

  // Portfolio Assets methods
  async getPortfolioAssets(portfolioId: number): Promise<PortfolioAsset[]> {
    return Array.from(this.portfolioAssets.values())
      .filter(asset => asset.portfolioId === portfolioId);
  }

  async createPortfolioAssets(assets: InsertPortfolioAsset[]): Promise<PortfolioAsset[]> {
    const createdAssets: PortfolioAsset[] = [];
    
    for (const insertAsset of assets) {
      const id = this.currentAssetId++;
      const asset: PortfolioAsset = { 
        ...insertAsset, 
        id,
        contractAddress: insertAsset.contractAddress || null,
        isNative: insertAsset.isNative || false
      };
      this.portfolioAssets.set(id, asset);
      createdAssets.push(asset);
    }
    
    return createdAssets;
  }

  async deletePortfolioAssets(portfolioId: number): Promise<void> {
    Array.from(this.portfolioAssets.entries())
      .filter(([_, asset]) => asset.portfolioId === portfolioId)
      .forEach(([id]) => this.portfolioAssets.delete(id));
  }

  // AI Analysis methods
  async getLatestAiAnalysis(portfolioId: number): Promise<AiAnalysis | undefined> {
    const analyses = Array.from(this.aiAnalyses.values())
      .filter(analysis => analysis.portfolioId === portfolioId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return analyses[0];
  }

  async createAiAnalysis(insertAnalysis: InsertAiAnalysis): Promise<AiAnalysis> {
    const id = this.currentAnalysisId++;
    const analysis: AiAnalysis = {
      ...insertAnalysis,
      id,
      overallScore: insertAnalysis.overallScore || null,
      riskLevel: insertAnalysis.riskLevel || null,
      diversification: insertAnalysis.diversification || null,
      recommendation: insertAnalysis.recommendation || null,
      portfolioHealth: insertAnalysis.portfolioHealth || null,
      keyInsights: insertAnalysis.keyInsights || null,
      rebalanceActions: insertAnalysis.rebalanceActions || null,
      riskFactors: insertAnalysis.riskFactors || null,
      opportunities: insertAnalysis.opportunities || null,
      dataSource: insertAnalysis.dataSource || "Gemini AI",
      hasError: insertAnalysis.hasError || false,
      errorMessage: insertAnalysis.errorMessage || null,
      createdAt: new Date(),
    };
    this.aiAnalyses.set(id, analysis);
    return analysis;
  }

  async getUserAiAnalysisHistory(userId: number, limit = 10): Promise<AiAnalysis[]> {
    const userPortfolioIds = Array.from(this.portfolios.values())
      .filter(p => p.userId === userId)
      .map(p => p.id);
    
    return Array.from(this.aiAnalyses.values())
      .filter(analysis => userPortfolioIds.includes(analysis.portfolioId))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async createMarketSummary(summary: MarketSummary) {
    const id = this.marketSummaries.size + 1;
    const newSummary = { ...summary, id, createdAt: new Date() };
    this.marketSummaries.set(id, newSummary);
    return newSummary;
  }

  async getLatestMarketSummary() {
    if (this.marketSummaries.size === 0) return undefined;
    return Array.from(this.marketSummaries.values()).sort((a, b) => b.createdAt - a.createdAt)[0];
  }

  // Chatbot methods
  async getUserChatbots(userId: number): Promise<Chatbot[]> {
    return Array.from(this.chatbots.values()).filter(c => c.userId === userId);
  }

  async getChatbot(chatbotId: number): Promise<Chatbot | undefined> {
    return this.chatbots.get(chatbotId);
  }

  async createChatbot(insertChatbot: InsertChatbot): Promise<Chatbot> {
    const id = this.currentChatbotId++;
    const chatbot: Chatbot = {
      ...insertChatbot,
      id,
      platform: insertChatbot.platform || "web",
      status: insertChatbot.status || "active",
      knowledge: insertChatbot.knowledge || null,
      deploymentUrl: insertChatbot.deploymentUrl || null,
      description: insertChatbot.description || null,
      users: 0,
      messages: 0,
      lastUpdated: new Date(),
      createdAt: new Date(),
    };
    this.chatbots.set(id, chatbot);
    return chatbot;
  }

  async updateChatbot(chatbotId: number, updates: Partial<InsertChatbot>): Promise<Chatbot> {
    const chatbot = this.chatbots.get(chatbotId);
    if (!chatbot) throw new Error("Chatbot not found");
    
    const updatedChatbot = { 
      ...chatbot, 
      ...updates, 
      lastUpdated: new Date() 
    };
    this.chatbots.set(chatbotId, updatedChatbot);
    return updatedChatbot;
  }

  async deleteChatbot(chatbotId: number): Promise<void> {
    this.chatbots.delete(chatbotId);
    // Also delete related files, sessions, and messages
    Array.from(this.chatbotFiles.entries())
      .filter(([_, file]) => file.chatbotId === chatbotId)
      .forEach(([id]) => this.chatbotFiles.delete(id));
    
    Array.from(this.chatSessions.entries())
      .filter(([_, session]) => session.chatbotId === chatbotId)
      .forEach(([id]) => this.chatSessions.delete(id));
  }

  // Chatbot Files methods
  async getChatbotFiles(chatbotId: number): Promise<ChatbotFile[]> {
    return Array.from(this.chatbotFiles.values())
      .filter(file => file.chatbotId === chatbotId);
  }

  async createChatbotFiles(files: InsertChatbotFile[]): Promise<ChatbotFile[]> {
    const createdFiles: ChatbotFile[] = [];
    
    for (const insertFile of files) {
      const id = this.currentChatbotFileId++;
      const file: ChatbotFile = { 
        ...insertFile, 
        id,
        extractedContent: insertFile.extractedContent || null,
        processingStatus: insertFile.processingStatus || "pending",
        errorMessage: insertFile.errorMessage || null,
        uploadDate: new Date()
      };
      this.chatbotFiles.set(id, file);
      createdFiles.push(file);
    }
    
    return createdFiles;
  }

  // Chat Session methods
  async getChatSession(sessionId: number): Promise<ChatSession | undefined> {
    return this.chatSessions.get(sessionId);
  }

  async createChatSession(insertSession: InsertChatSession): Promise<ChatSession> {
    const id = this.currentChatSessionId++;
    const session: ChatSession = {
      ...insertSession,
      id,
      messageCount: insertSession.messageCount || 0,
      isActive: insertSession.isActive || true,
      startedAt: new Date(),
      lastActivity: new Date(),
    };
    this.chatSessions.set(id, session);
    return session;
  }

  async updateChatSession(sessionId: number, updates: Partial<InsertChatSession>): Promise<ChatSession> {
    const session = this.chatSessions.get(sessionId);
    if (!session) throw new Error("Chat session not found");
    
    const updatedSession = { 
      ...session, 
      ...updates, 
      lastActivity: new Date() 
    };
    this.chatSessions.set(sessionId, updatedSession);
    return updatedSession;
  }

  async getChatbotSessions(chatbotId: number): Promise<ChatSession[]> {
    return Array.from(this.chatSessions.values())
      .filter(session => session.chatbotId === chatbotId);
  }

  // Chat Message methods
  async getChatMessages(sessionId: number): Promise<ChatMessage[]> {
    console.log('📚 Retrieving messages for session:', sessionId);
    
    // Get messages and create deep copies to prevent mutation
    const messages = Array.from(this.chatMessages.values())
      .filter(message => message.sessionId === sessionId)
      .map(msg => ({
        ...msg,
        role: msg.role, // Explicitly preserve role
        timestamp: msg.timestamp // Preserve timestamp as string
      }))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    // Debug log each message's role
    messages.forEach((msg, index) => {
      console.log(`Message ${index + 1} role check:`, {
        messageId: msg.id,
        role: msg.role,
        roleType: typeof msg.role,
        content: msg.content.substring(0, 50) + '...'
      });
    });

    return messages;
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    console.log('💾 Creating new chat message - ROLE CHECK:', {
      originalRole: message.role,
      roleType: typeof message.role,
      content: message.content.substring(0, 50) + '...'
    });
    
    // Create a new message object with preserved role
    const id = this.currentChatMessageId++;
    const timestamp = new Date();
    const newMessage: ChatMessage = {
      id,
      sessionId: message.sessionId,
      role: message.role, // Keep the original role value - don't convert to String()
      content: message.content.trim(),
      timestamp,
      tokensUsed: message.tokensUsed ?? null,
      processingTime: message.processingTime ?? null,
      hasError: message.hasError || false,
      errorMessage: message.errorMessage || null
    };
    
    // Store a clone of the message to prevent external mutations
    this.chatMessages.set(id, { ...newMessage });
    
    // Return a clone to prevent mutations
    return { ...newMessage };
  }
}

export const storage = new MemStorage();
