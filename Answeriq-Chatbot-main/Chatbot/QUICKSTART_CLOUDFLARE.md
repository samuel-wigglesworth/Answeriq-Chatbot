# ⚡ Quick Start - Cloudflare Pages Deployment

Deploy AnswerIQ to Cloudflare Pages in under 5 minutes!

## 🎯 Prerequisites

- A Cloudflare account (free tier is enough)
- Your project files ready

## 🚀 Deploy in 3 Steps

### Step 1: Prepare Your Files

Ensure your folder structure looks like this:

```
Chatbot/
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
└── functions/
    └── api/
        └── evaluate.js
```

✅ **All files are already set up in the correct structure!**

### Step 2: Deploy to Cloudflare Pages

#### Method A: GitHub Integration (Recommended)

1. **Push to GitHub:**
   ```bash
   cd Chatbot
   git init
   git add .
   git commit -m "Deploy AnswerIQ"
   git remote add origin https://github.com/YOUR_USERNAME/answeriq.git
   git push -u origin main
   ```

2. **Connect to Cloudflare:**
   - Visit [dash.cloudflare.com](https://dash.cloudflare.com)
   - Go to **Workers & Pages** → **Create application** → **Pages**
   - Click **Connect to Git**
   - Select your repository
   - Set **Build output directory**: `public`
   - Click **Save and Deploy**

#### Method B: Direct Upload (Fastest)

1. **Go to Cloudflare Dashboard:**
   - Visit [dash.cloudflare.com](https://dash.cloudflare.com)
   - Navigate to **Workers & Pages** → **Create application** → **Pages**

2. **Upload:**
   - Choose **Direct Upload**
   - Drag and drop your `Chatbot` folder (or use file picker)
   - Click **Deploy**

#### Method C: CLI (For Developers)

```bash
# Install Wrangler globally
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy from Chatbot directory
cd Chatbot
npx wrangler pages deploy public --project-name=answeriq-chatbot
```

### Step 3: Test Your Deployment

1. **Get Your URL:**
   - Cloudflare will provide a URL like: `https://answeriq-chatbot.pages.dev`

2. **Test the App:**
   - Open the URL in your browser
   - Enter a question: "What is photosynthesis?"
   - Enter reference answer: "Photosynthesis is the process by which plants convert light energy into chemical energy..."
   - Enter your answer and click **Evaluate My Answer**
   - View your score and suggestions!

## 🎉 You're Live!

Your app is now deployed on Cloudflare's global network with:
- ✅ Automatic HTTPS
- ✅ Global CDN (300+ locations)
- ✅ Serverless evaluation API
- ✅ Zero maintenance
- ✅ Free tier (unlimited requests!)

## 🔧 Optional: Add Gemini AI

For enhanced AI suggestions:

1. **Get API Key:**
   - Visit [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
   - Create a free API key

2. **Add to Cloudflare:**
   - Go to your Pages project
   - Navigate to **Settings** → **Environment variables**
   - Add new variable:
     - **Name**: `GEMINI_API_KEY`
     - **Value**: Your API key
   - Click **Save**

3. **Redeploy:**
   - Go to **Deployments**
   - Click **...** on latest deployment → **Retry deployment**

## 📱 Share Your App

Share your Cloudflare Pages URL with:
- Students who need practice
- Teachers who want automated feedback
- Anyone learning new topics!

## 🛠️ Next Steps

- **Custom Domain**: Add your own domain in **Custom domains**
- **Analytics**: Monitor usage in **Analytics** tab
- **Customize**: Edit `public/styles.css` to change the design
- **API Tweaks**: Modify `functions/api/evaluate.js` to adjust scoring

## ❓ Troubleshooting

**Problem: API returns 404**
- Solution: Ensure `functions/api/evaluate.js` exists and was uploaded

**Problem: "Method not allowed"**
- Solution: The API expects POST requests, not GET

**Problem: No score returned**
- Solution: Check browser console (F12) for errors
- Check Functions logs in Cloudflare Dashboard

**Problem: Slow responses**
- Solution: First request might take ~1s, subsequent requests are <200ms

## 📚 More Resources

- [Full Deployment Guide](./CLOUDFLARE_PAGES_DEPLOYMENT.md)
- [Complete README](./README_PAGES.md)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages)

## 💬 Need Help?

- [Cloudflare Community](https://community.cloudflare.com)
- [Cloudflare Discord](https://discord.gg/cloudflaredev)
- Check GitHub Issues

---

**🚀 Happy Deploying!**

Total time: ~5 minutes ⏱️
