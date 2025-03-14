import type { Platform } from "@shared/schema";

interface PostContent {
  text: string;
  imageUrl?: string;
}

export interface SocialMediaPost {
  platform: Platform;
  content: PostContent;
  timestamp: string;
  status: "simulated" | "posted";
}

// Simulated posts storage
const simulatedPosts: SocialMediaPost[] = [];

export async function publishToSocialMedia(
  platform: Platform,
  content: string,
  imageUrl?: string
): Promise<SocialMediaPost> {
  // Create a simulated post
  const post: SocialMediaPost = {
    platform,
    content: {
      text: content,
      imageUrl
    },
    timestamp: new Date().toISOString(),
    status: "simulated"
  };

  // Store the simulated post
  simulatedPosts.push(post);

  // Log the simulated post for debugging
  console.log(`Simulated ${platform} post:`, {
    content: content.substring(0, 100) + "...",
    imageUrl,
    timestamp: post.timestamp
  });

  return post;
}

export function getSimulatedPosts(): SocialMediaPost[] {
  return simulatedPosts;
}
