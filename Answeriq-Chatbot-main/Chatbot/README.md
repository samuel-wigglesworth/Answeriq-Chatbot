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

## Deployment Options

This project can be deployed in four ways:
1. **🤖 Amazon Q Developer** - Ask AI to deploy it for you (easiest)
2. **🚀 GitHub Actions + S3** - Automatic deployment on every push (recommended)
3. **☁️ AWS Manual** - Use SAM CLI + Amplify Console (full control)
4. **💻 Local Development** - Run on your computer (for testing)

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

## ☁️ Deploy to AWS

You can deploy this project to AWS using either:
- **Option A**: Amazon Q Developer (AI-assisted deployment - easiest)
- **Option B**: Manual deployment with SAM CLI and Amplify

---

## Option B: Deploy with GitHub Actions (Automated)

This method automatically deploys your frontend to S3 whenever you push to GitHub.

### Quick Setup

1. **Create S3 bucket and configure it** - See [DEPLOYMENT_SETUP.md](DEPLOYMENT_SETUP.md) for detailed commands
2. **Add GitHub secrets** - Add your AWS credentials to GitHub repository secrets
3. **Push to GitHub** - The workflow automatically deploys on every push to `main`

Your website will be live at: `http://answeriq-chatbot-public-web-bucket.s3-website-us-east-1.amazonaws.com`

**Full instructions:** See [DEPLOYMENT_SETUP.md](DEPLOYMENT_SETUP.md)

---

## Option C: Deploy with Amazon Q Developer (AI-Assisted)

Amazon Q Developer can deploy your entire application to AWS with simple chat commands.

### Prerequisites
- AWS Account with configured credentials
- Amazon Q Developer extension installed in VS Code
- AWS Toolkit extension installed in VS Code

### Deployment Steps

1. **Open Amazon Q chat** in VS Code (click the Q icon in the sidebar or use `/dev`)

2. **Ask Amazon Q to deploy your project**:
```
Deploy this project to AWS. The backend should use Lambda with Function URLs, 
and the frontend should be hosted on Amplify. Use the template.yaml for the 
Lambda deployment and amplify.yml for the frontend.
```

3. **Amazon Q will**:
   - Analyze your `template.yaml` and `amplify.yml`
   - Build and deploy the Lambda function using SAM
   - Set up Amplify hosting for the frontend
   - Configure CORS and Function URLs automatically
   - Provide you with the deployed URLs

4. **Review and confirm** the deployment steps Amazon Q suggests

5. **Copy the Lambda Function URL** from the output and use it in your frontend settings

### Alternative Amazon Q Commands

If you want more control, you can deploy in steps:

**Deploy backend only:**
```
Deploy the backend Lambda function using SAM. The template is in template.yaml.
```

**Deploy frontend only:**
```
Set up AWS Amplify hosting for this static website. Use the amplify.yml config.
```

**Troubleshoot deployment:**
```
I'm getting a 404 error on my Amplify site. Help me debug the deployment.
```

---

## Option D: Manual Deployment (AWS CLI + SAM)

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

## � Amazon Q Developer Quick Reference

### Useful Commands for This Project

**Full deployment:**
```
Deploy this AnswerIQ app to AWS. Backend is Python Lambda (template.yaml), 
frontend is static HTML (amplify.yml).
```

**Backend only:**
```
Build and deploy the Lambda function using the template.yaml SAM template.
```

**Update after code changes:**
```
Rebuild and redeploy the Lambda function with my latest code changes.
```

**Get deployment URLs:**
```
Show me the deployed Lambda Function URL and Amplify app URL.
```

**Debug CORS issues:**
```
The frontend can't call the Lambda API. Help me fix CORS configuration.
```

**Add environment variable:**
```
Add a GEMINI_API_KEY environment variable to my Lambda function.
```

### Tips for Using Amazon Q

- Be specific about which files to use (`template.yaml`, `amplify.yml`)
- Mention "SAM" for Lambda deployments to use the right tool
- Ask Q to explain any errors you encounter
- Request step-by-step explanations if needed: "Explain each step as you deploy"

---

## �🤝 Contributing

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

### Amazon Q Deployment Issues

**Issue:** Amazon Q says it can't find AWS credentials

**Solution:** Configure AWS credentials first:
1. Open VS Code Command Palette (`Ctrl+Shift+P`)
2. Type "AWS: Create Credentials Profile"
3. Follow the prompts to enter your Access Key ID and Secret Access Key

---

**Issue:** Amazon Q deployment fails with permission errors

**Solution:** Ensure your AWS user has these permissions:
- `AdministratorAccess` (for learning/personal projects)
- Or at minimum: Lambda, IAM, CloudFormation, S3, and Amplify permissions

---

**Issue:** Amazon Q isn't suggesting deployment commands

**Solution:** 
1. Make sure you have both `template.yaml` and `amplify.yml` in your project root
2. Try being more specific: "Use AWS SAM to deploy the Lambda function in template.yaml"
3. Ensure the AWS Toolkit extension is installed and active

---

### General Deployment Issues

**Issue: CloudFront shows "AccessDenied" XML error**

**Solution:** Run the automated fix script:

**Windows (PowerShell):**
```powershell
.\fix-cloudfront-access.ps1
```

**Mac/Linux (Bash):**
```bash
chmod +x fix-cloudfront-access.sh
./fix-cloudfront-access.sh
```

This script will:
- Disable S3 block public access
- Apply public read bucket policy
- Enable website hosting
- Set CORS configuration
- Invalidate CloudFront cache

Wait 5-10 minutes after running, then try accessing your site again.

---

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
