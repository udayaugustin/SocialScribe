import { ContentGenerator } from "@/components/content-generator";
import { FacebookConnect } from "@/components/facebook-connect";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="container mx-auto py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start mb-8">
          <h1 className="text-4xl font-bold text-[#1F2937] mb-4 sm:mb-0">
            AI Social Media Content Generator
          </h1>
          <div className="flex justify-end">
            <FacebookConnect />
          </div>
        </div>
        <ContentGenerator />
      </div>
    </div>
  );
}
