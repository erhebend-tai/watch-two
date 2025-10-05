# Deployment Guide

This guide covers different deployment scenarios for the Watch Two Firebase app.

## Prerequisites

- Firebase CLI installed (`npm install -g firebase-tools`)
- Firebase project created
- Logged in to Firebase CLI (`firebase login`)

## Local Development

### Using Firebase Emulators

Firebase emulators allow you to develop and test locally without affecting production data.

```bash
# Start all emulators
firebase emulators:start

# Start specific emulators
firebase emulators:start --only hosting,firestore
```

Emulator URLs:
- Hosting: http://localhost:5000
- Firestore: http://localhost:8080
- Auth: http://localhost:9099
- Emulator UI: http://localhost:4000

### Development with Live Data

If you want to test with real Firebase services:

1. Update `public/app.js` with your Firebase config
2. Deploy Firestore rules: `firebase deploy --only firestore:rules`
3. Open `public/index.html` with a local server or deploy to hosting

## Production Deployment

### Full Deployment

Deploy everything at once:

```bash
firebase deploy
```

This deploys:
- Hosting (web app)
- Firestore rules
- Firestore indexes
- Storage rules

### Selective Deployment

Deploy only specific components:

```bash
# Deploy only hosting
firebase deploy --only hosting

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy only Firestore indexes
firebase deploy --only firestore:indexes

# Deploy only storage rules
firebase deploy --only storage

# Deploy multiple targets
firebase deploy --only hosting,firestore:rules
```

## Multi-Environment Setup

### Create Environments

Create separate Firebase projects for different environments:

```bash
# Add staging environment
firebase use --add
# Select your staging project, alias: staging

# Add production environment
firebase use --add
# Select your production project, alias: production

# Add development environment
firebase use --add
# Select your dev project, alias: development
```

### Switch Between Environments

```bash
# Switch to staging
firebase use staging

# Switch to production
firebase use production

# See current project
firebase use
```

### Deploy to Specific Environment

```bash
# Deploy to staging
firebase use staging
firebase deploy

# Deploy to production
firebase use production
firebase deploy
```

## Automated Deployment (CI/CD)

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: watch-two
```

### Set Up Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Go to **IAM & Admin** → **Service Accounts**
4. Create a new service account
5. Grant roles:
   - Firebase Admin
   - Cloud Datastore User
6. Create a JSON key
7. Add key as GitHub secret: `FIREBASE_SERVICE_ACCOUNT`

## Deployment Best Practices

### Pre-Deployment Checklist

- [ ] Test locally with emulators
- [ ] Update version in `package.json`
- [ ] Review Firestore rules for security
- [ ] Check Firestore indexes are optimal
- [ ] Test with real data in staging environment
- [ ] Verify Firebase config is correct
- [ ] Check for hardcoded credentials (should use environment variables)
- [ ] Run any tests if available

### Post-Deployment Checklist

- [ ] Verify app is accessible at the hosting URL
- [ ] Test core functionality (add location, query locations)
- [ ] Check Firebase Console for errors
- [ ] Monitor Firebase Performance
- [ ] Check Firestore usage and quotas
- [ ] Verify security rules are working correctly

## Rollback Strategy

### Rollback to Previous Version

Firebase Hosting maintains previous deployments:

```bash
# List all releases
firebase hosting:channel:list

# View deployment history
firebase hosting:channel:deploy --only hosting

# Rollback through console
# Go to Firebase Console → Hosting → View history
# Click "Rollback" on the desired version
```

### Emergency Rollback

If you need to quickly rollback:

1. Go to Firebase Console → Hosting
2. Click on "Release history"
3. Find the last working version
4. Click "Rollback"

## Monitoring Deployment

### View Logs

```bash
# View hosting logs
firebase hosting:channel:list

# View function logs (if using Cloud Functions)
firebase functions:log

# View specific function logs
firebase functions:log --only functionName
```

### Monitor in Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Analytics** → **Dashboard**
4. Monitor:
   - Active users
   - Page views
   - Errors
   - Performance metrics

## Security Considerations

### Before Production Deployment

1. **Update Firestore Rules**
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

2. **Enable App Check** (recommended)
   - Protects backend resources from abuse
   - Go to Firebase Console → App Check
   - Register your web app
   - Add reCAPTCHA v3

3. **Set Up CORS** (if needed)
   - Configure CORS for Cloud Storage
   - Configure CORS for Cloud Functions

4. **Review Security Rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

## Performance Optimization

### Enable Caching

Update `firebase.json`:

```json
{
  "hosting": {
    "public": "public",
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

### Optimize Firestore

1. Create compound indexes for complex queries
2. Use pagination for large datasets
3. Implement proper error handling
4. Cache frequently accessed data

## Troubleshooting Deployment

### Common Issues

**Issue: "Permission denied"**
```bash
# Solution: Re-login
firebase login --reauth
```

**Issue: "Project not found"**
```bash
# Solution: Set correct project
firebase use --add
```

**Issue: "Indexes not ready"**
- Wait 2-5 minutes for indexes to build
- Check index status in Firebase Console

**Issue: "Quota exceeded"**
- Check Firebase Console for usage
- Upgrade plan if needed
- Optimize queries to reduce reads

## Cost Management

### Monitor Usage

1. Go to Firebase Console → Usage and Billing
2. Set budget alerts
3. Monitor:
   - Firestore reads/writes
   - Storage usage
   - Bandwidth
   - Cloud Functions invocations

### Cost Optimization Tips

1. Use Firebase emulators for development
2. Implement pagination to reduce reads
3. Cache data when possible
4. Use security rules to prevent unauthorized access
5. Clean up unused data regularly
6. Use Firestore bundle for initial data load

## Resources

- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- [Firebase Best Practices](https://firebase.google.com/docs/rules/best-practices)
