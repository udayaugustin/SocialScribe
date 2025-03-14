import { pgTable, text, serial, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const contentItems = pgTable("content_items", {
  id: serial("id").primaryKey(),
  notes: text("notes").notNull(),
  generatedContent: jsonb("generated_content").$type<{
    instagram?: string;
    facebook?: string;
    linkedin?: string;
  }>(),
});

export const insertContentSchema = createInsertSchema(contentItems).pick({
  notes: true,
});

export const platformSchema = z.enum(["instagram", "facebook", "linkedin"]);

export type InsertContent = z.infer<typeof insertContentSchema>;
export type ContentItem = typeof contentItems.$inferSelect;
export type Platform = z.infer<typeof platformSchema>;
