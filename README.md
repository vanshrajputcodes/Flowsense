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
  <strong>Developer:</strong> Vansh Raj Singh &nbsp;|&nbsp; 
  <strong>Version:</strong> 1.0.0 &nbsp;|&nbsp; 
  <strong>Build:</strong> 2026.01.31
</p>

---

# Executive Summary

FlowSense AI is a real-time intelligent crowd management system designed for high-density public environments such as temples, railway stations, stadiums, and large-scale events.

It combines real-time monitoring, predictive analytics, and instant communication to ensure safety, optimize crowd flow, and improve visitor experience.

---

# Core Features and Working

## 1. Real-Time Crowd Monitoring

### Working
- Sensors or manual inputs continuously update crowd counts
- Data is stored in the database
- Realtime subscriptions push updates instantly to all clients

```mermaid
flowchart LR
    A[Sensor Data / Input] --> B[Database]
    B --> C[Realtime Engine]
    C --> D[Visitor App]
    C --> E[Admin Dashboard]
```

---

## 2. Virtual Queue System

### Working
- Users generate digital tokens instead of standing in queues
- System calculates estimated wait time dynamically
- Admin controls token flow

```mermaid
flowchart TD
    A[User Requests Token] --> B[Generate Token]
    B --> C[Store in DB]
    C --> D[Queue Position Updated]
    D --> E[Admin Calls Token]
    E --> F[User Notification]
```

---

## 3. Interactive Crowd Map

### Working
- Each zone has real-time density data
- Color-coded visualization based on occupancy
- Updates instantly through realtime engine

```mermaid
flowchart TD
    A[Zone Data] --> B[Process Density]
    B --> C[Assign Color Code]
    C --> D[Render Map UI]
```

---

## 4. Emergency Alert System

### Working
- Admin creates alert with severity and zones
- Stored in database
- Broadcasted instantly to all users

```mermaid
flowchart TD
    A[Admin Creates Alert] --> B[Store Alert]
    B --> C[Realtime Broadcast]
    C --> D[User Receives Alert]
```

---

## 5. SOS Emergency System

### Working
- User triggers SOS
- Unique token generated
- Admin receives alert instantly

```mermaid
flowchart TD
    A[User Clicks SOS] --> B[Generate Token]
    B --> C[Send Request]
    C --> D[Database Store]
    D --> E[Admin Notification]
    E --> F[Resolve Case]
```

---

## 6. AI Prediction System

### Working
- Uses historical and real-time data
- Generates future crowd predictions
- Helps admins take proactive actions

```mermaid
flowchart TD
    A[Historical Data] --> B[AI Model]
    B --> C[Generate Predictions]
    C --> D[Store Results]
    D --> E[Admin Dashboard]
```

---

## 7. Facilities Locator

### Working
- Facilities mapped to zones
- Availability tracked in real-time
- Users can filter and locate nearby services

```mermaid
flowchart TD
    A[Facility Data] --> B[Filter by Type]
    B --> C[Match User Location]
    C --> D[Display Results]
```

---

# Complete System Workflow

```mermaid
flowchart LR
    A[Visitor] --> B[Frontend]
    B --> C[API Layer]
    C --> D[Database]

    D --> E[Realtime Engine]
    E --> B

    C --> F[Prediction Engine]
    C --> G[Alert System]
    C --> H[SOS System]
```

---

# Admin Workflow

```mermaid
flowchart TD
    A[Login] --> B[Dashboard]
    B --> C[Monitor Crowd]
    B --> D[Manage Queue]
    B --> E[Send Alerts]
    B --> F[Handle SOS]
```

---

# Visitor Workflow

```mermaid
flowchart TD
    A[Open App] --> B[View Dashboard]
    B --> C[Check Crowd Status]

    C --> D[Join Queue]
    C --> E[View Map]
    C --> F[Check Alerts]
    C --> G[Use SOS]
```

---

# Realtime Data Flow

```mermaid
flowchart LR
    A[Database Change] --> B[Realtime Engine]
    B --> C[WebSocket]
    C --> D[Frontend Update]
```

---

# Security Flow

```mermaid
flowchart TD
    A[Request] --> B[JWT Authentication]
    B --> C[Role Check]
    C --> D[RLS Policy]
    D --> E[Allow or Deny]
```

---

# Architecture Overview

```mermaid
flowchart LR
    subgraph Client
        A[Visitor App]
        B[Admin Panel]
    end

    subgraph Backend
        C[Edge Functions]
        D[Realtime Engine]
    end

    subgraph Data
        E[PostgreSQL]
    end

    A --> C
    B --> C
    C --> E
    E --> D
    D --> A
    D --> B
```

---

# Key Advantages

- Real-time monitoring and updates
- Digital queue system eliminates physical crowding
- AI-based predictions for proactive management
- Instant emergency communication
- Scalable and modular architecture
- Secure access control with RLS and JWT

---

# Conclusion

FlowSense AI is a complete intelligent system designed to solve real-world crowd management challenges using modern technologies. Its real-time capabilities, predictive intelligence, and modular design make it suitable for large-scale deployment across public infrastructures.
