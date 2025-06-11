import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import Stripe from "stripe";

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

  const httpServer = createServer(app);
  return httpServer;
}
