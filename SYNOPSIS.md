# PROJECT SYNOPSIS

---

## Integral University, Lucknow
### Department of Computer Applications
### BCA Program — 3th/6th Semester

---

# FlowSense AI — Smart Crowd Management System

**An AI-Powered Intelligent Crowd Management Platform for Public Events & Venues**

---

**Submitted by:**
- **Vansh Raj Singh** — BCA Student, Integral University

**Under the Guidance of:**
- Dr. Adnan Afaq, Department of CA(Computer Applications), Integral University

**Session:** 2025–2026

---

## Table of Contents

1. [Title of the Project](#1-title-of-the-project)
2. [Objective and Scope](#2-objective-and-scope)
3. [Resources (Hardware & Software)](#3-resources-hardware--software)
4. [Project Schedule Plan](#4-project-schedule-plan)
5. [Project Team](#5-project-team)
6. [Process Description](#6-process-description)
7. [Contribution of the Student](#7-contribution-of-the-student-in-the-project)
8. [Conclusion](#8-conclusion)

---

## 1. Title of the Project

**FlowSense AI — Smart Crowd Management System**

*"Intelligent Real-Time Crowd Monitoring, Prediction & Emergency Response for India's Public Spaces"*

The title "FlowSense" represents the core concept — sensing the flow of crowds using AI, computer vision, and real-time data analytics to create safer, smarter, and more efficient public events.

---

## 2. Objective and Scope

### 2.1 Problem Statement

India hosts thousands of large-scale public events annually — religious gatherings (Kumbh Mela, temple festivals), university fests, political rallies, and cultural events. These events attract massive crowds, often numbering in lakhs. The challenges faced include:

| Problem | Impact |
|---------|--------|
| **No real-time crowd visibility** | Organizers are unaware of overcrowding until stampede-like situations develop |
| **Manual queue management** | Long wait times, visitor frustration, fights at entry gates |
| **Delayed emergency response** | SOS requests take minutes to reach responders; precious time is lost |
| **No demographic awareness** | Organizers don't know the gender, age, or count breakdown in different zones |
| **Static, outdated venue maps** | Visitors get lost; no real-time GPS-based navigation |
| **Language barriers** | Hindi-speaking visitors cannot interact with English-only systems |
| **No predictive capabilities** | Organizers react to problems instead of preventing them |

**Real-World Tragedies That Motivate This Project:**
- Vaishno Devi stampede (2022) — 12 killed due to overcrowding at entry gate
- Itaewon crowd crush, Seoul (2022) — 159 deaths in a narrow alley
- Elphinstone Bridge stampede, Mumbai (2017) — 23 dead due to overcrowding on a narrow bridge

These incidents could have been prevented with real-time crowd monitoring, zone-wise density alerts, and predictive AI systems — exactly what FlowSense AI delivers.

### 2.2 Objectives

1. **Real-Time Crowd Monitoring** — Use AI-powered CCTV analysis (TensorFlow.js + COCO-SSD) to count persons in each zone with live bounding boxes, confidence scores, and demographic estimation.

2. **AI-Based Demographic Detection** — Identify gender (Male/Female), estimate age, and detect children (<14 years) using face-api.js neural networks running directly in the browser.

3. **Virtual Queue System** — Eliminate physical queues with a digital token-based system. Visitors get a token, see estimated wait time, and get notified when their turn arrives.

4. **Interactive Venue Map with GPS** — Provide a real-time, editable SVG map with color-coded zone density, GPS-based user location tracking, and facility markers.

5. **Emergency SOS System** — One-tap emergency button for visitors that triggers admin-side siren alerts, red overlay notifications, and automatic incident logging.

6. **AI-Powered Crowd Predictions** — Use historical sensor data to forecast crowd density for the next hours, enabling proactive crowd management.

7. **Bilingual Support (English/Hindi)** — Full i18n with 100+ translation keys, runtime language switching, and persistent preference storage.

8. **Admin Dashboard** — Comprehensive control center with analytics, queue management, alert broadcasting, CCTV monitoring, and zone editing capabilities.

### 2.3 Scope

| Scope Area | Details |
|------------|---------|
| **Target Users** | Event organizers, university fest committees, temple management, police/security |
| **Deployment** | Cloud-hosted Progressive Web App (PWA) — accessible on any device with a browser |
| **Scale** | Designed for events with 500–50,000+ attendees |
| **Use Case Demo** | Integral University Annual Fest with 3 entry gates, 9 zones |
| **Extensibility** | Modular architecture allows adding new zones, cameras, and features |

### 2.4 Why Would Someone Use FlowSense AI?

| Stakeholder | Value Proposition |
|-------------|-------------------|
| **Event Organizers** | Real-time dashboard showing exactly how many people are in each zone, with AI predictions to prevent overcrowding before it happens |
| **Security Teams** | Instant SOS alerts with siren, automated behavior detection (running, abandoned objects, suspicious loitering), and zone-wise density heatmaps |
| **Visitors** | No more standing in long queues — join virtually, get notified. GPS-based navigation inside venue. Emergency help at one tap |
| **University Admin** | Professional crowd management for annual fests, convocations, and open days. Reduces liability and improves visitor experience |
| **Government Bodies** | Can be deployed at Kumbh Mela, Republic Day parades, election rallies. Scalable, bilingual, and requires no app installation |

### 2.5 Benefits

1. **Prevents Stampedes** — AI detects overcrowding in real-time and alerts admins before critical density is reached
2. **Saves Lives** — SOS system reduces emergency response time from minutes to seconds
3. **Reduces Wait Times** — Virtual queues eliminate physical crowding at entry points
4. **Gender & Child Safety** — Real-time demographic tracking enables targeted security deployment
5. **Zero Installation** — Works as a web app; visitors just scan a QR code
6. **Cost-Effective** — Uses existing CCTV cameras + browser-based AI; no special hardware needed
7. **Bilingual** — Hindi + English ensures accessibility for all visitors
8. **Data-Driven Decisions** — Historical analytics and AI predictions enable better planning for future events

---

## 3. Resources (Hardware & Software)

### 3.1 Hardware Requirements

| Component | Specification |
|-----------|--------------|
| **Development Machine** | Any laptop/PC with 8GB+ RAM, modern browser |
| **CCTV Cameras** | Standard webcams or IP cameras (existing infrastructure) |
| **Server** | Cloud-hosted (no physical server required) |
| **Mobile Devices** | Any smartphone/tablet with browser (for visitor app) |
| **Admin Display** | Desktop/laptop with 1024px+ resolution |

### 3.2 Software Requirements

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Frontend Framework** | React 18.3 + TypeScript | Component-based UI development |
| **Build Tool** | Vite 5.x | Fast HMR and optimized builds |
| **Styling** | Tailwind CSS + shadcn/ui | Utility-first CSS with accessible components |
| **State Management** | TanStack React Query v5 | Server state synchronization |
| **Routing** | React Router DOM v6 | Client-side navigation |
| **Charts** | Recharts | Data visualization (analytics) |
| **AI — Person Detection** | TensorFlow.js + COCO-SSD | Real-time person counting via camera |
| **AI — Face Analysis** | face-api.js | Age, gender, and child detection |
| **Database** | PostgreSQL (Cloud-hosted) | Relational data storage |
| **Backend Functions** | Deno Runtime (Edge Functions) | Serverless API endpoints |
| **Real-time** | WebSocket (Realtime Subscriptions) | Live data updates |
| **Authentication** | JWT-based Auth | Secure user sessions |
| **Internationalization** | Custom i18n module | English/Hindi translation |
| **Version Control** | Git + GitHub | Source code management |
| **Deployment** | Lovable Cloud | Automated CI/CD |

### 3.3 Development Environment

| Tool | Version |
|------|---------|
| Node.js / Bun | v18+ / v1.x |
| TypeScript | 5.x (strict mode) |
| ESLint | Code quality enforcement |
| Vitest | Unit testing framework |

---

## 4. Project Schedule Plan (Gantt Chart)

```
Phase                          | Week 1-2 | Week 3-4 | Week 5-6 | Week 7-8 | Week 9-10 | Week 11-12
-------------------------------|----------|----------|----------|----------|-----------|----------
Requirements Analysis          | ████████ |          |          |          |           |
System Design & Architecture   |          | ████████ |          |          |           |
Database Schema Design         |          | ████████ |          |          |           |
Frontend — Visitor App         |          |          | ████████ |          |           |
Frontend — Admin Dashboard     |          |          | ████████ | ████████ |           |
AI Camera Detection Module     |          |          |          | ████████ |           |
Face-API Demographics Module   |          |          |          | ████████ |           |
Backend Edge Functions         |          |          |          | ████████ |           |
Real-time & WebSocket          |          |          |          |          | ████████  |
SOS Emergency System           |          |          |          |          | ████████  |
Map Editor & GPS Integration   |          |          |          |          | ████████  |
Testing & Bug Fixing           |          |          |          |          |           | ████████
Documentation & Synopsis       |          |          |          |          |           | ████████
Deployment & Presentation      |          |          |          |          |           | ████████
```

### Milestone Summary

| Milestone | Target Week | Deliverable |
|-----------|-------------|-------------|
| M1 — Design Complete | Week 4 | UML diagrams, DB schema, wireframes |
| M2 — Core App Ready | Week 6 | Visitor + Admin UI functional |
| M3 — AI Integration | Week 8 | Camera detection + face analysis working |
| M4 — Full System | Week 10 | SOS, real-time, map editor complete |
| M5 — Deployment | Week 12 | Production-ready, documented, tested |

---

## 5. Project Team

| Name | Role | Modules Covered |
|------|------|-----------------|
| **Vansh Raj Singh** | Full-Stack Developer & Project Lead | All modules — Frontend (Visitor App + Admin Dashboard), AI Camera Detection, Face Analysis, Backend Edge Functions, Database Design, Real-time System, SOS Emergency, Map Editor, GPS Integration, i18n, Deployment |

> **Note:** This is an individual project. All design, development, testing, and documentation has been done solely by the student.

---

## 6. Process Description

### 6.1 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    FlowSense AI Architecture                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────────┐    ┌──────────────┐    ┌─────────────┐  │
│   │  Visitor App  │    │ Admin Panel  │    │  AI Camera  │  │
│   │  (Mobile PWA) │    │  (Desktop)   │    │  Module     │  │
│   └──────┬───────┘    └──────┬───────┘    └──────┬──────┘  │
│          │                   │                    │         │
│          └───────────┬───────┘                    │         │
│                      │                            │         │
│              ┌───────▼────────┐                   │         │
│              │   React SPA    │◄──────────────────┘         │
│              │ (Vite + TS)    │                              │
│              └───────┬────────┘                              │
│                      │                                       │
│              ┌───────▼────────┐                              │
│              │  TanStack      │                              │
│              │  React Query   │                              │
│              └───────┬────────┘                              │
│                      │                                       │
│         ┌────────────┼────────────┐                          │
│         │            │            │                          │
│   ┌─────▼─────┐ ┌───▼───┐ ┌─────▼─────┐                   │
│   │PostgreSQL │ │Edge   │ │WebSocket  │                    │
│   │ Database  │ │Funcs  │ │Realtime   │                    │
│   └───────────┘ └───────┘ └───────────┘                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Module Listing & Description

#### Module 1: Visitor Application (Mobile-First PWA)

| Sub-Module | Description |
|------------|-------------|
| **Home Dashboard** | Welcome section, real-time zone status cards, quick stats (safe zones, wait time, capacity, alerts), active queue listing |
| **Virtual Queue** | Token generation with auto-increment, estimated wait time calculation, queue position tracking, token status (waiting → called → served) |
| **Interactive Map** | SVG-based venue map, color-coded zone density (green/yellow/red), GPS-based user location dot, facility markers |
| **Facilities Locator** | Categorized amenities — washroom, medical, water, food, parking, information, prayer room, rest area |
| **Alerts Feed** | Real-time emergency broadcast display, bilingual notifications (English + Hindi), severity indicators |
| **SOS Emergency** | One-tap distress signal, auto-captures user token & location, sends to admin in real-time |

#### Module 2: Admin Dashboard (Desktop-First)

| Sub-Module | Description |
|------------|-------------|
| **Overview Dashboard** | Key metrics, live zone heatmap, AI insights panel, total footfall counter |
| **Analytics** | Daily/hourly footfall charts using Recharts, zone distribution pie chart, CSV data export |
| **Queue Management** | Create/pause/close queues, call next token, token tracking table, priority queue support |
| **Alert Broadcasting** | Pre-defined emergency templates, zone-targeted alerts, severity levels (info/warning/critical/emergency) |
| **AI CCTV Monitor** | Live camera feed with person detection, bounding boxes, gender/age labels, anomaly detection events |
| **Map Editor** | Drag-to-position SVG zones, add/edit/delete zones, load IU Fest preset (3 gates + 9 zones), sync to database |
| **User Management** | Role-based user listing (admin/moderator/visitor), role assignment |
| **Settings** | Notification preferences, system health monitoring, theme toggle |

#### Module 3: AI Camera Detection

| Sub-Module | Description |
|------------|-------------|
| **Person Detection** | TensorFlow.js + COCO-SSD model (lite_mobilenet_v2) — detects persons in camera frame with bounding boxes and confidence scores |
| **Face Analysis** | face-api.js with TinyFaceDetector + AgeGenderNet — detects faces, estimates age (years), gender (Male/Female), and identifies children (<14 years) |
| **Face-Body Mapping** | Algorithm to map face detections to body detections using spatial proximity, ensuring each person gets correct demographics |
| **Daily Tracking** | 24-hour person counter with IST midnight auto-reset, tracks total/peak/male/female/child counts |
| **Anomaly Detection** | Detects sudden crowd spikes, dispersals, and unusual patterns; triggers admin alerts |

#### Module 4: Backend Infrastructure

| Sub-Module | Description |
|------------|-------------|
| **Database** | 11 PostgreSQL tables with proper relationships, enums, and indexes |
| **Edge Functions** | 4 serverless endpoints — generate-predictions, broadcast-alert, resolve-alert, send-sos |
| **Real-time** | WebSocket subscriptions for zones, alerts, queue tokens, SOS requests |
| **Authentication** | JWT-based auth with email/password, role-based access control (RBAC) |
| **RLS Policies** | Row Level Security on all tables ensuring data isolation |

#### Module 5: Internationalization (i18n)

| Feature | Details |
|---------|---------|
| Languages | English (en), Hindi (hi) |
| Translation Keys | 100+ keys covering all UI elements |
| Switching | Runtime language toggle with instant UI update |
| Persistence | User preference stored in localStorage |

### 6.3 UML Diagrams

#### 6.3.1 Use Case Diagram

```
                    ┌─────────────────────────────────────┐
                    │         FlowSense AI System          │
                    │                                     │
  ┌────────┐        │  ┌─────────────────────┐            │
  │Visitor │───────►│  │  View Zone Status    │            │
  │        │───────►│  │  Join Virtual Queue  │            │
  │        │───────►│  │  View Map + GPS      │            │
  │        │───────►│  │  Find Facilities     │            │
  │        │───────►│  │  View Alerts         │            │
  │        │───────►│  │  Send SOS            │            │
  │        │───────►│  │  Switch Language      │            │
  └────────┘        │  └─────────────────────┘            │
                    │                                     │
  ┌────────┐        │  ┌─────────────────────┐            │
  │ Admin  │───────►│  │  Monitor Dashboard   │            │
  │        │───────►│  │  View Analytics      │            │
  │        │───────►│  │  Manage Queues       │            │
  │        │───────►│  │  Broadcast Alerts    │            │
  │        │───────►│  │  Monitor CCTV + AI   │            │
  │        │───────►│  │  Edit Map & Zones    │            │
  │        │───────►│  │  Respond to SOS      │            │
  │        │───────►│  │  Manage Users        │            │
  └────────┘        │  └─────────────────────┘            │
                    │                                     │
  ┌────────┐        │  ┌─────────────────────┐            │
  │   AI   │───────►│  │  Detect Persons      │            │
  │ System │───────►│  │  Analyze Demographics│            │
  │        │───────►│  │  Detect Anomalies    │            │
  │        │───────►│  │  Generate Predictions│            │
  └────────┘        │  └─────────────────────┘            │
                    └─────────────────────────────────────┘
```

#### 6.3.2 Activity Diagram — SOS Emergency Flow

```
┌──────────┐
│  START   │
└────┬─────┘
     ▼
┌──────────────────┐
│ Visitor taps SOS │
│ emergency button │
└────────┬─────────┘
         ▼
┌──────────────────────┐
│ System captures:     │
│ - User token number  │
│ - Location (GPS)     │
│ - Phone number       │
│ - Timestamp          │
└────────┬─────────────┘
         ▼
┌──────────────────────┐
│ Edge Function:       │
│ send-sos             │
│ Creates record in    │
│ sos_requests table   │
└────────┬─────────────┘
         ▼
┌──────────────────────┐
│ WebSocket broadcasts │
│ to all admin clients │
└────────┬─────────────┘
         ▼
┌──────────────────────┐     ┌──────────────────┐
│ Admin Dashboard:     │────►│ Siren sound plays│
│ Red overlay appears  │     │ via Web Audio API │
│ SOSAlertOverlay.tsx  │     └──────────────────┘
└────────┬─────────────┘
         ▼
┌──────────────────────┐
│ Admin clicks         │
│ "Respond" button     │
└────────┬─────────────┘
         ▼
┌──────────────────────┐
│ SOS status updated   │
│ to "responded"       │
│ responded_at = now() │
│ responded_by = admin │
└────────┬─────────────┘
         ▼
┌──────────────────────┐
│ Visitor notified     │
│ Help is on the way   │
└────────┬─────────────┘
         ▼
┌──────────┐
│   END    │
└──────────┘
```

#### 6.3.3 Class Diagram — Core Entities

```
┌──────────────────┐       ┌──────────────────┐
│      Zone        │       │     Queue        │
├──────────────────┤       ├──────────────────┤
│ id: UUID         │       │ id: UUID         │
│ name: string     │       │ name: string     │
│ name_hi: string  │       │ name_hi: string  │
│ capacity: int    │◄──────│ zone_id: FK      │
│ current_count: int│      │ status: enum     │
│ status: enum     │       │ current_token: int│
│ coordinates: JSON│       │ max_capacity: int │
│ description: text│       │ avg_service_time │
└────────┬─────────┘       └────────┬─────────┘
         │                          │
         │                          │
         ▼                          ▼
┌──────────────────┐       ┌──────────────────┐
│   Facility       │       │  QueueToken      │
├──────────────────┤       ├──────────────────┤
│ id: UUID         │       │ id: UUID         │
│ name: string     │       │ queue_id: FK     │
│ type: enum       │       │ token_number: int│
│ zone_id: FK      │       │ status: enum     │
│ is_available: bool│      │ user_id: FK      │
│ capacity: int    │       │ phone: string    │
│ current_usage: int│      │ estimated_wait   │
└──────────────────┘       │ called_at: time  │
                           │ served_at: time  │
┌──────────────────┐       └──────────────────┘
│     Alert        │
├──────────────────┤       ┌──────────────────┐
│ id: UUID         │       │   SOSRequest     │
│ title: string    │       ├──────────────────┤
│ message: string  │       │ id: UUID         │
│ severity: enum   │       │ token_number: str│
│ status: enum     │       │ user_id: FK      │
│ zone_ids: UUID[] │       │ zone_id: FK      │
│ created_by: FK   │       │ location: string │
│ resolved_at: time│       │ phone: string    │
│ expires_at: time │       │ status: string   │
└──────────────────┘       │ responded_by: FK │
                           │ responded_at: time│
┌──────────────────┐       └──────────────────┘
│  SensorReading   │
├──────────────────┤       ┌──────────────────┐
│ id: UUID         │       │   Prediction     │
│ zone_id: FK      │       ├──────────────────┤
│ count: int       │       │ id: UUID         │
│ flow_rate: float │       │ zone_id: FK      │
│ temperature: float│      │ predicted_count  │
│ recorded_at: time│       │ prediction_for   │
└──────────────────┘       │ confidence: float│
                           │ factors: JSON    │
                           └──────────────────┘
```

#### 6.3.4 Communication Diagram — Real-Time Alert Broadcasting

```
    ┌─────────┐          ┌──────────────┐          ┌──────────────┐
    │  Admin   │──(1)───►│ broadcast-   │──(2)────►│  alerts      │
    │ Browser  │  POST   │ alert Edge   │  INSERT  │  table       │
    └─────────┘          │ Function     │          └──────┬───────┘
                         └──────────────┘                 │
                                                    (3) WebSocket
                                                   broadcast event
                                                          │
                    ┌─────────────────────────────────────┤
                    │                   │                  │
              ┌─────▼─────┐     ┌──────▼──────┐    ┌─────▼──────┐
              │ Visitor 1  │     │ Visitor 2   │    │ Visitor N  │
              │ Browser    │     │ Browser     │    │ Browser    │
              │ (shows     │     │ (shows      │    │ (shows     │
              │  toast)    │     │  toast)     │    │  toast)    │
              └────────────┘     └─────────────┘    └────────────┘
```

### 6.4 Database Schema (ER Diagram — Textual)

```
zones ──< facilities        (one zone has many facilities)
zones ──< queues            (one zone has many queues)
zones ──< sensor_readings   (one zone has many sensor readings)
zones ──< predictions       (one zone has many predictions)
zones ──< incidents         (one zone has many incidents)
zones ──< sos_requests      (one zone has many SOS requests)
zones ──< orders            (one zone has many orders)
queues ──< queue_tokens     (one queue has many tokens)
```

**Enums Used:**
| Enum | Values |
|------|--------|
| `zone_status` | green, yellow, red, critical |
| `alert_severity` | info, warning, critical, emergency |
| `alert_status` | active, resolved, expired |
| `queue_status` | active, paused, closed |
| `token_status` | waiting, called, served, cancelled, expired |
| `app_role` | admin, moderator, visitor |
| `facility_type` | washroom, medical, water, food, parking, information, prayer, rest_area |

### 6.5 Edge Functions (API Endpoints)

| Function | Method | Description | Input | Output |
|----------|--------|-------------|-------|--------|
| `generate-predictions` | POST | Runs AI prediction algorithm on sensor data to forecast crowd for next hours | `{ zone_id }` | `{ predictions[] }` |
| `broadcast-alert` | POST | Creates emergency alert and broadcasts to all subscribers | `{ title, message, severity, zone_ids }` | `{ alert_id }` |
| `resolve-alert` | POST | Marks an active alert as resolved | `{ alert_id }` | `{ success }` |
| `send-sos` | POST | Creates an SOS request with visitor details | `{ token_number, location, phone, message }` | `{ sos_id }` |

---

## 7. Contribution of the Student in the Project

### Vansh Raj Singh — Complete System Development

As the **sole developer**, Vansh Raj Singh designed, developed, tested, and deployed the entire FlowSense AI system. Below is the detailed breakdown:

#### 7.1 Frontend Development

| Module | Files Created | Key Technologies |
|--------|--------------|-----------------|
| Visitor Home Page | `src/pages/visitor/Home.tsx` | React, Tailwind, StatusBadge component |
| Virtual Queue System | `src/pages/visitor/Queue.tsx` | React Query, real-time subscriptions |
| Interactive Map | `src/pages/visitor/Map.tsx` | SVG rendering, GPS API, real-time DB sync |
| Facilities Locator | `src/pages/visitor/Facilities.tsx` | Category-based filtering, zone mapping |
| Alerts Feed | `src/pages/visitor/Alerts.tsx` | Real-time subscriptions, bilingual display |
| Food/Service Ordering | `src/pages/visitor/Order.tsx` | Order form, order tracking |
| Admin Dashboard | `src/pages/admin/Dashboard.tsx` | Metrics cards, heatmap, AI insights |
| Admin Analytics | `src/pages/admin/Analytics.tsx` | Recharts, CSV export, date filters |
| Admin Queues | `src/pages/admin/Queues.tsx` | Queue CRUD, token management |
| Admin Alerts | `src/pages/admin/Alerts.tsx` | Alert templates, zone targeting |
| Admin CCTV | `src/pages/admin/CCTV.tsx` | Camera integration, event logging |
| Admin Map Editor | `src/pages/admin/MapEditor.tsx` | Drag-drop zones, IU Fest preset |
| Admin Users | `src/pages/admin/Users.tsx` | Role management |
| Admin Settings | `src/pages/admin/Settings.tsx` | Preferences, system health |

#### 7.2 AI & Computer Vision

| Component | Description | Technology |
|-----------|-------------|-----------|
| `CameraDetection.tsx` | 598-line component handling camera access, AI model loading, real-time detection loop, face-body mapping, anomaly detection, and HUD rendering | TensorFlow.js, COCO-SSD, face-api.js |
| Person Detection | Detects humans in camera frames with bounding boxes | COCO-SSD (lite_mobilenet_v2) |
| Face Analysis | Estimates age (years) and gender from facial features | face-api.js TinyFaceDetector + AgeGenderNet |
| Child Detection | Identifies children (age < 14) via face analysis or body height ratio fallback | Custom algorithm |
| Daily Counter | 24-hour tracking with IST midnight reset | localStorage + setTimeout scheduler |

#### 7.3 Backend Development

| Component | Description |
|-----------|-------------|
| Database Schema | Designed 11 tables with relationships, enums, indexes, and RLS policies |
| Edge Functions | 4 serverless functions for predictions, alerts, SOS, and resolution |
| Real-time System | WebSocket subscriptions for live data updates across all clients |
| Authentication | JWT-based auth with email/password and role-based access control |

#### 7.4 Custom Hooks Developed

| Hook | Purpose |
|------|---------|
| `useRealtime.ts` | WebSocket subscription management for live database updates |
| `usePredictions.ts` | AI prediction data fetching and caching |
| `useEmergencyAlerts.ts` | Real-time alert subscription and notification |
| `useSOSListener.ts` | SOS request monitoring for admin dashboard |
| `useSimulation.ts` | Simulation mode for demo/testing purposes |
| `useSirenSound.ts` | Web Audio API siren sound for SOS alerts |
| `useVoiceCommand.ts` | Browser Speech Recognition API integration |
| `useTokenNotification.ts` | Token call notification for visitors |

#### 7.5 Design & UX

| Contribution | Details |
|-------------|---------|
| Design System | Custom CSS variables for consistent theming (primary, safe, caution, danger) |
| Dark/Light Mode | Full theme support via next-themes |
| Responsive Design | Mobile-first visitor app, desktop-first admin panel |
| Accessibility | Semantic HTML, ARIA labels, keyboard navigation |
| Animations | Pulse animations for live indicators, fade-in transitions |

---

## 8. Conclusion

### 8.1 Summary of Achievements

FlowSense AI successfully delivers an **end-to-end intelligent crowd management system** that addresses critical safety challenges at India's public events. The key achievements are:

1. **Real-Time AI Surveillance** — Browser-based person detection using TensorFlow.js and face-api.js, requiring zero server-side GPU infrastructure. The system runs entirely in the visitor's/admin's browser, making it incredibly cost-effective.

2. **Demographic Intelligence** — The face-body mapping algorithm uniquely combines COCO-SSD body detection with face-api.js face analysis to provide per-person gender, age, and child identification — a feature not available in most commercial crowd management tools.

3. **Zero-Installation Deployment** — As a Progressive Web App, FlowSense AI requires no app installation. Visitors simply scan a QR code and access all features instantly — a critical advantage for large public events where app download is impractical.

4. **Sub-Second Emergency Response** — The SOS system's WebSocket-based architecture ensures that an admin receives an emergency alert within 1-2 seconds of a visitor pressing the SOS button, with automatic siren activation and visual overlay — dramatically reducing emergency response time.

5. **Bilingual Accessibility** — Full Hindi + English support ensures the system is accessible to all visitors, not just English-speaking ones — a crucial requirement for Indian public events.

### 8.2 Innovations in Approach

| Innovation | Description |
|-----------|-------------|
| **Edge AI** | All AI models run in the browser (TensorFlow.js), eliminating the need for GPU servers or cloud AI APIs |
| **Face-Body Fusion** | Custom algorithm maps face detections to body detections using spatial proximity for accurate per-person demographics |
| **IST-Aware Reset** | Daily counters reset at 12:00 AM IST using timezone-aware scheduling, not server time |
| **Preset Templates** | Admin can load pre-configured venue layouts (IU Fest with 3 gates + 9 zones) with one click |
| **Dual Detection Loop** | Runs COCO-SSD and face-api.js in parallel on each frame, with graceful fallback if face models fail |

### 8.3 What Makes FlowSense AI Stand Out

1. **No Special Hardware** — Works with existing webcams and CCTV cameras
2. **No App Installation** — PWA accessible via QR code scan
3. **No Cloud AI Costs** — All AI runs in-browser using TensorFlow.js
4. **Real-Time Everything** — WebSocket-based live updates across all modules
5. **Production-Ready** — Deployed on cloud with authentication, RBAC, and RLS security
6. **Culturally Adapted** — Bilingual (Hindi/English), designed for Indian public events
7. **Scalable Architecture** — Modular component design allows easy extension

### 8.4 Future Enhancements

| Enhancement | Description |
|------------|-------------|
| Multi-camera support | Switch between multiple CCTV feeds in the AI monitor |
| Heatmap overlay | Color gradient heatmap on the venue map based on density |
| Push notifications | Browser push notifications for token calls and alerts |
| Offline support | Service worker for offline visitor app functionality |
| WhatsApp integration | Send token notifications and alerts via WhatsApp |
| Advanced ML models | Train custom models on Indian crowd datasets for higher accuracy |

---

**Prepared by:** Vansh Raj Singh  
**Program:** MCA, Integral University, Lucknow  
**Date:** February 2026  
**Version:** 1.0.0

---

*"FlowSense AI — Because every life in a crowd matters."*
