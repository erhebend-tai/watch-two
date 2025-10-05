# Watch Two - Firebase Hosted App

A comprehensive Firebase Hosted Application with support for Firestore, MongoDB integration, BigQuery analytics, and Geospatial queries. Built for demonstrating Google Mobile offerings across Android, Dart, Java, and Kotlin.

## 🚀 Features

- **Firebase Hosting**: Fast and secure web hosting
- **Firestore**: Real-time NoSQL database with offline support
- **Geospatial Queries**: Location-based data using GeoFire
- **MongoDB Integration**: Ready for MongoDB Atlas Data API sync
- **BigQuery**: Data warehouse for analytics and reporting
- **Multi-platform Support**: Examples for Android, Dart/Flutter, Java, and Kotlin

## 📋 Prerequisites

- Node.js (v16 or higher)
- Firebase CLI (`npm install -g firebase-tools`)
- A Firebase project (create one at [Firebase Console](https://console.firebase.google.com))

## 🛠️ Setup

### 1. Clone and Install

```bash
git clone https://github.com/erhebend-tai/watch-two.git
cd watch-two
npm install
```

### 2. Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable the following services:
   - Firebase Hosting
   - Cloud Firestore
   - Authentication (Anonymous)
   - Cloud Storage
3. Get your Firebase config from Project Settings → General → Your apps
4. Update `public/app.js` with your Firebase configuration:

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

### 3. Login to Firebase

```bash
firebase login
```

### 4. Initialize Firebase Project

```bash
firebase use --add
# Select your project and give it an alias (e.g., "default")
```

## 🏃 Running Locally

### Start Firebase Emulators

```bash
npm run serve
# or
firebase emulators:start
```

This will start:
- Hosting: http://localhost:5000
- Firestore: http://localhost:8080
- Auth: http://localhost:9099
- Firebase UI: http://localhost:4000

### Test the Application

Open http://localhost:5000 in your browser and test:
1. Firestore connection
2. Add geospatial locations
3. Query nearby locations
4. Check MongoDB sync status
5. Check BigQuery export status

## 🚀 Deployment

### Deploy to Firebase Hosting

```bash
npm run deploy
# or
firebase deploy
```

### Deploy Specific Services

```bash
# Deploy only hosting
firebase deploy --only hosting

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy only Firestore indexes
firebase deploy --only firestore:indexes
```

## 📊 BigQuery Integration

### Enable BigQuery Export

1. Go to Firebase Console → Firestore
2. Click "Set up streaming" in the BigQuery section
3. Select collections to export:
   - `locations` - for geospatial data
   - `mongodb_sync` - for sync metadata
4. Choose a BigQuery dataset name

### Query Exported Data

```sql
-- Query locations in BigQuery
SELECT 
  document_id,
  JSON_EXTRACT_SCALAR(data, '$.latitude') as latitude,
  JSON_EXTRACT_SCALAR(data, '$.longitude') as longitude,
  JSON_EXTRACT_SCALAR(data, '$.name') as name,
  timestamp
FROM `your-project.firestore_export.locations_raw_latest`
WHERE JSON_EXTRACT_SCALAR(data, '$.latitude') IS NOT NULL
ORDER BY timestamp DESC
LIMIT 100;
```

## 🗄️ MongoDB Integration

### Using MongoDB Atlas Data API

1. Create a MongoDB Atlas cluster
2. Enable Data API in Atlas
3. Create an API key
4. Use the Data API endpoints to sync data:

```javascript
// Example: Sync data to MongoDB
const syncToMongoDB = async (data) => {
  const response = await fetch('https://data.mongodb-api.com/app/your-app-id/endpoint/data/v1/action/insertOne', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': 'YOUR_API_KEY'
    },
    body: JSON.stringify({
      dataSource: 'Cluster0',
      database: 'watch-two',
      collection: 'locations',
      document: data
    })
  });
  return response.json();
};
```

## 🌍 Geospatial Features

### Geohash Implementation

The app uses GeoFire for efficient geospatial queries:

```javascript
import { geohashForLocation, geohashQueryBounds } from 'geofire-common';

// Add location with geohash
const hash = geohashForLocation([latitude, longitude]);
await addDoc(collection(db, 'locations'), {
  latitude,
  longitude,
  geohash: hash,
  timestamp: Timestamp.now()
});

// Query nearby locations
const center = [37.7749, -122.4194];
const radiusInM = 50 * 1000;
const bounds = geohashQueryBounds(center, radiusInM);
// Use bounds to query Firestore
```

### Firestore Indexes

Geospatial queries require composite indexes defined in `firestore.indexes.json`:
- `geohash` + `timestamp` for efficient proximity queries
- `latitude` + `longitude` + `timestamp` for coordinate-based queries

## 📱 Mobile Platform Integration

### Android (Java/Kotlin)

See `examples/android/` for Android integration examples.

```kotlin
// Initialize Firebase in Android
class MyApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        FirebaseApp.initializeApp(this)
    }
}
```

### Flutter (Dart)

See `examples/dart/` for Flutter integration examples.

```dart
// Initialize Firebase in Flutter
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  runApp(MyApp());
}
```

### Add Firebase to Your Mobile App

1. **Android**: Download `google-services.json` from Firebase Console
2. **iOS**: Download `GoogleService-Info.plist` from Firebase Console
3. **Flutter**: Use FlutterFire CLI to configure:
   ```bash
   flutterfire configure
   ```

## 🔐 Security Rules

### Firestore Security Rules

Current rules (`firestore.rules`):
- Authenticated users can read/write
- Geospatial locations have validation for coordinates
- MongoDB sync requires admin privileges
- BigQuery exports require admin privileges

### Update Rules

```bash
firebase deploy --only firestore:rules
```

## 📚 Project Structure

```
watch-two/
├── public/                 # Web app files
│   ├── index.html         # Main HTML file
│   ├── style.css          # Styling
│   └── app.js             # Firebase integration
├── examples/              # Platform-specific examples
│   ├── android/           # Android examples
│   ├── dart/              # Flutter/Dart examples
│   ├── kotlin/            # Kotlin examples
│   └── java/              # Java examples
├── firebase.json          # Firebase configuration
├── firestore.rules        # Security rules
├── firestore.indexes.json # Database indexes
├── storage.rules          # Storage security rules
├── .firebaserc            # Firebase project aliases
└── package.json           # Node dependencies
```

## 🧪 Testing

### Local Testing with Emulators

```bash
firebase emulators:start
```

### Test Firestore Rules

```bash
firebase emulators:exec --only firestore "npm test"
```

## 📖 Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [GeoFire Documentation](https://firebase.google.com/docs/firestore/solutions/geoqueries)
- [BigQuery Documentation](https://cloud.google.com/bigquery/docs)
- [MongoDB Atlas Data API](https://www.mongodb.com/docs/atlas/api/data-api/)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for learning and development.

## 🆘 Troubleshooting

### Firebase Configuration Error

If you see "Firebase not initialized" errors:
1. Verify your Firebase config in `public/app.js`
2. Ensure your Firebase project has the required services enabled
3. Check that you're logged in: `firebase login`

### CORS Errors

If you encounter CORS errors:
1. Use Firebase emulators for local development
2. Deploy to Firebase Hosting for production
3. Don't use `file://` protocol - use a local server

### Geospatial Queries Not Working

1. Ensure indexes are deployed: `firebase deploy --only firestore:indexes`
2. Wait 2-5 minutes for indexes to build
3. Check index status in Firebase Console

## 📞 Support

For issues and questions:
- Create an issue in this repository
- Check Firebase documentation
- Visit Firebase support forums