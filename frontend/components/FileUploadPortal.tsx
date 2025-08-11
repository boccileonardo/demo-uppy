import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { 
  Upload, 
  LogOut, 
  User, 
  AlertCircle,
  Settings
} from 'lucide-react';
import { UppyFileUploader } from './UppyFileUploader';
import { Notification, LoadingSpinner, EmptyState, StatCard, FileItem } from './ui/common';
import { apiService } from '../services/api';
import { useNotification, useUploadStats, useLoading } from '../hooks';
import { formatFileSize, formatDate } from '../utils/helpers';
import { FILE_UPLOAD, STORAGE_INFO } from '../config/constants';
import type { UploadedFile, FileUploadPortalProps } from '../types';

export function FileUploadPortal({ user, onLogout }: FileUploadPortalProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const { notification, showNotification } = useNotification();
  const { stats, updateStats, incrementStats } = useUploadStats();
  const { isLoading, withLoading } = useLoading();

  // Load files on component mount
  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    return withLoading(async () => {
      const files = await apiService.listFiles();
      setUploadedFiles(files);
      updateStats(files);
    });
  };

  const handleUploadSuccess = (file: File, response: any) => {
    const newFile: UploadedFile = {
      id: response.id,
      filename: response.filename || file.name,
      size: response.size || file.size,
      content_type: response.content_type || file.type,
      uploaded_at: response.uploaded_at || new Date().toISOString(),
      status: 'success',
      url: response.url
    };
    
    setUploadedFiles(prev => [newFile, ...prev]);
    incrementStats('success', newFile.size);
    showNotification(`Successfully uploaded ${newFile.filename}`, 'success');
    console.log('File uploaded successfully:', newFile);
  };

  const handleUploadError = (file: File, error: Error) => {
    console.error('Upload error:', file.name, error);
    const newFile: UploadedFile = {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      filename: file.name,
      size: file.size,
      content_type: file.type,
      uploaded_at: new Date().toISOString(),
      status: 'error',
      url: ''
    };
    
    setUploadedFiles(prev => [newFile, ...prev]);
    incrementStats('failed');
    showNotification(`Failed to upload ${file.name}`, 'error');
  };

  const handleFileAdded = (file: File) => {
    console.log('File added:', file.name);
  };

  const handleUploadProgress = (file: File, progress: number) => {
    console.log('Upload progress:', file.name, progress);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Upload className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-xl">SecureUpload</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{user.name}</span>
              </div>
              {user.role === 'admin' && (
                <Link to="/admin">
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-1" />
                    Admin
                  </Button>
                </Link>
              )}
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:grid-rows-[1fr] lg:items-stretch">
          {/* Upload Section */}
          <div className="lg:col-span-2 flex flex-col">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="w-5 h-5 mr-2" />
                  File Upload
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UppyFileUploader
                  onFileAdded={handleFileAdded}
                  onUploadProgress={handleUploadProgress}
                  onUploadSuccess={handleUploadSuccess}
                  onUploadError={handleUploadError}
                  restrictions={{
                    maxFileSize: FILE_UPLOAD.MAX_FILE_SIZE,
                    maxNumberOfFiles: FILE_UPLOAD.MAX_FILES,
                    allowedFileTypes: [...FILE_UPLOAD.ALLOWED_TYPES]
                  }}
                  endpoint="/api/upload"
                />
              </CardContent>
            </Card>

            {/* Upload Guidelines */}
            <Card className="mt-6 flex-1">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Upload Guidelines & Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <h4 className="text-sm font-medium mb-3">Allowed File Types:</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Structured Data (CSV, JSON, TXT)</li>
                      <li>• Excel Spreadsheets (XLSX, XLS)</li>
                      <li>• XML Documents</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-3">Restrictions:</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Maximum file size: 100MB</li>
                      <li>• Maximum files per upload: 10</li>
                      <li>• Files are virus-scanned before storage</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-3">Security Features:</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• JWT-based authentication</li>
                      <li>• Local secure storage</li>
                      <li>• File type validation</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-3">Storage Details:</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Local filesystem storage</li>
                      <li>• Persistent file management</li>
                      <li>• Demo-ready configuration</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats & Files Sidebar */}
          <div className="flex flex-col space-y-6 h-full">
            {/* Upload Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <StatCard label="Total Uploads" value={stats.total} />
                  <StatCard 
                    label="Successful" 
                    value={stats.successful} 
                    variant="success" 
                  />
                  <StatCard 
                    label="Failed" 
                    value={stats.failed} 
                    variant="error" 
                  />
                </div>
              </CardContent>
            </Card>

            {/* Storage Info */}
            <Card>
              <CardHeader>
                <CardTitle>Storage Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Files Stored</span>
                    <span>{uploadedFiles.filter(f => f.status === 'success').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Size</span>
                    <span>
                      {formatFileSize(
                        uploadedFiles
                          .filter(f => f.status === 'success')
                          .reduce((total, file) => total + file.size, 0)
                      )}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Storage Account</span>
                    <span className="font-mono">{STORAGE_INFO.ACCOUNT_NAME}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Container Name</span>
                    <span className="font-mono">{STORAGE_INFO.CONTAINER_NAME}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Storage Location</span>
                    <span>{STORAGE_INFO.LOCATION}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Redundancy</span>
                    <span>{STORAGE_INFO.REDUNDANCY}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Files */}
            <Card className="flex-1">
              <CardHeader>
                <CardTitle>Recent Files</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {isLoading ? (
                    <LoadingSpinner />
                  ) : uploadedFiles.length === 0 ? (
                    <EmptyState
                      icon={Upload}
                      title="No files uploaded yet"
                      description="Start by uploading your first file"
                    />
                  ) : (
                    uploadedFiles.map((file, index) => (
                      <div key={`${file.id}-${index}`}>
                        <FileItem
                          filename={file.filename}
                          size={file.size}
                          uploadedAt={file.uploaded_at}
                          status={file.status}
                          formatFileSize={formatFileSize}
                          formatDate={formatDate}
                        />
                        {index < uploadedFiles.length - 1 && (
                          <Separator className="mt-3" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Notification */}
      <Notification notification={notification} />
    </div>
  );
}