<p align="center">
  <img src="public/placeholder.svg" alt="FlowSense AI Logo" width="120" height="120"/>
</p>

<h1 align="center">FlowSense AI</h1>

<p align="center">
  <strong>Intelligent Crowd Management for India's Public Spaces</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite" alt="Vite"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=flat-square&logo=tailwindcss" alt="Tailwind"/>
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat-square&logo=postgresql" alt="PostgreSQL"/>
</p>

<p align="center">
  <strong>Developer:</strong> Vansh Raj Singh &nbsp;|&nbsp; <strong>Version:</strong> 1.0.0 &nbsp;|&nbsp; <strong>Build:</strong> 2026.01.31
</p>

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [Key Features](#key-features)
  - [Visitor Application](#visitor-application)
  - [Admin Dashboard](#admin-dashboard)
- [Technical Architecture](#technical-architecture)
  - [Frontend Stack](#frontend-stack)
  - [Backend Infrastructure](#backend-infrastructure)
- [Database Schema](#database-schema)
  - [Core Tables](#core-tables)
  - [Enumerations](#enumerations)
  - [Entity Relationship Diagram](#entity-relationship-diagram)
- [Edge Functions API](#edge-functions-api)
- [Project Structure](#project-structure)
- [Internationalization](#internationalization)
- [Real-time Features](#real-time-features)
- [Security Implementation](#security-implementation)
- [Installation & Setup](#installation--setup)
- [Environment Configuration](#environment-configuration)
- [Admin Access](#admin-access)
- [API Reference](#api-reference)
- [Component Reference](#component-reference)
- [Hooks Reference](#hooks-reference)
- [Contributing Guidelines](#contributing-guidelines)
- [License & Credits](#license--credits)

---

## Executive Summary

### The Problem

India's public venues—temples, railway stations, melas, stadiums, and government offices—face unprecedented crowd management challenges. Traditional approaches rely on manual headcounts, static barriers, and reactive responses, leading to:

- **Safety Hazards**: Stampedes and crush incidents at overcrowded events
- **Long Wait Times**: Inefficient queue management causing visitor frustration
- **Poor Resource Allocation**: Security personnel deployed without data-driven insights
- **Communication Gaps**: Delayed emergency broadcasts during critical situations
- **Lack of Visibility**: No real-time understanding of crowd density patterns

### The Solution

**FlowSense AI** is a comprehensive crowd management platform that combines real-time monitoring, predictive analytics, and instant communication to transform how public venues handle large gatherings.

### Key Differentiators

| Feature | Traditional Approach | FlowSense AI |
|---------|---------------------|--------------|
| Crowd Counting | Manual tallies | Real-time sensor integration |
| Queue Management | Paper tokens | Digital virtual queue system |
| Emergency Response | Megaphones/PA | Instant mobile push + audio alerts |
| Predictions | Experience-based | Data-driven hourly forecasts |
| Communication | Single language | Bilingual (English + Hindi) |
| Access | On-site only | Mobile-first PWA |

---

## Key Features

### Visitor Application

The visitor-facing application is designed as a **mobile-first Progressive Web App (PWA)** optimized for smartphones and tablets.

#### 1. Home Dashboard

The landing page provides visitors with an immediate understanding of venue conditions:

```
┌─────────────────────────────────────┐
│  Welcome, Visitor                   │
│  Current Status: 🟢 Normal          │
├─────────────────────────────────────┤
│  📊 Quick Stats                     │
│  ├── Total Visitors: 2,450          │
│  ├── Active Zones: 8/10             │
│  └── Avg Wait Time: 12 min          │
├─────────────────────────────────────┤
│  🗺️ Zone Status Grid                │
│  [Main Gate: 🟢] [Temple: 🟡]       │
│  [Food Court: 🟢] [Exit A: 🔴]      │
└─────────────────────────────────────┘
```

**Technical Implementation:**
- Real-time zone data via WebSocket subscriptions
- Color-coded status badges (green/yellow/red/critical)
- Responsive grid layout using CSS Grid + Tailwind

#### 2. Virtual Queue System

Eliminates physical queuing with a digital token-based system:

**Features:**
- Generate tokens for specific service counters
- View real-time position in queue
- Estimated wait time calculation based on `avg_service_time`
- Priority queue support for elderly/disabled visitors
- SMS/push notifications when token is called

**Token Lifecycle:**
```
waiting → called → served
    ↓         ↓
cancelled   expired
```

**Database Schema:**
```sql
queue_tokens (
  id UUID PRIMARY KEY,
  queue_id UUID REFERENCES queues(id),
  token_number INTEGER NOT NULL,
  user_id UUID,
  status token_status DEFAULT 'waiting',
  is_priority BOOLEAN DEFAULT false,
  estimated_wait_time INTEGER,
  called_at TIMESTAMPTZ,
  served_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
)
```

#### 3. Interactive Map

SVG-based venue map with real-time density visualization:

**Color Coding:**
| Status | Color | Occupancy |
|--------|-------|-----------|
| Green | `#22C55E` | 0-50% capacity |
| Yellow | `#EAB308` | 50-75% capacity |
| Red | `#EF4444` | 75-90% capacity |
| Critical | `#7C2D12` | >90% capacity |

**Implementation:**
- SVG paths for each zone with dynamic fill colors
- Hover tooltips showing zone name + current count
- Click-to-view zone details modal
- Pinch-to-zoom on mobile devices

#### 4. Facilities Locator

Categorized amenities with availability status:

| Facility Type | Icon | Description |
|---------------|------|-------------|
| `washroom` | 🚻 | Restroom locations |
| `medical` | 🏥 | First aid stations |
| `water` | 💧 | Drinking water points |
| `food` | 🍽️ | Food stalls and canteens |
| `parking` | 🅿️ | Vehicle parking areas |
| `information` | ℹ️ | Help desks |
| `prayer` | 🙏 | Prayer/meditation areas |
| `rest_area` | 🪑 | Seating and rest zones |

**Features:**
- Filter by facility type
- Distance from current location (if GPS enabled)
- Availability status (open/closed/busy)
- Capacity and current usage indicators

#### 5. Alerts Feed

Real-time emergency broadcasts and venue announcements:

**Alert Severity Levels:**
```typescript
type AlertSeverity = 'info' | 'warning' | 'critical' | 'emergency';
```

| Level | Visual | Use Case |
|-------|--------|----------|
| Info | Blue banner | General announcements |
| Warning | Yellow banner | Weather alerts, delays |
| Critical | Orange banner | Gate closures, diversions |
| Emergency | Red pulsing | Evacuations, medical emergencies |

**Bilingual Support:**
- `title` / `title_hi` for English/Hindi titles
- `message` / `message_hi` for message content
- Automatic display based on user language preference

#### 6. SOS Emergency Button

One-tap distress signal for visitors in emergency situations:

**Activation Flow:**
1. User presses floating SOS button
2. Dialog opens for optional details (location, message)
3. Request sent to `send-sos` edge function
4. Unique token generated (format: `SOS-XXXXXX`)
5. Admin dashboard receives real-time alert with audio alarm
6. User receives confirmation with tracking token

**Token Format:**
```javascript
const tokenNumber = `SOS-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
// Example: SOS-M2K8J4XYZ
```

---

### Admin Dashboard

The administration interface is designed as a **desktop-first application** for control room operators and venue managers.

#### 1. Overview Dashboard

Central command view with key metrics and live data:

**Metrics Panel:**
- Total current visitors across all zones
- Number of active alerts
- Pending SOS requests
- Queue wait times

**Live Heatmap:**
- Real-time zone occupancy visualization
- Click-to-drill-down zone details
- Historical comparison overlay

**AI Insights Panel:**
- Surge predictions for next 4 hours
- Recommended crowd control actions
- Risk level indicator (low/medium/high)

#### 2. Analytics Module

Comprehensive data visualization for crowd patterns:

**Charts Included:**

1. **Daily Footfall Trend**
   - Line chart showing 24-hour visitor counts
   - Comparison with previous day/week
   - Peak identification markers

2. **Hourly Pattern Analysis**
   - Actual vs. Predicted visitor counts
   - Confidence interval bands
   - Anomaly highlighting

3. **Zone Distribution**
   - Pie/donut chart of visitors by zone
   - Percentage breakdowns
   - Capacity utilization bars

**Export Functionality:**
```typescript
const exportToCSV = (data: SensorReading[]) => {
  const headers = ['Date', 'Time', 'Zone', 'Count', 'Temperature'];
  const rows = data.map(r => [
    format(new Date(r.recorded_at), 'yyyy-MM-dd'),
    format(new Date(r.recorded_at), 'HH:mm'),
    r.zone_name,
    r.count,
    r.temperature
  ]);
  // Download as CSV file
};
```

#### 3. Queue Management

Complete queue lifecycle control:

**Queue Operations:**
| Action | Description |
|--------|-------------|
| Create | Add new service counter queue |
| Pause | Temporarily stop token generation |
| Resume | Reactivate paused queue |
| Close | Permanently close queue for the day |
| Call Next | Advance to next token in sequence |

**Token Management Table:**
```
┌──────────┬────────┬──────────┬─────────────┐
│ Token #  │ Status │ Priority │ Wait Time   │
├──────────┼────────┼──────────┼─────────────┤
│ 001      │ Served │ No       │ 8 min       │
│ 002      │ Called │ No       │ 12 min      │
│ 003      │ Waiting│ Yes      │ ~5 min      │
│ 004      │ Waiting│ No       │ ~15 min     │
└──────────┴────────┴──────────┴─────────────┘
```

#### 4. Emergency Broadcast Console

Rapid alert creation and distribution:

**Pre-defined Templates:**
```typescript
const alertTemplates = [
  { title: 'Gate Closure', severity: 'warning' },
  { title: 'Medical Emergency', severity: 'critical' },
  { title: 'Evacuation Notice', severity: 'emergency' },
  { title: 'Weather Alert', severity: 'info' },
  { title: 'VIP Movement', severity: 'warning' },
];
```

**Zone Targeting:**
- Broadcast to all zones
- Select specific zones
- Exclude zones from broadcast

**Alert Lifecycle:**
```
created → active → resolved
              ↓
           expired
```

#### 5. SOS Alert Panel

Real-time emergency request monitoring:

**Features:**
- Audio alarm on new SOS (Web Audio API oscillator)
- Flashing red visual indicator
- Token number display for coordination
- One-click resolution
- Automatic timestamp logging

**Audio Implementation:**
```typescript
const playAlarm = () => {
  const audioContext = new AudioContext();
  const oscillator = audioContext.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
  oscillator.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.5);
};
```

#### 6. Settings Panel

System configuration and preferences:

**Notification Settings:**
- Email alerts (on/off)
- SMS notifications (on/off)
- SOS audio alarm (on/off)

**System Health:**
- Database connection status
- Real-time subscription status
- Edge function deployment status

---

## Technical Architecture

### Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3 | UI framework |
| TypeScript | 5.6 | Type safety |
| Vite | 5.4 | Build tool and dev server |
| Tailwind CSS | 3.4 | Utility-first styling |
| shadcn/ui | Latest | Component library |
| Recharts | 2.15 | Data visualization |
| React Router DOM | 6.30 | Client-side routing |
| TanStack React Query | 5.83 | Server state management |
| Lucide React | 0.462 | Icon library |

### Backend Infrastructure

| Component | Technology | Purpose |
|-----------|------------|---------|
| Database | PostgreSQL 15 | Primary data store |
| Edge Functions | Deno Runtime | Serverless compute |
| Real-time | WebSocket | Live subscriptions |
| Authentication | JWT | Secure user sessions |
| File Storage | Object Storage | Asset management |

**Architecture Diagram:**
```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Visitor PWA │  │ Admin Panel │  │ Mobile App  │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
└─────────┼────────────────┼────────────────┼────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │               Edge Functions (Deno)                  │   │
│  │  • generate-predictions  • broadcast-alert           │   │
│  │  • send-sos              • resolve-alert             │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                              │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │
│  │  PostgreSQL   │  │   Real-time   │  │    Storage    │   │
│  │   Database    │  │  Subscriptions│  │    Bucket     │   │
│  └───────────────┘  └───────────────┘  └───────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Core Tables

#### zones
Primary table for venue locations and areas.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `gen_random_uuid()` | Primary key |
| `name` | TEXT | No | - | Zone name (English) |
| `name_hi` | TEXT | Yes | - | Zone name (Hindi) |
| `description` | TEXT | Yes | - | Zone description |
| `capacity` | INTEGER | No | `1000` | Maximum capacity |
| `current_count` | INTEGER | No | `0` | Current visitor count |
| `status` | `zone_status` | No | `'green'` | Occupancy status |
| `coordinates` | JSONB | Yes | - | Map coordinates |
| `parent_zone_id` | UUID | Yes | - | Parent zone reference |
| `created_at` | TIMESTAMPTZ | No | `now()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | `now()` | Last update timestamp |

#### queues
Virtual queue configurations for service counters.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `gen_random_uuid()` | Primary key |
| `name` | TEXT | No | - | Queue name (English) |
| `name_hi` | TEXT | Yes | - | Queue name (Hindi) |
| `zone_id` | UUID | Yes | - | Associated zone |
| `status` | `queue_status` | No | `'active'` | Queue status |
| `current_token` | INTEGER | No | `0` | Last called token |
| `avg_service_time` | INTEGER | Yes | `120` | Avg seconds per token |
| `max_capacity` | INTEGER | Yes | `500` | Maximum queue size |
| `priority_enabled` | BOOLEAN | Yes | `true` | Priority queue flag |
| `created_at` | TIMESTAMPTZ | No | `now()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | `now()` | Last update timestamp |

#### queue_tokens
Individual visitor tokens in queues.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `gen_random_uuid()` | Primary key |
| `queue_id` | UUID | No | - | Parent queue reference |
| `token_number` | INTEGER | No | - | Token sequence number |
| `user_id` | UUID | Yes | - | Token holder |
| `phone` | TEXT | Yes | - | Contact phone |
| `status` | `token_status` | No | `'waiting'` | Token status |
| `is_priority` | BOOLEAN | Yes | `false` | Priority flag |
| `estimated_wait_time` | INTEGER | Yes | - | Estimated minutes |
| `called_at` | TIMESTAMPTZ | Yes | - | When token was called |
| `served_at` | TIMESTAMPTZ | Yes | - | When service completed |
| `created_at` | TIMESTAMPTZ | No | `now()` | Creation timestamp |

#### alerts
Emergency broadcasts and announcements.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `gen_random_uuid()` | Primary key |
| `title` | TEXT | No | - | Alert title (English) |
| `title_hi` | TEXT | Yes | - | Alert title (Hindi) |
| `message` | TEXT | No | - | Alert content (English) |
| `message_hi` | TEXT | Yes | - | Alert content (Hindi) |
| `severity` | `alert_severity` | No | `'info'` | Severity level |
| `status` | `alert_status` | No | `'active'` | Alert status |
| `zone_ids` | UUID[] | Yes | - | Target zones |
| `created_by` | UUID | Yes | - | Admin who created |
| `expires_at` | TIMESTAMPTZ | Yes | - | Auto-expire time |
| `resolved_at` | TIMESTAMPTZ | Yes | - | Resolution time |
| `created_at` | TIMESTAMPTZ | No | `now()` | Creation timestamp |

#### sos_requests
Emergency help requests from visitors.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `gen_random_uuid()` | Primary key |
| `user_id` | UUID | Yes | - | Requesting user |
| `token_number` | TEXT | No | - | Unique SOS token |
| `phone` | TEXT | Yes | - | Contact phone |
| `location` | TEXT | Yes | - | Reported location |
| `message` | TEXT | Yes | - | Emergency details |
| `zone_id` | UUID | Yes | - | Associated zone |
| `status` | TEXT | No | `'active'` | Request status |
| `responded_by` | UUID | Yes | - | Responding admin |
| `responded_at` | TIMESTAMPTZ | Yes | - | Response time |
| `created_at` | TIMESTAMPTZ | No | `now()` | Creation timestamp |

#### sensor_readings
IoT sensor data for crowd counting (simulated or real).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `gen_random_uuid()` | Primary key |
| `zone_id` | UUID | No | - | Zone reference |
| `count` | INTEGER | No | `0` | Visitor count |
| `temperature` | NUMERIC | Yes | - | Ambient temperature |
| `flow_rate` | INTEGER | Yes | `0` | Visitors per minute |
| `recorded_at` | TIMESTAMPTZ | No | `now()` | Reading timestamp |

#### predictions
AI-generated crowd forecasts.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `gen_random_uuid()` | Primary key |
| `zone_id` | UUID | Yes | - | Zone reference |
| `predicted_count` | INTEGER | No | - | Predicted visitors |
| `prediction_for` | TIMESTAMPTZ | No | - | Target datetime |
| `confidence` | NUMERIC | Yes | - | Confidence score |
| `factors` | JSONB | Yes | - | Contributing factors |
| `created_at` | TIMESTAMPTZ | No | `now()` | Creation timestamp |

#### facilities
Venue amenities and services.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `gen_random_uuid()` | Primary key |
| `name` | TEXT | No | - | Facility name (English) |
| `name_hi` | TEXT | Yes | - | Facility name (Hindi) |
| `type` | `facility_type` | No | - | Facility category |
| `zone_id` | UUID | Yes | - | Location zone |
| `is_available` | BOOLEAN | Yes | `true` | Availability status |
| `capacity` | INTEGER | Yes | - | Maximum capacity |
| `current_usage` | INTEGER | Yes | `0` | Current usage |
| `coordinates` | JSONB | Yes | - | Map position |
| `created_at` | TIMESTAMPTZ | No | `now()` | Creation timestamp |

#### profiles
User profile information.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `gen_random_uuid()` | Primary key |
| `user_id` | UUID | No | - | Auth user reference |
| `full_name` | TEXT | Yes | - | Display name |
| `phone` | TEXT | Yes | - | Contact number |
| `language` | TEXT | Yes | `'en'` | Preferred language |
| `created_at` | TIMESTAMPTZ | No | `now()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | `now()` | Last update timestamp |

#### user_roles
Role-based access control.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `gen_random_uuid()` | Primary key |
| `user_id` | UUID | No | - | Auth user reference |
| `role` | `app_role` | No | `'visitor'` | Assigned role |
| `created_at` | TIMESTAMPTZ | No | `now()` | Creation timestamp |

**Unique Constraint:** `(user_id, role)`

#### incidents
Incident tracking and management.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `gen_random_uuid()` | Primary key |
| `title` | TEXT | No | - | Incident title |
| `description` | TEXT | Yes | - | Incident details |
| `severity` | `alert_severity` | No | `'warning'` | Severity level |
| `zone_id` | UUID | Yes | - | Location zone |
| `status` | TEXT | Yes | `'open'` | Incident status |
| `reported_by` | UUID | Yes | - | Reporting user |
| `assigned_to` | UUID | Yes | - | Assigned responder |
| `resolved_at` | TIMESTAMPTZ | Yes | - | Resolution time |
| `created_at` | TIMESTAMPTZ | No | `now()` | Creation timestamp |

### Enumerations

```sql
-- Zone occupancy status
CREATE TYPE zone_status AS ENUM ('green', 'yellow', 'red', 'critical');

-- Alert severity levels
CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'critical', 'emergency');

-- Alert lifecycle status
CREATE TYPE alert_status AS ENUM ('active', 'resolved', 'expired');

-- Queue operational status
CREATE TYPE queue_status AS ENUM ('active', 'paused', 'closed');

-- Token lifecycle status
CREATE TYPE token_status AS ENUM ('waiting', 'called', 'served', 'cancelled', 'expired');

-- Application roles
CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'visitor');

-- Facility categories
CREATE TYPE facility_type AS ENUM (
  'washroom', 'medical', 'water', 'food', 
  'parking', 'information', 'prayer', 'rest_area'
);
```

### Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   zones     │───────│   queues    │───────│queue_tokens │
│             │  1:N  │             │  1:N  │             │
└─────────────┘       └─────────────┘       └─────────────┘
      │                     │
      │ 1:N                 │
      ▼                     │
┌─────────────┐             │
│ facilities  │             │
└─────────────┘             │
      │                     │
      │                     ▼
      │              ┌─────────────┐
      └──────────────│ sensor_     │
                     │ readings    │
                     └─────────────┘

┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   alerts    │       │ sos_requests│       │ predictions │
└─────────────┘       └─────────────┘       └─────────────┘

┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  profiles   │───────│ user_roles  │       │  incidents  │
│             │  1:N  │             │       │             │
└─────────────┘       └─────────────┘       └─────────────┘
```

---

## Edge Functions API

### generate-predictions

Generates AI-powered crowd predictions for specified zones.

**Endpoint:** `POST /functions/v1/generate-predictions`

**Request Body:**
```json
{
  "zone_id": "uuid-optional",
  "hours_ahead": 12
}
```

**Response:**
```json
{
  "predictions": [
    {
      "zone_name": "Main Gate",
      "zone_id": "uuid",
      "hourly_predictions": [
        { "hour": "10:00", "predicted_count": 450, "confidence": 0.85 }
      ],
      "surge_warning": false,
      "peak_hour": "14:00",
      "recommendation": "Normal operations expected"
    }
  ],
  "overall_trend": "stable",
  "risk_level": "low",
  "summary": "Crowd levels expected to remain within normal limits"
}
```

**Factors Considered:**
- Day of week patterns
- Weekend vs. weekday
- Historical averages
- Special events calendar
- Weather conditions (future)

---

### broadcast-alert

Sends emergency notifications to targeted zones.

**Endpoint:** `POST /functions/v1/broadcast-alert`

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "title": "Gate Closure Notice",
  "title_hi": "गेट बंद सूचना",
  "message": "North Gate will be closed for maintenance from 2 PM to 4 PM",
  "message_hi": "उत्तरी गेट रखरखाव के लिए दोपहर 2 बजे से 4 बजे तक बंद रहेगा",
  "severity": "warning",
  "zone_ids": ["uuid1", "uuid2"],
  "expires_at": "2026-01-31T16:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "alert": {
    "id": "uuid",
    "status": "active",
    "created_at": "2026-01-31T10:00:00Z"
  },
  "message": "Alert broadcast successfully"
}
```

**Authorization:** Requires `admin` role.

---

### send-sos

Creates an emergency assistance request from a visitor.

**Endpoint:** `POST /functions/v1/send-sos`

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "location": "Near Food Court, Section B",
  "message": "Need medical assistance urgently",
  "zone_id": "uuid-optional",
  "phone": "+91-9876543210"
}
```

**Response:**
```json
{
  "success": true,
  "token_number": "SOS-M2K8J4XYZ",
  "message": "SOS request sent successfully. Help is on the way!",
  "sos_request": {
    "id": "uuid",
    "status": "active",
    "created_at": "2026-01-31T10:30:00Z",
    "user_name": "Visitor Name",
    "user_phone": "+91-9876543210"
  }
}
```

**Real-time:** Triggers WebSocket broadcast to admin clients.

---

### resolve-alert

Marks an active alert as resolved.

**Endpoint:** `POST /functions/v1/resolve-alert`

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "alert_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "alert": {
    "id": "uuid",
    "status": "resolved",
    "resolved_at": "2026-01-31T11:00:00Z"
  },
  "message": "Alert resolved successfully"
}
```

**Authorization:** Requires `admin` role.

---

## Project Structure

```
flowsense-ai/
│
├── public/                          # Static assets
│   ├── favicon.ico                  # Browser favicon
│   ├── placeholder.svg              # Logo placeholder
│   └── robots.txt                   # Search engine directives
│
├── src/
│   ├── components/                  # Reusable UI components
│   │   ├── ui/                      # shadcn/ui primitives
│   │   │   ├── button.tsx           # Button component
│   │   │   ├── card.tsx             # Card component
│   │   │   ├── dialog.tsx           # Modal dialogs
│   │   │   ├── form.tsx             # Form components
│   │   │   ├── input.tsx            # Input fields
│   │   │   ├── select.tsx           # Select dropdowns
│   │   │   ├── table.tsx            # Data tables
│   │   │   ├── tabs.tsx             # Tab navigation
│   │   │   ├── toast.tsx            # Toast notifications
│   │   │   └── ...                  # Additional primitives
│   │   │
│   │   ├── Footer.tsx               # Application footer
│   │   ├── LanguageToggle.tsx       # EN/HI language switcher
│   │   ├── Logo.tsx                 # Brand logo component
│   │   ├── NavLink.tsx              # Navigation link wrapper
│   │   ├── SOSAlertPanel.tsx        # Admin SOS monitoring
│   │   ├── SOSButton.tsx            # Visitor emergency button
│   │   ├── StatusBadge.tsx          # Zone status indicators
│   │   └── ThemeToggle.tsx          # Dark/light mode switch
│   │
│   ├── contexts/                    # React context providers
│   │   ├── AuthContext.tsx          # Authentication state
│   │   └── LanguageContext.tsx      # Internationalization state
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── use-mobile.tsx           # Mobile detection
│   │   ├── use-toast.ts             # Toast notifications
│   │   ├── useEmergencyAlerts.ts    # Alert subscriptions
│   │   ├── usePredictions.ts        # AI prediction hook
│   │   └── useRealtime.ts           # WebSocket subscriptions
│   │
│   ├── integrations/                # External service clients
│   │   └── supabase/
│   │       ├── client.ts            # Supabase client instance
│   │       └── types.ts             # Generated TypeScript types
│   │
│   ├── layouts/                     # Page layout wrappers
│   │   ├── AdminLayout.tsx          # Admin dashboard shell
│   │   └── VisitorLayout.tsx        # Public application shell
│   │
│   ├── lib/                         # Utility functions
│   │   ├── i18n.ts                  # Translation definitions
│   │   └── utils.ts                 # Helper functions (cn, etc.)
│   │
│   ├── pages/                       # Route components
│   │   ├── admin/                   # Admin dashboard pages
│   │   │   ├── Alerts.tsx           # Alert management
│   │   │   ├── Analytics.tsx        # Data visualization
│   │   │   ├── Dashboard.tsx        # Main dashboard
│   │   │   ├── Queues.tsx           # Queue management
│   │   │   └── Settings.tsx         # System settings
│   │   │
│   │   ├── auth/                    # Authentication pages
│   │   │   ├── Login.tsx            # User login
│   │   │   └── Signup.tsx           # User registration
│   │   │
│   │   ├── visitor/                 # Visitor application pages
│   │   │   ├── Alerts.tsx           # Alert feed
│   │   │   ├── Facilities.tsx       # Amenities locator
│   │   │   ├── Home.tsx             # Main dashboard
│   │   │   ├── Map.tsx              # Interactive venue map
│   │   │   └── Queue.tsx            # Virtual queue interface
│   │   │
│   │   ├── Index.tsx                # Landing page / router
│   │   └── NotFound.tsx             # 404 error page
│   │
│   ├── test/                        # Test utilities
│   │   ├── example.test.ts          # Example test file
│   │   └── setup.ts                 # Test configuration
│   │
│   ├── App.css                      # Global styles
│   ├── App.tsx                      # Root component with routes
│   ├── index.css                    # Tailwind imports
│   ├── main.tsx                     # Application entry point
│   └── vite-env.d.ts                # Vite type definitions
│
├── supabase/
│   ├── functions/                   # Edge functions
│   │   ├── broadcast-alert/
│   │   │   └── index.ts             # Alert broadcast logic
│   │   ├── generate-predictions/
│   │   │   └── index.ts             # Prediction generation
│   │   ├── resolve-alert/
│   │   │   └── index.ts             # Alert resolution
│   │   └── send-sos/
│   │       └── index.ts             # SOS request handler
│   │
│   ├── migrations/                  # Database migrations
│   └── config.toml                  # Supabase configuration
│
├── .env                             # Environment variables
├── components.json                  # shadcn/ui configuration
├── eslint.config.js                 # ESLint configuration
├── index.html                       # HTML entry point
├── package.json                     # Dependencies and scripts
├── postcss.config.js                # PostCSS configuration
├── tailwind.config.ts               # Tailwind CSS configuration
├── tsconfig.json                    # TypeScript configuration
├── vite.config.ts                   # Vite configuration
└── vitest.config.ts                 # Vitest test configuration
```

---

## Internationalization

FlowSense AI supports bilingual content delivery for English and Hindi.

### Supported Languages

| Code | Language | Native Name |
|------|----------|-------------|
| `en` | English | English |
| `hi` | Hindi | हिन्दी |

### Translation Implementation

**Translation File:** `src/lib/i18n.ts`

```typescript
export type Language = 'en' | 'hi';
export type TranslationKey = keyof typeof translations.en;

const translations = {
  en: {
    welcome: 'Welcome',
    currentStatus: 'Current Status',
    totalVisitors: 'Total Visitors',
    activeAlerts: 'Active Alerts',
    sosButton: 'SOS Emergency',
    // ... 100+ keys
  },
  hi: {
    welcome: 'स्वागत है',
    currentStatus: 'वर्तमान स्थिति',
    totalVisitors: 'कुल आगंतुक',
    activeAlerts: 'सक्रिय अलर्ट',
    sosButton: 'SOS आपातकाल',
    // ... 100+ keys
  }
};

export function t(key: TranslationKey, language: Language): string {
  return translations[language][key] || translations.en[key] || key;
}
```

### Usage in Components

```tsx
import { useLanguage } from '@/contexts/LanguageContext';

function WelcomeMessage() {
  const { t } = useLanguage();
  
  return <h1>{t('welcome')}</h1>;
}
```

### Language Persistence

User preference is stored in `localStorage` under key `flowsense-language` and restored on page load.

### Database Bilingual Fields

Tables with translatable content include both English and Hindi columns:

| Table | English Column | Hindi Column |
|-------|----------------|--------------|
| `zones` | `name` | `name_hi` |
| `queues` | `name` | `name_hi` |
| `facilities` | `name` | `name_hi` |
| `alerts` | `title`, `message` | `title_hi`, `message_hi` |

---

## Real-time Features

FlowSense AI leverages WebSocket subscriptions for live data synchronization.

### Enabled Tables

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.zones;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.queues;
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_tokens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sensor_readings;
```

### Subscription Hooks

**useRealtime.ts**
```typescript
export function useRealtimeZones() {
  const [zones, setZones] = useState<Zone[]>([]);

  useEffect(() => {
    // Initial fetch
    fetchZones().then(setZones);

    // Real-time subscription
    const channel = supabase
      .channel('zones-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'zones' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setZones(prev => prev.map(z => 
              z.id === payload.new.id ? payload.new : z
            ));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return zones;
}
```

### Real-time Use Cases

| Feature | Table | Events |
|---------|-------|--------|
| Zone status updates | `zones` | UPDATE |
| New alerts | `alerts` | INSERT |
| Alert resolution | `alerts` | UPDATE |
| Queue position changes | `queue_tokens` | INSERT, UPDATE |
| SOS requests | `sos_requests` | INSERT |
| Sensor readings | `sensor_readings` | INSERT |

---

## Security Implementation

### Role-Based Access Control (RBAC)

**Roles:**
| Role | Access Level |
|------|-------------|
| `admin` | Full system access, all CRUD operations |
| `moderator` | Limited management capabilities |
| `visitor` | Read-only public data, own tokens |

### Row Level Security (RLS) Policies

**Example: zones table**
```sql
-- Anyone can view zones
CREATE POLICY "Anyone can view zones"
ON public.zones FOR SELECT
USING (true);

-- Only admins can manage zones
CREATE POLICY "Admins can manage zones"
ON public.zones FOR ALL
USING (is_admin(auth.uid()));
```

**Example: sos_requests table**
```sql
-- Anyone can create SOS requests
CREATE POLICY "Anyone can create SOS requests"
ON public.sos_requests FOR INSERT
WITH CHECK (true);

-- Users can view their own requests, admins can view all
CREATE POLICY "Users can view their own SOS requests"
ON public.sos_requests FOR SELECT
USING ((auth.uid() = user_id) OR is_admin(auth.uid()));
```

### Security Definer Functions

```sql
-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Shortcut for admin check
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;
```

### Automatic Admin Assignment

A database trigger automatically assigns the `admin` role to specific email addresses:

```sql
CREATE OR REPLACE FUNCTION public.assign_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'vansh@hackthefuture.in' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_assign_admin
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.assign_admin_role();
```

---

## Installation & Setup

### Prerequisites

- Node.js 18+ 
- npm or bun package manager
- Git

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd flowsense-ai

# Install dependencies
npm install
# or
bun install

# Start development server
npm run dev
# or
bun dev
```

The application will be available at `http://localhost:5173`.

### Build for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests with Vitest |

---

## Environment Configuration

Create a `.env` file in the project root with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

### Variable Descriptions

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anonymous/public key | Yes |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project identifier | No |

**Note:** Never commit `.env` files to version control. Use `.env.example` for documentation.

---

## Admin Access

### Default Administrator

| Field | Value |
|-------|-------|
| Email | `vansh@hackthefuture.in` |
| Role Assignment | Automatic on signup |

### Manual Role Assignment

To assign admin role to additional users, insert into the `user_roles` table:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('user-uuid-here', 'admin');
```

Or via the application's settings panel (admin only).

---

## Component Reference

### Core Components

#### SOSButton
Floating emergency button for visitors.

```tsx
<SOSButton />
```

**Props:** None (uses auth context internally)

**Features:**
- Floating position in bottom-right corner
- Opens dialog for emergency details
- Calls `send-sos` edge function
- Displays confirmation with token number

---

#### SOSAlertPanel
Admin panel for monitoring SOS requests.

```tsx
<SOSAlertPanel />
```

**Props:** None (uses real-time subscription internally)

**Features:**
- Audio alarm on new requests
- Flashing visual indicator
- Token and location display
- One-click resolution

---

#### StatusBadge
Zone occupancy status indicator.

```tsx
<StatusBadge status="green" />
<StatusBadge status="yellow" />
<StatusBadge status="red" />
<StatusBadge status="critical" />
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `status` | `zone_status` | Occupancy level |

---

#### LanguageToggle
Language switcher component.

```tsx
<LanguageToggle />
```

**Props:** None (uses language context internally)

**Features:**
- Toggle between EN and HI
- Persists preference to localStorage
- Updates all translated content

---

## Hooks Reference

### useAuth
Authentication state and methods.

```tsx
const { user, session, isLoading, isAdmin, signIn, signUp, signOut } = useAuth();
```

**Returns:**
| Property | Type | Description |
|----------|------|-------------|
| `user` | `User \| null` | Current user object |
| `session` | `Session \| null` | Current session |
| `isLoading` | `boolean` | Auth state loading |
| `isAdmin` | `boolean` | Admin role check |
| `signIn` | `function` | Login method |
| `signUp` | `function` | Registration method |
| `signOut` | `function` | Logout method |

---

### useLanguage
Internationalization state and methods.

```tsx
const { language, setLanguage, t } = useLanguage();
```

**Returns:**
| Property | Type | Description |
|----------|------|-------------|
| `language` | `'en' \| 'hi'` | Current language |
| `setLanguage` | `function` | Change language |
| `t` | `function` | Translation function |

---

### useRealtimeZones
Real-time zone data subscription.

```tsx
const zones = useRealtimeZones();
```

**Returns:** `Zone[]` - Array of zone objects with live updates.

---

### usePredictions
AI prediction generation and fetching.

```tsx
const { 
  predictions, 
  storedPredictions, 
  isLoading, 
  error, 
  generatePredictions, 
  fetchStoredPredictions 
} = usePredictions();
```

**Returns:**
| Property | Type | Description |
|----------|------|-------------|
| `predictions` | `PredictionResponse \| null` | Latest predictions |
| `storedPredictions` | `StoredPrediction[]` | Saved predictions |
| `isLoading` | `boolean` | Loading state |
| `error` | `string \| null` | Error message |
| `generatePredictions` | `function` | Trigger generation |
| `fetchStoredPredictions` | `function` | Fetch saved data |

---

## Contributing Guidelines

### Code Style

- **TypeScript Strict Mode:** All code must pass strict type checking
- **ESLint:** Follow configured linting rules
- **Prettier:** Use consistent formatting (2-space indent, single quotes)

### Component Conventions

1. **File Naming:** PascalCase for components (e.g., `StatusBadge.tsx`)
2. **Folder Structure:** Group related components in folders
3. **Props Interface:** Define explicit TypeScript interfaces
4. **Default Exports:** Use default exports for page components

### Git Workflow

1. Create feature branch from `main`
2. Make changes with descriptive commits
3. Open pull request with detailed description
4. Ensure all checks pass
5. Request review from maintainer

### Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

---

## License & Credits

### Developer

**Vansh Raj Singh**  
Email: vansh@hackthefuture.in

### Project Information

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Build Date | 2026.01.31 |
| License | Proprietary |

### Technology Credits

- [React](https://react.dev/) - UI Framework
- [Vite](https://vitejs.dev/) - Build Tool
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - Component Library
- [Recharts](https://recharts.org/) - Charts
- [Lucide](https://lucide.dev/) - Icons
- [TanStack Query](https://tanstack.com/query) - State Management

---

<p align="center">
  <strong>FlowSense AI</strong> — Intelligent Crowd Management for India's Public Spaces
</p>

<p align="center">
  Made with ❤️ by Vansh Raj Singh
</p>
