import { useState } from "react";
import { type Platform } from "@shared/schema";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SiInstagram, SiFacebook, SiLinkedin } from "react-icons/si";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FacebookPageManager } from "./facebook-page-manager";
import { useFacebook, type FacebookPage } from "@/contexts/facebook-context";

const platformIcons = {
  instagram: SiInstagram,
  facebook: SiFacebook,
  linkedin: SiLinkedin,
};

const platformColors = {
  instagram: "text-pink-600",
  facebook: "text-blue-600",
  linkedin: "text-blue-700",
};

interface PlatformPreviewProps {
  platform: Platform;
  contentId: number;
  generatedData: any;
}

export function PlatformPreview({ platform, contentId, generatedData }: PlatformPreviewProps) {
  const Icon = platformIcons[platform];
  const { toast } = useToast();
  const [selectedPages, setSelectedPages] = useState<FacebookPage[]>([]);
  const [showPageManager, setShowPageManager] = useState(false);

  const publishMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        imageUrl: generatedData?.imageUrl
      };
      
      // Add selected pages for Facebook
      if (platform === 'facebook' && selectedPages.length > 0) {
        payload.pages = selectedPages.map(page => ({
          id: page.id,
          name: page.name
        }));
      }
      
      const res = await apiRequest(
        "POST", 
        `/api/content/${contentId}/publish/${platform}?simulate=false`, 
        payload
      );
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Post Simulated",
        description: `Your ${platform} post has been simulated. Check the posts tab to see how it would look.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: `Failed to simulate ${platform} post`,
        variant: "destructive",
      });
    },
  });

  const handlePagesSelected = (pages: FacebookPage[]) => {
    setSelectedPages(pages);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${platformColors[platform]}`} />
          {platform.charAt(0).toUpperCase() + platform.slice(1)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {generatedData?.generatedContent?.[platform] ? (
          <>
            <div className="whitespace-pre-wrap">
              {generatedData.generatedContent[platform]}
            </div>
            {generatedData.imageUrl && (
              <div className="mt-4">
                <img
                  src={generatedData.imageUrl}
                  alt="Generated content visualization"
                  className="w-full rounded-lg shadow-md"
                />
              </div>
            )}
            
            {platform === 'facebook' && (
              <div className="mt-4">
                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowPageManager(!showPageManager)}
                  >
                    {showPageManager ? "Hide" : "Manage"} Pages
                  </Button>
                </div>
                
                {showPageManager && (
                  <div className="mt-4">
                    <FacebookPageManager 
                      onPagesSelected={handlePagesSelected}
                      showSelectionControls={true}
                    />
                  </div>
                )}
                
                {selectedPages.length > 0 && (
                  <div className="mt-4 p-2 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-600">
                      Will post to {selectedPages.length} selected {selectedPages.length === 1 ? 'page' : 'pages'}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            <Button
              onClick={() => publishMutation.mutate()}
              disabled={
                publishMutation.isPending || 
                (platform === 'facebook' && (!window.FB || (selectedPages.length === 0 && showPageManager)))
              }
              className="w-full mt-4"
              variant="outline"
            >
              {publishMutation.isPending 
                ? "Posting..." 
                : "Post to " + platform.charAt(0).toUpperCase() + platform.slice(1)
              }
            </Button>
          </>
        ) : (
          <div className="text-center text-gray-500">
            Click the generate button above to create content
          </div>
        )}
      </CardContent>
    </Card>
  );
}