# Demo Uploader - File Upload Application

A full-stack file upload demo application with React frontend and FastAPI backend, featuring user authentication and local file storage.

## Features

- ✅ **User Authentication**: Pre-created user accounts with first-time password setup
- ✅ **File Upload**: Drag & drop or click to upload structured data files (CSV, JSON, TXT, Excel, XML)
- ✅ **File Management**: View, download, and delete uploaded files
- ✅ **Progress Tracking**: Real-time upload progress indicators
- ✅ **File Validation**: Type and size validation (100MB limit)
- ✅ **Local Storage**: Files stored locally instead of Azure (for demo purposes)
- ✅ **Beautiful UI**: Modern, responsive design with Tailwind CSS

## Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Python + FastAPI + SQLite + SQLAlchemy
- **Authentication**: JWT tokens with bcrypt password hashing
- **File Storage**: Local filesystem (easily replaceable with Azure Blob Storage)

## Quick Start

### Prerequisites

- Python 3.12+ with `uv` package manager installed
- Node.js 18+ with npm

### 1. Start the Backend Server

```bash
cd backend
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Or use the convenience script:**
```bash
./start-backend.sh
```

The backend will be available at: `http://localhost:8000`

### 2. Start the Frontend Server

```bash
npm install  # Only needed first time
npm run dev
```

**Or use the convenience script:**
```bash
./start-frontend.sh
```

The frontend will be available at: `http://localhost:3000` (or next available port)

## Demo Users

The application comes with pre-created demo users:

| Email | Initial Password | Notes |
|-------|------------------|-------|
| `demo@example.com` | `temporary123` | Will be prompted to set new password on first login |
| `admin@example.com` | `temporary123` | Will be prompted to set new password on first login |
| `test@example.com` | `temporary123` | Will be prompted to set new password on first login |

## API Documentation

Once the backend is running, visit `http://localhost:8000/docs` for interactive API documentation (Swagger UI).

### Key Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/set-password` - First-time password setup
- `POST /api/upload` - File upload
- `GET /api/files` - List user's files
- `GET /api/files/{file_id}` - Download file
- `DELETE /api/files/{file_id}` - Delete file

## File Upload Restrictions

- **Allowed Types**: CSV, JSON, TXT, Excel (.xlsx, .xls), XML
- **Maximum Size**: 100MB per file
- **Maximum Files**: 10 files per upload session

## Project Structure

```
demo-uploader/
├── backend/                 # FastAPI backend
│   ├── main.py             # Main application file
│   ├── demo_uploader.db    # SQLite database
│   └── uploads/            # Uploaded files directory
├── components/             # React components
│   ├── AuthSection.tsx     # Login/password setup
│   ├── FileUploadPortal.tsx # Main upload interface
│   ├── UppyFileUploader.tsx # File upload component
│   └── ui/                 # shadcn/ui components
├── services/
│   └── api.ts              # API service layer
├── styles/
│   └── globals.css         # Global styles
└── package.json            # Frontend dependencies
```

## Development

### Backend Development

The backend uses:
- **FastAPI** for the web framework
- **SQLAlchemy** for database ORM
- **SQLite** for the database
- **JWT** for authentication
- **bcrypt** for password hashing
- **aiofiles** for async file operations

Database tables are automatically created on startup.

### Frontend Development

The frontend uses:
- **React 18** with TypeScript
- **Vite** for development and building
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **Lucide React** for icons

The frontend automatically proxies API requests to the backend.

## Deployment Notes

For production deployment:

1. **Backend**:
   - Change the `SECRET_KEY` in `main.py`
   - Use a production WSGI server (Gunicorn)
   - Consider using PostgreSQL instead of SQLite
   - Set up proper CORS origins
   - Configure Azure Blob Storage if needed

2. **Frontend**:
   - Build with `npm run build`
   - Serve the `dist` folder with a web server
   - Update API base URL in production

## Troubleshooting

### Common Issues

1. **Port conflicts**: If ports 3000 or 8000 are in use, the servers will try alternative ports
2. **Missing dependencies**: Run `npm install` and ensure `uv` is installed
3. **Database issues**: Delete `backend/demo_uploader.db` to reset the database
4. **CORS errors**: Ensure the backend is running and CORS is configured correctly

### Logs

- Backend logs appear in the terminal where you started the FastAPI server
- Frontend logs appear in the browser console
- Upload files are stored in `backend/uploads/`

## License

This is a demo application. Feel free to use and modify as needed.
