import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Wallet,
  Brain,
  Bot,
  CreditCard,
  Settings,
  Video,
  Shield,
  Star,
} from "lucide-react";

const sidebarItems = [
  { name: "Overview", href: "/", icon: BarChart3 },
  { name: "Portfolio", href: "/portfolio", icon: Wallet },
  { name: "Market Summary", href: "/analysis", icon: Brain },
  { name: "Trading Signals", href: "/signals", icon: Star },
  { name: "Chatbot Builder", href: "/chatbot-builder", icon: Bot },
  { name: "Shorts Only", href: "/shorts-generator", icon: Video },
  { name: "Admin Panel", href: "/admin", icon: Shield },
  { name: "Billing", href: "/billing", icon: CreditCard },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  onNavigate: (href: string) => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-surface/50 backdrop-blur-xl border-r border-slate-700 min-h-screen">
      <div className="p-6">
        <div className="space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Button
                key={item.name}
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive && "bg-primary text-primary-foreground"
                )}
                onClick={() => onNavigate(item.href)}
              >
                <Icon className="mr-3 h-4 w-4" />
                {item.name}
              </Button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
