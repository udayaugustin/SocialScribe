import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { initFacebookSDK, checkFacebookLoginStatus } from "@/lib/facebook";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface FacebookPage {
  id: string;
  name: string;
  category: string;
  selected?: boolean;
}

interface FacebookContextType {
  isConnected: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  pages: FacebookPage[];
  setPages: (pages: FacebookPage[]) => void;
  refreshPages: () => Promise<void>;
  setIsConnected: (connected: boolean) => void;
}

const FacebookContext = createContext<FacebookContextType | undefined>(undefined);

export function FacebookProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize Facebook SDK on component mount
    (async () => {
      try {
        console.log("Initializing Facebook SDK from context...");
        await initFacebookSDK();
        setIsInitialized(true);
        
        console.log("Checking Facebook login status from context...");
        const connected = await checkFacebookLoginStatus();
        console.log("Facebook connected:", connected);
        setIsConnected(connected);
        
        if (connected) {
          await refreshPages();
        }
      } catch (error) {
        console.error("Error initializing Facebook SDK:", error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const refreshPages = async () => {
    try {
      console.log("Fetching Facebook pages...");
      const response = await apiRequest("GET", "/api/facebook/pages", undefined);
      const data = await response.json();
      console.log("Facebook pages response:", data);
      
      if (data.pages && data.pages.length > 0) {
        setPages(data.pages);
      } else {
        setPages([]);
      }
    } catch (error) {
      console.error("Error fetching pages:", error);
      toast({
        title: "Warning",
        description: "Connected to Facebook but couldn't fetch your pages",
        variant: "destructive",
      });
    }
  };

  const value = {
    isConnected,
    isLoading,
    isInitialized,
    pages,
    setPages,
    refreshPages,
    setIsConnected,
  };

  return (
    <FacebookContext.Provider value={value}>
      {children}
    </FacebookContext.Provider>
  );
}

export function useFacebook() {
  const context = useContext(FacebookContext);
  
  if (context === undefined) {
    throw new Error("useFacebook must be used within a FacebookProvider");
  }
  
  return context;
} 