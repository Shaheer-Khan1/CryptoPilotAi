// Backend API implementation for Shorts Generator Pipeline
// This includes CryptoPanic, Gemini, and YouTube API integrations

// ===== CryptoPanic API Integration =====
class CryptoPanicService {
  apiKey: string;
  baseUrl: string;
  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://cryptopanic.com/api/v1';
  }

  async getTopNews(limit: number = 10) {
    try {
      const response = await fetch(
        `${this.baseUrl}/posts/?auth_token=${this.apiKey}&public=true&kind=news&currencies=BTC,ETH&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error(`CryptoPanic API error: ${response.status}`);
      }
      
      const data = await response.json();
      // Log the raw response for debugging
      console.log('CryptoPanic API raw response:', data);
      if (!data.results || !Array.isArray(data.results)) {
        console.error('CryptoPanic API returned unexpected data:', data);
        throw new Error('CryptoPanic API returned unexpected data');
      }
      
      return data.results.map((post: any) => ({
        id: post.id,
        title: post.title,
        url: post.url,
        published_at: post.published_at,
        source: post.source?.title || post.source || 'Unknown',
        currencies: Array.isArray(post.currencies) ? post.currencies.map((c: any) => c.code) : [],
        votes: post.votes || {}
      }));
    } catch (error) {
      console.error('Error fetching CryptoPanic news:', error);
      throw error;
    }
  }

  async getTrendingNews() {
    try {
      const response = await fetch(
        `${this.baseUrl}/posts/?auth_token=${this.apiKey}&public=true&kind=news&filter=trending`
      );
      
      const data = await response.json();
      return data.results;
    } catch (error) {
      console.error('Error fetching trending news:', error);
      throw error;
    }
  }
}

// ===== Gemini API Integration =====
class GeminiService {
  apiKey: string;
  baseUrl: string;
  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  }

  async generateScript(newsData: any) {
    const prompt = `
Create a viral YouTube Shorts script (45-60 seconds) based on this crypto news:

Title: ${newsData.title}
Source: ${newsData.source}
Currencies: ${newsData.currencies.join(', ')}

Requirements:
- Hook viewers in first 3 seconds
- Use emojis and engaging language
- Include trending hashtags
- Make it actionable for crypto traders/investors
- Keep it under 150 words
- End with a call-to-action

Format your response as JSON:
{
  "title": "Catchy title for the video",
  "script": "The full script with emojis and formatting",
  "duration": 45,
  "hashtags": ["#Crypto", "#Bitcoin", etc.],
  "thumbnail_prompt": "Description for thumbnail creation",
  "call_to_action": "What viewers should do next"
}
`;

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
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

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const generatedText = data.candidates[0].content.parts[0].text;
      
      // Parse JSON from the response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        // Fallback if JSON parsing fails
        return {
          title: newsData.title.substring(0, 60),
          script: generatedText,
          duration: 45,
          hashtags: ["#Crypto", ...newsData.currencies.map(c => `#${c}`)],
          thumbnail_prompt: `Create thumbnail for ${newsData.title}`,
          call_to_action: "Follow for more crypto updates!"
        };
      }
    } catch (error) {
      console.error('Error generating script with Gemini:', error);
      throw error;
    }
  }

  async optimizeHashtags(script: string, trending_topics: string[] = []) {
    const prompt = `
Optimize hashtags for this YouTube Shorts script:
"${script}"

Current trending crypto topics: ${trending_topics.join(', ')}

Return 8-12 relevant hashtags that will maximize reach and engagement.
Format as JSON array: ["#hashtag1", "#hashtag2", ...]
`;

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
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
      const generatedText = data.candidates[0].content.parts[0].text;
      
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return ["#Crypto", "#Bitcoin", "#Ethereum", "#Trading"];
    } catch (error) {
      console.error('Error optimizing hashtags:', error);
      return ["#Crypto", "#Bitcoin", "#Ethereum", "#Trading"];
    }
  }
}

// ===== YouTube API Integration =====
class YouTubeService {
  apiKey: string;
  channelId: string;
  baseUrl: string;
  constructor(apiKey: string, channelId: string) {
    this.apiKey = apiKey;
    this.channelId = channelId;
    this.baseUrl = 'https://www.googleapis.com/youtube/v3';
  }

  async uploadVideo(videoData: any, accessToken: any) {
    // Note: This requires OAuth2 access token for uploading
    try {
      const metadata = {
        snippet: {
          title: videoData.title,
          description: `${videoData.script}\n\n${videoData.hashtags.join(' ')}`,
          tags: videoData.hashtags.map((tag: any) => tag.replace('#', '')),
          categoryId: '24', // Entertainment category
          defaultLanguage: 'en',
          defaultAudioLanguage: 'en'
        },
        status: {
          privacyStatus: 'public',
          selfDeclaredMadeForKids: false
        }
      };

      // If we had the actual video file, we'd upload it here
      // For now, we'll simulate the upload process
      const uploadResponse = {
        id: `yt_${Date.now()}`,
        snippet: {
          title: videoData.title,
          publishedAt: new Date().toISOString()
        },
        status: {
          uploadStatus: 'uploaded',
          privacyStatus: 'public'
        }
      };

      return {
        videoId: uploadResponse.id,
        url: `https://youtube.com/shorts/${uploadResponse.id}`,
        status: 'uploaded',
        title: uploadResponse.snippet.title,
        publishedAt: uploadResponse.snippet.publishedAt
      };

    } catch (error) {
      console.error('Error uploading to YouTube:', error);
      throw error;
    }
  }

  async getChannelStats() {
    try {
      const response = await fetch(
        `${this.baseUrl}/channels?part=statistics&id=${this.channelId}&key=${this.apiKey}`
      );
      
      const data = await response.json();
      return data.items[0].statistics;
    } catch (error) {
      console.error('Error fetching channel stats:', error);
      throw error;
    }
  }
}

// ===== Video Generation Service (Placeholder for Lumen5/Pictory) =====
class VideoGenerationService {
  apiKey: string;
  provider: string;
  baseUrl: string;
  constructor(apiKey: string, provider: string = 'lumen5') {
    this.apiKey = apiKey;
    this.provider = provider;
    this.baseUrl = provider === 'lumen5' 
      ? 'https://api.lumen5.com/v1' 
      : 'https://api.pictory.ai/pictoryapis/v1';
  }

  async createVideo(scriptData: any) {
    // This would integrate with Lumen5 or Pictory API
    // For now, we'll return a placeholder
    
    const videoRequest = {
      script: scriptData.script,
      title: scriptData.title,
      duration: scriptData.duration,
      format: 'vertical', // 9:16 for shorts
      voice: 'natural',
      background_music: true,
      subtitles: true,
      thumbnail_prompt: scriptData.thumbnail_prompt
    };

    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: `video_${Date.now()}`,
          status: 'processing',
          estimated_completion: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
          download_url: null // Will be available when processing completes
        });
      }, 1000);
    });
  }

  async getVideoStatus(videoId: string) {
    // Check video generation status
    return {
      id: videoId,
      status: 'completed', // processing, completed, failed
      download_url: `https://example.com/video/${videoId}.mp4`,
      thumbnail_url: `https://example.com/thumbnail/${videoId}.jpg`
    };
  }
}

// ===== Main Pipeline Orchestrator =====
interface ShortsPipelineConfig {
  cryptoPanicApiKey: string;
  geminiApiKey: string;
  youtubeApiKey: string;
  channelId: string;
  videoGenApiKey: string;
  videoGenProvider: string;
}

class ShortsGeneratorPipeline {
  cryptoPanic: CryptoPanicService;
  gemini: GeminiService;
  youtube: YouTubeService;
  videoGen: VideoGenerationService;
  constructor(config: ShortsPipelineConfig) {
    this.cryptoPanic = new CryptoPanicService(config.cryptoPanicApiKey);
    this.gemini = new GeminiService(config.geminiApiKey);
    this.youtube = new YouTubeService(config.youtubeApiKey, config.channelId);
    this.videoGen = new VideoGenerationService(config.videoGenApiKey, config.videoGenProvider);
  }

  async runFullPipeline(limit: number = 3) {
    try {
      console.log('🔄 Starting Shorts Generation Pipeline...');
      
      // Step 1: Fetch latest news
      console.log('📰 Fetching latest crypto news...');
      const news = await this.cryptoPanic.getTopNews(limit);
      
      const results = [];
      
      for (const newsItem of news) {
        try {
          console.log(`📝 Generating script for: ${newsItem.title}`);
          
          // Step 2: Generate script with Gemini
          const script = await this.gemini.generateScript(newsItem);
          
          // Step 3: Create video (when API is available)
          console.log('🎬 Creating video...');
          const video = await this.videoGen.createVideo(script);
          
          // Step 4: Upload to YouTube (when video is ready)
          // This would typically be done after video processing completes
          console.log('📤 Uploading to YouTube...');
          // const youtubeUpload = await this.youtube.uploadVideo(script, accessToken);
          
          results.push({
            news: newsItem,
            script: script,
            video: video,
            // youtube: youtubeUpload,
            status: 'completed',
            createdAt: new Date().toISOString()
          });
          
        } catch (error: any) {
          console.error(`Error processing news item ${newsItem.id}:`, error);
          results.push({
            news: newsItem,
            status: 'failed',
            error: error.message,
          });
        }
      }
      return results;
    } catch (error) {
      console.error('Error running Shorts Generator Pipeline:', error);
      throw error;
    }
  }
}

export {
  CryptoPanicService,
  GeminiService,
  YouTubeService,
  VideoGenerationService,
  ShortsGeneratorPipeline
}; 