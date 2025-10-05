# Firebase Configuration Template

This file contains templates and examples for configuring your Firebase project.

## Web App Configuration (public/app.js)

Replace the placeholder configuration in `public/app.js` with your actual Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### Where to Find Your Config

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click the gear icon (⚙️) → Project settings
4. Scroll down to "Your apps"
5. Select your web app or click "Add app" if you haven't created one
6. Copy the configuration object

## Android Configuration

### google-services.json

Download from Firebase Console:
1. Project Settings → Your apps
2. Select your Android app
3. Download `google-services.json`
4. Place in `android/app/` directory

### build.gradle (Project level)

```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

### build.gradle (App level)

```gradle
plugins {
    id 'com.android.application'
    id 'kotlin-android'
    id 'com.google.gms.google-services'
}

dependencies {
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-firestore-ktx'
    implementation 'com.google.firebase:firebase-auth-ktx'
}
```

## iOS Configuration

### GoogleService-Info.plist

Download from Firebase Console:
1. Project Settings → Your apps
2. Select your iOS app
3. Download `GoogleService-Info.plist`
4. Add to your Xcode project

### Podfile

```ruby
platform :ios, '13.0'

target 'YourApp' do
  use_frameworks!
  
  # Firebase pods
  pod 'Firebase/Core'
  pod 'Firebase/Firestore'
  pod 'Firebase/Auth'
  pod 'Firebase/Storage'
end
```

## Flutter Configuration

### Using FlutterFire CLI (Recommended)

```bash
# Install FlutterFire CLI
dart pub global activate flutterfire_cli

# Configure Firebase for your Flutter app
flutterfire configure
```

This will automatically:
- Create Firebase projects for iOS and Android
- Download configuration files
- Generate `lib/firebase_options.dart`

### Manual Configuration

If you prefer manual configuration:

#### pubspec.yaml

```yaml
dependencies:
  firebase_core: ^2.24.2
  firebase_auth: ^4.16.0
  firebase_firestore: ^4.14.0
  cloud_firestore: ^4.14.0
```

#### lib/firebase_options.dart

```dart
import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'YOUR_API_KEY',
    appId: 'YOUR_APP_ID',
    messagingSenderId: 'YOUR_SENDER_ID',
    projectId: 'YOUR_PROJECT_ID',
    authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
    storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'YOUR_ANDROID_API_KEY',
    appId: 'YOUR_ANDROID_APP_ID',
    messagingSenderId: 'YOUR_SENDER_ID',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'YOUR_IOS_API_KEY',
    appId: 'YOUR_IOS_APP_ID',
    messagingSenderId: 'YOUR_SENDER_ID',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_PROJECT_ID.appspot.com',
    iosBundleId: 'com.example.yourapp',
  );
}
```

## Environment Variables

For security, use environment variables for sensitive configuration:

### Firebase Functions (.env)

Create a `.env` file for Firebase Functions:

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/watch-two
MONGODB_API_KEY=your_api_key
BIGQUERY_PROJECT_ID=your_project_id
```

### Firebase Functions Config

Set config values:

```bash
firebase functions:config:set mongodb.uri="mongodb+srv://..."
firebase functions:config:set mongodb.api_key="your_key"
firebase functions:config:set bigquery.project_id="your_project"
```

Access in functions:

```javascript
const mongoUri = functions.config().mongodb.uri;
const apiKey = functions.config().mongodb.api_key;
```

## MongoDB Atlas Configuration

### Connection String Template

```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

Example:
```
mongodb+srv://watch_two_user:strongPassword123@cluster0.abc123.mongodb.net/watch-two?retryWrites=true&w=majority
```

### Data API Configuration

```javascript
const MONGO_CONFIG = {
  apiUrl: 'https://data.mongodb-api.com/app/your-app-id/endpoint/data/v1',
  apiKey: 'your_api_key',
  dataSource: 'Cluster0',
  database: 'watch-two',
  collection: 'locations'
};
```

## BigQuery Configuration

### Dataset Configuration

```javascript
const BIGQUERY_CONFIG = {
  projectId: 'your-project-id',
  datasetId: 'firestore_export',
  location: 'US'
};
```

### Service Account Key (for backend only)

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "service-account@your-project.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs"
}
```

**Important**: Never commit service account keys to version control!

## Security Best Practices

### For Web Apps

1. **Restrict API Keys**
   - Go to Google Cloud Console → APIs & Services → Credentials
   - Click on your API key
   - Add HTTP referrer restrictions
   - Add your domain(s)

2. **Enable App Check**
   - Go to Firebase Console → App Check
   - Register your app
   - Add reCAPTCHA v3 site key

### For Mobile Apps

1. **Add SHA-1/SHA-256 Fingerprints** (Android)
   ```bash
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey
   ```
   Add fingerprints in Firebase Console → Project Settings → Your apps

2. **Add Bundle ID** (iOS)
   Add your bundle ID in Firebase Console → Project Settings → Your apps

## Firestore Security Rules Template

Update `firestore.rules` for production:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // Public read, authenticated write
    match /locations/{locationId} {
      allow read: if true;
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn() && isOwner(resource.data.userId);
    }
    
    // Admin only
    match /mongodb_sync/{docId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && request.auth.token.admin == true;
    }
  }
}
```

## Checklist

- [ ] Replaced Firebase config in `public/app.js`
- [ ] Downloaded and placed `google-services.json` (Android)
- [ ] Downloaded and placed `GoogleService-Info.plist` (iOS)
- [ ] Configured FlutterFire (if using Flutter)
- [ ] Set up MongoDB connection string (if using MongoDB)
- [ ] Configured BigQuery dataset (if using BigQuery)
- [ ] Updated security rules for production
- [ ] Restricted API keys in Google Cloud Console
- [ ] Added App Check (recommended)
- [ ] Set up environment variables for sensitive data
- [ ] Tested configuration in development environment

## Need Help?

- [Firebase Console](https://console.firebase.google.com)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Google Cloud Console](https://console.cloud.google.com)
- [MongoDB Atlas Console](https://cloud.mongodb.com)
