import { useEffect, useRef } from 'react';
import Uppy from '@uppy/core';
import Dashboard from '@uppy/dashboard';
import XHRUpload from '@uppy/xhr-upload';
import { apiService } from '../services/api';
import { API_CONFIG, FILE_UPLOAD } from '../config/constants';

// Import Uppy styles
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';

// Add custom CSS to ensure Uppy styles are not overridden
const uppyCustomStyles = `
  .uppy-Dashboard {
    font-family: inherit !important;
  }
  .uppy-Dashboard * {
    box-sizing: border-box !important;
  }
  .uppy-Dashboard-input {
    display: none !important;
  }
  .uppy-Dashboard-dropFilesHereHint {
    font-size: 16px !important;
    color: #666 !important;
  }
`;

// Inject custom styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = uppyCustomStyles;
  document.head.appendChild(styleElement);
}

interface UppyFileUploaderProps {
  onFileAdded?: (file: any) => void;
  onUploadProgress?: (file: any, progress: number) => void;
  onUploadSuccess?: (file: any, response: any) => void;
  onUploadError?: (file: any, error: Error) => void;
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
  const dashboardRef = useRef<HTMLDivElement>(null);
  const uppyRef = useRef<Uppy | null>(null);
  
  const {
    maxFileSize = FILE_UPLOAD.MAX_FILE_SIZE,
    maxNumberOfFiles = FILE_UPLOAD.MAX_FILES,
    allowedFileTypes = [...FILE_UPLOAD.ALLOWED_TYPES]
  } = restrictions;

  useEffect(() => {
    if (!dashboardRef.current) return;

    console.log('Initializing Uppy...');
    
    // Create Uppy instance
    const uppy = new Uppy({
      debug: true,
      autoProceed: false,
      restrictions: {
        maxFileSize,
        maxNumberOfFiles,
        allowedFileTypes: allowedFileTypes.length > 0 ? allowedFileTypes : undefined,
      },
    });

    uppyRef.current = uppy;

    // Add XHR Upload plugin
    uppy.use(XHRUpload, {
      endpoint: `${API_CONFIG.BASE_URL}${endpoint}`,
      formData: true,
      fieldName: 'file',
      headers: {
        ...headers,
        ...(apiService.getToken() ? { 'Authorization': `Bearer ${apiService.getToken()}` } : {}),
      },
    });
    console.log('XHRUpload plugin added');

    // Add Dashboard plugin
    uppy.use(Dashboard, {
      target: dashboardRef.current,
      inline: true,
      height: 400,
      showProgressDetails: true,
      hideUploadButton: false,
      hideCancelButton: false,
      hideRetryButton: false,
      hidePauseResumeButton: false,
      proudlyDisplayPoweredByUppy: false,
      note: 'Drop files here or click to browse',
      metaFields: [],
      theme: 'light',
    });
    console.log('Dashboard plugin added and mounted');

    // Event listeners
    uppy.on('file-added', (file) => {
      console.log('File added:', file);
      onFileAdded?.(file);
    });

    uppy.on('upload-progress', (file, progress) => {
      if (file && progress) {
        console.log('Upload progress:', file.name, progress);
        onUploadProgress?.(file, progress.percentage || 0);
      }
    });

    uppy.on('upload-success', (file, response) => {
      if (file && response) {
        console.log('Upload success:', file.name, response);
        onUploadSuccess?.(file, response);
      }
    });

    uppy.on('upload-error', (file, error) => {
      if (file && error) {
        console.error('Upload error:', file.name, error);
        onUploadError?.(file, error);
      }
    });

    uppy.on('complete', (result) => {
      console.log('Upload complete:', result);
    });

    // Check if dashboard was properly mounted
    setTimeout(() => {
      const dashboardElement = dashboardRef.current?.querySelector('.uppy-Dashboard');
      console.log('Dashboard mounted check:', {
        dashboardExists: !!dashboardElement,
        containerHasChildren: dashboardRef.current?.children.length,
        uppyState: uppy.getState(),
      });
    }, 100);

    // Cleanup
    return () => {
      console.log('Cleaning up Uppy instance');
      uppy.destroy();
      uppyRef.current = null;
    };
  }, []); // Empty dependency array - only run once

  // Update headers when they change
  useEffect(() => {
    if (uppyRef.current) {
      const xhrPlugin = uppyRef.current.getPlugin('XHRUpload');
      if (xhrPlugin) {
        xhrPlugin.setOptions({
          headers: {
            ...headers,
            ...(apiService.getToken() ? { 'Authorization': `Bearer ${apiService.getToken()}` } : {}),
          },
        });
      }
    }
  }, [headers]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Dashboard container */}
      <div 
        ref={dashboardRef} 
        className="min-h-[400px] w-full border-2 border-dashed border-gray-300 rounded-lg bg-white"
        style={{ minHeight: '400px' }}
      />
      
      {/* Information panel */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Upload Guidelines:</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Maximum file size: {Math.round(maxFileSize / (1024 * 1024) / 1000 )} GB</li>
          <li>• Maximum {maxNumberOfFiles} files per upload</li>
          <li>• Allowed types: {allowedFileTypes.join(', ')}</li>
          <li>• Files are uploaded to secure storage</li>
          <li>• Click "Upload" button after selecting files to start upload</li>
        </ul>
      </div>
    </div>
  );
}
