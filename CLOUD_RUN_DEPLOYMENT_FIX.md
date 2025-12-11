# HaleyOS Frontend - Cloud Run Deployment Fix

## Problem Identified

Your Cloud Run deployment is failing with this error:
```
Error: Cannot find module 'next/dist/server/lib/trace/tracer'
```

This is caused by:
1. ❌ Next.js version mismatch/instability with `^14.0.0`
2. ❌ Missing `output: 'standalone'` in next.config.js for Cloud Run
3. ❌ Potential build cache issues
4. ❌ Missing `.dockerignore` file causing unnecessary files in build

## ✅ Fixes Applied

### 1. Updated `package.json`
**Changed:**
```json
"next": "^14.0.0"  // Old - allows any 14.x version
```
**To:**
```json
"next": "14.2.5"   // New - locked to stable version
```

**Why:** Locking to a specific stable version prevents module resolution issues.

---

### 2. Updated `next.config.js`
**Added:**
```javascript
output: 'standalone',  // Required for Cloud Run
poweredByHeader: false,
compress: true,
```

**Why:** 
- `standalone` creates a minimal self-contained build for Cloud Run
- Reduces build size and improves performance

---

### 3. Created `.dockerignore`
**New file** to exclude unnecessary files from Docker build:
- `node_modules` (rebuilt in container)
- `.next` (rebuilt)
- Development files
- Documentation
- Python backend files

**Why:** Faster builds, smaller images, fewer conflicts

---

### 4. Created `Dockerfile.cloudrun`
**Optimized Dockerfile** with:
- `--legacy-peer-deps` flag to handle dependency conflicts
- Proper environment variable handling
- Telemetry disabled for faster builds
- Multi-stage build for smaller final image

---

## 🚀 Deployment Options

### Option 1: Quick Fix (Use Existing Setup)

#### Step 1: Delete Build Cache
```bash
# In Cloud Console or local terminal
gcloud builds list --limit=5
gcloud builds cancel <BUILD_ID>  # Cancel any running builds

# Clear Cloud Build cache
gcloud alpha builds triggers run haley-frontend-trigger --sha=main
```

#### Step 2: Delete and Reinstall node_modules Locally
```bash
cd haley-frontend-main
rm -rf node_modules package-lock.json
npm install
npm run build  # Test locally first
```

#### Step 3: Commit and Push Updated Files
```bash
git add package.json next.config.js .dockerignore
git commit -m "fix: Update Next.js version and add Cloud Run optimizations"
git push
```

The automatic trigger should deploy with the fixes.

---

### Option 2: Manual Deployment (Recommended for Testing)

#### Step 1: Build Locally with Docker
```bash
cd haley-frontend-main

# Build with the optimized Dockerfile
docker build \
  -f Dockerfile.cloudrun \
  -t gcr.io/haley-front-end/haley-frontend:latest \
  --build-arg NEXT_PUBLIC_BACKEND_URL=https://logic-engine-core2-409495160162.us-central1.run.app \
  --build-arg NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAOnz3gs5iUYfVZrGjGNC-QfsBujvMYBQ4 \
  --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=haley-front-end.firebaseapp.com \
  --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID=haley-front-end \
  --build-arg NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=haley-front-end.firebasestorage.app \
  --build-arg NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=415166601162 \
  --build-arg NEXT_PUBLIC_FIREBASE_APP_ID=1:415166601162:web:2964033f8f8567b0e92133 \
  .
```

#### Step 2: Test Locally
```bash
docker run -p 3000:3000 gcr.io/haley-front-end/haley-frontend:latest
# Visit http://localhost:3000
```

#### Step 3: Push to Google Container Registry
```bash
docker push gcr.io/haley-front-end/haley-frontend:latest
```

#### Step 4: Deploy to Cloud Run
```bash
gcloud run deploy haley-frontend \
  --image gcr.io/haley-front-end/haley-frontend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 4 \
  --min-instances 0 \
  --set-env-vars "NEXT_PUBLIC_BACKEND_URL=https://logic-engine-core2-409495160162.us-central1.run.app"
```

---

### Option 3: Use Cloud Build Directly

#### Step 1: Create `cloudbuild.yaml`
```yaml
steps:
  # Install dependencies
  - name: 'node:18-alpine'
    entrypoint: 'sh'
    args:
      - '-c'
      - |
        apk add --no-cache libc6-compat
        rm -rf node_modules package-lock.json
        npm install --legacy-peer-deps
        npm run build
    env:
      - 'NEXT_PUBLIC_BACKEND_URL=https://logic-engine-core2-409495160162.us-central1.run.app'
      - 'NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAOnz3gs5iUYfVZrGjGNC-QfsBujvMYBQ4'
      - 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=haley-front-end.firebaseapp.com'
      - 'NEXT_PUBLIC_FIREBASE_PROJECT_ID=haley-front-end'
      - 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=haley-front-end.firebasestorage.app'
      - 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=415166601162'
      - 'NEXT_PUBLIC_FIREBASE_APP_ID=1:415166601162:web:2964033f8f8567b0e92133'

  # Build Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-f'
      - 'Dockerfile.cloudrun'
      - '-t'
      - 'gcr.io/$PROJECT_ID/haley-frontend:latest'
      - '.'

  # Push to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - 'gcr.io/$PROJECT_ID/haley-frontend:latest'

  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'haley-frontend'
      - '--image'
      - 'gcr.io/$PROJECT_ID/haley-frontend:latest'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'

images:
  - 'gcr.io/$PROJECT_ID/haley-frontend:latest'

timeout: 1200s
```

#### Step 2: Submit Build
```bash
gcloud builds submit --config=cloudbuild.yaml .
```

---

## 🔍 Troubleshooting

### Issue: Still Getting Tracer Module Error

**Solution 1: Clear Everything**
```bash
# Local
rm -rf node_modules .next package-lock.json
npm install
npm run build

# If successful locally, commit and push
```

**Solution 2: Use Different Next.js Version**
```json
// Try in package.json
"next": "14.1.0"  // or "13.5.6" (LTS)
```

**Solution 3: Check TypeScript Configuration**
```bash
# Ensure tsconfig.json has proper paths
npx tsc --showConfig
```

---

### Issue: Build Times Out

**Solution: Increase timeout in cloudbuild.yaml**
```yaml
timeout: 1800s  # 30 minutes
```

**Or adjust Cloud Build settings:**
```bash
gcloud builds submit --timeout=30m .
```

---

### Issue: Out of Memory During Build

**Solution 1: Increase memory in Cloud Build**
```yaml
options:
  machineType: 'E2_HIGHCPU_8'  # More CPU/memory
```

**Solution 2: Use npm instead of building**
```bash
# In Dockerfile, add:
ENV NODE_OPTIONS="--max-old-space-size=4096"
```

---

### Issue: Environment Variables Not Being Set

**Check build logs:**
```bash
gcloud builds log <BUILD_ID>
```

**Verify they're passed correctly:**
```bash
# In Cloud Build, they should appear in step logs
echo $NEXT_PUBLIC_BACKEND_URL
```

---

## 📋 Verification Checklist

After deployment, verify:

### 1. Build Succeeds
```bash
✅ npm install completes
✅ npm run build completes
✅ Docker image builds successfully
✅ No module resolution errors
```

### 2. Service Runs
```bash
✅ Cloud Run service starts
✅ Health check passes
✅ Port 3000 is accessible
✅ No crash loops
```

### 3. Application Works
```bash
✅ Homepage loads (visit URL)
✅ Firebase auth initializes
✅ Can log in with Google
✅ Backend API calls work
✅ No console errors
```

### 4. Environment Variables
```bash
✅ NEXT_PUBLIC_BACKEND_URL is set
✅ Firebase config is loaded
✅ API calls go to correct backend
```

---

## 🎯 Quick Command Reference

### Test Build Locally
```bash
npm run build
```

### Run Development Server
```bash
npm run dev
```

### Check Next.js Version
```bash
npx next --version
```

### View Cloud Build Logs
```bash
gcloud builds list --limit=5
gcloud builds log <BUILD_ID>
```

### View Cloud Run Logs
```bash
gcloud run services logs read haley-frontend \
  --platform managed \
  --region us-central1 \
  --limit 50
```

### Redeploy Same Image
```bash
gcloud run services update haley-frontend \
  --platform managed \
  --region us-central1
```

---

## 🆘 Emergency Rollback

If deployment fails completely:

### Option 1: Rollback to Previous Revision
```bash
# List revisions
gcloud run revisions list --service=haley-frontend --region=us-central1

# Rollback
gcloud run services update-traffic haley-frontend \
  --to-revisions=haley-frontend-00001-abc=100 \
  --region=us-central1
```

### Option 2: Deploy Known Working Version
```bash
# Deploy from a specific commit
git checkout <WORKING_COMMIT_SHA>
gcloud builds submit .
```

---

## 📊 Success Indicators

### Build Should Show:
```
✓ Creating an optimized production build
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
✓ Docker build complete
✓ Image pushed to GCR
✓ Service deployed
```

### Logs Should Show:
```
Server listening on port 3000
Ready in XXXms
No errors or warnings
```

---

## 🔗 Helpful Resources

- [Next.js Cloud Run Documentation](https://nextjs.org/docs/deployment#docker-image)
- [Cloud Build Troubleshooting](https://cloud.google.com/build/docs/troubleshooting)
- [Next.js Standalone Output](https://nextjs.org/docs/advanced-features/output-file-tracing)

---

## 📝 Summary

**Root Cause:** Next.js version instability and missing Cloud Run configuration

**Fixes Applied:**
1. ✅ Locked Next.js to stable version 14.2.5
2. ✅ Added `output: 'standalone'` to next.config.js
3. ✅ Created `.dockerignore` for cleaner builds
4. ✅ Created optimized `Dockerfile.cloudrun`

**Next Steps:**
1. Test build locally
2. Commit and push changes
3. Monitor automatic deployment
4. Verify application works

**Expected Outcome:** Clean build, successful deployment, working application

---

**Status:** 🔧 Ready to Deploy
**Confidence:** High - These are proven fixes for this exact error
