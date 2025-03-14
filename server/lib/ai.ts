import type { Platform } from "@shared/schema";

const PLATFORM_GUIDELINES = {
  instagram: "Keep it concise, use emojis, focus on visual appeal, max 2200 characters",
  facebook: "Conversational tone, can be longer, support for rich media, max 63206 characters",
  linkedin: "Professional tone, industry-focused, can include hashtags, max 3000 characters"
};

async function generateSummaryForImage(content: string): Promise<string> {
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
              text: `Create a very short, visual description (maximum 20 words) that captures the main theme of this content for image generation: ${content}`
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
    return result.candidates[0].content.parts[0].text || "";
  } catch (error: any) {
    console.error("Error generating summary:", error);
    return content.split(' ').slice(0, 10).join(' '); // Fallback to first 10 words if summary fails
  }
}

export async function generateContent(notes: string): Promise<{
  contents: { [key in Platform]: string };
  imageUrl: string;
}> {
  try {
    // Generate content for all platforms in one prompt
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
              text: `Generate social media content for multiple platforms based on these notes. Please format the response as follows:

For Instagram (${PLATFORM_GUIDELINES.instagram}):
[Instagram content here]

For Facebook (${PLATFORM_GUIDELINES.facebook}):
[Facebook content here]

For LinkedIn (${PLATFORM_GUIDELINES.linkedin}):
[LinkedIn content here]

Notes: ${notes}`
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
    const fullContent = result.candidates[0].content.parts[0].text || "";

    // Parse the content for each platform
    const contents: { [key in Platform]: string } = {
      instagram: "",
      facebook: "",
      linkedin: ""
    };

    // Extract content for each platform using regex
    const platforms: Platform[] = ["instagram", "facebook", "linkedin"];
    platforms.forEach(platform => {
      const regex = new RegExp(`For ${platform.charAt(0).toUpperCase() + platform.slice(1)}.*?:\\n([\\s\\S]*?)(?=\\n\\nFor|$)`, "i");
      const match = fullContent.match(regex);
      contents[platform] = match ? match[1].trim() : `Failed to generate ${platform} content`;
    });

    // Generate a summary based on all content for image generation
    const summary = await generateSummaryForImage(Object.values(contents).join(" "));
    const imageUrl = generateImageUrl(summary);

    return { contents, imageUrl };
  } catch (error: any) {
    throw new Error(`Failed to generate content: ${error.message}`);
  }
}

export function generateImageUrl(prompt: string): string {
  const encodedPrompt = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encodedPrompt}`;
}