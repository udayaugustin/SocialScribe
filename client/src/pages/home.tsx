import { ContentGenerator } from "@/components/content-generator";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="container mx-auto py-8">
        <h1 className="text-4xl font-bold text-[#1F2937] mb-8">
          AI Social Media Content Generator
        </h1>
        <ContentGenerator />
      </div>
    </div>
  );
}
