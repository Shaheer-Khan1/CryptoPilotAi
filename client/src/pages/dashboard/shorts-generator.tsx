import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Settings, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function ShortsGenerator() {
  const { userData } = useAuth();
  const isFreeTier = !userData?.plan || userData?.plan === "starter";

  // Mock shorts data
  const shortsData = [
    {
      id: 1,
      title: "Bitcoin's Next Move: Expert Analysis",
      status: "published",
      views: "12.5K",
      likes: "1.2K",
      platform: "YouTube",
      thumbnail: "https://picsum.photos/400/600",
      publishedAt: "2 hours ago"
    },
    {
      id: 2,
      title: "Ethereum Layer 2 Solutions Explained",
      status: "processing",
      views: "0",
      likes: "0",
      platform: "YouTube",
      thumbnail: "https://picsum.photos/400/601",
      publishedAt: "Processing..."
    },
    {
      id: 3,
      title: "Top 3 Altcoins to Watch in 2024",
      status: "draft",
      views: "0",
      likes: "0",
      platform: "YouTube",
      thumbnail: "https://picsum.photos/400/602",
      publishedAt: "Draft"
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Shorts Only</h1>
        <p className="text-slate-600 dark:text-slate-400">View and manage your generated crypto shorts</p>
        {isFreeTier && (
          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-amber-800 dark:text-amber-200 font-medium">
                Free Tier: Limited to 3 videos per month. Upgrade to Pro for unlimited generation.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Generated Shorts */}
      <Card className="bg-white/90 dark:bg-surface/50 backdrop-blur-xl border-slate-200 dark:border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-slate-900 dark:text-white">Generated Shorts</CardTitle>
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shortsData.map((short) => (
              <div key={short.id} className="bg-slate-50 dark:bg-slate-800 rounded-lg overflow-hidden">
                <div className="relative aspect-[9/16]">
                  <img
                    src={short.thumbnail}
                    alt={short.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-semibold line-clamp-2">{short.title}</h3>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge
                        variant={
                          short.status === "published"
                            ? "default"
                            : short.status === "processing"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {short.status.charAt(0).toUpperCase() + short.status.slice(1)}
                      </Badge>
                      <span className="text-white/80 text-sm">{short.publishedAt}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center space-x-4">
                      <span>{short.views} views</span>
                      <span>{short.likes} likes</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}