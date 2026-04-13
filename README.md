# FlowSense AI — Advanced System Architecture & Workflow

---

## End-to-End System Flow

```mermaid
flowchart LR
    A[Visitor App] --> B[Frontend Layer]
    C[Admin Dashboard] --> B

    B --> D[API Layer / Edge Functions]

    D --> E[Realtime Engine]
    D --> F[Prediction Engine]
    D --> G[Alert System]
    D --> H[SOS Handler]

    E --> I[Database]
    F --> I
    G --> I
    H --> I

    I --> E
    E --> B
```

---

## Visitor Journey Flow

```mermaid
flowchart TD
    A[Open App] --> B[Load Dashboard]
    B --> C[Fetch Zone Data]
    C --> D[Display Status Grid]

    D --> E[User Action]

    E -->|Queue| F[Join Virtual Queue]
    E -->|Map| G[View Live Map]
    E -->|Facilities| H[Find Services]
    E -->|Alerts| I[Read Alerts]
    E -->|SOS| J[Trigger Emergency]

    F --> K[Token Generated]
    K --> L[Realtime Updates]

    J --> M[Send SOS Request]
    M --> N[Admin Notified]
```

---

## Admin Workflow Flow

```mermaid
flowchart TD
    A[Admin Login] --> B[Dashboard]
    B --> C[Monitor Zones]
    B --> D[Manage Queues]
    B --> E[View SOS Alerts]
    B --> F[Broadcast Alerts]

    D --> G[Create Queue]
    D --> H[Call Next Token]

    F --> I[Select Zones]
    I --> J[Send Alert]

    E --> K[Resolve SOS]
```

---

## Virtual Queue System Flow

```mermaid
flowchart TD
    A[User Requests Token] --> B[Check Queue Status]
    B -->|Active| C[Generate Token Number]
    C --> D[Store in Database]
    D --> E[Return Token to User]

    E --> F[Wait in Queue]
    F --> G[Admin Calls Token]
    G --> H[User Notified]
    H --> I[Service Completed]
```

---

## SOS Emergency Flow

```mermaid
flowchart TD
    A[User Presses SOS] --> B[Enter Details]
    B --> C[Generate SOS Token]
    C --> D[Send to Backend]

    D --> E[Store Request]
    E --> F[Trigger Realtime Event]

    F --> G[Admin Dashboard Alert]
    G --> H[Audio Alarm Triggered]

    H --> I[Admin Responds]
    I --> J[Mark Resolved]
```

---

## Alert Broadcasting Flow

```mermaid
flowchart TD
    A[Admin Creates Alert] --> B[Select Severity]
    B --> C[Select Target Zones]
    C --> D[Send Alert]

    D --> E[Store in Database]
    E --> F[Realtime Broadcast]

    F --> G[Visitor Devices Receive]
    G --> H[Display Alert Banner]
```

---

## Prediction Engine Flow

```mermaid
flowchart TD
    A[Historical Data] --> B[Data Processing]
    B --> C[Pattern Analysis]
    C --> D[AI Prediction Model]

    D --> E[Generate Hourly Predictions]
    E --> F[Store Predictions]

    F --> G[Admin Dashboard]
    G --> H[Show Insights & Risk Level]
```

---

## Realtime System Flow

```mermaid
flowchart LR
    A[Database Change] --> B[Realtime Engine]
    B --> C[WebSocket Broadcast]

    C --> D[Visitor App]
    C --> E[Admin Dashboard]

    D --> F[UI Update]
    E --> F
```

---

## Database Interaction Flow

```mermaid
flowchart TD
    A[User Action] --> B[API Request]
    B --> C[Edge Function]

    C --> D[Validate Request]
    D --> E[Apply Business Logic]
    E --> F[Write to Database]

    F --> G[Trigger Realtime]
    G --> H[Update UI]
```

---

## Security Flow

```mermaid
flowchart TD
    A[Request] --> B[Authentication Check]
    B --> C[JWT Validation]

    C --> D[Role Check]
    D --> E[RLS Policy Check]

    E --> F[Allow or Deny]

    F -->|Allow| G[Process Request]
    F -->|Deny| H[Reject Request]
```

---

## System Architecture (Detailed)

```mermaid
flowchart LR
    subgraph Client Layer
        A[Visitor PWA]
        B[Admin Dashboard]
    end

    subgraph API Layer
        C[Edge Functions]
    end

    subgraph Data Layer
        D[PostgreSQL]
        E[Realtime Engine]
        F[Storage]
    end

    A --> C
    B --> C
    C --> D
    C --> E
    C --> F
    E --> A
    E --> B
```

---

## Queue Token Lifecycle

```mermaid
stateDiagram-v2
    [*] --> waiting
    waiting --> called
    called --> served
    waiting --> cancelled
    called --> expired
```

---

## Alert Lifecycle

```mermaid
stateDiagram-v2
    [*] --> created
    created --> active
    active --> resolved
    active --> expired
```

---

## SOS Lifecycle

```mermaid
stateDiagram-v2
    [*] --> active
    active --> responded
    responded --> resolved
```

---

## Data Flow Summary

```mermaid
sequenceDiagram
    participant Visitor
    participant Frontend
    participant Backend
    participant Database
    participant Admin

    Visitor->>Frontend: Request Action
    Frontend->>Backend: API Call
    Backend->>Database: Store Data
    Database->>Backend: Confirm
    Backend->>Frontend: Response

    Backend->>Admin: Realtime Update
    Admin->>Backend: Action
```

---

## System Advantages

- Fully real-time architecture
- Event-driven system design
- Modular and scalable backend
- Strong security with RLS and JWT
- Low-latency communication via WebSockets
- AI-driven predictive analytics
- Fault-tolerant microservice-style structure

---

## High-Level Architecture Summary

```mermaid
flowchart TD
    A[Input Layer] --> B[Processing Layer]
    B --> C[Storage Layer]
    C --> D[Realtime Layer]
    D --> E[Presentation Layer]
```

---

## Conclusion

FlowSense AI is designed as a highly scalable, real-time, event-driven system capable of handling large-scale crowd environments with precision, safety, and efficiency. The integration of predictive analytics, realtime communication, and modular architecture ensures reliability and future extensibility.
