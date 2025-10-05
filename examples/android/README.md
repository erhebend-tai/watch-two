# Android Platform Examples

This directory contains examples for integrating Firebase with Android applications.

## Available Examples

- **Java**: Traditional Android development with Java
- **Kotlin**: Modern Android development with Kotlin

See the respective subdirectories for detailed implementation examples.

## Quick Start

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Add an Android app to your project
3. Download `google-services.json` to your `app/` directory
4. Follow the language-specific guides in the subdirectories

## Common Setup

### Permissions (AndroidManifest.xml)

```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
```

### Multidex Support

If you encounter multidex issues, add to your `build.gradle`:

```gradle
android {
    defaultConfig {
        multiDexEnabled true
    }
}

dependencies {
    implementation 'androidx.multidex:multidex:2.0.1'
}
```

## Resources

- [Firebase Android Setup](https://firebase.google.com/docs/android/setup)
- [Android Developers Guide](https://developer.android.com/)
