import type { Platform } from "@shared/schema";

const PLATFORM_GUIDELINES = {
  instagram: "Keep it concise, use emojis, focus on visual appeal, max 2200 characters",
  facebook: "Conversational tone, can be longer, support for rich media, max 63206 characters",
  linkedin: "Professional tone, industry-focused, can include hashtags, max 3000 characters"
};

export async function generateContent(notes: string, platform: Platform): Promise<string> {
  try {
    const response = await fetch("https://api.pollinations.ai/v1/generate/text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: `Generate social media content for ${platform} based on these notes. Follow these guidelines: ${PLATFORM_GUIDELINES[platform]}\n\nNotes: ${notes}`,
        max_tokens: platform === 'facebook' ? 1000 : 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed: ${error}`);
    }

    const result = await response.json();
    return result.text || "Failed to generate content";
  } catch (error: any) {
    throw new Error(`Failed to generate content: ${error.message}`);
  }
}
