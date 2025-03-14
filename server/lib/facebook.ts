import type { Platform } from "@shared/schema";

interface FacebookPostResponse {
  id: string;
  success: boolean;
}

export async function postToFacebook(content: string, imageUrl?: string): Promise<FacebookPostResponse> {
  try {
    const pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    const pageId = process.env.FACEBOOK_PAGE_ID;

    if (!pageAccessToken || !pageId) {
      throw new Error("Facebook credentials not configured");
    }

    // First, upload the image if provided
    let attachmentId: string | undefined;
    if (imageUrl) {
      const photoResponse = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}/photos?url=${encodeURIComponent(imageUrl)}&published=false&access_token=${pageAccessToken}`,
        { method: "POST" }
      );
      
      if (!photoResponse.ok) {
        throw new Error("Failed to upload image to Facebook");
      }
      
      const photoData = await photoResponse.json();
      attachmentId = photoData.id;
    }

    // Create the post
    const postData: any = {
      message: content,
      access_token: pageAccessToken,
    };

    if (attachmentId) {
      postData.attached_media = [{ media_fbid: attachmentId }];
    }

    const postResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/feed`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      }
    );

    if (!postResponse.ok) {
      throw new Error("Failed to create Facebook post");
    }

    const result = await postResponse.json();
    return {
      id: result.id,
      success: true,
    };
  } catch (error: any) {
    console.error("Facebook posting error:", error);
    return {
      id: "",
      success: false,
    };
  }
}
