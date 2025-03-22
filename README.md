# SocialScribe

SocialScribe is a full-stack web application for creating, managing, and automating social media content across multiple platforms including Facebook, Instagram, and LinkedIn. It uses AI to generate tailored content for each platform from a single set of notes.

## Features

- 🤖 **AI Content Generation**: Generate platform-specific content from a single set of notes
- 📱 **Multi-Platform Support**: Post to Facebook, Instagram, and LinkedIn
- 📊 **Facebook Integration**: Connect Facebook accounts, manage pages, and post directly
- 📝 **Content Management**: Create, edit, and manage your social media posts in one place
- 🎨 **Modern UI**: Clean, responsive user interface built with React and Tailwind CSS

## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Node.js, Express, PostgreSQL
- **AI**: Generated content using Gemini API
- **Authentication**: OAuth integration for social media platforms
- **API**: RESTful API design with proper error handling

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- Facebook Developer Account (for Facebook integration)
- Gemini API key (for AI content generation)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/SocialScribe.git
   cd SocialScribe
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your:
   - Database connection details
   - API keys
   - Facebook App credentials

4. Start the development server:
   ```bash
   # Start backend server
   npm run server:dev
   
   # In a separate terminal, start frontend
   npm run client:dev
   ```

5. Access the application at `http://localhost:5173`

## Facebook Integration

This project includes comprehensive tools for posting content to Facebook Pages:

### 1. Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Select "Business" app type
4. Enter app details and create the app
5. Note your App ID and App Secret

### 2. Configure Facebook Login

1. In your app dashboard, go to "Add Products"
2. Add "Facebook Login" product
3. In Facebook Login settings, configure:
   - Valid OAuth Redirect URIs: `http://localhost:5173`
   - Client OAuth Login: Enabled
   - Web OAuth Login: Enabled
   - Login with Facebook: Enabled
4. Under "Permissions and Features," request:
   - `pages_manage_posts`
   - `pages_read_engagement`
5. Save changes

### 3. Setup Environment Variables

Add your Facebook App ID and App Secret to the `.env` file:
```
FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_APP_SECRET=your_app_secret_here
```

### 4. Using the Application

1. Launch the application
2. Click "Connect Facebook" in the header
3. Authenticate with Facebook
4. Your connected pages will appear in the Facebook page manager
5. Select pages to post to when creating content

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # Utility functions and API clients
│   │   └── pages/          # Page components
├── server/                 # Backend Express application
│   ├── lib/                # Server utilities
│   ├── routes.ts           # API routes
│   └── storage.ts          # Database operations
├── scripts/                # Utility scripts
│   ├── facebook-login.js   # CLI tool for Facebook auth
│   └── post-to-facebook.js # CLI tool for Facebook posting
└── shared/                 # Shared TypeScript types
```

## Available Scripts

- `npm run client:dev` - Start the client development server
- `npm run server:dev` - Start the server development server
- `npm run dev` - Start both client and server (using concurrently)
- `npm run build` - Build the client and server for production
- `npm start` - Start the production server
- `node scripts/facebook-login.js` - Authenticate with Facebook and get access token
- `node scripts/post-to-facebook.js` - Post content to Facebook Pages

## Environment Variables

| Variable | Description |
|----------|-------------|
| PORT | Server port (default: 5001) |
| DATABASE_URL | PostgreSQL connection string |
| GEMINI_API_KEY | API key for Gemini AI |
| FACEBOOK_APP_ID | Your Facebook App ID |
| FACEBOOK_APP_SECRET | Your Facebook App Secret |
| FACEBOOK_USER_ACCESS_TOKEN | User access token (set automatically by login or UI) |
| FACEBOOK_TOKEN_EXPIRES | Expiration date of the token |
| SESSION_SECRET | Secret for session management |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [shadcn/ui](https://github.com/shadcn/ui) for the UI components
- [Gemini API](https://ai.google.dev/gemini-api) for AI content generation
- Facebook Developer Platform for social media integration 