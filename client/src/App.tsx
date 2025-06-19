import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./lib/auth";
import { ProtectedRoute } from "./components/auth/protected-route";
import { RedirectIfAuthenticated } from "./components/auth/redirect-if-authenticated";
import { Navbar } from "./components/layout/navbar";
import { Sidebar } from "./components/layout/sidebar";
import { DashboardHeader } from "./components/layout/dashboard-header";
import { DashboardFooter } from "./components/layout/dashboard-footer";

// Pages
import Landing from "@/pages/landing";
import Features from "@/pages/features";
import Pricing from "@/pages/pricing";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import Subscribe from "@/pages/subscribe";
import DashboardOverview from "@/pages/dashboard/overview";
import Portfolio from "@/pages/dashboard/portfolio";
import Analysis from "@/pages/dashboard/analysis";
import ChatbotBuilder from "@/pages/dashboard/chatbot-builder";
import ShortsGenerator from "@/pages/dashboard/shorts-generator";
import Admin from "@/pages/dashboard/admin";
import Billing from "@/pages/dashboard/billing";
import Settings from "@/pages/dashboard/settings";
import NotFound from "@/pages/not-found";
import Signals from "@/pages/dashboard/signals";
import YouTubeCallback from "@/pages/auth/YouTubeCallback";

function DashboardLayout() {
  const [, setLocation] = useLocation();

  return (
    <div className="flex h-screen">
      <Sidebar onNavigate={setLocation} />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-8 overflow-auto">
          <Switch>
            <Route path="/portfolio" component={Portfolio} />
            <Route path="/analysis" component={Analysis} />
            <Route path="/signals" component={Signals} />
            <Route path="/chatbot-builder" component={ChatbotBuilder} />
            <Route path="/shorts-generator" component={ShortsGenerator} />
            <Route path="/admin" component={Admin} />
            <Route path="/billing" component={Billing} />
            <Route path="/settings" component={Settings} />
            <Route path="/" component={DashboardOverview} />
            <Route component={DashboardOverview} />
          </Switch>
        </main>
        <DashboardFooter />
      </div>
    </div>
  );
}

function Router() {
  const [location] = useLocation();
  const isDashboard = location.startsWith("/dashboard");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!isDashboard && <Navbar />}
      
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/features" component={Features} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/login">
          <RedirectIfAuthenticated>
            <Login />
          </RedirectIfAuthenticated>
        </Route>
        <Route path="/register">
          <RedirectIfAuthenticated>
            <Register />
          </RedirectIfAuthenticated>
        </Route>
        <Route path="/subscribe">
          <ProtectedRoute>
            <Subscribe />
          </ProtectedRoute>
        </Route>
        <Route path="/auth/youtube/callback" component={YouTubeCallback} />
        <Route path="/dashboard" nest>
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
