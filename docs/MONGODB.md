# MongoDB Integration Guide

## Overview

This guide covers integrating MongoDB with your Firebase application. While Firebase Firestore is the primary database, MongoDB can be used for:
- Complex aggregation pipelines
- Existing MongoDB infrastructure
- Specific MongoDB features
- Hybrid cloud architectures

## MongoDB Atlas Setup

### 1. Create MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (M0 Free tier available)
4. Wait for cluster to be provisioned

### 2. Configure Network Access

1. Go to **Network Access** in Atlas
2. Add your IP address or allow access from anywhere (0.0.0.0/0) for testing
3. For production, use specific IP ranges or VPC peering

### 3. Create Database User

1. Go to **Database Access**
2. Add a new database user
3. Set username and password
4. Grant appropriate permissions (readWrite for watch-two database)

## Integration Methods

### Option 1: MongoDB Atlas Data API

The Data API allows HTTP requests to read and write data.

#### Enable Data API

1. In MongoDB Atlas, go to **Services** → **Data API**
2. Click **Enable Data API**
3. Create an API key
4. Note your API URL (e.g., `https://data.mongodb-api.com/app/your-app-id`)

#### Example: Write to MongoDB from Firebase Function

```javascript
const functions = require('firebase-functions');
const fetch = require('node-fetch');

exports.syncToMongoDB = functions.firestore
  .document('locations/{locationId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const locationId = context.params.locationId;
    
    const mongoDoc = {
      firebaseId: locationId,
      latitude: data.latitude,
      longitude: data.longitude,
      geohash: data.geohash,
      timestamp: data.timestamp.toDate(),
      name: data.name,
      syncedAt: new Date()
    };
    
    try {
      const response = await fetch(
        `https://data.mongodb-api.com/app/${process.env.MONGO_APP_ID}/endpoint/data/v1/action/insertOne`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': process.env.MONGO_API_KEY
          },
          body: JSON.stringify({
            dataSource: 'Cluster0',
            database: 'watch-two',
            collection: 'locations',
            document: mongoDoc
          })
        }
      );
      
      const result = await response.json();
      console.log('Synced to MongoDB:', result);
      
      // Update sync status in Firestore
      await snap.ref.collection('sync_status').add({
        mongoId: result.insertedId,
        status: 'success',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      
    } catch (error) {
      console.error('MongoDB sync error:', error);
      
      // Log error to Firestore
      await snap.ref.collection('sync_status').add({
        status: 'failed',
        error: error.message,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });
```

### Option 2: MongoDB Node.js Driver

For more control, use the official MongoDB driver.

#### Install Dependencies

```bash
npm install mongodb
```

#### Connection Example

```javascript
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function connectToMongo() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('watch-two');
    const collection = db.collection('locations');
    
    return { db, collection };
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

module.exports = { connectToMongo, client };
```

#### Firebase Function with MongoDB Driver

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { connectToMongo, client } = require('./mongodb');

exports.syncLocationToMongo = functions.firestore
  .document('locations/{locationId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    
    try {
      const { collection } = await connectToMongo();
      
      const mongoDoc = {
        firebaseId: snap.id,
        latitude: data.latitude,
        longitude: data.longitude,
        location: {
          type: 'Point',
          coordinates: [data.longitude, data.latitude]
        },
        geohash: data.geohash,
        timestamp: data.timestamp.toDate(),
        name: data.name
      };
      
      const result = await collection.insertOne(mongoDoc);
      
      console.log('Inserted into MongoDB:', result.insertedId);
      
      // Record sync in Firestore
      await admin.firestore()
        .collection('mongodb_sync')
        .add({
          firebaseId: snap.id,
          mongoId: result.insertedId.toString(),
          syncStatus: 'success',
          lastModified: admin.firestore.FieldValue.serverTimestamp()
        });
        
    } catch (error) {
      console.error('Sync error:', error);
      
      // Record failure
      await admin.firestore()
        .collection('mongodb_sync')
        .add({
          firebaseId: snap.id,
          syncStatus: 'failed',
          errorMessage: error.message,
          lastModified: admin.firestore.FieldValue.serverTimestamp()
        });
    } finally {
      await client.close();
    }
  });
```

## Geospatial Queries in MongoDB

MongoDB has native support for geospatial queries using GeoJSON.

### Create Geospatial Index

```javascript
db.locations.createIndex({ location: "2dsphere" });
```

### Query Nearby Locations

```javascript
async function findNearbyLocations(longitude, latitude, radiusInMeters) {
  const { collection } = await connectToMongo();
  
  const results = await collection.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: radiusInMeters
      }
    }
  }).toArray();
  
  return results;
}
```

## Bi-directional Sync

### MongoDB to Firestore

Use MongoDB Change Streams to sync changes back to Firestore:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { MongoClient } = require('mongodb');

exports.watchMongoChanges = functions.runWith({
  timeoutSeconds: 540,
  memory: '256MB'
}).pubsub.schedule('every 5 minutes').onRun(async (context) => {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const collection = client.db('watch-two').collection('locations');
    
    // Watch for changes
    const changeStream = collection.watch();
    
    changeStream.on('change', async (change) => {
      if (change.operationType === 'insert') {
        const doc = change.fullDocument;
        
        // Sync to Firestore
        await admin.firestore()
          .collection('locations')
          .doc(doc.firebaseId || doc._id.toString())
          .set({
            latitude: doc.latitude,
            longitude: doc.longitude,
            geohash: doc.geohash,
            name: doc.name,
            timestamp: admin.firestore.Timestamp.fromDate(doc.timestamp),
            source: 'mongodb'
          });
      }
    });
    
  } catch (error) {
    console.error('Change stream error:', error);
  }
});
```

## Environment Variables

Store MongoDB credentials securely using Firebase Functions config:

```bash
firebase functions:config:set mongodb.uri="mongodb+srv://username:password@cluster.mongodb.net/watch-two"
firebase functions:config:set mongodb.api_key="your-api-key"
firebase functions:config:set mongodb.app_id="your-app-id"
```

Access in functions:

```javascript
const mongoUri = functions.config().mongodb.uri;
const apiKey = functions.config().mongodb.api_key;
```

## Sync Status Dashboard

Monitor sync status with a Firestore query:

```javascript
// Get sync statistics
const syncStats = await admin.firestore()
  .collection('mongodb_sync')
  .where('lastModified', '>=', oneDayAgo)
  .get();

const stats = {
  total: syncStats.size,
  successful: 0,
  failed: 0
};

syncStats.forEach(doc => {
  const data = doc.data();
  if (data.syncStatus === 'success') {
    stats.successful++;
  } else if (data.syncStatus === 'failed') {
    stats.failed++;
  }
});

console.log('Sync Statistics:', stats);
```

## Best Practices

1. **Use Connection Pooling**: Reuse MongoDB connections
2. **Handle Errors Gracefully**: Log failures to Firestore
3. **Batch Operations**: Sync in batches for better performance
4. **Monitor Sync Status**: Track success/failure rates
5. **Implement Retry Logic**: Retry failed syncs automatically
6. **Use Transactions**: Ensure data consistency
7. **Index Properly**: Create indexes for frequently queried fields

## Resources

- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [MongoDB Node.js Driver](https://www.mongodb.com/docs/drivers/node/)
- [MongoDB Data API](https://www.mongodb.com/docs/atlas/api/data-api/)
- [MongoDB Geospatial Queries](https://www.mongodb.com/docs/manual/geospatial-queries/)
- [Firebase Functions](https://firebase.google.com/docs/functions)
