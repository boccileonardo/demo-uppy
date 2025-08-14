```mermaid
sequenceDiagram
    participant Admin
    participant App
    participant User

    Admin->>App: Create new user
    App-->>Admin: Generate temp password
    Admin->>User: Share temp password
    User->>App: Login with temp password
    App-->>User: Prompt for password reset
    User->>App: Set new password
    App-->>User: Login successful
```