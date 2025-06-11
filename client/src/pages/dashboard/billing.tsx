import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CreditCard, Edit } from "lucide-react";

export default function Billing() {
  const { userData, currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleCancelSubscription = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const token = await currentUser.getIdToken();
      await apiRequest("POST", "/api/cancel-subscription", {}, {
        Authorization: `Bearer ${token}`,
      });
      
      toast({
        title: "Subscription Canceled",
        description: "Your subscription has been canceled successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Mock billing data
  const billingInfo = {
    nextBillingDate: "January 15, 2024",
    amount: userData?.plan === "pro" ? "$29.00/month" : "$99.00/month",
    paymentMethod: {
      type: "Visa",
      last4: "4242",
      expiry: "12/25"
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
        <p className="text-muted-foreground">Manage your subscription and payment methods</p>
      </div>

      {/* Current Plan */}
      <Card className="bg-white/90 dark:bg-surface/50 backdrop-blur-xl border-slate-200 dark:border-slate-700 mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-900 dark:text-white">Current Plan</CardTitle>
            <Badge className="bg-primary">
              {userData?.plan?.charAt(0).toUpperCase() + userData?.plan?.slice(1) || "Starter"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-slate-600 dark:text-slate-400 mb-2">Next billing date</p>
              <p className="font-semibold text-slate-900 dark:text-white">{billingInfo.nextBillingDate}</p>
            </div>
            <div>
              <p className="text-slate-600 dark:text-slate-400 mb-2">Amount</p>
              <p className="font-semibold text-slate-900 dark:text-white">{billingInfo.amount}</p>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <Button>Upgrade Plan</Button>
            <Button 
              variant="outline" 
              onClick={handleCancelSubscription}
              disabled={loading}
            >
              {loading ? "Canceling..." : "Cancel Subscription"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card className="bg-white/90 dark:bg-surface/50 backdrop-blur-xl border-slate-200 dark:border-slate-700 mb-8">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-white">Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <CreditCard className="h-8 w-8 text-blue-500" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">**** **** **** {billingInfo.paymentMethod.last4}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {billingInfo.paymentMethod.type} expires {billingInfo.paymentMethod.expiry}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <Button variant="outline">Add Payment Method</Button>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card className="bg-white/90 dark:bg-surface/50 backdrop-blur-xl border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-white">Billing History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Mock billing history */}
            {[
              { date: "Dec 15, 2023", amount: "$29.00", status: "Paid" },
              { date: "Nov 15, 2023", amount: "$29.00", status: "Paid" },
              { date: "Oct 15, 2023", amount: "$29.00", status: "Paid" },
            ].map((invoice, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">{invoice.date}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Monthly subscription</div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="font-semibold text-slate-900 dark:text-white">{invoice.amount}</span>
                  <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-600 dark:border-green-400">
                    {invoice.status}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
