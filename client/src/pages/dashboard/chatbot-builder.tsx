import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Bot, Upload, Link, MessageSquare, Settings, Lock, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ChatbotBuilder() {
  const { userData } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");

  const isFreeTier = !userData?.plan || userData?.plan === "starter";

  // Mock chatbots data
  const userBots = [
    {
      id: 1,
      name: "Bitcoin News Bot",
      platform: "Telegram",
      status: "active",
      users: 245,
      messages: 1234,
      lastUpdated: "2 hours ago"
    },
    {
      id: 2,
      name: "DeFi Insights Bot",
      platform: "Discord",
      status: "inactive",
      users: 89,
      messages: 567,
      lastUpdated: "1 day ago"
    }
  ];

  const handleCreateBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFreeTier && userBots.length >= 1) {
      toast({
        title: "Upgrade Required",
        description: "Free tier allows only 1 bot. Upgrade to Pro for unlimited bots.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    // Simulate bot creation
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Bot Created",
        description: "Your AI chatbot is being processed. You'll be notified when ready.",
      });
    }, 2000);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Project Chatbot Builder</h1>
        <p className="text-slate-600 dark:text-slate-400">Create AI-powered chatbots from project documentation</p>
        {isFreeTier && (
          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-amber-600" />
              <span className="text-amber-800 dark:text-amber-200 font-medium">
                Free Tier: Limited to 1 bot. Upgrade to Pro for unlimited bots and deployment.
              </span>
            </div>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Create New Bot</TabsTrigger>
          <TabsTrigger value="manage">My Bots ({userBots.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card className="bg-white/90 dark:bg-surface/50 backdrop-blur-xl border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white">Create AI Chatbot</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateBot} className="space-y-6">
                <div>
                  <Label htmlFor="botName" className="text-slate-700 dark:text-slate-300">Bot Name</Label>
                  <Input
                    id="botName"
                    placeholder="e.g., Solana Protocol Assistant"
                    className="bg-white dark:bg-slate-800 text-black dark:text-white border-slate-300 dark:border-slate-600"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-slate-700 dark:text-slate-300">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what your bot will help users with..."
                    className="bg-white dark:bg-slate-800 text-black dark:text-white border-slate-300 dark:border-slate-600"
                    rows={3}
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-slate-700 dark:text-slate-300">Training Data Source</Label>
                  
                  <Tabs defaultValue="upload">
                    <TabsList>
                      <TabsTrigger value="upload">Upload Files</TabsTrigger>
                      <TabsTrigger value="url">Website/Docs URL</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="upload" className="space-y-4">
                      <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center">
                        <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                        <p className="text-slate-600 dark:text-slate-400 mb-4">
                          Upload whitepapers, documentation, or text files
                        </p>
                        <Button type="button" variant="outline">
                          <Upload className="mr-2 h-4 w-4" />
                          Choose Files
                        </Button>
                        <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                          Supports PDF, DOCX, TXT files up to 10MB each
                        </p>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="url" className="space-y-4">
                      <div>
                        <Label htmlFor="sourceUrl" className="text-slate-700 dark:text-slate-300">Documentation URL</Label>
                        <Input
                          id="sourceUrl"
                          placeholder="https://docs.project.com"
                          className="bg-white dark:bg-slate-800 text-black dark:text-white border-slate-300 dark:border-slate-600"
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                {!isFreeTier && (
                  <div>
                    <Label className="text-slate-700 dark:text-slate-300">Deployment Platform</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <Button type="button" variant="outline" className="h-16">
                        <MessageSquare className="mr-2 h-5 w-5" />
                        Telegram
                      </Button>
                      <Button type="button" variant="outline" className="h-16">
                        <MessageSquare className="mr-2 h-5 w-5" />
                        Discord
                      </Button>
                    </div>
                  </div>
                )}

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Creating Bot..." : "Create AI Chatbot"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage">
          <Card className="bg-white/90 dark:bg-surface/50 backdrop-blur-xl border-slate-200 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-slate-900 dark:text-white">Your Bots</CardTitle>
              <Button variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {userBots.map((bot) => (
                  <div key={bot.id} className="p-6 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                          <Bot className="text-primary h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{bot.name}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline">{bot.platform}</Badge>
                            <Badge 
                              variant={bot.status === "active" ? "default" : "secondary"}
                            >
                              {bot.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {bot.users} users
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {bot.messages} messages
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                          Updated {bot.lastUpdated}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <Button variant="outline" size="sm">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Test Chat
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}