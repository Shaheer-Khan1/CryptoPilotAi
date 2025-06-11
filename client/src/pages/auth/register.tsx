import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    plan: "starter"
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Extract plan from URL query parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const planParam = urlParams.get("plan");
    if (planParam) {
      setFormData(prev => ({ ...prev, plan: planParam }));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await register(formData.email, formData.password, formData.username, formData.plan);
      
      if (formData.plan !== "starter") {
        setLocation(`/subscribe?plan=${formData.plan}`);
      } else {
        setLocation("/dashboard");
      }
      
      toast({
        title: "Account created!",
        description: "Welcome to CryptoPilot AI. Your account has been created successfully.",
      });
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

  return (
    <div className="min-h-screen flex items-center justify-center py-12">
      <div className="max-w-md w-full space-y-8 p-8">
        <Card className="bg-surface/50 backdrop-blur-xl border-slate-700">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Create Account</CardTitle>
            <p className="text-muted-foreground mt-2">Start your AI trading journey</p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="username" className="text-sm font-medium text-muted-foreground">
                  Full Name
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
              
              <div>
                <Label htmlFor="plan" className="text-sm font-medium text-muted-foreground">
                  Select Plan
                </Label>
                <Select value={formData.plan} onValueChange={(value) => setFormData(prev => ({ ...prev, plan: value }))}>
                  <SelectTrigger className="mt-2 bg-white dark:bg-slate-800 text-black dark:text-white border-slate-300 dark:border-slate-600 focus:border-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter (Free)</SelectItem>
                    <SelectItem value="pro">Pro ($29/month)</SelectItem>
                    <SelectItem value="enterprise">Enterprise ($99/month)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button type="submit" disabled={loading} className="w-full py-3 font-semibold">
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login">
                  <span className="text-primary hover:text-blue-400 cursor-pointer">
                    Sign in
                  </span>
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
