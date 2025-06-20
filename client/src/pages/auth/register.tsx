import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

// Initialize Stripe
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

const PaymentForm = ({ 
  planType, 
  setupIntentId, 
  onSuccess 
}: { 
  planType: string; 
  setupIntentId: string;
  onSuccess: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!stripe || !elements) {
      setLoading(false);
      return;
    }

    try {
      // Confirm the setup intent
      const { error: setupError } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/register?step=account&plan=${planType}`,
        },
      });

      if (setupError) {
        throw new Error(setupError.message);
      }

      toast({
        title: "Payment Successful!",
        description: "Your payment method has been saved. Please complete your account registration.",
        variant: "default",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button type="submit" disabled={!stripe || loading} className="w-full">
        {loading ? "Processing..." : `Continue to Create Account`}
      </Button>
    </form>
  );
};

export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    plan: "starter"
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'payment' | 'account'>('payment');
  const [clientSecret, setClientSecret] = useState("");
  const [setupIntentId, setSetupIntentId] = useState("");
  const { register } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Extract plan from URL query parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const planParam = urlParams.get("plan");
    const stepParam = urlParams.get("step");
    
    if (planParam) {
      setFormData(prev => ({ ...prev, plan: planParam }));
    }
    if (stepParam === 'account') {
      setStep('account');
    }
  }, []);

  // Create setup intent for payment
  useEffect(() => {
    if (step === 'payment' && formData.plan !== 'starter') {
      const createSetupIntent = async () => {
        try {
          const response = await fetch("/api/create-setup-intent", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ planType: formData.plan }),
          });

          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.message);
          }

          setClientSecret(data.clientSecret);
          setSetupIntentId(data.setupIntentId);
        } catch (error: any) {
          toast({
            title: "Error",
            description: error.message || "Failed to setup payment",
            variant: "destructive",
          });
        }
      };

      createSetupIntent();
    }
  }, [step, formData.plan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await register(formData.email, formData.password, formData.username, formData.plan);
      
      toast({
        title: "Account created!",
        description: "Welcome to CryptoPilot AI. Your account has been created successfully.",
      });

      setLocation("/dashboard");
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const planDetails = {
    starter: { name: "Starter", price: "Free" },
    pro: { name: "Pro", price: "$29/month" },
    enterprise: { name: "Enterprise", price: "$99/month" }
  };

  const currentPlan = planDetails[formData.plan as keyof typeof planDetails] || planDetails.starter;

  if (step === 'payment' && formData.plan !== 'starter') {
    return (
      <div className="min-h-screen flex items-center justify-center py-12">
        <div className="max-w-md w-full space-y-8 p-8">
          <Card className="bg-surface/50 backdrop-blur-xl border-slate-700">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">Complete Your Payment</CardTitle>
              <p className="text-muted-foreground mt-2">
                {currentPlan.name} Plan - {currentPlan.price}
              </p>
            </CardHeader>
            
            <CardContent>
              {!stripePromise || !clientSecret ? (
                <div className="text-center p-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-muted-foreground">Setting up payment...</p>
                </div>
              ) : (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <PaymentForm 
                    planType={formData.plan} 
                    setupIntentId={setupIntentId}
                    onSuccess={() => setStep('account')}
                  />
                </Elements>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12">
      <div className="max-w-md w-full space-y-8 p-8">
        <Card className="bg-surface/50 backdrop-blur-xl border-slate-700">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Create Your Account</CardTitle>
            <p className="text-muted-foreground mt-2">
              {currentPlan.name} Plan - {currentPlan.price}
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="username" className="text-sm font-medium text-muted-foreground">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  required
                  className="mt-2 bg-white dark:bg-slate-800 text-black dark:text-white border-slate-300 dark:border-slate-600 focus:border-primary"
                />
              </div>
              
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className="mt-2 bg-white dark:bg-slate-800 text-black dark:text-white border-slate-300 dark:border-slate-600 focus:border-primary"
                />
              </div>
              
              <div>
                <Label htmlFor="password" className="text-sm font-medium text-muted-foreground">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  className="mt-2 bg-white dark:bg-slate-800 text-black dark:text-white border-slate-300 dark:border-slate-600 focus:border-primary"
                />
              </div>
              
              <Button type="submit" disabled={loading} className="w-full py-3 font-semibold">
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
