import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContentSchema, platformSchema, type Platform } from "@shared/schema";
import { generateContent } from "./lib/ai";
import { publishToSocialMedia, getSimulatedPosts } from "./lib/social";
import { postToFacebook } from "./lib/facebook";

export async function registerRoutes(app: Express): Promise<Server> {
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
        // Real Facebook posting
        const result = await postToFacebook(platformContent, req.body.imageUrl);
        if (!result.success) {
          return res.status(400).json({ message: "Failed to post to Facebook" });
        }
        return res.json({
          platform,
          content: { text: platformContent, imageUrl: req.body.imageUrl },
          postId: result.id,
          timestamp: new Date().toISOString(),
          status: "posted"
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