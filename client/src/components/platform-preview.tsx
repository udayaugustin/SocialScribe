import { type Platform } from "@shared/schema";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
  generatedData: any;
}

export function PlatformPreview({ platform, contentId, generatedData }: PlatformPreviewProps) {
  const Icon = platformIcons[platform];

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