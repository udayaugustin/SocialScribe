import { useState } from "react";
import { Button } from "@/components/ui/button";
import { loginWithFacebook } from "@/lib/facebook";
import { SiFacebook } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw } from "lucide-react";
import { useFacebook } from "@/contexts/facebook-context";

export function FacebookConnect() {
  const { 
    isConnected, 
    isLoading, 
    isInitialized,
    pages,
    setPages,
    refreshPages,
    setIsConnected
  } = useFacebook();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showPages, setShowPages] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const response = await loginWithFacebook();
      console.log("Login response:", response);
      
      if (response.success) {
        setIsConnected(true);
        if (response.pages) {
          setPages(response.pages);
        } else {
          // If pages weren't returned, fetch them
          await refreshPages();
        }
        
        toast({
          title: "Successfully connected",
          description: `Your Facebook account is now connected with ${pages.length || 0} pages`,
        });
      } else {
        toast({
          title: "Connection failed",
          description: response.message || "Could not connect to Facebook",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Facebook connection error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to connect to Facebook",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRetry = () => {
    setIsRetrying(true);
    // Refresh the page to reinitialize everything
    window.location.reload();
  };

  if (isLoading) {
    return (
      <Button disabled variant="outline" className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading Facebook Integration...
      </Button>
    );
  }

  if (!isInitialized) {
    return (
      <div className="space-y-2">
        <div className="text-sm text-red-500">Facebook SDK initialization failed</div>
        <Button
          onClick={handleRetry}
          className="flex items-center gap-2"
          variant="outline"
          disabled={isRetrying}
        >
          {isRetrying ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {isRetrying ? "Retrying..." : "Retry Connection"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={isConnected ? () => setShowPages(!showPages) : handleConnect}
        className="flex items-center gap-2"
        variant={isConnected ? "outline" : "default"}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <SiFacebook className="w-5 h-5" />
        )}
        {isConnecting 
          ? "Connecting..." 
          : isConnected 
            ? "Connected to Facebook" 
            : "Connect Facebook"
        }
      </Button>
      
      {isConnected && showPages && pages.length > 0 && (
        <div className="mt-4 p-4 bg-slate-50 rounded-md">
          <h3 className="font-medium mb-2">Connected Pages ({pages.length})</h3>
          <ul className="space-y-2">
            {pages.map(page => (
              <li key={page.id} className="flex items-center gap-2 p-2 bg-white rounded border">
                <SiFacebook className="w-4 h-4 text-blue-600" />
                <span>{page.name}</span>
                <span className="text-xs text-slate-500 ml-auto">{page.category}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
