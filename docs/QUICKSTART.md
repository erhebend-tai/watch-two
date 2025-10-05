# Quick Start Guide

Get your Firebase app up and running in 5 minutes!

## Prerequisites

- Node.js 16+ installed
- A Google account
- Git (optional, for cloning)

## Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

## Step 2: Login to Firebase

```bash
firebase login
```

This will open a browser window. Login with your Google account.

## Step 3: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Enter project name: `watch-two` (or your preferred name)
4. Follow the setup wizard

## Step 4: Enable Firebase Services

In the Firebase Console:

### Enable Firestore
1. Go to **Firestore Database**
2. Click **Create database**
3. Choose production mode (or test mode for development)
4. Select a location (e.g., `us-central1`)

### Enable Authentication
1. Go to **Authentication**
2. Click **Get started**
3. Enable **Anonymous** provider
4. Click **Save**

### Enable Storage (Optional)
1. Go to **Storage**
2. Click **Get started**
3. Use default security rules

## Step 5: Connect Your Local Project

```bash
# In the project directory
firebase use --add
```

Select your Firebase project from the list and give it an alias (e.g., "default").

## Step 6: Get Your Firebase Config

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click on the web icon (</>) or select your existing web app
4. Copy your Firebase configuration object

It will look like this:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## Step 7: Update Your Config

Open `public/app.js` and replace the placeholder config:

```javascript
// Replace this section with your actual config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Step 8: Install Dependencies

```bash
npm install
```

## Step 9: Test Locally

```bash
firebase emulators:start
```

Or use the npm script:

```bash
npm run serve
```

Open http://localhost:5000 in your browser.

## Step 10: Deploy to Firebase Hosting

```bash
firebase deploy
```

Or use the npm script:

```bash
npm run deploy
```

Your app will be live at: `https://your-project.web.app`

## Next Steps

### Enable BigQuery Export (Optional)

1. Go to Firebase Console → Firestore
2. Click on **Integrations** tab
3. Find **BigQuery** and click **Set up streaming**
4. Select collections: `locations`, `mongodb_sync`
5. Choose or create a dataset

See [docs/BIGQUERY.md](docs/BIGQUERY.md) for more details.

### Set Up MongoDB Integration (Optional)

1. Create a MongoDB Atlas account
2. Create a free cluster
3. Set up the Data API
4. Configure Firebase Functions for sync

See [docs/MONGODB.md](docs/MONGODB.md) for detailed instructions.

### Mobile App Integration

Check out the examples folder for platform-specific guides:

- **Android (Kotlin)**: [examples/kotlin/README.md](examples/kotlin/README.md)
- **Android (Java)**: [examples/java/README.md](examples/java/README.md)
- **Flutter (Dart)**: [examples/dart/README.md](examples/dart/README.md)

## Troubleshooting

### "Firebase project not found"

Run `firebase use --add` again and make sure you select the correct project.

### "Permission denied" errors in Firestore

Make sure:
1. You're signed in (check browser console)
2. Firestore rules allow your operations
3. Run `firebase deploy --only firestore:rules`

### Emulators not starting

Make sure ports 5000, 8080, 9099, 4000, 9199 are not in use.

### Can't deploy

Make sure:
1. You're logged in: `firebase login`
2. You have the correct project selected: `firebase use your-project-id`
3. You have owner/editor permissions on the project

## Common Commands

```bash
# See current project
firebase projects:list

# Switch project
firebase use project-id

# Deploy specific service
firebase deploy --only hosting
firebase deploy --only firestore
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes

# View logs
firebase functions:log

# Open Firebase Console
firebase open
```

## Support

- [Firebase Documentation](https://firebase.google.com/docs)
- [GitHub Issues](https://github.com/erhebend-tai/watch-two/issues)
- [Firebase Support](https://firebase.google.com/support)
