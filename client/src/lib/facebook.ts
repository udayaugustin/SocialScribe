import { apiRequest } from "./queryClient";

// Facebook SDK initialization
export function initFacebookSDK() {
  return new Promise<void>((resolve) => {
    // Load Facebook SDK
    window.fbAsyncInit = function() {
      FB.init({
        appId: import.meta.env.VITE_FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      });
      resolve();
    };

    // Load SDK asynchronously
    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s); js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode?.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  });
}

// Handle Facebook Login
export async function loginWithFacebook(): Promise<boolean> {
  return new Promise((resolve) => {
    FB.login(async (response) => {
      if (response.authResponse) {
        // Send access token to backend
        try {
          await apiRequest("POST", "/api/auth/facebook", {
            accessToken: response.authResponse.accessToken
          });
          resolve(true);
        } catch (error) {
          console.error("Error saving Facebook token:", error);
          resolve(false);
        }
      } else {
        resolve(false);
      }
    }, { scope: 'pages_manage_posts,pages_read_engagement' });
  });
}

// Check if user is connected to Facebook
export function checkFacebookLoginStatus(): Promise<boolean> {
  return new Promise((resolve) => {
    FB.getLoginStatus((response) => {
      resolve(response.status === 'connected');
    });
  });
}
