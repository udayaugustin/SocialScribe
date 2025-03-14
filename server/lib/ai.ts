import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Platform } from "@shared/schema";

const PLATFORM_GUIDELINES = {
  instagram: "Keep it concise, use emojis, focus on visual appeal, max 2200 characters",
  facebook: "Conversational tone, can be longer, support for rich media, max 63206 characters",
  linkedin: "Professional tone, industry-focused, can include hashtags, max 3000 characters"
};

export async function generateContent(notes: string, platform: Platform): Promise<string> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Generate social media content for ${platform} based on these notes. Follow these guidelines: ${PLATFORM_GUIDELINES[platform]}\n\nNotes: ${notes}`
            }]
          }]
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed: ${error}`);
    }

    const result = await response.json();
    return result.candidates[0].content.parts[0].text || "Failed to generate content";
  } catch (error: any) {
    throw new Error(`Failed to generate content: ${error.message}`);
  }
}

export function generateImageUrl(prompt: string): string {
  // Encode the prompt for URL usage
  const encodedPrompt = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encodedPrompt}`;
}