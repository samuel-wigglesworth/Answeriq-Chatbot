# ⚡ Quick Start - 5 Minutes to Deployment

Get AnswerIQ running on Cloudflare in 5 minutes.

## Prerequisites ✓

- Cloudflare account (free): [Sign up](https://dash.cloudflare.com/sign-up)
- Node.js installed: [Download](https://nodejs.org/)

## Step 1: Install Wrangler (1 min)

```powershell
npm install -g wrangler
```

## Step 2: Login (1 min)

```powershell
wrangler login
```

Browser will open → Click "Allow"

## Step 3: Deploy Backend (1 min)

```powershell
cd Chatbot
wrangler deploy
```

**Copy the URL shown**, e.g.:
```
https://answeriq-chatbot.your-name.workers.dev
```

## Step 4: Deploy Frontend (1 min)

```powershell
wrangler pages deploy . --project-name=answeriq
```

**Copy the Pages URL shown**, e.g.:
```
https://answeriq.pages.dev
```

## Step 5: Connect Them (1 min)

1. Open your Pages URL in browser
2. Click **⚙ Settings** button
3. Paste your Worker URL (from Step 3)
4. Click **Save**

## Step 6: Test It! 🎉

1. Enter a question:
   ```
   What causes rain?
   ```

2. Reference answer:
   ```
   Rain is caused by water vapor condensing in clouds and falling due to gravity.
   ```

3. Your answer:
   ```
   Rain happens when water in clouds gets heavy and falls.
   ```

4. Click **✦ Evaluate My Answer**

You should see a score! 🎉

---

## Optional: Add AI Suggestions

For smarter suggestions, add a Gemini API key:

1. Get free key: [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Set as secret:
   ```powershell
   wrangler secret put GEMINI_API_KEY
   ```
3. Paste your key when prompted

---

## Troubleshooting

### "Failed to fetch" error
→ Check API URL in Settings matches your Worker URL

### "Wrangler not found"
→ Run: `npm install -g wrangler`

### Deployment fails
→ Make sure you're logged in: `wrangler login`

---

## What's Next?

- 📖 Read [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md) for advanced config
- 🧪 Test locally: `wrangler dev`
- 📊 View logs: `wrangler tail answeriq-chatbot`
- 🎨 Customize `styles.css` for your branding
- 🌐 Add custom domain in Cloudflare dashboard

---

## Commands Cheat Sheet

```powershell
# Deploy backend
wrangler deploy

# Deploy frontend
wrangler pages deploy . --project-name=answeriq

# Local development
wrangler dev

# View logs
wrangler tail answeriq-chatbot

# Set secret
wrangler secret put GEMINI_API_KEY

# Test worker
.\test-worker.ps1
```

---

## Need Help?

- 📚 [Full Documentation](./CLOUDFLARE_DEPLOYMENT.md)
- 🔧 [Migration Notes](./MIGRATION_NOTES.md)
- 💬 [Cloudflare Community](https://community.cloudflare.com/)

**Total time**: 5 minutes  
**Total cost**: $0  
**Total fun**: 100% 🚀
