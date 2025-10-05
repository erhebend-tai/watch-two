# Android (Kotlin) Integration Example

## Setup

### 1. Add Firebase to Your Android Project

Add to your project-level `build.gradle`:

```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

Add to your app-level `build.gradle`:

```gradle
plugins {
    id 'com.android.application'
    id 'kotlin-android'
    id 'com.google.gms.google-services'
}

dependencies {
    // Firebase BOM
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    
    // Firebase products
    implementation 'com.google.firebase:firebase-firestore-ktx'
    implementation 'com.google.firebase:firebase-auth-ktx'
    implementation 'com.google.firebase:firebase-storage-ktx'
    
    // GeoFire for geospatial queries
    implementation 'com.firebase:geofire-android-common:3.2.0'
    
    // Kotlin Coroutines
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3'
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-play-services:1.7.3'
}
```

### 2. Download google-services.json

1. Go to Firebase Console
2. Project Settings → Your apps → Download `google-services.json`
3. Place it in your `app/` directory

## Example Code

### Initialize Firebase

```kotlin
// Application class
class WatchTwoApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        // Firebase is automatically initialized
    }
}
```

### Firestore Operations

```kotlin
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase
import kotlinx.coroutines.tasks.await

class FirestoreManager {
    private val db: FirebaseFirestore = Firebase.firestore
    
    // Add location with geospatial data
    suspend fun addLocation(lat: Double, lon: Double): String {
        val geohash = GeoFireUtils.getGeoHashForLocation(GeoLocation(lat, lon))
        
        val location = hashMapOf(
            "latitude" to lat,
            "longitude" to lon,
            "geohash" to geohash,
            "timestamp" to FieldValue.serverTimestamp(),
            "name" to "Location at $lat, $lon"
        )
        
        val docRef = db.collection("locations")
            .add(location)
            .await()
        
        return docRef.id
    }
    
    // Query nearby locations
    suspend fun queryNearbyLocations(
        centerLat: Double,
        centerLon: Double,
        radiusInM: Double
    ): List<LocationData> {
        val center = GeoLocation(centerLat, centerLon)
        val bounds = GeoFireUtils.getGeoHashQueryBounds(center, radiusInM)
        
        val tasks = bounds.map { bound ->
            db.collection("locations")
                .orderBy("geohash")
                .startAt(bound.startHash)
                .endAt(bound.endHash)
                .get()
        }
        
        val results = mutableListOf<LocationData>()
        tasks.forEach { task ->
            val snapshot = task.await()
            for (doc in snapshot.documents) {
                val lat = doc.getDouble("latitude") ?: continue
                val lon = doc.getDouble("longitude") ?: continue
                val name = doc.getString("name") ?: ""
                
                val distance = GeoFireUtils.getDistanceBetween(
                    center,
                    GeoLocation(lat, lon)
                )
                
                if (distance <= radiusInM) {
                    results.add(LocationData(doc.id, name, lat, lon, distance))
                }
            }
        }
        
        return results.sortedBy { it.distance }
    }
    
    // Test Firestore connection
    suspend fun testConnection(): Boolean {
        return try {
            db.collection("test")
                .limit(1)
                .get()
                .await()
            true
        } catch (e: Exception) {
            false
        }
    }
}

data class LocationData(
    val id: String,
    val name: String,
    val latitude: Double,
    val longitude: Double,
    val distance: Double
)
```

### ViewModel Example

```kotlin
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class MainViewModel : ViewModel() {
    private val firestoreManager = FirestoreManager()
    
    private val _locations = MutableStateFlow<List<LocationData>>(emptyList())
    val locations: StateFlow<List<LocationData>> = _locations
    
    private val _status = MutableStateFlow("")
    val status: StateFlow<String> = _status
    
    fun addLocation(lat: Double, lon: Double) {
        viewModelScope.launch {
            try {
                val id = firestoreManager.addLocation(lat, lon)
                _status.value = "Location added: $id"
            } catch (e: Exception) {
                _status.value = "Error: ${e.message}"
            }
        }
    }
    
    fun queryNearby(lat: Double, lon: Double, radiusKm: Double) {
        viewModelScope.launch {
            try {
                val results = firestoreManager.queryNearbyLocations(
                    lat, lon, radiusKm * 1000
                )
                _locations.value = results
                _status.value = "Found ${results.size} locations"
            } catch (e: Exception) {
                _status.value = "Error: ${e.message}"
            }
        }
    }
}
```

### Compose UI Example

```kotlin
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun LocationScreen(viewModel: MainViewModel) {
    val locations by viewModel.locations.collectAsState()
    val status by viewModel.status.collectAsState()
    
    var latitude by remember { mutableStateOf("") }
    var longitude by remember { mutableStateOf("") }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text("Firebase Location Demo", style = MaterialTheme.typography.headlineMedium)
        
        Spacer(modifier = Modifier.height(16.dp))
        
        OutlinedTextField(
            value = latitude,
            onValueChange = { latitude = it },
            label = { Text("Latitude") },
            modifier = Modifier.fillMaxWidth()
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        OutlinedTextField(
            value = longitude,
            onValueChange = { longitude = it },
            label = { Text("Longitude") },
            modifier = Modifier.fillMaxWidth()
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(
                onClick = {
                    val lat = latitude.toDoubleOrNull() ?: return@Button
                    val lon = longitude.toDoubleOrNull() ?: return@Button
                    viewModel.addLocation(lat, lon)
                },
                modifier = Modifier.weight(1f)
            ) {
                Text("Add Location")
            }
            
            Button(
                onClick = {
                    viewModel.queryNearby(37.7749, -122.4194, 50.0)
                },
                modifier = Modifier.weight(1f)
            ) {
                Text("Query Nearby")
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Text(status)
        
        Spacer(modifier = Modifier.height(16.dp))
        
        locations.forEach { location ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(location.name, style = MaterialTheme.typography.titleMedium)
                    Text("Distance: ${location.distance.toInt()}m")
                }
            }
        }
    }
}
```

## Resources

- [Firebase Android Documentation](https://firebase.google.com/docs/android/setup)
- [Firestore Android Guide](https://firebase.google.com/docs/firestore/quickstart)
- [GeoFire for Android](https://github.com/firebase/geofire-android)
