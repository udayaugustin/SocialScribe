import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertContentSchema, type Platform } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PlatformPreview } from "./platform-preview";

export function ContentGenerator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [contentId, setContentId] = useState<number | null>(null);

  const form = useForm({
    resolver: zodResolver(insertContentSchema),
    defaultValues: {
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { notes: string }) => {
      const res = await apiRequest("POST", "/api/content", data);
      return res.json();
    },
    onSuccess: (data) => {
      setContentId(data.id);
      toast({
        title: "Notes saved",
        description: "You can now generate content for each platform",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save notes",
        variant: "destructive",
      });
    },
  });

  const platforms: Platform[] = ["instagram", "facebook", "linkedin"];

  return (
    <div className="space-y-8">
      <Card className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))}>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter your content ideas here..."
                      className="h-32"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="mt-4 bg-[#4A154B] hover:bg-[#4A154B]/90"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Saving..." : "Save Notes"}
            </Button>
          </form>
        </Form>
      </Card>

      {contentId && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {platforms.map((platform) => (
            <PlatformPreview
              key={platform}
              platform={platform}
              contentId={contentId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
