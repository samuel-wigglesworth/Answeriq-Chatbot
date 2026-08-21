# AnswerIQ Cloudflare Workers Deployment Guide

This guide will help you deploy AnswerIQ to **Cloudflare Workers** (backend) and **Cloudflare Pages** (frontend).

## 🎯 Overview

- **Backend**: JavaScript worker that evaluates answers using TF-IDF similarity (port of Python scikit-learn)
- **Frontend**: Static HTML/CSS/JS served via Cloudflare Pages
- **Optional**: Gemini API for AI-powered suggestions

---

## 📋 Prerequisites

1. **Cloudflare Account** - [Sign up free](https://dash.cloudflare.com/sign-up)
2. **Node.js & npm** - [Download](https://nodejs.org/)
3. **Wrangler CLI** - Cloudflare's deployment tool

---

## 🚀 Part 1: Deploy the Backend (Worker)

### Step 1: Install Wrangler

```powershell
npm install -g wrangler
```

### Step 2: Login to Cloudflare

```powershell
wrangler login
```

This will open your browser to authenticate.

### Step 3: (Optional) Add Gemini API Key

If you want AI-powered suggestions, get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

Then set it as a secret:

```powershell
wrangler secret put GEMINI_API_KEY
```

Paste your API key when prompted. This stores it securely.

> **Note**: The worker works WITHOUT Gemini API key - it just won't have AI suggestions.

### Step 4: Deploy the Worker

From the `Chatbot` directory:

```powershell
wrangler deploy
```

You'll see output like:

```
Published answeriq-chatbot (X.XX sec)
  https://answeriq-chatbot.your-subdomain.workers.dev
```

**Copy this URL** - you'll need it for the frontend!

### Step 5: Test the Worker

```powershell
curl -X POST https://answeriq-chatbot.your-subdomain.workers.dev `
  -H "Content-Type: application/json" `
  -d '{
    "question": "What is photosynthesis?",
    "reference_answer": "Photosynthesis is the process by which plants convert sunlight into energy.",
    "user_answer_1": "Plants use sunlight to make food."
  }'
```

You should get a JSON response with a score!

---

## 🌐 Part 2: Deploy the Frontend (Pages)

### Method A: Deploy via Wrangler (Recommended)

1. **Create a `wrangler.toml` for Pages** in the `Chatbot` directory:

```toml
name = "answeriq-frontend"
pages_build_output_dir = "."

[site]
bucket = "."
```

2. **Deploy**:

```powershell
wrangler pages deploy . --project-name=answeriq-frontend
```

### Method B: Deploy via Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click **Pages** → **Create a project** → **Upload assets**
3. Upload these files:
   - `index.html`
   - `app.js`
   - `styles.css`
4. Click **Save and Deploy**

---

## ⚙️ Part 3: Connect Frontend to Backend

### Option 1: Update via Settings UI (Easiest)

1. Open your deployed frontend URL (e.g., `https://answeriq-frontend.pages.dev`)
2. Click the **⚙ Settings** button
3. Enter your Worker URL: `https://answeriq-chatbot.your-subdomain.workers.dev`
4. (Optional) Add your Gemini API key if you didn't set it as a Worker secret
5. Click **Save**

### Option 2: Hardcode API URL (For Production)

Edit `index.html` and replace the meta tag:

```html
<meta name="evaluate-api-url" content="https://answeriq-chatbot.your-subdomain.workers.dev" />
```

Then redeploy Pages.

---

## 🧪 Testing Your Deployment

1. Visit your Pages URL
2. Fill in:
   - **Question**: "What causes rain?"
   - **Reference Answer**: "Rain is caused by water vapor condensing in clouds and falling due to gravity."
   - **Your Answer**: "Rain happens when water in clouds gets heavy and falls down."
3. Click **✦ Evaluate My Answer**
4. You should see a score with breakdown and suggestions!

---

## 🔧 Advanced Configuration

### Custom Domain

1. Go to **Pages** → Your project → **Custom domains**
2. Add your domain (e.g., `answeriq.yourdomain.com`)
3. Update DNS as instructed

### Rate Limiting (Recommended)

Add to `wrangler.toml`:

```toml
[[unsafe.bindings]]
name = "RATE_LIMITER"
type = "ratelimit"
namespace_id = "YOUR_NAMESPACE_ID"
simple = { limit = 100, period = 60 }
```

### Environment Variables

Set via Wrangler:

```powershell
wrangler secret put GEMINI_API_KEY          # Secure secret
wrangler secret put CUSTOM_CONFIG           # Any other secrets
```

### CORS Configuration

To restrict origins, edit `worker.js`:

```javascript
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://yourdomain.com', // Only your domain
  // ... rest of headers
};
```

---

## 📊 Monitoring & Debugging

### View Logs

```powershell
wrangler tail answeriq-chatbot
```

This shows real-time logs from your worker.

### Check Worker Metrics

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → `answeriq-chatbot`
3. View requests, errors, and performance

### Common Issues

#### ❌ "Failed to fetch"
- **Cause**: Frontend can't reach Worker
- **Fix**: Check API URL in Settings, ensure CORS is enabled

#### ❌ "Evaluation failed"
- **Cause**: Invalid input or Worker error
- **Fix**: Check `wrangler tail` logs for errors

#### ❌ Low scores on good answers
- **Cause**: Different terminology than reference
- **Fix**: Add Gemini API key for smarter evaluation

---

## 💰 Cost Estimates (Free Tier)

| Service | Free Tier | Typical Usage |
|---------|-----------|---------------|
| Workers | 100,000 requests/day | ✅ More than enough |
| Pages | 1 build/day, 500 builds/month | ✅ Plenty |
| Gemini API | 60 requests/minute | ✅ Generous |

**Total Cost**: **$0/month** for personal/student use! 🎉

---

## 🔐 Security Best Practices

1. **API Keys**: Always use `wrangler secret put`, never hardcode keys
2. **CORS**: Restrict to your domain in production
3. **Rate Limiting**: Implement to prevent abuse
4. **Input Validation**: Worker validates all inputs (already included)

---

## 📚 Additional Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [Google Gemini API](https://ai.google.dev/docs)
- [Original Project README](./README.md)

---

## 🆘 Need Help?

1. Check [Cloudflare Community](https://community.cloudflare.com/)
2. Review Worker logs: `wrangler tail`
3. Test locally first: See "Local Development" below

---

## 🛠️ Local Development (Optional)

Test Worker locally before deploying:

```powershell
# Install dependencies (none needed, but good practice)
npm init -y

# Start local dev server
wrangler dev

# Test at http://localhost:8787
```

Then update frontend Settings to `http://localhost:8787` for local testing.

---

## 🎉 You're Done!

Your AnswerIQ chatbot is now running on Cloudflare's global network with:
- ✅ Fast, serverless backend evaluation
- ✅ Static frontend with CDN delivery
- ✅ Optional AI-powered suggestions
- ✅ Zero cost for typical usage

**Deployed URLs**:
- Frontend: `https://answeriq-frontend.pages.dev` (or your custom domain)
- Backend: `https://answeriq-chatbot.your-subdomain.workers.dev`

---

## 📝 Quick Command Reference

```powershell
# Deploy Worker
wrangler deploy

# Deploy Pages
wrangler pages deploy . --project-name=answeriq-frontend

# View logs
wrangler tail answeriq-chatbot

# Set secret
wrangler secret put GEMINI_API_KEY

# Local development
wrangler dev
```

Happy deploying! 🚀
