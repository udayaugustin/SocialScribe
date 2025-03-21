
import fetch from "node-fetch";

interface FacebookPostResponse {
  id: string;
  success: boolean;
}

async function getPageAccessToken(userAccessToken: string): Promise<{pageId: string, pageAccessToken: string}> {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?access_token=${userAccessToken}`
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to fetch pages: ${error.error?.message || 'Unknown error'}`);
  }
  
  const data = await response.json();
  if (!data.data?.[0]) {
    throw new Error("No Facebook pages found");
  }

  return {
    pageId: data.data[0].id,
    pageAccessToken: data.data[0].access_token
  };
}

export async function postToFacebook(content: string, imageUrl?: string): Promise<FacebookPostResponse> {
  try {
    const userAccessToken = process.env.FACEBOOK_USER_ACCESS_TOKEN;
    
    if (!userAccessToken) {
      throw new Error("Facebook user access token not configured");
    }

    // Get page access token using user token
    const { pageId, pageAccessToken } = await getPageAccessToken(userAccessToken);

    // First, upload the image if provided
    let attachmentId: string | undefined;
    if (imageUrl) {
      const photoResponse = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}/photos?url=${encodeURIComponent(imageUrl)}&published=false&access_token=${pageAccessToken}`,
        { method: "POST" }
      );
      
      if (!photoResponse.ok) {
        const error = await photoResponse.json();
        throw new Error(`Failed to upload image: ${error.error?.message || 'Unknown error'}`);
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
      const error = await postResponse.json();
      throw new Error(`Failed to create post: ${error.error?.message || 'Unknown error'}`);
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
