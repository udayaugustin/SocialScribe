import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContentSchema, platformSchema, type Platform } from "@shared/schema";
import { generateContent } from "./lib/ai";

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

  const httpServer = createServer(app);
  return httpServer;
}