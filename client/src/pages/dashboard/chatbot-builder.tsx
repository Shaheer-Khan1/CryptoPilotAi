import { useState, useEffect } from "react";
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Upload, Link, MessageSquare, Settings, Lock, RefreshCw, Trash2, Play, Pause, FileText, File } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "../../lib/auth";

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

type Bot = {
  id: number;
  name: string;
  platform: string;
  status: string;
  users: number;
  messages: number;
  lastUpdated: string;
  knowledge: string;
  deploymentUrl: string | null;
  description: string;
};

type ChatSession = {
  id: number;
  sessionId: string;
  chatbotId: number;
  userId: number;
  startedAt: string;
  lastActivity: string;
  messageCount: number;
  isActive: boolean;
};

// Define strict role constants
const ROLE_USER = "user" as const;
const ROLE_BOT = "bot" as const;

type ChatRole = typeof ROLE_USER | typeof ROLE_BOT;

type ChatMessage = {
  id: number;
  sessionId: number;
  role: ChatRole;
  content: string;
  timestamp: string;
  tokensUsed: number | null;
  processingTime: number | null;
  hasError: boolean;
  errorMessage: string | null;
};

// API functions
const API_BASE = import.meta.env.VITE_API_BASE || '';

const chatbotAPI = {
  async getChatbots(token: string): Promise<Bot[]> {
    const response = await fetch(`${API_BASE}/api/chatbots`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch chatbots');
    return response.json();
  },

  async createChatbot(token: string, data: any): Promise<any> {
    const response = await fetch(`${API_BASE}/api/chatbots`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create chatbot');
    return response.json();
  },

  async updateChatbot(token: string, chatbotId: number, data: any): Promise<any> {
    const response = await fetch(`${API_BASE}/api/chatbots/${chatbotId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update chatbot');
    return response.json();
  },

  async deleteChatbot(token: string, chatbotId: number): Promise<void> {
    const response = await fetch(`${API_BASE}/api/chatbots/${chatbotId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to delete chatbot');
  },

  async createChatSession(token: string, chatbotId: number): Promise<ChatSession> {
    const response = await fetch(`${API_BASE}/api/chatbots/${chatbotId}/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to create chat session');
    return response.json();
  },

  async getChatbotSessions(token: string, chatbotId: number): Promise<ChatSession[]> {
    const response = await fetch(`${API_BASE}/api/chatbots/${chatbotId}/sessions`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch chat sessions');
    return response.json();
  },

// Fixed sendMessage method - remove role normalization
async sendMessage(token: string, sessionId: number, content: string, role: ChatRole): Promise<ChatMessage> {
  const response = await fetch(`${API_BASE}/api/chat-sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content, role }),
  });
  if (!response.ok) throw new Error('Failed to send message');
  const message = await response.json();
  return message; // Return as-is, don't normalize the role
},

// Fixed getChatMessages method - remove role normalization
async getChatMessages(token: string, sessionId: number): Promise<ChatMessage[]> {
  const response = await fetch(`${API_BASE}/api/chat-sessions/${sessionId}/messages`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Failed to fetch chat messages');
  const messages = await response.json();
  
  // Return messages as-is, trust the backend data
  return messages;
}
};

export default function ChatbotBuilder() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [botName, setBotName] = useState("");
  const [description, setDescription] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [dataSource, setDataSource] = useState("upload");
  const [chatMode, setChatMode] = useState<Bot | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [processingBot, setProcessingBot] = useState<string | null>(null);
  const [processingFiles, setProcessingFiles] = useState(false);
  const [fileProcessingProgress, setFileProcessingProgress] = useState(0);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);

  const isFreeTier = !userData?.plan || userData?.plan === "starter";

  // Real chatbots data from API
  const [userBots, setUserBots] = useState<Bot[]>([]);

  // Gemini API integration
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  // Bypass: use test-user-id if not logged in
  const effectiveUserId = userData?.id?.toString() || 'test-user-id';

  // Load chatbots on component mount
  useEffect(() => {
    loadChatbots();
  }, [effectiveUserId]);

  const loadChatbots = async () => {
    try {
      setLoading(true);
      const chatbots = await chatbotAPI.getChatbots(effectiveUserId);
      setUserBots(chatbots);
    } catch (error) {
      console.error('Error loading chatbots:', error);
      alert('Failed to load chatbots');
    } finally {
      setLoading(false);
    }
  };

  // Parse PDF files using PDF.js
  const parsePDF = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        setFileProcessingProgress((i / pdf.numPages) * 100);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += `\n--- Page ${i} ---\n${pageText}\n`;
      }

      return fullText.trim();
    } catch (error) {
      console.error('Error parsing PDF:', error);
      throw new Error(`Failed to parse PDF file: ${file.name}`);
    }
  };

  // Parse DOCX files using Mammoth.js
  const parseDOCX = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } catch (error) {
      console.error('Error parsing DOCX:', error);
      throw new Error(`Failed to parse DOCX file: ${file.name}`);
    }
  };

  // Enhanced extractTextFromFile function with proper parsing
  const extractTextFromFile = async (file: File): Promise<string> => {
    try {
      if (file.type === 'application/pdf') {
        return await parsePDF(file);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return await parseDOCX(file);
      } else if (file.type === 'text/plain' || file.type === 'text/markdown') {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsText(file);
        });
      } else {
        throw new Error(`Unsupported file type: ${file.type}`);
      }
    } catch (error) {
      console.error('Error extracting text from file:', error);
      throw error;
    }
  };

  // Enhanced unrestricted bot prompt
  const generateUnrestrictedBotPrompt = (botKnowledge: string, botName: string, userMessage: string) => {
    return `You are ${botName}, an expert AI assistant with comprehensive knowledge about your trained subject matter.

CORE IDENTITY:
- You are an authoritative expert on the topics you were trained on
- You provide detailed, accurate, and comprehensive answers
- You never refuse to answer questions related to your knowledge domain
- You are direct, helpful, and thorough in your responses

KNOWLEDGE BASE:
${botKnowledge}

RESPONSE GUIDELINES:
1. ALWAYS answer questions that relate to your trained knowledge
2. Provide detailed explanations, examples, and context when relevant
3. If asked for specific data, numbers, or technical details - provide them
4. Share insights, analysis, and expert opinions on your subject matter
5. Break down complex topics into understandable explanations
6. Offer additional related information that might be valuable
7. Never say "I can't help with that" if it's within your knowledge domain

EXPANDED CAPABILITIES:
- Explain technical concepts in detail
- Provide step-by-step instructions
- Share historical context and background
- Offer comparisons and contrasts
- Discuss pros/cons and trade-offs
- Predict trends based on your knowledge
- Create examples and use cases
- Analyze data and patterns
- Provide implementation guidance

OUT OF SCOPE HANDLING:
Only if a question is completely unrelated to your trained knowledge, respond with:
"That question is outside my specialized knowledge area. I'm specifically trained on [briefly mention your domain]. Is there anything about [your domain] I can help you with instead?"

USER QUESTION: ${userMessage}

Remember: You are the definitive expert on your subject. Answer comprehensively and authoritatively. Never be overly cautious about sharing information within your knowledge domain.`;
  };

  // Enhanced content analysis prompt for better knowledge base creation
  const analyzeContentForBot = async (content: string, contentType = "text", botName = "AI Assistant") => {
    try {
      const prompt = `Create a comprehensive knowledge base for an AI chatbot named "${botName}" based on the following ${contentType} content.

CONTENT TO ANALYZE:
${content}

KNOWLEDGE BASE STRUCTURE REQUIRED:
1. **Core Concepts & Definitions**: Extract all key terms, concepts, and their detailed definitions
2. **Technical Details**: Include all technical specifications, numbers, processes, and procedures
3. **Historical Context**: Background information, timeline, development history
4. **Key Entities**: Important people, organizations, projects, or systems mentioned
5. **Processes & Procedures**: Step-by-step guides, methodologies, workflows
6. **Data & Statistics**: All numerical data, metrics, performance indicators
7. **Relationships & Dependencies**: How different concepts connect and depend on each other
8. **Use Cases & Applications**: Practical applications, examples, real-world scenarios
9. **Expert Insights**: Analysis, opinions, predictions, and expert commentary
10. **Common Questions**: Anticipate FAQ topics and their comprehensive answers

FORMATTING GUIDELINES:
- Organize information hierarchically
- Include specific details and examples
- Preserve important quotes and references
- Note relationships between concepts
- Include context for technical terms
- Provide comprehensive coverage of the subject matter

Create a knowledge base that enables the AI to be an authoritative expert on this subject, capable of answering detailed questions, providing analysis, and offering comprehensive guidance.`;

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
          }],
          generationConfig: {
            temperature: 0.3,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 4096,
          }
        })
      });

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error analyzing content:', error);
      throw new Error('Failed to analyze content with Gemini AI');
    }
  };

  // Updated generateBotResponse function with unrestricted prompt
  const generateBotResponse = async (userMessage: string, botKnowledge: string, botName = "AI Assistant") => {
    try {
      const prompt = generateUnrestrictedBotPrompt(botKnowledge, botName, userMessage);

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
          }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 2048,
          }
        })
      });

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error generating bot response:', error);
      return "I'm experiencing technical difficulties. Please try again in a moment.";
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const fetchUrlContent = async (url: string) => {
    return `Content from ${url}: This is sample webpage content for demonstration.`;
  };

  const handleCreateBot = async (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    if (isFreeTier && userBots.length >= 1) {
      alert("Free tier allows only 1 bot. Upgrade to Pro for unlimited bots.");
      return;
    }

    if (!botName.trim()) {
      alert("Please enter a bot name");
      return;
    }

    if (!effectiveUserId) {
      alert("Please log in to create a chatbot");
      return;
    }

    setLoading(true);
    setProcessingBot(botName);

    try {
      let content = "";
      
      if (dataSource === "upload" && uploadedFiles.length > 0) {
        setProcessingFiles(true);
        setFileProcessingProgress(0);
        
        // Extract content from uploaded files with proper parsing
        const fileContents = [];
        for (let i = 0; i < uploadedFiles.length; i++) {
          const file = uploadedFiles[i];
          try {
            const fileContent = await extractTextFromFile(file);
            fileContents.push(`=== ${file.name} ===\n${fileContent}\n`);
            setFileProcessingProgress(((i + 1) / uploadedFiles.length) * 100);
          } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
            alert(`Failed to process file: ${file.name}. ${error instanceof Error ? error.message : 'Unknown error'}`);
            setLoading(false);
            setProcessingBot(null);
            setProcessingFiles(false);
            return;
          }
        }
        content = fileContents.join("\n\n");
        setProcessingFiles(false);
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
      const knowledgeBase = await analyzeContentForBot(content, "text", botName);

      // Prepare files data for API
      const files = uploadedFiles.map(file => ({
        name: file.name,
        type: file.type === 'application/pdf' ? 'pdf' : 
              file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? 'docx' : 'txt',
        size: file.size,
        content: content // This would be the extracted content for each file
      }));

      // Create chatbot via API
      const response = await chatbotAPI.createChatbot(effectiveUserId, {
        name: botName,
        description,
        platform: selectedPlatform || "web",
        knowledge: knowledgeBase,
        files
      });

      // Add the new chatbot to the list
      setUserBots(prev => [...prev, response.chatbot]);

      // Reset form
      setBotName("");
      setDescription("");
      setSourceUrl("");
      setUploadedFiles([]);
      setSelectedPlatform("");
      
      alert(`Bot "${botName}" created successfully!`);
      
    } catch (error) {
      console.error('Error creating bot:', error);
      alert("Failed to create bot. Please try again.");
    } finally {
      setLoading(false);
      setProcessingBot(null);
    }
  };

  const handleTestChat = async (bot: Bot) => {
    if (!effectiveUserId) {
      alert("Please log in to test chatbots");
      return;
    }

    try {
      console.log('🚀 Starting new chat session for bot:', {
        botId: bot.id,
        botName: bot.name,
        effectiveUserId
      });

      // Check for existing active session first
      const sessions = await chatbotAPI.getChatbotSessions(effectiveUserId, bot.id);
      console.log('📝 Existing sessions:', sessions);
      
      let newSession;
      if (sessions && sessions.length > 0) {
        // Use the most recent active session if it exists
        const activeSession = sessions
          .filter(s => s.isActive)
          .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())[0];
        
        if (activeSession) {
          console.log('✨ Found existing active session:', activeSession);
          newSession = activeSession;
          
          // Load existing chat messages
          const existingMessages = await chatbotAPI.getChatMessages(effectiveUserId, activeSession.id);
          console.log('📚 Loaded existing messages:', existingMessages.map(m => ({
            messageId: m.id,
            role: m.role,
            roleType: typeof m.role,
            content: m.content.substring(0, 50) + '...'
          })));
          setChatMessages(existingMessages);
        }
      }
      
      // If no active session found, create a new one
      if (!newSession) {
        console.log('🆕 Creating new chat session');
        newSession = await chatbotAPI.createChatSession(effectiveUserId, bot.id);
        console.log('✅ Chat session created:', newSession);
        
        // Initialize with welcome message
        const welcomeMsg: ChatMessage = {
          id: Date.now(),
          sessionId: newSession.id,
          role: ROLE_BOT,
          content: `Hello! I'm ${bot.name}. I can help answer questions about ${bot.description || "the topics I was trained on"}. What would you like to know?`,
          timestamp: new Date().toISOString(),
          tokensUsed: null,
          processingTime: null,
          hasError: false,
          errorMessage: null
        };
        
        console.log('💬 Setting welcome message with role:', {
          messageId: welcomeMsg.id,
          role: welcomeMsg.role,
          roleType: typeof welcomeMsg.role,
          content: welcomeMsg.content.substring(0, 50) + '...'
        });

        // Store welcome message in backend first
        await chatbotAPI.sendMessage(effectiveUserId, newSession.id, welcomeMsg.content, welcomeMsg.role);
        console.log('💾 Welcome message stored in backend');
        
        // Then set in frontend state
        setChatMessages([welcomeMsg]);
      }
      
      setCurrentSession(newSession);
    setChatMode(bot);
      
    } catch (error) {
      console.error('❌ Error in handleTestChat:', error);
      alert('Failed to start chat session');
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !chatMode || !currentSession || !effectiveUserId) return;

    const userMessage = chatInput.trim();
    setChatInput("");

    // Always use strict role constant for user messages
    const userRole = ROLE_USER;

    console.log('📤 Sending message:', {
      sessionId: currentSession.id,
      message: userMessage,
      effectiveUserId,
      role: userRole
    });

    // Add user message to chat immediately
    const userMsgObj: ChatMessage = {
      id: Date.now(),
      sessionId: currentSession.id,
      role: userRole,
      content: userMessage,
      timestamp: new Date().toISOString(),
      tokensUsed: null,
      processingTime: null,
      hasError: false,
      errorMessage: null
    };
    setChatMessages(prev => [...prev, userMsgObj]);

    try {
      console.log('💾 Storing user message in backend:', {
        ...userMsgObj,
        content: userMsgObj.content.substring(0, 50) + '...'
      });
      // Store user message in backend for persistence
      await chatbotAPI.sendMessage(effectiveUserId, currentSession.id, userMessage, userRole);

      // Generate bot response using Gemini on the frontend
      const startTime = Date.now();
      const botReply = await generateBotResponse(userMessage, chatMode.knowledge, chatMode.name);
      const processingTime = Date.now() - startTime;
      
      // Always use strict role constant for bot messages
      const botRole = ROLE_BOT;
      
      const botMsgObj: ChatMessage = {
        id: Date.now() + 1,
        sessionId: currentSession.id,
        role: botRole,
        content: botReply,
        timestamp: new Date().toISOString(),
        tokensUsed: null,
        processingTime,
        hasError: false,
        errorMessage: null
      };

      console.log('🤖 Bot response generated:', {
        ...botMsgObj,
        content: botMsgObj.content.substring(0, 50) + '...'
      });
      setChatMessages(prev => [...prev, botMsgObj]);

      // IMPORTANT: Store bot message in backend for persistence
      console.log('💾 Storing bot message in backend');
      await chatbotAPI.sendMessage(effectiveUserId, currentSession.id, botReply, botRole);
      
    } catch (error) {
      console.error('❌ Error in chat:', error);
      
      // Add error message to chat
      const errorMsgObj: ChatMessage = {
        id: Date.now() + 2,
        sessionId: currentSession.id,
        role: ROLE_BOT,
        content: "Sorry, I'm experiencing technical difficulties. Please try again.",
        timestamp: new Date().toISOString(),
        tokensUsed: null,
        processingTime: null,
        hasError: true,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
      setChatMessages(prev => [...prev, errorMsgObj]);
      
      alert('Failed to process message');
    }
  };

  const toggleBotStatus = async (botId: number) => {
    if (!effectiveUserId) return;

    try {
      const bot = userBots.find(b => b.id === botId);
      if (!bot) return;

      const newStatus = bot.status === "active" ? "inactive" : "active";
      await chatbotAPI.updateChatbot(effectiveUserId, botId, { status: newStatus });
      
    setUserBots(prev => 
      prev.map(bot => 
        bot.id === botId 
            ? { ...bot, status: newStatus }
          : bot
      )
    );
    } catch (error) {
      console.error('Error updating bot status:', error);
      alert('Failed to update bot status');
    }
  };

  const deleteBot = async (botId: number) => {
    if (!effectiveUserId) return;
    
    if (confirm("Are you sure you want to delete this bot?")) {
      try {
        await chatbotAPI.deleteChatbot(effectiveUserId, botId);
      setUserBots(prev => prev.filter(bot => bot.id !== botId));
      } catch (error) {
        console.error('Error deleting bot:', error);
        alert('Failed to delete bot');
      }
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
            {chatMessages.map((msg, index) => {
              // Strict role checking using constants
              const isUserMessage = msg.role === ROLE_USER;
              
              // Debug log to console
              console.log('Rendering message:', { 
                messageId: msg.id,
                role: msg.role,
                roleType: typeof msg.role,
                isUserMessage,
                content: msg.content.substring(0, 50) + '...' 
              });
              
              return (
                <div key={msg.id || index} className={`flex ${isUserMessage ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isUserMessage 
                    ? "bg-blue-500 text-white" 
                    : "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white"
                }`}>
                    <div className="text-xs opacity-70 mb-1">
                      {isUserMessage ? "You" : (chatMode?.name || "Bot")}
                    </div>
                  {msg.content}
                </div>
              </div>
              );
            })}
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

      {processingFiles && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-green-600" />
              <span className="text-green-800 dark:text-green-200 font-medium">
                Processing uploaded files (PDFs/DOCX)... Please wait.
              </span>
            </div>
            <Progress value={fileProcessingProgress} className="w-full" />
            <div className="text-sm text-green-700 dark:text-green-300">
              {Math.round(fileProcessingProgress)}% complete
            </div>
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
                        <Button type="button" variant="outline" onClick={() => {
                          const fileInput = document.getElementById('fileUpload') as HTMLInputElement | null;
                          if (fileInput) fileInput.click();
                        }}>
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
                          {uploadedFiles.map((file, index) => {
                            const isPDF = file.type === 'application/pdf';
                            const isDOCX = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                            const isText = file.type === 'text/plain' || file.type === 'text/markdown';
                            
                            return (
                              <div key={index} className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  {isPDF ? (
                                    <File className="h-5 w-5 text-red-500" />
                                  ) : isDOCX ? (
                                    <FileText className="h-5 w-5 text-blue-500" />
                                  ) : (
                                    <FileText className="h-5 w-5 text-green-500" />
                                  )}
                                  <div>
                                    <span className="text-sm font-medium">{file.name}</span>
                                    <div className="flex items-center space-x-2 text-xs text-slate-500">
                                      <span>{isPDF ? 'PDF' : isDOCX ? 'DOCX' : 'Text'}</span>
                                      <span>•</span>
                                      <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                    </div>
                                  </div>
                                </div>
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(index)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            );
                          })}
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

                <Button 
                  type="button" 
                  onClick={handleCreateBot} 
                  disabled={loading || (isFreeTier && userBots.length >= 1)} 
                  className="w-full"
                  title={isFreeTier && userBots.length >= 1 ? "Free plan allows only 1 chatbot. Upgrade to Pro for unlimited bots." : undefined}
                >
                  {loading ? "Creating Bot with AI..." : "Create AI Chatbot"}
                </Button>
                {isFreeTier && userBots.length >= 1 && (
                  <div className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                    You have reached the free plan limit of 1 chatbot. <b>Upgrade to Pro</b> for unlimited bots.
                  </div>
                )}
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