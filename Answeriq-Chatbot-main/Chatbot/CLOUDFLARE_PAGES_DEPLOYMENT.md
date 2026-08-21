# Cloudflare Pages Deployment Guide

This guide walks you through deploying AnswerIQ to Cloudflare Pages using the "Create application" option in the Cloudflare dashboard.

## 📁 Project Structure

```
Chatbot/
├── public/              # Static frontend files (served directly)
│   ├── index.html       # Main HTML file
│   ├── styles.css       # Stylesheet
│   └── app.js           # Frontend JavaScript
├── functions/           # Cloudflare Pages Functions (serverless backend)
│   └── api/
│       └── evaluate.js  # Evaluation API endpoint (/api/evaluate)
└── README.md
```

## 🚀 Deployment Steps

### Option 1: Deploy via GitHub (Recommended)

1. **Push to GitHub**
   - Create a new GitHub repository
   - Push your `Chatbot` folder to the repository:
     ```bash
     cd Chatbot
     git init
     git add .
     git commit -m "Initial commit"
     git remote add origin https://github.com/yourusername/answeriq.git
     git push -u origin main
     ```

2. **Connect to Cloudflare Pages**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Navigate to **Workers & Pages** → **Create application** → **Pages**
   - Click **Connect to Git**
   - Authorize Cloudflare to access your GitHub account
   - Select your repository

3. **Configure Build Settings**
   - **Project name**: `answeriq-chatbot` (or your choice)
   - **Production branch**: `main`
   - **Build command**: Leave empty (not needed for static sites)
   - **Build output directory**: `public`
   - **Root directory**: Leave as `/` or set to `Chatbot` if repo contains multiple projects

4. **Deploy**
   - Click **Save and Deploy**
   - Cloudflare will automatically deploy your site
   - You'll get a URL like `https://answeriq-chatbot.pages.dev`

### Option 2: Deploy via Direct Upload

1. **Prepare Files**
   - Ensure your `public/` and `functions/` folders are ready
   - The structure should be:
     ```
     public/
       index.html
       styles.css
       app.js
     functions/
       api/
         evaluate.js
     ```

2. **Upload to Cloudflare Pages**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Navigate to **Workers & Pages** → **Create application** → **Pages**
   - Choose **Direct Upload**
   - Drag and drop your project folder or use the file picker
   - Upload the contents (both `public/` and `functions/` folders)
   - Click **Deploy**

### Option 3: Deploy via Wrangler CLI

1. **Install Wrangler**
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**
   ```bash
   wrangler login
   ```

3. **Deploy**
   ```bash
   cd Chatbot
   npx wrangler pages deploy public --project-name=answeriq-chatbot
   ```

## ⚙️ Configuration

### Environment Variables (Optional)

If you want to use Gemini AI for enhanced suggestions:

1. Go to your Pages project in Cloudflare Dashboard
2. Navigate to **Settings** → **Environment variables**
3. Add a new variable:
   - **Variable name**: `GEMINI_API_KEY`
   - **Value**: Your Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - **Environment**: Production (and Preview if needed)
4. Click **Save**
5. Redeploy your application (under **Deployments** → **View build**)

### Custom Domain (Optional)

1. Go to **Custom domains** in your Pages project
2. Click **Set up a custom domain**
3. Enter your domain (e.g., `answeriq.yourdomain.com`)
4. Follow the DNS configuration instructions
5. Wait for SSL certificate provisioning (automatic)

## 🧪 Testing Your Deployment

1. Open your Cloudflare Pages URL (e.g., `https://answeriq-chatbot.pages.dev`)
2. Enter a question, reference answer, and your answer
3. Click **Evaluate My Answer**
4. The `/api/evaluate` endpoint (Cloudflare Pages Function) will process the request

## 📊 How It Works

### Frontend (Static Files in `public/`)
- Served directly from Cloudflare's global CDN
- Ultra-fast load times worldwide
- Automatic HTTPS

### Backend (Pages Functions in `functions/`)
- The `functions/api/evaluate.js` file is automatically deployed as a serverless function
- Accessible at `/api/evaluate` endpoint
- Runs on Cloudflare Workers runtime (V8 isolates)
- Scales automatically with zero configuration

### API Flow
1. User submits answer via frontend
2. Frontend calls `/api/evaluate` (relative URL)
3. Pages Function processes the evaluation using TF-IDF algorithm
4. Optional: Calls Gemini API for AI-enhanced suggestions
5. Returns score, breakdown, and suggestions as JSON
6. Frontend displays results with animated UI

## 🔧 Troubleshooting

### API Not Working
- Check browser console for errors
- Verify the API endpoint is `/api/evaluate` (not localhost)
- Check Functions logs in Cloudflare Dashboard under **Functions** tab

### Build Fails
- Ensure `public/` folder exists with index.html
- Verify `functions/` folder has correct structure
- Check build logs in Cloudflare Dashboard

### Environment Variables Not Working
- Verify variable name is exactly `GEMINI_API_KEY`
- Ensure you've redeployed after adding the variable
- Check Functions logs for API errors

## 📈 Performance

- **Global CDN**: Content served from 300+ data centers worldwide
- **Zero cold starts**: Workers are always warm
- **Free tier**: 500 builds/month, unlimited requests
- **Bandwidth**: Unlimited on all plans

## 🔒 Security

- Automatic HTTPS with free SSL certificates
- DDoS protection included
- Environment variables encrypted at rest
- No servers to patch or maintain

## 📚 Additional Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages)
- [Pages Functions Docs](https://developers.cloudflare.com/pages/functions)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler)
- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)

## 💡 Next Steps

1. ✅ Deploy to Cloudflare Pages
2. 🔑 Add Gemini API key (optional)
3. 🌐 Set up custom domain (optional)
4. 📊 Monitor usage in Cloudflare Analytics
5. 🎨 Customize the UI in `public/index.html` and `public/styles.css`

---

**Need help?** Check the [Cloudflare Community](https://community.cloudflare.com) or [GitHub Issues](https://github.com/yourusername/answeriq/issues)
