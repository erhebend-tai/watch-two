# Features Documentation

Complete guide to all features available in the Watch Two Firebase application.

## 🗄️ Firestore Database

### Real-time NoSQL Database

Firestore provides a flexible, scalable database for mobile, web, and server development.

#### Features
- Real-time synchronization across all clients
- Offline support with automatic sync when online
- Powerful querying capabilities
- Automatic scaling
- Strong consistency

#### Collections

**locations**
- Stores geospatial data points
- Fields:
  - `latitude` (number): Latitude coordinate
  - `longitude` (number): Longitude coordinate
  - `geohash` (string): GeoHash for efficient queries
  - `timestamp` (timestamp): Creation time
  - `name` (string): Location name/description

**mongodb_sync**
- Tracks synchronization status with MongoDB
- Fields:
  - `firebaseId` (string): Original Firestore document ID
  - `mongoId` (string): MongoDB document ID
  - `syncStatus` (string): 'success', 'failed', 'pending'
  - `errorMessage` (string): Error details if failed
  - `lastModified` (timestamp): Last sync attempt

**bigquery_exports**
- Metadata about BigQuery exports
- Fields:
  - `collection` (string): Source collection name
  - `exportStatus` (string): Export status
  - `lastExport` (timestamp): Last export time
  - `recordCount` (number): Number of records exported

#### Security Rules

Current rules (see `firestore.rules`):
- Public read access for locations
- Authenticated write access
- Admin-only access for sync collections
- Coordinate validation for locations

#### Indexes

Optimized indexes for common queries (see `firestore.indexes.json`):
- Composite index on `timestamp` + `latitude` + `longitude`
- Composite index on `geohash` + `timestamp`
- Index on `syncStatus` + `lastModified` for MongoDB sync

## 🌍 Geospatial Features

### GeoFire Integration

Efficient location-based queries using geohashing.

#### How It Works

1. **Geohashing**: Converts lat/lon to a string hash
   - Nearby locations have similar hash prefixes
   - Enables efficient range queries
   
2. **Query Radius**: Find locations within X kilometers
   ```javascript
   // Center point
   const center = [37.7749, -122.4194]; // San Francisco
   const radiusInM = 50000; // 50km
   ```

3. **Distance Calculation**: Haversine formula for accurate distances
   ```javascript
   const distance = GeoFireUtils.getDistanceBetween(
     new GeoLocation(lat1, lon1),
     new GeoLocation(lat2, lon2)
   );
   ```

#### Use Cases

- Find nearby restaurants, stores, or services
- Location-based notifications
- Delivery radius checking
- Proximity-based social features
- Real-estate property searches

#### Best Practices

- Always store both coordinates and geohash
- Use appropriate radius for your use case
- Implement pagination for large result sets
- Consider caching frequently queried areas
- Use Firestore composite indexes

## 📊 BigQuery Integration

### Data Warehousing and Analytics

Export Firestore data to BigQuery for advanced analytics.

#### Features

- **Real-time Streaming**: Automatic export as data changes
- **Historical Analysis**: Query data over time
- **Complex Analytics**: Use SQL for advanced queries
- **Data Visualization**: Connect to Data Studio
- **Machine Learning**: Use BigQuery ML

#### Setup Process

1. Enable BigQuery in Firebase Console
2. Select collections to export
3. Choose or create a dataset
4. Data streams automatically

#### Example Queries

**Count locations by region**
```sql
SELECT 
  CASE 
    WHEN lat BETWEEN 37 AND 38 AND lon BETWEEN -123 AND -122 
      THEN 'Bay Area'
    ELSE 'Other'
  END as region,
  COUNT(*) as count
FROM `project.dataset.locations_raw_latest`
GROUP BY region
```

**Time series analysis**
```sql
SELECT 
  DATE(timestamp) as date,
  COUNT(*) as locations_added
FROM `project.dataset.locations_raw_latest`
GROUP BY date
ORDER BY date DESC
LIMIT 30
```

#### Cost Optimization

- Use table partitioning by date
- Query only needed columns
- Set up query cost alerts
- Use clustering for frequently filtered fields
- Consider scheduled queries vs real-time

## 🗄️ MongoDB Integration

### Hybrid Database Architecture

Integrate MongoDB for specific use cases where it excels.

#### Why MongoDB?

- **Aggregation Pipeline**: Complex data transformations
- **Existing Infrastructure**: Integrate with existing MongoDB systems
- **Specific Features**: TTL indexes, full-text search, etc.
- **Data Migration**: Gradual migration path

#### Integration Methods

**Option 1: MongoDB Atlas Data API**
- REST API for MongoDB operations
- No persistent connection needed
- Easier for serverless architectures

**Option 2: MongoDB Driver**
- Direct connection to MongoDB
- More control and features
- Better for complex operations

#### Synchronization

**Firestore → MongoDB**
```javascript
// Trigger on Firestore write
exports.syncToMongo = functions.firestore
  .document('locations/{locationId}')
  .onCreate(async (snap, context) => {
    // Sync logic here
  });
```

**MongoDB → Firestore**
```javascript
// Use Change Streams
const changeStream = collection.watch();
changeStream.on('change', async (change) => {
  // Sync to Firestore
});
```

#### Use Cases

- Legacy system integration
- Complex aggregations
- Time-series data with TTL
- Full-text search
- Graph-like data structures

## 🔐 Authentication

### Anonymous Authentication

Simple authentication for demo and testing purposes.

#### Features

- No user credentials needed
- Each user gets a unique ID
- Enables security rules enforcement
- Can be upgraded to permanent account

#### Implementation

```javascript
import { getAuth, signInAnonymously } from 'firebase/auth';

const auth = getAuth();
signInAnonymously(auth)
  .then((userCredential) => {
    const user = userCredential.user;
    console.log('User ID:', user.uid);
  });
```

#### Upgrading to Permanent Account

```javascript
// Link to email/password
const credential = EmailAuthProvider.credential(email, password);
await linkWithCredential(auth.currentUser, credential);

// Link to Google
const provider = new GoogleAuthProvider();
await linkWithPopup(auth.currentUser, provider);
```

## 🔥 Firebase Hosting

### Fast and Secure Web Hosting

Global CDN for web apps with SSL certificates.

#### Features

- **Global CDN**: Fast delivery worldwide
- **Free SSL**: Automatic HTTPS
- **Custom Domains**: Use your own domain
- **Rollback**: Easy version management
- **Preview Channels**: Test before deploying

#### Configuration

See `firebase.json`:
```json
{
  "hosting": {
    "public": "public",
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

#### Performance

- Caching headers for static assets
- HTTP/2 server push
- Brotli compression
- Image optimization (via CDN)

## 💾 Cloud Storage

### File Storage for User Content

Store and serve user-generated content.

#### Features

- Secure file uploads and downloads
- Automatic scaling
- Integration with Firebase Auth
- Image optimization
- Resume uploads for large files

#### Security Rules

See `storage.rules`:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

#### Use Cases

- User profile pictures
- Document uploads
- Media files (photos, videos)
- Export files
- Backup data

## 🎯 Use Case Examples

### Location-Based App

1. User opens app
2. Request location permission
3. Get current coordinates
4. Query nearby locations within 5km
5. Display on map
6. Allow user to add new locations

### Analytics Dashboard

1. Export data to BigQuery
2. Create Data Studio dashboard
3. Show metrics:
   - Total locations
   - Locations per day/week
   - Geographic distribution
   - Popular areas

### Multi-Platform App

1. Web app (this project)
2. Android app (Kotlin/Java examples)
3. iOS app (Swift - use Flutter example as reference)
4. All share same Firebase backend
5. Real-time sync across platforms

## 📱 Mobile Integration

### Supported Platforms

- **Android** (Java & Kotlin)
- **iOS** (via Flutter/Dart)
- **Flutter** (Cross-platform)
- **React Native** (can be added)

### Key Features for Mobile

- Offline persistence
- Background sync
- Push notifications (can be added)
- Location tracking
- Maps integration

## 🔄 Real-time Features

### Live Updates

Changes in Firestore sync automatically to all connected clients.

#### Implementation

```javascript
// Listen to collection changes
onSnapshot(collection(db, 'locations'), (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === 'added') {
      console.log('New location:', change.doc.data());
    }
    if (change.type === 'modified') {
      console.log('Modified location:', change.doc.data());
    }
    if (change.type === 'removed') {
      console.log('Removed location:', change.doc.data());
    }
  });
});
```

## 🚀 Performance Optimization

### Best Practices

1. **Pagination**: Load data in chunks
2. **Caching**: Cache frequently accessed data
3. **Indexes**: Create for all queries
4. **Offline**: Enable offline persistence
5. **Lazy Loading**: Load data as needed
6. **Query Optimization**: Limit result sets

## 📈 Monitoring and Analytics

### Available Metrics

- **Firebase Performance**: Page load times, network requests
- **Firebase Analytics**: User behavior, events
- **Crashlytics**: Error tracking (mobile)
- **BigQuery**: Custom analytics
- **Cloud Monitoring**: Infrastructure metrics

## 🔧 Extensibility

### Adding New Features

The architecture supports easy extension:

1. **New Collections**: Add to Firestore
2. **New Rules**: Update security rules
3. **New Functions**: Add Cloud Functions
4. **New Indexes**: Update index file
5. **New APIs**: Integrate third-party services

### Plugin Architecture

- Firebase Extensions marketplace
- Cloud Functions for backend logic
- Webhooks for external integrations
- REST APIs for custom clients

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Data Modeling](https://firebase.google.com/docs/firestore/data-model)
- [GeoFire Documentation](https://firebase.google.com/docs/firestore/solutions/geoqueries)
- [BigQuery Documentation](https://cloud.google.com/bigquery/docs)
- [MongoDB Atlas Documentation](https://www.mongodb.com/docs/atlas/)
