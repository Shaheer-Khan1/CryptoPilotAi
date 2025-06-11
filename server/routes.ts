import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import Stripe from "stripe";

let stripe: Stripe | null = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
  });
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

  // Create or get subscription
  app.post('/api/create-subscription', async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe not configured. Please add STRIPE_SECRET_KEY." });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.replace("Bearer ", "");
    let firebaseUid;
    
    try {
      // Try to parse JWT token
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      firebaseUid = payload.user_id || payload.sub;
    } catch (error) {
      // Fallback to using token as UID directly
      firebaseUid = token;
    }

    if (!firebaseUid) {
      return res.status(401).json({ message: "Invalid token" });
    }

    try {
      let user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { planType } = req.body;

      // If user already has a subscription, retrieve it
      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        const invoice = await stripe.invoices.retrieve(subscription.latest_invoice as string, {
          expand: ['payment_intent']
        });

        return res.json({
          subscriptionId: subscription.id,
          clientSecret: (invoice.payment_intent as any)?.client_secret,
        });
      }

      // Create Stripe customer if doesn't exist
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.username,
        });
        customerId = customer.id;
      }

      // Create or get price based on plan
      let priceId;
      
      if (planType === 'basic') {
        const product = await stripe.products.create({
          name: 'CryptoPilot AI Basic',
          description: 'Essential cryptocurrency analysis features',
        });
        
        const price = await stripe.prices.create({
          unit_amount: 2900, // $29.00
          currency: 'usd',
          recurring: { interval: 'month' },
          product: product.id,
        });
        priceId = price.id;
        
      } else if (planType === 'professional') {
        const product = await stripe.products.create({
          name: 'CryptoPilot AI Professional',
          description: 'Advanced AI analysis and trading insights',
        });
        
        const price = await stripe.prices.create({
          unit_amount: 7900, // $79.00
          currency: 'usd',
          recurring: { interval: 'month' },
          product: product.id,
        });
        priceId = price.id;
        
      } else if (planType === 'enterprise') {
        const product = await stripe.products.create({
          name: 'CryptoPilot AI Enterprise',
          description: 'Complete suite with unlimited features and priority support',
        });
        
        const price = await stripe.prices.create({
          unit_amount: 19900, // $199.00
          currency: 'usd',
          recurring: { interval: 'month' },
          product: product.id,
        });
        priceId = price.id;
        
      } else {
        return res.status(400).json({ message: "Invalid plan type. Must be basic, professional, or enterprise." });
      }

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price: priceId,
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      // Update user with Stripe info
      user = await storage.updateUserStripeInfo(user.id, customerId, subscription.id);
      await storage.updateUserPlan(user.id, planType);

      const invoice = subscription.latest_invoice as any;
      res.json({
        subscriptionId: subscription.id,
        clientSecret: invoice.payment_intent.client_secret,
      });
    } catch (error: any) {
      res.status(400).json({ message: "Error creating subscription: " + error.message });
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
