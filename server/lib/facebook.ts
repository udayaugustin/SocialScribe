import fetch from "node-fetch";

interface FacebookPostResponse {
  id: string;
  success: boolean;
  message?: string;
}

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}

async function getPageAccessToken(userAccessToken: string, pageId?: string): Promise<{pageId: string, pageAccessToken: string, pageName: string}> {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?access_token=${userAccessToken}`
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to fetch pages: ${error.error?.message || 'Unknown error'}`);
  }
  
  const data = await response.json();
  if (!data.data?.length) {
    throw new Error("No Facebook pages found");
  }

  // If a specific pageId is provided, find that page
  let page: FacebookPage | undefined;
  if (pageId) {
    page = data.data.find((p: FacebookPage) => p.id === pageId);
    if (!page) {
      throw new Error(`Page with ID ${pageId} not found`);
    }
  } else {
    // Otherwise use the first page
    page = data.data[0];
  }

  return {
    pageId: page.id,
    pageAccessToken: page.access_token,
    pageName: page.name
  };
}

export async function postToFacebook(
  content: string, 
  imageUrl?: string, 
  pages?: Array<{id: string, name: string}>
): Promise<FacebookPostResponse> {
  try {
    const userAccessToken = process.env.FACEBOOK_USER_ACCESS_TOKEN;
    
    if (!userAccessToken) {
      return {
        id: "",
        success: false,
        message: "Facebook user access token not configured"
      };
    }

    // If no specific pages are provided or the array is empty
    if (!pages || pages.length === 0) {
      // Post to the first page (default behavior)
      try {
        const result = await postToSinglePage(content, imageUrl, userAccessToken);
        return result;
      } catch (error: any) {
        return {
          id: "",
          success: false,
          message: error.message
        };
      }
    } else {
      // Post to multiple pages if specified
      const results = await Promise.all(
        pages.map(page => postToSinglePage(content, imageUrl, userAccessToken, page.id))
      );
      
      // Check if any post was successful
      const successCount = results.filter(r => r.success).length;
      
      if (successCount === 0) {
        return {
          id: "",
          success: false,
          message: "Failed to post to any of the selected pages"
        };
      }
      
      return {
        id: results.find(r => r.success)?.id || "",
        success: true,
        message: `Successfully posted to ${successCount} of ${pages.length} pages`
      };
    }
  } catch (error: any) {
    console.error("Facebook posting error:", error);
    return {
      id: "",
      success: false,
      message: error.message || "Unknown error occurred"
    };
  }
}

async function postToSinglePage(
  content: string, 
  imageUrl?: string, 
  userAccessToken?: string,
  pageId?: string
): Promise<FacebookPostResponse> {
  try {
    if (!userAccessToken) {
      throw new Error("Facebook user access token not provided");
    }

    // Get page access token using user token
    const { pageId: targetPageId, pageAccessToken, pageName } = await getPageAccessToken(userAccessToken, pageId);

    // First, upload the image if provided
    let attachmentId: string | undefined;
    if (imageUrl) {
      const photoResponse = await fetch(
        `https://graph.facebook.com/v18.0/${targetPageId}/photos?url=${encodeURIComponent(imageUrl)}&published=false&access_token=${pageAccessToken}`,
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
      `https://graph.facebook.com/v18.0/${targetPageId}/feed`,
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
      message: `Successfully posted to page: ${pageName}`
    };
  } catch (error: any) {
    console.error(`Error posting to page ${pageId}:`, error);
    return {
      id: "",
      success: false,
      message: error.message
    };
  }
}
