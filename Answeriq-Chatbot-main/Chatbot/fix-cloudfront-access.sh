#!/bin/bash

# Fix CloudFront AccessDenied errors for AnswerIQ deployment

BUCKET_NAME="answeriq-chatbot-public-web-bucket"
REGION="us-east-1"

echo "🔧 Fixing CloudFront Access Issues for $BUCKET_NAME..."
echo ""

# Step 1: Disable Block Public Access
echo "1️⃣ Disabling S3 Block Public Access..."
aws s3api put-public-access-block \
  --bucket $BUCKET_NAME \
  --public-access-block-configuration \
  "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

if [ $? -eq 0 ]; then
  echo "✅ Block Public Access disabled"
else
  echo "❌ Failed to disable Block Public Access"
  exit 1
fi

echo ""

# Step 2: Apply Public Read Policy
echo "2️⃣ Applying public read policy..."
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::'$BUCKET_NAME'/*"
    }
  ]
}'

if [ $? -eq 0 ]; then
  echo "✅ Public read policy applied"
else
  echo "❌ Failed to apply bucket policy"
  exit 1
fi

echo ""

# Step 3: Enable Website Hosting
echo "3️⃣ Enabling static website hosting..."
aws s3 website s3://$BUCKET_NAME \
  --index-document index.html \
  --error-document index.html

if [ $? -eq 0 ]; then
  echo "✅ Website hosting enabled"
else
  echo "❌ Failed to enable website hosting"
  exit 1
fi

echo ""

# Step 4: Set CORS configuration
echo "4️⃣ Setting CORS configuration..."
aws s3api put-bucket-cors --bucket $BUCKET_NAME --cors-configuration '{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3600
    }
  ]
}'

if [ $? -eq 0 ]; then
  echo "✅ CORS configuration set"
else
  echo "⚠️ CORS configuration failed (not critical)"
fi

echo ""

# Step 5: Check for CloudFront distribution
echo "5️⃣ Checking for CloudFront distribution..."
DISTRIBUTION_ID=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Origins.Items[?contains(DomainName, '$BUCKET_NAME')]].Id | [0]" \
  --output text)

if [ "$DISTRIBUTION_ID" != "None" ] && [ ! -z "$DISTRIBUTION_ID" ]; then
  echo "✅ Found CloudFront distribution: $DISTRIBUTION_ID"
  echo ""
  echo "6️⃣ Invalidating CloudFront cache..."
  aws cloudfront create-invalidation \
    --distribution-id $DISTRIBUTION_ID \
    --paths "/*"
  
  if [ $? -eq 0 ]; then
    echo "✅ Cache invalidation created"
  else
    echo "❌ Failed to invalidate cache"
  fi
else
  echo "ℹ️ No CloudFront distribution found"
fi

echo ""
echo "✅ All fixes applied!"
echo ""
echo "Your website should now be accessible at:"
echo "📍 S3: http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"

if [ "$DISTRIBUTION_ID" != "None" ] && [ ! -z "$DISTRIBUTION_ID" ]; then
  CLOUDFRONT_DOMAIN=$(aws cloudfront get-distribution --id $DISTRIBUTION_ID --query "Distribution.DomainName" --output text)
  echo "📍 CloudFront: https://$CLOUDFRONT_DOMAIN"
  echo ""
  echo "⏳ Note: CloudFront changes may take 5-15 minutes to propagate"
fi

echo ""
echo "If you still see AccessDenied errors:"
echo "1. Wait 5-10 minutes for changes to propagate"
echo "2. Clear your browser cache (Ctrl+Shift+Delete)"
echo "3. Try accessing in an incognito/private window"
