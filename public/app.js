// Import Firebase SDKs
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, limit, Timestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Import GeoFire for geospatial queries
import { geohashForLocation, geohashQueryBounds, distanceBetween } from 'https://unpkg.com/geofire-common@6.0.0/dist/index.esm.js';

// Firebase configuration
// TODO: Replace with your Firebase project configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
let app, db, auth;
try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  
  // Sign in anonymously for demo purposes
  signInAnonymously(auth).catch((error) => {
    console.error("Error signing in anonymously:", error);
  });
  
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

// Helper function to display status
function showStatus(elementId, message, type = 'info') {
  const element = document.getElementById(elementId);
  element.textContent = message;
  element.className = `status ${type}`;
  element.style.display = 'block';
}

// Test Firestore connection
document.getElementById('testFirestore').addEventListener('click', async () => {
  try {
    showStatus('firestoreStatus', 'Testing Firestore connection...', 'info');
    
    // Try to read from a collection
    const testCollection = collection(db, 'test');
    const snapshot = await getDocs(query(testCollection, limit(1)));
    
    showStatus('firestoreStatus', 
      `✅ Firestore connected successfully! Documents in test collection: ${snapshot.size}`, 
      'success'
    );
  } catch (error) {
    showStatus('firestoreStatus', 
      `❌ Error connecting to Firestore: ${error.message}`, 
      'error'
    );
    console.error('Firestore error:', error);
  }
});

// Add location with geohash
document.getElementById('addLocation').addEventListener('click', async () => {
  const lat = parseFloat(document.getElementById('latitude').value);
  const lon = parseFloat(document.getElementById('longitude').value);
  
  if (isNaN(lat) || isNaN(lon)) {
    showStatus('geospatialStatus', '❌ Please enter valid latitude and longitude', 'error');
    return;
  }
  
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    showStatus('geospatialStatus', '❌ Coordinates out of range', 'error');
    return;
  }
  
  try {
    showStatus('geospatialStatus', 'Adding location...', 'info');
    
    // Calculate geohash
    const hash = geohashForLocation([lat, lon]);
    
    // Add to Firestore
    const locationsRef = collection(db, 'locations');
    const docRef = await addDoc(locationsRef, {
      latitude: lat,
      longitude: lon,
      geohash: hash,
      timestamp: Timestamp.now(),
      name: `Location at ${lat.toFixed(4)}, ${lon.toFixed(4)}`
    });
    
    showStatus('geospatialStatus', 
      `✅ Location added successfully! ID: ${docRef.id}<br>Geohash: ${hash}`, 
      'success'
    );
    
    // Clear inputs
    document.getElementById('latitude').value = '';
    document.getElementById('longitude').value = '';
  } catch (error) {
    showStatus('geospatialStatus', 
      `❌ Error adding location: ${error.message}`, 
      'error'
    );
    console.error('Add location error:', error);
  }
});

// Query nearby locations
document.getElementById('queryLocations').addEventListener('click', async () => {
  try {
    showStatus('geospatialStatus', 'Querying locations...', 'info');
    
    // Use a default center point (San Francisco)
    const center = [37.7749, -122.4194];
    const radiusInM = 50000; // 50km radius
    
    const locationsRef = collection(db, 'locations');
    const q = query(locationsRef, orderBy('timestamp', 'desc'), limit(10));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      showStatus('geospatialStatus', 
        'ℹ️ No locations found. Add some locations first!', 
        'info'
      );
      return;
    }
    
    let results = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      results.push(`📍 ${data.name} (${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)})`);
    });
    
    showStatus('geospatialStatus', 
      `✅ Found ${results.length} locations:<br>${results.join('<br>')}`, 
      'success'
    );
  } catch (error) {
    showStatus('geospatialStatus', 
      `❌ Error querying locations: ${error.message}`, 
      'error'
    );
    console.error('Query error:', error);
  }
});

// Check MongoDB sync status
document.getElementById('checkMongoSync').addEventListener('click', async () => {
  try {
    showStatus('mongoStatus', 'Checking MongoDB sync status...', 'info');
    
    const syncRef = collection(db, 'mongodb_sync');
    const q = query(syncRef, orderBy('lastModified', 'desc'), limit(5));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      showStatus('mongoStatus', 
        'ℹ️ No MongoDB sync records found. This is a placeholder for MongoDB Atlas Data API integration.', 
        'info'
      );
      return;
    }
    
    let syncInfo = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      syncInfo.push(`🔄 ${doc.id}: ${data.syncStatus || 'unknown'}`);
    });
    
    showStatus('mongoStatus', 
      `✅ MongoDB Sync Status:<br>${syncInfo.join('<br>')}`, 
      'success'
    );
  } catch (error) {
    showStatus('mongoStatus', 
      `❌ Error checking sync: ${error.message}`, 
      'error'
    );
    console.error('MongoDB sync error:', error);
  }
});

// Check BigQuery export status
document.getElementById('checkBigQuery').addEventListener('click', async () => {
  try {
    showStatus('bigqueryStatus', 'Checking BigQuery export status...', 'info');
    
    const exportRef = collection(db, 'bigquery_exports');
    const q = query(exportRef, limit(5));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      showStatus('bigqueryStatus', 
        'ℹ️ No BigQuery export records found.<br><br>' +
        'To enable BigQuery exports:<br>' +
        '1. Go to Firebase Console → Firestore<br>' +
        '2. Enable "Stream to BigQuery"<br>' +
        '3. Select collections to export', 
        'info'
      );
      return;
    }
    
    let exportInfo = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      exportInfo.push(`📊 ${doc.id}: ${data.status || 'pending'}`);
    });
    
    showStatus('bigqueryStatus', 
      `✅ BigQuery Exports:<br>${exportInfo.join('<br>')}`, 
      'success'
    );
  } catch (error) {
    showStatus('bigqueryStatus', 
      `❌ Error checking exports: ${error.message}`, 
      'error'
    );
    console.error('BigQuery error:', error);
  }
});

console.log('App.js loaded successfully');
