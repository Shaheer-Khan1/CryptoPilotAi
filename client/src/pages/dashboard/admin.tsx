import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Activity, 
  AlertTriangle, 
  Download, 
  Edit, 
  Ban, 
  CheckCircle,
  Clock,
  DollarSign,
  Bot,
  FileText,
  Search,
  ChevronDown,
  ChevronUp,
  XCircle
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Admin() {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState("users");

  // Mock admin data
  const systemStats = {
    totalUsers: 1247,
    freeUsers: 982,
    proUsers: 265,
    totalRevenue: "$18,555",
    monthlyGrowth: "+12.4%",
    activeToday: 423,
    contentGenerated: 1850,
    apiCallsToday: 15420
  };

  const users = [
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      plan: "pro",
      status: "active",
      joined: "2024-01-15",
      lastActive: "2 hours ago",
      usage: {
        portfolioScans: 12,
        botDeployments: 3,
        shortsGenerated: 8
      }
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      plan: "starter",
      status: "active",
      joined: "2024-01-20",
      lastActive: "1 day ago",
      usage: {
        portfolioScans: 1,
        botDeployments: 0,
        shortsGenerated: 2
      }
    },
    {
      id: 3,
      name: "Bob Wilson",
      email: "bob@example.com",
      plan: "pro",
      status: "suspended",
      joined: "2024-01-10",
      lastActive: "5 days ago",
      usage: {
        portfolioScans: 45,
        botDeployments: 8,
        shortsGenerated: 15
      }
    }
  ];

  const contentLogs = [
    {
      id: 1,
      type: "short",
      title: "Bitcoin Price Analysis",
      status: "published",
      generatedAt: "2 hours ago",
      views: "12.5K",
      engagement: "8.2%"
    },
    {
      id: 2,
      type: "bot",
      title: "Ethereum Protocol Bot",
      status: "deployed",
      generatedAt: "1 day ago",
      users: 245,
      messages: "1.2K"
    },
    {
      id: 3,
      type: "portfolio",
      title: "Portfolio Analysis Report",
      status: "generated",
      generatedAt: "3 hours ago",
      user: "John Doe",
      score: 85
    }
  ];

  const systemStatus = {
    apiHealth: "healthy",
    databaseStatus: "operational",
    lastBackup: "2 hours ago",
    activeUsers: 1234,
    contentGenerated: {
      today: 45,
      thisWeek: 234,
      thisMonth: 892
    },
    issues: [
      {
        id: 1,
        type: "warning",
        message: "High CPU usage on content generation server",
        timestamp: "1 hour ago"
      },
      {
        id: 2,
        type: "error",
        message: "Failed to process 3 video uploads",
        timestamp: "3 hours ago"
      }
    ]
  };

  const handleUserAction = (action: string, userId: number) => {
    toast({
      title: "Action Completed",
      description: `User ${action} successfully.`,
    });
  };

  const handleExportData = () => {
    toast({
      title: "Export Started",
      description: "User data export will be emailed to you shortly.",
    });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-slate-600 dark:text-slate-400">Manage users, content, and system health</p>
      </div>

      {/* System Overview */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white/90 dark:bg-surface/50 backdrop-blur-xl border-slate-200 dark:border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Users</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{systemStats.totalUsers}</div>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <div className="text-sm text-green-600 dark:text-green-400 mt-2">
              {systemStats.monthlyGrowth} this month
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 dark:bg-surface/50 backdrop-blur-xl border-slate-200 dark:border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Revenue</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{systemStats.totalRevenue}</div>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              {systemStats.proUsers} Pro subscribers
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 dark:bg-surface/50 backdrop-blur-xl border-slate-200 dark:border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Active Today</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{systemStats.activeToday}</div>
              </div>
              <Activity className="h-8 w-8 text-orange-500" />
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              {((systemStats.activeToday / systemStats.totalUsers) * 100).toFixed(1)}% of total
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 dark:bg-surface/50 backdrop-blur-xl border-slate-200 dark:border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Content Generated</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{systemStats.contentGenerated}</div>
              </div>
              <Bot className="h-8 w-8 text-purple-500" />
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              {systemStats.apiCallsToday} API calls today
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">
            <Users className="mr-2 h-4 w-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="content">
            <FileText className="mr-2 h-4 w-4" />
            Content Logs
          </TabsTrigger>
          <TabsTrigger value="system">
            <AlertTriangle className="mr-2 h-4 w-4" />
            System Health
          </TabsTrigger>
          <TabsTrigger value="reports">
            <Download className="mr-2 h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="bg-white/90 dark:bg-surface/50 backdrop-blur-xl border-slate-200 dark:border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-slate-900 dark:text-white">User Management</CardTitle>
                <div className="flex space-x-2">
                  <Input placeholder="Search users..." className="w-64 bg-white dark:bg-slate-800 text-black dark:text-white border-slate-300 dark:border-slate-600" />
                  <Button onClick={handleExportData} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-slate-700 dark:text-slate-300">User</TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">Plan</TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">Usage</TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">Revenue</TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">{user.name}</div>
                          <div className="text-sm text-slate-500 dark:text-slate-500">
                            {user.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.plan === "pro" ? "default" : "secondary"}>
                          {user.plan}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.status === "active" ? "default" : "destructive"}
                          className={user.status === "active" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : ""}
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          <div>Portfolio: {user.usage.portfolioScans}</div>
                          <div>Bots: {user.usage.botDeployments}</div>
                          <div>Shorts: {user.usage.shortsGenerated}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-slate-900 dark:text-white">
                        {user.lastActive}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleUserAction(user.status === "active" ? "suspended" : "activated", user.id)}
                          >
                            {user.status === "active" ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <Card className="bg-white/90 dark:bg-surface/50 backdrop-blur-xl border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white">Content Generation Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-slate-700 dark:text-slate-300">Type</TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">Title</TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">Generated</TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">Metrics</TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contentLogs.map((content) => (
                    <TableRow key={content.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {content.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-900 dark:text-white">{content.title}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            content.status === "published" || content.status === "deployed" 
                              ? "default" 
                              : "secondary"
                          }
                        >
                          {content.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{content.generatedAt}</TableCell>
                      <TableCell>
                        {content.type === "short" && (
                          <div className="text-sm">
                            <div>Views: {content.views}</div>
                            <div>Engagement: {content.engagement}</div>
                          </div>
                        )}
                        {content.type === "bot" && (
                          <div className="text-sm">
                            <div>Users: {content.users}</div>
                            <div>Messages: {content.messages}</div>
                          </div>
                        )}
                        {content.type === "portfolio" && (
                          <div className="text-sm">
                            <div>User: {content.user}</div>
                            <div>Score: {content.score}</div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-white/90 dark:bg-surface/50 backdrop-blur-xl border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">API Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">CoinGecko API</span>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Healthy
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Gemini AI</span>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Healthy
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Firebase</span>
                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                      <Clock className="mr-1 h-3 w-3" />
                      Slow
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Stripe</span>
                    <Badge variant="destructive">
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      Issue
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 dark:bg-surface/50 backdrop-blur-xl border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Recent Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-red-800 dark:text-red-300">Payment processing</span>
                      <span className="text-xs text-red-600 dark:text-red-400">2h ago</span>
                    </div>
                    <p className="text-xs text-red-700 dark:text-red-400">
                      Stripe webhook delays causing subscription issues
                    </p>
                  </div>
                  
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">High API usage</span>
                      <span className="text-xs text-yellow-600 dark:text-yellow-400">4h ago</span>
                    </div>
                    <p className="text-xs text-yellow-700 dark:text-yellow-400">
                      Gemini API approaching rate limits
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <Card className="bg-white/90 dark:bg-surface/50 backdrop-blur-xl border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white">Generate Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">User Activity Reports</h3>
                  <Button onClick={handleExportData} className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Export User Data (CSV)
                  </Button>
                  <Button onClick={handleExportData} variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Revenue Report (Excel)
                  </Button>
                  <Button onClick={handleExportData} variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Usage Analytics (PDF)
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Content Reports</h3>
                  <Button onClick={handleExportData} variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Generated Content Log
                  </Button>
                  <Button onClick={handleExportData} variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    API Usage Statistics
                  </Button>
                  <Button onClick={handleExportData} variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Performance Metrics
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}