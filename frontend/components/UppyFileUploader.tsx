import React, { useEffect, useRef } from 'react';
import { apiService } from '../services/api';

// Real file uploader that connects to the FastAPI backend

interface CustomFile extends File {
  id: string;
  progress?: number;
  error?: string;
}

interface UppyFileUploaderProps {
  onFileAdded?: (file: File) => void;
  onUploadProgress?: (file: File, progress: number) => void;
  onUploadSuccess?: (file: File, response: any) => void;
  onUploadError?: (file: File, error: Error) => void;
  restrictions?: {
    maxFileSize?: number;
    maxNumberOfFiles?: number;
    allowedFileTypes?: string[];
  };
  endpoint?: string;
  headers?: Record<string, string>;
}

export function UppyFileUploader({
  onFileAdded,
  onUploadProgress,
  onUploadSuccess,
  onUploadError,
  restrictions = {},
  endpoint = '/api/upload',
  headers = {}
}: UppyFileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = React.useState<CustomFile[]>([]);
  const [dragActive, setDragActive] = React.useState(false);

  const {
    maxFileSize = 100 * 1024 * 1024, // 100MB
    maxNumberOfFiles = 10,
    allowedFileTypes = ['image/*', 'application/pdf', '.doc', '.docx', '.txt', '.zip', '.rar']
  } = restrictions;

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File size exceeds ${Math.round(maxFileSize / (1024 * 1024))}MB limit`;
    }

    if (allowedFileTypes.length > 0) {
      const isAllowed = allowedFileTypes.some(type => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        if (type.includes('*')) {
          const baseType = type.split('/')[0];
          return file.type.startsWith(baseType);
        }
        return file.type === type;
      });

      if (!isAllowed) {
        return 'File type not allowed';
      }
    }

    return null;
  };

  const uploadFile = async (file: CustomFile) => {
    try {
      const result = await apiService.uploadFile(file, (progress) => {
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { ...f, progress }
            : f
        ));
        onUploadProgress?.(file, progress);
      });

      setFiles(prev => prev.map(f => 
        f.id === file.id 
          ? { ...f, progress: 100 }
          : f
      ));
      
      onUploadSuccess?.(file, result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setFiles(prev => prev.map(f => 
        f.id === file.id 
          ? { ...f, error: errorMessage }
          : f
      ));
      onUploadError?.(file, error instanceof Error ? error : new Error(errorMessage));
    }
  };

  const handleFiles = (fileList: FileList) => {
    const newFiles = Array.from(fileList).map(file => ({
      ...file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0
    }));

    const validFiles: CustomFile[] = [];
    const errors: string[] = [];

    for (const file of newFiles) {
      if (files.length + validFiles.length >= maxNumberOfFiles) {
        errors.push(`Maximum ${maxNumberOfFiles} files allowed`);
        break;
      }

      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
        onFileAdded?.(file);
      }
    }

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const uploadAll = () => {
    files.forEach(file => {
      if (file.progress === undefined || file.progress === 0) {
        uploadFile(file);
      }
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          accept={allowedFileTypes.join(',')}
        />
        
        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          
          <div>
            <p className="text-lg text-gray-900">
              Drop files here or <span className="text-blue-600 underline">browse</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Max {Math.round(maxFileSize / (1024 * 1024))}MB per file • Up to {maxNumberOfFiles} files
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg">Files ({files.length})</h3>
            <button
              onClick={uploadAll}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={files.every(f => f.progress !== undefined && f.progress > 0)}
            >
              Upload All
            </button>
          </div>

          <div className="space-y-3">
            {files.map((file) => (
              <div key={file.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {file.progress !== undefined && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>
                        {file.error ? 'Failed' : file.progress === 100 ? 'Complete' : 'Uploading...'}
                      </span>
                      <span>{Math.round(file.progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          file.error ? 'bg-red-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${file.progress}%` }}
                      ></div>
                    </div>
                    {file.error && (
                      <p className="text-xs text-red-600 mt-1">{file.error}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guidelines */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Upload Guidelines:</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Maximum file size: {Math.round(maxFileSize / (1024 * 1024))}MB</li>
          <li>• Maximum {maxNumberOfFiles} files per upload</li>
          <li>• Allowed types: {allowedFileTypes.join(', ')}</li>
          <li>• Files are uploaded to Azure Blob Storage</li>
        </ul>
      </div>
    </div>
  );
}