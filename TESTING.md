# Testing Guide

## Quick Demo Test

1. **Start both servers** (see main README.md for instructions)

2. **Open the application** at http://localhost:3000 (or the port shown in your terminal)

3. **Test Authentication**:
   - Try logging in with `demo@example.com` and password `temporary123`
   - You should be prompted to set a new password
   - Set a new password (minimum 6 characters)
   - You should be logged in and see the file upload interface

4. **Test File Upload**:
   - Create a simple CSV file with some data (or use any .txt, .json, .csv file)
   - Drag and drop it into the upload area OR click "Browse Files"
   - Watch the upload progress
   - The file should appear in the "Recent Uploads" section

5. **Test File Management**:
   - Click "Download" to download the file
   - Click "Delete" to remove the file
   - Refresh the page - your files should persist

6. **Test File Validation**:
   - Try uploading a non-allowed file type (e.g., .exe, .mp3)
   - You should see an error message
   - Try uploading a very large file (>100MB) - you should see a size error

## Manual API Testing

You can also test the API directly:

1. **Visit API docs**: http://localhost:8000/docs
2. **Test login**:
   ```bash
   curl -X POST "http://localhost:8000/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email": "demo@example.com", "password": "temporary123"}'
   ```

## Troubleshooting

- If login fails, check the backend logs for error messages
- If file upload fails, check that the `backend/uploads/` directory exists and is writable
- If the frontend won't start, ensure all dependencies are installed with `npm install`
