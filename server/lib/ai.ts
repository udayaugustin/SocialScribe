import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Platform } from "@shared/schema";

const PLATFORM_GUIDELINES = {
  instagram: "Keep it concise, use emojis, focus on visual appeal, max 2200 characters",
  facebook: "Conversational tone, can be longer, support for rich media, max 63206 characters",
  linkedin: "Professional tone, industry-focused, can include hashtags, max 3000 characters"
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function generateContent(notes: string, platform: Platform): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `Generate social media content for ${platform} based on these notes. Follow these guidelines: ${PLATFORM_GUIDELINES[platform]}\n\nNotes: ${notes}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    throw new Error(`Failed to generate content: ${error.message}`);
  }
}

export function generateImageUrl(prompt: string): string {
  // Encode the prompt for URL usage
  const encodedPrompt = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encodedPrompt}`;
}
