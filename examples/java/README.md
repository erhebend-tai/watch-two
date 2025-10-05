# Android (Java) Integration Example

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
    id 'com.google.gms.google-services'
}

dependencies {
    // Firebase BOM
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    
    // Firebase products
    implementation 'com.google.firebase:firebase-firestore'
    implementation 'com.google.firebase:firebase-auth'
    implementation 'com.google.firebase:firebase-storage'
    
    // GeoFire for geospatial queries
    implementation 'com.firebase:geofire-android-common:3.2.0'
}
```

### 2. Download google-services.json

1. Go to Firebase Console
2. Project Settings → Your apps → Download `google-services.json`
3. Place it in your `app/` directory

## Example Code

### Initialize Firebase

```java
// Application class
import android.app.Application;
import com.google.firebase.FirebaseApp;

public class WatchTwoApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        // Firebase is automatically initialized
        FirebaseApp.initializeApp(this);
    }
}
```

Update `AndroidManifest.xml`:

```xml
<application
    android:name=".WatchTwoApplication"
    ...>
```

### Firestore Manager

```java
import com.firebase.geofire.GeoFireUtils;
import com.firebase.geofire.GeoLocation;
import com.firebase.geofire.GeoQueryBounds;
import com.google.android.gms.tasks.Task;
import com.google.android.gms.tasks.Tasks;
import com.google.firebase.firestore.DocumentReference;
import com.google.firebase.firestore.DocumentSnapshot;
import com.google.firebase.firestore.FieldValue;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.Query;
import com.google.firebase.firestore.QuerySnapshot;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class FirestoreManager {
    private final FirebaseFirestore db;
    
    public FirestoreManager() {
        db = FirebaseFirestore.getInstance();
    }
    
    // Add location with geospatial data
    public Task<String> addLocation(double lat, double lon) {
        String geohash = GeoFireUtils.getGeoHashForLocation(
            new GeoLocation(lat, lon)
        );
        
        Map<String, Object> location = new HashMap<>();
        location.put("latitude", lat);
        location.put("longitude", lon);
        location.put("geohash", geohash);
        location.put("timestamp", FieldValue.serverTimestamp());
        location.put("name", "Location at " + lat + ", " + lon);
        
        return db.collection("locations")
            .add(location)
            .continueWith(task -> {
                if (task.isSuccessful()) {
                    return task.getResult().getId();
                } else {
                    throw task.getException();
                }
            });
    }
    
    // Query nearby locations
    public Task<List<LocationData>> queryNearbyLocations(
        double centerLat,
        double centerLon,
        double radiusInM
    ) {
        GeoLocation center = new GeoLocation(centerLat, centerLon);
        List<GeoQueryBounds> bounds = GeoFireUtils.getGeoHashQueryBounds(
            center,
            radiusInM
        );
        
        List<Task<QuerySnapshot>> tasks = new ArrayList<>();
        for (GeoQueryBounds bound : bounds) {
            Query query = db.collection("locations")
                .orderBy("geohash")
                .startAt(bound.startHash)
                .endAt(bound.endHash);
            
            tasks.add(query.get());
        }
        
        return Tasks.whenAllSuccess(tasks)
            .continueWith(task -> {
                List<LocationData> results = new ArrayList<>();
                
                for (Object obj : task.getResult()) {
                    QuerySnapshot snapshot = (QuerySnapshot) obj;
                    
                    for (DocumentSnapshot doc : snapshot.getDocuments()) {
                        double lat = doc.getDouble("latitude");
                        double lon = doc.getDouble("longitude");
                        String name = doc.getString("name");
                        
                        GeoLocation docLocation = new GeoLocation(lat, lon);
                        double distance = GeoFireUtils.getDistanceBetween(
                            center,
                            docLocation
                        );
                        
                        if (distance <= radiusInM) {
                            results.add(new LocationData(
                                doc.getId(),
                                name,
                                lat,
                                lon,
                                distance
                            ));
                        }
                    }
                }
                
                return results;
            });
    }
    
    // Test Firestore connection
    public Task<Boolean> testConnection() {
        return db.collection("test")
            .limit(1)
            .get()
            .continueWith(task -> task.isSuccessful());
    }
}
```

### LocationData Model

```java
public class LocationData {
    private String id;
    private String name;
    private double latitude;
    private double longitude;
    private double distance;
    
    public LocationData(String id, String name, double latitude, 
                       double longitude, double distance) {
        this.id = id;
        this.name = name;
        this.latitude = latitude;
        this.longitude = longitude;
        this.distance = distance;
    }
    
    // Getters
    public String getId() { return id; }
    public String getName() { return name; }
    public double getLatitude() { return latitude; }
    public double getLongitude() { return longitude; }
    public double getDistance() { return distance; }
}
```

### Activity Example

```java
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;
import com.google.firebase.auth.FirebaseAuth;

import java.util.List;

public class MainActivity extends AppCompatActivity {
    private FirestoreManager firestoreManager;
    private FirebaseAuth auth;
    
    private EditText latitudeInput;
    private EditText longitudeInput;
    private Button addLocationButton;
    private Button queryButton;
    private TextView statusText;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        // Initialize Firebase
        firestoreManager = new FirestoreManager();
        auth = FirebaseAuth.getInstance();
        
        // Sign in anonymously
        auth.signInAnonymously()
            .addOnSuccessListener(result -> {
                statusText.setText("Signed in anonymously");
            })
            .addOnFailureListener(e -> {
                statusText.setText("Sign in failed: " + e.getMessage());
            });
        
        // Initialize views
        latitudeInput = findViewById(R.id.latitude_input);
        longitudeInput = findViewById(R.id.longitude_input);
        addLocationButton = findViewById(R.id.add_location_button);
        queryButton = findViewById(R.id.query_button);
        statusText = findViewById(R.id.status_text);
        
        // Set up listeners
        addLocationButton.setOnClickListener(v -> addLocation());
        queryButton.setOnClickListener(v -> queryNearby());
    }
    
    private void addLocation() {
        String latStr = latitudeInput.getText().toString();
        String lonStr = longitudeInput.getText().toString();
        
        try {
            double lat = Double.parseDouble(latStr);
            double lon = Double.parseDouble(lonStr);
            
            statusText.setText("Adding location...");
            
            firestoreManager.addLocation(lat, lon)
                .addOnSuccessListener(id -> {
                    statusText.setText("Location added: " + id);
                    latitudeInput.setText("");
                    longitudeInput.setText("");
                })
                .addOnFailureListener(e -> {
                    statusText.setText("Error: " + e.getMessage());
                });
        } catch (NumberFormatException e) {
            statusText.setText("Invalid coordinates");
        }
    }
    
    private void queryNearby() {
        statusText.setText("Querying locations...");
        
        // Query near San Francisco
        firestoreManager.queryNearbyLocations(37.7749, -122.4194, 50000)
            .addOnSuccessListener(locations -> {
                StringBuilder sb = new StringBuilder();
                sb.append("Found ").append(locations.size())
                  .append(" locations:\n\n");
                
                for (LocationData location : locations) {
                    sb.append(location.getName())
                      .append("\nDistance: ")
                      .append(String.format("%.1f", location.getDistance()))
                      .append("m\n\n");
                }
                
                statusText.setText(sb.toString());
            })
            .addOnFailureListener(e -> {
                statusText.setText("Error: " + e.getMessage());
            });
    }
}
```

### Layout XML (activity_main.xml)

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="16dp">
    
    <TextView
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Firebase Location Demo"
        android:textSize="24sp"
        android:textStyle="bold"
        android:layout_marginBottom="16dp"/>
    
    <EditText
        android:id="@+id/latitude_input"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:hint="Latitude"
        android:inputType="numberDecimal|numberSigned"
        android:layout_marginBottom="8dp"/>
    
    <EditText
        android:id="@+id/longitude_input"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:hint="Longitude"
        android:inputType="numberDecimal|numberSigned"
        android:layout_marginBottom="16dp"/>
    
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:layout_marginBottom="16dp">
        
        <Button
            android:id="@+id/add_location_button"
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:text="Add Location"
            android:layout_marginEnd="8dp"/>
        
        <Button
            android:id="@+id/query_button"
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:text="Query Nearby"/>
    </LinearLayout>
    
    <ScrollView
        android:layout_width="match_parent"
        android:layout_height="match_parent">
        
        <TextView
            android:id="@+id/status_text"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:text="Ready"
            android:textSize="16sp"
            android:padding="12dp"
            android:background="#F5F5F5"/>
    </ScrollView>
</LinearLayout>
```

## Resources

- [Firebase Android Documentation](https://firebase.google.com/docs/android/setup)
- [Firestore Android Guide](https://firebase.google.com/docs/firestore/quickstart)
- [GeoFire for Android](https://github.com/firebase/geofire-android)
