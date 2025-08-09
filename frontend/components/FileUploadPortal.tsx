import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { 
  Upload, 
  LogOut, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Download,
  Trash2
} from 'lucide-react';
import { UppyFileUploader } from './UppyFileUploader';
import { apiService, UploadedFile } from '../services/api';

interface User {
  email: string;
  name: string;
}

interface FileUploadPortalProps {
  user: User;
  onLogout: () => void;
}

export function FileUploadPortal({ user, onLogout }: FileUploadPortalProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadStats, setUploadStats] = useState({
    total: 0,
    successful: 0,
    failed: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load files on component mount
  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setIsLoading(true);
      const files = await apiService.listFiles();
      setUploadedFiles(files);
      updateStats(files);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStats = (files: UploadedFile[]) => {
    const successful = files.filter(f => f.status === 'success').length;
    const failed = files.filter(f => f.status === 'error').length;
    setUploadStats({
      total: files.length,
      successful,
      failed
    });
  };

  const handleFileAdded = (file: File) => {
    console.log('File added:', file.name);
  };

  const handleUploadProgress = (file: File, progress: number) => {
    console.log('Upload progress:', file.name, progress);
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
    setUploadStats(prev => ({
      ...prev,
      total: prev.total + 1,
      successful: prev.successful + 1
    }));
    
    console.log('File uploaded successfully:', newFile);
  };

  const handleUploadError = (file: File, error: Error) => {
    const newFile: UploadedFile = {
      id: Math.random().toString(),
      filename: file.name,
      size: file.size,
      content_type: file.type,
      uploaded_at: new Date().toISOString(),
      status: 'error',
      url: ''
    };
    
    setUploadedFiles(prev => [newFile, ...prev]);
    setUploadStats(prev => ({
      ...prev,
      total: prev.total + 1,
      failed: prev.failed + 1
    }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const deleteFile = async (fileId: string) => {
    try {
      await apiService.deleteFile(fileId);
      setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
      setUploadStats(prev => ({
        ...prev,
        total: prev.total - 1,
        successful: prev.successful - 1
      }));
    } catch (error) {
      console.error('Failed to delete file:', error);
      alert('Failed to delete file');
    }
  };

  const downloadFile = async (fileId: string) => {
    try {
      await apiService.downloadFile(fileId);
    } catch (error) {
      console.error('Failed to download file:', error);
      alert('Failed to download file');
    }
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
                    maxFileSize: 100 * 1024 * 1024, // 100MB
                    maxNumberOfFiles: 10,
                    allowedFileTypes: [
                      'text/csv',
                      'application/json', 
                      'text/plain',
                      '.csv',
                      '.json',
                      '.txt',
                      '.xlsx',
                      '.xls',
                      '.xml'
                    ]
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
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Uploads</span>
                    <Badge variant="secondary">{uploadStats.total}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Successful</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {uploadStats.successful}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Failed</span>
                    <Badge variant="destructive" className="bg-red-500 text-white">
                      {uploadStats.failed}
                    </Badge>
                  </div>
                  {uploadStats.total > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Success Rate</span>
                        <span>{Math.round((uploadStats.successful / uploadStats.total) * 100)}%</span>
                      </div>
                      <Progress 
                        value={(uploadStats.successful / uploadStats.total) * 100} 
                        className="h-2"
                      />
                    </div>
                  )}
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
                    <span className="font-mono">secureuploadsa01</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Container Name</span>
                    <span className="font-mono">user-uploads</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Storage Location</span>
                    <span>Azure West US 2</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Redundancy</span>
                    <span>Geo-redundant</span>
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
                  {uploadedFiles.length === 0 ? (
                    <div className="text-center py-8">
                      <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No files uploaded yet</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Start by uploading your first file
                      </p>
                    </div>
                  ) : (
                    uploadedFiles.map((file, index) => (
                      <div key={file.id}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-2 flex-1 min-w-0">
                            <div className="flex-shrink-0 mt-1">
                              {file.status === 'success' ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate" title={file.filename}>
                                {file.filename}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(file.size)} • {new Date(file.uploaded_at).toLocaleDateString()}
                              </p>
                              {file.status === 'success' && file.url && (
                                <div className="flex items-center space-x-2 mt-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 px-2 text-xs"
                                    onClick={() => downloadFile(file.id)}
                                  >
                                    <Download className="w-3 h-3 mr-1" />
                                    Download
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                                    onClick={() => deleteFile(file.id)}
                                  >
                                    <Trash2 className="w-3 h-3 mr-1" />
                                    Delete
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
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
    </div>
  );
}