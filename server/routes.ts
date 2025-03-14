import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContentSchema, platformSchema } from "@shared/schema";
import { generateContent } from "./lib/openai";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/content", async (req, res) => {
    try {
      const data = insertContentSchema.parse(req.body);
      const content = await storage.createContent(data);
      res.json(content);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/content/:id/generate/:platform", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const platform = platformSchema.parse(req.params.platform);
      
      const content = await storage.getContent(id);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }

      const generatedContent = await generateContent(content.notes, platform);
      const updatedContent = await storage.updateGeneratedContent(id, platform, generatedContent);
      
      res.json(updatedContent);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
