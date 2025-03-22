import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { SiFacebook } from "react-icons/si";
import { Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFacebook, type FacebookPage } from "@/contexts/facebook-context";

interface FacebookPageManagerProps {
  onPagesSelected?: (pages: FacebookPage[]) => void;
  showSelectionControls?: boolean;
}

export function FacebookPageManager({ 
  onPagesSelected, 
  showSelectionControls = true 
}: FacebookPageManagerProps) {
  const { pages: contextPages, refreshPages, isConnected } = useFacebook();
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  // Initialize from context pages and add selection state
  useEffect(() => {
    const pagesWithSelection = contextPages.map((page: FacebookPage) => ({
      ...page,
      selected: false
    }));
    setPages(pagesWithSelection);
  }, [contextPages]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshPages();
      toast({
        title: "Pages Refreshed",
        description: "Your Facebook pages have been refreshed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh Facebook pages",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const togglePageSelection = (pageId: string) => {
    const updatedPages = pages.map(page => 
      page.id === pageId ? { ...page, selected: !page.selected } : page
    );
    
    setPages(updatedPages);
    
    if (onPagesSelected) {
      onPagesSelected(updatedPages.filter(page => page.selected));
    }
  };

  const selectAllPages = () => {
    const updatedPages = pages.map(page => ({ ...page, selected: true }));
    setPages(updatedPages);
    
    if (onPagesSelected) {
      onPagesSelected(updatedPages);
    }
  };

  const deselectAllPages = () => {
    const updatedPages = pages.map(page => ({ ...page, selected: false }));
    setPages(updatedPages);
    
    if (onPagesSelected) {
      onPagesSelected([]);
    }
  };

  if (loading && !refreshing) {
    return (
      <div className="flex justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="text-center py-6 text-slate-500">
        Please connect your Facebook account first.
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <SiFacebook className="text-blue-600" />
              Facebook Pages
            </CardTitle>
            <CardDescription>
              {pages.length > 0 
                ? `You have ${pages.length} connected Facebook ${pages.length === 1 ? 'page' : 'pages'}`
                : "No Facebook pages connected"}
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {pages.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            No Facebook pages found. Connect your Facebook account to see your pages.
          </div>
        ) : (
          <>
            {showSelectionControls && (
              <div className="flex justify-end mb-3 space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={selectAllPages}
                  className="text-xs"
                >
                  Select All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={deselectAllPages}
                  className="text-xs"
                >
                  Deselect All
                </Button>
              </div>
            )}
            
            <div className="space-y-2">
              {pages.map(page => (
                <div 
                  key={page.id} 
                  className="flex items-center border rounded-md p-3 bg-white"
                >
                  {showSelectionControls && (
                    <Checkbox
                      id={`page-${page.id}`}
                      checked={page.selected}
                      onCheckedChange={() => togglePageSelection(page.id)}
                      className="mr-3"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium">{page.name}</h3>
                    <p className="text-xs text-slate-500">{page.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 