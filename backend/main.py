"""
FastAPI backend for file upload demo application.
Provides authentication and file upload services with local storage.
"""

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime, timedelta
from typing import Optional, List
import os
import uuid
import bcrypt
from jose import jwt, JWTError
from pathlib import Path
import aiofiles
from pydantic import BaseModel

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "../data"))  # Store files in the configured upload directory
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///../data/demo_uploader.db")

# Create upload directory if it doesn't exist
UPLOAD_DIR.mkdir(exist_ok=True)

# Database setup
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    password_hash = Column(String)
    is_first_login = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class UploadedFile(Base):
    __tablename__ = "uploaded_files"
    
    id = Column(String, primary_key=True, index=True)
    filename = Column(String)
    original_filename = Column(String)
    file_size = Column(Integer)
    content_type = Column(String)
    file_path = Column(String)
    user_email = Column(String)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="success")

# Create tables
Base.metadata.create_all(bind=engine)

# Pydantic models
class UserLogin(BaseModel):
    email: str
    password: str

class UserSetPassword(BaseModel):
    email: str
    new_password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class FileUploadResponse(BaseModel):
    id: str
    filename: str
    size: int
    content_type: str
    url: str
    uploaded_at: datetime

# FastAPI app
app = FastAPI(title="Demo Uploader API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Password utilities
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

# JWT utilities
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return email
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Initialize demo users
def init_demo_users(db: Session):
    demo_users = [
        {"email": "demo@example.com", "name": "Demo User"},
        {"email": "admin@example.com", "name": "Admin User"},
        {"email": "test@example.com", "name": "Test User"},
    ]
    
    for user_data in demo_users:
        existing_user = db.query(User).filter(User.email == user_data["email"]).first()
        if not existing_user:
            user = User(
                email=user_data["email"],
                name=user_data["name"],
                password_hash=hash_password("temporary123"),  # Temporary password
                is_first_login=True
            )
            db.add(user)
    db.commit()

# Initialize demo users on startup
@app.on_event("startup")
async def startup_event():
    db = SessionLocal()
    try:
        init_demo_users(db)
    finally:
        db.close()

# Routes
@app.get("/")
async def root():
    return {"message": "Demo Uploader API", "version": "1.0.0"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.post("/api/auth/login", response_model=Token)
async def login(user_login: UserLogin, db: Session = Depends(get_db)):
    # Find user
    user = db.query(User).filter(User.email == user_login.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Check if first login (needs password setup)
    if user.is_first_login:
        # Verify the temporary password
        if not verify_password(user_login.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        return {
            "access_token": "",
            "token_type": "bearer",
            "user": {"email": user.email, "name": user.name, "needs_password_setup": True}
        }
    
    # Verify password
    if not verify_password(user_login.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create access token
    access_token = create_access_token(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"email": user.email, "name": user.name, "needs_password_setup": False}
    }

@app.post("/api/auth/set-password", response_model=Token)
async def set_password(user_password: UserSetPassword, db: Session = Depends(get_db)):
    # Find user
    user = db.query(User).filter(User.email == user_password.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update password
    user.password_hash = hash_password(user_password.new_password)
    user.is_first_login = False
    db.commit()
    
    # Create access token
    access_token = create_access_token(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"email": user.email, "name": user.name, "needs_password_setup": False}
    }

@app.post("/api/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    email: str = Depends(verify_token),
    db: Session = Depends(get_db)
):
    # Validate file type (structured data files)
    allowed_types = {
        'text/csv', 'application/json', 'text/plain',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/xml', 'text/xml'
    }
    
    if file.content_type not in allowed_types and not any(
        file.filename.lower().endswith(ext) for ext in ['.csv', '.json', '.txt', '.xlsx', '.xls', '.xml']
    ):
        raise HTTPException(
            status_code=400, 
            detail="File type not allowed. Please upload structured data files (CSV, JSON, TXT, Excel, XML)"
        )
    
    # Validate file size (100MB limit)
    content = await file.read()
    if len(content) > 100 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 100MB limit")
    
    # Generate unique filename
    file_id = str(uuid.uuid4())
    file_extension = Path(file.filename).suffix
    filename = f"{file_id}{file_extension}"
    file_path = UPLOAD_DIR / filename
    
    # Save file
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(content)
    
    # Save to database
    uploaded_file = UploadedFile(
        id=file_id,
        filename=filename,
        original_filename=file.filename,
        file_size=len(content),
        content_type=file.content_type,
        file_path=str(file_path),
        user_email=email,
        status="success"
    )
    db.add(uploaded_file)
    db.commit()
    
    return FileUploadResponse(
        id=file_id,
        filename=file.filename,
        size=len(content),
        content_type=file.content_type,
        url=f"/api/files/{file_id}",
        uploaded_at=uploaded_file.uploaded_at
    )

@app.get("/api/files")
async def list_files(
    email: str = Depends(verify_token),
    db: Session = Depends(get_db)
):
    files = db.query(UploadedFile).filter(UploadedFile.user_email == email).all()
    return [
        {
            "id": f.id,
            "filename": f.original_filename,
            "size": f.file_size,
            "content_type": f.content_type,
            "uploaded_at": f.uploaded_at,
            "status": f.status,
            "url": f"/api/files/{f.id}"
        }
        for f in files
    ]



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
