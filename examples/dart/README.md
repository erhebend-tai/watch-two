# Flutter (Dart) Integration Example

## Setup

### 1. Install FlutterFire CLI

```bash
dart pub global activate flutterfire_cli
```

### 2. Configure Firebase

```bash
flutterfire configure
```

This will:
- Create Firebase projects for iOS and Android
- Download configuration files
- Generate `firebase_options.dart`

### 3. Add Dependencies

Add to your `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # Firebase
  firebase_core: ^2.24.2
  firebase_auth: ^4.16.0
  firebase_firestore: ^4.14.0
  firebase_storage: ^11.6.0
  
  # GeoFlutterFire for geospatial queries
  geoflutterfire2: ^2.3.15
  geolocator: ^10.1.0
```

Then run:

```bash
flutter pub get
```

## Example Code

### Initialize Firebase

```dart
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Watch Two Firebase Demo',
      theme: ThemeData(
        primarySwatch: Colors.purple,
      ),
      home: LocationScreen(),
    );
  }
}
```

### Firestore Service

```dart
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:geoflutterfire2/geoflutterfire2.dart';

class FirestoreService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final GeoFlutterFire _geo = GeoFlutterFire();
  
  // Add location with geospatial data
  Future<String> addLocation(double lat, double lon) async {
    GeoFirePoint point = _geo.point(latitude: lat, longitude: lon);
    
    final docRef = await _db.collection('locations').add({
      'latitude': lat,
      'longitude': lon,
      'position': point.data,
      'geohash': point.hash,
      'timestamp': FieldValue.serverTimestamp(),
      'name': 'Location at $lat, $lon',
    });
    
    return docRef.id;
  }
  
  // Query nearby locations
  Stream<List<LocationData>> queryNearbyLocations(
    double centerLat,
    double centerLon,
    double radiusKm,
  ) {
    GeoFirePoint center = _geo.point(
      latitude: centerLat,
      longitude: centerLon,
    );
    
    CollectionReference locations = _db.collection('locations');
    
    return _geo
        .collection(collectionRef: locations)
        .within(
          center: center,
          radius: radiusKm,
          field: 'position',
          strictMode: true,
        )
        .map((docs) => docs.map((doc) {
              final data = doc.data() as Map<String, dynamic>;
              return LocationData(
                id: doc.id,
                name: data['name'] ?? '',
                latitude: data['latitude'] ?? 0.0,
                longitude: data['longitude'] ?? 0.0,
                distance: doc['distance'] ?? 0.0,
              );
            }).toList());
  }
  
  // Test Firestore connection
  Future<bool> testConnection() async {
    try {
      await _db.collection('test').limit(1).get();
      return true;
    } catch (e) {
      print('Connection error: $e');
      return false;
    }
  }
  
  // Sign in anonymously
  Future<void> signInAnonymously() async {
    try {
      await FirebaseAuth.instance.signInAnonymously();
    } catch (e) {
      print('Sign in error: $e');
    }
  }
}

class LocationData {
  final String id;
  final String name;
  final double latitude;
  final double longitude;
  final double distance;
  
  LocationData({
    required this.id,
    required this.name,
    required this.latitude,
    required this.longitude,
    required this.distance,
  });
}
```

### UI Screen

```dart
import 'package:flutter/material.dart';

class LocationScreen extends StatefulWidget {
  @override
  _LocationScreenState createState() => _LocationScreenState();
}

class _LocationScreenState extends State<LocationScreen> {
  final FirestoreService _service = FirestoreService();
  final TextEditingController _latController = TextEditingController();
  final TextEditingController _lonController = TextEditingController();
  
  String _status = '';
  List<LocationData> _locations = [];
  
  @override
  void initState() {
    super.initState();
    _service.signInAnonymously();
  }
  
  Future<void> _addLocation() async {
    final lat = double.tryParse(_latController.text);
    final lon = double.tryParse(_lonController.text);
    
    if (lat == null || lon == null) {
      setState(() => _status = 'Invalid coordinates');
      return;
    }
    
    try {
      final id = await _service.addLocation(lat, lon);
      setState(() => _status = 'Location added: $id');
      _latController.clear();
      _lonController.clear();
    } catch (e) {
      setState(() => _status = 'Error: $e');
    }
  }
  
  void _queryNearby() {
    _service
        .queryNearbyLocations(37.7749, -122.4194, 50.0)
        .listen((locations) {
      setState(() {
        _locations = locations;
        _status = 'Found ${locations.length} locations';
      });
    });
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Firebase Location Demo'),
      ),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Add Location',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            SizedBox(height: 16),
            TextField(
              controller: _latController,
              decoration: InputDecoration(
                labelText: 'Latitude',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.numberWithOptions(
                decimal: true,
                signed: true,
              ),
            ),
            SizedBox(height: 8),
            TextField(
              controller: _lonController,
              decoration: InputDecoration(
                labelText: 'Longitude',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.numberWithOptions(
                decimal: true,
                signed: true,
              ),
            ),
            SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: _addLocation,
                    child: Text('Add Location'),
                  ),
                ),
                SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _queryNearby,
                    child: Text('Query Nearby'),
                  ),
                ),
              ],
            ),
            SizedBox(height: 16),
            if (_status.isNotEmpty)
              Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(_status),
              ),
            SizedBox(height: 16),
            Expanded(
              child: ListView.builder(
                itemCount: _locations.length,
                itemBuilder: (context, index) {
                  final location = _locations[index];
                  return Card(
                    child: ListTile(
                      title: Text(location.name),
                      subtitle: Text(
                        'Distance: ${location.distance.toStringAsFixed(1)} km',
                      ),
                      trailing: Text(
                        '${location.latitude.toStringAsFixed(4)}, '
                        '${location.longitude.toStringAsFixed(4)}',
                        style: TextStyle(fontSize: 12),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  @override
  void dispose() {
    _latController.dispose();
    _lonController.dispose();
    super.dispose();
  }
}
```

### Permission Setup

#### Android

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
```

#### iOS

Add to `ios/Runner/Info.plist`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>This app needs access to location for geospatial features.</string>
<key>NSLocationAlwaysUsageDescription</key>
<string>This app needs access to location for geospatial features.</string>
```

## Resources

- [FlutterFire Documentation](https://firebase.flutter.dev/)
- [Firestore Flutter Guide](https://firebase.google.com/docs/firestore/quickstart)
- [GeoFlutterFire Package](https://pub.dev/packages/geoflutterfire2)
- [Flutter Location Plugin](https://pub.dev/packages/geolocator)
