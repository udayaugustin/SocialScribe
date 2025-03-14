import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { initFacebookSDK, loginWithFacebook, checkFacebookLoginStatus } from "@/lib/facebook";
import { SiFacebook } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";

export function FacebookConnect() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function init() {
      try {
        await initFacebookSDK();
        const connected = await checkFacebookLoginStatus();
        setIsConnected(connected);
      } catch (error) {
        console.error("Error initializing Facebook SDK:", error);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  const handleConnect = async () => {
    try {
      const success = await loginWithFacebook();
      if (success) {
        setIsConnected(true);
        toast({
          title: "Successfully connected",
          description: "Your Facebook account is now connected",
        });
      } else {
        toast({
          title: "Connection failed",
          description: "Could not connect to Facebook",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to Facebook",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnected}
      className="flex items-center gap-2"
      variant={isConnected ? "outline" : "default"}
    >
      <SiFacebook className="w-5 h-5" />
      {isConnected ? "Connected to Facebook" : "Connect Facebook"}
    </Button>
  );
}
