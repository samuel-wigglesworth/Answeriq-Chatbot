# Fix CloudFront AccessDenied errors for AnswerIQ deployment

$BUCKET_NAME = "answeriq-chatbot-public-web-bucket"
$REGION = "us-east-1"

Write-Host "🔧 Fixing CloudFront Access Issues for $BUCKET_NAME..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Disable Block Public Access
Write-Host "1️⃣ Disabling S3 Block Public Access..." -ForegroundColor Yellow
aws s3api put-public-access-block `
  --bucket $BUCKET_NAME `
  --public-access-block-configuration `
  "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

if ($LASTEXITCODE -eq 0) {
  Write-Host "✅ Block Public Access disabled" -ForegroundColor Green
} else {
  Write-Host "❌ Failed to disable Block Public Access" -ForegroundColor Red
  exit 1
}

Write-Host ""

# Step 2: Apply Public Read Policy
Write-Host "2️⃣ Applying public read policy..." -ForegroundColor Yellow
$policy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
    }
  ]
}
"@

$policy | Out-File -FilePath "temp-policy.json" -Encoding utf8
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file://temp-policy.json
Remove-Item "temp-policy.json" -ErrorAction SilentlyContinue

if ($LASTEXITCODE -eq 0) {
  Write-Host "✅ Public read policy applied" -ForegroundColor Green
} else {
  Write-Host "❌ Failed to apply bucket policy" -ForegroundColor Red
  exit 1
}

Write-Host ""

# Step 3: Enable Website Hosting
Write-Host "3️⃣ Enabling static website hosting..." -ForegroundColor Yellow
aws s3 website s3://$BUCKET_NAME `
  --index-document index.html `
  --error-document index.html

if ($LASTEXITCODE -eq 0) {
  Write-Host "✅ Website hosting enabled" -ForegroundColor Green
} else {
  Write-Host "❌ Failed to enable website hosting" -ForegroundColor Red
  exit 1
}

Write-Host ""

# Step 4: Set CORS configuration
Write-Host "4️⃣ Setting CORS configuration..." -ForegroundColor Yellow
$cors = @"
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3600
    }
  ]
}
"@

$cors | Out-File -FilePath "temp-cors.json" -Encoding utf8
aws s3api put-bucket-cors --bucket $BUCKET_NAME --cors-configuration file://temp-cors.json
Remove-Item "temp-cors.json" -ErrorAction SilentlyContinue

if ($LASTEXITCODE -eq 0) {
  Write-Host "✅ CORS configuration set" -ForegroundColor Green
} else {
  Write-Host "⚠️ CORS configuration failed (not critical)" -ForegroundColor Yellow
}

Write-Host ""

# Step 5: Check for CloudFront distribution
Write-Host "5️⃣ Checking for CloudFront distribution..." -ForegroundColor Yellow
$DISTRIBUTION_ID = aws cloudfront list-distributions `
  --query "DistributionList.Items[?Origins.Items[?contains(DomainName, '$BUCKET_NAME')]].Id | [0]" `
  --output text

if ($DISTRIBUTION_ID -and $DISTRIBUTION_ID -ne "None") {
  Write-Host "✅ Found CloudFront distribution: $DISTRIBUTION_ID" -ForegroundColor Green
  Write-Host ""
  Write-Host "6️⃣ Invalidating CloudFront cache..." -ForegroundColor Yellow
  aws cloudfront create-invalidation `
    --distribution-id $DISTRIBUTION_ID `
    --paths "/*"
  
  if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Cache invalidation created" -ForegroundColor Green
  } else {
    Write-Host "❌ Failed to invalidate cache" -ForegroundColor Red
  }
} else {
  Write-Host "ℹ️ No CloudFront distribution found" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "✅ All fixes applied!" -ForegroundColor Green
Write-Host ""
Write-Host "Your website should now be accessible at:" -ForegroundColor Cyan
Write-Host "📍 S3: http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com" -ForegroundColor White

if ($DISTRIBUTION_ID -and $DISTRIBUTION_ID -ne "None") {
  $CLOUDFRONT_DOMAIN = aws cloudfront get-distribution --id $DISTRIBUTION_ID --query "Distribution.DomainName" --output text
  Write-Host "📍 CloudFront: https://$CLOUDFRONT_DOMAIN" -ForegroundColor White
  Write-Host ""
  Write-Host "⏳ Note: CloudFront changes may take 5-15 minutes to propagate" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "If you still see AccessDenied errors:" -ForegroundColor Yellow
Write-Host "1. Wait 5-10 minutes for changes to propagate"
Write-Host "2. Clear your browser cache (Ctrl+Shift+Delete)"
Write-Host "3. Try accessing in an incognito/private window"
