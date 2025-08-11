"""
FastAPI backend for file upload demo application.
Provides authentication and file upload services with local storage.
"""

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Text, func, or_
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
    role = Column(String, default="user")  # user or admin
    is_active = Column(Boolean, default=True)
    is_first_login = Column(Boolean, default=True)
    storage_account = Column(String, default="secureuploadsa01")
    container = Column(String, default="user-uploads")
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

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

class StorageAccount(Base):
    __tablename__ = "storage_accounts"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    connection_string = Column(Text)
    location = Column(String)
    redundancy = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Container(Base):
    __tablename__ = "containers"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    account_id = Column(String)
    access_level = Column(String, default="private")
    created_at = Column(DateTime, default=datetime.utcnow)

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String)
    action = Column(String)
    details = Column(Text, nullable=True)
    status = Column(String)  # success, error, info
    created_at = Column(DateTime, default=datetime.utcnow)

# Create tables
Base.metadata.create_all(bind=engine)

# Pydantic models
class UserLogin(BaseModel):
    email: str
    password: str

class UserSetPassword(BaseModel):
    email: str
    new_password: str

class UserCreate(BaseModel):
    email: str
    name: str
    role: str = "user"
    storage_account: str = "secureuploadsa01"
    container: str = "user-uploads"

class UserUpdate(BaseModel):
    email: str
    name: str
    role: str
    storage_account: str
    container: str
    is_active: bool

class StorageAccountCreate(BaseModel):
    name: str
    connection_string: str
    location: str
    redundancy: str

class StorageAccountUpdate(BaseModel):
    name: str
    connection_string: str
    location: str
    redundancy: str
    is_active: bool

class ContainerCreate(BaseModel):
    name: str
    account_id: str

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

class AdminStats(BaseModel):
    total_users: int
    active_users: int
    inactive_users: int
    total_uploads: int
    successful_uploads: int
    failed_uploads: int
    storage_used: str

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

def generate_readable_password() -> str:
    """Generate a human-readable temporary password"""
    import random
    
    adjectives = [
        "Swift", "Bright", "Clear", "Smart", "Quick", "Fresh", "Bold", "Clean",
        "Sharp", "Cool", "Fast", "Calm", "Strong", "Safe", "Blue", "Green"
    ]
    
    nouns = [
        "River", "Mountain", "Ocean", "Forest", "Cloud", "Star", "Moon", "Sun",
        "Bridge", "Tower", "Garden", "Valley", "Harbor", "Castle", "Island", "Peak"
    ]
    
    # Format: Adjective + Noun + 3 digits
    adjective = random.choice(adjectives)
    noun = random.choice(nouns)
    number = random.randint(100, 999)
    
    return f"{adjective}{noun}{number}"

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

def verify_admin_token(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    email = verify_token(credentials)
    user = db.query(User).filter(User.email == email).first()
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return email

def log_activity(db: Session, user_email: str, action: str, status: str = "info", details: Optional[str] = None):
    """Log user activity for admin monitoring"""
    activity = ActivityLog(
        user_email=user_email,
        action=action,
        details=details,
        status=status
    )
    db.add(activity)
    db.commit()

# Initialize demo users and storage accounts
def init_demo_data(db: Session):
    # Demo users
    demo_users = [
        {"email": "demo@example.com", "name": "Demo User", "role": "user"},
        {"email": "admin@example.com", "name": "Admin User", "role": "admin"},
        {"email": "test@example.com", "name": "Test User", "role": "user"},
    ]
    
    for user_data in demo_users:
        existing_user = db.query(User).filter(User.email == user_data["email"]).first()
        if not existing_user:
            user = User(
                email=user_data["email"],
                name=user_data["name"],
                role=user_data["role"],
                password_hash=hash_password(generate_readable_password()),  # Use readable password
                is_first_login=True,
                storage_account="secureuploadsa01",
                container="user-uploads" if user_data["role"] == "user" else "admin-uploads"
            )
            db.add(user)
    
    # Demo storage accounts
    demo_storage_accounts = [
        {
            "id": "sa1",
            "name": "secureuploadsa01",
            "connection_string": "DefaultEndpointsProtocol=https;AccountName=secureuploadsa01;AccountKey=***",
            "location": "West US 2",
            "redundancy": "GRS"
        },
        {
            "id": "sa2", 
            "name": "secureuploadsa02",
            "connection_string": "DefaultEndpointsProtocol=https;AccountName=secureuploadsa02;AccountKey=***",
            "location": "East US",
            "redundancy": "LRS"
        }
    ]
    
    for account_data in demo_storage_accounts:
        existing_account = db.query(StorageAccount).filter(StorageAccount.id == account_data["id"]).first()
        if not existing_account:
            account = StorageAccount(
                id=account_data["id"],
                name=account_data["name"],
                connection_string=account_data["connection_string"],
                location=account_data["location"],
                redundancy=account_data["redundancy"]
            )
            db.add(account)
    
    # Demo containers
    demo_containers = [
        {"id": "c1", "name": "user-uploads", "account_id": "sa1"},
        {"id": "c2", "name": "admin-uploads", "account_id": "sa1"},
        {"id": "c3", "name": "backup-uploads", "account_id": "sa2"},
        {"id": "c4", "name": "temp-uploads", "account_id": "sa1"},
    ]
    
    for container_data in demo_containers:
        existing_container = db.query(Container).filter(Container.id == container_data["id"]).first()
        if not existing_container:
            container = Container(
                id=container_data["id"],
                name=container_data["name"],
                account_id=container_data["account_id"]
            )
            db.add(container)
    
    db.commit()

# Initialize demo users on startup
@app.on_event("startup")
async def startup_event():
    db = SessionLocal()
    try:
        init_demo_data(db)
    finally:
        db.close()

# Routes
@app.get("/")
async def root():
    return {"message": "Demo Uploader API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat() + "Z"}

@app.post("/api/auth/login", response_model=Token)
async def login(user_login: UserLogin, db: Session = Depends(get_db)):
    # Find user
    user = db.query(User).filter(User.email == user_login.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Check if user is active
    if not user.is_active:
        log_activity(db, user.email, "Login failed", "error", "Account is inactive")
        raise HTTPException(status_code=401, detail="Account is inactive. Please contact an administrator.")
    
    # Check if first login (needs password setup)
    if user.is_first_login:
        # Verify the temporary password
        if not verify_password(user_login.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        return {
            "access_token": "",
            "token_type": "bearer",
            "user": {"email": user.email, "name": user.name, "role": user.role, "needs_password_setup": True}
        }
    
    # Verify password
    if not verify_password(user_login.password, user.password_hash):
        log_activity(db, user.email, "Login failed", "error", "Invalid password")
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Log successful login
    log_activity(db, user.email, "Login successful", "success")
    
    # Create access token
    access_token = create_access_token(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"email": user.email, "name": user.name, "role": user.role, "needs_password_setup": False}
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
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Log password change
    log_activity(db, user.email, "Password changed", "info")
    
    # Create access token
    access_token = create_access_token(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"email": user.email, "name": user.name, "role": user.role, "needs_password_setup": False}
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
    
    # Log upload activity
    log_activity(db, email, "File uploaded", "success", f"Uploaded {file.filename} ({len(content)} bytes)")
    
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

# Admin API Endpoints
@app.get("/api/admin/stats", response_model=AdminStats)
async def get_admin_stats(
    admin_email: str = Depends(verify_admin_token),
    db: Session = Depends(get_db)
):
    """Get admin dashboard statistics"""
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    inactive_users = total_users - active_users
    
    total_uploads = db.query(UploadedFile).count()
    successful_uploads = db.query(UploadedFile).filter(UploadedFile.status == "success").count()
    failed_uploads = total_uploads - successful_uploads
    
    # Calculate total storage used
    total_size = db.query(UploadedFile).with_entities(
        func.sum(UploadedFile.file_size)
    ).scalar() or 0
    
    # Convert bytes to readable format
    if total_size > 1024**3:  # GB
        storage_used = f"{total_size / (1024**3):.1f} GB"
    elif total_size > 1024**2:  # MB
        storage_used = f"{total_size / (1024**2):.1f} MB"
    else:  # KB
        storage_used = f"{total_size / 1024:.1f} KB"
    
    return AdminStats(
        total_users=total_users,
        active_users=active_users,
        inactive_users=inactive_users,
        total_uploads=total_uploads,
        successful_uploads=successful_uploads,
        failed_uploads=failed_uploads,
        storage_used=storage_used
    )

@app.get("/api/admin/activity")
async def get_recent_activity(
    admin_email: str = Depends(verify_admin_token),
    db: Session = Depends(get_db),
    limit: int = 20
):
    """Get recent activity feed for admin dashboard"""
    activities = db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(limit).all()
    
    return [
        {
            "id": activity.id,
            "user": activity.user_email,
            "action": activity.action,
            "time": activity.created_at.isoformat() + "Z",  # Add Z to indicate UTC
            "status": activity.status,
            "details": activity.details
        }
        for activity in activities
    ]

@app.get("/api/admin/users")
async def get_users(
    admin_email: str = Depends(verify_admin_token),
    db: Session = Depends(get_db),
    search: str = "",
    page: int = 1,
    limit: int = 50
):
    """Get all users with optional search and pagination"""
    query = db.query(User)
    
    if search:
        query = query.filter(
            or_(
                User.email.contains(search),
                User.name.contains(search)
            )
        )
    
    total = query.count()
    users = query.offset((page - 1) * limit).limit(limit).all()
    
    return {
        "users": [
            {
                "id": str(user.id),
                "email": user.email,
                "name": user.name,
                "role": user.role,
                "isActive": user.is_active,
                "createdAt": user.created_at.isoformat() + "Z" if user.created_at else None,
                "lastLogin": user.last_login.isoformat() + "Z" if user.last_login else None,
                "storageAccount": user.storage_account,
                "container": user.container
            }
            for user in users
        ],
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@app.post("/api/admin/users")
async def create_user(
    user_data: UserCreate,
    admin_email: str = Depends(verify_admin_token),
    db: Session = Depends(get_db)
):
    """Create a new user"""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    # Generate readable temporary password
    temp_password = generate_readable_password()
    
    # Create new user
    new_user = User(
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        storage_account=user_data.storage_account,
        container=user_data.container,
        password_hash=hash_password(temp_password),
        is_first_login=True
    )
    
    db.add(new_user)
    db.commit()
    
    # Log activity
    log_activity(db, admin_email, "User created", "info", f"Created user {user_data.email}")
    
    return {
        "id": str(new_user.id),
        "email": new_user.email,
        "name": new_user.name,
        "role": new_user.role,
        "isActive": new_user.is_active,
        "createdAt": new_user.created_at.isoformat() + "Z" if new_user.created_at else None,
        "lastLogin": new_user.last_login.isoformat() + "Z" if new_user.last_login else None,
        "storageAccount": new_user.storage_account,
        "container": new_user.container,
        "temporaryPassword": temp_password  # Include the temporary password in response
    }

@app.put("/api/admin/users/{user_id}")
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    admin_email: str = Depends(verify_admin_token),
    db: Session = Depends(get_db)
):
    """Update an existing user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update user fields
    user.email = user_data.email
    user.name = user_data.name
    user.role = user_data.role
    user.storage_account = user_data.storage_account
    user.container = user_data.container
    user.is_active = user_data.is_active
    
    db.commit()
    
    # Log activity
    log_activity(db, admin_email, "User updated", "info", f"Updated user {user_data.email}")
    
    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "isActive": user.is_active,
        "createdAt": user.created_at,
        "lastLogin": user.last_login,
        "storageAccount": user.storage_account,
        "container": user.container
    }

@app.delete("/api/admin/users/{user_id}")
async def delete_user(
    user_id: int,
    admin_email: str = Depends(verify_admin_token),
    db: Session = Depends(get_db)
):
    """Delete a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Don't allow deletion of admin users
    if user.role == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete admin users")
    
    user_email = user.email
    db.delete(user)
    db.commit()
    
    # Log activity
    log_activity(db, admin_email, "User deleted", "info", f"Deleted user {user_email}")
    
    return {"message": "User deleted successfully"}

@app.patch("/api/admin/users/{user_id}/toggle")
async def toggle_user_status(
    user_id: int,
    admin_email: str = Depends(verify_admin_token),
    db: Session = Depends(get_db)
):
    """Toggle user active status"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = not user.is_active
    db.commit()
    
    status = "activated" if user.is_active else "deactivated"
    log_activity(db, admin_email, f"User {status}", "info", f"{status.capitalize()} user {user.email}")
    
    return {
        "id": str(user.id),
        "email": user.email,
        "isActive": user.is_active
    }

# Storage Account Management
@app.get("/api/admin/storage-accounts")
async def get_storage_accounts(
    admin_email: str = Depends(verify_admin_token),
    db: Session = Depends(get_db)
):
    """Get all storage accounts with their containers"""
    accounts = db.query(StorageAccount).all()
    
    result = []
    for account in accounts:
        containers = db.query(Container).filter(Container.account_id == account.id).all()
        
        # Mock container statistics (in real implementation, you'd get this from Azure API)
        container_data = []
        for container in containers:
            file_count = db.query(UploadedFile).filter(
                UploadedFile.user_email.in_(
                    db.query(User.email).filter(User.container == container.name)
                )
            ).count()
            
            total_size = db.query(UploadedFile).filter(
                UploadedFile.user_email.in_(
                    db.query(User.email).filter(User.container == container.name)
                )
            ).with_entities(func.sum(UploadedFile.file_size)).scalar() or 0
            
            size_str = f"{total_size / (1024**2):.1f} MB" if total_size > 0 else "0 MB"
            
            container_data.append({
                "id": container.id,
                "name": container.name,
                "accessLevel": container.access_level,
                "size": size_str,
                "files": file_count,
                "lastModified": container.created_at
            })
        
        result.append({
            "id": account.id,
            "name": account.name,
            "connectionString": account.connection_string,
            "location": account.location,
            "redundancy": account.redundancy,
            "isActive": account.is_active,
            "createdAt": account.created_at,
            "containers": container_data
        })
    
    return result

@app.post("/api/admin/storage-accounts")
async def create_storage_account(
    account_data: StorageAccountCreate,
    admin_email: str = Depends(verify_admin_token),
    db: Session = Depends(get_db)
):
    """Create a new storage account"""
    # Check if account already exists
    existing_account = db.query(StorageAccount).filter(StorageAccount.name == account_data.name).first()
    if existing_account:
        raise HTTPException(status_code=400, detail="Storage account with this name already exists")
    
    # Create new storage account
    account_id = str(uuid.uuid4())
    new_account = StorageAccount(
        id=account_id,
        name=account_data.name,
        connection_string=account_data.connection_string,
        location=account_data.location,
        redundancy=account_data.redundancy
    )
    
    db.add(new_account)
    db.commit()
    
    # Log activity
    log_activity(db, admin_email, "Storage account created", "info", f"Created storage account {account_data.name}")
    
    return {
        "id": new_account.id,
        "name": new_account.name,
        "connectionString": new_account.connection_string,
        "location": new_account.location,
        "redundancy": new_account.redundancy,
        "isActive": new_account.is_active,
        "createdAt": new_account.created_at,
        "containers": []
    }

@app.put("/api/admin/storage-accounts/{account_id}")
async def update_storage_account(
    account_id: str,
    account_data: StorageAccountUpdate,
    admin_email: str = Depends(verify_admin_token),
    db: Session = Depends(get_db)
):
    """Update a storage account"""
    account = db.query(StorageAccount).filter(StorageAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Storage account not found")
    
    # Update account fields
    account.name = account_data.name
    account.connection_string = account_data.connection_string
    account.location = account_data.location
    account.redundancy = account_data.redundancy
    account.is_active = account_data.is_active
    
    db.commit()
    
    # Log activity
    log_activity(db, admin_email, "Storage account updated", "info", f"Updated storage account {account_data.name}")
    
    return {
        "id": account.id,
        "name": account.name,
        "connectionString": account.connection_string,
        "location": account.location,
        "redundancy": account.redundancy,
        "isActive": account.is_active,
        "createdAt": account.created_at
    }

@app.delete("/api/admin/storage-accounts/{account_id}")
async def delete_storage_account(
    account_id: str,
    admin_email: str = Depends(verify_admin_token),
    db: Session = Depends(get_db)
):
    """Delete a storage account"""
    account = db.query(StorageAccount).filter(StorageAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Storage account not found")
    
    # Check if any users are using this storage account
    users_count = db.query(User).filter(User.storage_account == account.name).count()
    if users_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete storage account. {users_count} users are still using it."
        )
    
    account_name = account.name
    
    # Delete associated containers
    db.query(Container).filter(Container.account_id == account_id).delete()
    
    # Delete the account
    db.delete(account)
    db.commit()
    
    # Log activity
    log_activity(db, admin_email, "Storage account deleted", "info", f"Deleted storage account {account_name}")
    
    return {"message": "Storage account deleted successfully"}

@app.post("/api/admin/containers")
async def create_container(
    container_data: ContainerCreate,
    admin_email: str = Depends(verify_admin_token),
    db: Session = Depends(get_db)
):
    """Create a new container"""
    # Check if account exists
    account = db.query(StorageAccount).filter(StorageAccount.id == container_data.account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Storage account not found")
    
    # Check if container already exists in this account
    existing_container = db.query(Container).filter(
        Container.name == container_data.name,
        Container.account_id == container_data.account_id
    ).first()
    if existing_container:
        raise HTTPException(status_code=400, detail="Container with this name already exists in this account")
    
    # Create new container
    container_id = str(uuid.uuid4())
    new_container = Container(
        id=container_id,
        name=container_data.name,
        account_id=container_data.account_id
    )
    
    db.add(new_container)
    db.commit()
    
    # Log activity
    log_activity(db, admin_email, "Container created", "info", f"Created container {container_data.name}")
    
    return {
        "id": new_container.id,
        "name": new_container.name,
        "accessLevel": new_container.access_level,
        "size": "0 MB",
        "files": 0,
        "lastModified": new_container.created_at
    }

@app.delete("/api/admin/containers/{container_id}")
async def delete_container(
    container_id: str,
    admin_email: str = Depends(verify_admin_token),
    db: Session = Depends(get_db)
):
    """Delete a container"""
    container = db.query(Container).filter(Container.id == container_id).first()
    if not container:
        raise HTTPException(status_code=404, detail="Container not found")
    
    # Check if any users are using this container
    users_count = db.query(User).filter(User.container == container.name).count()
    if users_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete container. {users_count} users are still using it."
        )
    
    container_name = container.name
    db.delete(container)
    db.commit()
    
    # Log activity
    log_activity(db, admin_email, "Container deleted", "info", f"Deleted container {container_name}")
    
    return {"message": "Container deleted successfully"}



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
