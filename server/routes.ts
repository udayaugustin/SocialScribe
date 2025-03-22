import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContentSchema, platformSchema, type Platform } from "@shared/schema";
import { generateContent } from "./lib/ai";
import { publishToSocialMedia, getSimulatedPosts } from "./lib/social";
import { postToFacebook } from "./lib/facebook";
import fetch from "node-fetch";
import { config } from "dotenv";

// Load environment variables
config();

export async function registerRoutes(app: Express): Promise<Server> {
  // Get Facebook configuration
  app.get("/api/config/facebook", (_req, res) => {
    // Only expose the app ID, never the app secret
    const appId = process.env.FACEBOOK_APP_ID || "";
    console.log(`Sending Facebook config to client. App ID: ${appId}`);
    res.json({
      appId: appId,
    });
  });

  // Facebook Authentication endpoint
  app.post("/api/auth/facebook", async (req, res) => {
    try {
      const { accessToken } = req.body;
      
      console.log("Facebook auth request received", { 
        hasToken: !!accessToken, 
        appId: process.env.FACEBOOK_APP_ID,
        hasSecret: !!process.env.FACEBOOK_APP_SECRET
      });
      
      if (!accessToken) {
        console.error("Facebook auth: Missing access token");
        return res.status(400).json({ message: "Access token is required" });
      }

      // Exchange short-lived token for long-lived token
      const tokenEndpoint = `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.FACEBOOK_APP_ID}&client_secret=${process.env.FACEBOOK_APP_SECRET}&fb_exchange_token=${accessToken}`;
      console.log(`Requesting long-lived token from: ${tokenEndpoint}`);
      
      const longLivedTokenResponse = await fetch(tokenEndpoint, { method: 'GET' });
      
      console.log(`Token exchange response status: ${longLivedTokenResponse.status}`);
      
      if (!longLivedTokenResponse.ok) {
        const error = await longLivedTokenResponse.json() as { error?: { message?: string } };
        console.error("Failed to get long-lived token:", error);
        return res.status(400).json({ 
          message: `Failed to get long-lived token: ${error.error?.message || 'Unknown error'}` 
        });
      }
      
      const tokenData = await longLivedTokenResponse.json() as { 
        access_token: string; 
        expires_in: number 
      };
      const { access_token: longLivedToken, expires_in } = tokenData;
      
      // Get user's Facebook pages
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?access_token=${longLivedToken}`,
        { method: 'GET' }
      );
      
      if (!pagesResponse.ok) {
        const error = await pagesResponse.json() as { error?: { message?: string } };
        return res.status(400).json({ 
          message: `Failed to get pages: ${error.error?.message || 'Unknown error'}` 
        });
      }
      
      const pagesData = await pagesResponse.json() as {
        data?: Array<{
          id: string;
          name: string;
          category: string;
          access_token: string;
        }>;
      };
      const pages = pagesData.data || [];
      
      if (pages.length === 0) {
        return res.status(400).json({ message: "No Facebook pages found for this user" });
      }
      
      // Save the tokens (in a real app, you'd save these to a database)
      process.env.FACEBOOK_USER_ACCESS_TOKEN = longLivedToken;
      
      // Calculate token expiration with validation
      let tokenExpires;
      try {
        if (expires_in && typeof expires_in === 'number' && isFinite(expires_in)) {
          tokenExpires = new Date(Date.now() + expires_in * 1000).toISOString();
          console.log(`Token expires: ${tokenExpires}, expires_in: ${expires_in}`);
        } else {
          // Default to 60 days (common for long-lived tokens) if expires_in is invalid
          tokenExpires = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
          console.log(`Using default token expiration (60 days). Invalid expires_in: ${expires_in}`);
        }
      } catch (error) {
        console.error("Error calculating token expiration:", error);
        // Use a default if there's an error
        tokenExpires = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
      }
      
      // Return success with page information
      res.json({
        success: true,
        pages: pages.map((page: any) => ({
          id: page.id,
          name: page.name,
          category: page.category
        })),
        tokenExpires: tokenExpires
      });
    } catch (error: any) {
      console.error("Facebook auth error:", error);
      
      // Provide more detailed error information
      let errorMessage = "Authentication failed";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error("Error stack:", error.stack);
      }
      
      // Log detailed information for debugging
      console.error("Request body:", req.body);
      
      // Return a more detailed error response
      res.status(500).json({ 
        message: errorMessage,
        timestamp: new Date().toISOString(),
        path: "/api/auth/facebook"
      });
    }
  });

  // Endpoint to get connected Facebook pages
  app.get("/api/facebook/pages", async (req, res) => {
    try {
      const accessToken = process.env.FACEBOOK_USER_ACCESS_TOKEN;
      
      if (!accessToken) {
        return res.status(401).json({ 
          message: "No Facebook access token available. Please connect to Facebook first." 
        });
      }
      
      // Get user's Facebook pages
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`,
        { method: 'GET' }
      );
      
      if (!pagesResponse.ok) {
        const error = await pagesResponse.json() as { error?: { message?: string } };
        return res.status(400).json({ 
          message: `Failed to get pages: ${error.error?.message || 'Unknown error'}`
        });
      }
      
      const pagesData = await pagesResponse.json() as {
        data?: Array<{
          id: string;
          name: string;
          category: string;
          access_token: string;
        }>;
      };
      
      const pages = pagesData.data || [];
      
      res.json({
        success: true,
        pages: pages.map(page => ({
          id: page.id,
          name: page.name,
          category: page.category
        }))
      });
    } catch (error: any) {
      console.error("Error fetching Facebook pages:", error);
      res.status(500).json({ message: error.message || "Failed to fetch Facebook pages" });
    }
  });

  app.post("/api/content", async (req, res) => {
    try {
      const data = insertContentSchema.parse(req.body);
      const content = await storage.createContent(data);
      res.json(content);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/content/:id/generate", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const content = await storage.getContent(id);

      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }

      const { contents, imageUrl } = await generateContent(content.notes);

      // Update content for each platform
      const platforms: Platform[] = ["instagram", "facebook", "linkedin"];
      for (const platform of platforms) {
        await storage.updateGeneratedContent(id, platform, contents[platform]);
      }

      const updatedContent = await storage.getContent(id);

      res.json({
        ...updatedContent,
        imageUrl
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Modify the publish endpoint to handle real Facebook posting
  app.post("/api/content/:id/publish/:platform", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const platform = platformSchema.parse(req.params.platform);
      const { simulate = true } = req.query; // Default to simulation mode

      const content = await storage.getContent(id);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }

      const platformContent = content.generatedContent?.[platform];
      if (!platformContent) {
        return res.status(400).json({ message: "No generated content found for this platform" });
      }

      if (simulate === "false" && platform === "facebook") {
        // Real Facebook posting - pass pages if they exist in the request body
        const result = await postToFacebook(
          platformContent, 
          req.body.imageUrl,
          req.body.pages
        );
        
        if (!result.success) {
          return res.status(400).json({ 
            message: result.message || "Failed to post to Facebook" 
          });
        }
        
        return res.json({
          platform,
          content: { text: platformContent, imageUrl: req.body.imageUrl },
          postId: result.id,
          timestamp: new Date().toISOString(),
          status: "posted",
          message: result.message
        });
      }

      // Simulation mode for other platforms or when specified
      const post = await publishToSocialMedia(
        platform,
        platformContent,
        req.body.imageUrl
      );

      res.json(post);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get all simulated posts
  app.get("/api/posts/simulated", (_req, res) => {
    res.json(getSimulatedPosts());
  });

  const httpServer = createServer(app);
  return httpServer;
}