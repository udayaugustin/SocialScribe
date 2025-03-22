import { apiRequest } from "./queryClient";

// Facebook SDK types
declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: {
      init(options: {
        appId: string;
        cookie: boolean;
        xfbml: boolean;
        version: string;
      }): void;
      login(
        callback: (response: { authResponse?: { accessToken: string } }) => void, 
        options: { scope: string }
      ): void;
      getLoginStatus(
        callback: (response: { status: string }) => void
      ): void;
      api(
        path: string,
        callback: (response: any) => void
      ): void;
    };
  }
}

interface FacebookPage {
  id: string;
  name: string;
  category: string;
}

interface FacebookLoginResponse {
  success: boolean;
  message?: string;
  pages?: FacebookPage[];
  tokenExpires?: string;
}

// Facebook SDK initialization
export async function initFacebookSDK() {
  // First, fetch the App ID from server
  let appId;
  try {
    console.log("Fetching Facebook config from server...");
    const configResponse = await apiRequest("GET", "/api/config/facebook", undefined);
    const configData = await configResponse.json();
    appId = configData.appId;
    
    console.log("Received App ID from server:", appId);
    
    if (!appId) {
      console.error("Facebook App ID not found in server config");
      throw new Error("Facebook App ID not available");
    }
  } catch (error) {
    console.error("Error fetching Facebook config:", error);
    throw new Error("Failed to get Facebook configuration");
  }

  // Set a timeout to prevent infinite waiting for SDK to load
  const loadTimeout = 10000; // 10 seconds
  
  return new Promise<void>((resolve, reject) => {
    // Create a timeout to handle SDK loading failures
    const timeoutId = setTimeout(() => {
      reject(new Error("Facebook SDK initialization timed out. Please check your network connection."));
    }, loadTimeout);
    
    // Load Facebook SDK
    window.fbAsyncInit = function() {
      try {
        // Clear the timeout since SDK loaded
        clearTimeout(timeoutId);
        
        console.log("Initializing Facebook SDK with App ID:", appId);
        window.FB.init({
          appId: appId,
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        });
        console.log("Facebook SDK initialized successfully");
        resolve();
      } catch (error) {
        clearTimeout(timeoutId);
        console.error("Error in Facebook SDK initialization:", error);
        reject(error);
      }
    };

    // Load SDK asynchronously
    try {
      (function(d: Document, s: string, id: string) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {
          console.log("Facebook SDK script already loaded");
          return;
        }
        js = d.createElement(s) as HTMLScriptElement;
        js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        js.onerror = function() {
          clearTimeout(timeoutId);
          console.error("Failed to load Facebook SDK script");
          reject(new Error("Failed to load Facebook SDK script"));
        };
        console.log("Loading Facebook SDK script...");
        fjs.parentNode?.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("Error loading Facebook SDK script:", error);
      reject(error);
    }
  });
}

// Handle Facebook Login
export async function loginWithFacebook(): Promise<FacebookLoginResponse> {
  console.log("Starting Facebook login process...");
  
  // Check if FB SDK is loaded
  if (!window.FB) {
    console.error("Facebook SDK not loaded. Make sure to call initFacebookSDK first.");
    return {
      success: false,
      message: "Facebook SDK not initialized. Please refresh and try again."
    };
  }
  
  return new Promise<FacebookLoginResponse>((resolve) => {
    try {
      console.log("Calling FB.login...");
      window.FB.login(function(response) {
        console.log("Facebook login response:", response);
        
        if (!response || !response.authResponse) {
          console.error("Facebook login failed or was cancelled by the user");
          resolve({
            success: false,
            message: "Facebook login was cancelled or failed"
          });
          return;
        }
        
        const accessToken = response.authResponse.accessToken;
        console.log("Got access token, sending to backend...");
        
        // Use a regular function instead of an async one for the callback
        apiRequest("POST", "/api/auth/facebook", {
          accessToken: accessToken
        })
          .then(apiResponse => apiResponse.json())
          .then(data => {
            console.log("Backend authentication response:", data);
            
            // Check if the response indicates success
            if (data && data.success === true) {
              resolve({
                success: true,
                pages: data.pages || [],
                tokenExpires: data.tokenExpires
              });
            } else {
              // Handle error response from the server
              const errorMessage = data && data.message 
                ? data.message 
                : "Unknown error from server";
                
              console.error("Server returned error:", errorMessage);
              resolve({
                success: false,
                message: errorMessage
              });
            }
          })
          .catch(error => {
            console.error("Error saving Facebook token:", error);
            resolve({
              success: false,
              message: error.message || "Error saving Facebook token"
            });
          });
      }, { scope: 'pages_manage_posts,pages_read_engagement' });
    } catch (error: any) {
      console.error("Exception during Facebook login:", error);
      resolve({
        success: false,
        message: `Facebook login error: ${error.message || "Unknown error"}`
      });
    }
  });
}

// Check if user is connected to Facebook
export function checkFacebookLoginStatus(): Promise<boolean> {
  console.log("Checking Facebook login status...");
  
  // Check if FB SDK is loaded
  if (!window.FB) {
    console.error("Facebook SDK not loaded when checking login status");
    return Promise.resolve(false);
  }
  
  return new Promise((resolve) => {
    try {
      window.FB.getLoginStatus((response) => {
        console.log("Facebook login status:", response);
        resolve(response.status === 'connected');
      });
    } catch (error) {
      console.error("Error checking Facebook login status:", error);
      resolve(false);
    }
  });
}
