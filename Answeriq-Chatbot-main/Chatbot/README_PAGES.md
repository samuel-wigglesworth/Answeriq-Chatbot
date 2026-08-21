# AnswerIQ - AI-Powered Subjective Answer Evaluator

> Score any subjective answer with AI precision. Built for Cloudflare Pages with serverless evaluation.

[![Deploy to Cloudflare Pages](https://img.shields.io/badge/Deploy%20to-Cloudflare%20Pages-orange?logo=cloudflare)](https://pages.cloudflare.com)

## ✨ Features

- 🎯 **AI-Powered Scoring**: Advanced TF-IDF semantic similarity analysis
- 📊 **Detailed Breakdown**: Accuracy, Completeness, Clarity, and Depth metrics
- 💡 **Smart Suggestions**: Actionable improvement recommendations
- 🔍 **Missing Concepts**: Identifies key points you missed
- 🤖 **Gemini AI Integration**: Optional enhanced suggestions via Google Gemini
- ⚡ **Serverless**: Runs on Cloudflare Pages Functions (no servers!)
- 🌍 **Global CDN**: Sub-100ms load times worldwide
- 🎨 **Modern UI**: Dark theme with gradient animations

## 🚀 Quick Deploy

### Option 1: One-Click Deploy (Easiest)

1. Fork this repository
2. Visit [Cloudflare Pages](https://dash.cloudflare.com)
3. Click **Create application** → **Pages** → **Connect to Git**
4. Select your forked repository
5. Set **Build output directory** to `public`
6. Click **Save and Deploy**

Done! Your app will be live at `https://your-project.pages.dev`

### Option 2: Direct Upload

1. Download this repository
2. Go to [Cloudflare Pages](https://dash.cloudflare.com)
3. Click **Create application** → **Pages** → **Direct Upload**
4. Upload the `Chatbot` folder
5. Deploy!

### Option 3: CLI Deploy

```bash
# Install Wrangler
npm install -g wrangler

# Login
wrangler login

# Deploy
cd Chatbot
npx wrangler pages deploy public --project-name=answeriq
```

## 📁 Project Structure

```
Chatbot/
├── public/                  # Frontend (static files)
│   ├── index.html          # Main page
│   ├── styles.css          # Styling
│   └── app.js              # Client-side logic
│
├── functions/              # Backend (serverless)
│   └── api/
│       └── evaluate.js     # Evaluation API (/api/evaluate)
│
└── CLOUDFLARE_PAGES_DEPLOYMENT.md  # Detailed deployment guide
```

## 🔧 Configuration

### Adding Gemini AI (Optional)

For enhanced AI-powered suggestions:

1. Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. In Cloudflare Dashboard → Your Pages Project → **Settings** → **Environment variables**
3. Add variable:
   - Name: `GEMINI_API_KEY`
   - Value: Your API key
4. Redeploy (or wait for next deployment)

**Alternatively**, users can enter their Gemini key in the Settings modal (stored locally in browser).

### Custom Domain

1. Go to **Custom domains** in your Pages project
2. Add your domain (e.g., `answeriq.yourdomain.com`)
3. Configure DNS as instructed
4. Wait for automatic SSL provisioning

## 💻 Local Development

### Option 1: Simple HTTP Server

```bash
cd Chatbot/public
python -m http.server 8000
# or
npx serve
```

Then visit `http://localhost:8000`

**Note:** The `/api/evaluate` endpoint won't work locally with this method.

### Option 2: Wrangler Dev (Full local environment)

```bash
cd Chatbot
npx wrangler pages dev public
```

This runs both frontend and Functions locally.

## 🧪 How It Works

### Evaluation Algorithm

1. **Text Preprocessing**: Tokenization, stopword removal, normalization
2. **TF-IDF Vectorization**: Converts text to numerical vectors
3. **Cosine Similarity**: Measures semantic similarity between reference and user answer
4. **Multi-Metric Scoring**:
   - **Accuracy** (40%): Semantic similarity to reference
   - **Completeness** (30%): Coverage of key concepts
   - **Clarity** (15%): Sentence structure and readability
   - **Depth** (15%): Vocabulary richness and detail
5. **Missing Concepts Detection**: N-gram analysis to identify omitted topics
6. **Suggestion Generation**: Rule-based + optional AI-enhanced recommendations

### Technology Stack

**Frontend:**
- Vanilla JavaScript (no frameworks)
- Modern CSS with gradients and animations
- LocalStorage for settings persistence

**Backend:**
- Cloudflare Pages Functions (serverless)
- TF-IDF implementation in pure JavaScript
- Optional Gemini AI integration
- CORS-enabled REST API

**Infrastructure:**
- Cloudflare Pages (hosting + CDN)
- Cloudflare Workers Runtime (V8 isolates)
- Global edge network (300+ locations)

## 📊 API Reference

### POST /api/evaluate

Evaluates a subjective answer against a reference answer.

**Request Body:**
```json
{
  "question": "What are the causes of climate change?",
  "reference_answer": "Climate change is primarily caused by...",
  "user_answer_1": "Climate change happens because...",
  "gemini_api_key": "AIza..." // optional
}
```

**Response:**
```json
{
  "score": 7,
  "grade": "Good",
  "summary": "Your answer demonstrates solid understanding...",
  "breakdown": [
    { "name": "Accuracy", "score": "8/10" },
    { "name": "Completeness", "score": "7/10" },
    { "name": "Clarity", "score": "9/10" },
    { "name": "Depth", "score": "6/10" }
  ],
  "suggestions": [
    "✓ Add missing key concepts: greenhouse gases, deforestation...",
    "✓ Include specific examples to strengthen your explanation"
  ],
  "missing_points": ["greenhouse gases", "fossil fuels", "deforestation"],
  "similarity": 0.7234
}
```

## 🎯 Use Cases

- **Students**: Practice exam questions and get instant feedback
- **Teachers**: Provide automated preliminary feedback at scale
- **Self-learners**: Validate understanding of complex topics
- **Interview prep**: Practice technical and behavioral questions
- **Content writers**: Compare drafts against guidelines

## 🌟 Performance

- **Cold start**: ~50ms (Workers are always warm)
- **Evaluation time**: 100-300ms (depending on text length)
- **Global latency**: <100ms from any location
- **Scalability**: Handles 1000s of concurrent requests
- **Cost**: Free tier covers most use cases (500 builds/month, unlimited requests)

## 🔒 Privacy & Security

- ✅ No data persistence (evaluation happens in-memory)
- ✅ HTTPS by default
- ✅ DDoS protection included
- ✅ API keys encrypted (when using environment variables)
- ✅ User data stays in browser (LocalStorage only)
- ⚠️ Gemini API calls: If you provide an API key, your questions/answers are sent to Google's API

## 🛠️ Customization

### Styling
Edit `public/styles.css` to change colors, fonts, or layout.

### Scoring Weights
Edit `functions/api/evaluate.js` and modify the composite score calculation:
```javascript
const composite = (
  accuracyRaw * 0.40 +      // Change these weights
  completenessRaw * 0.30 +
  clarity * 0.15 +
  depth * 0.15
);
```

### Suggestion Logic
Customize suggestion rules in `buildSuggestions()` function in `functions/api/evaluate.js`.

## 📝 License

MIT License - feel free to use in your projects!

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 🐛 Troubleshooting

**"Method not allowed" error:**
- Ensure you're making a POST request to `/api/evaluate`

**API not responding:**
- Check browser console for errors
- Verify `functions/api/evaluate.js` is deployed
- Check Functions logs in Cloudflare Dashboard

**Gemini suggestions not working:**
- Verify API key is correct
- Check if you've exceeded free tier quota
- View Functions logs for detailed error messages

## 📚 Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages)
- [Pages Functions Guide](https://developers.cloudflare.com/pages/functions)
- [Gemini API Docs](https://ai.google.dev/gemini-api/docs)
- [TF-IDF Explanation](https://en.wikipedia.org/wiki/Tf%E2%80%93idf)

## 💬 Support

- [Cloudflare Community](https://community.cloudflare.com)
- [GitHub Issues](https://github.com/yourusername/answeriq/issues)
- [Cloudflare Discord](https://discord.gg/cloudflaredev)

---

**Built with ❤️ for students, by students**

Deploy now and start evaluating answers with AI precision! 🚀
