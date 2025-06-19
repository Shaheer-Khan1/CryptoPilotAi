import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firebaseUid: text("firebase_uid").unique(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  plan: text("plan").notNull().default("starter"), // starter, pro, enterprise
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Portfolio-related tables
export const portfolios = pgTable("portfolios", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  walletAddress: text("wallet_address").notNull(),
  chainId: text("chain_id").notNull().default("0xaa36a7"), // Sepolia testnet
  totalValue: text("total_value"), // Store as string to preserve precision
  totalChange: text("total_change"),
  assetsCount: integer("assets_count").default(0),
  ethBalance: text("eth_balance"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const portfolioAssets = pgTable("portfolio_assets", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolio_id").references(() => portfolios.id).notNull(),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  amount: text("amount").notNull(),
  value: text("value").notNull(),
  percentage: text("percentage").notNull(),
  change: text("change").notNull(),
  contractAddress: text("contract_address"),
  isNative: boolean("is_native").default(false),
});

export const aiAnalyses = pgTable("ai_analyses", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolio_id").references(() => portfolios.id).notNull(),
  overallScore: integer("overall_score"),
  riskLevel: text("risk_level"),
  diversification: text("diversification"),
  recommendation: text("recommendation"),
  portfolioHealth: text("portfolio_health"),
  keyInsights: text("key_insights"), // JSON string
  rebalanceActions: text("rebalance_actions"), // JSON string
  riskFactors: text("risk_factors"), // JSON string
  opportunities: text("opportunities"), // JSON string
  dataSource: text("data_source").default("Gemini AI"),
  hasError: boolean("has_error").default(false),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const marketSummaries = pgTable("market_summaries", {
  id: serial("id").primaryKey(),
  aiSummary: text("ai_summary"),
  keyInsights: jsonb("key_insights").$type<string[]>(),
  sentiment: text("sentiment"),
  confidenceScore: integer("confidence_score"),
  marketSnapshot: jsonb("market_snapshot").$type<any>(),
  topGainers: jsonb("top_gainers").$type<any[]>(),
  topLosers: jsonb("top_losers").$type<any[]>(),
  newsDigest: jsonb("news_digest").$type<any>(),
  tradingSignals: jsonb("trading_signals").$type<any[]>(),
  createdAt: timestamp("created_at").defaultNow(),
  generatedBy: text("generated_by"),
  dataFreshness: timestamp("data_freshness"),
  processingTime: integer("processing_time"),
});

export const rawNewsData = pgTable("raw_news_data", {
  id: serial("id").primaryKey(),
  source: text("source"),
  articles: jsonb("articles").$type<any[]>(),
  fetchedAt: timestamp("fetched_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

export const rawMarketData = pgTable("raw_market_data", {
  id: serial("id").primaryKey(),
  source: text("source"),
  globalData: jsonb("global_data").$type<any>(),
  topCoins: jsonb("top_coins").$type<any[]>(),
  fearGreedData: jsonb("fear_greed_data").$type<any>(),
  fetchedAt: timestamp("fetched_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

export const digestSubscriptions = pgTable("digest_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  email: text("email"),
  frequency: text("frequency"),
  timezone: text("timezone"),
  isActive: boolean("is_active").default(true),
  lastSent: timestamp("last_sent"),
  preferences: jsonb("preferences").$type<any>(),
});

export const summaryGenerationLogs = pgTable("summary_generation_logs", {
  id: serial("id").primaryKey(),
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  status: text("status"),
  summaryId: integer("summary_id"),
  errorMessage: text("error_message"),
  dataSourcesUsed: jsonb("data_sources_used").$type<string[]>(),
  aiTokensUsed: integer("ai_tokens_used"),
  processingSteps: jsonb("processing_steps").$type<any[]>(),
});

export const dailySummaryStats = pgTable("daily_summary_stats", {
  date: text("date").primaryKey(),
  totalSummariesGenerated: integer("total_summaries_generated"),
  totalAiTokensUsed: integer("total_ai_tokens_used"),
  totalApiCalls: jsonb("total_api_calls").$type<any>(),
  averageProcessingTime: integer("average_processing_time"),
  errorCount: integer("error_count"),
});

// Chatbot-related tables
export const chatbots = pgTable("chatbots", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  platform: text("platform").default("web"),
  status: text("status").default("active"), // active, inactive, processing
  knowledge: text("knowledge"), // The AI knowledge base
  deploymentUrl: text("deployment_url"),
  users: integer("users").default(0),
  messages: integer("messages").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  chatbotId: integer("chatbot_id").references(() => chatbots.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  sessionId: text("session_id").notNull().unique(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  lastActivity: timestamp("last_activity").defaultNow(),
  messageCount: integer("message_count").default(0),
  isActive: boolean("is_active").default(true),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => chatSessions.id).notNull(),
  role: text("role").notNull(), // user, bot
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  tokensUsed: integer("tokens_used"),
  processingTime: integer("processing_time"), // in milliseconds
  hasError: boolean("has_error").default(false),
  errorMessage: text("error_message"),
});

export const chatbotFiles = pgTable("chatbot_files", {
  id: serial("id").primaryKey(),
  chatbotId: integer("chatbot_id").references(() => chatbots.id).notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(), // pdf, docx, txt, md
  fileSize: integer("file_size").notNull(),
  extractedContent: text("extracted_content"),
  uploadDate: timestamp("upload_date").defaultNow().notNull(),
  processingStatus: text("processing_status").default("pending"), // pending, completed, failed
  errorMessage: text("error_message"),
});

// User schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  firebaseUid: true,
  plan: true,
});

// Portfolio schemas
export const insertPortfolioSchema = createInsertSchema(portfolios).pick({
  userId: true,
  walletAddress: true,
  chainId: true,
  totalValue: true,
  totalChange: true,
  assetsCount: true,
  ethBalance: true,
});

export const insertPortfolioAssetSchema = createInsertSchema(portfolioAssets).pick({
  portfolioId: true,
  symbol: true,
  name: true,
  amount: true,
  value: true,
  percentage: true,
  change: true,
  contractAddress: true,
  isNative: true,
});

export const insertAiAnalysisSchema = createInsertSchema(aiAnalyses).pick({
  portfolioId: true,
  overallScore: true,
  riskLevel: true,
  diversification: true,
  recommendation: true,
  portfolioHealth: true,
  keyInsights: true,
  rebalanceActions: true,
  riskFactors: true,
  opportunities: true,
  dataSource: true,
  hasError: true,
  errorMessage: true,
});

// Chatbot schemas
export const insertChatbotSchema = createInsertSchema(chatbots).pick({
  userId: true,
  name: true,
  description: true,
  platform: true,
  status: true,
  knowledge: true,
  deploymentUrl: true,
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).pick({
  chatbotId: true,
  userId: true,
  sessionId: true,
  messageCount: true,
  isActive: true,
  lastActivity: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  sessionId: true,
  role: true,
  content: true,
  tokensUsed: true,
  processingTime: true,
  hasError: true,
  errorMessage: true,
});

export const insertChatbotFileSchema = createInsertSchema(chatbotFiles).pick({
  chatbotId: true,
  fileName: true,
  fileType: true,
  fileSize: true,
  extractedContent: true,
  processingStatus: true,
  errorMessage: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;
export type Portfolio = typeof portfolios.$inferSelect;

export type InsertPortfolioAsset = z.infer<typeof insertPortfolioAssetSchema>;
export type PortfolioAsset = typeof portfolioAssets.$inferSelect;

export type InsertAiAnalysis = z.infer<typeof insertAiAnalysisSchema>;
export type AiAnalysis = typeof aiAnalyses.$inferSelect;

export type InsertChatbot = z.infer<typeof insertChatbotSchema>;
export type Chatbot = typeof chatbots.$inferSelect;

export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

export type InsertChatbotFile = z.infer<typeof insertChatbotFileSchema>;
export type ChatbotFile = typeof chatbotFiles.$inferSelect;
