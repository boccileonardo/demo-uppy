# Demo Uploader - File Upload Application

A full-stack file upload demo application with React frontend and FastAPI backend, with user authentication and uppy file upload.

> [!WARNING]  
> The code is not production ready, it's only for a demo.
> We can reuse styling, some components and ideas, but appropriate resources and timelines should be planned if we decide to proceed further with this approach.

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui + Uppy.js
- **Backend**: Python + FastAPI + SQLite + SQLAlchemy
- **Authentication**: JWT tokens with bcrypt password hashing
- **File Storage**: Local filesystem (easily replaceable with Azure Blob Storage)

## Features
- User authentication and admin role separation
- Admin panel to manage users and blob destinations
- File upload with uppy.js

## Missing features
- Real database to replace sqlite (sqlite does not allow concurrent writes)
- Create real (not mock-ups) Azure connections in admin panel
- Upload files to Azure instead of local filesystem
- Integrate with Spyglass for failure logs and availability
- User panel (change password, email, name, etc.)
- Optional 2FA (allow users to increase their security)
- After file upload has been processed by downstream, the app should display validation (schema, data quality) back to the user that uploaded it.
- Developer panel (create api token, redirect to api docs) for tech savvy users that want to automate their upload workflows.
- P&G SSO for admin login
- Consider a more scalable deployment than docker compose
- Security audit and penetrartion testing (after code has been refactored into real production-ready code).
- Certificate for public facing SSL/HTTPS.

## Quick Start

```bash
git clone https://github.com/boccileonardo/demo-uppy.git
make dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- OpenAPI Docs: http://localhost:8000/docs

The application comes with pre-created demo users:

| Email | Initial Password |
|-------|------------------|
| `demo@example.com` | `temporary123` |
| `admin@example.com` | `temporary123` |

Once finished, you can clean up with `make clean` command.
