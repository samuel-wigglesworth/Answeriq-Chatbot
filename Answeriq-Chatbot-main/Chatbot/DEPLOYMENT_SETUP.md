# GitHub Actions Deployment Setup

This guide will help you set up automatic deployment to AWS S3 with optional CloudFront CDN using GitHub Actions.

## Prerequisites

- AWS Account
- GitHub repository for this project
- AWS CLI configured locally

## Step 1: Create S3 Bucket for Website Hosting

Run these commands to create and configure your S3 bucket:

```bash
# Create the S3 bucket
aws s3 mb s3://answeriq-chatbot-public-web-bucket --region us-east-1

# Disable block public access settings (required for public website)
aws s3api put-public-access-block \
  --bucket answeriq-chatbot-public-web-bucket \
  --public-access-block-configuration \
  "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

# Make the bucket public (required for website hosting)
aws s3api put-bucket-policy --bucket answeriq-chatbot-public-web-bucket --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::answeriq-chatbot-public-web-bucket/*"
    }
  ]
}'

# Enable static website hosting
aws s3 website s3://answeriq-chatbot-public-web-bucket \
  --index-document index.html \
  --error-document index.html
```

## Step 2: Create CloudFront Distribution (Optional - For HTTPS and Better Performance)

### Option A: Using AWS Console (Easier)

1. Go to [CloudFront Console](https://console.aws.amazon.com/cloudfront)
2. Click **Create Distribution**
3. **Origin Settings:**
   - Origin domain: Select `answeriq-chatbot-public-web-bucket.s3.us-east-1.amazonaws.com`
   - Origin path: Leave empty
   - Name: `S3-answeriq-chatbot`
   - Origin access: **Public** (not OAI since bucket is public)
4. **Default cache behavior:**
   - Viewer protocol policy: **Redirect HTTP to HTTPS**
   - Allowed HTTP methods: **GET, HEAD**
   - Cache policy: **CachingOptimized**
   - Compress objects automatically: **Yes**
5. **Settings:**
   - Price class: **Use only North America and Europe** (cheapest)
   - Default root object: `index.html`
6. **Custom error responses:**
   - Click **Add custom error response**
   - HTTP error code: **403**
   - Customize error response: **Yes**
   - Response page path: `/index.html`
   - HTTP response code: **200**
7. Click **Create distribution**

**Wait 15-30 minutes for deployment to complete**, then copy your CloudFront domain name (e.g., `d1234567890.cloudfront.net`)

### Option B: Using AWS CLI (Advanced)

```bash
aws cloudfront create-distribution --distribution-config '{
  "CallerReference": "answeriq-'$(date +%s)'",
  "Comment": "AnswerIQ Chatbot Distribution",
  "Enabled": true,
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-answeriq-chatbot",
        "DomainName": "answeriq-chatbot-public-web-bucket.s3.us-east-1.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultRootObject": "index.html",
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-answeriq-chatbot",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "MinTTL": 0,
    "DefaultTTL": 3600,
    "MaxTTL": 86400,
    "Compress": true,
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    }
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 403,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  },
  "PriceClass": "PriceClass_100"
}'
```

## Step 3: Add GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these two secrets:

   **Secret 1:**
   - Name: `AWS_ACCESS_KEY_ID`
   - Value: Your AWS Access Key ID

   **Secret 2:**
   - Name: `AWS_SECRET_ACCESS_KEY`
   - Value: Your AWS Secret Access Key

## Step 4: Push to GitHub

Once you push to the `main` branch, GitHub Actions will automatically:
1. Deploy your frontend files to S3
2. Set proper content types for HTML/CSS/JS files
3. Apply public read policy
4. Invalidate CloudFront cache (if distribution exists)

```bash
git add .
git commit -m "Add GitHub Actions deployment workflow"
git push origin main
```

## Step 5: Access Your Website

After deployment completes, your website will be available at:

**Direct S3 access:**
```
http://answeriq-chatbot-public-web-bucket.s3-website-us-east-1.amazonaws.com
```

**CloudFront (if configured):**
```
https://YOUR_CLOUDFRONT_DOMAIN.cloudfront.net
```

## Monitoring Deployments

- Go to your GitHub repository → **Actions** tab
- You'll see all deployment runs
- Click on any run to see detailed logs

## Cost Considerations

### S3 Free Tier (First 12 months):
- 5 GB of storage
- 20,000 GET requests per month
- 2,000 PUT requests per month

### CloudFront Free Tier (Always free):
- 1 TB of data transfer out per month
- 10,000,000 HTTP/HTTPS requests per month

This is more than enough for a personal website!

## Troubleshooting

### Issue: CloudFront shows 403 AccessDenied

**Solution 1:** Make sure S3 bucket has public read policy (Step 1 commands)

**Solution 2:** Verify CloudFront origin is set to the S3 **website endpoint**, not the bucket endpoint:
- ✅ Correct: `answeriq-chatbot-public-web-bucket.s3-website-us-east-1.amazonaws.com`
- ❌ Wrong: `answeriq-chatbot-public-web-bucket.s3.amazonaws.com`

**Solution 3:** Wait 15-30 minutes after creating CloudFront distribution - it takes time to deploy

**Solution 4:** Check Custom Error Responses - 403 should redirect to `/index.html` with 200 status

---

### Issue: GitHub Action fails with "Access Denied"

**Solution:** Check that your AWS IAM user has these permissions:
- `s3:PutObject`
- `s3:DeleteObject`
- `s3:ListBucket`
- `s3:PutBucketPolicy`
- `s3:PutBucketWebsite`
- `cloudfront:CreateInvalidation` (if using CloudFront)
- `cloudfront:ListDistributions` (if using CloudFront)

---

### Issue: Website loads but shows API error

**Solution:** Click ⚙ Settings on the website and add your Lambda Function URL:
```
https://eccxt6atqg53e5h2kygefwhety0jfgho.lambda-url.us-east-1.on.aws/
```

---

### Issue: CloudFront serves old cached version

**Solution:** The GitHub Action automatically invalidates the cache. To manually invalidate:
```bash
# Get your distribution ID
aws cloudfront list-distributions --query "DistributionList.Items[*].[Id,DomainName]" --output table

# Create invalidation
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## Alternative: Use Your Own Bucket Name

If you want a different bucket name:

1. Edit `.github/workflows/deploy.yml`
2. Replace `answeriq-chatbot-public-web-bucket` with your bucket name
3. Run the setup commands with your bucket name
4. The bucket name must be globally unique across all AWS accounts

## Next Steps

After deployment:
1. Open the S3 website URL or CloudFront URL
2. Click **⚙ Settings**
3. Add your Lambda Function URL
4. Test the evaluation feature!

## Recommended Setup

For production, we recommend:
- ✅ Use CloudFront for HTTPS and better performance
- ✅ Set up a custom domain with Route 53 and ACM certificate
- ✅ Enable CloudFront access logs for analytics
- ✅ Use environment-specific buckets (dev, staging, prod)
