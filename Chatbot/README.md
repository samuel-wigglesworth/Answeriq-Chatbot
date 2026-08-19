# AnswerIQ — AI-Powered Answer Evaluator

An intelligent tool that evaluates subjective answers by comparing them to reference answers. Get instant scores (out of 10) plus AI-powered improvement suggestions.

## What Does It Do?

AnswerIQ helps students and learners improve their answers by:
- **Scoring** your answer from 0-10 based on how well it matches a reference answer
- **Identifying** missing key concepts you should include
- **Suggesting** specific improvements to make your answer better
- **Breaking down** your score into Accuracy, Completeness, Clarity, and Depth

## Example

**Question:** Describe Quantum Mechanics

**Reference Answer:** Quantum mechanics is a branch of modern applied physics that describes the behavior of matter and energy at atomic and subatomic scales...

**Your Answer:** Quantum mechanics studies tiny particles and uses probability instead of certainty...

**Your Score:** 7/10 (Good)
- **Accuracy:** 7/10
- **Completeness:** 6/10 
- **Clarity:** 8/10
- **Depth:** 6/10

**What You Missed:**
- wave-particle duality
- uncertainty principle
- superposition

**Suggestions:**
- Add missing key concepts: wave-particle duality and uncertainty principle
- Include more depth with specific examples or real-world applications

---

## Quick Start

### Run Locally (5 minutes)

**What you need:**
- Python 3.9 or higher installed
- A web browser

**Steps:**

1. **Install dependencies** (in the `backend` folder):

```bash
cd backend
pip install -r requirements.txt
```

### 2. Start the Evaluation API

```bash
python local_server.py
```
The API will run at `http://localhost:5000/evaluate`

### 3. Serve the Frontend

Open a new terminal:

```bash
# Navigate to project root
cd ..

# Serve with Python's built-in server
python -m http.server 8080
```

Open **http://localhost:8080** in your browser.

### 4. Configure API URL

1. Click **⚙ Settings** in the top-right
2. Set **API URL** to: `http://localhost:5000/evaluate`
3. (Optional) Add a **Gemini API Key** for enhanced AI suggestions
4. Click **Save**

### 5. Try It Out

1. Enter a question in **Field A** (e.g., "Describe Quantum Mechanics")
2. Paste the reference answer in **Field B**
3. Type your answer in the **"Your Answer"** field
4. Click **✦ Evaluate My Answer**
5. Review your score, breakdown, and AI suggestions!

---

## ☁️ Deploy to AWS (GitHub + Amplify + Lambda)

### Part 1: Push to GitHub

1. **Initialize git** (if not already done):
```bash
git init
git add .
git commit -m "Initial commit: AnswerIQ subjective answer evaluator"
```

2. **Create a new repository** on GitHub:
   - Go to https://github.com/new
   - Name it (e.g., `answeriq-chatbot`)
   - Don't add README, .gitignore, or license (already included)

3. **Push your code**:
```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### Part 2: Deploy Backend (AWS Lambda with SAM)

#### Prerequisites
- **AWS CLI** installed and configured with credentials ([Install Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html))
- **AWS SAM CLI** installed ([Install Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html))

#### Setup AWS Credentials (First Time Only)

1. **Get your AWS Access Keys**:
   - Go to [AWS Console](https://console.aws.amazon.com/)
   - Click your username (top right) → **Security credentials**
   - Scroll to **Access keys** → **Create access key**
   - Choose **Command Line Interface (CLI)** → check the box → **Next**
   - Click **Create access key** and copy both keys

2. **Configure AWS CLI**:
```bash
aws configure
```
Enter when prompted:
- **AWS Access Key ID**: [paste your key]
- **AWS Secret Access Key**: [paste your secret]
- **Default region**: `us-east-1` (or your preferred region)
- **Default output format**: [just press Enter]

#### Deploy Steps

1. **Clean the backend folder** (IMPORTANT):
   
   Before building, make sure the `backend` folder contains ONLY these files:
   - `evaluate.py`
   - `lambda_handler.py`
   - `local_server.py`
   - `requirements.txt`
   - `test_evaluation.py`
   
   **Delete any installed package folders** (joblib, numpy, sklearn, etc.) if they exist. SAM will install dependencies automatically.

2. **Build the Lambda function**:
```bash
sam build
```

3. **Deploy with guided setup** (first time):
```bash
sam deploy --guided
```

Answer the prompts:
- **Stack Name**: Press Enter (accepts `sam-dev`) or type your own
- **AWS Region**: Press Enter to use your configured region
- **Parameter GeminiApiKey**: Press Enter (uses default 'NONE')
- **Confirm changes before deploy**: `Y`
- **Allow SAM CLI IAM role creation**: `Y`
- **Disable rollback**: `N`
- **EvaluateFunction Function Url has no authentication**: `Y` (this is correct)
- **Save arguments to samconfig.toml**: `Y`
- **SAM configuration file**: Press Enter
- **SAM configuration environment**: Press Enter

4. **Copy the Function URL**:

After deployment completes, look for the Outputs section:
```
Outputs:
FunctionUrl: https://abc123.lambda-url.us-east-1.on.aws/
```

**Copy this URL** — you'll need it for the frontend.

5. **For subsequent deployments**:
```bash
sam build
sam deploy
```
(No `--guided` flag needed after the first time)

### Part 3: Deploy Frontend (AWS Amplify)

1. **Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)**

2. **Click "New App" → "Host web app"**

3. **Connect your GitHub repository**:
   - Select **GitHub**
   - Authorize AWS Amplify
   - Choose your repository and `main` branch

4. **Configure build settings**:
   - Amplify auto-detects `amplify.yml` ✓
   - **Add environment variable**:
     - Key: `EVALUATE_API_URL`
     - Value: Your Lambda Function URL from Part 2
   
5. **Review and Deploy**:
   - Click **"Save and deploy"**
   - Wait 2-3 minutes for the build

6. **Access your app**:
   - Amplify will provide a URL like: `https://main.xyz.amplifyapp.com`
   - The app is now live!

### Alternative: Manual API Configuration

If you skip the environment variable in Amplify:
1. Open the deployed app
2. Click **⚙ Settings**
3. Paste your Lambda Function URL
4. Click **Save**

---

## 🔧 API Reference

### POST `/evaluate`

Evaluate a user's answer against a reference answer.

**Request:**
```json
{
  "question": "Describe Quantum Mechanics",
  "reference_answer": "Quantum mechanics is a branch of modern applied physics...",
  "user_answer_1": "Quantum mechanics studies atoms and uses probability...",
  "gemini_api_key": "AIza..." // Optional for enhanced suggestions
}
```

**Response:**
```json
{
  "score": 7,
  "grade": "Good",
  "summary": "Good grasp of the question...",
  "breakdown": [
    {"name": "Accuracy", "score": "7/10"},
    {"name": "Completeness", "score": "6/10"},
    {"name": "Clarity", "score": "8/10"},
    {"name": "Depth", "score": "6/10"}
  ],
  "suggestions": [
    "✓ Add missing key concepts: wave-particle duality...",
    "✓ Structure your answer better..."
  ],
  "missing_points": ["wave-particle duality", "superposition"],
  "similarity": 0.6421
}
```

---

## 🧠 Evaluation Algorithm

The Python backend (`evaluate.py`) uses a multi-factor scoring system:

1. **Semantic Similarity (40%)**: TF-IDF cosine similarity between reference and user answer
2. **Completeness (30%)**: Percentage of reference key terms present in the user's answer
3. **Clarity (15%)**: Sentence structure, length, and formatting quality
4. **Depth (15%)**: Vocabulary richness and detail level

**Context Matching:** The core uses `sklearn.feature_extraction.text.TfidfVectorizer` to convert text into numerical vectors, then calculates cosine similarity for semantic comparison.

**AI Suggestions:** Rule-based suggestions analyze weak areas. With an optional Gemini API key, suggestions are enhanced by Google's generative AI.

---

## 🎨 Customization

### Adding Your Own Default Questions

You can modify the HTML to pre-fill fields for common use cases. Edit `index.html` and set default values in the textarea elements, or create your own question bank interface.

### Adjusting Scoring Weights

Edit `backend/evaluate.py`, function `evaluate_answer()`:
```python
composite = (
    accuracy_raw * 0.40        # Adjust these weights
    + completeness_raw * 0.30
    + clarity * 0.15
    + depth * 0.15
)
```

---

## 🔐 Optional: Gemini AI Integration

For enhanced, AI-generated suggestions:

1. Get a free API key at [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Add it in one of three ways:
   - **Frontend Settings**: Click ⚙ Settings → paste key
   - **Lambda Environment**: Set `GEMINI_API_KEY` in AWS Lambda console
   - **SAM Deployment**: Pass `--parameter-overrides GeminiApiKey=AIza...` during `sam deploy`

Without a Gemini key, the app uses rule-based suggestions (still highly effective).

---

## 📋 Technologies Used

- **Frontend**: HTML5, CSS3 (Glassmorphism), Vanilla JavaScript
- **Backend**: Python 3.12, Flask (local), AWS Lambda (production)
- **ML Library**: scikit-learn (TF-IDF, cosine similarity)
- **AI Enhancement**: Google Gemini 2.0 Flash (optional)
- **Deployment**: AWS Amplify (frontend), AWS Lambda + SAM (backend)

---

## 🤝 Contributing

Contributions welcome! To improve evaluation logic, UI/UX, or add features:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "Add your feature"`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — feel free to use this project for educational or commercial purposes.

---

## 🆘 Troubleshooting

**Issue:** "No evaluator API URL set" warning

**Solution:** Click ⚙ Settings and add your API URL (local: `http://localhost:5000/evaluate`, AWS: your Lambda Function URL)

---

**Issue:** "Unable to locate credentials" when running `sam deploy`

**Solution:** You need to configure AWS CLI first. Run `aws configure` and enter your AWS Access Key ID and Secret Access Key from the AWS Console (Security credentials section).

---

**Issue:** "Access is denied" error during `sam build`

**Solution:** Delete all installed package folders from the `backend` directory. Keep only the `.py` and `.txt` files. SAM will install dependencies automatically into the build folder.

---

**Issue:** "PropertyValidation failed" during deployment

**Solution:** Run `sam validate --lint` to check for template errors. Common issues: invalid CORS methods or incorrect output references.

---

**Issue:** CORS errors when calling Lambda from the website

**Solution:** The template already includes proper CORS settings. Make sure you're using the correct Function URL from the deployment outputs.

---

**Issue:** Evaluation returns score of 0

**Solution:** Check that your answer and reference aren't empty. The algorithm requires substantial text (15+ words recommended).

---

## 📞 Support

For bugs or feature requests, open an issue on GitHub or contact the maintainer.

---

**Built with ❤️ for smarter learning**
