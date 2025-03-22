# Social Scribe

A tool for managing and automating social media content creation and posting.

## Facebook Integration

This project includes tools for posting content to Facebook Pages. Follow these steps to set up:

### 1. Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Select "Business" app type
4. Enter app details and create the app
5. Note your App ID and App Secret

### 2. Configure Facebook Login

1. In your app dashboard, go to "Add Products"
2. Add "Facebook Login" product
3. In Facebook Login settings, add the following redirect URI:
   - `http://localhost:3000/auth/callback`
4. Save changes

### 3. Setup Environment Variables

1. Copy `.env.example` to `.env`
2. Add your Facebook App ID and App Secret:
   ```
   FACEBOOK_APP_ID=your_app_id_here
   FACEBOOK_APP_SECRET=your_app_secret_here
   ```

### 4. Get User Access Token

Run the Facebook login script to authenticate and get a long-lived access token:

```bash
node scripts/facebook-login.js
```

This will:
1. Open a browser window with a login button
2. Redirect to Facebook for authentication
3. Request permission to manage your Pages
4. Save the token to your `.env` file

### 5. Post Content to Facebook

After authenticating, you can post content to your Facebook Pages:

```bash
# Show random content without posting (dry run)
node scripts/post-to-facebook.js

# Post random content 
node scripts/post-to-facebook.js --force

# Post specific content (index 0-4)
node scripts/post-to-facebook.js 2 --force
```

## Available Scripts

- `node scripts/facebook-login.js` - Authenticate with Facebook and get access token
- `node scripts/post-to-facebook.js` - Post content to Facebook Pages

## Environment Variables

| Variable | Description |
|----------|-------------|
| FACEBOOK_APP_ID | Your Facebook App ID |
| FACEBOOK_APP_SECRET | Your Facebook App Secret |
| FACEBOOK_USER_ACCESS_TOKEN | User access token (set automatically by login script) |
| FACEBOOK_TOKEN_EXPIRES | Expiration date of the token (set automatically) |

## Token Information

The Facebook login script will:
1. Get a short-lived token (lasts ~2 hours)
2. Exchange it for a long-lived token (lasts ~60 days)
3. Save the token and expiration date to your `.env` file

When the token expires, simply run the login script again to refresh it.

## Troubleshooting

- **Error: No pages found** - Ensure your Facebook account has admin access to at least one Facebook Page
- **Authentication errors** - Check that your App ID and App Secret are correct in the `.env` file
- **Permission errors** - Your app may need to be reviewed by Facebook for some permissions 