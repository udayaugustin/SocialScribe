#!/usr/bin/env node

import fetch from 'node-fetch';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables from .env file in project root
config({ path: path.join(rootDir, '.env') });

// Sample dummy content to post
const dummyContent = [
  {
    text: "Exciting news! We've just launched our new product line. Check out our website for more details! #NewLaunch #Exciting",
    imageUrl: "https://source.unsplash.com/random/1200x630/?product",
  },
  {
    text: "Happy Monday! Start your week with our special promotion - 20% off on all services this week only. #MondayMotivation #SpecialOffer",
    imageUrl: "https://source.unsplash.com/random/1200x630/?promotion",
  },
  {
    text: "We're excited to announce our participation in the upcoming industry conference. Come meet us at booth #42! #Conference #Networking",
    imageUrl: "https://source.unsplash.com/random/1200x630/?conference",
  },
  {
    text: "Customer spotlight: Check out this amazing review from one of our loyal customers! 'Best service ever, highly recommended!' #CustomerLove #Testimonial",
    imageUrl: "https://source.unsplash.com/random/1200x630/?review",
  },
  {
    text: "Behind the scenes: Our team working hard to bring you the best experience possible! #TeamWork #BehindTheScenes",
    imageUrl: "https://source.unsplash.com/random/1200x630/?team",
  }
];

/**
 * Get Facebook page access token using a user access token
 * @param {string} userAccessToken - User access token with manage_pages permission
 * @returns {Promise<{pageId: string, pageAccessToken: string}>} The page ID and access token
 */
async function getPageAccessToken(userAccessToken) {
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

/**
 * Post content to a Facebook page
 * @param {string} content - The text content to post
 * @param {string} imageUrl - Optional URL to an image to include in the post
 * @returns {Promise<{id: string, success: boolean}>} Result of the posting operation
 */
async function postToFacebook(content, imageUrl) {
  try {
    const userAccessToken = process.env.FACEBOOK_USER_ACCESS_TOKEN;
    
    if (!userAccessToken) {
      throw new Error("Facebook user access token not configured in .env file");
    }

    // Get page access token using user token
    const { pageId, pageAccessToken } = await getPageAccessToken(userAccessToken);
    console.log(`Found Facebook page with ID: ${pageId}`);

    // First, upload the image if provided
    let attachmentId;
    if (imageUrl) {
        imageUrl = "https://picsum.photos/200/300";
      console.log(`Uploading image from ${imageUrl}...`);
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
      console.log(`Image uploaded successfully with ID: ${attachmentId}`);
    }

    // Create the post
    const postData = {
      message: content,
      access_token: pageAccessToken,
    };

    if (attachmentId) {
      postData.attached_media = [{ media_fbid: attachmentId }];
    }

    console.log(`Posting content to Facebook page ${pageId}...`);
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
  } catch (error) {
    console.error("Facebook posting error:", error);
    return {
      id: "",
      success: false,
    };
  }
}

/**
 * Main function that posts random dummy content to Facebook
 */
async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const contentIndex = args.length > 0 ? parseInt(args[0], 10) : -1;
    
    // Select content to post
    let contentToPost;
    if (contentIndex >= 0 && contentIndex < dummyContent.length) {
      contentToPost = dummyContent[contentIndex];
      console.log(`Using pre-defined content #${contentIndex}`);
    } else {
      contentToPost = dummyContent[Math.floor(Math.random() * dummyContent.length)];
      console.log('Using random content from the sample list');
    }
    
    console.log('\nContent to post:');
    console.log('---------------------------');
    console.log(contentToPost.text);
    console.log(`Image URL: ${contentToPost.imageUrl}`);
    console.log('---------------------------\n');

    // Ask for confirmation before posting
    if (!args.includes('--force')) {
      console.log('This is a dry run. Add --force flag to actually post to Facebook.');
      process.exit(0);
    }

    // Post to Facebook
    console.log('Posting to Facebook...');
    const result = await postToFacebook(contentToPost.text, contentToPost.imageUrl);
    
    if (result.success) {
      console.log(`Successfully posted to Facebook! Post ID: ${result.id}`);
      console.log(`View at: https://www.facebook.com/${result.id.split('_')[0]}/posts/${result.id.split('_')[1]}`);
    } else {
      console.error('Failed to post to Facebook.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the main function
main(); 