# Quick Fix: CloudFront AccessDenied Error

If you see this error when visiting your CloudFront URL:

```xml
<Error>
<Code>AccessDenied</Code>
<Message>Access Denied</Message>
</Error>
```

## One-Command Fix

**Windows:**
```powershell
.\fix-cloudfront-access.ps1
```

**Mac/Linux:**
```bash
chmod +x fix-cloudfront-access.sh && ./fix-cloudfront-access.sh
```

**Wait 5-10 minutes**, then refresh your browser (Ctrl+Shift+R to force refresh).

---

## What This Does

1. ✅ Removes S3 public access blocks
2. ✅ Adds public read policy to bucket
3. ✅ Enables S3 static website hosting
4. ✅ Sets up CORS headers
5. ✅ Invalidates CloudFront cache

---

## Still Not Working?

### Check CloudFront Origin Settings

1. Go to [CloudFront Console](https://console.aws.amazon.com/cloudfront)
2. Click your distribution
3. Go to **Origins** tab
4. Your origin domain should be:
   - ✅ **Correct:** `answeriq-chatbot-public-web-bucket.s3-website-us-east-1.amazonaws.com`
   - ❌ **Wrong:** `answeriq-chatbot-public-web-bucket.s3.amazonaws.com`

If it's wrong:
1. Create a new origin with the correct domain (the one with `-website-` in it)
2. Update the Default Cache Behavior to use the new origin
3. Delete the old origin
4. Wait 15-20 minutes for CloudFront to deploy

### Check Custom Error Responses

1. In CloudFront Console → Your distribution → **Error pages** tab
2. Should have:
   - **HTTP Error Code:** 403
   - **Customize Error Response:** Yes
   - **Response Page Path:** /index.html
   - **HTTP Response Code:** 200

If missing, add it and wait 15-20 minutes.

---

## Direct S3 Access (Bypass CloudFront)

Test if S3 is working directly:

```
http://answeriq-chatbot-public-web-bucket.s3-website-us-east-1.amazonaws.com
```

- ✅ **If this works:** Issue is CloudFront configuration (see above)
- ❌ **If this fails:** Run the fix script again

---

## Need More Help?

See full troubleshooting guide: [DEPLOYMENT_SETUP.md](DEPLOYMENT_SETUP.md)
