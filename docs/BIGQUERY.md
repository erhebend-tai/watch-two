# BigQuery Integration Guide

## Overview

BigQuery integration allows you to export Firestore data for analytics and reporting. This is useful for:
- Historical data analysis
- Business intelligence dashboards
- Machine learning data pipelines
- Data warehousing

## Setup

### 1. Enable BigQuery Export in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database**
4. Click on the **Integrations** tab
5. Find **BigQuery** and click **Set up streaming**
6. Select collections to export:
   - `locations` - for geospatial analysis
   - `mongodb_sync` - for sync monitoring
   - Add other collections as needed

### 2. Choose Export Method

**Option A: Automatic Streaming (Recommended)**
- Real-time data streaming to BigQuery
- Creates tables automatically
- Schema is auto-detected

**Option B: Scheduled Export**
- Daily exports at specified time
- Lower cost for infrequent queries
- Historical snapshots

### 3. Configure Dataset

1. Choose or create a BigQuery dataset
2. Recommended dataset name: `firestore_export`
3. Select location (should match Firestore region)

## Query Examples

### Basic Queries

#### Count all locations

```sql
SELECT COUNT(*) as total_locations
FROM `your-project.firestore_export.locations_raw_latest`
```

#### Get recent locations

```sql
SELECT 
  document_id,
  JSON_EXTRACT_SCALAR(data, '$.name') as name,
  JSON_EXTRACT_SCALAR(data, '$.latitude') as latitude,
  JSON_EXTRACT_SCALAR(data, '$.longitude') as longitude,
  timestamp
FROM `your-project.firestore_export.locations_raw_latest`
ORDER BY timestamp DESC
LIMIT 100
```

### Geospatial Analysis

#### Distance calculation between points

```sql
CREATE TEMP FUNCTION haversine_distance(
  lat1 FLOAT64, lon1 FLOAT64,
  lat2 FLOAT64, lon2 FLOAT64
) AS (
  6371 * ACOS(
    COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * 
    COS(RADIANS(lon2) - RADIANS(lon1)) + 
    SIN(RADIANS(lat1)) * SIN(RADIANS(lat2))
  )
);

WITH center AS (
  SELECT 37.7749 as center_lat, -122.4194 as center_lon
),
locations AS (
  SELECT 
    document_id,
    JSON_EXTRACT_SCALAR(data, '$.name') as name,
    CAST(JSON_EXTRACT_SCALAR(data, '$.latitude') AS FLOAT64) as lat,
    CAST(JSON_EXTRACT_SCALAR(data, '$.longitude') AS FLOAT64) as lon
  FROM `your-project.firestore_export.locations_raw_latest`
  WHERE JSON_EXTRACT_SCALAR(data, '$.latitude') IS NOT NULL
)
SELECT 
  l.name,
  l.lat,
  l.lon,
  haversine_distance(c.center_lat, c.center_lon, l.lat, l.lon) as distance_km
FROM locations l, center c
WHERE haversine_distance(c.center_lat, c.center_lon, l.lat, l.lon) < 50
ORDER BY distance_km
```

## Resources

- [BigQuery Documentation](https://cloud.google.com/bigquery/docs)
- [Firebase BigQuery Export](https://firebase.google.com/docs/firestore/query-data/export-bigquery)
