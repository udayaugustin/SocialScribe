import { useMutation } from "@tanstack/react-query";
import { type Platform } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SiInstagram, SiFacebook, SiLinkedin } from "react-icons/si";

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
}

export function PlatformPreview({ platform, contentId }: PlatformPreviewProps) {
  const { toast } = useToast();
  const Icon = platformIcons[platform];

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        "POST",
        `/api/content/${contentId}/generate/${platform}`,
        {}
      );
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Content Generated",
        description: `Your ${platform} content is ready`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: `Failed to generate ${platform} content`,
        variant: "destructive",
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${platformColors[platform]}`} />
          {platform.charAt(0).toUpperCase() + platform.slice(1)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {generateMutation.data?.generatedContent?.[platform] ? (
          <div className="whitespace-pre-wrap">
            {generateMutation.data.generatedContent[platform]}
          </div>
        ) : (
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="w-full bg-[#36B37E] hover:bg-[#36B37E]/90"
          >
            {generateMutation.isPending ? "Generating..." : "Generate Content"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
