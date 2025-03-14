import { contentItems, type ContentItem, type InsertContent } from "@shared/schema";
import type { Platform } from "@shared/schema";

export interface IStorage {
  createContent(content: InsertContent): Promise<ContentItem>;
  updateGeneratedContent(id: number, platform: Platform, content: string): Promise<ContentItem>;
  getContent(id: number): Promise<ContentItem | undefined>;
}

export class MemStorage implements IStorage {
  private contents: Map<number, ContentItem>;
  private currentId: number;

  constructor() {
    this.contents = new Map();
    this.currentId = 1;
  }

  async createContent(content: InsertContent): Promise<ContentItem> {
    const id = this.currentId++;
    const newContent: ContentItem = {
      id,
      notes: content.notes,
      generatedContent: {}
    };
    this.contents.set(id, newContent);
    return newContent;
  }

  async updateGeneratedContent(id: number, platform: Platform, content: string): Promise<ContentItem> {
    const existingContent = await this.getContent(id);
    if (!existingContent) {
      throw new Error("Content not found");
    }

    const updatedContent = {
      ...existingContent,
      generatedContent: {
        ...existingContent.generatedContent,
        [platform]: content
      }
    };
    this.contents.set(id, updatedContent);
    return updatedContent;
  }

  async getContent(id: number): Promise<ContentItem | undefined> {
    return this.contents.get(id);
  }
}

export const storage = new MemStorage();
