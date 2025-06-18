import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Upload, Link, MessageSquare, Settings, Lock, RefreshCw, Trash2, Play, Pause } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ChatbotBuilder() {
  // Mock user data - replace with actual auth
  const userData = { plan: "starter" }; // or "pro"
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [botName, setBotName] = useState("");
  const [description, setDescription] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [dataSource, setDataSource] = useState("upload");
  const [chatMode, setChatMode] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [processingBot, setProcessingBot] = useState(null);

  const isFreeTier = !userData?.plan || userData?.plan === "starter";

  // Mock chatbots data with enhanced functionality
  const [userBots, setUserBots] = useState([
    {
      id: 1,
      name: "Bitcoin News Bot",
      platform: "Telegram",
      status: "active",
      users: 245,
      messages: 1234,
      lastUpdated: "2 hours ago",
      knowledge: "Trained on Bitcoin whitepaper and latest market analysis",
      deploymentUrl: "https://t.me/bitcoin_news_ai_bot"
    },
    {
      id: 2,
      name: "DeFi Insights Bot",
      platform: "Discord",
      status: "inactive",
      users: 89,
      messages: 567,
      lastUpdated: "1 day ago",
      knowledge: "Trained on DeFi protocols documentation",
      deploymentUrl: null
    }
  ]);

  // Gemini API integration
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  const analyzeContent = async (content, contentType = "text") => {
    try {
      const prompt = `
        Analyze the following ${contentType} content and create a comprehensive knowledge base summary for an AI chatbot:
        
        Content: ${content}
        
        Please provide:
        1. A concise summary of the main topics
        2. Key concepts and terminology
        3. Important facts and figures
        4. Potential FAQ topics
        5. Context for answering user questions
        
        Format your response as a structured knowledge base that can be used to train a chatbot.
      `;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error analyzing content:', error);
      throw new Error('Failed to analyze content with Gemini AI');
    }
  };

  const generateBotResponse = async (userMessage, botKnowledge) => {
    try {
      const prompt = `
        You are an AI chatbot with the following knowledge base:
        ${botKnowledge}
        
        User question: ${userMessage}
        
        Please provide a helpful, accurate response based on your knowledge. If the question is outside your knowledge base, politely explain that you can only answer questions related to your trained content.
      `;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error generating bot response:', error);
      return "I'm sorry, I'm having trouble processing your request right now. Please try again later.";
    }
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const extractTextFromFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        // For demo purposes, we'll just read text files directly
        // In production, you'd need PDF parsing libraries for PDFs, etc.
        if (file.type === 'text/plain') {
          resolve(e.target.result);
        } else {
          // Mock extraction for other file types
          resolve(`Content extracted from ${file.name}: This is sample content for demonstration.`);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const fetchUrlContent = async (url) => {
    // In production, you'd use a backend service to fetch and parse webpage content
    // For demo, we'll simulate this
    return `Content from ${url}: This is sample webpage content for demonstration.`;
  };

  const handleCreateBot = async (e) => {
    e.preventDefault();
    
    if (isFreeTier && userBots.length >= 1) {
      alert("Free tier allows only 1 bot. Upgrade to Pro for unlimited bots.");
      return;
    }

    if (!botName.trim()) {
      alert("Please enter a bot name");
      return;
    }

    setLoading(true);
    setProcessingBot(botName);

    try {
      let content = "";
      
      if (dataSource === "upload" && uploadedFiles.length > 0) {
        // Extract content from uploaded files
        const fileContents = await Promise.all(
          uploadedFiles.map(file => extractTextFromFile(file))
        );
        content = fileContents.join("\n\n");
      } else if (dataSource === "url" && sourceUrl.trim()) {
        // Fetch content from URL
        content = await fetchUrlContent(sourceUrl);
      } else {
        alert("Please provide training data (files or URL)");
        setLoading(false);
        setProcessingBot(null);
        return;
      }

      // Analyze content with Gemini
      const knowledgeBase = await analyzeContent(content);

      // Create new bot
      const newBot = {
        id: Date.now(),
        name: botName,
        platform: selectedPlatform || "Web Chat",
        status: "processing",
        users: 0,
        messages: 0,
        lastUpdated: "Just now",
        knowledge: knowledgeBase,
        deploymentUrl: null,
        description: description
      };

      // Simulate bot processing
      setUserBots(prev => [...prev, newBot]);
      
      // Simulate deployment process
      setTimeout(() => {
        setUserBots(prev => 
          prev.map(bot => 
            bot.id === newBot.id 
              ? { ...bot, status: "active", deploymentUrl: selectedPlatform ? `https://bot-deploy-${bot.id}.example.com` : null }
              : bot
          )
        );
        setProcessingBot(null);
        alert(`Bot "${botName}" created successfully!`);
      }, 3000);

      // Reset form
      setBotName("");
      setDescription("");
      setSourceUrl("");
      setUploadedFiles([]);
      setSelectedPlatform("");
      
    } catch (error) {
      console.error('Error creating bot:', error);
      alert("Failed to create bot. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTestChat = (bot) => {
    setChatMode(bot);
    setChatMessages([
      { role: "bot", content: `Hello! I'm ${bot.name}. I can help answer questions about ${bot.description || "the topics I was trained on"}. What would you like to know?` }
    ]);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !chatMode) return;

    const userMessage = chatInput.trim();
    setChatMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setChatInput("");

    // Generate bot response
    const botResponse = await generateBotResponse(userMessage, chatMode.knowledge);
    setChatMessages(prev => [...prev, { role: "bot", content: botResponse }]);
  };

  const toggleBotStatus = (botId) => {
    setUserBots(prev => 
      prev.map(bot => 
        bot.id === botId 
          ? { ...bot, status: bot.status === "active" ? "inactive" : "active" }
          : bot
      )
    );
  };

  const deleteBot = (botId) => {
    if (confirm("Are you sure you want to delete this bot?")) {
      setUserBots(prev => prev.filter(bot => bot.id !== botId));
    }
  };

  if (chatMode) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Testing: {chatMode.name}</h2>
            <p className="text-slate-600 dark:text-slate-400">Chat with your AI bot</p>
          </div>
          <Button onClick={() => setChatMode(null)} variant="outline">
            Back to Bots
          </Button>
        </div>

        <Card className="h-96 flex flex-col">
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {chatMessages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.role === "user" 
                    ? "bg-blue-500 text-white" 
                    : "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t p-4 flex space-x-2">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type your message..."
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1"
            />
            <Button onClick={handleSendMessage}>Send</Button>
          </div>
        </Card>
      </div>
    );
  }

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

      {processingBot && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-blue-800 dark:text-blue-200 font-medium">
              Processing "{processingBot}" with Gemini AI... This may take a few minutes.
            </span>
          </div>
        </div>
      )}

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
              <div className="space-y-6">
                <div>
                  <Label htmlFor="botName" className="text-slate-700 dark:text-slate-300">Bot Name</Label>
                  <Input
                    id="botName"
                    value={botName}
                    onChange={(e) => setBotName(e.target.value)}
                    placeholder="e.g., Solana Protocol Assistant"
                    className="bg-white dark:bg-slate-800 text-black dark:text-white border-slate-300 dark:border-slate-600"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-slate-700 dark:text-slate-300">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what your bot will help users with..."
                    className="bg-white dark:bg-slate-800 text-black dark:text-white border-slate-300 dark:border-slate-600"
                    rows={3}
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-slate-700 dark:text-slate-300">Training Data Source</Label>
                  
                  <Tabs value={dataSource} onValueChange={setDataSource}>
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
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.docx,.txt,.md"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="fileUpload"
                        />
                        <Button type="button" variant="outline" onClick={() => document.getElementById('fileUpload').click()}>
                          <Upload className="mr-2 h-4 w-4" />
                          Choose Files
                        </Button>
                        <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                          Supports PDF, DOCX, TXT files up to 10MB each
                        </p>
                      </div>
                      
                      {uploadedFiles.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-slate-700 dark:text-slate-300">Uploaded Files:</Label>
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-800 rounded">
                              <span className="text-sm">{file.name}</span>
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(index)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="url" className="space-y-4">
                      <div>
                        <Label htmlFor="sourceUrl" className="text-slate-700 dark:text-slate-300">Documentation URL</Label>
                        <Input
                          id="sourceUrl"
                          value={sourceUrl}
                          onChange={(e) => setSourceUrl(e.target.value)}
                          placeholder="https://docs.project.com"
                          className="bg-white dark:bg-slate-800 text-black dark:text-white border-slate-300 dark:border-slate-600"
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                {!isFreeTier && (
                  <div>
                    <Label className="text-slate-700 dark:text-slate-300">Deployment Platform (Optional)</Label>
                    <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select platform or leave empty for web chat only" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="telegram">Telegram</SelectItem>
                        <SelectItem value="discord">Discord</SelectItem>
                        <SelectItem value="web">Web Chat Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button type="button" onClick={handleCreateBot} disabled={loading} className="w-full">
                  {loading ? "Creating Bot with AI..." : "Create AI Chatbot"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage">
          <Card className="bg-white/90 dark:bg-surface/50 backdrop-blur-xl border-slate-200 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-slate-900 dark:text-white">Your Bots</CardTitle>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
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
                              variant={bot.status === "active" ? "default" : bot.status === "processing" ? "secondary" : "outline"}
                            >
                              {bot.status}
                            </Badge>
                          </div>
                          {bot.description && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{bot.description}</p>
                          )}
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
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleTestChat(bot)}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Test Chat
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => toggleBotStatus(bot.id)}
                        disabled={bot.status === "processing"}
                      >
                        {bot.status === "active" ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                        {bot.status === "active" ? "Pause" : "Activate"}
                      </Button>
                      {bot.deploymentUrl && (
                        <Button variant="outline" size="sm" onClick={() => window.open(bot.deploymentUrl, '_blank')}>
                          <Link className="mr-2 h-4 w-4" />
                          Open Bot
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => deleteBot(bot.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
                
                {userBots.length === 0 && (
                  <div className="text-center py-12">
                    <Bot className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No bots yet</h3>
                    <p className="text-slate-600 dark:text-slate-400">Create your first AI chatbot to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}