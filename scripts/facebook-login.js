#!/usr/bin/env node

import express from 'express';
import fetch from 'node-fetch';
import open from 'open';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables from .env file in project root
config({ path: path.join(rootDir, '.env') });

// Configuration
const PORT = 3000;
const CLIENT_ID = process.env.FACEBOOK_APP_ID;
const CLIENT_SECRET = process.env.FACEBOOK_APP_SECRET;
const REDIRECT_URI = `http://localhost:${PORT}/auth/callback`;
const SCOPES = ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list', 'public_profile'];

// Generate state parameter to prevent CSRF
const state = crypto.randomBytes(16).toString('hex');

// Create Express app
const app = express();

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Facebook Login</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
          background-color: #f0f2f5;
        }
        .container {
          background-color: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          text-align: center;
          max-width: 500px;
        }
        h1 {
          color: #1877f2;
        }
        p {
          color: #333;
          margin-bottom: 1.5rem;
        }
        .login-btn {
          background-color: #1877f2;
          color: white;
          border: none;
          padding: 0.8rem 1.2rem;
          border-radius: 6px;
          font-weight: bold;
          cursor: pointer;
          font-size: 1rem;
          text-decoration: none;
          display: inline-block;
        }
        .login-btn:hover {
          background-color: #166fe5;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Social Scribe</h1>
        <p>Connect your Facebook account to post content to your Pages</p>
        <a href="/auth/facebook" class="login-btn">Login with Facebook</a>
      </div>
    </body>
    </html>
  `);
});

app.get('/auth/facebook', (req, res) => {
  // Redirect the user to Facebook's authorization page
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}&scope=${SCOPES.join(',')}`;
  res.redirect(authUrl);
});

app.get('/auth/callback', async (req, res) => {
  const { code, state: returnedState } = req.query;
  
  // Verify state to prevent CSRF attacks
  if (returnedState !== state) {
    return res.status(400).send('Invalid state parameter. Possible CSRF attack.');
  }
  
  if (!code) {
    return res.status(400).send('Authorization code not received from Facebook');
  }
  
  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_secret=${CLIENT_SECRET}&code=${code}`,
      { method: 'GET' }
    );
    
    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      throw new Error(`Failed to get access token: ${error.error?.message || 'Unknown error'}`);
    }
    
    const { access_token, expires_in } = await tokenResponse.json();
    
    // Get long-lived token (60 days vs 1-2 hours)
    const longLivedTokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&fb_exchange_token=${access_token}`,
      { method: 'GET' }
    );
    
    if (!longLivedTokenResponse.ok) {
      const error = await longLivedTokenResponse.json();
      throw new Error(`Failed to get long-lived token: ${error.error?.message || 'Unknown error'}`);
    }
    
    const { access_token: longLivedToken, expires_in: longLivedExpiry } = await longLivedTokenResponse.json();
    
    // Get user information
    const userInfoResponse = await fetch(
      `https://graph.facebook.com/me?fields=name,id&access_token=${longLivedToken}`,
      { method: 'GET' }
    );
    
    if (!userInfoResponse.ok) {
      const error = await userInfoResponse.json();
      throw new Error(`Failed to get user info: ${error.error?.message || 'Unknown error'}`);
    }
    
    const userInfo = await userInfoResponse.json();
    
    // Get user's pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${longLivedToken}`,
      { method: 'GET' }
    );
    
    if (!pagesResponse.ok) {
      const error = await pagesResponse.json();
      throw new Error(`Failed to get pages: ${error.error?.message || 'Unknown error'}`);
    }
    
    const pagesData = await pagesResponse.json();
    const pages = pagesData.data || [];
    
    // Update .env file with the token
    const envPath = path.join(rootDir, '.env');
    let envContent = '';
    
    try {
      envContent = fs.readFileSync(envPath, 'utf8');
    } catch (err) {
      console.warn('No existing .env file found, creating a new one.');
    }
    
    // Replace or add the token in .env
    const newEnvContent = updateEnvContent(envContent, {
      FACEBOOK_USER_ACCESS_TOKEN: longLivedToken,
      FACEBOOK_TOKEN_EXPIRES: new Date(Date.now() + longLivedExpiry * 1000).toISOString()
    });
    
    fs.writeFileSync(envPath, newEnvContent);
    
    // Show success page with information
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Login Successful</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            background-color: #f0f2f5;
          }
          .container {
            background-color: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            text-align: center;
            max-width: 700px;
            width: 100%;
          }
          h1 {
            color: #1877f2;
          }
          .success-icon {
            color: #4BB543;
            font-size: 3rem;
            margin-bottom: 1rem;
          }
          .user-info {
            margin: 1rem 0;
            padding: 1rem;
            background-color: #f9f9f9;
            border-radius: 6px;
            text-align: left;
          }
          .pages-list {
            margin: 1rem 0;
            text-align: left;
          }
          .page-item {
            padding: 0.5rem;
            margin: 0.5rem 0;
            background-color: #f0f2f5;
            border-radius: 4px;
          }
          .token-info {
            margin: 1rem 0;
            padding: 1rem;
            background-color: #f9f9f9;
            border-radius: 6px;
            text-align: left;
          }
          .close-btn {
            background-color: #1877f2;
            color: white;
            border: none;
            padding: 0.8rem 1.2rem;
            border-radius: 6px;
            font-weight: bold;
            cursor: pointer;
            font-size: 1rem;
            margin-top: 1rem;
          }
          .close-btn:hover {
            background-color: #166fe5;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">✓</div>
          <h1>Login Successful!</h1>
          
          <div class="user-info">
            <h3>User Information</h3>
            <p><strong>Name:</strong> ${userInfo.name}</p>
            <p><strong>ID:</strong> ${userInfo.id}</p>
          </div>
          
          <div class="pages-list">
            <h3>Connected Pages (${pages.length})</h3>
            ${pages.map(page => `
              <div class="page-item">
                <strong>${page.name}</strong> (ID: ${page.id})
              </div>
            `).join('')}
          </div>
          
          <div class="token-info">
            <h3>Access Token</h3>
            <p>A long-lived access token has been saved to your .env file.</p>
            <p><strong>Expires:</strong> in ${Math.floor(longLivedExpiry/60/60/24)} days</p>
          </div>
          
          <p>You can now close this window and use the script to post content to Facebook.</p>
          <button class="close-btn" onclick="window.close()">Close Window</button>
        </div>
      </body>
      </html>
    `);
    
    // Wait a moment then shut down the server
    setTimeout(() => {
      console.log('\nLogin successful! Server shutting down...');
      console.log('Token has been saved to your .env file.');
      console.log(`Token expires in ${Math.floor(longLivedExpiry/60/60/24)} days.`);
      server.close(() => {
        process.exit(0);
      });
    }, 30000); // Give 30 seconds before shutting down
    
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).send(`
      <html>
        <head>
          <title>Authentication Error</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
            .error { color: red; }
          </style>
        </head>
        <body>
          <h1 class="error">Authentication Error</h1>
          <p>${error.message}</p>
          <p><a href="/">Try Again</a></p>
        </body>
      </html>
    `);
  }
});

// Helper function to update .env content
function updateEnvContent(content, vars) {
  const lines = content.split('\n');
  const updatedVars = { ...vars };
  
  // Update existing variables
  const updatedLines = lines.map(line => {
    const match = line.match(/^(FACEBOOK_USER_ACCESS_TOKEN|FACEBOOK_TOKEN_EXPIRES)=(.*)$/);
    if (match) {
      const varName = match[1];
      if (updatedVars[varName] !== undefined) {
        const newLine = `${varName}=${updatedVars[varName]}`;
        delete updatedVars[varName];
        return newLine;
      }
    }
    return line;
  });
  
  // Add new variables
  Object.entries(updatedVars).forEach(([key, value]) => {
    updatedLines.push(`${key}=${value}`);
  });
  
  return updatedLines.join('\n');
}

// Start the server
const server = app.listen(PORT, () => {
  console.log(`
==========================================================
Facebook Login Server
==========================================================
Server running at: http://localhost:${PORT}

This utility helps you authenticate with Facebook to obtain
a user access token for posting to your Facebook pages.

1. Make sure you've added the following to your .env file:
   - FACEBOOK_APP_ID=your_app_id
   - FACEBOOK_APP_SECRET=your_app_secret

2. Your browser will open automatically to start the login.
   If it doesn't, visit: http://localhost:${PORT}

3. After successful login, the token will be saved to your
   .env file for use with the post-to-facebook.js script.

Press Ctrl+C to cancel at any time.
==========================================================
`);

  // Open the browser
  open(`http://localhost:${PORT}`);
});

// Handle termination
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.close(() => {
    process.exit(0);
  });
}); 